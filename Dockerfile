FROM node:24.19.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24.19.0-alpine AS runtime

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci
COPY --from=build /app/dist ./dist

EXPOSE 4173
CMD ["npm", "run", "start"]
