const { expect, use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const PRICE_CANT_BE_ZERO = 'Price cant be zero';

contract('GIVEN there has not been any room created', function ([, roomOwner]) {
  before(async function () {
    this.bnBooking = await BnBooking.deployed();
  });
  describe('WHEN someone creates a room', function () {
    before(async function () {
      this.price = '1000000000000000';
      this.tx = await this.bnBooking.createRoom(this.price, { from: roomOwner });
    });
    it('THEN an event is emitted', async function () {
      return expectEvent(this.tx, 'RoomCreated', {
        roomId: new BN(0),
        price: new BN(this.price),
        owner: roomOwner,
      });
    });

    it('THEN the room is created as room 0 with the correct price', async function () {
      const room = await this.bnBooking.rooms(0);
      return expect(room.price).to.eq.BN(this.price);
    });
    it('THEN the room is created as room 0 with roomId set to 0', async function () {
      const room = await this.bnBooking.rooms(0);
      return expect(room.roomId).to.eq.BN(0);
    });
    it('THEN the room is created as room 0 with the sender as the owner', async function () {
      const room = await this.bnBooking.rooms(0);
      return expect(room.owner).to.be.equal(roomOwner);
    });
  });
});

contract('GIVEN there has not been any room created', function ([, roomOwner]) {
  before(async function () {
    this.bnBooking = await BnBooking.deployed();
  });
  describe('WHEN someone tries to create a room with 0 as the price', function () {
    it('THEN the tx fails', async function () {
      this.price = '0';
      return expectRevert(
        this.bnBooking.createRoom(this.price, { from: roomOwner }),
        PRICE_CANT_BE_ZERO
      );
    });
  });
});
