// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProcurementContract {
    struct Bid {
        bytes Bid;
        bytes BidderAddress;
    }

    address public owner;
    uint public biddingEndTime;
    bool public ended;
    
    

    address[] public whitelist;
    mapping(address => bool) public isWhitelisted; 
    mapping(address => Bid) public bids;
    address[] public bidders;

    event BidSubmitted(address indexed bidder);
    event BiddingEnded();
    event BidderWhitelisted(address indexed bidder);
    event BidderRemovedFromWhitelist(address indexed bidder);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyWhitelisted() {
        require(isWhitelisted[msg.sender], "Not whitelisted");
        _;
    }

    modifier beforeEnd() {
        require(block.timestamp < biddingEndTime, "Bidding has ended");
        _;
    }

    modifier afterEnd() {
        require(block.timestamp >= biddingEndTime, "Bidding is still active");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
        ended = false;
    }

    function setBidDuration(uint duration) public onlyOwner {
        biddingEndTime = block.timestamp + duration;
    }

    
    function whitelistBidder(address _bidder) public onlyOwner {
        require(!isWhitelisted[_bidder], "Already whitelisted");
        whitelist.push(_bidder);
        isWhitelisted[_bidder] = true;
        emit BidderWhitelisted(_bidder);
    }

    
    function removeWhitelistBidder(address _bidder) public onlyOwner {
        require(isWhitelisted[_bidder], "Not whitelisted");
        isWhitelisted[_bidder] = false;
        
        
        for (uint i = 0; i < whitelist.length; i++) {
            if (whitelist[i] == _bidder) {
                whitelist[i] = whitelist[whitelist.length - 1]; 
                whitelist.pop();
                break;
            }
        }
        
        emit BidderRemovedFromWhitelist(_bidder);
    }

    
    function submitBid(bytes memory _Bid) public onlyWhitelisted beforeEnd {
        require(bids[msg.sender].Bid.length == 0, "Bid already submitted");
    
        bids[msg.sender] = Bid({
            Bid: _Bid,
            BidderAddress: abi.encodePacked(msg.sender)
        });
    
        bidders.push(msg.sender);
        emit BidSubmitted(msg.sender);
    }

    
    function endBidding() public onlyOwner afterEnd {
        require(!ended, "Bidding already ended");
        ended = true;
        emit BiddingEnded();
    }

    
    function getBids() public view onlyOwner returns (bytes[] memory, bytes[] memory) {
        require(ended, "Bidding has not ended yet");

        bytes[] memory Bids = new bytes[](bidders.length);
        bytes[] memory Addresses = new bytes[](bidders.length);
        
        for (uint i = 0; i < bidders.length; i++) {
            Bids[i] = bids[bidders[i]].Bid;
            Addresses[i] = bids[bidders[i]].BidderAddress;
        }

        return (Bids, Addresses);
    }

    
    function getWhitelist() public view returns (address[] memory) {
        return whitelist;
    }

    function getDurationLeft() public view returns (uint) {
        if (ended || block.timestamp >= biddingEndTime) {
            return 0;
        }
        return biddingEndTime > block.timestamp ? biddingEndTime - block.timestamp : 0;
    }

   
    function checkIfWhitelisted(address _bidder) public view returns (bool) {
        return isWhitelisted[_bidder];
    }
}

