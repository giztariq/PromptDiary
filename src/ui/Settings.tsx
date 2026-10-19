interface SettingsProps {
  onBack: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Settings({ onBack, onExport, onImport }: SettingsProps) {
  return (
    <section
      aria-labelledby="settings-heading"
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Réglages
          </p>
          <h2 id="settings-heading" className="mt-2 text-2xl font-bold tracking-tight">
            Bibliothèque locale
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
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl border border-indigo-200 px-4 py-3 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Exporter la bibliothèque
        </button>
        <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
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
      <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <h3 className="font-semibold text-slate-900">À propos</h3>
        <p className="mt-2">
          Prompt Diary garde vos prompts dans votre navigateur. Aucun compte ni serveur.
        </p>
      </div>
    </section>
  );
}
