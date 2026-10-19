import type { PromptDraft } from '../domain/validation';
import { LogoMark } from './LogoMark';

const exampleDrafts: PromptDraft[] = [
  {
    title: 'Analyse de document',
    body: 'Agis comme un analyste senior. Analyse ce document pour une équipe produit et réponds sous forme de tableau avec les trois recommandations prioritaires. Ton clair, ne pas inventer de données.',
    tags: ['analyse', 'travail'],
    model: 'Claude',
    context: 'Préparer une réunion de décision',
    rating: 5,
  },
  {
    title: 'Réponse client',
    body: 'Tu es un responsable relation client. Rédige une réponse concise et chaleureuse à ce message, en liste de trois points, sans promesse impossible et avec un exemple de formulation.',
    tags: ['email', 'client'],
    model: 'GPT',
    context: 'Répondre à un client mécontent',
    rating: 4,
  },
];

interface ExamplesProps {
  onBack: () => void;
  onUse: (draft: PromptDraft) => void;
}

export function Examples({ onBack, onUse }: ExamplesProps) {
  return (
    <section
      aria-labelledby="examples-heading"
      className="surface-card page-transition mt-8 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="eyebrow">Bibliothèque de départ</p>
            <h2 id="examples-heading" className="mt-2 text-2xl font-semibold tracking-tight">
              Exemples de prompts
            </h2>
          </div>
        </div>
        <button type="button" onClick={onBack} className="button-secondary">
          Retour
        </button>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Des fiches locales pour partir d’une structure claire, puis l’adapter à votre usage.
      </p>
      <div className="mt-8 grid gap-4">
        {exampleDrafts.map((example) => (
          <article key={example.title} className="prompt-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-sans text-base font-semibold text-ink">{example.title}</h3>
                <p className="prompt-excerpt prompt-excerpt--mono mt-2">{example.body}</p>
              </div>
              <span className="badge">Exemple</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {example.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
              <span className="badge">{example.model}</span>
              <button
                type="button"
                onClick={() => onUse(example)}
                className="button-primary ml-auto"
              >
                Utiliser ce modèle
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
