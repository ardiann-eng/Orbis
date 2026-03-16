// apps/bot-engine/src/ingestion/telegram-monitor.ts
import { db } from '../utils/turso-client';
import { logger } from '../utils/logger';

// Solana CA regex: base58, 32–44 chars (excludes common words)
const CA_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

interface TelegramMessage {
  channelId: string;
  messageId: string;
  text: string;
  timestamp: number;
}

/**
 * TelegramMonitor: polls active channels for CA mentions.
 *
 * NOTE: Full MTProto support requires gramio or node-telegram-bot-api
 * with user session. This implementation provides the core logic and
 * ingest interface. Wire up to your preferred Telegram client by calling
 * processMessage() on each incoming message event.
 */
export class TelegramMonitor {
  private running = false;

  start(): void {
    this.running = true;
    logger.info('TelegramMonitor started — waiting for messages');
  }

  stop(): void {
    this.running = false;
    logger.info('TelegramMonitor stopped');
  }

  /**
   * Call this from your Telegram client event handler.
   * Parses the message text for Solana CA addresses and records them.
   */
  async processMessage(msg: TelegramMessage): Promise<void> {
    if (!this.running) return;

    const matches = msg.text.match(CA_REGEX) ?? [];
    if (matches.length === 0) return;

    // Deduplicate CAs in same message
    const cas = [...new Set(matches)];
    logger.debug({ channelId: msg.channelId, cas }, 'CA mentions found');

    const now = msg.timestamp ?? Date.now();

    // Batch insert all mentions
    const statements = cas.map((ca) => ({
      sql: `INSERT INTO ca_mentions_log (ca, channel_id, message_id, mentioned_at, context)
            VALUES (?, ?, ?, ?, ?)`,
      args: [ca, msg.channelId, msg.messageId, now, msg.text.slice(0, 500)],
    }));

    try {
      await db.batch(statements, 'write');
    } catch (err) {
      logger.error({ err, channelId: msg.channelId }, 'Failed to insert CA mentions');
    }
  }

  /**
   * Get currently active channels from DB.
   */
  async getActiveChannels(): Promise<Array<{ channelId: string; channelName: string | null; weight: number }>> {
    const result = await db.execute(
      `SELECT channel_id, channel_name, weight
       FROM telegram_channels
       WHERE is_active = 1
       ORDER BY weight DESC`
    );
    return (result.rows as any[])
      .map((r) => ({ channelId: r.channel_id, channelName: r.channel_name, weight: r.weight }));
  }

  /**
   * Add a new channel to monitoring.
   */
  async addChannel(channelId: string, channelName: string, weight = 1.0): Promise<void> {
    await db.execute(
      `INSERT INTO telegram_channels (channel_id, channel_name, is_active, weight, added_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT(channel_id) DO UPDATE SET
         channel_name = excluded.channel_name,
         weight = excluded.weight,
         is_active = 1`,
      [channelId, channelName, weight, Date.now()]
    );
    logger.info({ channelId, channelName, weight }, 'Channel added');
  }
}
