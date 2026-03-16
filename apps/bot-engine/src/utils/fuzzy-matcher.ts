// apps/bot-engine/src/utils/fuzzy-matcher.ts

/**
 * Levenshtein distance between two strings.
 * Used for token name duplicate detection.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Similarity ratio: 0 (totally different) → 1 (identical)
 */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Trigram set for a string. Used for longer token names.
 */
export function trigrams(s: string): Set<string> {
  const result = new Set<string>();
  const padded = `  ${s}  `;
  for (let i = 0; i < padded.length - 2; i++) {
    result.add(padded.slice(i, i + 3));
  }
  return result;
}

/**
 * Trigram similarity: Jaccard index of trigram sets.
 */
export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a.toLowerCase());
  const tb = trigrams(b.toLowerCase());
  const intersection = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * isDuplicate: returns true if name is suspiciously similar to any existing name.
 * Uses trigram for longer strings, levenshtein for shorter.
 */
export function isDuplicate(
  name: string,
  existingNames: string[],
  threshold = 0.8
): { isDup: boolean; matchedName: string | null; score: number } {
  const normalized = name.toLowerCase().trim();

  for (const existing of existingNames) {
    const norm = existing.toLowerCase().trim();
    const score =
      norm.length <= 6
        ? similarity(normalized, norm)
        : trigramSimilarity(normalized, norm);

    if (score >= threshold) {
      return { isDup: true, matchedName: existing, score };
    }
  }
  return { isDup: false, matchedName: null, score: 0 };
}

/**
 * Hamming distance for perceptual hashes (pHash/dHash).
 * Hashes should be hex strings of equal length.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor =
      (parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16)) >>> 0;
    dist += xor.toString(2).split('').filter((b) => b === '1').length;
  }
  return dist;
}
