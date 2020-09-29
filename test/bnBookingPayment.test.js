const { expect, use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

contract('GIVEN someone created a room and booked a room(and paid the room owner)', function ([
  ,
  roomOwner,
  booker,
]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
    await this.bnBooking.book(0, 1, 1, 2020, {
      from: booker,
      value: new BN(this.price),
    });
    return expect(await this.bnBooking.accumulatedPayments(roomOwner)).to.eq.BN(
      // Assuming 50% fee rate
      new BN(this.price).div(new BN(2))
    );
  });
  describe('WHEN the room owner withdraws all of it', function () {
    before(async function () {
      this.accumulatedPayments = await this.bnBooking.accumulatedPayments(roomOwner);
      this.initialUserBalance = new BN(await web3.eth.getBalance(roomOwner));
      this.initialContractBalance = new BN(await web3.eth.getBalance(this.bnBooking.address));
      this.tx = await this.bnBooking.withdraw({
        from: roomOwner,
      });
      this.finalUserBalance = new BN(await web3.eth.getBalance(roomOwner));
      this.finalContractBalance = new BN(await web3.eth.getBalance(this.bnBooking.address));
    });
    it('THEN the balance on the contract decreases', async function () {
      return expect(this.initialContractBalance.sub(this.finalContractBalance)).to.eq.BN(
        new BN(this.price).div(new BN(2))
      );
    });
    it('THEN the balance on the room owner increases', async function () {
      const gasUsed = new BN(this.tx.receipt.gasUsed);
      const gasPrice = new BN((await web3.eth.getTransaction(this.tx.tx)).gasPrice);
      const feeUsed = gasPrice.mul(gasUsed);
      return expect(this.finalUserBalance.sub(this.initialUserBalance.sub(feeUsed))).to.eq.BN(
        new BN(this.price).div(new BN(2))
      );
    });
    it('THEN the accumulated payments gets reduced', async function () {
      return expect(await this.bnBooking.accumulatedPayments(roomOwner)).to.eq.BN(0);
    });
  });
}); // TODO event
