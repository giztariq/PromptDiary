import type { Prompt } from '../domain/types';
import { variableValuesKey, type StorageAdapter } from './storageAdapter';

const DATABASE_NAME = 'prompt-diary';
const DATABASE_VERSION = 2;
const STORE_NAME = 'prompts';
const VALUES_STORE_NAME = 'values';

interface StoredValues {
  key: string;
  values: Record<string, string>;
}

function clonePrompt(prompt: Prompt): Prompt {
  return { ...prompt, tags: [...prompt.tags] };
}

function cloneValues(values: Record<string, string>): Record<string, string> {
  return { ...values };
}

function openDatabase(databaseName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(VALUES_STORE_NAME)) {
        database.createObjectStore(VALUES_STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'));
  });
}

export function createIndexedDbAdapter(databaseName = DATABASE_NAME): StorageAdapter {
  async function run<T>(
    mode: IDBTransactionMode,
    storeNames: string | string[],
    operation: (transaction: IDBTransaction) => IDBRequest<T>,
  ): Promise<T> {
    const database = await openDatabase(databaseName);

    return new Promise<T>((resolve, reject) => {
      let result: T;
      let settled = false;
      const transaction = database.transaction(storeNames, mode);
      const close = () => database.close();
      const fail = (error: Error) => {
        if (!settled) {
          settled = true;
          close();
          reject(error);
        }
      };

      transaction.onabort = () =>
        fail(transaction.error ?? new Error('IndexedDB transaction aborted'));
      transaction.onerror = () =>
        fail(transaction.error ?? new Error('IndexedDB transaction failed'));
      transaction.oncomplete = () => {
        if (!settled) {
          settled = true;
          close();
          resolve(result);
        }
      };

      try {
        const request = operation(transaction);
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => fail(request.error ?? new Error('IndexedDB request failed'));
      } catch (error) {
        fail(error instanceof Error ? error : new Error('IndexedDB operation failed'));
      }
    });
  }

  return {
    async list() {
      const prompts = await run<Prompt[]>(
        'readonly',
        STORE_NAME,
        (transaction) => transaction.objectStore(STORE_NAME).getAll() as IDBRequest<Prompt[]>,
      );
      return prompts.map(clonePrompt);
    },
    async get(id) {
      const prompt = await run<Prompt | undefined>(
        'readonly',
        STORE_NAME,
        (transaction) =>
          transaction.objectStore(STORE_NAME).get(id) as IDBRequest<Prompt | undefined>,
      );
      return prompt ? clonePrompt(prompt) : undefined;
    },
    async save(prompt) {
      await run<IDBValidKey>('readwrite', STORE_NAME, (transaction) =>
        transaction.objectStore(STORE_NAME).put(clonePrompt(prompt)),
      );
    },
    async remove(id) {
      await run<undefined>('readwrite', [STORE_NAME, VALUES_STORE_NAME], (transaction) => {
        transaction.objectStore(VALUES_STORE_NAME).delete(variableValuesKey(id));
        return transaction.objectStore(STORE_NAME).delete(id) as IDBRequest<undefined>;
      });
    },
    async getValue(key) {
      const stored = await run<StoredValues | undefined>(
        'readonly',
        VALUES_STORE_NAME,
        (transaction) =>
          transaction.objectStore(VALUES_STORE_NAME).get(key) as IDBRequest<
            StoredValues | undefined
          >,
      );
      return stored ? cloneValues(stored.values) : undefined;
    },
    async setValue(key, values) {
      await run<IDBValidKey>('readwrite', VALUES_STORE_NAME, (transaction) =>
        transaction.objectStore(VALUES_STORE_NAME).put({ key, values: cloneValues(values) }),
      );
    },
    async removeValue(key) {
      await run<undefined>(
        'readwrite',
        VALUES_STORE_NAME,
        (transaction) =>
          transaction.objectStore(VALUES_STORE_NAME).delete(key) as IDBRequest<undefined>,
      );
    },
    async clear() {
      await run<undefined>('readwrite', [STORE_NAME, VALUES_STORE_NAME], (transaction) => {
        transaction.objectStore(VALUES_STORE_NAME).clear();
        return transaction.objectStore(STORE_NAME).clear() as IDBRequest<undefined>;
      });
    },
  };
}
