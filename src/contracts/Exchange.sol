// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "./Token.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

// Deposit & withdraw Funds
// Manage Orders - Make or Cancel
// Handel Trades - Charge fees

// TODO:
// [X] Set fee acount
// [X] Deposit Ether
// [ ] Withdraw Ether
// [X] Deposit Tokens
// [ ] Withdraw Tokens
// [ ] Check balances
// [ ] Make order
// [ ] Cancel order
// [ ] Fill order
// [ ] Charge Fees

contract Exchange {
    using SafeMath for uint256;

    address public feeAccount; // The account the receives exchange fees
    uint256 public feePercent;
    address constant ETHER = address(0);
    mapping(address => mapping(address => uint256)) public tokens; // tokenAddress -> userAddress -> balance

    event Deposit(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
}
