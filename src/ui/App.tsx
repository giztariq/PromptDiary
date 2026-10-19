import { useEffect, useMemo, useState } from 'react';

import { createPromptFromDraft } from '../domain/promptCreation';
import { incrementCopyCount, toggleFavorite } from '../domain/promptActions';
import { exportPrompts, mergePromptLibrary, parsePromptExport } from '../domain/importExport';
import { searchPrompts } from '../domain/search';
import {
  validatePromptDraft,
  type PromptDraft,
  type PromptDraftErrors,
} from '../domain/validation';
import { detectVaguePrompt } from '../domain/vagueDetection';
import type { Prompt } from '../domain/types';
import { createIndexedDbAdapter } from '../storage/indexedDbAdapter';
import type { StorageAdapter } from '../storage/storageAdapter';
import { PromptCard } from './PromptCard';
import { PromptDetail } from './PromptDetail';
import { PromptSearch } from './PromptSearch';
import { Settings } from './Settings';
import { Toast } from './Toast';
import { LogoMark } from './LogoMark';

interface AppProps {
  storage?: StorageAdapter;
}

type LibraryStatus = 'loading' | 'ready' | 'error';

const defaultStorage = createIndexedDbAdapter();

const emptyDraft: PromptDraft = {
  title: '',
  body: '',
  tags: [],
  model: '',
  context: '',
  rating: 0,
};

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createId(): string {
  return crypto.randomUUID();
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read file'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
    reader.readAsText(file);
  });
}

interface PromptLibraryProps {
  prompts: Prompt[];
  hasPrompts: boolean;
  onCreate: () => void;
  onSettings: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  onOpen: (prompt: Prompt) => void;
  onCopy: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
  onClearFilters: () => void;
}

