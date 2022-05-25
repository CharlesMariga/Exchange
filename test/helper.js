export const EVM_REVERT =
  "Returned error: VM Exception while processing transaction: revert";

export const tokens = (n) => {
  // eslint-disable-next-line no-undef
  return new web3.utils.BN(web3.utils.toWei(n.toString(), "ether"));
};
