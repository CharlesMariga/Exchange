export const EVM_REVERT =
  "Returned error: VM Exception while processing transaction: revert";

export const ETHER_ADDRESS = "0x".padEnd(42, "0");

export const ether = (n) => {
  // eslint-disable-next-line no-undef
  return new web3.utils.BN(web3.utils.toWei(n.toString(), "ether"));
};

export const tokens = (n) => ether(n);
