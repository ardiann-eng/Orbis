// apps/web/app/api/lib/turso.ts
// Shared Turso client for Next.js API routes (not the bot-engine singleton)
import { createClient } from '@libsql/client';

let _client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (_client) return _client;
  _client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  return _client;
}

export function apiError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}
