# BookBnB

![Node.js CI](https://github.com/gonzalpetraglia/bookbnb/workflows/Node.js%20CI/badge.svg?branch=master)

This is the repository that keeps the Smart Contract of the BookBnB project.

This is for educational purposes do not use this in production

## Prerequisites

For this project you should have NVM installed(or the exact same version of node described in .nvmrc)

## Test

For the tests to be run, just execute

```sh
npm run test
```

## Coverage

For the tests to be run and a coverage report to be generated, just execute

```sh
npm run coverage
```

## Linting

For the linters to be generated, just execute

```sh
npm run lint
```

## Deploy

For the deployment of this project you have to options:

```sh
npm run deploy-local
```

```sh
npm run deploy-testnet
```

The configs used are set on `migrations/config.json`
