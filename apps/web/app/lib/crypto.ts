// apps/web/app/lib/crypto.ts
import crypto from 'crypto';

export async function encryptAES256(
  plaintext: string, 
  salt: string
): Promise<{ encryptedData: string; authTagHex: string; ivHex: string }> {
  return new Promise((resolve, reject) => {
    try {
      const iv = crypto.randomBytes(16);
      
      // Match exactly with withdraw/route.ts: crypto.scryptSync(salt, 'orbis-salt', 32)
      const key = crypto.scryptSync(salt, 'orbis-salt', 32);
        
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      resolve({
        encryptedData: encrypted.toString('hex'),
        authTagHex: authTag.toString('hex'),
        ivHex: iv.toString('hex')
      });
    } catch (err) {
      reject(err);
    }
  });
}
