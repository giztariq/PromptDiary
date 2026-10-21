import { isRating } from './validation';
import { similarityScore } from './similarity';
import type { Example } from '../data/examples';
import type { Prompt, Rating } from './types';

const EXAMPLE_DUPLICATE_THRESHOLD = 0.8;

function toPrompt(example: Example, timestamp: string): Prompt {
  if (!isRating(example.note)) {
    throw new Error(`La note de l'exemple « ${example.titre} » doit être comprise entre 1 et 5.`);
  }

  const rating: Rating = example.note;

  return {
    id: crypto.randomUUID(),
    title: example.titre,
    body: example.corps,
    tags: [...new Set([...example.tags, 'exemple'])],
    model: example.modele ?? '',
    context: example.contexte,
    rating,
    favorite: false,
    copyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function importExamples(
  examples: Example[],
  existants: Prompt[],
): { ajoutes: Prompt[]; ignores: number } {
  const ajoutes: Prompt[] = [];
  const timestamp = new Date().toISOString();

  const isDuplicate = (candidate: { title: string; body: string }) =>
    [...existants, ...ajoutes].some(
      (prompt) =>
        prompt.title === candidate.title ||
        prompt.body === candidate.body ||
        similarityScore(`${candidate.title} ${candidate.body}`, `${prompt.title} ${prompt.body}`) >=
          EXAMPLE_DUPLICATE_THRESHOLD,
    );

  for (const example of examples) {
    if (isDuplicate({ title: example.titre, body: example.corps })) {
      continue;
    }

    ajoutes.push(toPrompt(example, timestamp));
  }

  return { ajoutes, ignores: examples.length - ajoutes.length };
}
