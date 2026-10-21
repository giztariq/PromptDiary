import { findSimilarPrompts, jaccard, similarityScore, tokenize } from './similarity';
import type { Prompt } from './types';

const prompt: Prompt = {
  id: 'relance',
  title: 'Relance client commercial',
  body: 'Rédige une relance professionnelle pour un client qui n’a pas répondu depuis trois semaines.',
  tags: [],
  model: '',
  context: '',
  rating: 4,
  favorite: false,
  copyCount: 0,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describe('tokenize', () => {
  it('drops accents, punctuation, and common words', () => {
    expect(tokenize('Écris une réponse, puis propose un plan pour le client')).toEqual([
      'ecris',
      'reponse',
      'propose',
      'plan',
      'client',
    ]);
  });

  it('ignores very short tokens', () => {
    expect(tokenize('un de la en')).toEqual([]);
  });
});

describe('jaccard', () => {
  it('returns one for identical token sets', () => {
    expect(jaccard(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
  });

  it('returns zero for disjoint token sets', () => {
    expect(jaccard(['a', 'b'], ['c', 'd'])).toBe(0);
  });

  it('returns zero for empty token sets', () => {
    expect(jaccard([], ['a'])).toBe(0);
  });
});

describe('similarityScore', () => {
  it('detects an obvious duplicate', () => {
    const score = similarityScore(
      'Relance client commercial Rédige une relance professionnelle pour un client qui n’a pas répondu depuis trois semaines.',
      'Relance client commerciale Rédige une relance professionnelle pour un client qui n’a pas répondu depuis trois semaines.',
    );

    expect(score).toBeGreaterThanOrEqual(0.8);
  });

  it('does not report short prompts as similar', () => {
    expect(similarityScore('Rédige un texte', 'Rédige un texte')).toBe(0);
  });

  it('returns zero for unrelated prompts', () => {
    expect(
      similarityScore(
        'Analyse les ventes du trimestre et propose un plan d’action commercial',
        'Traduis ce texte technique en anglais pour la documentation',
      ),
    ).toBeLessThan(0.2);
  });
});

describe('findSimilarPrompts', () => {
  it('returns the closest prompts above the threshold', () => {
    const similar = findSimilarPrompts(
      {
        title: 'Relance client commerciale',
        body: 'Rédige une relance professionnelle pour un client qui n’a pas répondu depuis trois semaines.',
      },
      [prompt],
    );

    expect(similar).toHaveLength(1);
    expect(similar[0].prompt.id).toBe('relance');
    expect(similar[0].percentage).toBeGreaterThanOrEqual(55);
  });

  it('ignores prompts below the threshold', () => {
    const similar = findSimilarPrompts(
      { title: 'Sujet', body: 'Autre sujet complètement différent sur un tout autre domaine' },
      [prompt],
    );

    expect(similar).toEqual([]);
  });

  it('keeps at most three matches', () => {
    const library = Array.from({ length: 5 }, (_, index) => ({
      ...prompt,
      id: `duplicate-${index}`,
    }));

    expect(findSimilarPrompts(prompt, library)).toHaveLength(3);
  });
});
