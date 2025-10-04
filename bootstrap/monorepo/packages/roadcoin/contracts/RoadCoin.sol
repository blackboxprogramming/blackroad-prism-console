// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RoadCoin
/// @notice Governance and fee token for the RoadChain ecosystem.
contract RoadCoin is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public immutable cap;

    error CapExceeded();

    constructor(address initialOwner, uint256 initialSupply, uint256 supplyCap)
        ERC20("RoadCoin", "ROAD")
        ERC20Permit("RoadCoin")
        Ownable(initialOwner)
    {
        if (supplyCap == 0 || initialSupply > supplyCap) {
            revert CapExceeded();
        }

        cap = supplyCap;
        _mint(initialOwner, initialSupply);
    }

    /// @notice Mint new RoadCoin to a recipient, respecting the max supply cap.
    /// @dev Only callable by the owner (typically the treasury or governance).
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > cap) {
            revert CapExceeded();
        }
        _mint(to, amount);
    }
}
