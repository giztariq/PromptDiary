import type { Prompt } from './types';

export const STALE_AFTER_DAYS = 30;
export const DISMISS_DURATION_DAYS = 7;

const DAY_IN_MS = 86_400_000;

export interface StalePrompt {
  prompt: Prompt;
  days: number;
}

export function daysSince(value: string, now: Date): number {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return Math.floor((now.getTime() - timestamp) / DAY_IN_MS);
}

export function isDismissed(
  promptId: string,
  dismissed: Record<string, string>,
  now: Date,
): boolean {
  const until = dismissed[promptId];

  if (!until) {
    return false;
  }

  const timestamp = Date.parse(until);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return now.getTime() - timestamp < DISMISS_DURATION_DAYS * DAY_IN_MS;
}

export function findStalePrompts(
  prompts: Prompt[],
  dismissed: Record<string, string>,
  now: Date = new Date(),
  limit = 1,
): StalePrompt[] {
  return prompts
    .filter((prompt) => Boolean(prompt.lastUsedAt))
    .map((prompt) => ({ prompt, days: daysSince(prompt.lastUsedAt ?? '', now) }))
    .filter((entry) => entry.days >= STALE_AFTER_DAYS)
    .filter((entry) => !isDismissed(entry.prompt.id, dismissed, now))
    .sort((left, right) => right.days - left.days)
    .slice(0, limit);
}

export function dismissPrompt(
  promptId: string,
  dismissed: Record<string, string>,
  now: Date = new Date(),
): Record<string, string> {
  return { ...dismissed, [promptId]: now.toISOString() };
}
