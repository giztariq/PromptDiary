import { isRating } from './validation';
import type { Example } from '../data/examples';
import type { Prompt, Rating } from './types';

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
  const titles = new Set(existants.map((prompt) => prompt.title));
  const bodies = new Set(existants.map((prompt) => prompt.body));
  const ajoutes: Prompt[] = [];
  const timestamp = new Date().toISOString();

  for (const example of examples) {
    if (titles.has(example.titre) || bodies.has(example.corps)) {
      continue;
    }

    const prompt = toPrompt(example, timestamp);
    titles.add(prompt.title);
    bodies.add(prompt.body);
    ajoutes.push(prompt);
  }

  return { ajoutes, ignores: examples.length - ajoutes.length };
}
