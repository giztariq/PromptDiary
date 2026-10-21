import {
  dismissPrompt,
  findStalePrompts,
  isDismissed,
  daysSince,
  STALE_AFTER_DAYS,
} from './reminders';
import type { Prompt } from './types';

const now = new Date('2026-10-21T12:00:00.000Z');

function createPrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: 'prompt-1',
    title: 'Analyse SWOT',
    body: 'Un corps de prompt.',
    tags: [],
    model: '',
    context: '',
    rating: 4,
    favorite: false,
    copyCount: 2,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('daysSince', () => {
  it('counts the elapsed days', () => {
    expect(daysSince('2026-10-11T12:00:00.000Z', now)).toBe(10);
  });

  it('returns zero for an invalid date', () => {
    expect(daysSince('nope', now)).toBe(0);
  });
});

describe('findStalePrompts', () => {
  it('returns a prompt unused for more than thirty days', () => {
    const stale = findStalePrompts(
      [createPrompt({ lastUsedAt: '2026-08-01T12:00:00.000Z' })],
      {},
      now,
    );

    expect(stale).toHaveLength(1);
    expect(stale[0].prompt.title).toBe('Analyse SWOT');
    expect(stale[0].days).toBeGreaterThanOrEqual(STALE_AFTER_DAYS);
  });

  it('ignores recently used and never used prompts', () => {
    const recent = findStalePrompts(
      [
        createPrompt({ id: 'recent', lastUsedAt: '2026-10-18T12:00:00.000Z' }),
        createPrompt({ id: 'never' }),
      ],
      {},
      now,
    );

    expect(recent).toEqual([]);
  });

  it('ignores a dismissed prompt for seven days', () => {
    const dismissed = dismissPrompt('prompt-1', {}, new Date('2026-10-20T12:00:00.000Z'));
    const stale = findStalePrompts(
      [createPrompt({ lastUsedAt: '2026-08-01T12:00:00.000Z' })],
      dismissed,
      now,
    );

    expect(stale).toEqual([]);
  });

  it('shows the prompt again after the dismissal period', () => {
    const dismissed = dismissPrompt('prompt-1', {}, new Date('2026-10-01T12:00:00.000Z'));
    const stale = findStalePrompts(
      [createPrompt({ lastUsedAt: '2026-08-01T12:00:00.000Z' })],
      dismissed,
      now,
    );

    expect(stale).toHaveLength(1);
  });

  it('keeps only one reminder by default', () => {
    const stale = findStalePrompts(
      [
        createPrompt({ id: 'a', lastUsedAt: '2026-07-01T12:00:00.000Z' }),
        createPrompt({ id: 'b', lastUsedAt: '2026-08-01T12:00:00.000Z' }),
      ],
      {},
      now,
    );

    expect(stale).toHaveLength(1);
    expect(stale[0].prompt.id).toBe('a');
  });
});

describe('dismissPrompt', () => {
  it('stores the dismissal date without touching the other prompts', () => {
    const dismissed = dismissPrompt('prompt-1', { other: '2026-10-01T12:00:00.000Z' }, now);

    expect(dismissed['prompt-1']).toBe(now.toISOString());
    expect(dismissed['other']).toBe('2026-10-01T12:00:00.000Z');
    expect(isDismissed('prompt-1', dismissed, now)).toBe(true);
  });
});
