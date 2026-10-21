import { createVersions, hasContentChanged, MAX_VERSIONS, restoreVersion } from './versions';
import type { Prompt } from './types';

const prompt: Prompt = {
  id: 'prompt-1',
  title: 'Première version',
  body: 'Un corps de départ suffisamment long pour compter comme un prompt.',
  tags: [],
  model: '',
  context: '',
  rating: 4,
  favorite: false,
  copyCount: 0,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describe('hasContentChanged', () => {
  it('detects a changed title or body', () => {
    expect(hasContentChanged(prompt, { title: 'Autre', body: prompt.body })).toBe(true);
    expect(hasContentChanged(prompt, { title: prompt.title, body: 'Autre corps' })).toBe(true);
  });

  it('ignores surrounding spaces', () => {
    expect(
      hasContentChanged(prompt, { title: `  ${prompt.title} `, body: ` ${prompt.body} ` }),
    ).toBe(false);
  });
});

describe('createVersions', () => {
  it('pushes the previous state on top of the history', () => {
    const versions = createVersions(prompt, '2026-10-02T10:00:00.000Z');

    expect(versions).toEqual([
      { title: prompt.title, body: prompt.body, savedAt: '2026-10-02T10:00:00.000Z' },
    ]);
  });

  it('caps the history at five versions', () => {
    const history = Array.from({ length: 5 }, (_, index) => ({
      title: `Version ${index}`,
      body: 'Un corps de version suffisamment long.',
      savedAt: '2026-10-02T10:00:00.000Z',
    }));
    const withHistory: Prompt = { ...prompt, versions: history };

    const versions = createVersions(withHistory, '2026-10-03T10:00:00.000Z');

    expect(versions).toHaveLength(MAX_VERSIONS);
    expect(versions[0].title).toBe(prompt.title);
    expect(versions[4].title).toBe('Version 3');
  });
});

describe('restoreVersion', () => {
  it('restores the chosen version and keeps the current state in the history', () => {
    const version = {
      title: 'Ancienne version',
      body: 'Le corps ancien.',
      savedAt: '2026-10-01T10:00:00.000Z',
    };
    const restored = restoreVersion(prompt, version, '2026-10-04T10:00:00.000Z');

    expect(restored.title).toBe('Ancienne version');
    expect(restored.body).toBe('Le corps ancien.');
    expect(restored.updatedAt).toBe('2026-10-04T10:00:00.000Z');
    expect(restored.versions?.[0]).toEqual({
      title: prompt.title,
      body: prompt.body,
      savedAt: '2026-10-04T10:00:00.000Z',
    });
  });

  it('preserves the usage metadata and the favorite flag', () => {
    const used: Prompt = {
      ...prompt,
      favorite: true,
      copyCount: 4,
      usageLog: ['2026-10-02T10:00:00.000Z'],
    };
    const restored = restoreVersion(
      used,
      { title: 'Ancienne', body: 'Corps ancien.', savedAt: '2026-10-01T10:00:00.000Z' },
      '2026-10-04T10:00:00.000Z',
    );

    expect(restored.favorite).toBe(true);
    expect(restored.copyCount).toBe(4);
    expect(restored.usageLog).toEqual(['2026-10-02T10:00:00.000Z']);
  });
});
