/*
truffle migrate -f 5 --to 5 --network sepolia
npx truffle run verify MockERC721Upgradeable --verifiers=etherscan --network sepolia
*/

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const MockERC721Upgradeable = artifacts.require('MockERC721Upgradeable');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  if (network === 'sepolia') {
    await deployProxy(MockERC721Upgradeable, ['NFTL1', 'NFT'], {
      deployer: deployer,
      initializer: 'MockERC721UpgradeableInit',
    });

    const instanceNFT = await MockERC721Upgradeable.deployed();
    console.log(`NFTL1:`, instanceNFT.address);

    await instanceNFT.fMint(owner, 0);
  }
};
