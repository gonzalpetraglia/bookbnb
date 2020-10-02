const { use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const ROOM_REMOVED = 'Room has been removed';

contract('GIVEN someone created a room and removed it', function ([
  ,
  roomOwner,
  booker,
  randomAddress,
]) {
  before(async function () {
    this.price = '10000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN it is removed', function () {
    before(async function () {
      this.tx = await this.bnBooking.removeRoom(0, { from: roomOwner });
    });
    it('THEN its not available for booking', async function () {
      return expectRevert(
        this.bnBooking.intentBook(0, 1, 1, 2020, { from: booker, value: this.price }),
        ROOM_REMOVED
      );
    });

    it('THEN it can not be removed again', async function () {
      return expectRevert(this.bnBooking.removeRoom(0, { from: roomOwner }), ROOM_REMOVED);
    });
    it('THEN the price of the room can not be changed', async function () {
      return expectRevert(
        this.bnBooking.changePrice(0, this.price, { from: roomOwner }),
        ROOM_REMOVED
      );
    });
    describe('WHEN someone tries to accept an intent of one', function () {
      it('THEN the tx fails', async function () {
        return expectRevert(
          this.bnBooking.accept(0, randomAddress, 1, 1, 2020, { from: roomOwner }),
          ROOM_REMOVED
        );
      });
    });
    describe('WHEN someone tries to reject an intent of one', function () {
      it('THEN the tx fails', async function () {
        return expectRevert(
          this.bnBooking.reject(0, randomAddress, 1, 1, 2020, { from: roomOwner }),
          ROOM_REMOVED
        );
      });
    });
    it('THEN an event is emitted', async function () {
      return expectEvent(this.tx, 'RoomRemoved', { owner: roomOwner, roomId: new BN(0) });
    });
  });
});
