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

contract('GIVEN someone created a room and someone created an intent to book it', function ([
  ,
  roomOwner,
  booker,
]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
    await this.bnBooking.intentBook(0, 1, 1, 2020, {
      from: booker,
      value: new BN(this.price),
    });
  });
  describe('WHEN someone else(and not the owner) tries to accept it', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.accept(0, booker, 1, 1, 2020, { from: booker }),
        NOT_OWNER
      );
    });
  });
});

contract('GIVEN someone created a room and someone created an intent to book it', function ([
  ,
  roomOwner,
  booker,
]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
    await this.bnBooking.intentBook(0, 1, 1, 2020, {
      from: booker,
      value: new BN(this.price),
    });
  });
  describe('WHEN someone else(and not the owner) tries to reject it', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.reject(0, booker, 1, 1, 2020, { from: booker }),
        NOT_OWNER
      );
    });
  });
});
