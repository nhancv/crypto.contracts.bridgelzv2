/*
truffle migrate -f 2 --to 2 --network sepolia
npx truffle run verify MockOFTAdapter --verifiers=etherscan --network sepolia
 */

const MockOFTAdapter = artifacts.require('MockOFTAdapter');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  // https://docs.layerzero.network/v2/developers/evm/technical-reference/endpoints#sepolia-testnet
  if (network === 'sepolia') {
    const TokenL1 = '0x17D3e3819830672DC29cb7192b6641c297b0B838';
    const LZ_ENDPOINTV2_SEPOLIA = '0x6EDCE65403992e310A62460808c4b910D972f10f';
    await deployer.deploy(MockOFTAdapter, TokenL1, LZ_ENDPOINTV2_SEPOLIA);
    const instanceTokenAdapter = await MockOFTAdapter.deployed();
    console.log('MockOFTAdapterL1:', instanceTokenAdapter.address);
  }
};
