import type { Prompt } from '../domain/types';
import { createMemoryAdapter } from './memoryAdapter';

const prompt: Prompt = {
  id: 'prompt-1',
  title: 'Analyse un document',
  body: 'Analyse ce document et résume les points importants.',
  tags: ['analyse'],
  model: 'Claude',
  context: 'Synthèse de documents',
  rating: 5,
  favorite: false,
  copyCount: 0,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
};

describe('memory storage adapter', () => {
  it('stores and reads prompts without sharing mutable references', async () => {
    const adapter = createMemoryAdapter();

    await adapter.save(prompt);
    const stored = await adapter.get(prompt.id);

    expect(stored).toEqual(prompt);
    stored?.tags.push('document');
    expect(await adapter.get(prompt.id)).toEqual(prompt);
  });

  it('clones initial prompts and list results', async () => {
    const initialPrompt = { ...prompt, tags: ['analyse', 'documents'] };
    const adapter = createMemoryAdapter([initialPrompt]);

    initialPrompt.tags.push('mutated outside the adapter');
    const listed = await adapter.list();
    listed[0].tags.push('mutated from the list');

    expect(await adapter.list()).toEqual([{ ...prompt, tags: ['analyse', 'documents'] }]);
  });

  it('updates, lists, and removes prompts', async () => {
    const adapter = createMemoryAdapter([prompt]);
    const updated = { ...prompt, favorite: true, copyCount: 3 };

    await adapter.save(updated);

    expect(await adapter.list()).toEqual([updated]);
    await adapter.remove(prompt.id);
    expect(await adapter.get(prompt.id)).toBeUndefined();
    expect(await adapter.get('missing')).toBeUndefined();
    expect(await adapter.list()).toEqual([]);
  });

  it('saves and reads variable values without sharing mutable references', async () => {
    const adapter = createMemoryAdapter();
    const values = { nom: 'Ada', contexte: 'analyse' };

    await adapter.setValue('values:prompt-1', values);
    values.nom = 'mutated outside the adapter';
    const stored = await adapter.getValue('values:prompt-1');

    expect(stored).toEqual({ nom: 'Ada', contexte: 'analyse' });
    if (stored) {
      stored.nom = 'mutated from the read result';
    }
    expect(await adapter.getValue('values:prompt-1')).toEqual({
      nom: 'Ada',
      contexte: 'analyse',
    });
  });

  it('reinitializes values when saving the same key again', async () => {
    const adapter = createMemoryAdapter();

    await adapter.setValue('values:prompt-1', { nom: 'Ada', ancien: 'à supprimer' });
    await adapter.setValue('values:prompt-1', { nom: 'Grace' });

    expect(await adapter.getValue('values:prompt-1')).toEqual({ nom: 'Grace' });
  });

  it('resets values when removing their key', async () => {
    const adapter = createMemoryAdapter();

    await adapter.setValue('values:prompt-1', { nom: 'Ada' });
    await adapter.removeValue('values:prompt-1');

    expect(await adapter.getValue('values:prompt-1')).toBeUndefined();
  });

  it('removes prompt values and clears all values', async () => {
    const adapter = createMemoryAdapter([prompt]);

    await adapter.setValue('values:prompt-1', { nom: 'Ada' });
    await adapter.setValue('values:prompt-2', { nom: 'Grace' });
    await adapter.remove(prompt.id);

    expect(await adapter.getValue('values:prompt-1')).toBeUndefined();
    expect(await adapter.getValue('values:prompt-2')).toEqual({ nom: 'Grace' });

    await adapter.clear();

    expect(await adapter.getValue('values:prompt-2')).toBeUndefined();
  });

  it('clears the library', async () => {
    const adapter = createMemoryAdapter([prompt]);

    await adapter.clear();

    expect(await adapter.list()).toEqual([]);
  });
});
