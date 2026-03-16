// apps/web/app/api/wallet/withdraw/route.ts
import { z } from 'zod';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import * as crypto from 'crypto';
import { getDb, apiOk, apiError } from '../../lib/turso';

const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
  { commitment: 'confirmed' }
);

const WithdrawSchema = z.object({
  userId:      z.string().min(1),
  toAddress:   z.string().min(32).max(44),
  amountSol:   z.number().positive().max(100), // hard max 100 SOL per tx
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = WithdrawSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message);

    const { userId, toAddress, amountSol } = parsed.data;
    const db = getDb();

    // Block withdraw if open positions exist
    const openResult = await db.execute(
      `SELECT COUNT(*) as cnt FROM portfolio_state
       WHERE user_id = ? AND status = 'open'`,
      [userId]
    );
    const openCount = Number((openResult.rows[0] as unknown as { cnt: number }).cnt);
    if (openCount > 0) {
      return apiError(`Tidak bisa withdraw — ada ${openCount} posisi aktif`, 400);
    }

    // Load encrypted keypair
    const walletResult = await db.execute(
      `SELECT encrypted_keypair, encryption_iv, trading_wallet
       FROM wallet_records WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (walletResult.rows.length === 0) return apiError('Wallet not found', 404);

    const { encrypted_keypair, encryption_iv } = walletResult.rows[0] as unknown as {
      encrypted_keypair: string;
      encryption_iv: string;
      trading_wallet: string;
    };

    // !! Decrypt in memory — never log, never return key
    const salt = process.env.ENCRYPTION_KEY_SALT;
    if (!salt) return apiError('Server configuration error', 500);

    let keypair: Keypair | undefined;
    let decrypted: Buffer | null = null;
    try {
      const key = crypto.scryptSync(salt, 'orbis-salt', 32);
      const iv = Buffer.from(encryption_iv, 'hex');
      const [encData, authTagHex] = encrypted_keypair.split(':');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      decrypted = Buffer.concat([
        decipher.update(Buffer.from(encData, 'hex')),
        decipher.final(),
      ]);
      keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(decrypted!.toString())));
    } finally {
      decrypted?.fill(0); // zero-fill immediately
    }

    if (!keypair) return apiError('Failed to decrypt keypair', 500);

    // Build + sign + send SOL transfer
    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
    const { blockhash } = await connection.getLatestBlockhash();

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey:   new PublicKey(toAddress),
        lamports,
      })
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair);

    const txHash = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(txHash, 'confirmed');

    return apiOk({ txHash, amountSol, toAddress });
  } catch (err) {
    console.error(err);
    return apiError('Withdraw failed', 500);
  }
}
