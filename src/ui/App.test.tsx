import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

import type { Prompt } from '../domain/types';
import { createMemoryAdapter } from '../storage/memoryAdapter';
import type { StorageAdapter } from '../storage/storageAdapter';
import App from './App';

describe('Prompt Diary prompt library', () => {
  it('loads prompts through the injected adapter and shows the empty state', async () => {
    render(<App storage={createMemoryAdapter()} />);

    expect(screen.getByRole('status', { name: 'Chargement des prompts…' })).toBeVisible();
    expect(await screen.findByText('Aucun prompt enregistré')).toBeVisible();
  });

  it('renders prompts already stored in the injected adapter', async () => {
    const storedPrompt: Prompt = {
      id: 'prompt-1',
      title: 'Synthèse de réunion',
      body: 'Agis comme un assistant. Fais une synthèse en tableau.',
      tags: ['réunion'],
      model: 'GPT',
      context: 'Compte rendu interne',
      rating: 4,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };

    render(<App storage={createMemoryAdapter([storedPrompt])} />);

    expect(await screen.findByRole('heading', { name: 'Synthèse de réunion' })).toBeVisible();
    expect(screen.getByText('réunion')).toBeVisible();
  });

  it('shows an error when loading the library fails', async () => {
    const adapter = createMemoryAdapter();
    const failingAdapter: StorageAdapter = {
      ...adapter,
      list: async () => {
        throw new Error('Storage unavailable');
      },
    };

    render(<App storage={failingAdapter} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les prompts.',
    );
  });

  it('creates a prompt, persists it, and displays the vague badge', async () => {
    const user = userEvent.setup();
    const adapter = createMemoryAdapter();
    render(<App storage={adapter} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));

    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toBeVisible();
    await user.type(screen.getByLabelText('Titre'), 'Analyse de document');
    await user.type(screen.getByLabelText('Corps du prompt'), 'Analyse ce document');
    await user.type(screen.getByLabelText('Tags'), 'analyse, document');
    await user.type(screen.getByLabelText('Modèle'), 'Claude');
    await user.type(screen.getByLabelText('Contexte'), 'Pour préparer une synthèse');
    await user.selectOptions(screen.getByLabelText('Note'), '5');

    expect(screen.getByText('À préciser')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Enregistrer le prompt' }));

    expect(await screen.findByRole('heading', { name: 'Analyse de document' })).toBeVisible();
    expect(screen.getByText('À préciser')).toBeVisible();
    expect(screen.getByText('analyse')).toBeVisible();
    await waitFor(async () => {
      await expect(adapter.list()).resolves.toHaveLength(1);
    });
  });

  it('keeps the editor open and reports validation errors for an invalid draft', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer le prompt' }));

    expect(screen.getByText('Le titre est obligatoire.')).toBeVisible();
    expect(screen.getByText('Le corps du prompt est obligatoire.')).toBeVisible();
    expect(screen.getByText('La note doit être un entier entre 1 et 5.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toBeVisible();
  });
});
