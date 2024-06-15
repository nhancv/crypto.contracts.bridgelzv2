/*
truffle migrate -f 11 --to 11 --network sepolia
*/

const { addressToBytes32, toWei } = require('../scripts_truffle/utils');

const ERC20 = artifacts.require('ERC20');
const OFTCore = artifacts.require('OFTCore');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  // Endpoints: https://docs.layerzero.network/v2/developers/evm/technical-reference/endpoints#sepolia-testnet
  let currentToken, currentOApp, peerEId;
  if (network === 'sepolia') {
    currentToken = '0x17D3e3819830672DC29cb7192b6641c297b0B838';
    currentOApp = '0x7d9405441f805Da40E6e7f0cFf4eFdc175f18bf4';
    peerEId = 40168; // Solana Testnet
  }

  await send(owner, currentToken, currentOApp, peerEId, network);
};

const send = async (owner, currentToken, currentOApp, peerEId, network) => {
  const instanceOApp = await OFTCore.at(currentOApp);

  const amount = toWei(1);
  const _sendParams = {
    dstEid: peerEId, // Destination endpoint ID.
    to: addressToBytes32(owner), // Ex: 0x000000000000000000000000{address without 0x}
    amountLD: amount, // Amount to send in local decimals.
    minAmountLD: amount, // Minimum amount to send in local decimals.
    extraOptions: '0x', // Additional options supplied by the caller to be used in the LayerZero message.
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

  // Only needed if send from L1.
  if (network === 'sepolia') {
    const instanceToken = await ERC20.at(currentToken);
    const approveTx = await instanceToken.approve(instanceOApp.address, amount);
    console.log(`approveTx: ${amount}`, approveTx.tx);
  }

  const { tx } = await instanceOApp.send(_sendParams, _fee, _refundAddress, { value: nativeFee });
  console.log('send tx', tx);
};
