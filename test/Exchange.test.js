import { EVM_REVERT, ETHER_ADDRESS, tokens, ether } from "./helper";

// eslint-disable-next-line no-undef
const Token = artifacts.require("./Token");
// eslint-disable-next-line no-undef
const Exchange = artifacts.require("./Exchange");

require("chai").use(require("chai-as-promised")).should();

// eslint-disable-next-line no-undef
contract("Exchange", ([deployer, feeAccount, user1]) => {
  let exchange;
  let token;
  const feePercent = 10;
  const totalSupply = 1000000;

  beforeEach(async () => {
    // Deploy token transfer
    token = await Token.new(tokens(totalSupply));
    // Deploy exchange contract
    exchange = await Exchange.new(feeAccount, feePercent);
    // Transfer some tokens to user1
    token.transfer(user1, tokens(100), { from: deployer });
  });

  describe("deployment", () => {
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });

    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      result.toNumber().should.equal(feePercent);
    });
  });

  describe("fallback", () => {
    it("reverts when ETHER is sent", async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("depositing Ether", () => {
    let result;
    const amount = ether(1);

    beforeEach(async () => {
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it("tracks the Ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });

    it("emits a Deposit event", async () => {
      const {
        event,
        args: { _token, _user, _amount, _balance },
      } = result.logs[0];
      event.should.equal("Deposit");
      _token.should.equal(ETHER_ADDRESS, "token address is not correct");
      _user.should.equal(user1, "user is not correct");
      _amount
        .toString()
        .should.equal(amount.toString(), "amount is not correct");
      _balance
        .toString()
        .should.equal(amount.toString(), "amount is not correct");
    });
  });

  describe("depositing tokens", () => {
    let result;
    const amount = tokens(10);

    describe("success", () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });

      it("tracks the token deposit", async () => {
        // Check exchange token balance
        let balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());

        // Check tokens on exchange
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it("emits a Deposit event", async () => {
        const {
          event,
          args: { _token, _user, _amount, _balance },
        } = result.logs[0];
        event.should.equal("Deposit");
        _token.should.equal(token.address, "token address is not correct");
        _user.should.equal(user1, "user is not correct");
        _amount
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
        _balance
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
      });
    });

    describe("failure", () => {
      it("rejects ether deposits", async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("fails when no tokens are approved", async () => {
        await exchange
          .depositToken(token.address, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("withdrawing Ether", () => {
    let result;
    const amount = ether(1);

    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: amount });
    });

    describe("success", () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 });
      });

      it("withdraws Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        const {
          event,
          args: { _token, _user, _amount, _balance },
        } = result.logs[0];
        event.should.equal("Withdraw");
        _token.should.equal(ETHER_ADDRESS, "token address is not correct");
        _user.should.equal(user1, "user is not correct");
        _amount
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
        _balance.toString().should.equal("0", "amount is not correct");
      });
    });

    describe("failure", () => {
      it("rejects withdrawal for insufficient balances", async () => {
        result = await exchange
          .withdrawEther(ether(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });
});
