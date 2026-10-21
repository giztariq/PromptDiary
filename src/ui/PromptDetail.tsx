import type { Prompt, PromptVersion } from '../domain/types';
import { formatRelativeDate } from '../domain/format';
import { parseVariables } from '../domain/variables';
import { FavoriteButton } from './FavoriteButton';

interface PromptDetailProps {
  prompt: Prompt;
  onBack: () => void;
  onCopy: () => void;
  onUse: () => void;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onRestoreVersion?: (version: PromptVersion) => void;
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(date);
}

export function PromptDetail({
  prompt,
  onBack,
  onCopy,
  onUse,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
  onRestoreVersion,
}: PromptDetailProps) {
  const variables = parseVariables(prompt.body);
  const handleDelete = () => {
    if (window.confirm(`Supprimer « ${prompt.title} » ? Cette action est irréversible.`)) {
      onDelete?.();
    }
  };

  return (
    <section aria-labelledby="detail-heading" className="surface-card mt-10 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Détail</p>
          <h2
            id="detail-heading"
            tabIndex={-1}
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            {prompt.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            favorite={prompt.favorite}
            promptTitle={prompt.title}
            onClick={onToggleFavorite}
          />
          <button type="button" onClick={onBack} className="button-secondary">
            Retour
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-control border border-border bg-ink p-4 sm:p-6">
        <pre
          aria-label="Corps du prompt"
          className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-7 text-surface"
        >
          {prompt.body}
        </pre>
        {variables.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="badge">
              {variables.length} variable{variables.length === 1 ? '' : 's'}
            </span>
            <button type="button" onClick={onUse} className="button-primary min-h-10 px-4 py-2">
              Utiliser
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="button-primary mt-5 min-h-12 w-full px-5 py-3 text-base"
        >
          Copier le prompt
        </button>
      </div>

      {prompt.context && (
        <div className="mt-6 rounded-control border border-border bg-surface-2 p-4 text-sm leading-6 text-muted">
          <p>
            <strong className="text-ink">Contexte</strong>
          </p>
          <p className="mt-1">{prompt.context}</p>
        </div>
      )}

      <div className="mt-8 border-t border-border pt-6">
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Tags</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {prompt.tags.length > 0 ? (
                prompt.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-muted">Aucun tag</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Modèle</dt>
            <dd className="mt-2">
              <span className="badge">{prompt.model || 'Non renseigné'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Collection</dt>
            <dd className="mt-2">
              {prompt.collection ? (
                <span className="badge">{prompt.collection}</span>
              ) : (
                <span className="text-muted">Aucune</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Note</dt>
            <dd className="mt-2 font-medium text-accent" aria-label={`Note ${prompt.rating} sur 5`}>
              ★ {prompt.rating}/5
            </dd>
          </div>
          <div>
            <dt className="text-muted">Créé le</dt>
            <dd className="mt-2 font-medium text-ink">
              <time dateTime={prompt.createdAt}>{formatDate(prompt.createdAt)}</time>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-control border border-border bg-surface-2 p-4 text-sm">
        <span className="font-medium text-ink">
          Usage : <strong className="text-accent">{prompt.copyCount}</strong> copie
          {prompt.copyCount === 1 ? '' : 's'}
        </span>
        {prompt.lastUsedAt && (
          <span className="text-muted">
            Dernière utilisation{' '}
            <time dateTime={prompt.lastUsedAt} title={formatDate(prompt.lastUsedAt, true)}>
              {formatRelativeDate(prompt.lastUsedAt)}
            </time>
          </span>
        )}
        <span className="text-muted">
          Mis à jour{' '}
          <time dateTime={prompt.updatedAt} title={formatDate(prompt.updatedAt, true)}>
            {formatRelativeDate(prompt.updatedAt)}
          </time>
        </span>
      </div>

      {prompt.usageLog && prompt.usageLog.length > 0 && (
        <details className="mt-4 rounded-control border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium text-ink">
            Historique d’utilisation ({prompt.usageLog.length})
          </summary>
          <ol className="mt-3 grid gap-1 text-muted">
            {prompt.usageLog
              .slice(-5)
              .reverse()
              .map((timestamp, index) => (
                <li key={`${timestamp}-${index}`}>
                  <time dateTime={timestamp} title={formatDate(timestamp, true)}>
                    {formatRelativeDate(timestamp)}
                  </time>
                </li>
              ))}
          </ol>
        </details>
      )}

      {prompt.versions && prompt.versions.length > 0 && (
        <details className="mt-4 rounded-control border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium text-ink">
            Historique des versions ({prompt.versions.length})
          </summary>
          <ul className="mt-3 grid gap-3">
            {prompt.versions.map((version, index) => (
              <li
                key={`${version.savedAt}-${index}`}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{version.title}</p>
                  <p className="mt-1 font-mono text-xs leading-5 text-muted">
                    {version.body.slice(0, 120)}
                    {version.body.length > 120 ? '…' : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatRelativeDate(version.savedAt)} · {formatDate(version.savedAt, true)}
                  </p>
                </div>
                {onRestoreVersion && (
                  <button
                    type="button"
                    onClick={() => onRestoreVersion(version)}
                    className="button-secondary shrink-0 text-xs"
                  >
                    Restaurer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <button type="button" onClick={onEdit} className="button-secondary">
          Éditer
        </button>
        <button type="button" onClick={onDuplicate} className="button-secondary">
          Dupliquer
        </button>
        <button type="button" onClick={handleDelete} className="button-quiet text-danger">
          Supprimer
        </button>
      </div>
    </section>
  );
}
