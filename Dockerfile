# syntax=docker/dockerfile:1

FROM node:24.19.0-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS test

COPY . .
RUN npm run verify

CMD ["npm", "test"]

FROM dependencies AS build

COPY . .
RUN npm run build

FROM node:24.19.0-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4173

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts/serve.mjs ./scripts/serve.mjs
COPY --from=build /app/package.json ./package.json

EXPOSE 4173

USER node

CMD ["node", "scripts/serve.mjs"]
