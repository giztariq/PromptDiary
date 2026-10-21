import { sortPromptsByPriority } from './scoring';
import type { Prompt } from './types';

export type SortOption = 'priority' | 'recent' | 'usage' | 'rating' | 'title';

export interface SortOptionDefinition {
  value: SortOption;
  label: string;
}

export const SORT_OPTIONS: readonly SortOptionDefinition[] = [
  { value: 'priority', label: 'Priorité' },
  { value: 'recent', label: 'Nouveautés' },
  { value: 'usage', label: 'Les plus utilisés' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'title', label: 'Titre A → Z' },
];

function timestamp(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function byRecency(left: Prompt, right: Prompt): number {
  return (
    timestamp(right.updatedAt) - timestamp(left.updatedAt) ||
    timestamp(right.createdAt) - timestamp(left.createdAt)
  );
}

function byUsage(left: Prompt, right: Prompt): number {
  return (
    right.copyCount - left.copyCount || timestamp(right.lastUsedAt) - timestamp(left.lastUsedAt)
  );
}

function byRating(left: Prompt, right: Prompt): number {
  return right.rating - left.rating || right.copyCount - left.copyCount;
}

function byTitle(left: Prompt, right: Prompt): number {
  return left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' });
}

export function sortPrompts(prompts: Prompt[], option: SortOption): Prompt[] {
  switch (option) {
    case 'recent':
      return [...prompts].sort(byRecency);
    case 'usage':
      return [...prompts].sort(byUsage);
    case 'rating':
      return [...prompts].sort(byRating);
    case 'title':
      return [...prompts].sort(byTitle);
    case 'priority':
    default:
      return sortPromptsByPriority(prompts);
  }
}
