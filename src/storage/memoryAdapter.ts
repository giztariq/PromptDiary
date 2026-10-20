import type { Prompt } from '../domain/types';
import { variableValuesKey, type StorageAdapter } from './storageAdapter';

function clonePrompt(prompt: Prompt): Prompt {
  return { ...prompt, tags: [...prompt.tags] };
}

function cloneValues(values: Record<string, string>): Record<string, string> {
  return { ...values };
}

export function createMemoryAdapter(initialPrompts: Prompt[] = []): StorageAdapter {
  const prompts = new Map(initialPrompts.map((prompt) => [prompt.id, clonePrompt(prompt)]));
  const values = new Map<string, Record<string, string>>();

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
      values.delete(variableValuesKey(id));
    },
    async getValue(key) {
      const storedValues = values.get(key);
      return storedValues ? cloneValues(storedValues) : undefined;
    },
    async setValue(key, storedValues) {
      values.set(key, cloneValues(storedValues));
    },
    async removeValue(key) {
      values.delete(key);
    },
    async clear() {
      prompts.clear();
      values.clear();
    },
  };
}
