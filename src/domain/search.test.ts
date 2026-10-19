import type { Prompt } from './types';
import { searchPrompts } from './search';

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
