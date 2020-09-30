const { expect, use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const ROOM_NOT_AVAILABLE = 'Room not available';
const PRICE_NOT_REACHED = 'Price not reached';

contract('GIVEN someone created a room and someone booked a date', function ([
  ,
  roomOwner,
  firstBooker,
  secondBooker,
]) {
  before(async function () {
    this.price = '10000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
    this.tx = await this.bnBooking.book(0, 1, 1, 2020, {
      from: firstBooker,
      value: this.price,
    });
  });
  describe('WHEN someone tries to book the same date', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.book(0, 1, 1, 2020, { from: secondBooker, value: this.price }),
        ROOM_NOT_AVAILABLE
      );
    });
  });
});

contract('GIVEN someone created a room', function ([, roomOwner, booker]) {
  before(async function () {
    this.price = '10000000000000000';
    this.bnBooking = await BnBooking.deployed();
    this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN someone tries to book without enough value being transfered', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.book(0, 1, 1, 2020, {
          from: booker,
          value: new BN(this.price).sub(new BN(1)),
        }),
        PRICE_NOT_REACHED
      );
    });
  });
});

contract('GIVEN someone created a room', function ([, roomOwner, booker]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN someone tries to book with just enough value being transfered', function () {
    before(async function () {
      this.initialBalanceUser = new BN((await web3.eth.getBalance(booker)).toString());
      this.initialBalanceContract = new BN(
        (await web3.eth.getBalance(this.bnBooking.address)).toString()
      );
      this.tx = await this.bnBooking.book(0, 1, 1, 2020, {
        from: booker,
        value: new BN(this.price),
      });
      this.finalBalanceUser = new BN((await web3.eth.getBalance(booker)).toString());
      this.finalBalanceContract = new BN(
        (await web3.eth.getBalance(this.bnBooking.address)).toString()
      );
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

    it('THEN the balance of the user decreased exactly by the price(+the fee paid for the tx)', async function () {
      const gasUsed = new BN(this.tx.receipt.gasUsed);
      const gasPrice = new BN((await web3.eth.getTransaction(this.tx.tx)).gasPrice);
      const feeUsed = gasPrice.mul(gasUsed);
      return expect(this.initialBalanceUser.sub(this.finalBalanceUser.add(feeUsed))).to.eq.BN(
        this.price
      );
    });

    it('THEN the price of the contract increased exactly by the price', async function () {
      return expect(this.finalBalanceContract.sub(this.initialBalanceContract)).to.eq.BN(
        this.price
      );
    });

    it('THEN the room owner gets its share', async function () {
      return expect(await this.bnBooking.accumulatedPayments(roomOwner)).to.eq.BN(
        // Assuming 50% fee rate
        new BN(this.price).div(new BN(2))
      );
    });

    it('THEN the fee receiver gets its share', async function () {
      return expect(
        await this.bnBooking.accumulatedPayments(await this.bnBooking.feeReceiver())
      ).to.eq.BN(
        // Assuming 50% fee rate
        new BN(this.price).div(new BN(2))
      );
    });

    it('THEN the room is booked', async function () {
      return expect(this.bnBooking.booked(0, 1, 1, 2020)).to.be.eventually.true;
    });

    it('THEN the room is not booked on the next date', async function () {
      return expect(this.bnBooking.booked(0, 2, 1, 2020)).to.be.eventually.false;
    });
    it('THEN the room is available on another date', async function () {
      return expect(
        this.bnBooking.book(0, 3, 1, 2020, {
          from: booker,
          value: new BN(this.price),
        })
      ).to.be.fulfilled;
    });
  });
});

contract('GIVEN someone created a room', function ([, roomOwner, booker]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN someone tries to book with more than enough value being transfered', function () {
    before(async function () {
      this.initialBalanceUser = new BN((await web3.eth.getBalance(booker)).toString());
      this.initialBalanceContract = new BN(
        (await web3.eth.getBalance(this.bnBooking.address)).toString()
      );
      this.tx = await this.bnBooking.book(0, 1, 1, 2020, {
        from: booker,
        value: new BN(this.price).mul(new BN(2)),
      });
      this.finalBalanceUser = new BN((await web3.eth.getBalance(booker)).toString());
      this.finalBalanceContract = new BN(
        (await web3.eth.getBalance(this.bnBooking.address)).toString()
      );
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

    it('THEN the balance of the user decreased exactly by the price(+the fee paid for the tx)', async function () {
      const gasUsed = new BN(this.tx.receipt.gasUsed);
      const gasPrice = new BN((await web3.eth.getTransaction(this.tx.tx)).gasPrice);
      const feeUsed = gasPrice.mul(gasUsed);
      return expect(this.initialBalanceUser.sub(this.finalBalanceUser.add(feeUsed))).to.eq.BN(
        this.price
      );
    });

    it('THEN the price of the contract increased exactly by the price', async function () {
      return expect(this.finalBalanceContract.sub(this.initialBalanceContract)).to.eq.BN(
        this.price
      );
    });

    it('THEN the room owner gets its share', async function () {
      return expect(await this.bnBooking.accumulatedPayments(roomOwner)).to.eq.BN(
        // Assuming 50% fee rate
        new BN(this.price).div(new BN(2))
      );
    });

    it('THEN the fee receiver gets its share', async function () {
      return expect(
        await this.bnBooking.accumulatedPayments(await this.bnBooking.feeReceiver())
      ).to.eq.BN(
        // Assuming 50% fee rate
        new BN(this.price).div(new BN(2))
      );
    });

    it('THEN the room is booked', async function () {
      return expect(this.bnBooking.booked(0, 1, 1, 2020)).to.be.eventually.true;
    });
    it('THEN the room is not booked on the next date', async function () {
      return expect(this.bnBooking.booked(0, 2, 1, 2020)).to.be.eventually.false;
    });
    it('THEN the room is available on another date', async function () {
      return expect(
        this.bnBooking.book(0, 3, 1, 2020, {
          from: booker,
          value: new BN(this.price),
        })
      ).to.be.fulfilled;
    });
  });
});
