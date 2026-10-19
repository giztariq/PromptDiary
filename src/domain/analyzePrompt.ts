export interface Check {
  key: string;
  label: string;
  passed: boolean;
  suggestion: string;
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
  /\b(?:ton|style|ne\s+pas|n['’]?utilise|sans|exemple|contrainte|limite|maximum|minimum|evite|concis|professionnel|formel|informel)\b/u;

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
  'synthétise',
  'synthetise',
  'synthétiser',
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

export function analyzePrompt(texte: string): AnalyzePromptResult {
  const normalizedText = normalize(texte);
  const checks: Check[] = [
    {
      key: 'role',
      label: 'Rôle ou persona',
      passed: ROLE_PATTERN.test(normalizedText),
      suggestion: 'Ajoutez « Agis comme… » ou « Tu es… ».',
    },
    {
      key: 'context',
      label: 'Contexte fourni',
      passed: CONTEXT_PATTERN.test(normalizedText),
      suggestion: 'Précisez la situation, le public ou l’objectif.',
    },
    {
      key: 'format',
      label: 'Format de sortie',
      passed: FORMAT_PATTERN.test(normalizedText),
      suggestion: 'Indiquez le format attendu : liste, tableau ou JSON.',
    },
    {
      key: 'constraints',
      label: 'Contraintes ou exemples',
      passed: CONSTRAINT_PATTERN.test(normalizedText),
      suggestion: 'Ajoutez un ton, une contrainte ou un exemple.',
    },
    {
      key: 'length',
      label: 'Longueur suffisante',
      passed: wordCount(texte) > 15,
      suggestion: 'Développez la consigne au-delà de 15 mots.',
    },
    {
      key: 'objective',
      label: 'Objectif clair',
      passed: startsWithAction(texte),
      suggestion: 'Commencez par un verbe d’action : analysez, créez ou résumez.',
    },
  ];

  return {
    score: checks.filter((check) => check.passed).length,
    checks,
  };
}
