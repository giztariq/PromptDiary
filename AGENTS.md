# AGENTS.md — Prompt Diary

Fichier lu par OmniRush à chaque session (convention opencode). Court, stable, spécifique. Commit-le.

## Projet

Prompt Diary — journal local-first de prompts pour praticiens de l'IA. On sauvegarde un prompt, on note s'il a marché, on le retrouve et on le réutilise. Pas de cloud, pas de comptes.

## Stack

- React 18 + TypeScript strict + Vite
- Tailwind CSS (tokens en tête de `src/styles/tokens.css`)
- Vitest + Testing Library + `fake-indexeddb`
- Stockage : IndexedDB via `StorageAdapter` (implémentation mémoire pour les tests)
- Aucune requête réseau à l'exécution ni dans les tests
- PWA : manifest + service worker en production uniquement

## Commandes

- `npm ci` — installer
- `npm run dev` — dev
- `npm run verify` — format + types + lint + tests + build (porte de qualité)
- `npm run typecheck` — TS strict
- `npm run lint` — ESLint
- `npm test` — Vitest (offline, adaptateur mémoire)
- `npm run build` — build statique
- `npm start` — servir le build avec `scripts/serve.mjs`

## Architecture

```text
src/
  domain/      # types + fonctions pures (search, scoring, vagueDetection, variables, importExport)
  storage/     # StorageAdapter (interface), indexedDbAdapter, memoryAdapter
  ui/          # composants React, aucune logique métier
  test/        # setup Vitest + contrat de stockage partagé
  styles/      # tokens.css, globals.css
public/        # favicon, icônes, manifest, robots.txt, service worker
scripts/       # serveur statique de production
.github/       # CI (verify + test Docker offline)
```

## Règles

1. Une tranche = un commit (`feat:`, `fix:`, `test:`, `chore:`). Jamais de commit qui casse `npm test`.
2. Tests d'abord pour toute logique dans `domain/` et `storage/`.
3. Pas de `any`, pas de `@ts-ignore`.
4. UI en composants petits ; états vide/chargement/erreur obligatoires.
5. Accessibilité : focus visibles, labels ARIA, navigation clavier, contraste AA.
6. Jamais de secret, jamais de chemin local (`/Users/...`, `C:...`).
7. Ne pas ajouter de dépendance sans nécessité démontrée.
8. Toute nouvelle implémentation de `StorageAdapter` doit passer le contrat de `src/test/storageContract.ts`.

## Definition of Done (par tranche)

- Fonctionne à l'écran
- Tests ajoutés et verts
- `npm run verify` vert
- Commit poussé
- Pas de régression sur les tranches précédentes

## Design

Palette papier chaud + accent ambre (`--accent: #b45309`), grille 4px, Inter pour le texte, Fraunces pour les titres, JetBrains Mono pour les prompts. Cartes de prompt, chips de tags, toast de copie. Densité « Linear/Notion », pas de décoration gratuite. Les tokens font foi dans `src/styles/tokens.css`.

## Interdits

- Backend, comptes, sync cloud
- Appels réseau dans le code de test
- Refonte globale non demandée
