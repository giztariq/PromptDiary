interface SettingsProps {
  onBack: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClearAll?: () => void;
}

const keyboardShortcuts = [
  { keys: 'N', label: 'Créer un prompt' },
  { keys: '/', label: 'Rechercher dans la bibliothèque' },
  { keys: 'Ctrl + K', label: 'Ouvrir la palette de commandes' },
  { keys: '↑ ↓', label: 'Naviguer dans la palette de commandes' },
  { keys: 'Entrée', label: 'Valider la sélection courante' },
  { keys: 'Échap', label: 'Fermer la fenêtre ou l’écran courant' },
];

export function Settings({ onBack, onExport, onImport, onClearAll }: SettingsProps) {
  function handleClearAll() {
    if (
      onClearAll &&
      window.confirm('Effacer toute la bibliothèque ? Cette action est irréversible.')
    ) {
      onClearAll();
    }
  }

  return (
    <section aria-labelledby="settings-heading" className="surface-card mt-10 space-y-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Réglages</p>
          <h2
            id="settings-heading"
            tabIndex={-1}
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Bibliothèque locale
          </h2>
        </div>
        <button type="button" onClick={onBack} className="button-secondary" aria-label="Retour">
          Retour
        </button>
      </div>

      <section aria-labelledby="library-heading" className="space-y-4">
        <div>
          <h3 id="library-heading" className="text-lg font-semibold text-ink">
            Bibliothèque
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Gérez vos données locales et conservez une copie de vos prompts.
          </p>
        </div>

        <div className="rounded-control border border-border bg-surface-2 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onExport}
              className="button-primary"
              aria-label="Exporter la bibliothèque"
            >
              Exporter la bibliothèque
            </button>
            <label className="button-secondary cursor-pointer text-left">
              Importer une bibliothèque JSON
              <input
                type="file"
                accept="application/json,.json"
                aria-label="Importer une bibliothèque JSON"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImport(file);
                    event.currentTarget.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="error-message flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <h4 className="font-semibold">Zone de danger</h4>
            <p className="mt-1 text-sm leading-6 text-muted">
              Efface définitivement tous les prompts enregistrés dans ce navigateur.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className="button-quiet text-danger"
            aria-label="Effacer tout"
          >
            Effacer tout
          </button>
        </div>
      </section>

      <section aria-labelledby="shortcuts-heading" className="space-y-4">
        <div>
          <h3 id="shortcuts-heading" className="text-lg font-semibold text-ink">
            Raccourcis clavier
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Le clavier va plus vite que la souris. Les raccourcis se désactivent pendant la saisie.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {keyboardShortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface-2 px-4 py-3"
            >
              <dt className="text-sm text-ink">{shortcut.label}</dt>
              <dd>
                <kbd className="shortcut-key">{shortcut.keys}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="about-heading"
        className="rounded-control border border-border bg-surface-2 p-4 sm:p-5"
      >
        <h3 id="about-heading" className="font-semibold text-ink">
          À propos
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">Version 2.0.0</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Prompt Diary est local-first : vos prompts restent dans votre navigateur, sans compte ni
          serveur.
        </p>
      </section>
    </section>
  );
}
