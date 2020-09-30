const HDWalletProvider = require('@truffle/hdwallet-provider');

// const infuraKey = "fj4jll3k.....";
//
module.exports = {
  networks: {
    test: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
    ropsten: {
      port: 8777, // Custom port
      network_id: '*', // Custom network
      provider: () => new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_ROPSTEN_NODE),
      websockets: true, // Enable EventEmitter interface for web3 (default: false)
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 100000,
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.12', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
  plugins: ['solidity-coverage'],
};
