import type { Prompt } from './types';
import { sortPromptsByPriority } from './scoring';

export interface SearchFilters {
  query?: string;
  tags?: string[];
  minRating?: number;
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

  return sortPromptsByPriority(
    prompts.filter(
      (prompt) =>
        matchesQuery(prompt, query) &&
        matchesTags(prompt, tags) &&
        (filters.minRating === undefined || prompt.rating >= filters.minRating),
    ),
  );
}
