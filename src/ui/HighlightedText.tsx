import type { ReactNode } from 'react';

interface HighlightedTextProps {
  text: string;
  query: string;
}

interface MatchRange {
  start: number;
  end: number;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
}

function buildIndexMap(text: string): { normalized: string; map: number[] } {
  let normalized = '';
  const map: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedCharacter = normalize(text[index]);

    for (const character of normalizedCharacter) {
      normalized += character;
      map.push(index);
    }
  }

  return { normalized, map };
}

function extendToCombiningMarks(text: string, end: number): number {
  let extended = end;

  while (extended < text.length && /\p{M}/u.test(text[extended])) {
    extended += 1;
  }

  return extended;
}

function findRanges(text: string, query: string): MatchRange[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  const { normalized, map } = buildIndexMap(text);
  const ranges: MatchRange[] = [];
  let from = 0;

  while (from < normalized.length) {
    const matchIndex = normalized.indexOf(normalizedQuery, from);
    if (matchIndex === -1) {
      break;
    }

    const start = map[matchIndex];
    const end = extendToCombiningMarks(text, map[matchIndex + normalizedQuery.length - 1] + 1);
    const previousRange = ranges.at(-1);

    if (previousRange && start <= previousRange.end) {
      previousRange.end = Math.max(previousRange.end, end);
    } else {
      ranges.push({ start, end });
    }

    from = matchIndex + normalizedQuery.length;
  }

  return ranges;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <>{text}</>;
  }

  const ranges = findRanges(text, trimmedQuery);
  if (ranges.length === 0) {
    return <>{text}</>;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }
    parts.push(
      <mark key={`${range.start}-${index}`} className="highlight">
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}
