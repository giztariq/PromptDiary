import type { MouseEventHandler } from 'react';

interface FavoriteButtonProps {
  favorite: boolean;
  promptTitle: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function FavoriteButton({ favorite, promptTitle, onClick }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(event) => event.stopPropagation()}
      aria-pressed={favorite}
      aria-label={`${favorite ? 'Retirer' : 'Ajouter'} ${promptTitle} aux favoris`}
      className="button-quiet min-h-9 px-2 py-1 text-base text-accent"
    >
      {favorite ? '★' : '☆'}
    </button>
  );
}
