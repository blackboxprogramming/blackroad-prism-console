// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RoadCoin} from "contracts/RoadCoin.sol";

contract RoadCoinTest is Test {
    uint256 internal constant CAP = 1_000_000_000 ether;
    uint256 internal constant INITIAL_SUPPLY = 100_000_000 ether;

    RoadCoin internal road;

    function setUp() public {
        road = new RoadCoin(address(this), INITIAL_SUPPLY, CAP);
    }

    function testInitialState() public {
        assertEq(road.name(), "RoadCoin");
        assertEq(road.symbol(), "ROAD");
        assertEq(road.cap(), CAP);
        assertEq(road.totalSupply(), INITIAL_SUPPLY);
        assertEq(road.balanceOf(address(this)), INITIAL_SUPPLY);
    }

    function testMintWithinCap() public {
        road.mint(address(0xBEEF), 1 ether);
        assertEq(road.balanceOf(address(0xBEEF)), 1 ether);
    }

    function testCannotMintAboveCap() public {
        uint256 amount = CAP - INITIAL_SUPPLY + 1;
        vm.expectRevert(RoadCoin.CapExceeded.selector);
        road.mint(address(this), amount);
    }

    function testConstructorRevertsOnZeroOwner() public {
        vm.expectRevert(Ownable.OwnableInvalidOwner.selector);
        new RoadCoin(address(0), INITIAL_SUPPLY, CAP);
    }

    function testConstructorRevertsWhenInitialSupplyGreaterThanCap() public {
        vm.expectRevert(RoadCoin.CapExceeded.selector);
        new RoadCoin(address(this), CAP + 1, CAP);
    }
}
