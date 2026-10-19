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
      className="rounded-lg px-2 py-1 text-base text-amber-700 hover:bg-amber-50"
    >
      {favorite ? '★' : '☆'}
    </button>
  );
}
