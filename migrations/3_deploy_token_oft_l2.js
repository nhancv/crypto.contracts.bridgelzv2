/*
truffle migrate -f 3 --to 3 --network baseSepolia
npx truffle run verify MockOFT --verifiers=etherscan --network baseSepolia
 */

const MockOFT = artifacts.require('MockOFT');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  // https://docs.layerzero.network/v2/developers/evm/technical-reference/endpoints#sepolia-testnet
  if (network === 'baseSepolia') {
    const LZ_ENDPOINTV2_BSCTESTNET = '0x6EDCE65403992e310A62460808c4b910D972f10f';
    await deployer.deploy(MockOFT, 'Mock_L2', 'MOCK', LZ_ENDPOINTV2_BSCTESTNET);
    const instanceTokenOFT = await MockOFT.deployed();
    console.log('MockOFTL2:', instanceTokenOFT.address);
  }
};
