import { ethers } from 'ethers';
import contractAbi from '../../public/SuperPiccellCore.json';

export async function fetchContents(contentType) {
    let provider;

    if (process.env.NEXT_PUBLIC_CORE_RPC_URL) {
        provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_CORE_RPC_URL);
    } else if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.BrowserProvider(window.ethereum);
    } else {
        throw new Error('No provider available. Please connect a wallet.');
    }

    const contractAddress = process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(contractAddress, contractAbi.abi, provider);

    try {
        const contents = await contract.getContentsByContentType(contentType);
        return contents;
    } catch (error) {
        console.error('Failed to fetch contents:', error);
        throw error;
    }
}
