/*
truffle migrate -f 6 --to 6 --network sepolia
npx truffle run verify ERC721BridgeL1 --verifiers=etherscan --network sepolia
*/

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ERC721BridgeL1 = artifacts.require('ERC721BridgeL1');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  if (network === 'sepolia') {
    const NFTL1 = '0x43Ac6EfF5177E9b6c5C901f91d85d26A6d2bdaf9';
    const LZ_ENDPOINTV2_SEPOLIA = '0x6EDCE65403992e310A62460808c4b910D972f10f';
    await deployProxy(ERC721BridgeL1, [NFTL1, LZ_ENDPOINTV2_SEPOLIA], {
      deployer: deployer,
      initializer: 'ERC721BridgeInit',
    });

    const instanceBridgeL1 = await ERC721BridgeL1.deployed();
    console.log(`ERC721BridgeL1:`, instanceBridgeL1.address);
  }
};

const upgrade = async (deployer) => {
  const BRIDGE = '';
  let instanceBridge = await ERC721BridgeL1.at(BRIDGE);
  await upgradeProxy(instanceBridge.address, ERC721BridgeL1, { deployer: deployer });
  instanceBridge = await ERC721BridgeL1.deployed();
  console.log('Upgraded Bridge:', instanceBridge.address);
};
