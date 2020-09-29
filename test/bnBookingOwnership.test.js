const { use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const NOT_OWNER = 'Not owner';

contract('GIVEN someone created a room', function ([, roomOwner, otherUser]) {
  before(async function () {
    this.price = '10000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN someone else tries to delete it', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(this.bnBooking.removeRoom(0, { from: otherUser }), NOT_OWNER);
    });
  });
  describe('WHEN someone else tries to change its price', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.changePrice(0, this.price, { from: otherUser }),
        NOT_OWNER
      );
    });
  });
});
