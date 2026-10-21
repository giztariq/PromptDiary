import { useEffect, useRef, useState } from 'react';

import type { CollectionCount } from '../domain/collections';

interface CollectionsDialogProps {
  collections: CollectionCount[];
  onClose: () => void;
  onRename: (from: string, to: string) => void;
  onDelete: (name: string) => void;
}

export function CollectionsDialog({
  collections,
  onClose,
  onRename,
  onDelete,
}: CollectionsDialogProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstInputRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );

    if (!focusableElements || focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-ink/40 p-4 pt-[12vh]"
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collections-dialog-title"
        tabIndex={-1}
        className="surface-card w-full max-w-lg overflow-hidden shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="eyebrow">Collections</p>
            <h2 id="collections-dialog-title" className="mt-1 text-lg font-semibold tracking-tight">
              Renommer ou détacher
            </h2>
          </div>
          <button type="button" onClick={onClose} className="button-secondary">
            Fermer
          </button>
        </div>

        {collections.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">
            Aucune collection pour l’instant. Créez-en une depuis l’éditeur d’un prompt.
          </p>
        ) : (
          <ul className="grid gap-3 p-5">
            {collections.map((collection, index) => (
              <li key={collection.name} className="grid gap-2">
                <label
                  htmlFor={`collection-${index}`}
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  {collection.name} · {collection.count} prompt{collection.count === 1 ? '' : 's'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={index === 0 ? firstInputRef : undefined}
                    id={`collection-${index}`}
                    type="text"
                    value={names[collection.name] ?? collection.name}
                    onChange={(event) =>
                      setNames((current) => ({ ...current, [collection.name]: event.target.value }))
                    }
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onRename(collection.name, names[collection.name] ?? collection.name)
                    }
                    className="button-secondary"
                  >
                    Renommer
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(collection.name)}
                    className="button-quiet text-danger"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t border-border px-5 py-3 text-xs text-muted">
          Supprimer une collection ne supprime aucun prompt : ils redeviennent sans collection.
        </p>
      </div>
    </div>
  );
}
