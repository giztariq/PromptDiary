import { validatePromptDraft, type PromptDraft } from './validation';

const validDraft: PromptDraft = {
  title: 'Analyse un document',
  body: 'Analyse ce document et renvoie les points essentiels.',
  tags: ['analyse'],
  model: 'Claude',
  context: 'Synthèse',
  rating: 5,
  collection: '',
};

describe('validatePromptDraft', () => {
  it('accepts a complete draft with a rating from 1 to 5', () => {
    expect(validatePromptDraft(validDraft)).toEqual({ valid: true, errors: {} });
  });

  it('requires a title and a body', () => {
    const result = validatePromptDraft({ ...validDraft, title: ' ', body: '' });

    expect(result).toEqual({
      valid: false,
      errors: {
        title: 'Le titre est obligatoire.',
        body: 'Le corps du prompt est obligatoire.',
      },
    });
  });

  it.each([1, 5])('accepts the rating boundary: %s', (rating) => {
    expect(validatePromptDraft({ ...validDraft, rating })).toEqual({ valid: true, errors: {} });
  });

  it.each([0, 6, 2.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects an invalid rating: %s',
    (rating) => {
      const result = validatePromptDraft({ ...validDraft, rating });

      expect(result.valid).toBe(false);
      expect(result.errors.rating).toBe('La note doit être un entier entre 1 et 5.');
    },
  );

  it('treats whitespace-only fields as empty', () => {
    const result = validatePromptDraft({ ...validDraft, title: '\t\n', body: '\u00a0' });

    expect(result).toEqual({
      valid: false,
      errors: {
        title: 'Le titre est obligatoire.',
        body: 'Le corps du prompt est obligatoire.',
      },
    });
  });
});
