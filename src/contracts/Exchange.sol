// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "./Token.sol";

contract Exchange {
  using SafeMath for uint;

  // Vairables
  address public feeAccount; // The account that receives exchange fees
  uint256 public feePercent; // Fee percentage
  // Assumes that ether has an address of 0
  // Allows to store Ether in tokens mapping with blank address
  address constant ETHER = address(0);
  mapping(address => mapping(address => uint256)) public tokens; // tokenAddress->user->tokens

  // Events 
  event Deposit(address indexed _token, address indexed _user, uint256 _amount, uint256 _balance);

  constructor (address _feeAccount, uint256 _feePercent) {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // Fallback: reverts if Ether is sent to this smart contract by mistake
  function() external {
    revert();
  }

  function depositEther() public payable {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint _amount) public {
    require(_token != ETHER);
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
} 