const {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');

const { addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities');
const { OftTools, OftProgram, OFT_SEED } = require('@layerzerolabs/lz-solana-sdk-v2');
const { getExplorerLink, getKeypairFromFile } = require('@solana-developers/helpers');

const CLUSTER = 'testnet';
const main = async () => {
  // Connect to the Solana cluster
  const connection = new Connection(clusterApiUrl(CLUSTER));

  // Load the user's keypair from the environment variables
  const user = await getKeypairFromFile('./wallets/id1.json');
  const userWallet = user.publicKey;

  let balance = await connection.getBalance(userWallet);
  console.log(`[${CLUSTER}] 🔑Loaded public key is: ${userWallet.toBase58()} (${balance / LAMPORTS_PER_SOL} SOL)`);

  // Get mintKpWallet from step 1 output
  const mintKpWallet = new PublicKey('DLtMU9f1S3WebCc4As3tJz7nB1euw63yYJcJDBjuHhtU');
  // Find the OFT Config PDA using your mint keypair
  const [oftConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(OFT_SEED), mintKpWallet.toBuffer()],
    OftProgram.OFT_DEFAULT_PROGRAM_ID,
  );

  // Before setting the peer, we need to convert the EVM peer addresses to bytes32.
  // To do this, we left zero-pad the address until it fills a bytes32 value.
  // Replace with your dstEid's and peerAddresses
  // Before setting the peer, we need to convert the EVM peer addresses to bytes32
  const SEPOLIA_EID = 40161;
  const peers = [
    { dstEid: SEPOLIA_EID, peerAddress: addressToBytes32('0x7d9405441f805Da40E6e7f0cFf4eFdc175f18bf4') },
    // ...
  ];

  for (const peer of peers) {
    const optionTransaction = new Transaction().add(
      await OftTools.createSetEnforcedOptionsIx(
        user.publicKey, // your admin address
        oftConfig, // your OFT Config
        peer.dstEid, // destination endpoint id for the options to apply to
        Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes(), // send options
        Options.newOptions().addExecutorLzReceiveOption(65000, 0).addExecutorComposeOption(0, 50000, 0).toBytes(), // sendAndCall options
      ),
    );

    // Send the setEnforcedOptions transaction
    const optionSignature = await sendAndConfirmTransaction(connection, optionTransaction, [user]);
    const link = getExplorerLink('tx', optionSignature, CLUSTER);
    console.log(`✅ You set options for dstEid ${peer.dstEid}! View the transaction here: ${link}`);
  }
};

main()
  .then(() => console.log('Finished!'))
  .catch(console.error);
