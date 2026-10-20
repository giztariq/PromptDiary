import { afterEach, describe, expect, it, vi } from 'vitest';

import { EXAMPLES } from '../data/examples';
import { importExamples } from './importExample';
import type { Prompt } from './types';

const maintenant = '2026-10-20T09:30:00.000Z';

function createExisting(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: 'prompt-existant',
    title: 'Ancien prompt',
    body: 'Un corps existant',
    tags: ['ancien'],
    model: '',
    context: 'Contexte existant',
    rating: 3,
    favorite: false,
    copyCount: 0,
    createdAt: maintenant,
    updatedAt: maintenant,
    ...overrides,
  };
}

describe('importExamples', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('importe un exemple en créant un prompt initialisé', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(maintenant));

    const [prompt] = importExamples([EXAMPLES[0]], []).ajoutes;

    expect(prompt).toMatchObject({
      title: EXAMPLES[0].titre,
      body: EXAMPLES[0].corps,
      tags: [...EXAMPLES[0].tags, 'exemple'],
      model: EXAMPLES[0].modele,
      context: EXAMPLES[0].contexte,
      rating: EXAMPLES[0].note,
      favorite: false,
      copyCount: 0,
      createdAt: maintenant,
      updatedAt: maintenant,
    });
    expect(prompt.id).toEqual(expect.any(String));
  });

  it('ignore un exemple dont le titre existe déjà', () => {
    const exemple = EXAMPLES[1];

    expect(importExamples([exemple], [createExisting({ title: exemple.titre })])).toEqual({
      ajoutes: [],
      ignores: 1,
    });
  });

  it('importe partiellement un lot et déduplique aussi les titres du lot', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(maintenant));
    const premier = EXAMPLES[2];
    const doublonDuLot = { ...EXAMPLES[3], titre: premier.titre };
    const dernier = EXAMPLES[4];
    const autre = EXAMPLES[5];

    const resultat = importExamples([premier, doublonDuLot, dernier, autre], []);

    expect(resultat.ajoutes).toHaveLength(3);
    expect(resultat.ignores).toBe(1);
  });

  it('n’ajoute rien lors d’une ré-importation des prompts déjà créés', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(maintenant));
    const premierImport = importExamples(EXAMPLES.slice(0, 2), []);

    const secondImport = importExamples(EXAMPLES.slice(0, 2), premierImport.ajoutes);

    expect(secondImport).toEqual({ ajoutes: [], ignores: 2 });
  });
});
