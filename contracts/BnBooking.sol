pragma solidity 0.6.12;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract BnBookingEvents {
    event RoomBooked(
        uint256 indexed roomId,
        address indexed booker,
        address indexed owner,
        uint256 price,
        uint256 day,
        uint256 month,
        uint256 year
    );
    event PaymentSent(address indexed paymentReceiver, uint256 price);
    event RoomCreated(address indexed owner, uint256 indexed roomId, uint256 price);
    event RoomRemoved(address indexed owner, uint256 indexed roomId);
    event PriceChanged(address indexed owner, uint256 indexed roomId, uint256 newPrice);
    event BookIntentCreated(
        uint256 indexed roomId,
        address indexed booker,
        address indexed owner,
        uint256 price,
        uint256 day,
        uint256 month,
        uint256 year
    );
    event BookIntentRejected(
        uint256 indexed roomId,
        address indexed booker,
        address indexed owner,
        uint256 price,
        uint256 day,
        uint256 month,
        uint256 year
    );
}

contract BnBooking is Ownable, ReentrancyGuard, BnBookingEvents {
    using SafeMath for uint256;

    struct Room {
        uint256 roomId;
        address owner;
        uint256 price;
    }

    struct BookingIntent {
        uint256 price;
        uint256 positionBooker;
    }

    // bookings: roomId -> hash(date) -> booker
    mapping (uint256 => mapping (bytes32 => address)) internal bookings;

    // bookingIntents: roomId -> hash(date) -> possibleBooker -> bookingIntent
    mapping (uint256 => mapping (bytes32 => mapping (address => BookingIntent))) internal bookingIntents;

    mapping (uint256 => mapping (bytes32 => address[])) internal possibleBookers;

    mapping (address => uint256) public accumulatedPayments;

    Room[] public rooms;

    uint256 public nextRoomId = 0;

    uint256 public feeRate;

    address public feeReceiver;

    uint256 public constant FEE_RATE_PRECISION = 10 ** 18;

    uint256 public constant MAX_INTENTS = 5;

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

    function intentBook(uint256 roomId, uint256 day, uint256 month, uint256 year) public payable validDate(day, month, year) roomExists(roomId) {
        require(!booked(roomId, day, month, year), "Room not available");
        require(bookingIntents[roomId][getDateId(day, month, year)][msg.sender].price == 0, "Intent already created");
        Room storage room = rooms[roomId];
        require(room.owner != msg.sender, "Cannot book your own room");

        require(msg.value >= room.price, "Price not reached");

        msg.sender.transfer(msg.value.sub(room.price));

        require(possibleBookers[roomId][getDateId(day, month, year)].length < MAX_INTENTS, "Max intents reached");
        possibleBookers[roomId][getDateId(day, month, year)].push(msg.sender);
        bookingIntents[roomId][getDateId(day, month, year)][msg.sender] = BookingIntent({
            price: room.price,
            positionBooker: possibleBookers[roomId][getDateId(day, month, year)].length - 1
        });

        emit BookIntentCreated(
            roomId,
            msg.sender,
            room.owner,
            room.price,
            day,
            month,
            year
        );
    }

    function reject(uint256 roomId, address booker, uint256 day, uint256 month, uint256 year) public roomExists(roomId) {
        Room storage room = rooms[roomId];
        require(room.owner == msg.sender, "Not owner");
        BookingIntent storage intent = bookingIntents[roomId][getDateId(day, month, year)][booker];
        require(intent.price != 0, "Intent not found");
        emit BookIntentRejected(
            roomId,
            booker,
            msg.sender,
            intent.price,
            day,
            month,
            year
        );
        _reject(roomId, booker, day, month, year);
        moveLastPossibleBooker(roomId, intent.positionBooker, day, month, year);
    }

    function accept(uint256 roomId, address booker, uint256 day, uint256 month, uint256 year) public roomExists(roomId) {
        Room storage room = rooms[roomId];
        require(room.owner == msg.sender, "Not owner");
        BookingIntent storage intent = bookingIntents[roomId][getDateId(day, month, year)][booker];
        require(intent.price != 0, "Intent not found");
        address[] storage intenters = possibleBookers[roomId][getDateId(day, month, year)];
        uint256 numberIntenters = intenters.length;
        for (uint256 i = 0; i < numberIntenters; i++) {
            if (intenters[i] == booker)
                continue;
            _reject(roomId, intenters[i], day, month, year);
        }
        splitPayment(msg.sender, intent.price);

        bookings[roomId][getDateId(day, month, year)] = booker;
        emit RoomBooked(
            roomId,
            booker,
            msg.sender,
            intent.price,
            day,
            month,
            year
        );
        delete bookingIntents[roomId][getDateId(day, month, year)][booker];
        delete possibleBookers[roomId][getDateId(day, month, year)];
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
        emit PriceChanged(msg.sender, roomId, newPrice);
    }

    function withdraw() public nonReentrant {
        uint256 paymentToWithdraw = accumulatedPayments[msg.sender];
        delete accumulatedPayments[msg.sender];
        msg.sender.transfer(paymentToWithdraw);
        emit PaymentSent(msg.sender, paymentToWithdraw);
    }

    function _reject(uint256 roomId, address booker, uint256 day, uint256 month, uint256 year) internal {
        BookingIntent storage intent = bookingIntents[roomId][getDateId(day, month, year)][booker];
        addPayment(booker, intent.price);
        delete bookingIntents[roomId][getDateId(day, month, year)][booker];
    }

    function moveLastPossibleBooker(uint256 roomId, uint256 newBookerPostion, uint256 day, uint256 month, uint256 year) internal {
        address movedBooker = possibleBookers[roomId][getDateId(day, month, year)][newBookerPostion];
        possibleBookers[roomId][getDateId(day, month, year)].pop();
        bookingIntents[roomId][getDateId(day, month, year)][movedBooker].positionBooker = newBookerPostion;
    }

    function splitPayment(address paymentReceiver, uint256 totalPayment) internal {
        uint256 fees = totalPayment.mul(feeRate).div(FEE_RATE_PRECISION);
        addPayment(feeReceiver, fees);
        addPayment(paymentReceiver, totalPayment.sub(fees));
    }

    function addPayment(address receiver, uint256 payment) internal {
        accumulatedPayments[receiver] = accumulatedPayments[receiver].add(payment);
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