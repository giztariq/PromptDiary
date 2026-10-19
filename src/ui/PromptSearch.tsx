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
    <div className="sticky top-0 z-10 mt-6 space-y-3 bg-slate-50/95 py-3 backdrop-blur">
      <label htmlFor="prompt-search" className="sr-only">
        Rechercher dans les prompts
      </label>
      <input
        id="prompt-search"
        type="search"
        role="searchbox"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Rechercher un prompt…"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={selected}
              aria-label={`Tag : ${tag}`}
              onClick={() => onToggleTag(tag)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                selected
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              #{tag}
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <span>Note minimale</span>
          <select
            aria-label="Note minimale"
            value={minRating}
            onChange={(event) => onMinRatingChange(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
