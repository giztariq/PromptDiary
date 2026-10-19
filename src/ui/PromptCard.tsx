import type { Prompt } from '../domain/types';
import { detectVaguePrompt } from '../domain/vagueDetection';
import { FavoriteButton } from './FavoriteButton';
import { HighlightedText } from './HighlightedText';

interface PromptCardProps {
  prompt: Prompt;
  onOpen: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
  query: string;
}

function VagueBadge({ prompt }: { prompt: Prompt }) {
  const detection = detectVaguePrompt(prompt);

  if (!detection.vague) {
    return null;
  }

  return (
    <span className="badge" title={detection.suggestion}>
      À préciser
    </span>
  );
}

export function PromptCard({ prompt, onOpen, onCopy, onToggleFavorite, query }: PromptCardProps) {
  return (
    <article className="prompt-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ouvrir ${prompt.title}`}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-base font-semibold leading-6 text-ink">
            <HighlightedText text={prompt.title} query={query} />
          </h3>
          <p className="prompt-excerpt mt-2">
            <HighlightedText text={prompt.body} query={query} />
          </p>
        </button>
        <VagueBadge prompt={prompt} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prompt.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
        {prompt.model && <span className="text-xs font-medium text-muted">{prompt.model}</span>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-muted">
        <span aria-label={`Note ${prompt.rating} sur 5`} className="font-semibold text-accent">
          ★ {prompt.rating}/5
        </span>
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
          className="button-secondary ml-auto min-h-9 px-3 py-1 text-xs"
        >
          Copier
        </button>
      </div>
    </article>
  );
}
