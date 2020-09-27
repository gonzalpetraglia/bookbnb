const { expectRevert } = require('openzeppelin-test-helpers');

const BnBooking = artifacts.require('BnBooking');


const NON_EXISTENT_ROOM = 'Non existent room';

contract('GIVEN there is no room', function() {
    before(async function() {
        this.bnBooking = await BnBooking.deployed();
    });
    describe('WHEN some one tries to book it', function() {
        it('THEN the tx fails', async function() {

            return expectRevert(this.bnBooking.book(1, 1, 1, 2020), NON_EXISTENT_ROOM);
        })
    })
})