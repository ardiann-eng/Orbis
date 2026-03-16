// apps/bot-engine/src/execution/trader.ts
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';
import * as crypto from 'crypto';
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
  { commitment: 'confirmed' }
);

export class Trader {
  private keypair: Keypair | null = null; // held only during tx signing

  constructor(private readonly userId: string) {}

  // ── Balance ────────────────────────────────────────────────
  async getBalance(): Promise<number> {
    const wallet = await this.getTradingWallet();
    if (!wallet) return 0;
    const lamports = await connection.getBalance(new PublicKey(wallet));
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * Buy token using Jupiter Aggregator v6.
   * Returns tx hash or null on failure.
   * IDEMPOTENCY: caller must check decisions_log for existing tx.
   */
  async buy(tokenCa: string, amountSol: number): Promise<string | null> {
    try {
      const keypair = await this.loadKeypairInMemory();
      if (!keypair) return null;

      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      // ── Jupiter quote ──────────────────────────────────────
      const quoteUrl = `https://quote-api.jup.ag/v6/quote?` +
        `inputMint=${WSOL_MINT}` +
        `&outputMint=${tokenCa}` +
        `&amount=${amountLamports}` +
        `&slippageBps=300`; // 3% slippage

      const quoteRes = await fetch(quoteUrl);
      if (!quoteRes.ok) {
        logger.error({ status: quoteRes.status }, 'Jupiter quote failed');
        return null;
      }
      const quote = await quoteRes.json();

      // ── Jupiter swap tx ────────────────────────────────────
      const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: keypair.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });
      if (!swapRes.ok) {
        logger.error({ status: swapRes.status }, 'Jupiter swap failed');
        return null;
      }
      const { swapTransaction } = await swapRes.json() as any;

      // ── Deserialize + sign + send ──────────────────────────
      const txBuf = Buffer.from(swapTransaction, 'base64');
      let txHash: string;

      try {
        const vTx = VersionedTransaction.deserialize(txBuf);
        vTx.sign([keypair]);
        txHash = await connection.sendRawTransaction(vTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
      } catch {
        // Fallback: legacy transaction
        const tx = Transaction.from(txBuf);
        tx.partialSign(keypair);
        txHash = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
      } finally {
        // !! CRITICAL — wipe keypair from memory immediately
        this.keypair = null;
      }

      await connection.confirmTransaction(txHash, 'confirmed');
      logger.info({ tokenCa, amountSol, txHash }, 'BUY confirmed');
      return txHash;
    } catch (err) {
      this.keypair = null; // Always clear
      logger.error({ err, tokenCa }, 'BUY failed');
      return null;
    }
  }

  /**
   * Sell token using Jupiter Aggregator v6.
   */
  async sell(tokenCa: string, tokenAmount: number): Promise<string | null> {
    try {
      const keypair = await this.loadKeypairInMemory();
      if (!keypair) return null;

      const quoteUrl = `https://quote-api.jup.ag/v6/quote?` +
        `inputMint=${tokenCa}` +
        `&outputMint=${WSOL_MINT}` +
        `&amount=${Math.floor(tokenAmount)}` +
        `&slippageBps=500`; // 5% slippage for sell

      const quoteRes = await fetch(quoteUrl);
      if (!quoteRes.ok) return null;
      const quote = await quoteRes.json();

      const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: keypair.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });
      if (!swapRes.ok) return null;
      const { swapTransaction } = await swapRes.json() as any;

      const txBuf = Buffer.from(swapTransaction, 'base64');
      let txHash: string;
      try {
        const vTx = VersionedTransaction.deserialize(txBuf);
        vTx.sign([keypair]);
        txHash = await connection.sendRawTransaction(vTx.serialize(), { maxRetries: 3 });
      } finally {
        this.keypair = null;
      }

      await connection.confirmTransaction(txHash, 'confirmed');
      logger.info({ tokenCa, tokenAmount, txHash }, 'SELL confirmed');
      return txHash;
    } catch (err) {
      this.keypair = null;
      logger.error({ err, tokenCa }, 'SELL failed');
      return null;
    }
  }

  // ── Private helpers ────────────────────────────────────────

  private async getTradingWallet(): Promise<string | null> {
    const result = await db.execute(
      `SELECT trading_wallet FROM wallet_records WHERE user_id = ? LIMIT 1`,
      [this.userId]
    );
    if (result.rows.length === 0) return null;
    return (result.rows[0] as any).trading_wallet;
  }

  /**
   * Decrypt keypair into memory for signing.
   * Keypair is wiped from memory in finally blocks.
   * NEVER logged, NEVER returned to caller.
   */
  private async loadKeypairInMemory(): Promise<Keypair | null> {
    try {
      const result = await db.execute(
        `SELECT encrypted_keypair, encryption_iv FROM wallet_records WHERE user_id = ? LIMIT 1`,
        [this.userId]
      );
      if (result.rows.length === 0) {
        logger.error({ userId: this.userId }, 'No wallet record found');
        return null;
      }

      const { encrypted_keypair, encryption_iv } = result.rows[0] as any;

      const salt = process.env.ENCRYPTION_KEY_SALT;
      if (!salt) throw new Error('ENCRYPTION_KEY_SALT not set');

      // Derive key from salt (server-side component of encryption)
      const key = crypto.scryptSync(salt, 'orbis-salt', 32);
      const iv = Buffer.from(encryption_iv, 'hex');

      const [encryptedData, authTagHex] = encrypted_keypair.split(':');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'hex')),
        decipher.final(),
      ]);

      const secretKey = new Uint8Array(JSON.parse(decrypted.toString('utf-8')));
      const keypair = Keypair.fromSecretKey(secretKey);

      // Zero-fill the buffer immediately after use
      decrypted.fill(0);

      return keypair;
    } catch (err) {
      logger.error({ err, userId: this.userId }, 'Keypair decrypt failed — never logging key');
      return null;
    }
  }
}
