import type { Prompt } from './types';
import { parseVariables } from './variables';

export interface TagUsage {
  tag: string;
  prompts: number;
  copies: number;
}

export interface PromptUsage {
  prompt: Prompt;
  copies: number;
}

export interface RatingCount {
  rating: number;
  count: number;
}

export interface LibraryStats {
  total: number;
  favorites: number;
  withTags: number;
  withVariables: number;
  totalCopies: number;
  averageRating: number;
  neverUsed: number;
  ratingDistribution: RatingCount[];
  topPrompts: PromptUsage[];
  topTags: TagUsage[];
}

const MAX_RANKED = 5;

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeLibraryStats(prompts: Prompt[]): LibraryStats {
  const ratingDistribution: RatingCount[] = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 }));
  const tagUsage = new Map<string, TagUsage>();
  let totalCopies = 0;
  let ratingSum = 0;

  for (const prompt of prompts) {
    totalCopies += prompt.copyCount;
    ratingSum += prompt.rating;

    const ratingEntry = ratingDistribution.find((entry) => entry.rating === prompt.rating);
    if (ratingEntry) {
      ratingEntry.count += 1;
    }

    for (const tag of prompt.tags) {
      const existing = tagUsage.get(tag);
      if (existing) {
        existing.prompts += 1;
        existing.copies += prompt.copyCount;
      } else {
        tagUsage.set(tag, { tag, prompts: 1, copies: prompt.copyCount });
      }
    }
  }

  const topPrompts: PromptUsage[] = [...prompts]
    .filter((prompt) => prompt.copyCount > 0)
    .sort(
      (left, right) =>
        right.copyCount - left.copyCount || left.title.localeCompare(right.title, 'fr'),
    )
    .slice(0, MAX_RANKED)
    .map((prompt) => ({ prompt, copies: prompt.copyCount }));

  const topTags: TagUsage[] = [...tagUsage.values()]
    .sort(
      (left, right) =>
        right.copies - left.copies ||
        right.prompts - left.prompts ||
        left.tag.localeCompare(right.tag, 'fr', { sensitivity: 'base' }),
    )
    .slice(0, MAX_RANKED);

  return {
    total: prompts.length,
    favorites: prompts.filter((prompt) => prompt.favorite).length,
    withTags: prompts.filter((prompt) => prompt.tags.length > 0).length,
    withVariables: prompts.filter((prompt) => parseVariables(prompt.body).length > 0).length,
    totalCopies,
    averageRating: prompts.length === 0 ? 0 : roundToTenth(ratingSum / prompts.length),
    neverUsed: prompts.filter((prompt) => prompt.copyCount === 0).length,
    ratingDistribution,
    topPrompts,
    topTags,
  };
}
