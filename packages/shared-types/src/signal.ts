// packages/shared-types/src/signal.ts

export type LogicId = 'logic1' | 'logic2' | 'logic3';

export interface Logic1Signal {
  ca: string;
  priceChange5m: number;
  priceChange1h: number;
  volumeChange: number;      // % vs avg24h
  holderGrowthRate: number;
  marketCapUsd: number;
  score: number;             // 0–1
  timestamp: number;
}

export interface Logic2Signal {
  ca: string;
  currentVolume: number;     // last 5 min
  avgVolume24h: number;
  spikeMultiplier: number;   // currentVolume / avgVolume24h
  timeWindow: number;        // seconds
  score: number;
  timestamp: number;
}

export interface Logic3Signal {
  ca: string;
  uniqueChannelCount: number;
  totalMentions: number;
  channels: Array<{
    channelId: string;
    channelName: string | null;
    weight: number;
    mentionCount: number;
  }>;
  timeWindow: number;        // seconds, default 3600
  score: number;
  timestamp: number;
}

export type AnyLogicSignal = Logic1Signal | Logic2Signal | Logic3Signal;
