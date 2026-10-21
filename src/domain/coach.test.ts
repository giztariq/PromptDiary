import { analyzePrompt } from './analyzePrompt';
import { CONTEXT_PATCH, CONSTRAINTS_PATCH, FORMAT_PATCH, ROLE_PATCH } from './coach';

const vaguePrompt = 'Rédige un texte.';

describe('coach patches', () => {
  it('prefixes the text with a role', () => {
    expect(ROLE_PATCH.apply(vaguePrompt)).toBe(
      'Agis comme [expert du domaine].\n\nRédige un texte.',
    );
  });

  it('keeps a role-only text when the prompt is empty', () => {
    expect(ROLE_PATCH.apply('   ')).toBe('Agis comme [expert du domaine].');
  });

  it('appends the context, format, and constraints blocks', () => {
    expect(CONTEXT_PATCH.apply(vaguePrompt)).toBe(
      'Rédige un texte.\n\nContexte : [situation, public, objectif].',
    );
    expect(FORMAT_PATCH.apply(vaguePrompt)).toBe(
      'Rédige un texte.\n\nFormat attendu : [ex. tableau, liste, 200 mots].',
    );
    expect(CONSTRAINTS_PATCH.apply(vaguePrompt)).toBe(
      'Rédige un texte.\n\nContraintes : [ton souhaité, éléments à éviter].',
    );
  });

  it('returns only the block when the prompt is empty', () => {
    expect(CONTEXT_PATCH.apply('')).toBe('Contexte : [situation, public, objectif].');
  });
});

describe('analyzePrompt patches', () => {
  it('exposes a patch for every correctable missing check', () => {
    const checks = analyzePrompt(vaguePrompt).checks;
    const patchable = checks.filter((check) => check.patch).map((check) => check.key);

    expect(patchable).toEqual(['role', 'context', 'format', 'constraints']);
  });

  it('never exposes a patch for length or objective', () => {
    const checks = analyzePrompt(vaguePrompt).checks;
    const length = checks.find((check) => check.key === 'length');
    const objective = checks.find((check) => check.key === 'objective');

    expect(length?.patch).toBeUndefined();
    expect(objective?.patch).toBeUndefined();
  });

  it('removes the patch once the check passes', () => {
    const checks = analyzePrompt('Agis comme un analyste. Contexte : une réunion.').checks;
    const role = checks.find((check) => check.key === 'role');
    const context = checks.find((check) => check.key === 'context');

    expect(role?.passed).toBe(true);
    expect(role?.patch).toBeUndefined();
    expect(context?.passed).toBe(true);
    expect(context?.patch).toBeUndefined();
  });

  it('raises the score once every patch is applied', () => {
    const before = analyzePrompt(vaguePrompt);
    const patched = before.checks
      .filter((check) => check.patch)
      .reduce((text, check) => check.patch?.apply(text) ?? text, vaguePrompt);
    const after = analyzePrompt(patched);

    expect(before.score).toBeLessThan(3);
    expect(after.score).toBeGreaterThanOrEqual(5);
  });
});
