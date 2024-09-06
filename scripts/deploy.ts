import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const privateKey: string = process.env.PRIVATE_KEY ?? "";
    if (privateKey === "") {
        throw new Error('No value set for environment variable PRIVATE_KEY');
    }
    const rpcUrl: string = process.env.NETWORK_URL ?? "";
    if (rpcUrl === "") {
        throw new Error('No value set for environment variable NETWORK_URL');
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log("Deploying contracts with the account:", signer.address);

    const artifact = require("../artifacts/contracts/SPEN.sol/SPEN.json");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

    const spen = await factory.deploy();

    console.log("SPEN deployed to:", spen.address);
    console.log(`Transaction URL: https://${process.env.NETWORK_NAME}.etherscan.io/tx/${spen.deployTransaction.hash}`);
    await spen.deployed();
    console.log("Deploy completed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
