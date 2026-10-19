interface HighlightedTextProps {
  text: string;
  query: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi'));
  const normalizedQuery = trimmedQuery.toLocaleLowerCase();

  return (
    <>
      {parts.map((part, index) =>
        part.toLocaleLowerCase() === normalizedQuery ? (
          <mark key={`${part}-${index}`} className="highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
