// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

contract Token {
  string public name = "DappToken";
  string public symbol = "DAPP";
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;

  constructor(uint256 _totalSupply) {
    totalSupply = _totalSupply;
    balanceOf[msg.sender] = _totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(balanceOf[msg.sender] >= _value);
    balanceOf[msg.sender] -= _value;
    balanceOf[_to] += _value;
    return true;
  }
}