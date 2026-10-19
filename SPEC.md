SPEC — Prompt Diary (template à compléter avec tes mots)
À faire écrire/valider par OmniRush dans une session dédiée, à partir de tes réponses. Ce fichier est ton brouillon de réflexion.
1. Vision (2 phrases)
[À toi : pourquoi cet outil existe, pour qui, quel problème il règle.]

Exemple de trame : « Les prompts qui marchent se perdent. Prompt Diary les garde, les note et permet de les retrouver en 10 secondes. »

2. Utilisateur cible
[À toi : décris 1 persona précis — consultant/formateur/freelance qui utilise l'IA tous les jours.]

3. Jobs to be done
Quand je trouve un prompt qui marche, je veux [le sauvegarder avec son contexte] pour [le réutiliser sans le réécrire].
Quand je cherche un prompt, je veux [le retrouver par sujet ou par note] pour [ne pas repartir de zéro].
Quand un prompt m'a servi plusieurs fois, je veux [le voir remonter] pour [capitaliser sur mes meilleurs actifs].
4. User stories + critères d'acceptation
US1 — Créer un prompt
En tant qu'utilisateur, je crée un prompt avec : titre, corps, tags (plusieurs), modèle visé, note de contexte, note 1-5.
Acceptation

Le formulaire valide : titre et corps obligatoires, note entre 1 et 5
Le prompt apparaît immédiatement dans la liste
Un test unitaire couvre la validation
US2 — Rechercher
Je cherche par texte (titre + corps) et je filtre par tag et par note minimale.
Acceptation

Recherche insensible à la casse et aux accents
Les filtres se combinent
Résultats en < 50 ms sur 500 prompts (test de perf simple)
US3 — Copier
Je copie un prompt en un clic ; le compteur d'usage s'incrémente.
Acceptation

Confirmation visuelle (toast)
copyCount +1 persisté
Test unitaire sur l'incrément
US4 — Favoris
J'épingle mes prompts clés ; ils apparaissent en tête.
Acceptation

Toggle favori persisté
Tri : favoris d'abord, puis usage décroissant
US5 — Export / import JSON
Je sauvegarde et restaure toute ma bibliothèque.
Acceptation

Export télécharge un JSON versionné (`version: 1`)
Import : merge sans doublon (id), rapport « X ajoutés / Y ignorés »
Round-trip testé
US6 — Détection de prompt vague
L'app signale les prompts trop vagues (règles, pas d'IA).
Acceptation

Signaux : < 15 mots, pas de contexte/rôle, pas de format de sortie demandé
Badge « À préciser » + suggestion textuelle
≥ 5 cas de test (vague / pas vague)
5. Modèle de données
Prompt {
  id: string            // uuid
  title: string
  body: string
  tags: string[]
  model: string         // libre, ex. "GPT-6", "Claude"
  context: string       // à quoi il sert
  rating: 1..5
  favorite: boolean
  copyCount: number
  createdAt: ISO string
  updatedAt: ISO string
}
6. Écrans
1.
Liste : recherche sticky, chips de filtres, cartes (titre, extrait, tags, ⭐, copies), bouton « Nouveau » (raccourci `n`)
2.
Éditeur : formulaire plein écran, aperçu du badge « À préciser »
3.
Détail : corps complet, bouton copier, historique d'usage
4.
Réglages : export, import, à propos
7. Non-objectifs (buildathon)
Comptes, sync cloud, collaboration
Intégration API LLM
Mobile natif (PWA si le temps)
8. Scénario de démo (2 min)
1.
Créer « Analyse de document » avec tags analyse, note 5
2.
Chercher « analyse » → filtrer ⭐5 → copier → toast
3.
Montrer « copié 12 fois » → « mon meilleur actif »
4.
Export JSON
5.
Un prompt vague → badge « À préciser »
6.
« Tout est local, rien ne part sur un serveur »
9. Qualité
TypeScript strict, tests sur domain + storage
Docker rebuild offline (adapter mémoire)
README complet (run/test/demo)