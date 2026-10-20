import 'fake-indexeddb/auto';

import { contractPrompt, runStorageAdapterContract } from '../test/storageContract';
import { createIndexedDbAdapter } from './indexedDbAdapter';

const databases = new Set<string>();

function createDatabaseName(): string {
  const name = `prompt-diary-test-${crypto.randomUUID()}`;
  databases.add(name);
  return name;
}

function openVersionOne(
  name: string,
  prompts = [] as (typeof contractPrompt)[],
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore('prompts', { keyPath: 'id' });
    };
    request.onsuccess = () => {
      const database = request.result;
      if (prompts.length === 0) {
        resolve(database);
        return;
      }

      const transaction = database.transaction('prompts', 'readwrite');
      for (const prompt of prompts) {
        transaction.objectStore('prompts').put(prompt);
      }
      transaction.oncomplete = () => resolve(database);
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Unable to seed the version 1 database'));
    };
    request.onerror = () => reject(request.error ?? new Error('Unable to open the database'));
  });
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Unable to delete the database'));
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

afterEach(async () => {
  for (const name of databases) {
    await deleteDatabase(name).catch(() => undefined);
  }
  databases.clear();
});

runStorageAdapterContract('indexeddb adapter contract', () =>
  createIndexedDbAdapter(createDatabaseName()),
);

describe('indexeddb adapter specifics', () => {
  it('migrates a version 1 library without losing prompts', async () => {
    const name = createDatabaseName();
    const database = await openVersionOne(name, [contractPrompt]);
    database.close();

    const adapter = createIndexedDbAdapter(name);

    expect(await adapter.list()).toEqual([contractPrompt]);
    expect(await adapter.getValue('values:prompt-contract')).toBeUndefined();
    await adapter.setValue('values:prompt-contract', { document: 'rapport.pdf' });
    expect(await adapter.getValue('values:prompt-contract')).toEqual({
      document: 'rapport.pdf',
    });
  });

  it('rejects instead of hanging when another tab blocks the upgrade', async () => {
    const name = createDatabaseName();
    const blockingDatabase = await openVersionOne(name);
    const adapter = createIndexedDbAdapter(name);

    await expect(adapter.list()).rejects.toThrow(/bloquée par un autre onglet/i);

    blockingDatabase.close();
  });
});
