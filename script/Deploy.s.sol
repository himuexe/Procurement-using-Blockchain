// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/ProcurementFactory.sol";

contract DeployProcurementFactory is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy the factory contract
        ProcurementFactory factory = new ProcurementFactory();

        vm.stopBroadcast();
    }
}