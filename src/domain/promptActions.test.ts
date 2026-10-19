import type { Prompt } from './types';
import { incrementCopyCount, toggleFavorite } from './promptActions';

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
  it('increments copy count and updates the timestamp without mutating the prompt', () => {
    const updated = incrementCopyCount(prompt, '2026-10-19T11:00:00.000Z');

    expect(updated).toMatchObject({ copyCount: 3, updatedAt: '2026-10-19T11:00:00.000Z' });
    expect(prompt.copyCount).toBe(2);
  });

  it('toggles favorite and updates the timestamp', () => {
    const updated = toggleFavorite(prompt, '2026-10-19T11:00:00.000Z');

    expect(updated).toMatchObject({ favorite: true, updatedAt: '2026-10-19T11:00:00.000Z' });
  });
});
