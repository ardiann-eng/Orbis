import { db } from '../utils/turso-client';

async function main() {
  const result = await db.execute('SELECT * FROM decisions_log ORDER BY executed_at DESC LIMIT 5');
  console.log('Last 5 decisions:');
  console.log(result.rows);
  
  const tokens = await db.execute('SELECT ca, name, market_cap_usd, holder_count FROM tokens_history ORDER BY created_at DESC LIMIT 5');
  console.log('Last 5 tokens seen:');
  console.log(tokens.rows);
}

main().catch(console.error);
