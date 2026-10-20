import type { Prompt } from './types';
import { exportPrompts, mergePromptLibrary, parsePromptExport } from './importExport';

const prompt: Prompt = {
  id: 'prompt-1',
  title: 'Analyse',
  body: 'Analyse ce document.',
  tags: ['analyse'],
  model: 'Claude',
  context: 'Synthèse',
  rating: 5,
  favorite: true,
  copyCount: 4,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T11:00:00.000Z',
};

describe('prompt import and export', () => {
  it('round-trips a versioned export', () => {
    expect(parsePromptExport(exportPrompts([prompt]))).toEqual([prompt]);
  });

  it('round-trips a full library without sharing tag references', () => {
    const library = [
      prompt,
      { ...prompt, id: 'prompt-2', title: 'Réponse client', tags: ['email'] },
    ];

    const imported = parsePromptExport(exportPrompts(library));
    expect(imported).toEqual(library);
    imported[0].tags.push('mutated');

    expect(library[0].tags).toEqual(['analyse']);
  });

  it('round-trips the optional usage history', () => {
    const usedPrompt = {
      ...prompt,
      lastUsedAt: '2026-10-20T09:30:00.000Z',
      usageLog: ['2026-10-19T09:30:00.000Z', '2026-10-20T09:30:00.000Z'],
    };

    expect(parsePromptExport(exportPrompts([usedPrompt]))).toEqual([usedPrompt]);
  });

  it('merges imported prompts without duplicating ids', () => {
    const imported = [prompt, { ...prompt, id: 'prompt-2', title: 'Nouveau' }];

    expect(mergePromptLibrary([prompt], imported)).toMatchObject({
      added: 1,
      ignored: 1,
      prompts: [prompt, { ...prompt, id: 'prompt-2', title: 'Nouveau' }],
    });
  });

  it.each([
    'not json',
    JSON.stringify({ version: 2, prompts: [] }),
    JSON.stringify({ version: 1 }),
  ])('rejects an invalid export: %s', (serialized) => {
    expect(() => parsePromptExport(serialized)).toThrow();
  });
});
