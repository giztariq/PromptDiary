import type { Prompt } from './types';

export const USAGE_HISTORY_LIMIT = 10;

export function recordUsage(prompt: Prompt, timestamp: string): Prompt {
  const usageLog = [...(prompt.usageLog ?? []), timestamp].slice(-USAGE_HISTORY_LIMIT);

  return {
    ...prompt,
    copyCount: prompt.copyCount + 1,
    lastUsedAt: timestamp,
    usageLog,
    updatedAt: timestamp,
  };
}

export function toggleFavorite(prompt: Prompt, updatedAt: string): Prompt {
  return { ...prompt, favorite: !prompt.favorite, updatedAt };
}
