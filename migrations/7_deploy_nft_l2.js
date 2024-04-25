/*
truffle migrate -f 7 --to 7 --network baseSepolia
npx truffle run verify MockERC721Upgradeable --verifiers=etherscan --network baseSepolia
*/

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const MockERC721Upgradeable = artifacts.require('MockERC721Upgradeable');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  if (network === 'baseSepolia') {
    await deployProxy(MockERC721Upgradeable, ['NFTL2', 'NFT'], {
      deployer: deployer,
      initializer: 'MockERC721UpgradeableInit',
    });

    const instanceNFT = await MockERC721Upgradeable.deployed();
    console.log(`NFTL2:`, instanceNFT.address);
  }
};
