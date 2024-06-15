## Install Solana

### Install Rust

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Install Solana CLI

```
sh -c "$(curl -sSfL https://release.solana.com/v1.17.15/install)"

# or
npm install -g @solana/cli
```

- Verify installation

```
solana --version
solana config get
```

- Change CLUSTER RPC URL to `testnet`

```
solana config set --url https://api.testnet.solana.com

* We have some clusters:
  - local: http://127.0.0.1:8899
  - devnet: https://api.devnet.solana.com
  - testnet: https://api.testnet.solana.com
  - mainnet-beta: https://api.mainnet-beta.solana.com
  - mainnet: https://api.mainnet.solana.com
```

### Create a Solana Wallet

```
solana-keygen new --no-passphrase -o ./wallets/id1.json

* WALLET_ADDRESS = pubkey
```

### Airdrop SOL

- Available for Testnet
  - https://faucet.quicknode.com - A web faucet operated by QuickNode
  - https://www.testnetfaucet.org/ - A web faucet with a rate limit separate than the public RPC

```
solana airdrop 1 <WALLET_ADDRESS> [--url CLUSTER_URL]

Ex:
solana airdrop 1 7wSr9DZRVHmPpWzjWFVvxZNGRBaDcvnu8zveWbV4PhdY
```

- Check balance

```
solana balance <WALLET_ADDRESS> [--url CLUSTER_URL]

Ex:
solana balance 7wSr9DZRVHmPpWzjWFVvxZNGRBaDcvnu8zveWbV4PhdY
```

## Solana OFT

- Solana Guide: https://solana.com/developers/evm-to-svm/complete-guide
- 60 days of Solana: https://www.rareskills.io/solana-tutorial
- Solana SPL Token: https://spl.solana.com/token
- LZDocs: https://docs.layerzero.network/v2/developers/solana/oft/native

### Deployed Endpoints, Message Libraries, and Executors

https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts#sepolia-testnet

- Sepolia:

  - Chain ID: 40161
  - Endpoint: 0x6EDCE65403992e310A62460808c4b910D972f10f

- Solana Testnet:
  - Chain ID: 40168
  - Endpoint: 76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6

### Installation

```
yarn add @layerzerolabs/lz-solana-sdk-v2 @solana/web3.js @solana/spl-token @solana-developers/helpers esrun
```

### Usage

- Creating a New Native OFT

```
node 1deploy_oft_native.js

=>
[testnet] 🔑Loaded public key is: 7wSr9DZRVHmPpWzjWFVvxZNGRBaDcvnu8zveWbV4PhdY (1 SOL)
Token Mint Account: DLtMU9f1S3WebCc4As3tJz7nB1euw63yYJcJDBjuHhtU
SPL Token Mint Account: https://solscan.io/token/DLtMU9f1S3WebCc4As3tJz7nB1euw63yYJcJDBjuHhtU?cluster=testnet

  /* NOTE:
   * Explore the transaction details on Solana Explorer "#2 - Token Program: initializeMint"
   *  - The "Mint" account is SPL Token address
   *  - The mint authority is the account that can mint new tokens
   *  - The freeze authority is the account that can freeze token accounts
   * Here "freeze authority" = "mint authority" = "user wallet/public key" = "Update Authority" = "OApp" = "Peer"
   * To get latest "Authority" address:
   *   1. Visit Token detail page on Solana Explorer, read "Update Authority" field. https://solscan.io/token/${mintKp.publicKey}?cluster=CLUSTER
   *   2. Or, read "oftConfig" field: console.log(`OFT Authority: ${oftConfig.toBase58()}`);
   * At this point, the "Authority" address will be used to set peer in EVM OApp.
   */
✅Minter Initialization Complete: https://explorer.solana.com/tx/4Dcd4SSC8DkZZi7UL38iWPvAEMJcaSoaLXAfo533CTWzx9g3SrRuX87jXpnmT85uvm36r7EePqEt5foux1tUmxs3?cluster=testnet
✅OFT Initialization Complete: https://explorer.solana.com/tx/2ZtknnxvPuM1H44EuHSEcYm6KkA2cjxcJdhiyLE2fRK8hNo89CJsJ2rV7geff1TiYbUiecTpUdiZu2FF82DVq2sG?cluster=testnet
Finished!
```

- Clear `OFT Mint Authority`

After deploying your OFT and minting any additional supply, you should set the OFT Mint Authority to null

```
node 2clear_oft_mint_authority.js

=>
[testnet] 🔑Loaded public key is: 7wSr9DZRVHmPpWzjWFVvxZNGRBaDcvnu8zveWbV4PhdY (0.99381844 SOL)
OFT Authority now: 2ohFiFDNwLyDygWoPi27TTRtCJtZLwbLb7Xrpc3SQe84
✅Transaction confirmed: https://explorer.solana.com/tx/3WtapFNSquZ2vhXTTXNatWEkfLTonY2hFwxLmEDMKjBwYqGaVyb1BDdWFQBWiDUMR5EaYnvFxtx9gNcPupEcmffW?cluster=testnet
Finished!

=>
https://solscan.io/token/DLtMU9f1S3WebCc4As3tJz7nB1euw63yYJcJDBjuHhtU?cluster=testnet
- The latest "Authority" address is: 2ohFiFDNwLyDygWoPi27TTRtCJtZLwbLb7Xrpc3SQe84
- Token decimals: 6
```

- Setting `EVM` Trusted Peers to `Solana OApp`

```
node 3set_peers.js

=>
[testnet] 🔑Loaded public key is: 7wSr9DZRVHmPpWzjWFVvxZNGRBaDcvnu8zveWbV4PhdY (0.99381344 SOL)
(OFT Config/Authority) OApp: 2ohFiFDNwLyDygWoPi27TTRtCJtZLwbLb7Xrpc3SQe84
OApp in bytes32 for EVM setPeer: 0x1ad1eb48ce78d329171d6341b1b877ad5edc7283d8cd80117bdaa697c16cf075
✅You set 0x0000000000000000000000007d9405441f805da40e6e7f0cff4efdc175f18bf4 for dstEid 40161
✅Transaction confirmed: https://explorer.solana.com/tx/4viF6kF17UYt9YNyNstwahboxgm9Rdvy1c3wdPKAUNk5bMUWPZ3VBJDX6pWsmEtnQnZWMKLyw3Sf5trzHhXmgtQL?cluster=testnet`
Finished!
```

- Config Execution Options

```
node 4config_execution_options.js

=>
[testnet] 🔑Loaded public key is: 7wSr9DZRVHmPpWzjWFVvxZNGRBaDcvnu8zveWbV4PhdY (0.99240252 SOL)
✅ You set options for dstEid 40161! View the transaction here: https://explorer.solana.com/tx/27ghytAuLcb7zLmR1cFQSQYjKmnzt7hithbXU2fvAAc3k1Vm2A4wo3v6EbZ8wemq8nPGgLPJWHxtx4TZCYPgAdhP?cluster=testnet
Finished!
```

- Setting `Solana OApp` Trusted Peer to `EVM` & Execution Options

```
# At root directory
cd ..
truffle migrate -f 10 --to 10 --network sepolia
```
