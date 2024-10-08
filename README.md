# SuperPiccell Embryo NFT DApp

This project is a decentralized application (DApp) that allows users to mint NFTs using the SuperPiccell Core contract and manage content on the Ethereum blockchain.

## Features
- Mint NFTs
- View minted NFTs
- Wallet connection (MetaMask)
- Integration with blockchain explorers (Etherscan, OpenSea)

## Prerequisites
- Node.js (v14 or higher)
- Docker
- MetaMask extension

## Setup Instructions

### 1. Clone the Repository
```bash
git clone git@github.com:dev-muhus/superpiccell-embryo-nft.git
cd superpiccell-embryo-nft
```

### 2. Set Up Environment Variables

There are **two environment variable files** to configure:

#### `frontend/.env.local` (for frontend configuration):
```bash
# Core Contract
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=<your_core_contract_address>
NEXT_PUBLIC_CORE_RPC_URL=<your_rpc_url>

# Mint Contract
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=<your_nft_contract_address>
NEXT_PUBLIC_NFT_RPC_URL=<your_rpc_url>

# FrontEnd Meta
NEXT_PUBLIC_SITE_NAME=Super Piccell Embryo NFT
NEXT_PUBLIC_META_DESCRIPTION=Super Piccell Embryo NFT Minting Site

# FrontEnd Style
NEXT_PUBLIC_HEADER_COLOR=#333333
NEXT_PUBLIC_HEADER_TEXT_COLOR=#ffffff
```

#### `.env` (for backend configuration):
```bash
PRIVATE_KEY=<your_private_key>
NETWORK_URL=<your_backend_rpc_url>
NETWORK_NAME=<your_network>
```

You can use any RPC provider (Infura, Alchemy, or others) for the `NEXT_PUBLIC_CORE_RPC_URL`, `NEXT_PUBLIC_NFT_RPC_URL`, and `NETWORK_URL` variables.

### 3. Build and Launch Docker Containers
```bash
docker compose up -d
```


### 4. Install Dependencies Inside the Container

For the backend:

```bash
docker compose exec app bash
npm ci
```

For the frontend:

```bash
docker compose exec frontend bash
npm ci
```


### 5. Start the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Smart Contract Interaction

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy Contracts
```bash
npx ts-node scripts/deploy.ts
```

### Example Commands

- **Enable Minting**:
```sh
npx ts-node scripts/manage.ts 0xYourSPENContractAddress enableMinting
```

- **Disable Minting**:
```sh
npx ts-node scripts/manage.ts 0xYourSPENContractAddress disableMinting
```

- **Set Mint Price (e.g., 0.1 ETH)**:
```sh
npx ts-node scripts/manage.ts 0xYourSPENContractAddress setMintPrice 0.01
```

- **Set Payment Token**:
```sh
npx ts-node scripts/manage.ts 0xYourSPENContractAddress setPaymentToken 0xYourERC20TokenAddress
# For native token:
0x0000000000000000000000000000000000000000
```

- **Get Mint Configuration**:
```sh
npx ts-node scripts/manage.ts 0xYourSPENContractAddress getMintConfig
```

- **Burn Token (e.g., Token ID 1)**:
```sh
npx ts-node scripts/manage.ts 0xYourSPENContractAddress burnNFT {n}
```

## Frontend Components

### `Header.js`
Handles wallet connection and navigation, allowing users to mint and view NFTs.

### `Footer.js`
Displays site information and copyright details.

### `nft-list.js`
Fetches and displays NFTs owned by the user from the blockchain.

## Contracts

### `SPEN.sol`
Handles NFT minting and token-related functionality.

### `ERC20Mock.sol`
A mock ERC20 contract used for testing purposes.

## Testing

### Run Tests
```bash
npx hardhat test
```

## License

This project is licensed under the Unlicense. For more details, see the [LICENSE](LICENSE) file.

## Etherscan Contract Verification (Automated)

This project supports automated contract verification on Etherscan. After deploying your contracts, you can easily verify them using the following command:

### Verify Contracts
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

Before running this command, ensure your `.env` file is properly configured with your Etherscan API key:

```bash
ETHERSCAN_API_KEY=<your_etherscan_api_key>
```

By running the above command, the contract will be automatically verified and published on Etherscan, including all related source code and dependencies.
