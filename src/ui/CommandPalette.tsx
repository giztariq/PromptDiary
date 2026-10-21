import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { fuzzyMatch, searchableText } from '../domain/search';
import type { SortOption } from '../domain/sort';
import type { Prompt } from '../domain/types';

interface CommandPaletteProps {
  prompts: Prompt[];
  onClose: () => void;
  onCreate: () => void;
  onOpenPrompt: (prompt: Prompt) => void;
  onCopyPrompt: (prompt: Prompt) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onShowLibrary: () => void;
  onShowExamples: () => void;
  onShowSettings: () => void;
  onShowStatistics: () => void;
  onExportLibrary: () => void;
  onImportLibrary: () => void;
  onSortChange: (sort: SortOption) => void;
}

interface PaletteAction {
  kind: 'action';
  id: string;
  label: string;
  hint: string;
  shortcut?: string;
  run: () => void;
}

interface PalettePrompt {
  kind: 'prompt';
  id: string;
  prompt: Prompt;
  label: string;
  hint: string;
}

type PaletteEntry = PaletteAction | PalettePrompt;

const MAX_PROMPTS = 6;

export function CommandPalette({
  prompts,
  onClose,
  onCreate,
  onOpenPrompt,
  onCopyPrompt,
  onEditPrompt,
  onShowLibrary,
  onShowExamples,
  onShowSettings,
  onShowStatistics,
  onExportLibrary,
  onImportLibrary,
  onSortChange,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const listboxId = useId();

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  const { actions, promptEntries } = useMemo(() => {
    const actionEntries: PaletteAction[] = [
      {
        kind: 'action',
        id: 'new',
        label: 'Nouveau prompt',
        hint: 'Créer',
        shortcut: 'N',
        run: onCreate,
      },
      {
        kind: 'action',
        id: 'library',
        label: 'Bibliothèque',
        hint: 'Tous les prompts',
        run: onShowLibrary,
      },
      {
        kind: 'action',
        id: 'examples',
        label: 'Exemples',
        hint: 'Bibliothèque locale',
        run: onShowExamples,
      },
      {
        kind: 'action',
        id: 'statistics',
        label: 'Statistiques',
        hint: 'Vue d’ensemble',
        run: onShowStatistics,
      },
      {
        kind: 'action',
        id: 'settings',
        label: 'Réglages',
        hint: 'Import / export',
        run: onShowSettings,
      },
      {
        kind: 'action',
        id: 'export',
        label: 'Exporter la bibliothèque',
        hint: 'Sauvegarde JSON',
        run: onExportLibrary,
      },
      {
        kind: 'action',
        id: 'import',
        label: 'Importer une bibliothèque',
        hint: 'Fichier JSON',
        run: onImportLibrary,
      },
      {
        kind: 'action',
        id: 'sort-recent',
        label: 'Trier par nouveautés',
        hint: 'Récents',
        run: () => onSortChange('recent'),
      },
      {
        kind: 'action',
        id: 'sort-usage',
        label: 'Trier par les plus utilisés',
        hint: 'Copies',
        run: () => onSortChange('usage'),
      },
      {
        kind: 'action',
        id: 'sort-rating',
        label: 'Trier par mieux notés',
        hint: 'Note',
        run: () => onSortChange('rating'),
      },
    ];

    const normalizedQuery = query.trim();
    const matchingPrompts = normalizedQuery
      ? prompts.filter((prompt) => fuzzyMatch(normalizedQuery, searchableText(prompt)))
      : prompts;

    const matchingActions = normalizedQuery
      ? actionEntries.filter((action) =>
          fuzzyMatch(normalizedQuery, `${action.label} ${action.hint}`),
        )
      : actionEntries;

    const promptItems: PalettePrompt[] = matchingPrompts.slice(0, MAX_PROMPTS).map((prompt) => ({
      kind: 'prompt',
      id: `prompt-${prompt.id}`,
      prompt,
      label: prompt.title,
      hint: prompt.tags.length > 0 ? prompt.tags.map((tag) => `#${tag}`).join(' ') : 'Sans tag',
    }));

    return { actions: matchingActions, promptEntries: promptItems };
  }, [
    onCreate,
    onEditPrompt,
    onExportLibrary,
    onImportLibrary,
    onShowExamples,
    onShowLibrary,
    onShowSettings,
    onShowStatistics,
    onSortChange,
    prompts,
    query,
  ]);

  const entries: PaletteEntry[] = [...promptEntries, ...actions];
  const activeEntry = entries[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= entries.length) {
      setActiveIndex(Math.max(entries.length - 1, 0));
    }
  }, [activeIndex, entries.length]);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, entries.length, listboxId]);

  function runEntry(entry: PaletteEntry | undefined) {
    if (!entry) {
      return;
    }

    onClose();

    if (entry.kind === 'prompt') {
      onOpenPrompt(entry.prompt);
      return;
    }

    entry.run();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (entries.length === 0 ? 0 : (index + 1) % entries.length));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) =>
        entries.length === 0 ? 0 : (index - 1 + entries.length) % entries.length,
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runEntry(activeEntry);
      return;
    }

    if (event.altKey && activeEntry?.kind === 'prompt') {
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        onClose();
        onCopyPrompt(activeEntry.prompt);
        return;
      }

      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        onClose();
        onEditPrompt(activeEntry.prompt);
      }
    }
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements || focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function renderEntry(entry: PaletteEntry, index: number) {
    const active = index === activeIndex;
    const optionId = `${listboxId}-${index}`;

    if (entry.kind === 'prompt') {
      return (
        <div key={entry.id} role="presentation" className="palette-row">
          <div
            id={optionId}
            role="option"
            aria-selected={active}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(event) => {
              event.preventDefault();
              runEntry(entry);
            }}
            className={`palette-row__main ${active ? 'palette-row__main--active' : ''}`}
          >
            <span className="truncate text-sm font-medium text-ink">{entry.label}</span>
            <span className="truncate text-xs text-muted">{entry.hint}</span>
          </div>
          <div className="palette-row__actions">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onClose();
                onCopyPrompt(entry.prompt);
              }}
              className="button-quiet text-xs"
            >
              Copier
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onClose();
                onEditPrompt(entry.prompt);
              }}
              className="button-quiet text-xs"
            >
              Éditer
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={entry.id} role="presentation" className="palette-row">
        <div
          id={optionId}
          role="option"
          aria-selected={active}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseDown={(event) => {
            event.preventDefault();
            runEntry(entry);
          }}
          className={`palette-row__main ${active ? 'palette-row__main--active' : ''}`}
        >
          <span className="truncate text-sm text-ink">{entry.label}</span>
          <span className="truncate text-xs text-muted">{entry.hint}</span>
        </div>
        {entry.shortcut && (
          <span className="shortcut-key shrink-0" aria-hidden="true">
            {entry.shortcut}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-ink/40 p-4 pt-[10vh]"
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        tabIndex={-1}
        className="surface-card max-h-[76vh] w-full max-w-xl overflow-hidden shadow-lg"
      >
        <div className="border-b border-border p-5">
          <p className="eyebrow">Commandes</p>
          <h2 id="command-palette-title" className="mt-1 text-lg font-semibold tracking-tight">
            Où voulez-vous aller ?
          </h2>
          <label htmlFor="command-search" className="sr-only">
            Rechercher une commande ou un prompt
          </label>
          <input
            ref={inputRef}
            id="command-search"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={entries.length > 0 ? `${listboxId}-${activeIndex}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Créer, ouvrir, naviguer…"
            className="form-input mt-3"
          />
        </div>

        <div className="max-h-[58vh] overflow-auto p-2">
          {promptEntries.length > 0 || actions.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label="Commandes et prompts" className="grid">
              {promptEntries.length > 0 && (
                <li role="group" aria-label="Prompts">
                  <p className="palette-section" aria-hidden="true">
                    Prompts
                  </p>
                  <div role="presentation">
                    {promptEntries.map((entry, index) => renderEntry(entry, index))}
                  </div>
                </li>
              )}
              {actions.length > 0 && (
                <li role="group" aria-label="Actions" className="mt-2">
                  <p className="palette-section" aria-hidden="true">
                    Actions
                  </p>
                  <div role="presentation">
                    {actions.map((entry, index) =>
                      renderEntry(entry, promptEntries.length + index),
                    )}
                  </div>
                </li>
              )}
            </ul>
          ) : (
            <p role="status" className="px-3 py-6 text-sm text-muted">
              Aucune commande ni aucun prompt ne correspond.
            </p>
          )}
        </div>

        <div className="border-t border-border px-5 py-3 text-xs text-muted">
          ↑ ↓ naviguer · Entrée ouvrir · Alt+C copier · Alt+E éditer · Échap fermer
        </div>
      </div>
    </div>
  );
}
