/*
truffle migrate -f 1 --to 1 --network sepolia
npx truffle run verify MockERC20 --verifiers=etherscan --network sepolia
 */

const MockERC20 = artifacts.require('MockERC20');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  if (network === 'sepolia') {
    await deployer.deploy(MockERC20, 'Mock_L1', 'MOCK', 1e6);
    const instanceToken = await MockERC20.deployed();
    console.log('TokenL1:', instanceToken.address);
  }
};
