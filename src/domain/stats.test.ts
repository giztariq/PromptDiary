import { computeLibraryStats } from './stats';
import type { Prompt } from './types';

const prompts: Prompt[] = [
  {
    id: 'email',
    title: 'Réponse client',
    body: 'Rédige une réponse professionnelle pour {{client}}.',
    tags: ['email', 'travail'],
    model: 'GPT',
    context: 'Email',
    rating: 5,
    favorite: true,
    copyCount: 4,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
  },
  {
    id: 'analysis',
    title: 'Analyse de document',
    body: 'Analyse ce document et réponds sous forme de liste.',
    tags: ['travail'],
    model: 'Claude',
    context: 'Synthèse',
    rating: 3,
    favorite: false,
    copyCount: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
  },
  {
    id: 'draft',
    title: 'Brouillon sans usage',
    body: 'Un prompt jamais utilisé.',
    tags: ['email'],
    model: '',
    context: '',
    rating: 4,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-04T10:00:00.000Z',
  },
];

describe('computeLibraryStats', () => {
  it('summarizes the library size, usage, favorites, and rating', () => {
    const stats = computeLibraryStats(prompts);

    expect(stats.total).toBe(3);
    expect(stats.favorites).toBe(1);
    expect(stats.withTags).toBe(3);
    expect(stats.withVariables).toBe(1);
    expect(stats.totalCopies).toBe(5);
    expect(stats.averageRating).toBe(4);
    expect(stats.neverUsed).toBe(1);
  });

  it('counts the prompts per rating from 1 to 5', () => {
    expect(computeLibraryStats(prompts).ratingDistribution).toEqual([
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 1 },
      { rating: 5, count: 1 },
    ]);
  });

  it('ranks the most copied prompts first', () => {
    expect(computeLibraryStats(prompts).topPrompts.map((entry) => entry.prompt.id)).toEqual([
      'email',
      'analysis',
    ]);
    expect(computeLibraryStats(prompts).topPrompts[0].copies).toBe(4);
  });

  it('aggregates tag usage and keeps the most productive tags', () => {
    const stats = computeLibraryStats(prompts);

    expect(stats.topTags).toEqual([
      { tag: 'travail', prompts: 2, copies: 5 },
      { tag: 'email', prompts: 2, copies: 4 },
    ]);
  });

  it('returns empty statistics for an empty library', () => {
    const stats = computeLibraryStats([]);

    expect(stats.total).toBe(0);
    expect(stats.totalCopies).toBe(0);
    expect(stats.averageRating).toBe(0);
    expect(stats.neverUsed).toBe(0);
    expect(stats.topPrompts).toEqual([]);
    expect(stats.topTags).toEqual([]);
    expect(stats.ratingDistribution).toHaveLength(5);
  });

  it('averages the rating with one decimal', () => {
    const stats = computeLibraryStats([
      { ...prompts[0], rating: 5 },
      { ...prompts[1], rating: 4 },
      { ...prompts[2], rating: 2 },
    ]);

    expect(stats.averageRating).toBe(3.7);
  });

  it('never mutates the source list', () => {
    const source = [...prompts];
    computeLibraryStats(source);
    expect(source).toEqual(prompts);
  });
});
