/*
truffle migrate -f 10 --to 10 --network sepolia
*/

const OFTCore = artifacts.require('OFTCore');

module.exports = async function (deployer, network, accounts) {
  if (network === 'test') return;
  const owner = accounts[0];
  console.log('Owner:', owner);

  // Endpoints: https://docs.layerzero.network/v2/developers/evm/technical-reference/endpoints#sepolia-testnet
  let currentOApp, peerOApp, peerEId;
  if (network === 'sepolia') {
    currentOApp = '0x7d9405441f805Da40E6e7f0cFf4eFdc175f18bf4';
    peerOApp = '0x1ad1eb48ce78d329171d6341b1b877ad5edc7283d8cd80117bdaa697c16cf075'; // Solana bytes32 type
    peerEId = 40168; // Solana Testnet
  }

  await config(currentOApp, peerOApp, peerEId, network);
};

const config = async (currentOApp, peerOApp, peerEId, network) => {
  const instanceOApp = await OFTCore.at(currentOApp);

  const { tx } = await instanceOApp.setPeer(peerEId, peerOApp);
  console.log('setPeer:', tx);
  console.log('PeerId:', await instanceOApp.peers(peerEId));

  /**
   Solana: https://docs.layerzero.network/v2/developers/solana/oft/native#setting-enforced-options-inbound-to-solana

   On your equivalent EVM implementation of the OFT, you must send at minimum 0.0015 SOL (1500000 lamports) in your lzReceiveOption when sending to Solana.
   ```
   const { Options } = require('@layerzerolabs/lz-v2-utilities');

   # For SEND
   Options.newOptions().addExecutorLzReceiveOption(65000, 1500000).toHex()
   0x0003010021010000000000000000000000000000fde80000000000000000000000000016e360

   # For SEND_AND_CALL
   Options.newOptions().addExecutorLzReceiveOption(65000, 1500000).addExecutorComposeOption(0, 50000, 0).toHex()
   0x0003010021010000000000000000000000000000fde80000000000000000000000000016e3600100130300000000000000000000000000000000c350
   ```
   */
  let enforcedOptions = [
    {
      eid: peerEId,
      msgType: 1, // uint16 internal constant SEND = 1;
      options: '0x0003010021010000000000000000000000000000fde80000000000000000000000000016e360',
    },
    {
      eid: peerEId,
      msgType: 2, // uint16 internal constant SEND_AND_CALL = 2;
      options:
        '0x0003010021010000000000000000000000000000fde80000000000000000000000000016e3600100130300000000000000000000000000000000c350',
    },
  ];

  // Call the setEnforcedOptions function
  const setEnforcedOptions = await instanceOApp.setEnforcedOptions(enforcedOptions);
  console.log('setEnforcedOptions:', setEnforcedOptions.tx);
};
