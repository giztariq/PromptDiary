import type { Prompt, PromptVersion } from './types';

export const MAX_VERSIONS = 5;

export function hasContentChanged(prompt: Prompt, next: { title: string; body: string }): boolean {
  return prompt.title.trim() !== next.title.trim() || prompt.body.trim() !== next.body.trim();
}

export function createVersions(prompt: Prompt, savedAt: string): PromptVersion[] {
  const previous: PromptVersion = {
    title: prompt.title,
    body: prompt.body,
    savedAt,
  };

  return [previous, ...(prompt.versions ?? [])].slice(0, MAX_VERSIONS);
}

export function restoreVersion(prompt: Prompt, version: PromptVersion, savedAt: string): Prompt {
  const current: PromptVersion = {
    title: prompt.title,
    body: prompt.body,
    savedAt,
  };

  return {
    ...prompt,
    title: version.title,
    body: version.body,
    updatedAt: savedAt,
    versions: [current, ...(prompt.versions ?? [])].slice(0, MAX_VERSIONS),
  };
}
