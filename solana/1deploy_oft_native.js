const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');

const {
  AuthorityType,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createSetAuthorityInstruction,
  getMintLen,
} = require('@solana/spl-token');

const { OftTools, OftProgram, OFT_SEED } = require('@layerzerolabs/lz-solana-sdk-v2');
const { getExplorerLink, getKeypairFromFile, airdropIfRequired } = require('@solana-developers/helpers');

const CLUSTER = 'testnet';
const main = async () => {
  // Connect to the Solana cluster
  const connection = new Connection(clusterApiUrl(CLUSTER));

  // Load the user's keypair from the environment variables
  const user = await getKeypairFromFile('./wallets/id1.json');
  const userWallet = user.publicKey;

  // await airdropIfRequired(connection, userWallet, 0.1 * LAMPORTS_PER_SOL, 0.1);

  let balance = await connection.getBalance(userWallet);
  console.log(`[${CLUSTER}] 🔑Loaded public key is: ${userWallet.toBase58()} (${balance / LAMPORTS_PER_SOL} SOL)`);

  // Create a new keypair for your Token Mint Account
  const mintKp = Keypair.generate();
  console.log(`Token Mint Account: ${mintKp.publicKey.toBase58()}`);

  // Number of local and shared decimals for the token (recommended value is 6)
  const OFT_DECIMALS = 6;

  // Initialize a new SPL Token Mint transaction
  const minimumBalanceForMint = await connection.getMinimumBalanceForRentExemption(getMintLen([]));
  let transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: mintKp.publicKey,
      space: getMintLen([]),
      lamports: minimumBalanceForMint,
      programId: TOKEN_PROGRAM_ID,
    }),
    await createInitializeMintInstruction(
      mintKp.publicKey, // mint public key
      OFT_DECIMALS, // decimals
      user.publicKey, // mint authority
      null, // freeze authority (not used here)
      TOKEN_PROGRAM_ID, // token program id
    ),
  );

  // Send the transaction to create the mint
  const initializeMinterSig = await sendAndConfirmTransaction(connection, transaction, [user, mintKp]);
  const initializeMinterLink = getExplorerLink('tx', initializeMinterSig, CLUSTER);
  /* NOTE:
   * Explore the transaction details on Solana Explorer "#2 - Token Program: initializeMint"
   *  - The "Mint" account is SPL Token address
   *  - The mint authority is the account that can mint new tokens
   *  - The freeze authority is the account that can freeze token accounts
   * Here "freeze authority" = "mint authority" = "user wallet/public key" = "Update Authority"
   * To get latest "Authority" address:
   *   1. Visit Token detail page on Solana Explorer, read "Update Authority" field. https://solscan.io/token/${mintKp.publicKey}?cluster=CLUSTER
   *   2. Or, read "oftConfig" field: console.log(`OFT Authority: ${oftConfig.toBase58()}`);
   * At this point, the "Authority" address will be used to set peer in EVM OApp.
   */
  console.log(`✅Minter Initialization Complete: ${initializeMinterLink}`);

  // Find the OFT Config PDA using your mint keypair
  const [oftConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(OFT_SEED), mintKp.publicKey.toBuffer()],
    OftProgram.OFT_DEFAULT_PROGRAM_ID,
  );
  console.log(`OFT Authority: ${oftConfig.toBase58()}`);

  // Create a new transaction to transfer your SPL Tokens Mint Authority
  // and Initialize the OFT config
  transaction = new Transaction().add(
    createSetAuthorityInstruction(
      mintKp.publicKey, // spl token mint public key
      user.publicKey, // current mint authority
      AuthorityType.MintTokens, // authority type
      oftConfig, // new mint authority
      [], // multisig owners (none in this case)
      TOKEN_PROGRAM_ID, // token program id
    ),
    await OftTools.createInitNativeOftIx(
      user.publicKey, // payer
      user.publicKey, // admin
      mintKp.publicKey, // mint account
      user.publicKey, // OFT Mint Authority
      OFT_DECIMALS, // OFT local and shared decimals
      TOKEN_PROGRAM_ID, // token program to build from (spl-token or token2022)
    ),
  );

  // Send the transaction to initialize the OFT
  const signature = await sendAndConfirmTransaction(connection, transaction, [user]);
  const link = getExplorerLink('tx', signature, CLUSTER);
  console.log(`✅OFT Initialization Complete: ${link}`);
  console.log(`SPL Token Mint Account: https://solscan.io/token/${mintKp.publicKey.toBase58()}?cluster=${CLUSTER}`);
};

main()
  .then(() => console.log('Finished!'))
  .catch(console.error);
