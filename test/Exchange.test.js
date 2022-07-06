import { EVM_REVERT, ETHER_ADDRESS, tokens, ether } from "./helper";

// eslint-disable-next-line no-undef
const Exchange = artifacts.require("./Exchange");
// eslint-disable-next-line no-undef
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

// eslint-disable-next-line no-undef
contract("Exchange", ([deployer, feeAccount, user1]) => {
  let exchange;
  let token;
  const totalSupply = 1000000;
  const feePercent = 10;

  beforeEach(async () => {
    // Deploy token contract
    token = await Token.new(tokens(totalSupply));
    // Transfer some tokens to user1
    await token.transfer(user1, tokens(100), { from: deployer });
    // Deploy the exchange contract
    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("deployment", () => {
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });

    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      result.should.equal(result);
    });
  });

  // Reverts when ether is sent directly to the exchange contract
  describe("fallback", () => {
    it("reverts when Ether is sent", async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("depositing ether", () => {
    let result;
    let amount = ether(1);

    beforeEach(async () => {
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it("tracks ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance
        .toString()
        .should.equal(amount.toString(), "Ether balance is not correct");
    });

    it("emits a Deposit event", async () => {
      const {
        event,
        args: { _token, _user, _amount, _balance },
      } = result.logs[0];
      event.should.equal("Deposit");
      _token
        .toString()
        .should.equal(ETHER_ADDRESS.toString(), "token address is not correct");
      _user.should.equal(user1, "user address is not correct");
      _amount
        .toString()
        .should.equal(amount.toString(), "amount is not correct");
      _balance
        .toString()
        .should.equal(amount.toString(), "balance is not correct");
    });
  });

  describe("withdrawing ether", () => {
    let result;
    let amount = ether(1);

    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: amount });
    });

    describe("success", () => {
      it("withdraws Ether funds", async () => {
        result = await exchange.withdrawEther(amount, { from: user1 });
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        const {
          event,
          args: { _token, _user, _amount, _balance },
        } = result.logs[0];
        event.should.equal("Withdraw");
        _token
          .toString()
          .should.equal(
            ETHER_ADDRESS.toString(),
            "token address is not correct"
          );
        _user.should.equal(user1, "user address is not correct");
        _amount
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
        _balance.toString().should.equal("0", "balance is not correct");
      });
    });

    describe("failure", () => {
      it("rejects withdrawal for insufficient balances", async () => {
        await exchange
          .withdrawEther(ether(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("depositing tokens", () => {
    let amount = tokens(10);
    let result;

    describe("success", () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });

      it("tracks the token deposit", async () => {
        // Check token balance for the exchange
        let balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        // Check the token balance on the exchange
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it("emits a Deposit event", async () => {
        const {
          event,
          args: { _token, _user, _amount, _balance },
        } = result.logs[0];
        event.should.equal("Deposit");
        _token
          .toString()
          .should.equal(
            token.address.toString(),
            "token address is not correct"
          );
        _user.should.equal(user1, "user address is not correct");
        _amount
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
        _balance
          .toString()
          .should.equal(amount.toString(), "balance is not correct");
      });
    });

    describe("failure", () => {
      it("rejects Ether deposits", async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("fails when not tokens are approved", async () => {
        await exchange
          .depositToken(token.address, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("withdrawing tokens", () => {
    let result;
    let amount = tokens(10);

    beforeEach(async () => {
      await token.approve(exchange.address, amount, { from: user1 });
      await exchange.depositToken(token.address, amount, { from: user1 });
      result = await exchange.withdrawToken(token.address, amount, {
        from: user1,
      });
    });

    describe("success", () => {
      it("withdraws Token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        const {
          event,
          args: { _token, _user, _amount, _balance },
        } = result.logs[0];
        event.should.equal("Withdraw");
        _token
          .toString()
          .should.equal(
            token.address.toString(),
            "token address is not correct"
          );
        _user.should.equal(user1, "user address is not correct");
        _amount
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
        _balance.toString().should.equal("0", "balance is not correct");
      });
    });

    describe("failure", () => {
      it("rejects Ether withdrawal", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects withdrawal for insufficient balances", async () => {
        await exchange
          .withdrawToken(token.address, tokens(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });

    describe("checking balances", () => {
      beforeEach(async () => [
        await exchange.depositEther({ from: user1, value: ether(1) }),
      ]);
      it("returns user balance", async () => {
        const balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
        balance.toString().should.equal(ether(1).toString());
      });
    });
  });
});
