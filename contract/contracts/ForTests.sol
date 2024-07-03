// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * For the sole purpose of testing.
 */
contract USDC is ERC20 {
  constructor() ERC20('USDC', 'USDC') {
    _mint(msg.sender, 1000000000000000);
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }
}
