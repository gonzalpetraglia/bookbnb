const { expect, use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

const INTENT_NOT_FOUND = 'Intent not found';

use(chaiAsPromiesd);
use(bnChai(BN));

contract('GIVEN someone created a room and someone created an intent', function ([
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
  describe('WHEN the room owner rejects the intent', function () {
    before(async function () {
      this.tx = await this.bnBooking.reject(0, booker, 1, 1, 2020, { from: roomOwner });
    });
    it('THEN an event was emitted', async function () {
      return expectEvent(this.tx, 'BookIntentRejected', {
        roomId: new BN(0),
        day: new BN(1),
        month: new BN(1),
        year: new BN(2020),
        booker,
        owner: roomOwner,
        price: new BN(this.price),
      });
    });

    it('THEN the room owner gets nothing', async function () {
      return expect(await this.bnBooking.accumulatedPayments(roomOwner)).to.eq.BN(new BN(0));
    });

    it('THEN the fee receiver gets nothing', async function () {
      return expect(
        await this.bnBooking.accumulatedPayments(await this.bnBooking.feeReceiver())
      ).to.eq.BN(new BN(0));
    });

    it('THEN the room is not booked', async function () {
      return expect(this.bnBooking.booked(0, 1, 1, 2020)).to.be.eventually.false;
    });
    it('THEN the room is available on that date', async function () {
      return expect(
        this.bnBooking.intentBook(0, 1, 1, 2020, {
          from: booker,
          value: new BN(this.price),
        })
      ).to.be.fulfilled;
    });
    it('THEN the booker gets its money back', async function () {
      return expect(await this.bnBooking.accumulatedPayments(booker)).to.eq.BN(this.price);
    });
  });
});

contract(
  'GIVEN someone created a room and someone created an intent and later the room owner increases the price',
  function ([, roomOwner, booker]) {
    before(async function () {
      this.initPrice = '100000000000000000';
      this.newPrice = '200000000000000000';
      this.bnBooking = await BnBooking.deployed();
      await this.bnBooking.createRoom(this.initPrice, { from: roomOwner });
      await this.bnBooking.intentBook(0, 1, 1, 2020, {
        from: booker,
        value: new BN(this.initPrice),
      });
      await this.bnBooking.changePrice(0, this.newPrice, { from: roomOwner });
    });
    describe('WHEN the room owner rejects the intent with the initial price', function () {
      before(async function () {
        this.tx = await this.bnBooking.reject(0, booker, 1, 1, 2020, { from: roomOwner });
      });
      it('THEN an event was emitted with the initial price', async function () {
        return expectEvent(this.tx, 'BookIntentRejected', {
          roomId: new BN(0),
          day: new BN(1),
          month: new BN(1),
          year: new BN(2020),
          booker,
          owner: roomOwner,
          price: new BN(this.initPrice),
        });
      });

      it('THEN the room owner gets nothing', async function () {
        return expect(await this.bnBooking.accumulatedPayments(roomOwner)).to.eq.BN(
          new BN(this.price).div(new BN(2))
        );
      });

      it('THEN the fee receiver gets nothing', async function () {
        return expect(
          await this.bnBooking.accumulatedPayments(await this.bnBooking.feeReceiver())
        ).to.eq.BN(new BN(0));
      });

      it('THEN the room is not booked', async function () {
        return expect(this.bnBooking.booked(0, 1, 1, 2020)).to.be.eventually.false;
      });
      it('THEN the room is available on that date', async function () {
        return expect(
          this.bnBooking.intentBook(0, 1, 1, 2020, {
            from: booker,
            value: new BN(this.newPrice),
          })
        ).to.be.fulfilled;
      });
      it('THEN the booker gets exactly the sent money back', async function () {
        return expect(await this.bnBooking.accumulatedPayments(booker)).to.eq.BN(this.initPrice);
      });
    });
  }
);

contract('GIVEN someone created a room and no one created an intent', async function ([
  ,
  roomOwner,
  randomAddress,
]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN the room owner wants to reject it', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.reject(0, randomAddress, 1, 1, 20, { from: roomOwner }),
        INTENT_NOT_FOUND
      );
    });
  });
});

contract('GIVEN someone created a room and a booker created an intent', async function ([
  ,
  roomOwner,
  booker,
  randomAddress,
]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
    await this.bnBooking.intentBook(0, 1, 1, 2020, {
      from: booker,
      value: new BN(this.price).mul(new BN(2)),
    });
  });
  describe('WHEN the room owner wants to reject it using another address', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.reject(0, randomAddress, 1, 1, 20, { from: roomOwner }),
        INTENT_NOT_FOUND
      );
    });
  });
});

contract('GIVEN someone created a room and another user created an intent', async function ([
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
      value: new BN(this.price).mul(new BN(2)),
    });
  });
  describe('WHEN the room owner rejects it once', function () {
    before(async function () {
      await this.bnBooking.reject(0, booker, 1, 1, 2020, { from: roomOwner });
    });
    it('THEN the room owner can not reject it again', async function () {
      return expectRevert(
        this.bnBooking.reject(0, booker, 1, 1, 20, { from: roomOwner }),
        INTENT_NOT_FOUND
      );
    });
  });
});

contract('GIVEN someone created a room and another user created an intent', async function ([
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
      value: new BN(this.price).mul(new BN(2)),
    });
  });
  describe('WHEN the room owner accepts it', function () {
    before(async function () {
      await this.bnBooking.accept(0, booker, 1, 1, 2020, { from: roomOwner });
    });
    it('THEN the room owner can not reject it', async function () {
      return expectRevert(
        this.bnBooking.reject(0, booker, 1, 1, 20, { from: roomOwner }),
        INTENT_NOT_FOUND
      );
    });
  });
});
