import type { Prompt } from '../domain/types';
import { FavoriteButton } from './FavoriteButton';

interface PromptDetailProps {
  prompt: Prompt;
  onBack: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
}

export function PromptDetail({ prompt, onBack, onCopy, onToggleFavorite }: PromptDetailProps) {
  return (
    <section
      aria-labelledby="detail-heading"
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Détail
          </p>
          <h2 id="detail-heading" className="mt-2 text-2xl font-bold tracking-tight">
            {prompt.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Retour
        </button>
      </div>
      <pre className="mt-8 whitespace-pre-wrap rounded-xl bg-slate-950 p-5 text-sm leading-7 text-slate-100">
        {prompt.body}
      </pre>
      {prompt.context && (
        <p className="mt-5 text-sm leading-6 text-slate-600">
          <strong className="text-slate-900">Contexte :</strong> {prompt.context}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>Note : {prompt.rating}/5</span>
        <span>
          {prompt.copyCount} copie{prompt.copyCount === 1 ? '' : 's'}
        </span>
        <FavoriteButton
          favorite={prompt.favorite}
          promptTitle={prompt.title}
          onClick={onToggleFavorite}
        />
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-6 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Copier le prompt
      </button>
    </section>
  );
}
