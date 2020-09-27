const config = require('./config');
const BnBooking = artifacts.require("BnBooking");

module.exports = function (deployer) {
  deployer.deploy(BnBooking, config.feeRate, config.feeReceiver);
};
