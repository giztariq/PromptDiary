import type { Rating } from './types';

export interface PromptDraft {
  title: string;
  body: string;
  tags: string[];
  model: string;
  context: string;
  rating: number;
}

export type PromptDraftField = keyof PromptDraft;
export type PromptDraftErrors = Partial<Record<PromptDraftField, string>>;

export interface ValidationResult {
  valid: boolean;
  errors: PromptDraftErrors;
}

export function validatePromptDraft(draft: PromptDraft): ValidationResult {
  const errors: PromptDraftErrors = {};

  if (!draft.title.trim()) {
    errors.title = 'Le titre est obligatoire.';
  }
  if (!draft.body.trim()) {
    errors.body = 'Le corps du prompt est obligatoire.';
  }
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
    errors.rating = 'La note doit être un entier entre 1 et 5.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function isRating(value: number): value is Rating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
