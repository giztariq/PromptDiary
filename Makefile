.PHONY: install dev verify test build start

install:
	npm ci

dev:
	npm run dev

verify:
	npm run verify

test:
	npm test

build:
	npm run build

start:
	npm start
