import { render, screen } from '@testing-library/react';
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
    onShowLibrary: vi.fn(),
    onShowExamples: vi.fn(),
    onShowSettings: vi.fn(),
    ...overrides,
  };

  render(<CommandPalette {...props} />);
  return props;
}

describe('CommandPalette', () => {
  it('filters commands without case or accent sensitivity and runs the active one', async () => {
    const user = userEvent.setup();
    const props = renderPalette();
    const input = screen.getByRole('combobox', {
      name: 'Rechercher une commande ou un prompt',
    });

    await user.type(input, 'REGLAGES');

    expect(screen.getByRole('option', { name: /Réglages/ })).toBeVisible();
    await user.keyboard('{Enter}');

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onShowSettings).toHaveBeenCalled();
  });

  it('opens a prompt by title', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.type(
      screen.getByRole('combobox', { name: 'Rechercher une commande ou un prompt' }),
      'synthese',
    );
    await user.keyboard('{Enter}');

    expect(props.onOpenPrompt).toHaveBeenCalledWith(analysisPrompt);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('cycles options with the arrow keys', async () => {
    const user = userEvent.setup();
    const props = renderPalette();

    await user.keyboard('{ArrowDown}{Enter}');

    expect(props.onShowLibrary).toHaveBeenCalled();
  });

  it('closes with Escape and shows an empty state for unknown queries', async () => {
    const user = userEvent.setup();
    const props = renderPalette();
    const input = screen.getByRole('combobox', {
      name: 'Rechercher une commande ou un prompt',
    });

    await user.type(input, 'zzzz');
    expect(screen.getByRole('status')).toHaveTextContent('Aucune commande');
    await user.keyboard('{Escape}');

    expect(props.onClose).toHaveBeenCalled();
  });
});
