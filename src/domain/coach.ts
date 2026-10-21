export interface PromptPatch {
  label: string;
  apply: (text: string) => string;
}

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
    const prefix = 'Agis comme [expert du domaine].';

    return trimmed.length > 0 ? `${prefix}\n\n${trimmed}` : prefix;
  },
};

export const CONTEXT_PATCH: PromptPatch = {
  label: 'Ajouter un contexte',
  apply: (text) => withSuffix(text, 'Contexte : [situation, public, objectif].'),
};

export const FORMAT_PATCH: PromptPatch = {
  label: 'Ajouter un format de sortie',
  apply: (text) => withSuffix(text, 'Format attendu : [ex. tableau, liste, 200 mots].'),
};

export const CONSTRAINTS_PATCH: PromptPatch = {
  label: 'Ajouter des contraintes',
  apply: (text) => withSuffix(text, 'Contraintes : [ton souhaité, éléments à éviter].'),
};
