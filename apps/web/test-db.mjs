import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function test() {
  const url = 'file:d:/Orbis/apps/bot-engine/local.db';
  console.log('Testing Local URL:', url);
  
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL is missing!');
    process.exit(1);
  }

  const client = createClient({
    url: url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const res = await client.execute('SELECT 1');
    console.log('Query success:', res.rows);
    
    const config = await client.execute("SELECT * FROM bot_config WHERE user_id = 'default'");
    console.log('Bot config for default:', config.rows);

    if (config.rows.length === 0) {
      console.log('Seeding default bot_config...');
      await client.execute("INSERT INTO bot_config (user_id) VALUES ('default')");
      console.log('Seed success!');
    }
  } catch (err) {
    console.error('Query failed:', err);
  }
}

test();
