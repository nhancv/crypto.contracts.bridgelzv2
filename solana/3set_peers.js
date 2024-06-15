const {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');

const { addressToBytes32 } = require('@layerzerolabs/lz-v2-utilities');
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
  // Find the OFT Config PDA using your mint keypair = Authority = OApp = Peer
  const [oftConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(OFT_SEED), mintKpWallet.toBuffer()],
    OftProgram.OFT_DEFAULT_PROGRAM_ID,
  );
  console.log(`(OFT Config/Authority) OApp: ${oftConfig.toBase58()}`);
  console.log(
    `OApp in bytes32 for EVM setPeer: 0x${Buffer.from(addressToBytes32(oftConfig.toBase58())).toString('hex')}`,
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
    const peerTransaction = new Transaction().add(
      await OftTools.createSetPeerIx(
        user.publicKey, // admin
        oftConfig, // oft config account
        peer.dstEid, // destination endpoint id
        peer.peerAddress, // peer address
      ),
    );

    const peerSignature = await sendAndConfirmTransaction(connection, peerTransaction, [user]);
    const link = getExplorerLink('tx', peerSignature, CLUSTER);
    console.log(
      `✅You set ${await OftTools.getPeerAddress(connection, oftConfig, peer.dstEid)} for dstEid ${peer.dstEid}`,
    );
    console.log(`✅Transaction confirmed: ${link}`);
  }
};

main()
  .then(() => console.log('Finished!'))
  .catch(console.error);
