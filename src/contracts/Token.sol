// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

contract Token {
  using SafeMath for uint;

  string public name = "DappToken";
  string public symbol = "DAPP";
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  event Transfer(address indexed _from, address indexed _to, uint256 _value);
  event Approval(address indexed _owner, address indexed _spender, uint256 _value);

  constructor(uint256 _totalSupply) {
    totalSupply = _totalSupply;
    balanceOf[msg.sender] = _totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(_to != address(0));
    require(balanceOf[msg.sender] >= _value);
    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  function approve(address _spender, uint256 _value) public returns (bool success) {
    require(_spender != address(0));
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) { 
    return true;
  }
}