import { isRating, type PromptDraft } from './validation';
import type { Prompt } from './types';

export function createPromptFromDraft(draft: PromptDraft, id: string, timestamp: string): Prompt {
  if (!isRating(draft.rating)) {
    throw new Error('Cannot create a prompt with an invalid rating.');
  }

  return {
    id,
    title: draft.title.trim(),
    body: draft.body.trim(),
    tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))],
    model: draft.model.trim(),
    context: draft.context.trim(),
    rating: draft.rating,
    favorite: false,
    copyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
