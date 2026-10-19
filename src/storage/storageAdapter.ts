import type { Prompt } from '../domain/types';

export interface StorageAdapter {
  list(): Promise<Prompt[]>;
  get(id: string): Promise<Prompt | undefined>;
  save(prompt: Prompt): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
