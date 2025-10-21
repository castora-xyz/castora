// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ERC20Permit} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';

contract cUSD is Ownable, ERC20, ERC20Permit {
  constructor() Ownable(msg.sender) ERC20('Castora USD', 'cUSD') ERC20Permit('cUSD') {
    _mint(msg.sender, 1e7 * 10 ** decimals());
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
