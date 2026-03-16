// apps/bot-engine/src/utils/migrate.ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { getDb } from './turso-client';
import { logger } from './logger';

async function migrate() {
  const db = getDb();
  const migrationsDir = path.join(__dirname, '../../migrations');

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 001 → 002 → ... ensures order

  logger.info({ count: files.length }, 'Running migrations');

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    // Strip SQL comments and split on semicolons
    const statements = sql
      .replace(/--.*$/gm, '')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await db.execute(statement);
      } catch (err) {
        logger.error({ file, statement: statement.slice(0, 80), err }, 'Migration statement failed');
        throw err;
      }
    }

    logger.info({ file }, 'Migration applied');
  }

  logger.info('All migrations complete');
  process.exit(0);
}

migrate().catch((err) => {
  logger.error(err, 'Migration failed');
  process.exit(1);
});
