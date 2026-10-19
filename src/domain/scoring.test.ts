import type { Prompt } from './types';
import { sortPromptsByPriority } from './scoring';

const prompt = (id: string, favorite: boolean, copyCount: number): Prompt => ({
  id,
  title: id,
  body: id,
  tags: [],
  model: '',
  context: '',
  rating: 3,
  favorite,
  copyCount,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
});

describe('sortPromptsByPriority', () => {
  it('puts favorites first, then sorts by usage descending', () => {
    const prompts = [
      prompt('used', false, 12),
      prompt('favorite-low', true, 1),
      prompt('favorite-high', true, 4),
    ];

    expect(sortPromptsByPriority(prompts).map((item) => item.id)).toEqual([
      'favorite-high',
      'favorite-low',
      'used',
    ]);
  });

  it('does not mutate the input array', () => {
    const prompts = [prompt('b', false, 1), prompt('a', true, 0)];

    sortPromptsByPriority(prompts);

    expect(prompts.map((item) => item.id)).toEqual(['b', 'a']);
  });
});
