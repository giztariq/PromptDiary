import {
  CONTEXT_PATCH,
  CONSTRAINTS_PATCH,
  FORMAT_PATCH,
  ROLE_PATCH,
  type PromptPatch,
} from './coach';

export interface Check {
  key: string;
  label: string;
  passed: boolean;
  suggestion: string;
  patch?: PromptPatch;
}

export interface AnalyzePromptResult {
  score: number;
  checks: Check[];
}

const ROLE_PATTERN =
  /\b(?:agis comme|tu es|vous etes|en tant que|joue le role de|incarne|act as|you are|as an)\b/u;
const CONTEXT_PATTERN =
  /\b(?:contexte|situation|public|audience|destinataire|utilisateur|objectif|but|pour qui|cible|dans le cadre de|problematique|besoin)\b/u;
const FORMAT_PATTERN =
  /\b(?:format|tableau|liste|json|markdown|puces?|etapes?|paragraphes?|colonnes?|sous forme|reponds|presente|longueur|mots|lignes|sections?|nombre de)\b/u;
const CONSTRAINT_PATTERN =
  /\b(?:ton|style|ne\s+pas|n['�?T]?utilise|sans|exemple|contrainte|limite|maximum|minimum|evite|concis|professionnel|formel|informel)\b/u;

const ACTION_VERBS = new Set([
  'agis',
  'analyse',
  'analyser',
  'compare',
  'comparer',
  'cree',
  'creer',
  'decris',
  'decrire',
  'donne',
  'donner',
  'evalue',
  'evaluer',
  'explique',
  'expliquer',
  'genere',
  'generer',
  'identifie',
  'identifier',
  'liste',
  'lister',
  'propose',
  'proposer',
  'reformule',
  'reformuler',
  'redige',
  'rediger',
  'resume',
  'resumer',
  'synthǸtise',
  'synthetise',
  'synthǸtiser',
  'synthetiser',
  'traduis',
  'traduire',
  'write',
  'analyze',
  'compare',
  'create',
  'describe',
  'explain',
  'generate',
  'identify',
  'list',
  'summarize',
]);

function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function startsWithAction(text: string): boolean {
  const words = normalize(text).trim().split(/\s+/u);
  const firstWord = words[0] ?? '';

  if (ACTION_VERBS.has(firstWord)) {
    return true;
  }

  if (['comment', 'pourquoi', 'quelle', 'quel', 'quels', 'quelles'].includes(firstWord)) {
    return ACTION_VERBS.has(words[1] ?? '');
  }

  return false;
}

function buildCheck(
  key: string,
  label: string,
  passed: boolean,
  suggestion: string,
  patch?: PromptPatch,
): Check {
  if (passed || !patch) {
    return { key, label, passed, suggestion };
  }

  return { key, label, passed, suggestion, patch };
}

export function analyzePrompt(texte: string): AnalyzePromptResult {
  const normalizedText = normalize(texte);
  const checks: Check[] = [
    buildCheck(
      'role',
      'Rôle ou persona',
      ROLE_PATTERN.test(normalizedText),
      'Ajoutez « Agis comme… » ou « Tu es… ».',
      ROLE_PATCH,
    ),
    buildCheck(
      'context',
      'Contexte fourni',
      CONTEXT_PATTERN.test(normalizedText),
      'Précisez la situation, le public ou l’objectif.',
      CONTEXT_PATCH,
    ),
    buildCheck(
      'format',
      'Format de sortie',
      FORMAT_PATTERN.test(normalizedText),
      'Indiquez le format attendu : liste, tableau ou JSON.',
      FORMAT_PATCH,
    ),
    buildCheck(
      'constraints',
      'Contraintes ou exemples',
      CONSTRAINT_PATTERN.test(normalizedText),
      'Ajoutez un ton, une contrainte ou un exemple.',
      CONSTRAINTS_PATCH,
    ),
    buildCheck(
      'length',
      'Longueur suffisante',
      wordCount(texte) > 15,
      'Développez la consigne au-delà de 15 mots.',
    ),
    buildCheck(
      'objective',
      'Objectif clair',
      startsWithAction(texte),
      'Commencez par un verbe d’action : analysez, créez ou résumez.',
    ),
  ];

  return {
    score: checks.filter((check) => check.passed).length,
    checks,
  };
}
