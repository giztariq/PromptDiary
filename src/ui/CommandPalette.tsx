import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { searchPrompts } from '../domain/search';
import type { Prompt } from '../domain/types';

interface CommandPaletteProps {
  prompts: Prompt[];
  onClose: () => void;
  onCreate: () => void;
  onOpenPrompt: (prompt: Prompt) => void;
  onShowLibrary: () => void;
  onShowExamples: () => void;
  onShowSettings: () => void;
  onShowStatistics: () => void;
}

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

export function CommandPalette({
  prompts,
  onClose,
  onCreate,
  onOpenPrompt,
  onShowLibrary,
  onShowExamples,
  onShowSettings,
  onShowStatistics,
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

  const items = useMemo<PaletteItem[]>(() => {
    const commands: PaletteItem[] = [
      { id: 'new', label: 'Nouveau prompt', hint: 'N', run: onCreate },
      { id: 'library', label: 'Bibliothèque', hint: 'Prompts', run: onShowLibrary },
      { id: 'examples', label: 'Exemples', hint: 'Bibliothèque locale', run: onShowExamples },
      { id: 'settings', label: 'Réglages', hint: 'Import / export', run: onShowSettings },
      {
        id: 'statistics',
        label: 'Statistiques',
        hint: 'Vue d’ensemble',
        run: onShowStatistics,
      },
    ];
    const normalizedQuery = normalize(query.trim());
    const filteredCommands = commands.filter((command) =>
      normalize(`${command.label} ${command.hint ?? ''}`).includes(normalizedQuery),
    );
    const promptResults = searchPrompts(prompts, { query: query.trim() })
      .slice(0, 6)
      .map((prompt) => ({
        id: `prompt-${prompt.id}`,
        label: prompt.title,
        hint: prompt.model || prompt.context || 'Prompt',
        run: () => onOpenPrompt(prompt),
      }));

    return [...filteredCommands, ...promptResults];
  }, [
    onCreate,
    onOpenPrompt,
    onShowExamples,
    onShowLibrary,
    onShowSettings,
    onShowStatistics,
    prompts,
    query,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(Math.max(items.length - 1, 0));
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, items.length, listboxId]);

  function runItem(item: PaletteItem | undefined) {
    if (!item) {
      return;
    }

    onClose();
    item.run();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (items.length === 0 ? 0 : (index + 1) % items.length));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) =>
        items.length === 0 ? 0 : (index - 1 + items.length) % items.length,
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runItem(items[activeIndex]);
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

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-ink/40 p-4 pt-[12vh]"
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
        className="surface-card w-full max-w-xl overflow-hidden shadow-lg"
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
            aria-activedescendant={items.length > 0 ? `${listboxId}-${activeIndex}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Créer, ouvrir, naviguer…"
            className="form-input mt-3"
          />
        </div>

        {items.length > 0 ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Commandes et prompts"
            className="max-h-[50vh] overflow-auto p-2"
          >
            {items.map((item, index) => {
              const active = index === activeIndex;

              return (
                <li
                  key={item.id}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    runItem(item);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-control px-3 py-2 text-sm ${
                    active ? 'bg-accent-soft text-ink' : 'text-ink'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && (
                    <span className="max-w-[45%] truncate text-right text-xs text-muted">
                      {item.hint}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status" className="px-5 py-6 text-sm text-muted">
            Aucune commande ni aucun prompt ne correspond.
          </p>
        )}

        <div className="border-t border-border px-5 py-3 text-xs text-muted">
          ↑ ↓ naviguer · Entrée choisir · Échap fermer
        </div>
      </div>
    </div>
  );
}
