interface SettingsProps {
  onBack: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Settings({ onBack, onExport, onImport }: SettingsProps) {
  return (
    <section aria-labelledby="settings-heading" className="surface-card mt-10 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Réglages</p>
          <h2 id="settings-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Bibliothèque locale
          </h2>
        </div>
        <button type="button" onClick={onBack} className="button-secondary">
          Retour
        </button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={onExport} className="button-secondary">
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
      <div className="mt-8 rounded-control border border-border bg-surface-2 p-4 text-sm leading-6 text-muted">
        <h3 className="font-semibold text-ink">À propos</h3>
        <p className="mt-2">
          Prompt Diary garde vos prompts dans votre navigateur. Aucun compte ni serveur.
        </p>
      </div>
    </section>
  );
}
