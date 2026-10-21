import type { Prompt } from './types';

export interface SimilarPrompt {
  prompt: Prompt;
  score: number;
  percentage: number;
}

export const SIMILARITY_THRESHOLD = 0.55;
export const MAX_SIMILAR_PROMPTS = 3;

const MIN_TOKENS = 5;

const STOP_WORDS = new Set([
  'alors',
  'avec',
  'dans',
  'pour',
  'plus',
  'sans',
  'sous',
  'sur',
  'une',
  'des',
  'les',
  'les',
  'par',
  'qui',
  'que',
  'quoi',
  'dont',
  'cette',
  'ces',
  'aux',
  'ses',
  'leur',
  'notre',
  'votre',
  'tout',
  'tous',
  'toute',
  'toutes',
  'chaque',
  'autre',
  'meme',
  'ainsi',
  'comme',
  'entre',
  'depuis',
  'vers',
  'puis',
  'bien',
  'aussi',
  'encore',
  'leur',
  'peut',
  'etre',
  'avoir',
  'faire',
  'peut',
  'doit',
  'sont',
  'est',
  'une',
  'un',
  'la',
  'le',
  'et',
  'ou',
  'a',
  'de',
  'en',
  'ce',
  'on',
  'y',
  'je',
  'tu',
  'il',
  'nous',
  'vous',
  'ils',
  'elles',
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'your',
  'you',
  'are',
  'will',
]);

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

export function jaccard(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }

  const union = leftSet.size + rightSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function similarityScore(left: string, right: string): number {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.length < MIN_TOKENS || rightTokens.length < MIN_TOKENS) {
    return 0;
  }

  return jaccard(leftTokens, rightTokens);
}

export function promptSimilarity(left: Prompt, right: Prompt): number {
  return similarityScore(`${left.title} ${left.body}`, `${right.title} ${right.body}`);
}

export function findSimilarPrompts(
  draft: { title: string; body: string },
  prompts: Prompt[],
  threshold: number = SIMILARITY_THRESHOLD,
  limit: number = MAX_SIMILAR_PROMPTS,
): SimilarPrompt[] {
  return prompts
    .map((prompt) => {
      const score = similarityScore(
        `${draft.title} ${draft.body}`,
        `${prompt.title} ${prompt.body}`,
      );

      return { prompt, score, percentage: Math.round(score * 100) };
    })
    .filter((match) => match.score >= threshold)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
