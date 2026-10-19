import type { Prompt } from '../domain/types';
import { detectVaguePrompt } from '../domain/vagueDetection';
import { FavoriteButton } from './FavoriteButton';

interface PromptCardProps {
  prompt: Prompt;
  onOpen: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
}

function VagueBadge({ prompt }: { prompt: Prompt }) {
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

export function PromptCard({ prompt, onOpen, onCopy, onToggleFavorite }: PromptCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ouvrir ${prompt.title}`}
          className="text-left"
        >
          <h3 className="text-lg font-semibold text-slate-950">{prompt.title}</h3>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {prompt.body}
          </p>
        </button>
        <VagueBadge prompt={prompt} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {prompt.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
            {tag}
          </span>
        ))}
        {prompt.model && <span>{prompt.model}</span>}
        <span aria-label={`Note ${prompt.rating} sur 5`}>★ {prompt.rating}/5</span>
        <span aria-label={`${prompt.copyCount} copies`}>
          {prompt.copyCount} copie{prompt.copyCount === 1 ? '' : 's'}
        </span>
        <FavoriteButton
          favorite={prompt.favorite}
          promptTitle={prompt.title}
          onClick={onToggleFavorite}
        />
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Copier
        </button>
      </div>
    </article>
  );
}
