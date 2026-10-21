import type { CollectionCount, CollectionFilter } from '../domain/collections';

interface CollectionSidebarProps {
  collections: CollectionCount[];
  active: CollectionFilter;
  onSelect: (filter: CollectionFilter) => void;
  onManage: () => void;
  totalCount: number;
  favoritesCount: number;
  unassignedCount: number;
}

function isActive(active: CollectionFilter, kind: CollectionFilter['kind'], name?: string) {
  if (active.kind !== kind) {
    return false;
  }

  if (kind === 'collection') {
    return active.kind === 'collection' && active.name === name;
  }

  return true;
}

export function CollectionSidebar({
  collections,
  active,
  onSelect,
  onManage,
  totalCount,
  favoritesCount,
  unassignedCount,
}: CollectionSidebarProps) {
  return (
    <nav aria-label="Collections" className="lg:sticky lg:top-24">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
        <li>
          <button
            type="button"
            aria-pressed={isActive(active, 'all')}
            onClick={() => onSelect({ kind: 'all' })}
            className="filter-chip flex w-full items-center justify-between gap-2"
          >
            <span>Tous</span>
            <span className="font-mono text-[11px] opacity-80">{totalCount}</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            aria-pressed={isActive(active, 'favorites')}
            onClick={() => onSelect({ kind: 'favorites' })}
            className="filter-chip flex w-full items-center justify-between gap-2"
          >
            <span>Favoris</span>
            <span className="font-mono text-[11px] opacity-80">{favoritesCount}</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            aria-pressed={isActive(active, 'none')}
            onClick={() => onSelect({ kind: 'none' })}
            className="filter-chip flex w-full items-center justify-between gap-2"
          >
            <span>Sans collection</span>
            <span className="font-mono text-[11px] opacity-80">{unassignedCount}</span>
          </button>
        </li>
        {collections.map((collection) => (
          <li key={collection.name}>
            <button
              type="button"
              aria-pressed={isActive(active, 'collection', collection.name)}
              onClick={() => onSelect({ kind: 'collection', name: collection.name })}
              className="filter-chip flex w-full items-center justify-between gap-2"
            >
              <span className="truncate">{collection.name}</span>
              <span className="font-mono text-[11px] opacity-80">{collection.count}</span>
            </button>
          </li>
        ))}
      </ul>
      {collections.length > 0 && (
        <button
          type="button"
          onClick={onManage}
          className="button-quiet mt-3 text-xs lg:w-full lg:text-left"
        >
          Gérer les collections
        </button>
      )}
    </nav>
  );
}
