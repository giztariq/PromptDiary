import { detectVaguePrompt } from './vagueDetection';

describe('detectVaguePrompt', () => {
  it.each([
    { body: 'Résume ce texte.', context: '' },
    { body: 'Améliore ce contenu.', context: '' },
    { body: 'Fais mieux.', context: '' },
  ])('flags a vague prompt: $body', (input) => {
    expect(detectVaguePrompt(input).vague).toBe(true);
  });

  it('flags missing context and output format on a longer prompt', () => {
    const result = detectVaguePrompt({
      body: 'Analyse ce document avec attention et explique les idées importantes pour aider à prendre une décision.',
      context: '',
    });

    expect(result.vague).toBe(true);
    expect(result.reasons).toHaveLength(2);
  });

  it('accepts a detailed prompt with a role and a requested format', () => {
    const result = detectVaguePrompt({
      body: 'Tu es un analyste senior. Analyse ce document pour une équipe produit et réponds sous forme de tableau avec trois recommandations détaillées.',
      context: 'Préparer une réunion produit',
    });

    expect(result).toEqual({ vague: false, reasons: [], suggestion: '' });
  });

  it('returns a useful suggestion when a prompt is vague', () => {
    expect(detectVaguePrompt({ body: 'Résume ce texte.', context: '' }).suggestion).toContain(
      'contexte',
    );
  });
});
