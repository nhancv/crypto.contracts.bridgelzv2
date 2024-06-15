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
const { getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');

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

  // Replace with your dstEid's and peerAddresses
  // Before setting the peer, we need to convert the EVM peer addresses to bytes32
  const SEPOLIA_EID = 40161;
  const peer = {
    dstEid: SEPOLIA_EID,
    peerAddress: addressToBytes32('0x7d9405441f805Da40E6e7f0cFf4eFdc175f18bf4'),
  };

  const associatedTokenAccount = (
    await getOrCreateAssociatedTokenAccount(connection, user, mintKpWallet, user.publicKey, false, 'confirmed')
  ).address;

  // Define your receiver's address (typically bytes20 for evm addresses)
  const receiver = addressToBytes32('0x2f1C1C44b3c16659302Af16aB231BEF38C371c2E');

  // Define your amount to send in big number format
  const amountToSend = 1n;

  // Generate the send quote using your sendParams
  const fee = await OftTools.quoteWithUln(
    connection, // your connection
    user.publicKey, // payer address
    mintKpWallet, // token mint address
    peer.dstEid, // destination endpoint id
    amountToSend, // amount of tokens to send
    amountToSend, // minimum amount of tokens to send (for slippage)
    Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // extra options to send
    receiver, // receiver address
  );

  // Create the send transaction
  const sendTransaction = new Transaction().add(
    await OftTools.sendWithUln(
      connection, // your connection
      user.publicKey, // payer address
      mintKpWallet, // token mint address
      associatedTokenAccount, // associated token address
      peer.dstEid, // destination endpoint id
      amountToSend, // amount of tokens to send
      amountToSend, // minimum amount of tokens to send (for slippage)
      Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // extra options to send
      receiver, // receiver address
      fee.nativeFee, // native fee to pay (using quote)
    ),
  );

  // Send and confirm the send transaction
  const sendSignature = await sendAndConfirmTransaction(connection, sendTransaction, [user]);
  const link = getExplorerLink('tx', sendSignature, CLUSTER);
  console.log(`✅ You sent ${amountToSend} to dstEid ${peer.dstEid}! View the transaction here: ${link}`);
};

main()
  .then(() => console.log('Finished!'))
  .catch(console.error);
