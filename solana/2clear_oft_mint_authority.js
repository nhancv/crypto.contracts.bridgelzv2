const {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');

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
  console.log(`OFT Authority: ${oftConfig.toBase58()}`);

  const transaction = new Transaction().add(
    await OftTools.createSetMintAuthorityIx(
      user.publicKey,
      oftConfig, // your oft config pda
      null, // the oft program enforces that once the OFT mint authority it set to null, it cannot be reset
    ),
  );

  // Send the transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [user]);
  const link = getExplorerLink('tx', signature, CLUSTER);
  console.log(`✅Transaction confirmed: ${link}`);
};

main()
  .then(() => console.log('Finished!'))
  .catch(console.error);
