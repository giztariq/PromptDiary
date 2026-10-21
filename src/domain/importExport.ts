import { isRating } from './validation';
import type { Prompt } from './types';

const EXPORT_VERSION = 1;

interface PromptExport {
  version: typeof EXPORT_VERSION;
  prompts: Prompt[];
}

export interface ImportReport {
  prompts: Prompt[];
  addedPrompts: Prompt[];
  added: number;
  ignored: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrompt(value: unknown): value is Prompt {
  if (!isRecord(value) || !Array.isArray(value.tags)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.model === 'string' &&
    typeof value.context === 'string' &&
    typeof value.rating === 'number' &&
    isRating(value.rating) &&
    typeof value.favorite === 'boolean' &&
    typeof value.copyCount === 'number' &&
    Number.isInteger(value.copyCount) &&
    value.copyCount >= 0 &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.collection === undefined || typeof value.collection === 'string') &&
    (value.versions === undefined ||
      (Array.isArray(value.versions) &&
        value.versions.every(
          (version) =>
            isRecord(version) &&
            typeof version.title === 'string' &&
            typeof version.body === 'string' &&
            typeof version.savedAt === 'string',
        ))) &&
    (value.lastUsedAt === undefined || typeof value.lastUsedAt === 'string') &&
    (value.usageLog === undefined ||
      (Array.isArray(value.usageLog) &&
        value.usageLog.every((timestamp) => typeof timestamp === 'string')))
  );
}

function clonePrompt(prompt: Prompt): Prompt {
  return { ...prompt, tags: [...prompt.tags] };
}

export function exportPrompts(prompts: Prompt[]): string {
  const payload: PromptExport = {
    version: EXPORT_VERSION,
    prompts: prompts.map(clonePrompt),
  };
  return JSON.stringify(payload, null, 2);
}

export function parsePromptExport(serialized: string): Prompt[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error('Le fichier JSON est invalide.');
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== EXPORT_VERSION ||
    !Array.isArray(parsed.prompts) ||
    !parsed.prompts.every(isPrompt)
  ) {
    throw new Error('Le format du fichier est invalide ou non supporté.');
  }

  return parsed.prompts.map(clonePrompt);
}

export function mergePromptLibrary(existing: Prompt[], imported: Prompt[]): ImportReport {
  const existingIds = new Set(existing.map((prompt) => prompt.id));
  const addedPrompts: Prompt[] = [];

  for (const prompt of imported) {
    if (existingIds.has(prompt.id)) {
      continue;
    }
    existingIds.add(prompt.id);
    addedPrompts.push(clonePrompt(prompt));
  }

  return {
    prompts: [...existing.map(clonePrompt), ...addedPrompts],
    addedPrompts,
    added: addedPrompts.length,
    ignored: imported.length - addedPrompts.length,
  };
}
