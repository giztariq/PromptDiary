import type { Prompt } from './types';
import { fuzzyMatch, fuzzyMatchPositions, searchPrompts } from './search';

const prompts: Prompt[] = [
  {
    id: 'analysis',
    title: 'Analyse de document',
    body: 'Résume les conclusions de ce document.',
    tags: ['analyse', 'travail'],
    model: 'Claude',
    context: 'Synthèse',
    rating: 5,
    favorite: false,
    copyCount: 2,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-19T10:00:00.000Z',
  },
  {
    id: 'mail',
    title: 'Réponse client',
    body: 'Rédige une réponse professionnelle.',
    tags: ['travail'],
    model: 'GPT',
    context: 'Email',
    rating: 4,
    favorite: true,
    copyCount: 1,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-19T10:00:00.000Z',
  },
  {
    id: 'strategy',
    title: 'Plan d’équipe',
    body: 'Prépare un plan de suivi pour notre équipe produit.',
    tags: ['Équipe', 'stratégie'],
    model: 'GPT',
    context: 'Planification',
    rating: 5,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-19T10:00:00.000Z',
  },
];

describe('searchPrompts', () => {
  it('searches title and body without case or accent sensitivity', () => {
    expect(searchPrompts(prompts, { query: 'ANALYSE' }).map((prompt) => prompt.id)).toEqual([
      'analysis',
    ]);
    expect(searchPrompts(prompts, { query: 'redige' }).map((prompt) => prompt.id)).toEqual([
      'mail',
    ]);
    expect(searchPrompts(prompts, { query: '  ÉQUIPE  ' }).map((prompt) => prompt.id)).toEqual([
      'strategy',
    ]);
  });

  it('searches tags, model, and context as well as title and body', () => {
    expect(searchPrompts(prompts, { query: 'claude' }).map((prompt) => prompt.id)).toEqual([
      'analysis',
    ]);
    expect(searchPrompts(prompts, { query: 'synthese' }).map((prompt) => prompt.id)).toEqual([
      'analysis',
    ]);
    expect(searchPrompts(prompts, { query: 'strategie' }).map((prompt) => prompt.id)).toEqual([
      'strategy',
    ]);
  });

  it('combines text, tag, and minimum rating filters', () => {
    expect(
      searchPrompts(prompts, { query: 'document', tags: ['analyse'], minRating: 5 }).map(
        (prompt) => prompt.id,
      ),
    ).toEqual(['analysis']);

    expect(
      searchPrompts(prompts, { tags: ['TRAVAIL', 'ANALYSE'], minRating: 5 }).map(
        (prompt) => prompt.id,
      ),
    ).toEqual(['analysis']);

    expect(
      searchPrompts(prompts, { query: 'equipe', tags: ['STRATEGIE'], minRating: 5 }).map(
        (prompt) => prompt.id,
      ),
    ).toEqual(['strategy']);
  });

  it('returns all prompts when no filter is provided', () => {
    expect(searchPrompts(prompts, {}).map((prompt) => prompt.id)).toEqual([
      'mail',
      'analysis',
      'strategy',
    ]);
  });

  it('keeps only favorites when the favorites filter is active', () => {
    expect(searchPrompts(prompts, { favoritesOnly: true }).map((prompt) => prompt.id)).toEqual([
      'mail',
    ]);
  });

  it('combines the favorites filter with the other filters', () => {
    expect(
      searchPrompts(prompts, { favoritesOnly: true, minRating: 5 }).map((prompt) => prompt.id),
    ).toEqual([]);
    expect(
      searchPrompts(prompts, { favoritesOnly: true, query: 'email' }).map((prompt) => prompt.id),
    ).toEqual(['mail']);
  });

  it('applies the requested sort order', () => {
    expect(searchPrompts(prompts, { sort: 'title' }).map((prompt) => prompt.id)).toEqual([
      'analysis',
      'strategy',
      'mail',
    ]);
    expect(searchPrompts(prompts, { sort: 'usage' }).map((prompt) => prompt.id)).toEqual([
      'analysis',
      'mail',
      'strategy',
    ]);
    expect(searchPrompts(prompts, { sort: 'rating' }).map((prompt) => prompt.id)).toEqual([
      'analysis',
      'strategy',
      'mail',
    ]);
  });

  it('handles 500 prompts within the 50ms target', () => {
    const largeLibrary = Array.from({ length: 500 }, (_, index) => ({
      ...prompts[0],
      id: `prompt-${index}`,
      title: `Analyse ${index}`,
    }));
    const start = performance.now();

    const results = searchPrompts(largeLibrary, { query: 'analyse', minRating: 4 });

    expect(results).toHaveLength(500);
    expect(performance.now() - start).toBeLessThan(50);
  });
});

