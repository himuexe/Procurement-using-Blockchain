# Blockchain-Based Procurement System

This project implements a decentralized procurement system on the Ethereum blockchain using Solidity. It enables secure and transparent bidding. The project includes a smart contract deployed using Foundry.

---

## Features

- **Owner Controls:**
  - Set bidding duration.
  - Whitelist or remove bidders.
  - End the bidding process.

- **Bidder Features:**
  - Submit encrypted bids while maintaining privacy.
  - Check if whitelisted for participation.

- **Post-Bidding:**
  - Retrieve and display all submitted bids (accessible only by the owner).
  - List whitelisted bidders.

- **Duration Tracking:**
  - Display time remaining for bidding to end.

---

## Smart Contract Overview

The smart contract, `ProcurementContract.sol`, defines the core functionalities of the procurement system:

### Core Elements

- **Structs:**
  - `Bid` stores the encrypted bid and corresponding bidder address.

- **State Variables:**
  - `owner`: The address of the contract owner.
  - `biddingEndTime`: Timestamp when bidding ends.
  - `ended`: Status of the bidding process.
  - `whitelist`: List of whitelisted addresses.
  - `bids`: Mapping of bidder addresses to their bids.
  - `bidders`: Array of bidder addresses.

### Key Functions

- `setBidDuration(uint duration)`  
  Sets the bidding duration.

- `whitelistBidder(address _bidder)`  
  Adds a bidder to the whitelist.

- `removeWhitelistBidder(address _bidder)`  
  Removes a bidder from the whitelist.

- `submitBid(bytes memory _Bid)`  
  Allows whitelisted bidders to submit encrypted bids.

- `endBidding()`  
  Ends the bidding process.

- `getBids()`  
  Fetches all submitted bids and corresponding addresses (owner-only).

- `getWhitelist()`  
  Retrieves the list of whitelisted addresses.

- `getDurationLeft()`  
  Returns the time left for bidding to end.

---

## Installation and Setup

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your system.
- [Foundry](https://book.getfoundry.sh/) installed for contract deployment.

### Steps


   ```bash
   git clone https://github.com/Anirruth/Procurement-using-Blockchain.git
   cd Procurement-using-Blockchain
   cd project-frontend
   npm install
   npm start
   
