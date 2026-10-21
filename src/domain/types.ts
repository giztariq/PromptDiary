export type Rating = 1 | 2 | 3 | 4 | 5;

export interface PromptVersion {
  title: string;
  body: string;
  savedAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  model: string;
  context: string;
  rating: Rating;
  favorite: boolean;
  copyCount: number;
  createdAt: string;
  updatedAt: string;
  collection?: string;
  lastUsedAt?: string;
  usageLog?: string[];
  versions?: PromptVersion[];
}
