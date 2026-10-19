import type { Prompt } from './types';

export function incrementCopyCount(prompt: Prompt, updatedAt: string): Prompt {
  return { ...prompt, copyCount: prompt.copyCount + 1, updatedAt };
}

export function toggleFavorite(prompt: Prompt, updatedAt: string): Prompt {
  return { ...prompt, favorite: !prompt.favorite, updatedAt };
}