describe('fuzzyMatch', () => {
  it('matches an approximate subsequence', () => {
    expect(fuzzyMatch('rlnc', 'Relance client')).toBe(true);
    expect(fuzzyMatch('rlc', 'Relance client')).toBe(true);
    expect(fuzzyMatch('anl', 'Analyse de document')).toBe(true);
  });

  it('ignores case and accents', () => {
    expect(fuzzyMatch('SYNTH', 'Synthétiser un document')).toBe(true);
    expect(fuzzyMatch('synth', 'synthétiser un document')).toBe(true);
  });

  it('rejects unrelated text', () => {
    expect(fuzzyMatch('xyz', 'Relance client')).toBe(false);
    expect(fuzzyMatch('zz', 'Relance client')).toBe(false);
  });

  it('matches everything with an empty query', () => {
    expect(fuzzyMatch('', 'Relance client')).toBe(true);
    expect(fuzzyMatch('   ', 'Relance client')).toBe(true);
  });

  it('returns the matched positions in the original text', () => {
    expect(fuzzyMatchPositions('rlc', 'Relance client')).toEqual([0, 2, 5]);
    expect(fuzzyMatchPositions('xyz', 'Relance client')).toEqual([]);
  });

  it('keeps positions aligned with accented characters', () => {
    expect(fuzzyMatchPositions('e', 'Synthétiser')).toEqual([5]);
  });
});

describe('searchPrompts fuzzy mode', () => {
  it('finds a prompt with an approximate query', () => {
    const approximate = [
      {
        ...prompts[0],
        id: 'relance',
        title: 'Relance client',
        body: 'Prépare une relance commerciale.',
      },
    ];

    expect(
      searchPrompts(approximate, { query: 'rlc', fuzzy: true }).map((prompt) => prompt.id),
    ).toEqual(['relance']);
  });

  it('does not match unrelated prompts', () => {
    expect(searchPrompts(prompts, { query: 'xyz', fuzzy: true })).toEqual([]);
  });

  it('ignores short queries in fuzzy mode', () => {
    expect(fuzzyMatch('aa', 'Analyse de document')).toBe(true);
    expect(searchPrompts(prompts, { query: 'aa', fuzzy: true })).toEqual([]);
  });
});

describe('searchPrompts usage filters', () => {
  const now = new Date('2026-10-21T12:00:00.000Z');

  it('keeps the prompts that were never used', () => {
    const library = [
      { ...prompts[0], id: 'used', copyCount: 3, lastUsedAt: '2026-10-20T12:00:00.000Z' },
      { ...prompts[1], id: 'never', copyCount: 0 },
    ];

    expect(searchPrompts(library, { neverUsed: true }, now).map((prompt) => prompt.id)).toEqual([
      'never',
    ]);
  });

  it('keeps the prompts unused for more than the given number of days', () => {
    const library = [
      { ...prompts[0], id: 'recent', lastUsedAt: '2026-10-19T12:00:00.000Z' },
      { ...prompts[1], id: 'old', lastUsedAt: '2026-09-01T12:00:00.000Z' },
      { ...prompts[2], id: 'never' },
    ];

    expect(searchPrompts(library, { unusedForDays: 30 }, now).map((prompt) => prompt.id)).toEqual([
      'old',
      'never',
    ]);
  });

  it('combines the usage filters with the other filters', () => {
    const library = [
      { ...prompts[0], id: 'never', copyCount: 0, rating: 5 as const },
      { ...prompts[1], id: 'used', copyCount: 2, rating: 5 as const },
    ];

    expect(
      searchPrompts(library, { neverUsed: true, minRating: 5 }, now).map((prompt) => prompt.id),
    ).toEqual(['never']);
  });
});
