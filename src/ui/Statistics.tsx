import { computeLibraryStats } from '../domain/stats';
import type { Prompt } from '../domain/types';

interface StatisticsProps {
  prompts: Prompt[];
  onOpenPrompt: (prompt: Prompt) => void;
  onBack: () => void;
  onCreate: () => void;
}

function formatDecimal(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );
}

export function Statistics({ prompts, onOpenPrompt, onBack, onCreate }: StatisticsProps) {
  const stats = computeLibraryStats(prompts);
  const neverUsed = prompts.filter((prompt) => prompt.copyCount === 0);

  return (
    <section aria-labelledby="statistics-heading" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Vue d’ensemble</p>
          <h2
            id="statistics-heading"
            tabIndex={-1}
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Statistiques
          </h2>
        </div>
        <button type="button" onClick={onBack} className="button-secondary" aria-label="Retour">
          Retour
        </button>
      </div>

      {stats.total === 0 ? (
        <div className="state-card empty-state mt-8">
          <div className="empty-state__content">
            <p className="eyebrow">Aucune donnée</p>
            <h3 className="mt-2 text-2xl font-semibold">Rien à mesurer pour l’instant</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              Importez les exemples ou créez un premier prompt : les statistiques se calculent
              uniquement sur votre bibliothèque locale.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={onCreate} className="button-primary">
                Créer un prompt
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Prompts"
              value={String(stats.total)}
              hint={`${stats.withTags} avec tags · ${stats.withVariables} avec variables`}
            />
            <StatTile
              label="Copies"
              value={String(stats.totalCopies)}
              hint={`${stats.neverUsed} jamais utilisé${stats.neverUsed === 1 ? '' : 's'}`}
            />
            <StatTile
              label="Favoris"
              value={String(stats.favorites)}
              hint={`${Math.round((stats.favorites / stats.total) * 100)} % de la bibliothèque`}
            />
            <StatTile
              label="Note moyenne"
              value={`${formatDecimal(stats.averageRating)} / 5`}
              hint="Sur l’ensemble des prompts"
            />
          </div>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <div className="surface-card p-5 sm:p-6">
              <h3 className="text-lg font-semibold tracking-tight">Les plus utilisés</h3>
              {stats.topPrompts.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Aucun prompt n’a encore été copié. Les plus repris apparaîtront ici.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {stats.topPrompts.map((entry) => (
                    <li key={entry.prompt.id}>
                      <button
                        type="button"
                        onClick={() => onOpenPrompt(entry.prompt)}
                        className="flex w-full items-center justify-between gap-3 rounded-control px-2 py-2 text-left text-sm hover:bg-surface-2"
                      >
                        <span className="truncate text-ink">{entry.prompt.title}</span>
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {entry.copies}×
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="surface-card p-5 sm:p-6">
              <h3 className="text-lg font-semibold tracking-tight">Tags les plus utilisés</h3>
              {stats.topTags.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Ajoutez des tags à vos prompts pour retrouver vos thématiques.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {stats.topTags.map((entry) => (
                    <li
                      key={entry.tag}
                      className="flex items-center justify-between gap-3 px-2 py-1 text-sm"
                    >
                      <span className="tag-chip">#{entry.tag}</span>
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {entry.prompts} prompt{entry.prompts === 1 ? '' : 's'} · {entry.copies}×
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5 sm:p-6">
              <h3 className="text-lg font-semibold tracking-tight">Répartition des notes</h3>
              <ul className="mt-4 space-y-3">
                {stats.ratingDistribution.map((entry) => {
                  const percentage =
                    stats.total === 0 ? 0 : Math.round((entry.count / stats.total) * 100);
                  return (
                    <li
                      key={entry.rating}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                    >
                      <span className="text-sm text-muted">{entry.rating}★</span>
                      <span aria-hidden="true" className="h-2 rounded-full bg-surface-2">
                        <span
                          className="block h-2 rounded-full bg-accent"
                          style={{ width: `${percentage}%` }}
                        />
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {entry.count} ({percentage} %)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="surface-card p-5 sm:p-6">
              <h3 className="text-lg font-semibold tracking-tight">Jamais copiés</h3>
              {neverUsed.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Toute la bibliothèque a déjà servi au moins une fois.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted">
                    {neverUsed.length} prompt{neverUsed.length === 1 ? '' : 's'} en attente d’un
                    essai.
                  </p>
                  <ul className="mt-3 space-y-1">
                    {neverUsed.slice(0, 5).map((prompt) => (
                      <li key={prompt.id}>
                        <button
                          type="button"
                          onClick={() => onOpenPrompt(prompt)}
                          className="truncate text-left text-sm text-ink hover:underline"
                        >
                          {prompt.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {neverUsed.length > 5 && (
                    <p className="mt-2 text-xs text-muted">
                      et {neverUsed.length - 5} autre{neverUsed.length - 5 === 1 ? '' : 's'} dans la
                      bibliothèque.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
