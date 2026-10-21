import type { Prompt } from './types';
import { sortPrompts, type SortOption } from './sort';

export interface SearchFilters {
  query?: string;
  tags?: string[];
  minRating?: number;
  favoritesOnly?: boolean;
  collection?: string;
  withoutCollection?: boolean;
  neverUsed?: boolean;
  unusedForDays?: number;
  fuzzy?: boolean;
  sort?: SortOption;
}

const FUZZY_MIN_LENGTH = 3;
const FUZZY_WINDOW_RATIO = 3;
const DAY_IN_MS = 86_400_000;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

function matchesQuery(prompt: Prompt, query: string, fuzzy = false): boolean {
  if (!query) {
    return true;
  }

  const searchableText = normalize(
    [prompt.title, prompt.body, prompt.model, prompt.context, ...prompt.tags].join(' '),
  );

  if (searchableText.includes(query)) {
    return true;
  }

  return fuzzy ? isCompactFuzzyMatch(query, searchableText) : false;
}

function isCompactFuzzyMatch(query: string, text: string): boolean {
  if (query.length < FUZZY_MIN_LENGTH) {
    return false;
  }

  const positions = fuzzyMatchPositions(query, text);

  if (positions.length === 0) {
    return false;
  }

  const span = positions[positions.length - 1] - positions[0] + 1;
  return span <= query.length * FUZZY_WINDOW_RATIO;
}

function isUnusedSince(prompt: Prompt, days: number, now: Date): boolean {
  if (!prompt.lastUsedAt) {
    return true;
  }

  const lastUsed = Date.parse(prompt.lastUsedAt);

  if (Number.isNaN(lastUsed)) {
    return true;
  }

  return now.getTime() - lastUsed >= days * DAY_IN_MS;
}

function matchesTags(prompt: Prompt, tags: string[]): boolean {
  const promptTags = prompt.tags.map(normalize);
  return tags.every((tag) => promptTags.includes(normalize(tag)));
}

export function searchPrompts(
  prompts: Prompt[],
  filters: SearchFilters = {},
  now: Date = new Date(),
): Prompt[] {
  const query = normalize(filters.query?.trim() ?? '');
  const tags = filters.tags ?? [];

  const matches = prompts.filter(
    (prompt) =>
      matchesQuery(prompt, query, filters.fuzzy === true) &&
      matchesTags(prompt, tags) &&
      (filters.favoritesOnly !== true || prompt.favorite) &&
      (filters.collection === undefined || prompt.collection === filters.collection) &&
      (filters.withoutCollection !== true || !prompt.collection?.trim()) &&
      (filters.neverUsed !== true || prompt.copyCount === 0) &&
      (filters.unusedForDays === undefined || isUnusedSince(prompt, filters.unusedForDays, now)) &&
      (filters.minRating === undefined || prompt.rating >= filters.minRating),
  );

  return sortPrompts(matches, filters.sort ?? 'priority');
}

export function fuzzyMatchPositions(query: string, text: string): number[] {
  const normalizedQuery = normalize(query.trim());
  const normalizedText = normalize(text);

  if (normalizedQuery.length === 0) {
    return [];
  }

  const positions: number[] = [];
  let queryIndex = 0;

  for (let index = 0; index < normalizedText.length; index += 1) {
    if (normalizedText[index] === normalizedQuery[queryIndex]) {
      positions.push(index);
      queryIndex += 1;

      if (queryIndex === normalizedQuery.length) {
        return positions;
      }
    }
  }

  return [];
}

export function fuzzyMatch(query: string, text: string): boolean {
  if (query.trim().length === 0) {
    return true;
  }

  return fuzzyMatchPositions(query, text).length > 0;
}

export function searchableText(prompt: Prompt): string {
  return [prompt.title, prompt.tags.join(' ')].join(' ');
}
