import { rankTags } from './tags';
import type { Prompt } from './types';

const prompts: Prompt[] = [
  {
    id: 'a',
    title: 'Analyse',
    body: 'Analyse ce document.',
    tags: ['travail', 'email'],
    model: '',
    context: '',
    rating: 4,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'b',
    title: 'Email',
    body: 'Rédige un email.',
    tags: ['email'],
    model: '',
    context: '',
    rating: 3,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'c',
    title: 'Plan',
    body: 'Prépare un plan.',
    tags: ['équipe'],
    model: '',
    context: '',
    rating: 5,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

describe('rankTags', () => {
  it('counts how many prompts use each tag', () => {
    expect(rankTags(prompts)).toEqual([
      { tag: 'email', count: 2 },
      { tag: 'équipe', count: 1 },
      { tag: 'travail', count: 1 },
    ]);
  });

  it('sorts the most used tags first and then alphabetically', () => {
    const ranked = rankTags([
      ...prompts,
      {
        ...prompts[0],
        id: 'd',
        tags: ['équipe'],
      },
    ]);

    expect(ranked.map((entry) => entry.tag)).toEqual(['email', 'équipe', 'travail']);
  });

  it('returns an empty ranking for a library without tags', () => {
    expect(rankTags([])).toEqual([]);
    expect(rankTags([{ ...prompts[0], tags: [] }])).toEqual([]);
  });

  it('never mutates the source list', () => {
    const source = [...prompts];
    rankTags(source);
    expect(source).toEqual(prompts);
  });
});
