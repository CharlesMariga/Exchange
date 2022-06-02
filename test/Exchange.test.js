import { EVM_REVERT, ETHER_ADDRESS, tokens, ether } from "./helper";

// eslint-disable-next-line no-undef
const Token = artifacts.require("./Token");
// eslint-disable-next-line no-undef
const Exchange = artifacts.require("./Exchange");

require("chai").use(require("chai-as-promised")).should();

// eslint-disable-next-line no-undef
contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
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

  describe("withdrawing tokens", () => {
    let amount = tokens(10);
    let result;

    describe("success", () => {
      beforeEach(async () => {
        // Deposit some tokens
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, { from: user1 });

        // Withdraw tokens
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });

      it("withdraws token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal("0");
      });

      it("emits a Withdraw event", async () => {
        const {
          event,
          args: { _token, _user, _amount, _balance },
        } = result.logs[0];
        event.should.equal("Withdraw");
        _token.should.equal(token.address, "token address is not correct");
        _user.should.equal(user1, "user is not correct");
        _amount
          .toString()
          .should.equal(amount.toString(), "amount is not correct");
        _balance.toString().should.equal("0", "amount is not correct");
      });
    });

    describe("failure", () => {
      it("rejects Ether withdrawals", async () => {
        exchange
          .withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("fails for insufficient balances", async () => {
        exchange
          .withdrawToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });

    describe("checking balances", () => {
      beforeEach(async () => {
        await exchange.depositEther({ from: user1, value: ether(1) });
      });

      it("returns user balance", async () => {
        const balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
        balance.toString().should.equal(ether(1).toString());
      });
    });

    describe("making orders", () => {
      let result;

      beforeEach(async () => {
        result = await exchange.makeOrder(
          token.address,
          tokens(1),
          ETHER_ADDRESS,
          ether(1),
          { from: user1 }
        );
      });

      it("tracks the newly created order", async () => {
        const orderCount = await exchange.orderCount();
        orderCount.toString().should.equal("1");
        const {
          id,
          user,
          tokenGet,
          amountGet,
          tokenGive,
          amountGive,
          timestamp,
        } = await exchange.orders("1");
        id.toString().should.equal("1", "id is not correct");
        user.should.equal(user1, "user is not correct");
        tokenGet.should.equal(token.address, "tokenGet is not correct");
        amountGet
          .toString()
          .should.equal(tokens(1).toString(), "amountGet is not correct");
        tokenGive.should.equal(ETHER_ADDRESS, "tokenGive is not correct");
        amountGive
          .toString()
          .should.equal(ether(1).toString(), "amountGive is not correct");
        timestamp
          .toString()
          .length.should.be.at.least(1, "timestamp is not perfect");
      });

      it("emits and 'Order' event", async () => {
        const {
          event,
          args: {
            _id,
            _user,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _timestamp,
          },
        } = result.logs[0];
        event.should.equal("Order", "event name is not correct");
        _id.toString().should.equal("1", "id is not correct");
        _user.toString().should.equal(user1, "user is not correct");
        _tokenGet
          .toString()
          .should.equal(token.address, "tokeGet is not correct");
        _amountGet
          .toString()
          .should.equal(tokens(1).toString(), "amountGet is not correct");
        _tokenGive
          .toString()
          .should.equal(ETHER_ADDRESS, "tokenGive is not correct");
        _amountGive
          .toString()
          .should.equal(ether(1).toString(), "amountGive is not correct");
        _timestamp
          .toString()
          .length.should.be.at.least(1, "timestamp is not perfect");
      });
    });

    describe("order actions", () => {
      beforeEach(async () => {
        // user1 deposits ether
        await exchange.depositEther({ from: user1, value: ether(1) });
        // user1 makes an order to buy tokens with Ether
        await exchange.makeOrder(
          token.address,
          tokens(1),
          ETHER_ADDRESS,
          ether(1),
          { from: user1 }
        );
      });

      describe("cancelling orders", () => {
        let result;

        describe("success", () => {
          beforeEach(async () => {
            result = await exchange.cancelOrder("1", { from: user1 });
          });

          it("updates cancelled orders", async () => {
            const orderCancelled = await exchange.orderCancelled(1);
            orderCancelled.should.equal(true);
          });

          it("emits and 'Cancel' event", async () => {
            const {
              event,
              args: {
                _id,
                _user,
                _tokenGet,
                _amountGet,
                _tokenGive,
                _amountGive,
                _timestamp,
              },
            } = result.logs[0];
            event.should.equal("Cancel", "event name is not correct");
            _id.toString().should.equal("1", "id is not correct");
            _user.toString().should.equal(user1, "user is not correct");
            _tokenGet
              .toString()
              .should.equal(token.address, "tokeGet is not correct");
            _amountGet
              .toString()
              .should.equal(tokens(1).toString(), "amountGet is not correct");
            _tokenGive
              .toString()
              .should.equal(ETHER_ADDRESS, "tokenGive is not correct");
            _amountGive
              .toString()
              .should.equal(ether(1).toString(), "amountGive is not correct");
            _timestamp
              .toString()
              .length.should.be.at.least(1, "timestamp is not perfect");
          });
        });

        describe("failure", () => {
          it("rejects invalid order ids", async () => {
            const invalidOrderId = 99999;
            await exchange
              .cancelOrder(invalidOrderId, { from: user1 })
              .should.be.rejectedWith(EVM_REVERT);
          });

          it("rejects unauthorized cancelations", async () => {
            await exchange
              .cancelOrder("1", { from: user2 })
              .should.be.rejectedWith(EVM_REVERT);
          });
        });
      });
    });
  });
});
