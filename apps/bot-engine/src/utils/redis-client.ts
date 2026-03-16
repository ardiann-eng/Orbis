// Simple in-memory mock for local development
const store = new Map<string, any>();

class MockRedis {
  async get<T>(key: string) { return store.get(key) as T ?? null; }
  async set(key: string, value: any, opts?: any) { store.set(key, value); return 'OK'; }
  async del(...keys: string[]) { keys.forEach(k => store.delete(k)); return keys.length; }
  async incr(key: string) { 
    const val = (store.get(key) || 0) + 1;
    store.set(key, val);
    return val;
  }
  async expire(key: string, seconds: number) { return 1; }
  async exists(...keys: string[]) { return keys.filter(k => store.has(k)).length; }
  async lpush(key: string, ...values: any[]) { return 1; }
  async lrange(key: string, start: number, stop: number) { return []; }
  async hset(key: string, obj: any) { 
    const existing = store.get(key) || {};
    store.set(key, { ...existing, ...obj });
    return 1;
  }
  async hget<T>(key: string, field: string) { 
    const obj = store.get(key) || {};
    return obj[field] as T ?? null; 
  }
}

const mockRedis = new MockRedis();

export function getRedis() { return mockRedis as any; }

export const redis = {
  get:    <T = unknown>(key: string)                    => mockRedis.get<T>(key),
  set:    (key: string, value: unknown, opts?: { ex?: number }) => mockRedis.set(key, value, opts),
  del:    (...keys: string[])                           => mockRedis.del(...keys),
  incr:   (key: string)                                => mockRedis.incr(key),
  expire: (key: string, seconds: number)               => mockRedis.expire(key, seconds),
  exists: (...keys: string[])                          => mockRedis.exists(...keys),
  lpush:  (key: string, ...values: unknown[])          => mockRedis.lpush(key, ...values),
  lrange: (key: string, start: number, stop: number)   => mockRedis.lrange(key, start, stop),
  hset:   (key: string, field: string, value: unknown) => mockRedis.hset(key, { [field]: value }),
  hget:   <T = unknown>(key: string, field: string)    => mockRedis.hget<T>(key, field),
};

// Cache key helpers
export const CacheKeys = {
  tokenScore:    (ca: string)     => `orbis:score:${ca}`,
  tokenSnapshot: (ca: string)     => `orbis:snap:${ca}`,
  botStatus:     (userId: string) => `orbis:bot:${userId}`,
  rateLimit:     (ca: string)     => `orbis:rl:${ca}`,
  dailyLoss:     (userId: string) => `orbis:dloss:${userId}`,
  cascadeCount:  (userId: string) => `orbis:cascade:${userId}`,
} as const;
