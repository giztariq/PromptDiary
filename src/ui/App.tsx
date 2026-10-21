import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createPromptFromDraft } from '../domain/promptCreation';
import { recordUsage, toggleFavorite } from '../domain/promptActions';
import { exportPrompts, mergePromptLibrary, parsePromptExport } from '../domain/importExport';
import { importExamples } from '../domain/importExample';
import { searchPrompts } from '../domain/search';
import { type SortOption } from '../domain/sort';
import { rankTags } from '../domain/tags';
import {
  validatePromptDraft,
  type PromptDraft,
  type PromptDraftErrors,
} from '../domain/validation';
import { detectVaguePrompt } from '../domain/vagueDetection';
import { fillVariables, parseVariables } from '../domain/variables';
import type { Prompt } from '../domain/types';
import { EXAMPLES, type Example } from '../data/examples';
import { createIndexedDbAdapter } from '../storage/indexedDbAdapter';
import { variableValuesKey, type StorageAdapter } from '../storage/storageAdapter';
import { CommandPalette } from './CommandPalette';
import { PromptCard } from './PromptCard';
import { PromptDetail } from './PromptDetail';
import { PromptSearch } from './PromptSearch';
import { Settings } from './Settings';
import { Statistics } from './Statistics';
import { Toast } from './Toast';
import { LogoMark } from './LogoMark';
import { QualityCoach } from './QualityCoach';
import { Examples } from './Examples';
import { VariableModal } from './VariableModal';

interface AppProps {
  storage?: StorageAdapter;
}

type LibraryStatus = 'loading' | 'ready' | 'error';
type AppView = 'library' | 'editor' | 'detail' | 'settings' | 'examples' | 'statistics';

const defaultStorage = createIndexedDbAdapter();

const emptyDraft: PromptDraft = {
  title: '',
  body: '',
  tags: [],
  model: '',
  context: '',
  rating: 0,
};

function draftSnapshot(draft: PromptDraft, tagsValue: string): string {
  return JSON.stringify([
    draft.title,
    draft.body,
    draft.tags.join(','),
    draft.model,
    draft.context,
    draft.rating,
    tagsValue,
  ]);
}

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
  onExamples: () => void;
  onSettings: () => void;
  onStatistics: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpen: (prompt: Prompt) => void;
  onCopy: (prompt: Prompt) => void;
  onUse: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
  onClearFilters: () => void;
}

function PromptLibrary({
  prompts,
  hasPrompts,
  onCreate,
  onExamples,
  onSettings,
  onStatistics,
  query,
  onQueryChange,
  tags,
  selectedTags,
  onToggleTag,
  minRating,
  onMinRatingChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  sort,
  onSortChange,
  onOpen,
  onCopy,
  onUse,
  onToggleFavorite,
  onClearFilters,
}: PromptLibraryProps) {
  return (
    <section aria-labelledby="library-heading" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Bibliothèque</p>
          <h2
            id="library-heading"
            tabIndex={-1}
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Vos prompts
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onStatistics} className="button-secondary">
            Statistiques
          </button>
          <button type="button" onClick={onSettings} className="button-secondary">
            Réglages
          </button>
        </div>
      </div>

      <PromptSearch
        query={query}
        onQueryChange={onQueryChange}
        tags={tags}
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
        minRating={minRating}
        onMinRatingChange={onMinRatingChange}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={onFavoritesOnlyChange}
        sort={sort}
        onSortChange={onSortChange}
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
            <div className="empty-state__content">
              <LogoMark size={40} />
              <p className="eyebrow mt-5">Aucun prompt enregistré</p>
              <h3 className="mt-2 text-2xl font-semibold">Votre carnet de prompts</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                Gardez vos meilleures formulations à portée de main, notez ce qui fonctionne et
                réutilisez-les sans repartir de zéro.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={onCreate} className="button-primary">
                  Créer un prompt
                </button>
                <button type="button" onClick={onExamples} className="button-secondary">
                  Explorer les exemples
                </button>
              </div>
              <p className="mt-8 border-t border-border pt-4 text-xs text-muted">
                Tout est local, rien ne part sur un serveur.
              </p>
            </div>
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
              onUse={() => onUse(prompt)}
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
  isEditing: boolean;
  onChange: (field: keyof PromptDraft, value: string | number) => void;
  onCancel: () => void;
  onSubmit: () => void;
  onCopyPreview: () => void;
}

