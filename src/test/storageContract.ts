import type { Prompt } from '../domain/types';
import { variableValuesKey, type StorageAdapter } from '../storage/storageAdapter';

export const contractPrompt: Prompt = {
  id: 'prompt-contract',
  title: 'Analyse un document',
  body: 'Analyse ce document et résume les points importants.',
  tags: ['analyse', 'document'],
  model: 'Claude',
  context: 'Synthèse de documents avant réunion.',
  rating: 5,
  favorite: false,
  copyCount: 0,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
};

/**
 * Contract shared by every StorageAdapter implementation.
 * A new adapter is only production-ready when this suite passes unchanged.
 */
export function runStorageAdapterContract(
  label: string,
  createAdapter: () => StorageAdapter,
): void {
  describe(label, () => {
    let adapter: StorageAdapter;

    beforeEach(() => {
      adapter = createAdapter();
    });

    it('starts empty', async () => {
      expect(await adapter.list()).toEqual([]);
      expect(await adapter.get(contractPrompt.id)).toBeUndefined();
    });

    it('saves, reads, and lists prompts without sharing tag references', async () => {
      await adapter.save(contractPrompt);

      const stored = await adapter.get(contractPrompt.id);
      expect(stored).toEqual(contractPrompt);

      stored?.tags.push('mutated from the read result');
      expect(await adapter.get(contractPrompt.id)).toEqual(contractPrompt);

      const listed = await adapter.list();
      listed[0].tags.push('mutated from the list');
      expect(await adapter.list()).toEqual([contractPrompt]);
    });

    it('overwrites an existing prompt', async () => {
      await adapter.save(contractPrompt);
      const updated = { ...contractPrompt, favorite: true, copyCount: 3, title: 'Mis à jour' };

      await adapter.save(updated);

      expect(await adapter.get(contractPrompt.id)).toEqual(updated);
    });

    it('removes a prompt', async () => {
      await adapter.save(contractPrompt);

      await adapter.remove(contractPrompt.id);

      expect(await adapter.get(contractPrompt.id)).toBeUndefined();
      expect(await adapter.list()).toEqual([]);
      await expect(adapter.remove('missing')).resolves.toBeUndefined();
    });

    it('stores and reads variable values without sharing mutable references', async () => {
      const key = variableValuesKey(contractPrompt.id);
      const values = { nom: 'Ada', contexte: 'analyse' };

      await adapter.setValue(key, values);
      values.nom = 'mutated outside the adapter';
      const stored = await adapter.getValue(key);

      expect(stored).toEqual({ nom: 'Ada', contexte: 'analyse' });
      if (stored) {
        stored.nom = 'mutated from the read result';
      }
      expect(await adapter.getValue(key)).toEqual({ nom: 'Ada', contexte: 'analyse' });
    });

    it('replaces all values when the same key is saved again', async () => {
      const key = variableValuesKey(contractPrompt.id);

      await adapter.setValue(key, { nom: 'Ada', ancien: 'à supprimer' });
      await adapter.setValue(key, { nom: 'Grace' });

      expect(await adapter.getValue(key)).toEqual({ nom: 'Grace' });
    });

    it('removes a single values entry', async () => {
      const key = variableValuesKey(contractPrompt.id);

      await adapter.setValue(key, { nom: 'Ada' });
      await adapter.removeValue(key);

      expect(await adapter.getValue(key)).toBeUndefined();
    });

    it('removes the values attached to a deleted prompt only', async () => {
      const firstKey = variableValuesKey(contractPrompt.id);

      await adapter.save(contractPrompt);
      await adapter.setValue(firstKey, { nom: 'Ada' });
      await adapter.setValue('values:other', { nom: 'Grace' });

      await adapter.remove(contractPrompt.id);

      expect(await adapter.getValue(firstKey)).toBeUndefined();
      expect(await adapter.getValue('values:other')).toEqual({ nom: 'Grace' });
    });

    it('clears prompts and values together', async () => {
      const key = variableValuesKey(contractPrompt.id);

      await adapter.save(contractPrompt);
      await adapter.setValue(key, { nom: 'Ada' });

      await adapter.clear();

      expect(await adapter.list()).toEqual([]);
      expect(await adapter.getValue(key)).toBeUndefined();
    });
  });
}
