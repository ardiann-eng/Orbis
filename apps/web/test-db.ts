import { createClient } from '@libsql/client';
import 'dotenv/config';

async function test() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    const res = await client.execute('SELECT 1');
    console.log('Query success:', res.rows);
    
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.rows.map(r => r.name));
  } catch (err) {
    console.error('Query failed:', err);
  }
}

test();
