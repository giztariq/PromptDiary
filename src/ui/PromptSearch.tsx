interface PromptSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
}

export function PromptSearch({
  query,
  onQueryChange,
  tags,
  selectedTags,
  onToggleTag,
  minRating,
  onMinRatingChange,
}: PromptSearchProps) {
  return (
    <div className="search-panel space-y-3">
      <div className="relative">
        <label htmlFor="prompt-search" className="sr-only">
          Rechercher dans les prompts
        </label>
        <input
          id="prompt-search"
          type="search"
          role="searchbox"
          aria-keyshortcuts="/"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Rechercher un prompt…"
          className="search-input pr-14"
        />
        <span className="shortcut-hint" aria-hidden="true">
          /
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par tag">
        {tags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={selected}
              aria-label={`Tag : ${tag}`}
              onClick={() => onToggleTag(tag)}
              className="filter-chip inline-flex items-center gap-1"
            >
              #{tag}
              {selected && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <span>Note minimale</span>
          <select
            aria-label="Note minimale"
            value={minRating}
            onChange={(event) => onMinRatingChange(Number(event.target.value))}
            className="form-select w-auto min-w-24"
          >
            <option value={0}>Toutes</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}+
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
