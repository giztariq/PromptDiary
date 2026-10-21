import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { vi } from 'vitest';

import type { Prompt } from '../domain/types';
import { CommandPalette } from './CommandPalette';

const analysisPrompt: Prompt = {
  id: 'analysis',
  title: 'Synthèse de réunion',
  body: 'Résume les décisions et les actions.',
  tags: ['réunion'],
  model: 'Claude',
  context: 'Compte rendu',
  rating: 5,
  favorite: false,
  copyCount: 0,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
};

function renderPalette(overrides: Partial<ComponentProps<typeof CommandPalette>> = {}) {
  const props = {
    prompts: [analysisPrompt],
    onClose: vi.fn(),
    onCreate: vi.fn(),
    onOpenPrompt: vi.fn(),
    onCopyPrompt: vi.fn(),
    onEditPrompt: vi.fn(),
    onShowLibrary: vi.fn(),
    onShowExamples: vi.fn(),
    onShowSettings: vi.fn(),
    onShowStatistics: vi.fn(),
    onExportLibrary: vi.fn(),
    onImportLibrary: vi.fn(),
    onSortChange: vi.fn(),
    ...overrides,
  };

  render(<CommandPalette {...props} />);
  return props;
}

function searchInput(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Rechercher une commande ou un prompt' });
}

describe('CommandPalette', () => {
  it('filters commands without case or accent sensitivity and runs the active one', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'REGLAGES');

    expect(screen.getByRole('option', { name: /Réglages/ })).toBeVisible();
    await user.keyboard('{Enter}');

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onShowSettings).toHaveBeenCalled();
  });

  it('opens a prompt by title', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'synthese');
    await user.keyboard('{Enter}');

    expect(props.onOpenPrompt).toHaveBeenCalledWith(analysisPrompt);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('matches prompts with an approximate query', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'synr');
    await user.keyboard('{Enter}');

    expect(props.onOpenPrompt).toHaveBeenCalledWith(analysisPrompt);
  });

  it('cycles options with the arrow keys', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(props.onShowLibrary).toHaveBeenCalled();
  });

  it('copies and edits a prompt from the quick actions', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    const promptRow = screen.getByRole('option', { name: /Synthèse de réunion/ }).parentElement;
    expect(promptRow).not.toBeNull();

    const actions = promptRow ? within(promptRow).getAllByRole('button') : [];
    expect(actions.map((button) => button.textContent)).toEqual(['Copier', 'Éditer']);

    await user.click(actions[0]);
    expect(props.onCopyPrompt).toHaveBeenCalledWith(analysisPrompt);

    await user.click(actions[1]);
    expect(props.onEditPrompt).toHaveBeenCalledWith(analysisPrompt);
  });

  it('copies the highlighted prompt with the Alt+C shortcut', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.keyboard('{Alt>}c{/Alt}');

    expect(props.onCopyPrompt).toHaveBeenCalledWith(analysisPrompt);
  });

  it('exposes the library actions', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'exporter');
    await user.keyboard('{Enter}');

    expect(props.onExportLibrary).toHaveBeenCalled();
  });

  it('changes the sort order from the palette', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'plus utilisés');
    await user.keyboard('{Enter}');

    expect(props.onSortChange).toHaveBeenCalledWith('usage');
  });

  it('closes with Escape and shows an empty state for unknown queries', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'zzzz');
    expect(screen.getByRole('status')).toHaveTextContent('Aucune commande');
    await user.keyboard('{Escape}');

    expect(props.onClose).toHaveBeenCalled();
  });

  it('runs the statistics command', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(searchInput(), 'statistiques');
    await user.keyboard('{Enter}');

    expect(props.onShowStatistics).toHaveBeenCalledExactlyOnceWith();
    expect(props.onClose).toHaveBeenCalled();
  });
});
