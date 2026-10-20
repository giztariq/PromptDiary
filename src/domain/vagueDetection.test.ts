import { detectVaguePrompt } from './vagueDetection';

describe('detectVaguePrompt', () => {
  it.each([
    {
      label: 'instruction courte',
      body: 'Résume ce texte.',
      context: '',
      vague: true,
    },
    {
      label: 'instruction longue sans rôle ni format',
      body: 'Analyse ce document avec attention et explique les idées importantes pour aider à prendre une décision.',
      context: '',
      vague: true,
    },
    {
      label: 'contexte sans format de sortie',
      body: 'Analyse ce document pour préparer la réunion produit.',
      context: 'Préparer une décision',
      vague: true,
    },
    {
      label: 'contexte et consigne longue sans format explicite',
      body: 'Analyse ce document pour préparer la réunion produit avec toutes les parties prenantes concernées en amont de la réunion.',
      context: 'Réunion produit',
      vague: false,
    },
    {
      label: 'rôle et format dans le corps',
      body: 'Tu es un analyste senior. Analyse ce document et réponds sous forme de tableau avec trois recommandations détaillées.',
      context: '',
      vague: false,
    },
    {
      label: 'contexte et format explicites',
      body: 'Analyse ce document pour préparer une décision et réponds sous forme de liste de cinq actions prioritaires.',
      context: 'Réunion produit',
      vague: false,
    },
  ])('classifies the $label case', ({ body, context, vague }) => {
    expect(detectVaguePrompt({ body, context }).vague).toBe(vague);
  });

  it('returns a useful suggestion when a prompt is vague', () => {
    expect(detectVaguePrompt({ body: 'Résume ce texte.', context: '' }).suggestion).toContain(
      'contexte',
    );
  });
});
