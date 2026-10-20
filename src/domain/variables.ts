const VARIABLE_PATTERN = /\{\{\s*([\p{L}0-9_-]+)\s*\}\}/gu;

export function parseVariables(text: string): string[] {
  const variables: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      variables.push(name);
    }
  }

  return variables;
}

export function fillVariables(text: string, values: Record<string, string>): string {
  return text.replace(VARIABLE_PATTERN, (placeholder, name: string) => {
    if (Object.prototype.hasOwnProperty.call(values, name)) {
      return values[name];
    }
    return placeholder;
  });
}
