import type { Prompt } from './types';

export interface TagCount {
  tag: string;
  count: number;
}

export function rankTags(prompts: Prompt[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const prompt of prompts) {
    for (const tag of prompt.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.tag.localeCompare(right.tag, 'fr', { sensitivity: 'base' }),
    );
}
