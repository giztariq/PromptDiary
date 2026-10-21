import {
  countFavorites,
  countWithoutCollection,
  listCollections,
  removeCollection,
  renameCollection,
} from './collections';
import type { Prompt } from './types';

const prompts: Prompt[] = [
  {
    id: 'a',
    title: 'Relance client',
    body: 'Relance le client.',
    tags: [],
    model: '',
    context: '',
    rating: 4,
    favorite: true,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    collection: 'Client Dupont',
  },
  {
    id: 'b',
    title: 'Compte rendu',
    body: 'Rédige le compte rendu.',
    tags: [],
    model: '',
    context: '',
    rating: 3,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    collection: 'Client Dupont',
  },
  {
    id: 'c',
    title: 'Sans collection',
    body: 'Un prompt libre.',
    tags: [],
    model: '',
    context: '',
    rating: 5,
    favorite: false,
    copyCount: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

describe('listCollections', () => {
  it('lists the collections with their prompt count', () => {
    expect(listCollections(prompts)).toEqual([{ name: 'Client Dupont', count: 2 }]);
  });

  it('ignores empty collection names', () => {
    expect(listCollections([{ ...prompts[2], collection: '   ' }])).toEqual([]);
  });

  it('returns an empty list for a library without collections', () => {
    expect(listCollections([])).toEqual([]);
  });
});

describe('renameCollection', () => {
  it('renames every prompt of the collection', () => {
    const renamed = renameCollection(prompts, 'Client Dupont', 'Client Durand');

    expect(renamed.filter((prompt) => prompt.collection === 'Client Durand')).toHaveLength(2);
    expect(renamed.find((prompt) => prompt.id === 'c')?.collection).toBeUndefined();
  });

  it('never mutates the source list', () => {
    renameCollection(prompts, 'Client Dupont', 'Client Durand');
    expect(prompts[0].collection).toBe('Client Dupont');
  });

  it('does nothing for an empty or identical name', () => {
    expect(renameCollection(prompts, 'Client Dupont', '  ')).toEqual(prompts);
    expect(renameCollection(prompts, 'Client Dupont', 'Client Dupont')).toEqual(prompts);
  });
});

describe('removeCollection', () => {
  it('detaches the prompts without deleting them', () => {
    const detached = removeCollection(prompts, 'Client Dupont');

    expect(detached).toHaveLength(3);
    expect(detached.every((prompt) => prompt.collection === undefined)).toBe(true);
    expect(detached.map((prompt) => prompt.id)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the other collections untouched', () => {
    const withTwo: Prompt[] = [...prompts, { ...prompts[2], id: 'd', collection: 'Autre' }];
    const detached = removeCollection(withTwo, 'Client Dupont');

    expect(detached.find((prompt) => prompt.id === 'd')?.collection).toBe('Autre');
  });
});

describe('collection counters', () => {
  it('counts the favorites and the prompts without collection', () => {
    expect(countFavorites(prompts)).toBe(1);
    expect(countWithoutCollection(prompts)).toBe(1);
  });
});
