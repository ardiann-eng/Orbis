import 'dotenv/config';
import { backfillNullTokens } from '../src/ingestion/dexscreener-enricher';
import { logger } from '../src/utils/logger';

async function main() {
  logger.info('Starting manual backfill script...');
  await backfillNullTokens(100);
  logger.info('Backfill script complete. Exiting.');
  process.exit(0);
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});
