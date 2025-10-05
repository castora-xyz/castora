// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

interface IPoolCompletionHandler {
  function processPoolCompletion(uint256 poolId) external;
}