function PromptEditor({
  draft,
  tagsValue,
  errors,
  saveError,
  saving,
  isEditing,
  onChange,
  onCancel,
  onSubmit,
  onCopyPreview,
}: PromptEditorProps) {
  const detection = detectVaguePrompt(draft);
  const variables = parseVariables(draft.body);

  return (
    <section aria-labelledby="editor-heading" aria-busy={saving} className="mt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Éditeur</p>
          <h2
            id="editor-heading"
            tabIndex={-1}
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            {isEditing ? 'Modifier le prompt' : 'Nouveau prompt'}
          </h2>
        </div>
        <span className="badge">Brouillon local</span>
      </div>

      <div className="editor-layout">
        <form
          className="surface-card grid gap-5 p-6 sm:p-8"
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
              rows={10}
              className="form-textarea mt-2 font-mono text-sm"
            />
            {variables.length > 0 && (
              <p role="status" className="mt-2 text-sm text-muted">
                {variables.length} variable{variables.length === 1 ? '' : 's'} détectée
                {variables.length === 1 ? '' : 's'} : {variables.join(', ')}
              </p>
            )}
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

          {saveError && (
            <p role="alert" className="error-message p-3 text-sm">
              {saveError}
            </p>
          )}

          <div className="editor-actions">
            <button
              type="button"
              onClick={onCancel}
              aria-keyshortcuts="Escape"
              className="button-quiet"
            >
              Annuler
            </button>
            <button type="submit" disabled={saving} className="button-primary">
              {saving ? 'Enregistrement…' : 'Enregistrer le prompt'}
            </button>
          </div>
        </form>

        <div className="grid gap-5">
          <section className="surface-card p-5" aria-labelledby="preview-heading">
            <div className="flex items-center justify-between gap-3">
              <h3 id="preview-heading" className="text-lg font-semibold text-ink">
                Aperçu
              </h3>
              <button type="button" onClick={onCopyPreview} className="button-secondary text-xs">
                Copier
              </button>
            </div>
            <pre className="mt-4 min-h-40 whitespace-pre-wrap rounded-control border border-border bg-surface-2 p-4 font-mono text-xs leading-6 text-ink">
              {draft.body || 'Votre prompt apparaîtra ici.'}
            </pre>
            <div className="mt-4 rounded-control border border-accent-soft bg-accent-soft p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">Détection rapide</span>
                {detection.vague ? (
                  <span className="badge">À préciser</span>
                ) : (
                  <span className="text-sm font-medium text-success">
                    Prompt suffisamment précis
                  </span>
                )}
              </div>
              {detection.vague && (
                <p className="mt-2 text-sm text-accent-dark">{detection.suggestion}</p>
              )}
            </div>
          </section>
          <QualityCoach text={draft.body} />
        </div>
      </div>
    </section>
  );
}

