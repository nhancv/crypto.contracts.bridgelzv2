// truffle test ./test/ERC20Bridge.test.js --network test

const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { toWei, addressToBytes32 } = require('../scripts_truffle/utils');

// Consider uncomment when you get Error: CONNECTION ERROR: Couldn't connect to node
// require('@openzeppelin/test-helpers/configure')({
//   provider: 'http://127.0.0.1:8545
// });

const MockERC20 = artifacts.require('MockERC20');
const MockOFTAdapter = artifacts.require('MockOFTAdapter');
const MockOFT = artifacts.require('MockOFT');
const EndpointV2Mock = artifacts.require('EndpointV2Mock');

const DEFAULT_OPTIONS = '0x00030100110100000000000000000000000000030d40'; // 200k gas

contract('ERC20Bridge.test', ([owner, bob, eric]) => {
  // Constant representing a mock Endpoint ID for testing purposes
  const eidA = 1;
  const eidB = 2;
  let mockEndpointA, mockEndpointB;
  let tokenL1, oAppL1, oAppL2;

  before(async function () {
    // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
    mockEndpointA = await EndpointV2Mock.new(eidA);
    mockEndpointB = await EndpointV2Mock.new(eidB);

    // Deploying OApp
    tokenL1 = await MockERC20.new('MockL1', 'MOCK', 1e6);
    oAppL1 = await MockOFTAdapter.new(tokenL1.address, mockEndpointA.address);
    oAppL2 = await MockOFT.new('MockL2', 'MOCK', mockEndpointB.address);

    // Setting destination endpoints in the LZEndpoint mock
    await mockEndpointA.setDestLzEndpoint(oAppL2.address, mockEndpointB.address);
    await mockEndpointB.setDestLzEndpoint(oAppL1.address, mockEndpointA.address);

    // Setting each OApp instance as a peer of the other in the mock LZEndpoint
    await oAppL1.setPeer(eidB, addressToBytes32(oAppL2.address));
    await oAppL2.setPeer(eidA, addressToBytes32(oAppL1.address));
  });

  it('send token from L1 to L2', async () => {
    const amount = toWei(1);

    assert.equal(await tokenL1.balanceOf(oAppL1.address), 0);
    assert.equal(await oAppL2.balanceOf(owner), 0);

    const _sendParams = {
      dstEid: eidB, // Destination endpoint ID.
      to: addressToBytes32(owner),
      amountLD: amount, // Amount to send in local decimals.
      minAmountLD: amount, // Minimum amount to send in local decimals.
      extraOptions: DEFAULT_OPTIONS, // Additional options supplied by the caller to be used in the LayerZero message.
      composeMsg: '0x', // The composed message for the send() operation.
      oftCmd: '0x', // The OFT command to be executed, unused in default OFT implementations.
    };
    const { nativeFee, lzTokenFee } = await oAppL1.quoteSend(_sendParams, false);
    await tokenL1.approve(oAppL1.address, amount);
    await oAppL1.send(_sendParams, { nativeFee, lzTokenFee }, owner, { value: nativeFee });

    assert.equal(await tokenL1.balanceOf(oAppL1.address), amount);
    assert.equal(await oAppL2.balanceOf(owner), amount);
  });

  it('send token from L2 to L1', async () => {
    const amount = toWei(1);

    assert.equal(await tokenL1.balanceOf(oAppL1.address), amount);
    assert.equal(await oAppL2.balanceOf(owner), amount);

    const _sendParams = {
      dstEid: eidA, // Destination endpoint ID.
      to: addressToBytes32(owner),
      amountLD: amount, // Amount to send in local decimals.
      minAmountLD: amount, // Minimum amount to send in local decimals.
      extraOptions: DEFAULT_OPTIONS, // Additional options supplied by the caller to be used in the LayerZero message.
      composeMsg: '0x', // The composed message for the send() operation.
      oftCmd: '0x', // The OFT command to be executed, unused in default OFT implementations.
    };
    const { nativeFee, lzTokenFee } = await oAppL2.quoteSend(_sendParams, false);
    await oAppL2.approve(oAppL2.address, amount);
    await oAppL2.send(_sendParams, { nativeFee, lzTokenFee }, owner, { value: nativeFee });

    assert.equal(await tokenL1.balanceOf(owner), toWei(1e6));
    assert.equal(await tokenL1.balanceOf(oAppL1.address), 0);
    assert.equal(await oAppL2.balanceOf(owner), 0);
  });
});

/**
 *   Contract: ERC20Bridge.test
 *     ✔ send token from L1 to L2 (235ms)
 *     ✔ send token from L2 to L1 (212ms)
 *
 *
 *   2 passing (900ms)
 */
