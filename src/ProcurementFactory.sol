// contracts/ProcurementFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProcurementContract.sol";

contract ProcurementFactory {
    ProcurementContract[] public contracts;
    mapping(address => ProcurementContract[]) public ownerContracts; // Mapping to track contracts by owner

    function createProcurementContract() public {
        ProcurementContract newContract = new ProcurementContract(msg.sender);
        contracts.push(newContract);
        ownerContracts[msg.sender].push(newContract); // Track the contract for the owner
    }

    function getContracts() public view returns (ProcurementContract[] memory) {
        return contracts;
    }

    function getContractsByOwner(address owner) public view returns (ProcurementContract[] memory) {
        return ownerContracts[owner];
    }

    function getAllContracts() public view returns (ProcurementContract[] memory) {
        return contracts;
    }
}
