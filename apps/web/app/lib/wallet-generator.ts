// apps/web/app/lib/wallet-generator.ts
import { Keypair } from '@solana/web3.js';
import { encryptAES256 } from './crypto';
import { getDb } from '../api/lib/turso';

export async function generateTradingWallet(userId: string): Promise<{
  publicKey: string;
}> {
  // Generate real Solana keypair
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  
  // withdraw/route expects JSON.parse(decrypted) to be an array of numbers -> Uint8Array
  const privateKeyString = JSON.stringify(Array.from(keypair.secretKey));
  
  const salt = process.env.ENCRYPTION_KEY_SALT;
  if (!salt) throw new Error('Missing ENCRYPTION_KEY_SALT');
  
  const { encryptedData, authTagHex, ivHex } = await encryptAES256(privateKeyString, salt);
  
  // withdraw/route splits by `:`
  const encryptedKeypair = `${encryptedData}:${authTagHex}`;
  
  const db = getDb();
  
  const exists = await db.execute('SELECT 1 FROM wallet_records WHERE user_id = ?', [userId]);
  
  if (exists.rows.length > 0) {
    await db.execute(`
      UPDATE wallet_records SET 
        trading_wallet = ?, 
        main_wallet = ?,
        encrypted_keypair = ?, 
        encryption_iv = ?,
        updated_at = ?
      WHERE user_id = ?
    `, [publicKey, publicKey, encryptedKeypair, ivHex, Date.now(), userId]);
  } else {
    await db.execute(`
      INSERT INTO wallet_records 
        (user_id, trading_wallet, main_wallet, encrypted_keypair, encryption_iv, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, publicKey, publicKey, encryptedKeypair, ivHex, Date.now(), Date.now()]);
  }
  
  return { publicKey };
}
