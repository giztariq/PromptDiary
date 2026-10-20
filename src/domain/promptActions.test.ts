import type { Prompt } from './types';
import { recordUsage, toggleFavorite, USAGE_HISTORY_LIMIT } from './promptActions';

const prompt: Prompt = {
  id: 'prompt-1',
  title: 'Analyse',
  body: 'Analyse ce document.',
  tags: [],
  model: 'Claude',
  context: 'Synthèse',
  rating: 5,
  favorite: false,
  copyCount: 2,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
};

describe('prompt actions', () => {
  it('records usage without mutating the prompt', () => {
    const updated = recordUsage(prompt, '2026-10-19T11:00:00.000Z');

    expect(updated).toMatchObject({
      copyCount: 3,
      lastUsedAt: '2026-10-19T11:00:00.000Z',
      usageLog: ['2026-10-19T11:00:00.000Z'],
      updatedAt: '2026-10-19T11:00:00.000Z',
    });
    expect(prompt.copyCount).toBe(2);
    expect(prompt.lastUsedAt).toBeUndefined();
    expect(prompt.usageLog).toBeUndefined();
  });

  it('appends usage entries and keeps the most recent ones', () => {
    const firstUsage = '2026-10-19T11:00:00.000Z';
    const withUsage = recordUsage(prompt, firstUsage);
    const withMoreUsage = recordUsage(withUsage, '2026-10-19T12:00:00.000Z');

    expect(withMoreUsage.usageLog).toEqual([firstUsage, '2026-10-19T12:00:00.000Z']);
    expect(withMoreUsage.lastUsedAt).toBe('2026-10-19T12:00:00.000Z');
  });

  it('caps the usage history to the latest entries', () => {
    const fullHistory = Array.from(
      { length: USAGE_HISTORY_LIMIT },
      (_, index) => `2026-10-19T${String(index).padStart(2, '0')}:00:00.000Z`,
    );
    const updated = recordUsage({ ...prompt, usageLog: fullHistory }, '2026-10-20T00:00:00.000Z');

    expect(updated.usageLog).toHaveLength(USAGE_HISTORY_LIMIT);
    expect(updated.usageLog?.[0]).toBe(fullHistory[1]);
    expect(updated.usageLog?.at(-1)).toBe('2026-10-20T00:00:00.000Z');
  });

  it('toggles favorite and updates the timestamp', () => {
    const updated = toggleFavorite(prompt, '2026-10-19T11:00:00.000Z');

    expect(updated).toMatchObject({ favorite: true, updatedAt: '2026-10-19T11:00:00.000Z' });
  });
});
