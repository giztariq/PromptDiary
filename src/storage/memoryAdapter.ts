import type { Prompt } from '../domain/types';
import type { StorageAdapter } from './storageAdapter';

function clonePrompt(prompt: Prompt): Prompt {
  return { ...prompt, tags: [...prompt.tags] };
}

export function createMemoryAdapter(initialPrompts: Prompt[] = []): StorageAdapter {
  const prompts = new Map(initialPrompts.map((prompt) => [prompt.id, clonePrompt(prompt)]));

  return {
    async list() {
      return [...prompts.values()].map(clonePrompt);
    },
    async get(id) {
      const prompt = prompts.get(id);
      return prompt ? clonePrompt(prompt) : undefined;
    },
    async save(prompt) {
      prompts.set(prompt.id, clonePrompt(prompt));
    },
    async remove(id) {
      prompts.delete(id);
    },
    async clear() {
      prompts.clear();
    },
  };
}