function PromptLibrary({
  prompts,
  hasPrompts,
  onCreate,
  onSettings,
  query,
  onQueryChange,
  tags,
  selectedTags,
  onToggleTag,
  minRating,
  onMinRatingChange,
  onOpen,
  onCopy,
  onToggleFavorite,
  onClearFilters,
}: PromptLibraryProps) {
  return (
    <section aria-labelledby="library-heading" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Bibliothèque</p>
          <h2 id="library-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Vos prompts
          </h2>
        </div>
        <button type="button" onClick={onCreate} aria-keyshortcuts="n" className="button-primary">
          Nouveau prompt
        </button>
        <button type="button" onClick={onSettings} className="button-secondary">
          Réglages
        </button>
      </div>

      <PromptSearch
        query={query}
        onQueryChange={onQueryChange}
        tags={tags}
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
        minRating={minRating}
        onMinRatingChange={onMinRatingChange}
      />

      {prompts.length === 0 ? (
        <div className="state-card empty-state">
          {hasPrompts ? (
            <>
              <h3 className="text-base font-semibold">Aucun résultat</h3>
              <p className="mt-2 text-sm text-muted">Modifiez votre recherche ou vos filtres.</p>
              <button type="button" onClick={onClearFilters} className="button-secondary mt-4">
                Réinitialiser les filtres
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold">Aucun prompt enregistré</h3>
              <p className="mt-2 text-sm text-muted">
                Créez votre premier prompt pour commencer votre bibliothèque locale.
              </p>
              <button type="button" onClick={onCreate} className="button-secondary mt-4">
                Créer un prompt
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4" aria-label="Liste des prompts">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onOpen={() => onOpen(prompt)}
              onCopy={() => onCopy(prompt)}
              onToggleFavorite={() => onToggleFavorite(prompt)}
              query={query}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface PromptEditorProps {
  draft: PromptDraft;
  tagsValue: string;
  errors: PromptDraftErrors;
  saveError: string;
  saving: boolean;
  onChange: (field: keyof PromptDraft, value: string | number) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function PromptEditor({
  draft,
  tagsValue,
  errors,
  saveError,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: PromptEditorProps) {
  const detection = detectVaguePrompt(draft);

  return (
    <section
      aria-labelledby="editor-heading"
      aria-busy={saving}
      className="surface-card mt-10 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Éditeur</p>
          <h2 id="editor-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Nouveau prompt
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-keyshortcuts="Escape"
          className="button-secondary"
        >
          Annuler
        </button>
      </div>

      <form
        className="mt-8 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <div>
          <label htmlFor="prompt-title" className="text-sm font-semibold text-ink">
            Titre
          </label>
          <input
            id="prompt-title"
            value={draft.title}
            onChange={(event) => onChange('title', event.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'prompt-title-error' : undefined}
            className="form-input mt-2"
          />
          {errors.title && (
            <p id="prompt-title-error" className="mt-1 text-sm text-danger">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="prompt-body" className="text-sm font-semibold text-ink">
            Corps du prompt
          </label>
          <textarea
            id="prompt-body"
            value={draft.body}
            onChange={(event) => onChange('body', event.target.value)}
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? 'prompt-body-error' : undefined}
            rows={7}
            className="form-textarea mt-2"
          />
          {errors.body && (
            <p id="prompt-body-error" className="mt-1 text-sm text-danger">
              {errors.body}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="prompt-tags" className="text-sm font-semibold text-ink">
              Tags
            </label>
            <input
              id="prompt-tags"
              value={tagsValue}
              onChange={(event) => onChange('tags', event.target.value)}
              placeholder="analyse, synthèse"
              className="form-input mt-2"
            />
            <p className="mt-1 text-xs text-muted">Séparez les tags par des virgules.</p>
          </div>
          <div>
            <label htmlFor="prompt-model" className="text-sm font-semibold text-ink">
              Modèle
            </label>
            <input
              id="prompt-model"
              value={draft.model}
              onChange={(event) => onChange('model', event.target.value)}
              placeholder="GPT, Claude…"
              className="form-input mt-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="prompt-context" className="text-sm font-semibold text-ink">
            Contexte
          </label>
          <textarea
            id="prompt-context"
            value={draft.context}
            onChange={(event) => onChange('context', event.target.value)}
            rows={3}
            placeholder="À quoi sert ce prompt ?"
            className="form-textarea mt-2"
          />
        </div>

        <div>
          <label htmlFor="prompt-rating" className="text-sm font-semibold text-ink">
            Note
          </label>
          <select
            id="prompt-rating"
            value={draft.rating}
            onChange={(event) => onChange('rating', Number(event.target.value))}
            aria-invalid={Boolean(errors.rating)}
            aria-describedby={errors.rating ? 'prompt-rating-error' : undefined}
            className="form-select mt-2 sm:max-w-xs"
          >
            <option value={0}>Choisir une note</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
          {errors.rating && (
            <p id="prompt-rating-error" className="mt-1 text-sm text-danger">
              {errors.rating}
            </p>
          )}
        </div>

        <div
          className="rounded-control border border-accent-soft bg-accent-soft p-4"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">Aperçu</span>
            {detection.vague ? (
              <span className="badge">À préciser</span>
            ) : (
              <span className="text-sm font-medium text-success">Prompt suffisamment précis</span>
            )}
          </div>
          {detection.vague && (
            <p className="mt-2 text-sm text-accent-dark">{detection.suggestion}</p>
          )}
        </div>

        {saveError && (
          <p role="alert" className="error-message p-3 text-sm">
            {saveError}
          </p>
        )}
        <button type="submit" disabled={saving} className="button-primary w-full">
          {saving ? 'Enregistrement…' : 'Enregistrer le prompt'}
        </button>
      </form>
    </section>
  );
}

export default function App({ storage = defaultStorage }: AppProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [view, setView] = useState<'library' | 'editor' | 'detail' | 'settings'>('library');
  const [selectedPromptId, setSelectedPromptId] = useState<string>();
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [toast, setToast] = useState('');
  const [draft, setDraft] = useState<PromptDraft>(emptyDraft);
  const [tagsValue, setTagsValue] = useState('');
  const [errors, setErrors] = useState<PromptDraftErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const tags = useMemo(
    () =>
      [...new Set(prompts.flatMap((prompt) => prompt.tags))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [prompts],
  );
  const visiblePrompts = useMemo(
    () => searchPrompts(prompts, { query, tags: selectedTags, minRating: minRating || undefined }),
    [minRating, prompts, query, selectedTags],
  );
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedPromptId);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    void storage
      .list()
      .then((loadedPrompts) => {
        if (active) {
          setPrompts(loadedPrompts);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt, storage]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTyping = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';

      if (event.key === 'Escape' && view === 'editor') {
        event.preventDefault();
        setView('library');
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || isTyping) {
        return;
      }

      if (event.key === '/' && status === 'ready' && view === 'library') {
        event.preventDefault();
        document.getElementById('prompt-search')?.focus();
        return;
      }

      if (event.key.toLowerCase() === 'n' && status === 'ready') {
        event.preventDefault();
        openEditor();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [status, view]);

  function openEditor() {
    setDraft(emptyDraft);
    setTagsValue('');
    setErrors({});
    setSaveError('');
    setSelectedPromptId(undefined);
    setView('editor');
  }

  function openSettings() {
    setSelectedPromptId(undefined);
    setView('settings');
  }

  function updateDraft(field: keyof PromptDraft, value: string | number) {
    if (field === 'tags' && typeof value === 'string') {
      setTagsValue(value);
    }
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: field === 'tags' && typeof value === 'string' ? parseTags(value) : value,
    }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }

  async function savePrompt() {
    const validation = validatePromptDraft(draft);
    setErrors(validation.errors);
    setSaveError('');
    if (!validation.valid) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prompt = createPromptFromDraft(draft, createId(), timestamp);
    setSaving(true);
    try {
      await storage.save(prompt);
      setPrompts((currentPrompts) => [...currentPrompts, prompt]);
      setView('library');
    } catch {
      setSaveError('Impossible d’enregistrer ce prompt.');
    } finally {
      setSaving(false);
    }
  }

  async function copyPrompt(prompt: Prompt) {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(prompt.body);
      const updated = incrementCopyCount(prompt, new Date().toISOString());
      await storage.save(updated);
      setPrompts((currentPrompts) =>
        currentPrompts.map((currentPrompt) =>
          currentPrompt.id === updated.id ? updated : currentPrompt,
        ),
      );
      setToast('Prompt copié');
    } catch {
      setToast('Impossible de copier le prompt.');
    }
  }

  async function changeFavorite(prompt: Prompt) {
    const updated = toggleFavorite(prompt, new Date().toISOString());
    try {
      await storage.save(updated);
      setPrompts((currentPrompts) =>
        currentPrompts.map((currentPrompt) =>
          currentPrompt.id === updated.id ? updated : currentPrompt,
        ),
      );
    } catch {
      setToast('Impossible de modifier le favori.');
    }
  }

  function exportLibrary() {
    const blob = new Blob([exportPrompts(prompts)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt-diary-export.json';
    link.click();
    URL.revokeObjectURL(url);
    setToast('Bibliothèque exportée');
  }

  async function importLibrary(file: File) {
    try {
      const imported = parsePromptExport(await readFileText(file));
      const report = mergePromptLibrary(prompts, imported);
      for (const prompt of report.addedPrompts) {
        await storage.save(prompt);
      }
      setPrompts(report.prompts);
      setView('library');
      setToast(`${report.added} ajoutés / ${report.ignored} ignorés`);
    } catch {
      setToast('Import invalide : choisissez un export Prompt Diary.');
    }
  }

  return (
    <main className="app-shell">
      <section className="page-shell">
        <header className="hero rounded-card border border-border p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <h1 className="font-display text-[32px] font-semibold leading-10 tracking-tight">
              Prompt Diary
            </h1>
          </div>
          <p className="eyebrow mt-6">Local-first prompt journal</p>
          <p className="mt-3 max-w-2xl text-base leading-6 text-muted sm:text-lg sm:leading-7">
            Gardez vos prompts utiles, notez ce qui fonctionne et retrouvez-les en quelques
            secondes.
          </p>
        </header>

        {status === 'loading' && (
          <div
            role="status"
            aria-label="Chargement des prompts…"
            className="surface-card mt-10 space-y-4 p-6"
          >
            <span className="sr-only">Chargement des prompts…</span>
            <div className="skeleton w-1/3" aria-hidden="true" />
            <div className="skeleton w-5/6" aria-hidden="true" />
            <div className="skeleton w-2/3" aria-hidden="true" />
          </div>
        )}
        {status === 'error' && (
          <div role="alert" className="state-card error-state p-6 text-left">
            <p className="text-sm font-semibold">Impossible de charger les prompts.</p>
            <p className="mt-2 text-sm leading-6">Vérifiez le stockage local puis réessayez.</p>
            <button
              type="button"
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              className="button-secondary mt-4"
            >
              Réessayer
            </button>
          </div>
        )}
        {status === 'ready' && view === 'library' && (
          <PromptLibrary
            prompts={visiblePrompts}
            hasPrompts={prompts.length > 0}
            onCreate={openEditor}
            onSettings={openSettings}
            query={query}
            onQueryChange={setQuery}
            tags={tags}
            selectedTags={selectedTags}
            onToggleTag={(tag) =>
              setSelectedTags((currentTags) =>
                currentTags.includes(tag)
                  ? currentTags.filter((currentTag) => currentTag !== tag)
                  : [...currentTags, tag],
              )
            }
            minRating={minRating}
            onMinRatingChange={setMinRating}
            onOpen={(prompt) => {
              setSelectedPromptId(prompt.id);
              setView('detail');
            }}
            onCopy={(prompt) => void copyPrompt(prompt)}
            onToggleFavorite={(prompt) => void changeFavorite(prompt)}
            onClearFilters={() => {
              setQuery('');
              setSelectedTags([]);
              setMinRating(0);
            }}
          />
        )}
        {status === 'ready' && view === 'settings' && (
          <Settings
            onBack={() => setView('library')}
            onExport={exportLibrary}
            onImport={importLibrary}
          />
        )}
        {status === 'ready' && view === 'detail' && selectedPrompt && (
          <PromptDetail
            prompt={selectedPrompt}
            onBack={() => setView('library')}
            onCopy={() => void copyPrompt(selectedPrompt)}
            onToggleFavorite={() => void changeFavorite(selectedPrompt)}
          />
        )}
        {status === 'ready' && view === 'detail' && !selectedPrompt && (
          <div role="alert" className="state-card error-state text-left">
            <h2 className="text-base font-semibold">Prompt introuvable</h2>
            <p className="mt-2 text-sm leading-6">
              Ce prompt n’est plus disponible dans la bibliothèque.
            </p>
            <button
              type="button"
              onClick={() => setView('library')}
              className="button-secondary mt-4"
            >
              Retour à la bibliothèque
            </button>
          </div>
        )}
        {status === 'ready' && view === 'editor' && (
          <PromptEditor
            draft={draft}
            tagsValue={tagsValue}
            errors={errors}
            saveError={saveError}
            saving={saving}
            onChange={updateDraft}
            onCancel={() => setView('library')}
            onSubmit={() => void savePrompt()}
          />
        )}
      </section>
      <footer className="mx-auto max-w-[1024px] border-t border-border px-6 pt-5 text-center text-sm text-muted sm:px-0">
        Tout est local, rien ne part sur un serveur.
      </footer>
      <Toast message={toast} />
    </main>
  );
}
