export interface VaguePromptInput {
  body: string;
  context: string;
}

export interface VagueDetectionResult {
  vague: boolean;
  reasons: string[];
  suggestion: string;
}

const CONTEXT_OR_ROLE_PATTERN =
  /\b(role|rôle|contexte|context|expert|analyste|assistant|agis comme|tu es|en tant que)\b/i;
const OUTPUT_FORMAT_PATTERN =
  /\b(format|réponds|reponds|liste|tableau|json|markdown|étapes|etapes|puces|bullet|sortie|output)\b/i;

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

export function detectVaguePrompt(input: VaguePromptInput): VagueDetectionResult {
  const reasons: string[] = [];
  const hasContextOrRole =
    Boolean(input.context.trim()) || CONTEXT_OR_ROLE_PATTERN.test(input.body);
  const hasOutputFormat = OUTPUT_FORMAT_PATTERN.test(input.body);

  if (wordCount(input.body) < 15) {
    reasons.push('Moins de 15 mots.');
  }
  if (!hasContextOrRole) {
    reasons.push('Aucun rôle ou contexte explicite.');
  }
  if (!hasOutputFormat) {
    reasons.push('Aucun format de sortie demandé.');
  }

  if (reasons.length < 2) {
    return { vague: false, reasons: [], suggestion: '' };
  }

  const suggestions = [
    !hasContextOrRole ? 'Ajoutez un rôle ou un contexte.' : '',
    !hasOutputFormat ? 'Précisez le format de sortie.' : '',
    wordCount(input.body) < 15 ? 'Développez un peu la consigne.' : '',
  ].filter(Boolean);

  return {
    vague: true,
    reasons,
    suggestion: suggestions.join(' '),
  };
}
