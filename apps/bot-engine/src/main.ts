// apps/bot-engine/src/main.ts
import 'dotenv/config';
import { BotEngine } from './engine';
import { PumpPortalListener } from './ingestion/pump-portal';
import { TelegramMonitor } from './ingestion/telegram-monitor';
import { backfillNullTokens } from './ingestion/dexscreener-enricher';
import { monitorDemoPositions } from './demo/demo-engine';
import { logger } from './utils/logger';

const USER_ID = process.env.BOT_USER_ID ?? 'default';

async function main() {
  logger.info('ORBIS Bot Engine starting...');

  // Configure SQLite local pragmas to avoid SQLITE_BUSY during high-freq WebSocket dumps
  if (process.env.TURSO_DATABASE_URL?.startsWith('file:')) {
    const { getDb } = await import('./utils/turso-client');
    const dbClient = getDb();
    await dbClient.execute('PRAGMA journal_mode = WAL;');
    await dbClient.execute('PRAGMA synchronous = NORMAL;');
    await dbClient.execute('PRAGMA busy_timeout = 5000;');
    logger.info('SQLite running in WAL mode with 5000ms busy_timeout');
  }

  const engine = new BotEngine(USER_ID);
  const pumpPortal = new PumpPortalListener(engine);
  const telegram = new TelegramMonitor();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    pumpPortal.stop();
    telegram.stop();
    await engine.stop('manual');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    pumpPortal.stop();
    telegram.stop();
    await engine.stop('manual');
    process.exit(0);
  });

  await engine.start();
  pumpPortal.start();
  telegram.start();

  // Demo monitor loop (every 30s) — only affects DEMO virtual positions
  setInterval(() => {
    monitorDemoPositions(USER_ID).catch((err) => {
      logger.error({ err }, 'monitorDemoPositions failed');
    });
  }, 30_000);

  // Backfill MCap/Liquidity/Volume for tokens already in DB with NULL market data.
  // Runs non-blocking in background — does NOT delay startup.
  backfillNullTokens(50).catch(() => {});

  logger.info('ORBIS Bot Engine running ✓');
}

main().catch((err) => {
  logger.fatal(err, 'Fatal error — exiting');
  process.exit(1);
});
