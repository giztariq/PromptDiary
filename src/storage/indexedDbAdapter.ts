import type { Prompt } from '../domain/types';
import type { StorageAdapter } from './storageAdapter';

const DATABASE_NAME = 'prompt-diary';
const DATABASE_VERSION = 1;
const STORE_NAME = 'prompts';

function clonePrompt(prompt: Prompt): Prompt {
  return { ...prompt, tags: [...prompt.tags] };
}

function openDatabase(databaseName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'));
  });
}

export function createIndexedDbAdapter(databaseName = DATABASE_NAME): StorageAdapter {
  async function run<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await openDatabase(databaseName);

    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      });
    } finally {
      database.close();
    }
  }

  return {
    async list() {
      const prompts = await run<Prompt[]>(
        'readonly',
        (store) => store.getAll() as IDBRequest<Prompt[]>,
      );
      return prompts.map(clonePrompt);
    },
    async get(id) {
      const prompt = await run<Prompt | undefined>(
        'readonly',
        (store) => store.get(id) as IDBRequest<Prompt | undefined>,
      );
      return prompt ? clonePrompt(prompt) : undefined;
    },
    async save(prompt) {
      await run<IDBValidKey>('readwrite', (store) => store.put(clonePrompt(prompt)));
    },
    async remove(id) {
      await run<undefined>('readwrite', (store) => store.delete(id));
    },
    async clear() {
      await run<undefined>('readwrite', (store) => store.clear());
    },
  };
}
