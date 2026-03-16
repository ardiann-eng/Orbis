import { logger } from '../utils/logger';
import { redis } from '../utils/redis-client';
import { HeliusClient } from './helius-listener';

type QueuedRequest<T> = {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T | null) => void;
  retries: number;
};

class HeliusRateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;

  // Max throughput: 8 req/sec (125ms interval) to stay safely under 10 req/s limit
  private PROCESS_INTERVAL_MS = 125; 
  private MAX_RETRIES = 3;

  /**
   * Enqueue a Helius API request
   * @param id Unique ID to deduplicate identical pending requests (e.g. "snapshot-CA")
   * @param execute The actual fetch promise returning T
   */
  enqueue<T>(id: string, execute: () => Promise<T>): Promise<T | null> {
    return new Promise((resolve) => {
      // Deduplicate if identical request is already in queue
      if (this.queue.some(q => q.id === id)) {
        logger.debug({ id }, 'Deduplicated Helius request');
        return resolve(null);
      }

      this.queue.push({ id, execute, resolve, retries: 0 });

      // Track queue length
      if (this.queue.length % 10 === 0) {
        logger.info({ queueLength: this.queue.length }, 'Helius queue status');
      }

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // --- BATCHING OPTIMIZATION: Pre-warm Snapshot Cache ---
    // If we have 5+ snapshot requests (pump-*), batch fetch them together to save credits.
    // This pre-warms the Redis cache so that when the individual item.execute() runs,
    // fetchTokenSnapshot(ca) will be a 0-credit cache hit.
    const snapshotItems = this.queue.filter(q => q.id.startsWith('pump-')).slice(0, 100);
    
    // We only trigger batching if we haven't already pre-warmed this batch recently
    // (A simple way is to check if the first item in the queue is a pump request)
    if (snapshotItems.length >= 5 && this.queue[0].id.startsWith('pump-')) {
      const cas = snapshotItems.map(q => q.id.replace('pump-', ''));
      logger.info({ count: cas.length }, 'Helius queue backlog detected — triggering batch pre-warm');
      
      try {
        await HeliusClient.fetchTokenSnapshotsBatch(cas);
        await this.trackCredits(5);
      } catch (err) {
        logger.debug({ err }, 'Batch pre-warm failed, items will fetch individually');
      }
    }

    // --- INDIVIDUAL RATE-LIMITED PROCESSING ---
    const item = this.queue.shift();
    if (!item) {
        this.processing = false;
        return;
    }

    let nextDelay = this.PROCESS_INTERVAL_MS;

    try {
      const result = await item.execute();
      
      // Track 1 credit for the execution (e.g. holder distribution call)
      await this.trackCredits(1);
      
      item.resolve(result);
    } catch (err: any) {
      const isRateLimit = err.message?.includes('429') || err.status === 429;
      
      if (isRateLimit && item.retries < this.MAX_RETRIES) {
        item.retries++;
        const backoffDelay = item.retries * 1000;
        logger.warn({ id: item.id, retry: item.retries, backoff: backoffDelay }, 'Helius 429 Rate Limit hit. Retrying...');
        
        await new Promise(r => setTimeout(r, backoffDelay));
        this.queue.unshift(item);
        nextDelay = 0;
      } else {
        logger.error({ id: item.id, err: err.message ?? err }, 'Helius request failed permanently');
        item.resolve(null);
      }
    }

    setTimeout(() => this.processQueue(), nextDelay);
  }

  private async trackCredits(amount: number) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `helius:credits:${today}`;
      const used = await redis.incr(key);
      if (used === 1) {
        await redis.expire(key, 86400); // 24 hours
      }

      if (used === 800000) {
        logger.warn('Economy mode active - credit limit approaching 800K');
      }
    } catch (e) {
      // Ignore redis errors for tracking
    }
  }
}

export const heliusQueue = new HeliusRateLimiter();
