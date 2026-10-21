import type { Prompt } from './types';
import { sortPrompts, SORT_OPTIONS, type SortOption } from './sort';

const prompts: Prompt[] = [
  {
    id: 'analysis',
    title: 'Analyse de document',
    body: 'Résume les conclusions de ce document.',
    tags: ['analyse'],
    model: 'Claude',
    context: 'Synthèse',
    rating: 5,
    favorite: false,
    copyCount: 2,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
    lastUsedAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'mail',
    title: 'Réponse client',
    body: 'Rédige une réponse professionnelle.',
    tags: ['email'],
    model: 'GPT',
    context: 'Email',
    rating: 3,
    favorite: true,
    copyCount: 5,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-12T10:00:00.000Z',
    lastUsedAt: '2026-10-19T10:00:00.000Z',
  },
  {
    id: 'strategy',
    title: 'Plan d’équipe',
    body: 'Prépare un plan de suivi pour notre équipe produit.',
    tags: ['équipe'],
    model: 'GPT',
    context: 'Planification',
    rating: 4,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
  },
];

function ids(sorted: Prompt[]): string[] {
  return sorted.map((prompt) => prompt.id);
}

describe('sortPrompts', () => {
  it('exposes stable sort options for the interface', () => {
    expect(SORT_OPTIONS.map((option) => option.value)).toEqual([
      'priority',
      'recent',
      'usage',
      'rating',
      'title',
    ]);
    expect(SORT_OPTIONS.every((option) => option.label.length > 0)).toBe(true);
  });

  it('keeps favorites first and usage priority for the priority option', () => {
    expect(ids(sortPrompts(prompts, 'priority'))).toEqual(['mail', 'analysis', 'strategy']);
  });

  it('sorts by the most recent update for the recent option', () => {
    expect(ids(sortPrompts(prompts, 'recent'))).toEqual(['strategy', 'mail', 'analysis']);
  });

  it('sorts by copy count then by last usage for the usage option', () => {
    expect(ids(sortPrompts(prompts, 'usage'))).toEqual(['mail', 'analysis', 'strategy']);
  });

  it('sorts by rating then by copy count for the rating option', () => {
    expect(ids(sortPrompts(prompts, 'rating'))).toEqual(['analysis', 'strategy', 'mail']);
  });

  it('sorts by title without accent sensitivity', () => {
    expect(ids(sortPrompts(prompts, 'title'))).toEqual(['analysis', 'strategy', 'mail']);
  });

  it('never mutates the source list', () => {
    const source = [...prompts];
    sortPrompts(source, 'title');
    expect(source).toEqual(prompts);
  });

  it('treats missing or invalid dates as the oldest value', () => {
    const missing: Prompt = { ...prompts[2], id: 'missing' };
    const invalid: Prompt = { ...prompts[0], id: 'invalid', updatedAt: 'not-a-date' };
    const fresh: Prompt = { ...prompts[1], id: 'fresh', updatedAt: '2026-10-20T10:00:00.000Z' };

    expect(ids(sortPrompts([missing, invalid, fresh], 'recent'))).toEqual([
      'fresh',
      'missing',
      'invalid',
    ]);
  });

  it('uses the last usage date to break usage ties', () => {
    const neverUsed: Prompt = {
      ...prompts[0],
      id: 'neverUsed',
      copyCount: 3,
      lastUsedAt: undefined,
    };
    const recentlyUsed: Prompt = { ...prompts[1], id: 'recentlyUsed', copyCount: 3 };

    expect(ids(sortPrompts([neverUsed, recentlyUsed], 'usage'))).toEqual([
      'recentlyUsed',
      'neverUsed',
    ]);
  });

  it('falls back on the priority order for an unknown option', () => {
    const unknownOption = 'unknown' as string as SortOption;
    expect(ids(sortPrompts(prompts, unknownOption))).toEqual(['mail', 'analysis', 'strategy']);
  });
});
