import { ethers } from "ethers";
import * as dotenv from "dotenv";
import path from "path";
import { SPEN__factory } from "../typechain-types";

// 環境変数を読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const args = process.argv.slice(2);
  const contractAddress = args[0];
  const action = args[1];

  if (!contractAddress || !action) {
    console.log("Usage: npx ts-node scripts/manage.ts <ContractAddress> <action>");
    return;
  }

  const privateKey: string = process.env.PRIVATE_KEY ?? "";
  const provider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  const spenContract = SPEN__factory.connect(contractAddress, signer);

  switch (action) {
    case "enableMinting":
      await spenContract.setMintingEnabled(true);
      console.log("Minting enabled");
      break;
    case "disableMinting":
      await spenContract.setMintingEnabled(false);
      console.log("Minting disabled");
      break;
    case "setPaymentToken":
      const paymentTokenAddress = args[2];
      await spenContract.setPaymentToken(paymentTokenAddress);
      console.log(`Payment token set to ${paymentTokenAddress}`);
      break;
    case "setMintPrice":
      const mintPrice = ethers.utils.parseEther(args[2]); // Expecting price in Ether
      await spenContract.setMintPrice(mintPrice);
      console.log(`Mint price set to ${args[2]} ETH`);
      break;
    case "getMintConfig":
      const mintConfig = await spenContract.getMintConfig();
      console.log("Mint Configuration:");
      console.log({
        mintingEnabled: mintConfig.mintingEnabled,
        mintPrice: ethers.utils.formatEther(mintConfig.mintPrice),
        paymentTokenAddress: mintConfig.paymentTokenAddress,
        isFreeMint: mintConfig.isFreeMint,
        paymentTokenSymbol: mintConfig.paymentTokenSymbol
      });
      break;
    case "burnNFT":
      const tokenId = args[2];
      await spenContract.burn(tokenId);
      console.log(`NFT with token ID ${tokenId} has been burned`);
      break;
    default:
      console.log("Unknown action");
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
