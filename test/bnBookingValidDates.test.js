const { expect, use } = require('chai');
const chaiAsPromiesd = require('chai-as-promised');
const bnChai = require('bn-chai');
const { expectRevert, BN } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');

use(chaiAsPromiesd);
use(bnChai(BN));

const INVALID_DATE = 'Invalid date';

contract('GIVEN someone created a room', function ([, roomOwner, booker]) {
  before(async function () {
    this.price = '100000000000000000';
    this.bnBooking = await BnBooking.deployed();
    await this.bnBooking.createRoom(this.price, { from: roomOwner });
  });
  describe('WHEN someone tries to book the 0th of jan', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.intentBook(0, 0, 1, 2020, { from: booker, value: this.price }),
        INVALID_DATE
      );
    });
  });

  describe('WHEN someone tries to book the 31st of april', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.intentBook(0, 31, 4, 2020, { from: booker, value: this.price }),
        INVALID_DATE
      );
    });
  });

  describe('WHEN someone tries to book the 32nd of jan', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.intentBook(0, 32, 1, 2020, { from: booker, value: this.price }),
        INVALID_DATE
      );
    });
  });

  describe('WHEN someone tries to book the 29th of feb of 2019', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.intentBook(0, 29, 2, 2019, { from: booker, value: this.price }),
        INVALID_DATE
      );
    });
  });

  describe('WHEN someone tries to book the 29th of feb of 2100', function () {
    it('THEN the tx reverts', async function () {
      return expectRevert(
        this.bnBooking.intentBook(0, 29, 2, 2100, { from: booker, value: this.price }),
        INVALID_DATE
      );
    });
  });

  describe('WHEN someone tries to book the 29th of feb of 2000', function () {
    it('THEN the tx doesnt revert', async function () {
      return expect(
        this.bnBooking.intentBook(0, 29, 2, 2000, { from: booker, value: this.price })
      ).to.be.fulfilled;
    });
  });
  describe('WHEN someone tries to book the 29th of feb of 2008', function () {
    it('THEN the tx doesnt revert', async function () {
      return expect(
        this.bnBooking.intentBook(0, 29, 2, 2008, { from: booker, value: this.price })
      ).to.be.fulfilled;
    });
  });
  describe('WHEN someone tries to book the 31th of jan', function () {
    it('THEN the tx doesnt revert', async function () {
      return expect(
        this.bnBooking.intentBook(0, 31, 1, 2008, { from: booker, value: this.price })
      ).to.be.fulfilled;
    });
  });

  describe('WHEN someone tries to book the 1st of jan', function () {
    it('THEN the tx doesnt revert', async function () {
      return expect(
        this.bnBooking.intentBook(0, 1, 1, 2008, { from: booker, value: this.price })
      ).to.be.fulfilled;
    });
  });
});
