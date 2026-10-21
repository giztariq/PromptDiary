# SPEC — Prompt Diary

## 1. Vision

Les prompts qui fonctionnent se perdent dans les historiques de chat. Prompt Diary les garde, les note et permet de les retrouver et de les réutiliser en quelques secondes, sans compte ni cloud.

## 2. Utilisateur cible

Consultant, formateur ou freelance qui utilise l'IA tous les jours et veut capitaliser sur ses meilleurs prompts sans dépendre d'un outil SaaS.

## 3. Jobs to be done

- Quand je trouve un prompt qui marche, je veux le sauvegarder avec son contexte pour le réutiliser sans le réécrire.
- Quand je cherche un prompt, je veux le retrouver par sujet, tag, modèle ou note pour ne pas repartir de zéro.
- Quand un prompt m'a servi plusieurs fois, je veux voir son historique et le remonter pour capitaliser sur mes meilleurs actifs.

## 4. User stories et critères d'acceptation

### US1 — Créer et modifier un prompt

- Champs : titre, corps, tags, modèle, contexte, note de 1 à 5.
- Le titre et le corps sont obligatoires ; la note doit être comprise entre 1 et 5.
- Le prompt apparaît immédiatement dans la bibliothèque et est persisté.
- Les tags sont nettoyés, vides supprimés et dédupliqués.
- La validation est couverte par des tests unitaires.
- En modification, `createdAt`, le favori, le compteur et l'historique d'usage sont conservés.

### US2 — Rechercher et filtrer

- Recherche insensible à la casse et aux accents sur le titre, le corps, les tags, le modèle et le contexte.
- Filtres par tags et note minimale combinables.
- Les filtres de tags sont classés par usage, puis repliés au-delà de 12 tags avec un bouton d'expansion.
- Filtre « favoris uniquement » combinable avec les autres filtres.
- Tri explicite : priorité, nouveautés, les plus utilisés, mieux notés, titre A → Z.
- Les favoris remontent avant les autres prompts, puis le tri par priorité d'usage s'applique.
- Résultats en moins de 50 ms sur 500 prompts (test de performance).
- Les occurrences sont surlignées sans casser les accents ni traiter les caractères regex littéralement.

### US3 — Utiliser un prompt

- Copie en un clic avec confirmation visuelle (toast).
- `copyCount` et `lastUsedAt` sont incrémentés et persistés.
- Chaque utilisation est ajoutée à `usageLog`, plafonné aux 10 dernières entrées.
- Une erreur de presse-papiers affiche un message unique et ne met pas à jour l'usage.

### US4 — Variables dynamiques

- Les variables sont détectées dans le corps au format `{{nom}}`.
- Une modale permet de saisir les valeurs, avec focus initial, piège de focus et fermeture par Échap.
- Les valeurs sont mémorisées par prompt et restaurées à la réouverture.
- Le prompt rempli est copié et l'usage est enregistré.
- Les valeurs sont supprimées avec le prompt ou lors d'un effacement complet.

### US5 — Favoris

- Le favori se bascule et se persiste.
- Les favoris apparaissent en tête de la bibliothèque.
- La duplication réinitialise le favori, le compteur et l'historique d'usage.

### US6 — Export / import JSON

- L'export télécharge un JSON versionné (`version: 1`), incluant l'historique d'usage.
- L'import valide le format, fusionne sans doublon par identifiant et affiche « X ajoutés / Y ignorés ».
- Un aller-retour export → import est testé.
- Si une sauvegarde échoue en cours d'import, l'interface recharge l'état réel du stockage et signale un import partiel.
- Un fichier invalide est rejeté sans modifier la bibliothèque.

### US7 — Détection de prompt vague

- Règles déterministes, sans IA : longueur, rôle/contexte, format de sortie, variables.
- Badge « À préciser » avec suggestion textuelle.
- Le coach qualité pendant la rédaction utilise le même modèle de détection.
- Cas vagues et non vagues couverts par des tests.
- Chaque manque corrigeable (rôle, contexte, format de sortie, contraintes) propose un patch appliqué en un clic.
- La correction appliquée est annulable en un clic ; le score est recalculé immédiatement.

### US8 — Historique d'usage

- Le détail affiche le nombre de copies, la dernière utilisation et les 5 dernières entrées de l'historique.
- Les dates d'usage sont affichées en relatif (« il y a 3 h »), la date exacte restant accessible en infobulle.
- L'historique est conservé lors d'une modification.
- L'historique est exporté et réimporté.

### US9 — Exemples

- 12 exemples filtrables par catégorie.
- Import d'un exemple ou de toute la bibliothèque d'exemples, avec tag source.
- Les doublons sont ignorés et le rapport est affiché.

### US10 — Accessibilité et robustesse

- Cibles WCAG 2.2 AA : contrastes, focus visibles, labels, navigation clavier.
- La carte de prompt expose un bouton d'ouverture sans imbriquer de boutons interactifs.
- La modale de variables piège le focus et le restaure à la fermeture.
- Le changement d'écran place le focus sur le titre principal.
- Les états chargement, vide et erreur sont explicites ; l'erreur de stockage propose de réessayer ou de réinitialiser les données locales.
- Une erreur de rendu inattendue affiche un écran de secours avec rechargement, sans toucher aux données locales.
- Les raccourcis sont désactivés quand une modale est ouverte.
- Un panneau de raccourcis clavier est disponible dans les réglages.

