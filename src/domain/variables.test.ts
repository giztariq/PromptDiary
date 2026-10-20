import { fillVariables, parseVariables } from './variables';

describe('dynamic variables', () => {
  it('deduplicates variables while preserving captured order, case, and accents', () => {
    expect(parseVariables('{{nom}} {{ prénom }} {{nom}} {{Prénom}} {{prénom}}')).toEqual([
      'nom',
      'prénom',
      'Prénom',
    ]);
  });

  it('accepts letters, numbers, underscores, and hyphens in variable names', () => {
    expect(parseVariables('{{client_1}} {{modèle-v2}}')).toEqual(['client_1', 'modèle-v2']);
  });

  it('fills matching variables, including empty values, and preserves missing placeholders', () => {
    expect(
      fillVariables('Bonjour {{ nom }}, {{email}}. Code: {{code}}.', {
        nom: 'Ada',
        email: '',
        ignored: 'valeur',
      }),
    ).toBe('Bonjour Ada, . Code: {{code}}.');
  });

  it('does not fill a differently-cased variable name', () => {
    expect(fillVariables('{{Nom}} {{nom}}', { nom: 'Ada' })).toBe('{{Nom}} Ada');
  });

  it('returns an empty list for text without variables', () => {
    expect(parseVariables('Aucun placeholder ici.')).toEqual([]);
    expect(fillVariables('Aucun placeholder ici.', { nom: 'Ada' })).toBe('Aucun placeholder ici.');
  });
});
