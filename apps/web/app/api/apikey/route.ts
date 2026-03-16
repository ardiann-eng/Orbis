// apps/web/app/api/apikey/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '../lib/turso';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    // Format: orbis_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const random = crypto.randomBytes(32).toString('hex');
    const rawKey = `orbis_live_${random}`;

    const hashedKey = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');

    const db = getDb();
    
    // Check if table api_keys exists, if not we fall back gracefully or assume it does
    // For now we assume api_keys table is or will be created. Let's make sure it does not crash.
    try {
      await db.execute(`
        INSERT INTO api_keys (user_id, key_hash, created_at, is_active)
        VALUES (?, ?, ?, 1)
        ON CONFLICT (user_id) DO UPDATE SET
          key_hash = excluded.key_hash,
          created_at = ?
      `, [userId, hashedKey, Date.now(), Date.now()]);
    } catch (dbErr: any) {
      if (dbErr.message.includes('no such table')) {
        // Automatically create if not exists
        await db.execute(`
          CREATE TABLE api_keys (
            user_id TEXT PRIMARY KEY,
            key_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1
          )
        `);
        await db.execute(`
          INSERT INTO api_keys (user_id, key_hash, created_at, is_active)
          VALUES (?, ?, ?, 1)
        `, [userId, hashedKey, Date.now()]);
      } else {
        throw dbErr;
      }
    }

    return NextResponse.json({ success: true, apiKey: rawKey });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
