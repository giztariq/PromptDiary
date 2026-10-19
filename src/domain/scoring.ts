import type { Prompt } from './types';

export function sortPromptsByPriority(prompts: Prompt[]): Prompt[] {
  return [...prompts].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }
    return right.copyCount - left.copyCount;
  });
}
