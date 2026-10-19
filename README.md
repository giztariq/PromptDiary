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

## Docker

```bash
docker build -t prompt-diary .
docker run --rm -p 4173:4173 prompt-diary
```

Puis ouvrir <http://localhost:4173>.
