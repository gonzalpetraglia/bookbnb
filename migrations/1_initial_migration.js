const Migrations = artifacts.require('Migrations');

module.exports = function migrate(deployer) {
  return deployer.deploy(Migrations);
};
