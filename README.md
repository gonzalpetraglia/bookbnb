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

For the deployment of this project in each network read the relevant subsection.

The configs to be used are set on `migrations/config.json`

### Local

For this you have to have ganache, or any eth-json-rpc server, running on http://localhost:8545. This can be achieved executing:

```sh
npm run ganache
```

And later deploy using:

```sh
npm run deploy-local
```

### Ropsten

For the Ropsten deployment you, having `INFURA_ROPSTEN_NODE`(URL given by infura) and `MNEMONIC`(12 words with balance in the ropsten network) set as environment variables, have to run:

```sh
npm run deploy-ropsten
```

### Other networks

In order to deploy in other networks, you first have to define the network in `truffle-config.js` and later define a script analog to the deploy-\* scripts.
