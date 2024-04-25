const ethers = require('ethers');
const fromExponential = require('from-exponential');
const { prettyNum, ROUNDING_MODE } = require('pretty-num');

// delay
const sleep = (ms) => {
  console.log('sleep:', ms);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 1e18 => '1'
const fromWei = (amount, decimals = 18) => {
  return ethers.utils.formatUnits(
    prettyNum(fromExponential(amount || 0), { precision: decimals, roundingMode: ROUNDING_MODE.DOWN }),
    decimals,
  );
};

// 1 => '1000000000000000000'
const toWei = (amount, decimals = 18) => {
  return ethers.utils
    .parseUnits(
      prettyNum(fromExponential(amount || 0), { precision: decimals, roundingMode: ROUNDING_MODE.DOWN }),
      decimals,
    )
    .toString();
};

/**
 * Extract gas fee from truffle receipt
 * const fFunction = await contract.fFunction();
 * const fFunctionFee = await getTxFee(fFunction.receipt, web3);
 * console.log(`fee@fFunction: ${fFunctionFee.fee} ETH (${fromWei(fFunctionFee.gasPrice, 9)} Gwei, ${fFunctionFee.gasUsed} used)`);
 * @param receipt - truffle tx
 * @param web3_ - can be skip in unit test script
 * @returns {Promise<{gasUsed: *, fee: number, gasPrice: number}>}
 */
const getTxFee = async (receipt, web3_ = undefined) => {
  const gasPrice = await (web3_ || web3).eth.getGasPrice();
  const gasUsed = receipt.gasUsed;
  return { gasUsed, gasPrice, fee: gasUsed * fromWei(gasPrice) };
};

const addressToBytes32 = (address) => {
  return ethers.utils.hexZeroPad(address, 32);
};

module.exports = {
  sleep,
  toWei,
  fromWei,
  getTxFee,
  addressToBytes32,
};
