/*
truffle migrate -f 9 --to 9 --network sepolia
truffle migrate -f 9 --to 9 --network baseSepolia
*/

const { addressToBytes32, toWei } = require('../scripts_truffle/utils');

const ERC721 = artifacts.require('MockERC721Upgradeable');
const ERC721Bridge = artifacts.require('ERC721Bridge');

const MINTER_ROLE = web3.utils.keccak256('MINTER_ROLE');
const BURNER_ROLE = web3.utils.keccak256('BURNER_ROLE');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  let currentToken, currentOApp, peerOApp, peerEId;
  // https://docs.layerzero.network/v2/developers/evm/technical-reference/endpoints#sepolia-testnet
  if (network === 'sepolia') {
    currentToken = '0x43Ac6EfF5177E9b6c5C901f91d85d26A6d2bdaf9';
    currentOApp = '0x73ECfE614Ec61e388552b790A830263E823fF72F';
    peerOApp = '0xe747d62E687955c4f7a018C4b0D768284607De18';
    peerEId = 40245;
  } else if (network === 'baseSepolia') {
    currentToken = '0x8cC59CE4ac2E7d60ed49ec01CF9F1e02fCC1340f';
    currentOApp = '0xe747d62E687955c4f7a018C4b0D768284607De18';
    peerOApp = '0x73ECfE614Ec61e388552b790A830263E823fF72F';
    peerEId = 40161;
  }

  // await config(owner, currentToken, currentOApp, peerOApp, peerEId, network);
  await test(owner, currentToken, currentOApp, peerOApp, peerEId);
};

const config = async (owner, currentToken, currentOApp, peerOApp, peerEId, network) => {
  const instanceOApp = await ERC721Bridge.at(currentOApp);
  const { tx } = await instanceOApp.setPeer(peerEId, addressToBytes32(peerOApp));
  console.log('setPeer:', tx);

  if (network === 'baseSepolia') {
    const instanceNFT = await ERC721.at(currentToken);
    const grantRoleMint = await instanceNFT.grantRole(MINTER_ROLE, instanceOApp.address);
    console.log('grantRoleMint:', grantRoleMint.tx);
    const grantRoleBurn = await instanceNFT.grantRole(BURNER_ROLE, instanceOApp.address);
    console.log('grantRoleBurn:', grantRoleBurn.tx);
  }
};

const test = async (owner, currentToken, currentOApp, peerOApp, peerEId) => {
  const instanceOApp = await ERC721Bridge.at(currentOApp);

  const _defaultOptions = '0x000301001101000000000000000000000000000186a0'; // OAppOptionsType3 with 100k
  const { nativeFee, lzTokenFee } = await instanceOApp.quoteSend(peerEId, owner, [0], _defaultOptions);
  console.log('quoteSend', { nativeFee, lzTokenFee });

  const instanceNFT = await ERC721.at(currentToken);
  const setApprovalForAll = await instanceNFT.setApprovalForAll(instanceOApp.address, true);
  console.log(`setApprovalForAll`, setApprovalForAll.tx);

  const { tx } = await instanceOApp.send(peerEId, owner, [0], _defaultOptions, { value: nativeFee });
  console.log(`Send token 0 to ${peerEId}:`, tx);
};
