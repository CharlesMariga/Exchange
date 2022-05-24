// eslint-disable-next-line no-undef
const Token = artifacts.require("Token");

const totalSupply = (1000000 * Math.pow(10, 18)).toLocaleString("fullwide", {
  useGrouping: false,
});

module.exports = async function (deployer) {
  await deployer.deploy(Token, totalSupply);
};
