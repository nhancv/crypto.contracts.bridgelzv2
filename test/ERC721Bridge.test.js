// truffle test ./test/ERC721Bridge.test.js --network test

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { addressToBytes32 } = require('../scripts_truffle/utils.js');

// Consider uncomment when you get Error: CONNECTION ERROR: Couldn't connect to node
// require('@openzeppelin/test-helpers/configure')({
//   provider: 'http://127.0.0.1:8545
// });

const MockERC721Upgradeable = artifacts.require('MockERC721Upgradeable');
const ERC721BridgeL1 = artifacts.require('ERC721BridgeL1');
const ERC721BridgeL2 = artifacts.require('ERC721BridgeL2');
const EndpointV2Mock = artifacts.require('EndpointV2Mock');

const MINTER_ROLE = web3.utils.keccak256('MINTER_ROLE');
const BURNER_ROLE = web3.utils.keccak256('BURNER_ROLE');

const DEFAULT_OPTIONS = '0x00030100110100000000000000000000000000030d40'; // 200k gas

contract('ERC721Bridge.test', ([owner, bob, eric]) => {
  // Constant representing a mock Endpoint ID for testing purposes
  const eidA = 1;
  const eidB = 2;
  let mockEndpointA, mockEndpointB;
  let nftL1, oAppL1, nftL2, oAppL2;

  before(async function () {
    // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
    mockEndpointA = await EndpointV2Mock.new(eidA);
    mockEndpointB = await EndpointV2Mock.new(eidB);

    // Deploying OApp
    nftL1 = await deployProxy(MockERC721Upgradeable, ['NFT_L1', 'nftl1'], { initializer: 'MockERC721UpgradeableInit' });
    oAppL1 = await deployProxy(ERC721BridgeL1, [nftL1.address, mockEndpointA.address], {
      initializer: 'ERC721BridgeInit',
    });
    nftL2 = await deployProxy(MockERC721Upgradeable, ['NFT_L2', 'nftl2'], { initializer: 'MockERC721UpgradeableInit' });
    oAppL2 = await deployProxy(ERC721BridgeL2, [nftL2.address, mockEndpointB.address], {
      initializer: 'ERC721BridgeInit',
    });

    // Setting destination endpoints in the LZEndpoint mock
    await mockEndpointA.setDestLzEndpoint(oAppL2.address, mockEndpointB.address);
    await mockEndpointB.setDestLzEndpoint(oAppL1.address, mockEndpointA.address);

    // Setting each OApp instance as a peer of the other in the mock LZEndpoint
    await oAppL1.setPeer(eidB, addressToBytes32(oAppL2.address));
    await oAppL2.setPeer(eidA, addressToBytes32(oAppL1.address));

    // Grant role to Bridge
    await nftL1.grantRole(MINTER_ROLE, oAppL1.address);
    await nftL1.grantRole(BURNER_ROLE, oAppL1.address);
    await nftL2.grantRole(MINTER_ROLE, oAppL2.address);
    await nftL2.grantRole(BURNER_ROLE, oAppL2.address);

    // Mint some NFTs on L1
    for (let i = 0; i < 5; i++) {
      await nftL1.fMint(owner, i);
    }

    // Approve
    await nftL1.setApprovalForAll(oAppL1.address, true);
  });

  it('owner send a single nft from L1 to current owner', async () => {
    await truffleAssert.reverts(nftL2.ownerOf(0), 'ERC721: owner query for nonexistent token');

    const { nativeFee, lzTokenFee } = await oAppL1.quoteSend(eidB, owner, [0], DEFAULT_OPTIONS);
    console.log('quoteSend', { nativeFee, lzTokenFee });
    await oAppL1.send(eidB, owner, [0], DEFAULT_OPTIONS, { from: owner, value: nativeFee });

    assert.equal(await nftL1.ownerOf(0), oAppL1.address);
    assert.equal(await nftL2.ownerOf(0), owner);
    assert.equal(await nftL2.balanceOf(owner), 1);
  });

  it('owner send multi nfts from L1 to bob', async () => {
    for (let i = 1; i < 5; i++) {
      await truffleAssert.reverts(nftL2.ownerOf(i), 'ERC721: owner query for nonexistent token');
    }
    assert.equal(await nftL2.balanceOf(bob), 0);

    const tokenIds = [1, 2, 3, 4];
    const { nativeFee } = await oAppL1.quoteSend(eidB, bob, tokenIds, DEFAULT_OPTIONS);
    await oAppL1.send(eidB, bob, tokenIds, DEFAULT_OPTIONS, { from: owner, value: nativeFee });

    for (let i = 1; i < 5; i++) {
      assert.equal(await nftL2.ownerOf(i), bob);
    }
    assert.equal(await nftL2.balanceOf(bob), 4);
  });

  it('owner send a single nft from L2 to current owner', async () => {
    assert.equal(await nftL1.ownerOf(0), oAppL1.address);

    const { nativeFee, lzTokenFee } = await oAppL2.quoteSend(eidA, owner, [0], DEFAULT_OPTIONS);
    console.log('quoteSend', { nativeFee, lzTokenFee });
    await truffleAssert.reverts(
      oAppL2.send(eidA, owner, [1], DEFAULT_OPTIONS, { from: owner, value: nativeFee }),
      'ERC721: transfer of token that is not own',
    );
    await truffleAssert.reverts(
      oAppL2.send(eidA, owner, [0], DEFAULT_OPTIONS, { from: bob, value: nativeFee }),
      'ERC721: transfer of token that is not own',
    );
    await oAppL2.send(eidA, owner, [0], DEFAULT_OPTIONS, { from: owner, value: nativeFee });

    assert.equal(await nftL1.ownerOf(0), owner);
    assert.equal(await nftL1.balanceOf(owner), 1);
  });

  it('bob send multi nfts from L2 to owner', async () => {
    for (let i = 1; i < 5; i++) {
      assert.equal(await nftL1.ownerOf(i), oAppL1.address);
    }
    assert.equal(await nftL2.balanceOf(bob), 4);

    const tokenIds = [1, 2, 3, 4];
    const { nativeFee } = await oAppL2.quoteSend(eidA, owner, tokenIds, DEFAULT_OPTIONS);
    await oAppL2.send(eidA, owner, tokenIds, DEFAULT_OPTIONS, { from: bob, value: nativeFee });

    for (let i = 1; i < 5; i++) {
      assert.equal(await nftL1.ownerOf(i), owner);
    }
    assert.equal(await nftL2.balanceOf(bob), 0);
    assert.equal(await nftL1.balanceOf(bob), 0);
    assert.equal(await nftL1.balanceOf(owner), 5);
  });
});

/**
 *   Contract: ERC721Bridge.test
 * quoteSend { nativeFee: '3203608000000000', lzTokenFee: '0' }
 *     ✔ owner send a single nft from L1 to current owner (185ms)
 *     ✔ owner send multi nfts from L1 to bob (174ms)
 * quoteSend { nativeFee: '3203608000000000', lzTokenFee: '0' }
 *     ✔ owner send a single nft from L2 to current owner (103ms)
 *     ✔ bob send multi nfts from L2 to owner (176ms)
 *
 *
 *   4 passing (2s)
 */
