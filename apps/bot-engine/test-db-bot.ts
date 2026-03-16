import { getDb } from './src/utils/turso-client';
import 'dotenv/config';

async function test() {
  const db = getDb();
  try {
    const res = await db.execute('SELECT 1');
    console.log('Bot-engine DB success:', res.rows);
  } catch (err) {
    console.error('Bot-engine DB failed:', err);
  }
}
test();
