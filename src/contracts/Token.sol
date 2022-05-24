// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

contract Token {
  string public name = "DappToken";
  string public symbol = "DAPP";
  uint256 public decimals = 18;
  uint256 public totalSupply;

  constructor(uint256 _totalSupply) {
    totalSupply = _totalSupply;
  }
}