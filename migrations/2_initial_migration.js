const config = require('./config');

const BnBooking = artifacts.require('BnBooking');

module.exports = function migrate(deployer) {
  return deployer.deploy(BnBooking, config.feeRate, config.feeReceiver);
};
