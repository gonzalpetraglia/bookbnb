const { use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const ROOM_HAS_NOT_BEEN_CREATED = 'Room has not been created';
const ROOM_REMOVED = 'Room has been removed';

contract('GIVEN there has not been any room created', function ([owner]) {
  before(async function () {
    this.bnBooking = await BnBooking.deployed();
  });
  describe('WHEN someone tries to book one', function () {
    it('THEN the tx fails', async function () {
      return expectRevert(
        this.bnBooking.book(1, 1, 1, 2020, { from: owner }),
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
});

contract('GIVEN someone created a room', function ([, roomOwner, booker]) {
  before(async function () {
    this.price = '10000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
    await this.bnBooking.removeRoom(0, { from: roomOwner });
  });
  describe('WHEN someone tries to book it', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.book(0, 1, 1, 2020, { from: booker, value: this.price }),
        ROOM_REMOVED
      );
    });
  });

  describe('WHEN someone tries to remove it again', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(this.bnBooking.removeRoom(0, { from: roomOwner }), ROOM_REMOVED);
    });
  });
  describe('WHEN someone else tries to change the price', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.changePrice(0, this.price, { from: roomOwner }),
        ROOM_REMOVED
      );
    });
  });
});
