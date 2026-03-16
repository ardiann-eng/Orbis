// apps/web/app/lib/wallet-generator.ts
import { Keypair } from '@solana/web3.js';
import { encryptAES256 } from './crypto';
import { getDb } from '../api/lib/turso';

export async function generateTradingWallet(userId: string): Promise<{
  publicKey: string;
  exportablePrivateKey: number[];
}> {
  // #region agent log
  fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '728d6f',
    },
    body: JSON.stringify({
      sessionId: '728d6f',
      runId: 'pre-fix-1',
      hypothesisId: 'H4',
      location: 'apps/web/app/lib/wallet-generator.ts:generateTradingWallet:entry',
      message: 'generateTradingWallet called',
      data: { userId },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // Generate real Solana keypair
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();

  // One-time exportable private key for user backup (not stored in DB)
  const exportablePrivateKey = Array.from(keypair.secretKey);

  // withdraw/route expects JSON.parse(decrypted) to be an array of numbers -> Uint8Array
  const privateKeyString = JSON.stringify(exportablePrivateKey);

  const salt = process.env.ENCRYPTION_KEY_SALT;
  if (!salt) {
    // #region agent log
    fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '728d6f',
      },
      body: JSON.stringify({
        sessionId: '728d6f',
        runId: 'pre-fix-1',
        hypothesisId: 'H5',
        location: 'apps/web/app/lib/wallet-generator.ts:generateTradingWallet:missing-salt',
        message: 'Missing ENCRYPTION_KEY_SALT',
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    throw new Error('Missing ENCRYPTION_KEY_SALT');
  }

  const { encryptedData, authTagHex, ivHex } = await encryptAES256(privateKeyString, salt);

  // withdraw/route splits by `:`
  const encryptedKeypair = `${encryptedData}:${authTagHex}`;

  const db = getDb();

  const exists = await db.execute('SELECT 1 FROM wallet_records WHERE user_id = ?', [userId]);

  // #region agent log
  fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '728d6f',
    },
    body: JSON.stringify({
      sessionId: '728d6f',
      runId: 'pre-fix-1',
      hypothesisId: 'H6',
      location: 'apps/web/app/lib/wallet-generator.ts:generateTradingWallet:after-exists-query',
      message: 'generateTradingWallet after exists query',
      data: { userId, existsRows: exists.rows.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (exists.rows.length > 0) {
    await db.execute(
      `
      UPDATE wallet_records SET 
        trading_wallet = ?, 
        main_wallet = ?,
        encrypted_keypair = ?, 
        encryption_iv = ?,
        last_active = ?
      WHERE user_id = ?
    `,
      [publicKey, publicKey, encryptedKeypair, ivHex, Date.now(), userId],
    );
  } else {
    await db.execute(
      `
      INSERT INTO wallet_records 
        (user_id, trading_wallet, main_wallet, encrypted_keypair, encryption_iv, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, publicKey, publicKey, encryptedKeypair, ivHex, Date.now(), Date.now()],
    );
  }

  // #region agent log
  fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '728d6f',
    },
    body: JSON.stringify({
      sessionId: '728d6f',
      runId: 'pre-fix-1',
      hypothesisId: 'H7',
      location: 'apps/web/app/lib/wallet-generator.ts:generateTradingWallet:exit',
      message: 'generateTradingWallet finished',
      data: { userId, publicKey },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return { publicKey, exportablePrivateKey };
}
