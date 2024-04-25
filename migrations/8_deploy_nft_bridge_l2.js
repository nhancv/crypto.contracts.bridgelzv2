/*
truffle migrate -f 8 --to 8 --network baseSepolia
npx truffle run verify ERC721BridgeL2 --verifiers=etherscan --network baseSepolia
*/

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721BridgeL2 = artifacts.require('ERC721BridgeL2');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  if (network === 'baseSepolia') {
    const NFTL2 = '0x8cC59CE4ac2E7d60ed49ec01CF9F1e02fCC1340f';
    const LZ_ENDPOINTV2_BASESEPOLIA = '0x6EDCE65403992e310A62460808c4b910D972f10f';
    await deployProxy(ERC721BridgeL2, [NFTL2, LZ_ENDPOINTV2_BASESEPOLIA], {
      deployer: deployer,
      initializer: 'ERC721BridgeInit',
    });

    const instanceBridgeL2 = await ERC721BridgeL2.deployed();
    console.log(`ERC721BridgeL2:`, instanceBridgeL2.address);
  }
};
