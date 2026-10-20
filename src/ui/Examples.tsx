import { useEffect, useMemo, useRef, useState } from 'react';

import type { Prompt } from '../domain/types';
import type { Example } from '../data/examples';
import { LogoMark } from './LogoMark';

const categories = [
  'Tous',
  'Rédaction',
  'Analyse',
  'Formation',
  'Communication',
  'Code',
  'Productivité',
] as const;

interface ExamplesProps {
  examples: Example[];
  existingPrompts: Prompt[];
  onBack: () => void;
  onAdd: (examples: Example[]) => void;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim();
}

function isImported(example: Example, existingPrompts: Prompt[]): boolean {
  const title = normalize(example.titre);
  const body = normalize(example.corps);

  return existingPrompts.some(
    (prompt) => normalize(prompt.title) === title || normalize(prompt.body) === body,
  );
}

function ratingLabel(note: number): string {
  return `Note ${note} sur 5`;
}

export function Examples({ examples, existingPrompts, onBack, onAdd }: ExamplesProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Tous');
  const [selectedExample, setSelectedExample] = useState<Example>();
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      onBack();
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onBack]);

  useEffect(() => {
    if (selectedExample) {
      detailHeadingRef.current?.focus();
    }
  }, [selectedExample]);

  const filteredExamples = useMemo(() => {
    const searchTerms = normalize(query).split(/\s+/).filter(Boolean);

    return examples.filter((example) => {
      const categoryMatches = selectedCategory === 'Tous' || example.categorie === selectedCategory;
      if (!categoryMatches) {
        return false;
      }

      if (searchTerms.length === 0) {
        return true;
      }

      const searchableText = normalize(
        [
          example.categorie,
          example.titre,
          example.description,
          example.corps,
          example.contexte,
          ...example.tags,
          example.modele ?? '',
        ].join(' '),
      );

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [examples, query, selectedCategory]);

  const availableExamples = useMemo(
    () => filteredExamples.filter((example) => !isImported(example, existingPrompts)),
    [existingPrompts, filteredExamples],
  );

  function addExamples(toAdd: Example[]) {
    if (toAdd.length === 0) {
      return;
    }

    onAdd(toAdd);
  }

  function handleAddAll() {
    if (availableExamples.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Ajouter ${availableExamples.length} exemple${availableExamples.length > 1 ? 's' : ''} à votre bibliothèque ?`,
    );
    if (confirmed) {
      addExamples(availableExamples);
    }
  }

  function handleDetailAdd() {
    if (selectedExample && !isImported(selectedExample, existingPrompts)) {
      addExamples([selectedExample]);
    }
  }

  if (selectedExample) {
    const alreadyImported = isImported(selectedExample, existingPrompts);

    return (
      <section
        aria-labelledby="example-detail-heading"
        className="surface-card page-transition min-h-[calc(100vh-104px)] p-5 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedExample(undefined)}
            className="button-secondary"
          >
            ← Retour aux exemples
          </button>
          <button
            type="button"
            onClick={onBack}
            className="button-quiet"
            aria-keyshortcuts="Escape"
          >
            Fermer la bibliothèque
          </button>
        </div>

        <div className="mt-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">{selectedExample.categorie}</span>
            {alreadyImported && <span className="tag-chip">Déjà importé</span>}
          </div>
          <h2
            id="example-detail-heading"
            ref={detailHeadingRef}
            tabIndex={-1}
            className="mt-4 text-3xl font-semibold tracking-tight"
          >
            {selectedExample.titre}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            {selectedExample.description}
          </p>

          <div className="mt-8 rounded-control border border-border bg-ink p-4 sm:p-6">
            <p className="eyebrow text-accent-soft">Corps du prompt</p>
            <pre
              aria-label="Corps du prompt"
              className="mt-4 max-h-[34rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-7 text-surface"
            >
              {selectedExample.corps}
            </pre>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="rounded-control border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Contexte
              </p>
              <p className="mt-2 text-sm leading-6 text-ink">{selectedExample.contexte}</p>
            </div>
            <div className="rounded-control border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Modèle conseillé
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {selectedExample.modele ?? 'Non renseigné'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {selectedExample.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
            <span
              className="ml-auto font-medium text-accent"
              aria-label={ratingLabel(selectedExample.note)}
            >
              ★ {selectedExample.note}/5
            </span>
          </div>

          <button
            type="button"
            onClick={handleDetailAdd}
            disabled={alreadyImported}
            className="button-primary mt-8 min-h-12 w-full px-5 py-3 text-base sm:w-auto"
          >
            {alreadyImported ? 'Déjà importé' : 'Ajouter à ma bibliothèque'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="examples-heading"
      className="surface-card page-transition min-h-[calc(100vh-104px)] p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="eyebrow">Bibliothèque locale</p>
            <h1
              id="examples-heading"
              tabIndex={-1}
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              Bibliothèque d’exemples
            </h1>
            <h2 className="sr-only">Exemples de prompts</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddAll}
            disabled={availableExamples.length === 0}
            className="button-primary"
          >
            Tout ajouter
          </button>
          <button
            type="button"
            onClick={onBack}
            className="button-secondary"
            aria-keyshortcuts="Escape"
          >
            Retour
          </button>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Des structures prêtes à adapter, classées par usage et conservées uniquement dans votre
        bibliothèque locale.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label htmlFor="examples-search" className="text-sm font-semibold text-ink">
            Rechercher dans les exemples
          </label>
          <input
            id="examples-search"
            type="search"
            role="searchbox"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, usage, tag…"
            className="search-input mt-2"
          />
        </div>
        <p className="text-sm font-semibold text-muted" role="status" aria-live="polite">
          {filteredExamples.length} résultat{filteredExamples.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
            className="filter-chip"
          >
            {category}
          </button>
        ))}
      </div>

      {filteredExamples.length === 0 ? (
        <div className="state-card empty-state mt-8">
          <h2 className="text-xl font-semibold">Aucun exemple trouvé</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Essayez une autre recherche ou revenez à votre bibliothèque de prompts.
          </p>
          <button type="button" onClick={onBack} className="button-secondary mt-5">
            Retour à ma bibliothèque
          </button>
        </div>
      ) : (
        <div
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Liste des exemples"
        >
          {filteredExamples.map((example) => {
            const alreadyImported = isImported(example, existingPrompts);

            return (
              <article key={example.id} className="prompt-card flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="badge">{example.categorie}</span>
                  {alreadyImported && <span className="tag-chip">Déjà importé</span>}
                </div>
                <h2 className="mt-4 text-xl font-semibold leading-7 text-ink">{example.titre}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{example.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {example.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <span className="font-medium text-accent" aria-label={ratingLabel(example.note)}>
                    ★ {example.note}/5
                  </span>
                  <span className="text-xs text-muted">{example.modele ?? 'Modèle libre'}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedExample(example);
                      }}
                    >
                      Voir
                    </button>
                    <button
                      type="button"
                      aria-label={
                        alreadyImported
                          ? `${example.titre} est déjà importé`
                          : `Ajouter ${example.titre}`
                      }
                      disabled={alreadyImported}
                      onClick={(event) => {
                        event.stopPropagation();
                        addExamples([example]);
                      }}
                      className="button-primary inline-flex min-h-10 min-w-10 items-center justify-center px-3 text-lg"
                    >
                      {alreadyImported ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
