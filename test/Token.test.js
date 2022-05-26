import { EVM_REVERT, tokens } from "./helper";

// eslint-disable-next-line no-undef
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

// eslint-disable-next-line no-undef
contract("Token", ([deployer, receiver, exchange]) => {
  const name = "DappToken";
  const symbol = "DAPP";
  const decimals = 18;
  const totalSupply = 1000000;
  let token;

  beforeEach(async () => {
    token = await Token.new(tokens(totalSupply));
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      const result = await token.name();
      result.should.equal(name);
    });

    it("tracks the symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });

    it("tracks the decimals", async () => {
      const result = await token.decimals();
      result.toNumber().should.equal(decimals);
    });

    it("tracks the total supply", async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(tokens(totalSupply).toString());
    });

    it("assigns the total supply to the deployer", async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(tokens(totalSupply).toString());
    });
  });

  describe("sending tokens", () => {
    let amount;
    let result;

    describe("success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        result = await token.transfer(receiver, amount, {
          from: deployer,
        });
      });

      it("transfers token balances", async () => {
        let balanceOfDeployer = await token.balanceOf(deployer);
        let balanceOfReceiver = await token.balanceOf(receiver);
        balanceOfDeployer
          .toString()
          .should.equal(tokens(totalSupply - 100).toString());
        balanceOfReceiver.toString().should.equal(tokens(100).toString());
      });

      it("emits a transfer event", async () => {
        const {
          event,
          args: { _from, _to, _value },
        } = result.logs[0];
        event.should.equal("Transfer");
        _from
          .toString()
          .should.equal(deployer.toString(), "from is not correct");
        _to.toString().should.equal(receiver.toString(), "to is not correct");
        _value
          .toString()
          .should.equal(amount.toString(), "value is not correct");
      });
    });

    describe("failure", () => {
      it("rejects insufficient balances", async () => {
        let invalideAmount = tokens(100000000);
        await token
          .transfer(receiver, invalideAmount, { from: deployer })
          .should.be.rejectedWith(EVM_REVERT);

        // Attempts to transfer tokens when you have none
        invalideAmount = tokens(10);
        await token
          .transfer(deployer, invalideAmount, { from: receiver })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("rejects invalid recipients", async () => {
        await token.transfer(0x0, amount, { from: deployer }).should.be
          .rejected;
      });
    });
  });

  describe("approving tokens", () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {
      it("allocates an allowance for delegated token spending", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.toString().should.equal(amount.toString());
      });
    });

    describe("failure", () => {});
  });
});
