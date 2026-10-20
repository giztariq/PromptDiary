import { runStorageAdapterContract } from '../test/storageContract';
import { createMemoryAdapter } from './memoryAdapter';

runStorageAdapterContract('memory adapter contract', () => createMemoryAdapter());