export default function App({ storage = defaultStorage }: AppProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [view, setView] = useState<AppView>('library');
  const [selectedPromptId, setSelectedPromptId] = useState<string>();
  const [editingPromptId, setEditingPromptId] = useState<string>();
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('priority');
  const [toast, setToast] = useState('');
  const [toastNonce, setToastNonce] = useState(0);
  const [draft, setDraft] = useState<PromptDraft>(emptyDraft);
  const [tagsValue, setTagsValue] = useState('');
  const [errors, setErrors] = useState<PromptDraftErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [variablePrompt, setVariablePrompt] = useState<Prompt>();
  const [commandOpen, setCommandOpen] = useState(false);
  const [editorBaseline, setEditorBaseline] = useState(() => draftSnapshot(emptyDraft, ''));
  const hasChangedView = useRef(false);
  const isEditorDirty = view === 'editor' && editorBaseline !== draftSnapshot(draft, tagsValue);

  useEffect(() => {
    if (!hasChangedView.current) {
      hasChangedView.current = true;
      return;
    }

    document.getElementById(`${view}-heading`)?.focus();
  }, [view]);

  const tags = useMemo(() => rankTags(prompts).map((entry) => entry.tag), [prompts]);
  const visiblePrompts = useMemo(
    () =>
      searchPrompts(prompts, {
        query,
        tags: selectedTags,
        minRating: minRating || undefined,
        favoritesOnly,
        sort,
      }),
    [favoritesOnly, minRating, prompts, query, selectedTags, sort],
  );
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedPromptId);
  const variableNames = useMemo(
    () => (variablePrompt ? parseVariables(variablePrompt.body) : []),
    [variablePrompt],
  );

  const confirmDiscardEditor = useCallback((): boolean => {
    if (!isEditorDirty) {
      return true;
    }

    return window.confirm('Abandonner les modifications non enregistrées ?');
  }, [isEditorDirty]);

  const requestView = useCallback(
    (nextView: AppView) => {
      if (view === 'editor' && nextView !== 'editor' && !confirmDiscardEditor()) {
        return;
      }

      setView(nextView);
    },
    [confirmDiscardEditor, view],
  );

  function showToast(message: string) {
    setToast(message);
    setToastNonce((nonce) => nonce + 1);
  }

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
    if (!isEditorDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditorDirty]);

  const openEditor = useCallback(
    (prompt?: Prompt, initialDraft?: PromptDraft) => {
      if (!confirmDiscardEditor()) {
        return;
      }

      const nextDraft =
        initialDraft ??
        (prompt
          ? {
              title: prompt.title,
              body: prompt.body,
              tags: [...prompt.tags],
              model: prompt.model,
              context: prompt.context,
              rating: prompt.rating,
            }
          : emptyDraft);
      const nextTagsValue = initialDraft
        ? initialDraft.tags.join(', ')
        : prompt
          ? prompt.tags.join(', ')
          : '';

      setEditingPromptId(prompt?.id);
      setDraft(nextDraft);
      setTagsValue(nextTagsValue);
      setEditorBaseline(draftSnapshot(nextDraft, nextTagsValue));
      setErrors({});
      setSaveError('');
      setSelectedPromptId(prompt?.id);
      setView('editor');
    },
    [confirmDiscardEditor],
  );

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTyping = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';

      if (variablePrompt || commandOpen) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (event.key === 'Escape' && view === 'editor') {
        event.preventDefault();
        requestView('library');
        return;
      }

      if (event.altKey || isTyping) {
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
  }, [commandOpen, openEditor, requestView, status, variablePrompt, view]);

  function openSettings() {
    if (!confirmDiscardEditor()) {
      return;
    }

    setSelectedPromptId(undefined);
    setEditingPromptId(undefined);
    setView('settings');
  }

  function openExamples() {
    if (!confirmDiscardEditor()) {
      return;
    }

    setSelectedPromptId(undefined);
    setEditingPromptId(undefined);
    setView('examples');
  }

  function openStatistics() {
    if (!confirmDiscardEditor()) {
      return;
    }

    setSelectedPromptId(undefined);
    setEditingPromptId(undefined);
    setView('statistics');
  }

  function openPromptDetail(prompt: Prompt) {
    if (!confirmDiscardEditor()) {
      return;
    }

    setSelectedPromptId(prompt.id);
    setView('detail');
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
    const existing = editingPromptId
      ? prompts.find((currentPrompt) => currentPrompt.id === editingPromptId)
      : undefined;
    const prompt = createPromptFromDraft(draft, existing?.id ?? createId(), timestamp);
    const savedPrompt = existing
      ? {
          ...prompt,
          favorite: existing.favorite,
          copyCount: existing.copyCount,
          createdAt: existing.createdAt,
          lastUsedAt: existing.lastUsedAt,
          usageLog: existing.usageLog,
        }
      : prompt;
    setSaving(true);
    try {
      await storage.save(savedPrompt);
      setPrompts((currentPrompts) =>
        existing
          ? currentPrompts.map((currentPrompt) =>
              currentPrompt.id === savedPrompt.id ? savedPrompt : currentPrompt,
            )
          : [...currentPrompts, savedPrompt],
      );
      setEditingPromptId(undefined);
      showToast('Prompt enregistré');
      setView('library');
    } catch {
      setSaveError('Impossible d’enregistrer ce prompt.');
      showToast('Impossible d’enregistrer le prompt.');
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text: string, successMessage: string) {
    if (!navigator.clipboard) {
      throw new Error('Clipboard unavailable');
    }
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  }

  async function copyPrompt(prompt: Prompt) {
    try {
      await copyText(prompt.body, 'Prompt copié');
      const updated = recordUsage(prompt, new Date().toISOString());
      await storage.save(updated);
      setPrompts((currentPrompts) =>
        currentPrompts.map((currentPrompt) =>
          currentPrompt.id === updated.id ? updated : currentPrompt,
        ),
      );
    } catch {
      showToast('Impossible de copier le prompt.');
    }
  }

  async function copyFilledPrompt(prompt: Prompt, values: Record<string, string>) {
    const timestamp = new Date().toISOString();
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(fillVariables(prompt.body, values));
      const updated = recordUsage(prompt, timestamp);
      await storage.save(updated);
      await storage.setValue(variableValuesKey(prompt.id), values);
      setPrompts((currentPrompts) =>
        currentPrompts.map((currentPrompt) =>
          currentPrompt.id === updated.id ? updated : currentPrompt,
        ),
      );
      setVariablePrompt(undefined);
      showToast('Prompt rempli copié');
    } catch {
      showToast('Impossible de copier ou d’enregistrer le prompt rempli.');
      throw new Error('Unable to copy and save filled prompt');
    }
  }

  async function copyDraftPreview() {
    if (!draft.body.trim()) {
      showToast('Ajoutez un corps avant de copier.');
      return;
    }

    try {
      await copyText(draft.body, 'Aperçu copié');
    } catch {
      showToast('Impossible de copier le prompt.');
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
      showToast('Impossible de modifier le favori.');
    }
  }

  function exportLibrary() {
    const blob = new Blob([exportPrompts(prompts)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt-diary-export.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast('Bibliothèque exportée');
  }

  async function addPromptsWithRecovery(
    promptsToAdd: Prompt[],
    failureMessage: string,
  ): Promise<boolean> {
    try {
      for (const prompt of promptsToAdd) {
        await storage.save(prompt);
      }
      return true;
    } catch {
      try {
        setPrompts(await storage.list());
      } catch {
        showToast(`${failureMessage} Rechargez la page pour voir l’état réel.`);
        return false;
      }
      showToast(failureMessage);
      return false;
    }
  }

  async function importLibrary(file: File) {
    let imported: Prompt[];

    try {
      imported = parsePromptExport(await readFileText(file));
    } catch {
      showToast('Import invalide : choisissez un export Prompt Diary.');
      return;
    }

    const report = mergePromptLibrary(prompts, imported);
    const complete = await addPromptsWithRecovery(
      report.addedPrompts,
      'Import interrompu : certains prompts n’ont pas pu être enregistrés.',
    );

    if (!complete) {
      setView('library');
      return;
    }

    setPrompts(report.prompts);
    setStatus('ready');
    setView('library');
    showToast(`${report.added} ajoutés / ${report.ignored} ignorés`);
  }

  async function importExamplePrompts(examples: Example[]) {
    const report = importExamples(examples, prompts);
    const complete = await addPromptsWithRecovery(
      report.ajoutes,
      'Ajout interrompu : certains exemples n’ont pas pu être enregistrés.',
    );

    if (!complete) {
      return;
    }

    setPrompts((currentPrompts) => [...currentPrompts, ...report.ajoutes]);
    showToast(`${report.ajoutes.length} ajoutés, ${report.ignores} déjà présents`);
  }

  async function resetStorage() {
    if (
      !window.confirm(
        'Effacer toutes les données locales de Prompt Diary ? Cette action est irréversible.',
      )
    ) {
      return;
    }

    try {
      await storage.clear();
      setPrompts([]);
      setSelectedPromptId(undefined);
      setView('library');
      setStatus('ready');
      showToast('Stockage local réinitialisé');
    } catch {
      showToast('Impossible de réinitialiser le stockage local.');
    }
  }

  async function deletePrompt(prompt: Prompt) {
    try {
      await storage.remove(prompt.id);
      setPrompts((currentPrompts) =>
        currentPrompts.filter((currentPrompt) => currentPrompt.id !== prompt.id),
      );
      setSelectedPromptId(undefined);
      setView('library');
      showToast('Prompt supprimé');
    } catch {
      showToast('Impossible de supprimer le prompt.');
    }
  }

  async function duplicatePrompt(prompt: Prompt) {
    const timestamp = new Date().toISOString();
    const duplicate: Prompt = {
      ...prompt,
      id: createId(),
      title: `${prompt.title} (copie)`,
      favorite: false,
      copyCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [...prompt.tags],
    };
    delete duplicate.lastUsedAt;
    delete duplicate.usageLog;

    try {
      await storage.save(duplicate);
      setPrompts((currentPrompts) => [...currentPrompts, duplicate]);
      setSelectedPromptId(duplicate.id);
      setView('detail');
      showToast('Prompt dupliqué');
    } catch {
      showToast('Impossible de dupliquer le prompt.');
    }
  }

  async function clearLibrary() {
    try {
      await storage.clear();
      setPrompts([]);
      setSelectedPromptId(undefined);
      setView('library');
      showToast('Bibliothèque effacée');
    } catch {
      showToast('Impossible d’effacer la bibliothèque.');
    }
  }

  const isEmptyLibrary = status === 'ready' && view === 'library' && prompts.length === 0;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <button type="button" onClick={() => requestView('library')} className="brand-lockup">
            <LogoMark />
            <span>Prompt Diary</span>
          </button>
          <div className="app-header__actions flex items-center gap-2">
            <button type="button" onClick={openExamples} className="button-secondary">
              Exemples
            </button>
            <button
              type="button"
              onClick={() => openEditor()}
              aria-keyshortcuts="n"
              className="button-primary inline-flex items-center gap-2"
            >
              <span>Nouveau prompt</span>
              <kbd className="shortcut-key" aria-hidden="true">
                N
              </kbd>
            </button>
          </div>
        </div>
      </header>

      <section className="page-shell">
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
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="button-secondary"
              >
                Réessayer
              </button>
              <button type="button" onClick={resetStorage} className="button-secondary">
                Réinitialiser le stockage local
              </button>
            </div>
          </div>
        )}
        <div key={`${status}-${view}`} className="page-transition">
          {status === 'ready' && view === 'library' && (
            <PromptLibrary
              prompts={visiblePrompts}
              hasPrompts={prompts.length > 0}
              onCreate={() => openEditor()}
              onExamples={openExamples}
              onSettings={openSettings}
              onStatistics={openStatistics}
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
              favoritesOnly={favoritesOnly}
              onFavoritesOnlyChange={setFavoritesOnly}
              sort={sort}
              onSortChange={setSort}
              onOpen={openPromptDetail}
              onCopy={(prompt) => void copyPrompt(prompt)}
              onUse={(prompt) => setVariablePrompt(prompt)}
              onToggleFavorite={(prompt) => void changeFavorite(prompt)}
              onClearFilters={() => {
                setQuery('');
                setSelectedTags([]);
                setMinRating(0);
                setFavoritesOnly(false);
                setSort('priority');
              }}
            />
          )}
          {status === 'ready' && view === 'statistics' && (
            <Statistics
              prompts={prompts}
              onOpenPrompt={openPromptDetail}
              onBack={() => requestView('library')}
              onCreate={() => openEditor()}
            />
          )}
          {status === 'ready' && view === 'settings' && (
            <Settings
              onBack={() => requestView('library')}
              onExport={exportLibrary}
              onImport={importLibrary}
              onClearAll={() => void clearLibrary()}
            />
          )}
          {status === 'ready' && view === 'examples' && (
            <Examples
              examples={EXAMPLES}
              existingPrompts={prompts}
              onBack={() => requestView('library')}
              onAdd={(examples) => void importExamplePrompts(examples)}
            />
          )}
          {status === 'ready' && view === 'detail' && selectedPrompt && (
            <PromptDetail
              prompt={selectedPrompt}
              onBack={() => requestView('library')}
              onCopy={() => void copyPrompt(selectedPrompt)}
              onUse={() => setVariablePrompt(selectedPrompt)}
              onToggleFavorite={() => void changeFavorite(selectedPrompt)}
              onEdit={() => openEditor(selectedPrompt)}
              onDuplicate={() => void duplicatePrompt(selectedPrompt)}
              onDelete={() => void deletePrompt(selectedPrompt)}
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
                onClick={() => requestView('library')}
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
              isEditing={Boolean(editingPromptId)}
              onChange={updateDraft}
              onCancel={() => requestView('library')}
              onSubmit={() => void savePrompt()}
              onCopyPreview={() => void copyDraftPreview()}
            />
          )}
        </div>
      </section>
      {isEmptyLibrary ? (
        <p className="sr-only">Tout est local, rien ne part sur un serveur.</p>
      ) : (
        <footer className="mx-auto max-w-[1024px] border-t border-border px-6 pt-5 text-center text-sm text-muted sm:px-0">
          Tout est local, rien ne part sur un serveur.
        </footer>
      )}
      <Toast key={toastNonce} message={toast} />
      {commandOpen && (
        <CommandPalette
          prompts={prompts}
          onClose={() => setCommandOpen(false)}
          onCreate={() => openEditor()}
          onOpenPrompt={openPromptDetail}
          onShowLibrary={() => requestView('library')}
          onShowExamples={openExamples}
          onShowSettings={openSettings}
          onShowStatistics={openStatistics}
        />
      )}
      {variablePrompt && (
        <VariableModal
          prompt={variablePrompt}
          variables={variableNames}
          storage={storage}
          onClose={() => setVariablePrompt(undefined)}
          onCopyFilled={(values) => copyFilledPrompt(variablePrompt, values)}
        />
      )}
    </main>
  );
}