### US11 — Local-first et hors ligne

- Aucune requête réseau à l'exécution ni dans les tests.
- IndexedDB est la source de vérité ; un adaptateur mémoire sert aux tests.
- Le contrat de stockage est partagé par les deux adaptateurs.
- En production, un service worker met l'application en cache après la première visite.
- Un manifest PWA permet l'installation.

### US12 — Statistiques locales

- Les statistiques sont calculées à partir de la bibliothèque locale, sans aucun envoi de données.
- Synthèse : nombre de prompts, copies totales, favoris, note moyenne, prompts sans tag, prompts à variables, prompts jamais copiés.
- Classements : prompts les plus utilisés et tags les plus utilisés, avec accès direct au prompt depuis le classement.
- La répartition des notes est affichée de 1 à 5.
- Une bibliothèque vide affiche un état explicite qui invite à importer les exemples ou à créer un prompt.

### US13 — Palette de commandes

- Ouverture par `Ctrl/Cmd + K` ou par un bouton discret dans l'en-tête ; fermeture par Échap, clic extérieur ou bouton de retour.
- Le champ de recherche est flou (sous-séquence) et filtre les prompts comme les actions.
- Deux sections : **Prompts** (titre + tags, avec actions rapides « Copier » et « Éditer ») et **Actions** (nouveau prompt, bibliothèque, exemples, statistiques, réglages, export, import, tris).
- Navigation aux flèches, `Entrée` ouvre l'élément surligné, `Alt+C` copie et `Alt+E` édite le prompt surligné.
- Le focus est piégé dans la modale et la ligne active est annoncée par `aria-activedescendant`.

### US14 — Collections

- Un prompt appartient à zéro ou une collection ; la liste des collections est dérivée de la bibliothèque (valeurs uniques, ordre alphabétique) avec un compteur.
- Barre de navigation (colonne sur desktop, chips horizontales sur mobile) : Tous, Favoris, Sans collection, puis une entrée par collection.
- L'éditeur propose un sélecteur de collection avec création en ligne ; la carte et le détail affichent la collection.
- Renommer une collection met à jour tous les prompts concernés ; supprimer une collection détache les prompts sans les supprimer.
- L'export JSON inclut la collection et l'import la conserve.

## 5. Modèle de données

```ts
interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  model: string;
  context: string;
  rating: 1 | 2 | 3 | 4 | 5;
  favorite: boolean;
  copyCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastUsedAt?: string; // ISO 8601
  usageLog?: string[]; // 10 dernières utilisations, ISO 8601
}
```

Stockage : base IndexedDB `prompt-diary`, version 2, stores `prompts` (clé `id`) et `values` (clé `key`). Les valeurs de variables utilisent la clé `values:<promptId>`.

## 6. Écrans

1. **Bibliothèque** : recherche sticky, filtres tags et note, cartes (titre, extrait, tags, note, copies), favoris, états vide/chargement/erreur.
2. **Éditeur** : formulaire plein écran, indicateur de variables, coach qualité, validation inline, garde contre les modifications non enregistrées.
3. **Détail** : corps complet, copie, favori, édition, duplication, suppression, compteur et historique d'usage.
4. **Exemples** : bibliothèque filtrable, détail, import unitaire ou global.
5. **Réglages** : export, import, garantie locale, effacement avec confirmation.
6. **Palette de commandes** : `Ctrl/Cmd + K` pour créer, ouvrir un prompt, aller aux exemples ou aux réglages.
7. **Statistiques** : synthèse, prompts les plus utilisés, tags les plus utilisés, répartition des notes, prompts jamais copiés.

## 7. Non-objectifs

- Comptes, collaboration, synchronisation cloud.
- Intégration directe d'API LLM.
- Application mobile native.
- Recherche sémantique ou embeddings.

## 8. Scénario de démo (2 minutes)

1. Ouvrir **Exemples** et tout ajouter.
2. Rechercher `analyse`, filtrer sur `5+`, ouvrir un prompt.
3. Copier : le toast confirme, le compteur et l'historique se mettent à jour.
4. Utiliser un prompt à variables, remplir `{{client}}`, copier, rouvrir : les valeurs sont restaurées.
5. Créer un prompt vague : badge **À préciser** et coach qualité.
6. Exporter en JSON depuis **Réglages**, puis réimporter.
7. Rappeler : « Tout est local, rien ne part sur un serveur. »

## 9. Qualité

- TypeScript strict, aucun `any`, aucun `@ts-ignore`.
- Tests sur `domain/` et `storage/`, contrat de stockage commun aux adaptateurs.
- `npm run verify` : format, types, lint, tests, build.
- CI GitHub Actions et conteneur de test exécutable sans réseau.
- Accessibilité vérifiée au clavier et avec Lighthouse.
- README complet : démarrage, vérifications, architecture, Docker, limites, licence.
