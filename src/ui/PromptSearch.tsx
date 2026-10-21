import { useState } from 'react';

import { SORT_OPTIONS, type SortOption } from '../domain/sort';

const MAX_VISIBLE_TAGS = 12;

interface PromptSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function PromptSearch({
  query,
  onQueryChange,
  tags,
  selectedTags,
  onToggleTag,
  minRating,
  onMinRatingChange,
  sort,
  onSortChange,
}: PromptSearchProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const visibleTags = tagsExpanded ? tags : tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = tags.length - visibleTags.length;

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
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrer les prompts"
      >
        {visibleTags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={selected}
              aria-label={`Tag : #${tag}`}
              onClick={() => onToggleTag(tag)}
              className="filter-chip inline-flex items-center gap-1"
            >
              #{tag}
              {selected && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
        {hiddenTagCount > 0 && (
          <button
            type="button"
            aria-expanded="false"
            onClick={() => setTagsExpanded(true)}
            className="filter-chip"
          >
            +{hiddenTagCount} tag{hiddenTagCount === 1 ? '' : 's'}
          </button>
        )}
        {tagsExpanded && tags.length > MAX_VISIBLE_TAGS && (
          <button
            type="button"
            aria-expanded="true"
            onClick={() => setTagsExpanded(false)}
            className="filter-chip"
          >
            Réduire
          </button>
        )}
        <span className="ml-auto text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Note minimale
        </span>
        {[0, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            aria-pressed={minRating === rating}
            aria-label={rating === 0 ? 'Note minimale : Toutes' : `Note minimale : ${rating}+`}
            onClick={() => onMinRatingChange(rating)}
            className="filter-chip"
          >
            {rating === 0 ? 'Toutes' : `${rating}+`}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="prompt-sort"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted"
        >
          Trier par
        </label>
        <select
          id="prompt-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className="filter-select"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
