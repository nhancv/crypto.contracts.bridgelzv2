/*
truffle migrate -f 4 --to 4 --network sepolia
truffle migrate -f 4 --to 4 --network baseSepolia
*/

const { addressToBytes32, toWei } = require('../scripts_truffle/utils');

const ERC20 = artifacts.require('ERC20');
const OFTCore = artifacts.require('OFTCore');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  let currentToken, currentOApp, peerOApp, peerEId;
  // https://docs.layerzero.network/v2/developers/evm/technical-reference/endpoints#sepolia-testnet
  if (network === 'sepolia') {
    currentToken = '0x17D3e3819830672DC29cb7192b6641c297b0B838';
    currentOApp = '0x7d9405441f805Da40E6e7f0cFf4eFdc175f18bf4';
    peerOApp = '0x17D3e3819830672DC29cb7192b6641c297b0B838';
    peerEId = 40245;
  } else if (network === 'baseSepolia') {
    currentToken = '0x17D3e3819830672DC29cb7192b6641c297b0B838';
    currentOApp = currentToken;
    peerOApp = '0x7d9405441f805Da40E6e7f0cFf4eFdc175f18bf4';
    peerEId = 40161;
  }

  // await config(currentOApp, peerOApp, peerEId);
  await test(owner, currentToken, currentOApp, peerOApp, peerEId);
};

const config = async (currentOApp, peerOApp, peerEId) => {
  const instanceOApp = await OFTCore.at(currentOApp);
  const { tx } = await instanceOApp.setPeer(peerEId, addressToBytes32(peerOApp));
  console.log('setPeer:', tx);
};

const test = async (owner, currentToken, currentOApp, peerOApp, peerEId) => {
  const instanceOApp = await OFTCore.at(currentOApp);

  const amount = toWei(5);
  // https://docs.layerzero.network/contracts/options
  // Default 200k gas execution options
  // Since you already set enforced options with 200,000 gas you don't actually need to pack an extra set of options into extraOptions
  // const _defaultOptions = '0x00030100110100000000000000000000000000030d40'; // OAppOptionsType3 with 200k
  const _defaultOptions = '0x000301001101000000000000000000000000000186a0'; // OAppOptionsType3 with 100k
  const _sendParams = {
    dstEid: peerEId, // Destination endpoint ID.
    // Recipient address. https://github.com/LayerZero-Labs/LayerZero-v2/blob/bf4318b/oapp/contracts/oft/libs/OFTComposeMsgCodec.sol#L79C14-L79C30
    // Ex: 0x0000000000000000000000002f1C1C44b3c16659302Af16aB231BEF38C371c2E
    to: addressToBytes32(owner, 64),
    amountLD: amount, // Amount to send in local decimals.
    minAmountLD: amount, // Minimum amount to send in local decimals.
    extraOptions: _defaultOptions, // Additional options supplied by the caller to be used in the LayerZero message.
    composeMsg: '0x', // The composed message for the send() operation.
    oftCmd: '0x', // The OFT command to be executed, unused in default OFT implementations.
  };
  console.log('_sendParams:', JSON.stringify(_sendParams));

  const { nativeFee, lzTokenFee } = await instanceOApp.quoteSend(_sendParams, false /*_payInLzToken*/);
  console.log('quoteSend', { nativeFee, lzTokenFee });

  // Hard config for testing purpose. The data should be calculated by quoteSend.
  const _fee = {
    nativeFee: nativeFee, // gas amount in native gas token
    lzTokenFee: lzTokenFee, // gas amount in ZRO token
  };
  const _refundAddress = owner;

  const instanceToken = await ERC20.at(currentToken);
  const approveTx = await instanceToken.approve(instanceOApp.address, amount);
  console.log(`approveTx: ${amount}`, approveTx.tx);

  const { tx } = await instanceOApp.send(_sendParams, _fee, _refundAddress, { value: nativeFee });
  console.log('send tx', tx);
};
