// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ERC20Permit} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';

/// Test token for the Castora ecosystem with 6 decimal precision.
/// Provides mintable USD-equivalent token for testing predictions and staking.
contract cUSD is Ownable, ERC20, ERC20Permit {
  /// Initializes token with name, symbol, and mints initial supply to deployer
  constructor() Ownable(msg.sender) ERC20('Castora USD', 'cUSD') ERC20Permit('cUSD') {
    _mint(msg.sender, 1e7 * 10 ** decimals());
  }

  /// Returns 6 decimal places for USD-like precision
  /// @return Number of decimal places (6)
  function decimals() public pure override returns (uint8) {
    return 6;
  }

  /// Mints new tokens to specified address (owner only)
  /// @param to Address to receive newly minted tokens
  /// @param amount Number of tokens to mint
  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
