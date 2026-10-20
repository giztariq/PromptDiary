export type Example = {
  id: string;
  categorie: string;
  titre: string;
  description: string;
  corps: string;
  tags: string[];
  modele?: string;
  contexte: string;
  note: number;
};

export const EXAMPLES: Example[] = [
  {
    id: 'redaction-email-professionnel-01',
    categorie: 'Rédaction',
    titre: 'Rédiger un email professionnel clair',
    description:
      'Transformer des notes brutes en email concis, cordial et orienté vers une action.',
    corps:
      'Rédige un email professionnel à partir des informations suivantes : [notes]. Utilise un objet précis, un ton cordial et direct, des paragraphes courts, puis termine par une demande d’action et une échéance explicites. N’invente aucune information.',
    tags: ['email', 'clarté', 'ton professionnel'],
    modele: 'Claude',
    contexte:
      'Réponse à un client ou à un collègue lorsque les informations sont encore sous forme de notes.',
    note: 5,
  },
  {
    id: 'redaction-article-02',
    categorie: 'Rédaction',
    titre: 'Structurer un article pédagogique',
    description:
      'Obtenir un plan d’article lisible avec une progression adaptée à un public débutant.',
    corps:
      'Propose le plan détaillé d’un article sur [sujet] pour un public débutant. Commence par une promesse claire, organise le contenu en trois à cinq parties, indique l’objectif de chaque partie et suggère un exemple concret. Signale les notions qui doivent être définies.',
    tags: ['article', 'plan', 'pédagogie'],
    contexte:
      'Préparation d’un article de blog ou d’une documentation interne avant la rédaction complète.',
    note: 4,
  },
  {
    id: 'analyse-synthese-document-01',
    categorie: 'Analyse',
    titre: 'Synthétiser un document long',
    description:
      'Extraire les idées essentielles, les décisions et les points à vérifier d’un document.',
    corps:
      'Analyse le document ci-dessous et produis une synthèse en cinq sections : objectif, idées principales, données importantes, décisions prises et questions ouvertes. Distingue les faits des interprétations et cite la section du document lorsque cela est utile. Document : [texte].',
    tags: ['synthèse', 'document', 'faits'],
    modele: 'GPT-4o',
    contexte:
      'Lecture rapide d’un compte rendu, d’une étude ou d’une note de cadrage avant une réunion.',
    note: 5,
  },
  {
    id: 'analyse-comparaison-options-02',
    categorie: 'Analyse',
    titre: 'Comparer plusieurs options avec des critères',
    description: 'Construire une comparaison argumentée plutôt qu’une simple liste d’avantages.',
    corps:
      'Compare les options suivantes : [options], selon ces critères : [critères]. Présente un tableau avec les éléments observables, explicite les compromis, puis formule une recommandation conditionnelle. Indique les informations manquantes qui pourraient changer la conclusion et ne suppose pas de données absentes.',
    tags: ['comparaison', 'décision', 'critères'],
    contexte:
      'Choix d’un outil, d’une méthode ou d’une organisation à partir d’informations hétérogènes.',
    note: 4,
  },
  {
    id: 'formation-sequence-apprentissage-01',
    categorie: 'Formation',
    titre: 'Créer une séquence d’apprentissage',
    description:
      'Préparer une séance progressive avec objectifs, activités et vérification des acquis.',
    corps:
      'Conçois une séquence de 60 minutes sur [thème] pour [public]. Définis deux objectifs mesurables, répartis le temps entre découverte, pratique guidée et pratique autonome, puis ajoute une activité de vérification avec son corrigé. Prévois une adaptation pour les personnes qui débutent.',
    tags: ['formation', 'objectifs', 'atelier'],
    contexte:
      'Conception d’un atelier interne ou d’une séance de formation pour un groupe hétérogène.',
    note: 5,
  },
  {
    id: 'formation-exercice-progressif-02',
    categorie: 'Formation',
    titre: 'Générer des exercices progressifs',
    description:
      'Faire pratiquer une notion avec une difficulté qui augmente sans perdre le fil pédagogique.',
    corps:
      'Crée cinq exercices progressifs sur [notion]. Pour chacun, indique la compétence visée, l’énoncé, un indice facultatif et le corrigé détaillé. Commence par un cas simple, introduis ensuite une contrainte nouvelle à chaque étape et termine par un exercice de transfert dans un contexte réaliste.',
    modele: 'Mistral Large',
    tags: ['exercices', 'progression', 'apprentissage'],
    contexte:
      'Préparation de supports d’entraînement pour permettre à une personne d’apprendre en autonomie.',
    note: 4,
  },
  {
    id: 'communication-feedback-constructif-01',
    categorie: 'Communication',
    titre: 'Formuler un feedback constructif',
    description: 'Préparer un retour factuel qui ouvre une discussion et propose une amélioration.',
    corps:
      'Aide-moi à formuler un feedback constructif à partir de cette situation : [situation]. Décris d’abord le comportement observable sans jugement, explique son impact, puis propose une amélioration concrète et une question ouverte. Garde un ton respectueux et évite les généralisations.',
    tags: ['feedback', 'management', 'écoute'],
    contexte:
      'Préparation d’un échange individuel après une réunion ou une collaboration difficile.',
    note: 5,
  },
  {
    id: 'communication-annonce-changement-02',
    categorie: 'Communication',
    titre: 'Annoncer un changement à une équipe',
    description:
      'Rendre une annonce de changement compréhensible en répondant aux préoccupations prévisibles.',
    corps:
      'Rédige une annonce à l’équipe concernant [changement]. Explique la raison, ce qui change concrètement, ce qui ne change pas, le calendrier, les impacts pour chacun et le point de contact pour les questions. Anticipe trois inquiétudes légitimes et réponds-y avec transparence, sans minimiser les difficultés.',
    tags: ['annonce', 'changement', 'équipe'],
    contexte:
      'Communication interne lors de l’évolution d’un processus, d’un outil ou d’une organisation.',
    note: 4,
  },
  {
    id: 'code-revue-typescript-01',
    categorie: 'Code',
    titre: 'Relire un module TypeScript',
    description:
      'Repérer les bugs et les risques de maintenance dans un extrait de code sans le réécrire inutilement.',
    corps:
      'Relis cet extrait TypeScript : [code]. Identifie les problèmes par ordre de gravité, en donnant pour chacun la ligne concernée, le risque concret et une correction minimale. Vérifie les types, les cas limites, les erreurs d’exécution et la lisibilité. Si le code est correct sur un point, indique-le brièvement au lieu de proposer une refonte.',
    modele: 'GPT-4.1',
    tags: ['TypeScript', 'revue de code', 'qualité'],
    contexte: 'Revue d’une petite modification avant intégration dans un projet front-end.',
    note: 5,
  },
  {
    id: 'code-debug-demarche-02',
    categorie: 'Code',
    titre: 'Diagnostiquer une erreur pas à pas',
    description:
      'Transformer un message d’erreur et quelques symptômes en démarche de diagnostic vérifiable.',
    corps:
      'Aide-moi à diagnostiquer ce problème : [message d’erreur], dans ce contexte : [contexte]. Commence par formuler les hypothèses les plus probables, puis propose des vérifications courtes et ordonnées. Pour chaque résultat possible, indique l’étape suivante. Ne suggère pas de modifier plusieurs variables à la fois et demande les informations manquantes avant de conclure.',
    tags: ['debug', 'diagnostic', 'méthode'],
    contexte:
      'Dépannage d’un comportement inattendu dans une application locale, sans accès à l’environnement de production.',
    note: 4,
  },
  {
    id: 'productivite-plan-journee-01',
    categorie: 'Productivité',
    titre: 'Planifier une journée réaliste',
    description:
      'Organiser les priorités en tenant compte du temps disponible, des contraintes et des imprévus.',
    corps:
      'Aide-moi à planifier ma journée à partir de cette liste de tâches : [tâches]. Je dispose de [durée] et j’ai ces contraintes : [contraintes]. Classe les tâches par impact et urgence, propose un planning avec des blocs de concentration et des pauses, puis indique ce qui peut être reporté. Ne remplis pas plus de 80 % du temps disponible.',
    tags: ['priorités', 'planning', 'concentration'],
    contexte:
      'Début de journée de travail avec plusieurs demandes concurrentes et une disponibilité limitée.',
    note: 4,
  },
  {
    id: 'productivite-compte-rendu-actions-02',
    categorie: 'Productivité',
    titre: 'Transformer une réunion en plan d’action',
    description:
      'Extraire les décisions et actions responsables depuis des notes de réunion imparfaites.',
    corps:
      'Transforme ces notes de réunion en un compte rendu opérationnel : [notes]. Sépare les décisions, les actions, les questions ouvertes et les informations à partager. Pour chaque action, indique un responsable, une échéance si elle est explicitement mentionnée et la prochaine étape. Marque « à confirmer » lorsqu’une information manque au lieu de l’inventer.',
    tags: ['réunion', 'actions', 'suivi'],
    modele: 'Claude',
    contexte:
      'Après une réunion de projet, lorsque les notes doivent devenir un suivi partagé rapidement.',
    note: 5,
  },
];
