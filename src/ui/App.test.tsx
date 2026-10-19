import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import type { Prompt } from '../domain/types';
import { exportPrompts } from '../domain/importExport';
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
    const user = userEvent.setup();
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

    const search = screen.getByRole('searchbox', { name: 'Rechercher dans les prompts' });
    await user.type(search, 'synthèse');
    expect(screen.getByText('Synthèse', { selector: 'mark' })).toBeVisible();
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
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible();
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

  it('searches and combines tag and minimum rating filters', async () => {
    const user = userEvent.setup();
    const analysisPrompt: Prompt = {
      id: 'analysis',
      title: 'Analyse de document',
      body: 'Analyse ce document.',
      tags: ['analyse'],
      model: 'Claude',
      context: 'Synthèse',
      rating: 5,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const emailPrompt = {
      ...analysisPrompt,
      id: 'email',
      title: 'Réponse client',
      body: 'Rédige une réponse client.',
      tags: ['email'],
      rating: 3 as const,
    };

    render(<App storage={createMemoryAdapter([analysisPrompt, emailPrompt])} />);
    expect(await screen.findByRole('heading', { name: 'Analyse de document' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Réponse client' })).toBeVisible();

    await user.type(
      screen.getByRole('searchbox', { name: 'Rechercher dans les prompts' }),
      'analyse',
    );
    expect(screen.getByRole('heading', { name: 'Analyse de document' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Réponse client' })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Rechercher dans les prompts' }));
    await user.click(screen.getByRole('button', { name: 'Tag : analyse' }));
    await user.click(screen.getByRole('button', { name: 'Note minimale : 5+' }));
    expect(screen.getByRole('heading', { name: 'Analyse de document' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Réponse client' })).not.toBeInTheDocument();
  });

  it('toggles a favorite and keeps favorites before other prompts', async () => {
    const user = userEvent.setup();
    const firstPrompt: Prompt = {
      id: 'first',
      title: 'Premier prompt',
      body: 'Premier corps.',
      tags: [],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 8,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const secondPrompt = { ...firstPrompt, id: 'second', title: 'Deuxième prompt', copyCount: 1 };
    const adapter = createMemoryAdapter([firstPrompt, secondPrompt]);

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'Premier prompt' });
    await user.click(screen.getByRole('button', { name: 'Ajouter Premier prompt aux favoris' }));

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Premier prompt',
      'Deuxième prompt',
    ]);
    await expect(adapter.get('first')).resolves.toMatchObject({ favorite: true });
  });

  it('opens details, copies the body, increments usage, and shows a toast', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const prompt: Prompt = {
      id: 'detail',
      title: 'Prompt détaillé',
      body: 'Corps complet à copier.',
      tags: [],
      model: 'GPT',
      context: 'Contexte',
      rating: 5,
      favorite: false,
      copyCount: 4,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const adapter = createMemoryAdapter([prompt]);

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'Prompt détaillé' });
    await user.click(screen.getByRole('button', { name: 'Ouvrir Prompt détaillé' }));
    expect(screen.getByText('Corps complet à copier.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Copier le prompt' }));

    expect(writeText).toHaveBeenCalledWith('Corps complet à copier.');
    await expect(adapter.get('detail')).resolves.toMatchObject({ copyCount: 5 });
    expect(await screen.findByRole('status')).toHaveTextContent('Prompt copié');
  });

  it('opens the editor with the n keyboard shortcut', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.keyboard('n');

    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toBeVisible();
  });

  it('focuses search with slash and closes the editor with Escape', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.keyboard('/');
    expect(screen.getByRole('searchbox', { name: 'Rechercher dans les prompts' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.getByText('Aucun prompt enregistré')).toBeVisible();
  });

  it('shows the quality coach while writing and opens the examples screen', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    fireEvent.change(screen.getByLabelText('Corps du prompt'), {
      target: {
        value:
          'Agis comme un analyste senior. Contexte : une équipe produit prépare une décision. Analyse ce document et réponds sous forme de tableau. Ton clair, ne pas inventer.',
      },
    });

    expect(await screen.findByText('Qualité : 6/6')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Exemples' }));
    expect(screen.getByRole('heading', { name: 'Exemples de prompts' })).toBeVisible();
  });

  it('supports detail actions for editing, duplicating, and deleting', async () => {
    const user = userEvent.setup();
    const prompt: Prompt = {
      id: 'actions',
      title: 'Prompt actions',
      body: 'Analyse ce contenu.',
      tags: ['test'],
      model: 'GPT',
      context: 'Test des actions',
      rating: 4,
      favorite: false,
      copyCount: 2,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const adapter = createMemoryAdapter([prompt]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'Prompt actions' });
    await user.click(screen.getByRole('button', { name: 'Ouvrir Prompt actions' }));
    await user.click(screen.getByRole('button', { name: 'Éditer' }));
    expect(screen.getByRole('heading', { name: 'Modifier le prompt' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    await user.click(screen.getByRole('button', { name: 'Ouvrir Prompt actions' }));
    await user.click(screen.getByRole('button', { name: 'Dupliquer' }));
    expect(await screen.findByRole('heading', { name: 'Prompt actions (copie)' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Prompt actions' })).toBeVisible();
    await expect(adapter.list()).resolves.toHaveLength(1);
    confirm.mockRestore();
  });

  it('exports a versioned JSON file from settings', async () => {
    const user = userEvent.setup();
    const prompt: Prompt = {
      id: 'exported',
      title: 'Exporté',
      body: 'Corps exporté.',
      tags: [],
      model: '',
      context: '',
      rating: 5,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const createObjectURL = vi.fn().mockReturnValue('blob:prompt-diary');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(<App storage={createMemoryAdapter([prompt])} />);
    await screen.findByRole('heading', { name: 'Exporté' });
    await user.click(screen.getByRole('button', { name: 'Réglages' }));
    await user.click(screen.getByRole('button', { name: 'Exporter la bibliothèque' }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(exportPrompts([prompt])).toContain('"version": 1');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:prompt-diary');
    vi.unstubAllGlobals();
    click.mockRestore();
  });

  it('imports a JSON library and reports added and ignored prompts', async () => {
    const user = userEvent.setup();
    const existing: Prompt = {
      id: 'existing',
      title: 'Existant',
      body: 'Déjà là.',
      tags: [],
      model: '',
      context: '',
      rating: 3,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const added = { ...existing, id: 'added', title: 'Ajouté' };
    const adapter = createMemoryAdapter([existing]);

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'Existant' });
    await user.click(screen.getByRole('button', { name: 'Réglages' }));
    const file = new File([exportPrompts([existing, added])], 'prompts.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Importer une bibliothèque JSON'), file);

    expect(await screen.findByRole('status')).toHaveTextContent('1 ajoutés / 1 ignorés');
    await expect(adapter.list()).resolves.toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Ajouté' })).toBeVisible();
  });

  it('clears the library from settings after confirmation', async () => {
    const user = userEvent.setup();
    const prompt: Prompt = {
      id: 'clearable',
      title: 'À effacer',
      body: 'Prompt temporaire.',
      tags: [],
      model: '',
      context: '',
      rating: 3,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const adapter = createMemoryAdapter([prompt]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'À effacer' });
    await user.click(screen.getByRole('button', { name: 'Réglages' }));
    await user.click(screen.getByRole('button', { name: 'Effacer tout' }));

    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Votre carnet de prompts' })).toBeVisible();
    await expect(adapter.list()).resolves.toEqual([]);
    confirm.mockRestore();
  });

  it('shows the local-only guarantee and a clear no-results state', async () => {
    const user = userEvent.setup();
    const prompt: Prompt = {
      id: 'searchable',
      title: 'Prompt searchable',
      body: 'Un contenu existant.',
      tags: [],
      model: '',
      context: '',
      rating: 3,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    render(<App storage={createMemoryAdapter([prompt])} />);

    expect(await screen.findByText('Tout est local, rien ne part sur un serveur.')).toBeVisible();
    await user.type(
      screen.getByRole('searchbox', { name: 'Rechercher dans les prompts' }),
      'inexistant',
    );

    expect(screen.getByText('Aucun résultat')).toBeVisible();
  });
});
