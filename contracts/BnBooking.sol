pragma solidity 0.6.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract BnBookingEvents {
    event RoomBooked(uint256 indexed roomId, address indexed booker, uint256 price, uint256 day, uint256 month, uint256 year);
    event PaymentSent(address indexed paymentReceiver, uint256 price);
    event RoomCreated(address indexed owner, uint256 indexed roomId, uint256 price);
    event RoomRemoved(address indexed owner, uint256 indexed roomId);
}

contract BnBooking is Ownable, ReentrancyGuard, BnBookingEvents {
    using SafeMath for uint256;

    struct Room {
        uint256 roomId;
        address owner;
        uint256 price;
    }

    mapping (uint256 => mapping (bytes32 => address)) public bookings; // bookings: roomId -> hash(date) -> booker

    mapping (address => uint256) public accumulatedPayments;

    Room[] public rooms;

    uint256 public nextRoomId = 0;

    uint256 private constant FEE_RATE_PRECISION = 10 ** 18;

    uint256 public feeRate;

    address public feeReceiver;

    constructor(uint256 _feeRate, address _feeReceiver) public {
        feeRate = _feeRate;
        feeReceiver = _feeReceiver;
    }

    modifier validDate(uint256 day, uint256 month, uint256 year) {
        require(isValidDate(day, month, year), "Invalid date"); //TODO
        _;
    }

    modifier roomExists(uint256 roomId) {
        require(roomId < nextRoomId, "Room has not been created");
        require(rooms[roomId].owner != address(0), "Room has been removed");
        _;
    }

    function claimPayments() public nonReentrant {
        uint256 accumulatedPayment = accumulatedPayments[msg.sender];
        msg.sender.transfer(accumulatedPayment);
        emit PaymentSent(msg.sender, accumulatedPayment);
    }

    function createRoom(uint256 price) public {
        require(price > 0, "Price cant be zero");
        uint256 roomId = nextRoomId++;
        rooms.push(Room({
            roomId: roomId,
            price: price,
            owner: msg.sender
        }));
        emit RoomCreated(msg.sender, roomId, price);
    }

    function setFeeRate(uint256 newFeeRate) public onlyOwner {
        feeRate = newFeeRate;
    }

    function setFeeReceiver(address newFeeReceiver) public onlyOwner {
        feeReceiver = newFeeReceiver;
    }

    function booked(uint256 roomId, uint256 day, uint256 month, uint256 year) public view validDate(day, month, year) returns(bool){
        return bookings[roomId][getDateId(day, month, year)] != address(0);
    }

    function book(uint256 roomId, uint256 day, uint256 month, uint256 year) public payable validDate(day, month, year) roomExists(roomId) {
        require(!booked(roomId, day, month, year), "Room not available");

        Room storage room = rooms[roomId];

        require(msg.value >= room.price, "Price not reached");

        msg.sender.transfer(msg.value.sub(room.price));

        splitPayment(room.owner, room.price);
        bookings[roomId][getDateId(day, month, year)] = msg.sender;

        emit RoomBooked(roomId, msg.sender, room.price, day, month, year);
    }


    function removeRoom(uint256 roomId) public roomExists(roomId) {
        Room storage toRemove = rooms[roomId];
        require(toRemove.owner == msg.sender || owner() == msg.sender, "Not owner");
        delete(rooms[roomId]);
        emit RoomRemoved(msg.sender, roomId);
    }


    function changePrice(uint256 roomId, uint256 newPrice) public roomExists(roomId) {
        Room storage toChange = rooms[roomId];
        require(toChange.owner == msg.sender, "Not owner");
        toChange.price = newPrice;
    }

    function withdraw() public nonReentrant {
        uint256 paymentToWithdraw = accumulatedPayments[msg.sender];
        delete accumulatedPayments[msg.sender];
        msg.sender.transfer(paymentToWithdraw);
        emit PaymentSent(msg.sender, paymentToWithdraw);
    }

    function splitPayment(address receiver, uint256 price) internal {
        accumulatedPayments[receiver] = price.mul(feeRate).div(FEE_RATE_PRECISION);
        accumulatedPayments[feeReceiver] = price.sub(price.mul(feeRate).div(FEE_RATE_PRECISION));
    }


    function getDateId(uint256 day, uint256 month, uint256 year) internal pure returns(bytes32){
        return keccak256(abi.encodePacked(day, month, year));
    }

    function isValidDate(uint256 day, uint256 month, uint256 year) internal pure returns(bool) {

        bool dayIsPositive = day > 0;
        bool leapYear = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        bool doesntExceedFebruary = (day <= 28) || (leapYear && day <= 29);
        bool isLongMonth = month == 1||
            month == 3 ||
            month == 5 ||
            month == 6 ||
            month == 8 ||
            month == 10 ||
            month == 12;
        bool isShortMonth = !isLongMonth && month != 2;
        bool doesntExceedMonth = day <= 30 && isShortMonth || day <= 31 && isLongMonth || doesntExceedFebruary && month == 2;
        return dayIsPositive && doesntExceedMonth;
    }

}