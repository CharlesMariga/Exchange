// eslint-disable-next-line no-undef
const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

// eslint-disable-next-line no-undef
contract("Token", (accounts) => {
  const name = "DappToken";
  const symbol = "DAPP";
  const decimals = 18;
  const totalSupply = (1000000 * Math.pow(10, 18)).toLocaleString("fullwide", {
    useGrouping: false,
  });
  let token;

  beforeEach(async () => {
    token = await Token.new(totalSupply);
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
      result
        .toString()
        .should.equal(
          totalSupply.toLocaleString("fullwide", { useGrouping: false })
        );
    });
  });
});
