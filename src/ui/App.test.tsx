import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import type { Prompt } from '../domain/types';
import { exportPrompts } from '../domain/importExport';
import { createMemoryAdapter } from '../storage/memoryAdapter';
import type { StorageAdapter } from '../storage/storageAdapter';
import { variableValuesKey } from '../storage/storageAdapter';
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
    await user.click(screen.getByRole('button', { name: 'Tag : #analyse' }));
    await user.click(screen.getByRole('button', { name: 'Note minimale : 5+' }));
    expect(screen.getByRole('heading', { name: 'Analyse de document' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Réponse client' })).not.toBeInTheDocument();
  });

  it('filters favorites only and sorts the library by title', async () => {
    const user = userEvent.setup();
    const alphaPrompt: Prompt = {
      id: 'alpha',
      title: 'Alpha',
      body: 'Première formulation.',
      tags: [],
      model: '',
      context: '',
      rating: 4,
      favorite: true,
      copyCount: 1,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z',
    };
    const betaPrompt: Prompt = {
      id: 'beta',
      title: 'Beta',
      body: 'Deuxième formulation.',
      tags: [],
      model: '',
      context: '',
      rating: 5,
      favorite: false,
      copyCount: 3,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-03T10:00:00.000Z',
    };

    render(<App storage={createMemoryAdapter([betaPrompt, alphaPrompt])} />);
    expect(await screen.findByRole('heading', { name: 'Alpha' })).toBeVisible();

    await user.selectOptions(screen.getByLabelText('Trier par'), 'title');
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Alpha', 'Beta']);

    await user.click(screen.getByRole('button', { name: /^Favoris/ }));
    expect(screen.getByRole('heading', { name: 'Alpha' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Beta' })).not.toBeInTheDocument();
  });

  it('shows local statistics and opens a top prompt from the ranking', async () => {
    const user = userEvent.setup();
    const topPrompt: Prompt = {
      id: 'top',
      title: 'Réponse client',
      body: 'Rédige une réponse professionnelle.',
      tags: ['email'],
      model: 'GPT',
      context: 'Email',
      rating: 5,
      favorite: true,
      copyCount: 3,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const unusedPrompt: Prompt = {
      ...topPrompt,
      id: 'unused',
      title: 'Brouillon jamais copié',
      favorite: false,
      rating: 2,
      copyCount: 0,
    };

    render(<App storage={createMemoryAdapter([topPrompt, unusedPrompt])} />);
    await screen.findByRole('heading', { name: 'Réponse client' });

    await user.click(screen.getByRole('button', { name: 'Statistiques' }));

    expect(await screen.findByRole('heading', { name: 'Statistiques' })).toBeVisible();
    expect(screen.getByText('3,5 / 5')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Les plus utilisés' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Jamais copiés' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Réponse client/ }));
    expect(await screen.findByRole('heading', { name: 'Réponse client' })).toBeVisible();
  });

  it('explains that statistics need prompts', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Statistiques' }));

    expect(
      await screen.findByRole('heading', { name: 'Rien à mesurer pour l’instant' }),
    ).toBeVisible();
  });

  it('shows relative usage dates in the prompt detail', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const prompt: Prompt = {
      id: 'dated',
      title: 'Analyse de document',
      body: 'Analyse ce document.',
      tags: [],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 2,
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-20T12:00:00.000Z',
      lastUsedAt: '2026-10-21T09:00:00.000Z',
    };

    render(<App storage={createMemoryAdapter([prompt])} />);
    await screen.findByRole('heading', { name: 'Analyse de document' });
    await user.click(screen.getByRole('button', { name: 'Ouvrir Analyse de document' }));

    expect(await screen.findByText('il y a 3 h')).toBeVisible();
    expect(screen.getByText('il y a 1 j')).toBeVisible();
    vi.useRealTimers();
  });

  it('orders the tag filters by usage', async () => {
    const basePrompt: Prompt = {
      id: 'base',
      title: 'Analyse de document',
      body: 'Analyse ce document.',
      tags: ['rare'],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const commonPrompt: Prompt = {
      ...basePrompt,
      id: 'common',
      title: 'Réponse client',
      tags: ['fréquent'],
    };

    render(<App storage={createMemoryAdapter([basePrompt, commonPrompt])} />);
    await screen.findByRole('heading', { name: 'Analyse de document' });

    const tagButtons = screen.getAllByRole('button', { name: /^Tag : #/ });
    expect(tagButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Tag : #fréquent',
      'Tag : #rare',
    ]);
  });

  it('lists the keyboard shortcuts in the settings screen', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Réglages' }));

    expect(await screen.findByRole('heading', { name: 'Raccourcis clavier' })).toBeVisible();
    expect(screen.getByText('Ouvrir la palette de commandes')).toBeVisible();
    expect(screen.getByText('Ctrl + K')).toBeVisible();
  });

  it('applies a coach correction in one click and undoes it', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    const body = screen.getByLabelText('Corps du prompt');
    await user.type(body, 'Rédige un texte.');

    const correctButtons = await screen.findAllByRole('button', { name: 'Corriger' });
    expect(correctButtons.length).toBeGreaterThan(0);
    await user.click(correctButtons[0]);

    expect(body).toHaveValue('Agis comme [expert du domaine].\n\nRédige un texte.');
    expect(await screen.findByRole('status')).toHaveTextContent('Correction appliquée');

    await user.click(screen.getByRole('button', { name: 'Annuler la correction' }));
    expect(body).toHaveValue('Rédige un texte.');
    expect(await screen.findByRole('status')).toHaveTextContent('Correction annulée');
  });

  it('opens the palette from the header and copies a prompt from it', async () => {
    const user = userEvent.setup();
    const prompt: Prompt = {
      id: 'analysis',
      title: 'Analyse de document',
      body: 'Analyse ce document.',
      tags: ['analyse'],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };

    render(<App storage={createMemoryAdapter([prompt])} />);
    await screen.findByRole('heading', { name: 'Analyse de document' });

    await user.click(screen.getByRole('button', { name: /Ouvrir la palette de commandes/ }));
    const input = await screen.findByRole('combobox', {
      name: 'Rechercher une commande ou un prompt',
    });
    await user.type(input, 'analyse');
    await user.keyboard('{Alt>}c{/Alt}');

    expect(await screen.findByRole('status')).toHaveTextContent('Prompt copié');
    await screen.findByText('copié 1×');
  });

  it('assigns a collection from the editor and filters the library with it', async () => {
    const user = userEvent.setup();
    const adapter = createMemoryAdapter();
    render(<App storage={adapter} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    await user.type(screen.getByLabelText('Titre'), 'Relance client');
    await user.type(screen.getByLabelText('Corps du prompt'), 'Relance le client.');
    await user.selectOptions(screen.getByLabelText('Note'), '4');
    await user.selectOptions(screen.getByLabelText('Collection'), 'Nouvelle collection…');
    await user.type(screen.getByLabelText('Nom de la nouvelle collection'), 'Client Dupont');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Enregistrer le prompt' }));

    expect(await screen.findByRole('heading', { name: 'Relance client' })).toBeVisible();
    expect(screen.getAllByText('Client Dupont').length).toBeGreaterThan(0);

    const collectionButton = screen.getByRole('button', { name: /^Client Dupont/ });
    expect(collectionButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(collectionButton);

    expect(collectionButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Relance client' })).toBeVisible();
  });

  it('renames a collection for every prompt and detaches it on delete', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const prompt: Prompt = {
      id: 'client',
      title: 'Relance client',
      body: 'Relance le client.',
      tags: [],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
      collection: 'Client Dupont',
    };
    const adapter = createMemoryAdapter([prompt]);
    render(<App storage={adapter} />);

    await screen.findByRole('heading', { name: 'Relance client' });
    await user.click(screen.getByRole('button', { name: 'Gérer les collections' }));

    const input = await screen.findByLabelText(/Client Dupont/);
    await user.clear(input);
    await user.type(input, 'Client Durand');
    await user.click(screen.getByRole('button', { name: 'Renommer' }));

    await screen.findByText(/Collection « Client Dupont » renommée/);
    expect(screen.getByRole('button', { name: /^Client Durand/ })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    await screen.findByText(/Collection « Client Durand » supprimée/);

    expect(screen.queryByRole('button', { name: /^Client Durand/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Relance client' })).toBeVisible();
    confirm.mockRestore();
  });

  it('filters unused prompts and finds a prompt with an approximate query', async () => {
    const user = userEvent.setup();
    const usedPrompt: Prompt = {
      id: 'used',
      title: 'Relance client',
      body: 'Prépare une relance commerciale.',
      tags: [],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 2,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
      lastUsedAt: '2026-10-20T12:00:00.000Z',
    };
    const unusedPrompt: Prompt = {
      ...usedPrompt,
      id: 'unused',
      title: 'Plan de seminar',
      body: 'Construis un plan de séminaire.',
      copyCount: 0,
      lastUsedAt: undefined,
    };

    render(<App storage={createMemoryAdapter([usedPrompt, unusedPrompt])} />);
    await screen.findByRole('heading', { name: 'Relance client' });

    await user.click(screen.getByRole('button', { name: 'Jamais utilisés' }));
    expect(screen.getByRole('heading', { name: 'Plan de seminar' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Relance client' })).not.toBeInTheDocument();
    expect(screen.getByText('1 résultat')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Jamais utilisés' }));
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher dans les prompts' }), 'rlc');

    expect(screen.getByRole('heading', { name: 'Relance client' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Plan de seminar' })).not.toBeInTheDocument();
  });

  it('warns about a similar prompt before saving', async () => {
    const user = userEvent.setup();
    const existing: Prompt = {
      id: 'relance',
      title: 'Relance client commercial',
      body: 'Rédige une relance professionnelle pour un client qui n’a pas répondu depuis trois semaines.',
      tags: [],
      model: '',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };

    render(<App storage={createMemoryAdapter([existing])} />);
    await screen.findByRole('heading', { name: 'Relance client commercial' });

    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    await user.type(screen.getByLabelText('Titre'), 'Relance client commerciale');
    await user.type(
      screen.getByLabelText('Corps du prompt'),
      'Rédige une relance professionnelle pour un client qui n’a pas répondu depuis trois semaines.',
    );

    expect(await screen.findByText(/Similaire à « Relance client commercial »/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enregistrer quand même' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Voir' }));
    expect(screen.getAllByText(/Rédige une relance professionnelle/).length).toBeGreaterThan(1);
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
    await expect(adapter.get('detail')).resolves.toMatchObject({
      copyCount: 5,
      usageLog: [expect.any(String)],
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Prompt copié');
    expect(screen.getByText('Historique d’utilisation (1)')).toBeVisible();
    expect(screen.getByText(/Dernière utilisation/)).toBeVisible();
  });

  it('fills a dynamic prompt, persists its values, and restores them when reopened', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const prompt: Prompt = {
      id: 'dynamic',
      title: 'Réponse personnalisée',
      body: 'Réponds à {{client}} avec un ton {{ton}}.',
      tags: [],
      model: 'GPT',
      context: '',
      rating: 4,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const adapter = createMemoryAdapter([prompt]);

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'Réponse personnalisée' });
    expect(screen.getByText('2 variables')).toBeVisible();

    const useButton = screen.getByRole('button', { name: 'Utiliser' });
    await user.click(useButton);
    expect(await screen.findByRole('dialog')).toBeVisible();
    const clientInput = await screen.findByLabelText('client');
    expect(clientInput).toHaveFocus();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);

    await user.type(clientInput, 'Acme');
    await user.type(screen.getByLabelText('ton'), 'direct');
    await user.click(screen.getByRole('button', { name: 'Copier le prompt rempli' }));

    expect(writeText).toHaveBeenCalledWith('Réponds à Acme avec un ton direct.');
    await waitFor(async () => {
      const savedPrompt = await adapter.get('dynamic');
      expect(savedPrompt).toMatchObject({
        copyCount: 1,
        lastUsedAt: expect.any(String),
        usageLog: [expect.any(String)],
      });
      expect(savedPrompt?.updatedAt).toBe(savedPrompt?.lastUsedAt);
      await expect(adapter.getValue(variableValuesKey('dynamic'))).resolves.toEqual({
        client: 'Acme',
        ton: 'direct',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Prompt rempli copié');

    await user.click(screen.getByRole('button', { name: 'Utiliser' }));
    expect(await screen.findByDisplayValue('Acme')).toBeVisible();
    expect(screen.getByDisplayValue('direct')).toBeVisible();
  });

  it('updates the editor variable indicator on every body change', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    const body = screen.getByLabelText('Corps du prompt');
    fireEvent.change(body, {
      target: { value: 'Bonjour {{client}}, avec un ton {{ton}}.' },
    });
    expect(screen.getByText('2 variables détectées : client, ton')).toBeVisible();
    await user.clear(body);
    fireEvent.change(body, { target: { value: 'Bonjour {{client}}.' } });
    expect(screen.getByText('1 variable détectée : client')).toBeVisible();
    expect(screen.queryByText('2 variables détectées : client, ton')).not.toBeInTheDocument();
  });

  it('supports Escape and Enter in the variable modal', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const prompt: Prompt = {
      id: 'keyboard-dynamic',
      title: 'Prompt clavier',
      body: 'Bonjour {{client}}.',
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

    render(<App storage={adapter} />);
    await screen.findByRole('heading', { name: 'Prompt clavier' });
    const useButton = screen.getByRole('button', { name: 'Utiliser' });
    await user.click(useButton);
    await screen.findByLabelText('client');
    const closeButton = screen.getByRole('button', { name: 'Fermer' });
    const submitButton = screen.getByRole('button', { name: 'Copier le prompt rempli' });

    submitButton.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    closeButton.focus();
    await user.tab({ shift: true });
    expect(submitButton).toHaveFocus();

    closeButton.focus();
    await user.keyboard('n');
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Nouveau prompt' })).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useButton).toHaveFocus();

    await user.click(useButton);
    const clientInput = await screen.findByLabelText('client');
    await user.type(clientInput, 'Acme');
    await user.keyboard('{Enter}');
    expect(writeText).toHaveBeenCalledWith('Bonjour Acme.');
    expect(await screen.findByRole('status')).toHaveTextContent('Prompt rempli copié');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the editor with the n keyboard shortcut', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.keyboard('n');

    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toHaveFocus();
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
    expect(screen.getByRole('heading', { name: 'Vos prompts' })).toHaveFocus();
  });

  it('opens the command palette and navigates to examples', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.keyboard('{Control>}k{/Control}');

    const input = await screen.findByRole('combobox', {
      name: 'Rechercher une commande ou un prompt',
    });
    expect(input).toHaveFocus();
    await user.type(input, 'exemples');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: /Bibliothèque d.exemples/ })).toBeVisible();
  });

  it('asks before leaving an unsaved draft', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Nouveau prompt' }));
    await user.type(screen.getByLabelText('Titre'), 'Brouillon non enregistré');
    await user.keyboard('{Escape}');

    expect(confirm).toHaveBeenCalledWith('Abandonner les modifications non enregistrées ?');
    expect(screen.getByRole('heading', { name: 'Nouveau prompt' })).toBeVisible();

    confirm.mockReturnValue(true);
    await user.keyboard('{Escape}');

    expect(await screen.findByText('Aucun prompt enregistré')).toBeVisible();
    confirm.mockRestore();
  });

  it('shows the quality coach while writing and opens the examples screen', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
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
    expect(confirm).toHaveBeenCalledWith('Abandonner les modifications non enregistrées ?');
    confirm.mockRestore();
  });

  it('filters the example library and imports one example with its source tag', async () => {
    const user = userEvent.setup();
    const adapter = createMemoryAdapter();
    render(<App storage={adapter} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Exemples' }));
    expect(await screen.findByRole('heading', { name: 'Bibliothèque d’exemples' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Code' }));
    expect(screen.getByText('2 résultats')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Relire un module TypeScript' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Ajouter Relire un module TypeScript' }));

    expect(await screen.findByText('1 ajoutés, 0 déjà présents')).toBeVisible();
    await expect(adapter.list()).resolves.toHaveLength(1);
    await expect(adapter.list()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Relire un module TypeScript',
          tags: expect.arrayContaining(['exemple']),
        }),
      ]),
    );
  });

  it('opens an example detail view and closes the library with Escape', async () => {
    const user = userEvent.setup();
    render(<App storage={createMemoryAdapter()} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Exemples' }));
    await user.click(screen.getAllByRole('button', { name: 'Voir' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'Rédiger un email professionnel clair' }),
    ).toBeVisible();
    expect(screen.getByText('Corps du prompt')).toBeVisible();
    expect(
      screen.getByText(
        'Réponse à un client ou à un collègue lorsque les informations sont encore sous forme de notes.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ajouter à ma bibliothèque' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(screen.getByText('Aucun prompt enregistré')).toBeVisible();
  });

  it('confirms and imports all bundled examples', async () => {
    const user = userEvent.setup();
    const adapter = createMemoryAdapter();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App storage={adapter} />);

    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Exemples' }));
    await user.click(screen.getByRole('button', { name: 'Tout ajouter' }));

    expect(confirm).toHaveBeenCalledWith('Ajouter 12 exemples à votre bibliothèque ?');
    expect(await screen.findByText('12 ajoutés, 0 déjà présents')).toBeVisible();
    await expect(adapter.list()).resolves.toHaveLength(12);
    confirm.mockRestore();
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
      lastUsedAt: '2026-10-19T13:00:00.000Z',
      usageLog: ['2026-10-19T13:00:00.000Z'],
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
    const duplicate = (await adapter.list()).find((candidate) =>
      candidate.title.endsWith('(copie)'),
    );
    expect(duplicate).toMatchObject({ copyCount: 0 });
    expect(duplicate?.lastUsedAt).toBeUndefined();
    expect(duplicate?.usageLog).toBeUndefined();
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
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:prompt-diary'));
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

  it('reloads the real storage state when an import fails halfway through', async () => {
    const user = userEvent.setup();
    const baseAdapter = createMemoryAdapter();
    let saveCount = 0;
    const adapter: StorageAdapter = {
      ...baseAdapter,
      save: async (prompt) => {
        saveCount += 1;
        if (saveCount === 2) {
          throw new Error('quota exceeded');
        }
        return baseAdapter.save(prompt);
      },
    };
    const first: Prompt = {
      id: 'first',
      title: 'Premier importé',
      body: 'Premier corps.',
      tags: [],
      model: '',
      context: '',
      rating: 3,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const second = { ...first, id: 'second', title: 'Second importé' };

    render(<App storage={adapter} />);
    await screen.findByText('Aucun prompt enregistré');
    await user.click(screen.getByRole('button', { name: 'Réglages' }));
    const file = new File([exportPrompts([first, second])], 'partial.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Importer une bibliothèque JSON'), file);

    expect(await screen.findByRole('status')).toHaveTextContent('Import interrompu');
    await expect(adapter.list()).resolves.toHaveLength(1);
    expect(await screen.findByRole('heading', { name: 'Premier importé' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Second importé' })).not.toBeInTheDocument();
  });

  it('recovers from a storage load error by resetting local data', async () => {
    const user = userEvent.setup();
    const prompt: Prompt = {
      id: 'unreadable',
      title: 'Illisible',
      body: 'Corps.',
      tags: [],
      model: '',
      context: '',
      rating: 3,
      favorite: false,
      copyCount: 0,
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };
    const baseAdapter = createMemoryAdapter([prompt]);
    const adapter: StorageAdapter = {
      ...baseAdapter,
      list: vi
        .fn()
        .mockRejectedValueOnce(new Error('corrupted database'))
        .mockImplementation(() => baseAdapter.list()),
    };
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App storage={adapter} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les prompts.',
    );
    await user.click(screen.getByRole('button', { name: 'Réinitialiser le stockage local' }));

    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByText('Aucun prompt enregistré')).toBeVisible();
    await expect(adapter.list()).resolves.toEqual([]);
    confirm.mockRestore();
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
