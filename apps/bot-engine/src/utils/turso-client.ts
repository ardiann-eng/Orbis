// apps/bot-engine/src/utils/turso-client.ts
import { createClient, type Client } from '@libsql/client';
import { logger } from './logger';

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  if (!url.startsWith('file:') && !authToken) {
    throw new Error('TURSO_AUTH_TOKEN is not set');
  }

  _client = createClient({ url, authToken });
  logger.info({ url }, 'Turso client initialized');
  return _client;
}

// Convenience alias
export const db = {
  execute: (sqlOrStmt: any, args?: any[]) => {
    if (typeof sqlOrStmt === 'string') {
      return getDb().execute({ sql: sqlOrStmt, args: args ?? [] });
    }
    return getDb().execute(sqlOrStmt);
  },
  batch:   (...args: Parameters<Client['batch']>)   => getDb().batch(...args),
  transaction: (...args: Parameters<Client['transaction']>) => getDb().transaction(...args),
};
