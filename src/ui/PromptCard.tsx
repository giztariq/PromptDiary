import type { Prompt } from '../domain/types';
import { parseVariables } from '../domain/variables';
import { detectVaguePrompt } from '../domain/vagueDetection';
import { FavoriteButton } from './FavoriteButton';
import { HighlightedText } from './HighlightedText';

interface PromptCardProps {
  prompt: Prompt;
  onOpen: () => void;
  onCopy: () => void;
  onUse: () => void;
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

export function PromptCard({
  prompt,
  onOpen,
  onCopy,
  onUse,
  onToggleFavorite,
  query,
}: PromptCardProps) {
  const variables = parseVariables(prompt.body);

  return (
    <article className="prompt-card">
      <button type="button" onClick={onOpen} className="prompt-card__open">
        <span className="sr-only">Ouvrir {prompt.title}</span>
      </button>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-base font-semibold leading-6 text-ink">
            <HighlightedText text={prompt.title} query={query} />
          </h3>
          <p className="prompt-excerpt prompt-excerpt--mono mt-2">
            <HighlightedText text={prompt.body} query={query} />
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <VagueBadge prompt={prompt} />
          {variables.length > 0 && (
            <span className="badge">
              {variables.length} variable{variables.length === 1 ? '' : 's'}
            </span>
          )}
          <span className="prompt-card__favorite">
            <FavoriteButton
              favorite={prompt.favorite}
              promptTitle={prompt.title}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite();
              }}
            />
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prompt.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
        {prompt.model && <span className="badge">{prompt.model}</span>}
        {variables.length > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUse();
            }}
            onKeyDown={(event) => event.stopPropagation()}
            className="button-primary ml-auto min-h-9 px-3 py-1 text-xs"
          >
            Utiliser
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-muted">
        <span role="img" aria-label={`Note ${prompt.rating} sur 5`} className="rating-dots">
          {[1, 2, 3, 4, 5].map((rating) => (
            <span
              key={rating}
              aria-hidden="true"
              className={rating <= prompt.rating ? 'rating-dot rating-dot--filled' : 'rating-dot'}
            />
          ))}
        </span>
        <span className="font-mono text-xs">copié {prompt.copyCount}×</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }}
          onKeyDown={(event) => event.stopPropagation()}
          className="button-secondary prompt-card__copy ml-auto min-h-9 px-3 py-1 text-xs"
        >
          Copier
        </button>
      </div>
    </article>
  );
}
