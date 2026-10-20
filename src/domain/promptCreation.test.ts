import { describe, expect, it } from 'vitest';

import { createPromptFromDraft } from './promptCreation';

describe('createPromptFromDraft', () => {
  it('creates a persisted prompt with normalized text and initial usage metadata', () => {
    const prompt = createPromptFromDraft(
      {
        title: '  Analyse  ',
        body: '  Analyse ce document.  ',
        tags: [' analyse ', 'analyse', ''],
        model: ' Claude ',
        context: '  Synthèse  ',
        rating: 5,
      },
      'prompt-1',
      '2026-10-19T12:00:00.000Z',
    );

    expect(prompt).toEqual({
      id: 'prompt-1',
      title: 'Analyse',
      body: 'Analyse ce document.',
      tags: ['analyse'],
      model: 'Claude',
      context: 'Synthèse',
      rating: 5,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    });
  });

  it('rejects a rating outside the domain range', () => {
    expect(() =>
      createPromptFromDraft(
        { title: 'Titre', body: 'Corps', tags: [], model: '', context: '', rating: 6 },
        'prompt-1',
        '2026-10-19T12:00:00.000Z',
      ),
    ).toThrow('invalid rating');
  });
});
