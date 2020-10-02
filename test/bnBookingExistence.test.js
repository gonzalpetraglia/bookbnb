const { use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const ROOM_HAS_NOT_BEEN_CREATED = 'Room has not been created';

contract('GIVEN there has not been any room created', function ([owner, randomAddress]) {
  before(async function () {
    this.bnBooking = await BnBooking.deployed();
  });
  describe('WHEN someone tries to book one', function () {
    it('THEN the tx fails', async function () {
      return expectRevert(
        this.bnBooking.intentBook(1, 1, 1, 2020, { from: owner }),
        ROOM_HAS_NOT_BEEN_CREATED
      );
    });
  });
  describe('WHEN someone tries to remove one', function () {
    it('THEN the tx fails', async function () {
      return expectRevert(this.bnBooking.removeRoom(0, { from: owner }), ROOM_HAS_NOT_BEEN_CREATED);
    });
  });
  describe('WHEN someone tries to change the price of one', function () {
    it('THEN the tx fails', async function () {
      return expectRevert(
        this.bnBooking.changePrice(0, 1, { from: owner }),
        ROOM_HAS_NOT_BEEN_CREATED
      );
    });
  });
  describe('WHEN someone tries to accept an intent of one', function () {
    it('THEN the tx fails', async function () {
      return expectRevert(
        this.bnBooking.accept(0, randomAddress, 1, 1, 2020, { from: owner }),
        ROOM_HAS_NOT_BEEN_CREATED
      );
    });
  });
  describe('WHEN someone tries to reject an intent of one', function () {
    it('THEN the tx fails', async function () {
      return expectRevert(
        this.bnBooking.reject(0, randomAddress, 1, 1, 2020, { from: owner }),
        ROOM_HAS_NOT_BEEN_CREATED
      );
    });
  });
});
