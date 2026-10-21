import type { Prompt } from './types';

export type CollectionFilter =
  { kind: 'all' } | { kind: 'favorites' } | { kind: 'none' } | { kind: 'collection'; name: string };

export interface CollectionCount {
  name: string;
  count: number;
}

export function listCollections(prompts: Prompt[]): CollectionCount[] {
  const counts = new Map<string, number>();

  for (const prompt of prompts) {
    const name = prompt.collection?.trim();

    if (!name) {
      continue;
    }

    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }));
}

export function renameCollection(prompts: Prompt[], from: string, to: string): Prompt[] {
  const source = from.trim();
  const target = to.trim();

  if (!source || !target || source === target) {
    return [...prompts];
  }

  return prompts.map((prompt) =>
    prompt.collection === source ? { ...prompt, collection: target } : prompt,
  );
}

export function removeCollection(prompts: Prompt[], name: string): Prompt[] {
  const target = name.trim();

  if (!target) {
    return [...prompts];
  }

  return prompts.map((prompt) => {
    if (prompt.collection !== target) {
      return prompt;
    }

    const detached: Prompt = { ...prompt };
    delete detached.collection;
    return detached;
  });
}

export function countWithoutCollection(prompts: Prompt[]): number {
  return prompts.filter((prompt) => !prompt.collection?.trim()).length;
}

export function countFavorites(prompts: Prompt[]): number {
  return prompts.filter((prompt) => prompt.favorite).length;
}
