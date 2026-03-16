// one-off seed: ensures bot_config row exists for 'default' user
import 'dotenv/config';
import { getDb } from './turso-client';

async function seed() {
  const db = getDb();
  await db.execute(`
    INSERT OR IGNORE INTO bot_config (user_id) VALUES ('default')
  `);
  console.log('✓ bot_config seeded for user=default');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
