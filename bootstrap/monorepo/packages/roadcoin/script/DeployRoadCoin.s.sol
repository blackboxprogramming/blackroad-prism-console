// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {RoadCoin} from "contracts/RoadCoin.sol";

contract DeployRoadCoin is Script {
    uint256 internal constant CAP = 1_000_000_000 ether;
    uint256 internal constant INITIAL_SUPPLY = 100_000_000 ether;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        RoadCoin token = new RoadCoin(owner, INITIAL_SUPPLY, CAP);
        vm.stopBroadcast();

        console2.log("RoadCoin deployed", address(token));
        console2.log("Owner", owner);
        console2.log("Initial supply", INITIAL_SUPPLY);
    }
}
