AGENTS.md — Prompt Diary
Fichier lu par OmniRush à chaque session (convention opencode). Court, stable, spécifique. Commit-le.
Projet
Prompt Diary — journal local-first de prompts pour praticiens de l'IA. On sauvegarde un prompt, on note s'il a marché, on le retrouve et on le réutilise. Pas de cloud, pas de comptes.

Stack
React 18 + TypeScript strict + Vite
Tailwind CSS (tokens en tête de `src/styles/tokens.css`)
Vitest + Testing Library
Stockage : IndexedDB via StorageAdapter (implémentation mémoire pour les tests)
Aucune requête réseau à l'exécution ni dans les tests
Commandes
npm ci — installer
npm run dev — dev
npm run typecheck — TS strict
npm run lint — ESLint
npm test — Vitest (offline, adapter mémoire)
npm run build — build statique
npm start — servir le build
Architecture
src/
  domain/      # types + fonctions pures (search, scoring, vagueDetection) — 100% testable
  storage/     # StorageAdapter (interface), indexedDbAdapter, memoryAdapter
  ui/          # composants React, aucune logique métier
  styles/      # tokens.css, globals.css
Règles
1.
Une tranche = un commit (`feat:`, fix:, test:, chore:`). Jamais de commit qui casse `npm test.
2.
Tests d'abord pour toute logique dans domain/ et storage/.
3.
Pas de any, pas de @ts-ignore.
4.
UI en composants petits ; états vide/chargement/erreur obligatoires.
5.
Accessibilité : focus visibles, labels ARIA, navigation clavier, contraste AA.
6.
Jamais de secret, jamais de chemin local (`/Users/...`, `C:...`).
7.
Ne pas ajouter de dépendance sans nécessité démontrée.
Definition of Done (par tranche)
Fonctionne à l'écran
Tests ajoutés et verts
typecheck + lint verts
Commit poussé
Pas de régression sur les tranches précédentes
Design
Voir 00-METHODE.md §5 : palette neutre + accent indigo, grille 4px, Inter/system-ui, cartes de prompt, chips de tags, toast de copie. Densité « Linear/Notion », pas de décoration gratuite.

Interdits
Backend, comptes, sync cloud (hors périmètre buildathon)
Appels réseau dans le code de test
Refonte globale non demandée