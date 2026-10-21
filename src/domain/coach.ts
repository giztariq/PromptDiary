export interface PromptPatch {
  label: string;
  apply: (text: string) => string;
}

const ROLE_MARKER = /\b(?:agis comme|tu es|vous etes|en tant que)\b/i;
const CONTEXT_MARKER = /\bcontexte\s*:/i;
const FORMAT_MARKER = /\bformat\s+(?:attendu|de sortie)\b/i;
const CONSTRAINTS_MARKER = /\bcontraintes?\s*:/i;

function trimText(text: string): string {
  return text.trim();
}

function withSuffix(text: string, suffix: string): string {
  const trimmed = trimText(text);
  return trimmed.length > 0 ? `${trimmed}\n\n${suffix}` : suffix;
}

export const ROLE_PATCH: PromptPatch = {
  label: 'Ajouter un rôle',
  apply: (text) => {
    const trimmed = trimText(text);

    if (ROLE_MARKER.test(trimmed)) {
      return trimmed;
    }

    const prefix = 'Agis comme [expert du domaine].';

    return trimmed.length > 0 ? `${prefix}\n\n${trimmed}` : prefix;
  },
};

export const CONTEXT_PATCH: PromptPatch = {
  label: 'Ajouter un contexte',
  apply: (text) => {
    const trimmed = trimText(text);

    if (CONTEXT_MARKER.test(trimmed)) {
      return trimmed;
    }

    return withSuffix(trimmed, 'Contexte : [situation, public, objectif].');
  },
};

export const FORMAT_PATCH: PromptPatch = {
  label: 'Ajouter un format de sortie',
  apply: (text) => {
    const trimmed = trimText(text);

    if (FORMAT_MARKER.test(trimmed)) {
      return trimmed;
    }

    return withSuffix(trimmed, 'Format attendu : [ex. tableau, liste, 200 mots].');
  },
};

export const CONSTRAINTS_PATCH: PromptPatch = {
  label: 'Ajouter des contraintes',
  apply: (text) => {
    const trimmed = trimText(text);

    if (CONSTRAINTS_MARKER.test(trimmed)) {
      return trimmed;
    }

    return withSuffix(trimmed, 'Contraintes : [ton souhaité, éléments à éviter].');
  },
};
