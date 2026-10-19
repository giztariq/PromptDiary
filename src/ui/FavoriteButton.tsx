interface FavoriteButtonProps {
  favorite: boolean;
  promptTitle: string;
  onClick: () => void;
}

export function FavoriteButton({ favorite, promptTitle, onClick }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorite}
      aria-label={`${favorite ? 'Retirer' : 'Ajouter'} ${promptTitle} aux favoris`}
      className="button-quiet min-h-9 px-2 py-1 text-base text-amber-700"
    >
      {favorite ? '★' : '☆'}
    </button>
  );
}
