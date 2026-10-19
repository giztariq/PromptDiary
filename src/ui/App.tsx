import { useEffect, useState } from 'react';

import { createPromptFromDraft } from '../domain/promptCreation';
import {
  validatePromptDraft,
  type PromptDraft,
  type PromptDraftErrors,
} from '../domain/validation';
import { detectVaguePrompt } from '../domain/vagueDetection';
import type { Prompt } from '../domain/types';
import { createIndexedDbAdapter } from '../storage/indexedDbAdapter';
import type { StorageAdapter } from '../storage/storageAdapter';

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

function PromptBadge({ prompt }: { prompt: Pick<Prompt, 'body' | 'context'> }) {
  const detection = detectVaguePrompt(prompt);

  if (!detection.vague) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900"
      title={detection.suggestion}
    >
      À préciser
    </span>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{prompt.title}</h2>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {prompt.body}
          </p>
        </div>
        <PromptBadge prompt={prompt} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {prompt.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
            {tag}
          </span>
        ))}
        {prompt.model && <span>{prompt.model}</span>}
        <span aria-label={`Note ${prompt.rating} sur 5`}>★ {prompt.rating}/5</span>
      </div>
    </article>
  );
}

interface PromptLibraryProps {
  prompts: Prompt[];
  onCreate: () => void;
}

function PromptLibrary({ prompts, onCreate }: PromptLibraryProps) {
  return (
    <section aria-labelledby="library-heading" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Bibliothèque
          </p>
          <h2 id="library-heading" className="mt-2 text-2xl font-bold tracking-tight">
            Vos prompts
          </h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Nouveau prompt
        </button>
      </div>

      {prompts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-lg font-semibold">Aucun prompt enregistré</h3>
          <p className="mt-2 text-sm text-slate-600">
            Créez votre premier prompt pour commencer votre bibliothèque locale.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Créer un prompt
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4" aria-label="Liste des prompts">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
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
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Éditeur
          </p>
          <h2 id="editor-heading" className="mt-2 text-2xl font-bold tracking-tight">
            Nouveau prompt
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
          <label htmlFor="prompt-title" className="text-sm font-semibold text-slate-800">
            Titre
          </label>
          <input
            id="prompt-title"
            value={draft.title}
            onChange={(event) => onChange('title', event.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'prompt-title-error' : undefined}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm"
          />
          {errors.title && (
            <p id="prompt-title-error" className="mt-1 text-sm text-red-700">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="prompt-body" className="text-sm font-semibold text-slate-800">
            Corps du prompt
          </label>
          <textarea
            id="prompt-body"
            value={draft.body}
            onChange={(event) => onChange('body', event.target.value)}
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? 'prompt-body-error' : undefined}
            rows={7}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 shadow-sm"
          />
          {errors.body && (
            <p id="prompt-body-error" className="mt-1 text-sm text-red-700">
              {errors.body}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="prompt-tags" className="text-sm font-semibold text-slate-800">
              Tags
            </label>
            <input
              id="prompt-tags"
              value={tagsValue}
              onChange={(event) => onChange('tags', event.target.value)}
              placeholder="analyse, synthèse"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm"
            />
            <p className="mt-1 text-xs text-slate-500">Séparez les tags par des virgules.</p>
          </div>
          <div>
            <label htmlFor="prompt-model" className="text-sm font-semibold text-slate-800">
              Modèle
            </label>
            <input
              id="prompt-model"
              value={draft.model}
              onChange={(event) => onChange('model', event.target.value)}
              placeholder="GPT, Claude…"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="prompt-context" className="text-sm font-semibold text-slate-800">
            Contexte
          </label>
          <textarea
            id="prompt-context"
            value={draft.context}
            onChange={(event) => onChange('context', event.target.value)}
            rows={3}
            placeholder="À quoi sert ce prompt ?"
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="prompt-rating" className="text-sm font-semibold text-slate-800">
            Note
          </label>
          <select
            id="prompt-rating"
            value={draft.rating}
            onChange={(event) => onChange('rating', Number(event.target.value))}
            aria-invalid={Boolean(errors.rating)}
            aria-describedby={errors.rating ? 'prompt-rating-error' : undefined}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm sm:max-w-xs"
          >
            <option value={0}>Choisir une note</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
          {errors.rating && (
            <p id="prompt-rating-error" className="mt-1 text-sm text-red-700">
              {errors.rating}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Aperçu</span>
            {detection.vague ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                À préciser
              </span>
            ) : (
              <span className="text-sm font-medium text-emerald-700">
                Prompt suffisamment précis
              </span>
            )}
          </div>
          {detection.vague && <p className="mt-2 text-sm text-amber-900">{detection.suggestion}</p>}
        </div>

        {saveError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {saveError}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer le prompt'}
        </button>
      </form>
    </section>
  );
}

export default function App({ storage = defaultStorage }: AppProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [draft, setDraft] = useState<PromptDraft>(emptyDraft);
  const [tagsValue, setTagsValue] = useState('');
  const [errors, setErrors] = useState<PromptDraftErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

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
  }, [storage]);

  function openEditor() {
    setDraft(emptyDraft);
    setTagsValue('');
    setErrors({});
    setSaveError('');
    setView('editor');
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:py-14">
      <section className="mx-auto max-w-4xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Local-first prompt journal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Prompt Diary</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Gardez vos prompts utiles, notez ce qui fonctionne et retrouvez-les en quelques
            secondes.
          </p>
        </header>

        {status === 'loading' && (
          <p
            role="status"
            aria-label="Chargement des prompts…"
            className="mt-10 rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm"
          >
            Chargement des prompts…
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="mt-10 rounded-2xl bg-red-50 p-6 text-sm text-red-800">
            Impossible de charger les prompts.
          </p>
        )}
        {status === 'ready' && view === 'library' && (
          <PromptLibrary prompts={prompts} onCreate={openEditor} />
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
    </main>
  );
}
