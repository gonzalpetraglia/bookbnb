const { use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const PRICE_NOT_REACHED = 'Price not reached';

contract('GIVEN someone created a room', function ([, roomOwner]) {
  before(async function () {
    this.initialPrice = '100000000000000000';
    this.newPrice = '200000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.initialPrice, { from: roomOwner });
  });
  describe('WHEN the price is changed', function () {
    before(async function () {
      this.tx = await this.bnBooking.changePrice(0, this.newPrice, { from: roomOwner });
    });
    it('THEN an event is emitted', async function () {
      return expectEvent(this.tx, 'PriceChanged', {
        roomId: new BN(0),
        owner: roomOwner,
        newPrice: this.newPrice,
      });
    });
  });
});

contract('GIVEN someone created a room and changed its price(to a greater one)', function ([
  ,
  roomOwner,
  booker,
]) {
  before(async function () {
    this.initialPrice = '100000000000000000';
    this.newPrice = '200000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.initialPrice, { from: roomOwner });
    await this.bnBooking.changePrice(0, this.newPrice, { from: roomOwner });
  });
  describe('WHEN someone tries to book with the new price as payment', function () {
    before(async function () {
      this.tx = await this.bnBooking.book(0, 1, 1, 2020, {
        from: booker,
        value: new BN(this.newPrice),
      });
    });
    it('THEN an event was emitted', async function () {
      return expectEvent(this.tx, 'RoomBooked', {
        roomId: new BN(0),
        day: new BN(1),
        month: new BN(1),
        year: new BN(2020),
        booker,
      });
    });
  });
});

contract('GIVEN someone created a room and changed its price(to a greater one)', function ([
  ,
  roomOwner,
  booker,
]) {
  before(async function () {
    this.initialPrice = '100000000000000000';
    this.newPrice = '200000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.initialPrice, { from: roomOwner });
    await this.bnBooking.changePrice(0, this.newPrice, { from: roomOwner });
  });
  describe('WHEN someone tries to book with the old price as payment', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.book(0, 1, 1, 2020, {
          from: booker,
          value: new BN(this.initialPrice),
        }),
        PRICE_NOT_REACHED
      );
    });
  });
});
