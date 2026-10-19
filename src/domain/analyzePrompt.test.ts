import { analyzePrompt } from './analyzePrompt';

describe('analyzePrompt', () => {
  it('évalue lisiblement les six critères d’un prompt structuré', () => {
    const result = analyzePrompt(
      'Agis comme un analyste senior. Contexte : nous préparons une décision pour un public étudiant. Analyse cet objectif et réponds sous forme de tableau. Ton professionnel, ne pas inventer de données, avec un exemple concret.',
    );

    expect(result.checks).toHaveLength(6);
    expect(result.checks.map((check) => check.key)).toEqual([
      'role',
      'context',
      'format',
      'constraints',
      'length',
      'objective',
    ]);
    expect(result.checks.every((check) => check.passed)).toBe(true);
    expect(result.score).toBe(6);
  });

  it('retourne un score faible pour un prompt vague de 3 à 6 mots', () => {
    const result = analyzePrompt('Résume ce texte très vite');

    expect(result.score).toBeLessThanOrEqual(2);
    expect(result.checks.find((check) => check.key === 'length')?.passed).toBe(false);
  });

  it('évalue chaque borne de longueur autour de 15 mots', () => {
    const fifteenWords =
      'Analyse le sujet et fournis une synthèse claire pour un public précis dans un format';
    const sixteenWords = `${fifteenWords} concis`;

    expect(analyzePrompt(fifteenWords).checks.find((check) => check.key === 'length')?.passed).toBe(
      false,
    );
    expect(analyzePrompt(sixteenWords).checks.find((check) => check.key === 'length')?.passed).toBe(
      true,
    );
  });

  it('renvoie six échecs pour un texte vide', () => {
    const result = analyzePrompt('');

    expect(result).toEqual({
      score: 0,
      checks: expect.arrayContaining([
        expect.objectContaining({ key: 'role', passed: false }),
        expect.objectContaining({ key: 'context', passed: false }),
        expect.objectContaining({ key: 'format', passed: false }),
        expect.objectContaining({ key: 'constraints', passed: false }),
        expect.objectContaining({ key: 'length', passed: false }),
        expect.objectContaining({ key: 'objective', passed: false }),
      ]),
    });
  });
});
