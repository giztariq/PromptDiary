import type { Prompt } from './types';
import { sortPrompts, type SortOption } from './sort';

export interface SearchFilters {
  query?: string;
  tags?: string[];
  minRating?: number;
  favoritesOnly?: boolean;
  sort?: SortOption;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

function matchesQuery(prompt: Prompt, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchableText = normalize(
    [prompt.title, prompt.body, prompt.model, prompt.context, ...prompt.tags].join(' '),
  );
  return searchableText.includes(query);
}

function matchesTags(prompt: Prompt, tags: string[]): boolean {
  const promptTags = prompt.tags.map(normalize);
  return tags.every((tag) => promptTags.includes(normalize(tag)));
}

export function searchPrompts(prompts: Prompt[], filters: SearchFilters = {}): Prompt[] {
  const query = normalize(filters.query?.trim() ?? '');
  const tags = filters.tags ?? [];

  const matches = prompts.filter(
    (prompt) =>
      matchesQuery(prompt, query) &&
      matchesTags(prompt, tags) &&
      (filters.favoritesOnly !== true || prompt.favorite) &&
      (filters.minRating === undefined || prompt.rating >= filters.minRating),
  );

  return sortPrompts(matches, filters.sort ?? 'priority');
}
