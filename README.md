# Prompt Diary

Journal local-first de prompts pour sauvegarder, noter, retrouver et réutiliser les prompts qui fonctionnent.

Le projet ne nécessite ni compte, ni backend, ni requête réseau à l'exécution.

## Prérequis

- Node.js `24.19.0` (voir `.nvmrc`)
- npm

## Installation

```bash
npm ci
```

## Développement

```bash
npm run dev
```

## Vérifications

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Le test unique du projet est également disponible via :

```bash
make test
```

## Production locale

```bash
npm run build
npm start
```

## Scénario de démo (2 minutes)

1. Créer « Analyse de document » avec les tags `analyse` et une note `5`.
2. Rechercher `analyse`, filtrer sur `5+`, copier le prompt et vérifier le toast.
3. Vérifier que le compteur d'utilisation augmente, puis marquer le prompt comme favori.
4. Exporter la bibliothèque en JSON depuis Réglages.
5. Créer un prompt vague et vérifier le badge « À préciser » et sa suggestion.
6. Vérifier le rappel : « Tout est local, rien ne part sur un serveur. »

## Docker

```bash
docker build -t prompt-diary .
docker run --rm -p 4173:4173 prompt-diary
```

Puis ouvrir <http://localhost:4173>.
