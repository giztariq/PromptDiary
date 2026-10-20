import type { Prompt } from '../domain/types';

export interface StorageAdapter {
  list(): Promise<Prompt[]>;
  get(id: string): Promise<Prompt | undefined>;
  save(prompt: Prompt): Promise<void>;
  remove(id: string): Promise<void>;
  getValue(key: string): Promise<Record<string, string> | undefined>;
  setValue(key: string, values: Record<string, string>): Promise<void>;
  removeValue(key: string): Promise<void>;
  clear(): Promise<void>;
}

export function variableValuesKey(promptId: string): string {
  return `values:${promptId}`;
}
