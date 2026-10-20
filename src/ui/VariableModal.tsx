import { useEffect, useRef, useState } from 'react';

import type { Prompt } from '../domain/types';
import { variableValuesKey, type StorageAdapter } from '../storage/storageAdapter';

interface VariableModalProps {
  prompt: Prompt;
  variables: string[];
  storage: StorageAdapter;
  onClose: () => void;
  onCopyFilled: (values: Record<string, string>) => Promise<void>;
}

function emptyValues(variables: string[]): Record<string, string> {
  return Object.fromEntries(variables.map((variable) => [variable, '']));
}

export function VariableModal({
  prompt,
  variables,
  storage,
  onClose,
  onCopyFilled,
}: VariableModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(variables));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void storage
      .getValue(variableValuesKey(prompt.id))
      .then((storedValues) => {
        if (active) {
          setValues({ ...emptyValues(variables), ...storedValues });
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setValues(emptyValues(variables));
          setError('Impossible de charger les valeurs mémorisées.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [prompt.id, storage, variables]);

  useEffect(() => {
    if (!loading) {
      firstInputRef.current?.focus();
    }
  }, [loading]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !saving) {
      event.preventDefault();
      onClose();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onCopyFilled(values);
    } catch {
      setError('Impossible de copier ou d’enregistrer le prompt rempli.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="variable-modal-title"
        className="surface-card max-h-[90vh] w-full max-w-lg overflow-auto p-6 shadow-lg sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Variables dynamiques</p>
            <h2 id="variable-modal-title" className="mt-2 text-xl font-semibold tracking-tight">
              Utiliser « {prompt.title} »
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="button-quiet"
            aria-label="Fermer"
          >
            Fermer
          </button>
        </div>

        {loading && (
          <p role="status" className="mt-6 text-sm text-muted">
            Chargement des valeurs mémorisées…
          </p>
        )}

        <form className="mt-6 grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
          {variables.map((variable, index) => (
            <div key={variable}>
              <label
                htmlFor={`prompt-variable-${prompt.id}-${variable}`}
                className="text-sm font-semibold text-ink"
              >
                {variable}
              </label>
              <input
                ref={index === 0 ? firstInputRef : undefined}
                id={`prompt-variable-${prompt.id}-${variable}`}
                name={variable}
                value={values[variable] ?? ''}
                onChange={(event) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    [variable]: event.target.value,
                  }))
                }
                disabled={loading || saving}
                className="form-input mt-2"
              />
            </div>
          ))}

          {error && (
            <p role="alert" className="error-message p-3 text-sm">
              {error}
            </p>
          )}

          <div className="editor-actions">
            <button type="button" onClick={onClose} disabled={saving} className="button-quiet">
              Annuler
            </button>
            <button type="submit" disabled={loading || saving} className="button-primary">
              {saving ? 'Copie…' : 'Copier le prompt rempli'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
