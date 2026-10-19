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
    <section aria-labelledby="detail-heading" className="surface-card mt-10 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Détail</p>
          <h2 id="detail-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            {prompt.title}
          </h2>
        </div>
        <button type="button" onClick={onBack} className="button-secondary">
          Retour
        </button>
      </div>
      <pre className="mt-8 whitespace-pre-wrap rounded-xl bg-zinc-950 p-5 text-sm leading-7 text-zinc-100">
        {prompt.body}
      </pre>
      {prompt.context && (
        <p className="mt-5 text-sm leading-6 text-zinc-600">
          <strong className="text-zinc-950">Contexte :</strong> {prompt.context}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
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
      <button type="button" onClick={onCopy} className="button-primary mt-6">
        Copier le prompt
      </button>
    </section>
  );
}
