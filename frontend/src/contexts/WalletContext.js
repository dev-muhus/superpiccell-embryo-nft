import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
    return useContext(WalletContext);
};

export const WalletProvider = ({ children }) => {
    const [userAccount, setUserAccount] = useState(null);
    const [networkMismatch, setNetworkMismatch] = useState(false);
    const [message, setMessage] = useState('');
    const [open, setOpen] = useState(false);

    const requestAccount = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setUserAccount(accounts[0]);
                await checkNetwork();
            } catch (error) {
                console.error("Failed to connect wallet:", error);
            }
        } else {
            setMessage('MetaMask is not installed. Please install MetaMask to use this feature.');
            setOpen(true);
        }
    };

    const checkNetwork = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10);
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await provider.getNetwork();
                if (network.chainId !== expectedChainId) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
                        });
                        setNetworkMismatch(false);
                        return true;
                    } catch (switchError) {
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: `0x${expectedChainId.toString(16)}`,
                                    rpcUrls: [process.env.NEXT_PUBLIC_NFT_RPC_URL],
                                    chainName: process.env.NEXT_PUBLIC_NETWORK_NAME.charAt(0).toUpperCase() + process.env.NEXT_PUBLIC_NETWORK_NAME.slice(1)
                                }]
                            });
                            setNetworkMismatch(false);
                            return true;
                        } else {
                            console.error("Failed to switch network:", switchError);
                            setNetworkMismatch(true);
                            return false;
                        }
                    }
                } else {
                    setNetworkMismatch(false);
                    return true;
                }
            } catch (error) {
                console.error("Failed to check or switch network:", error);
                setNetworkMismatch(true);
                return false;
            }
        }
        return false;
    };

    const callContractMethod = async (contract, method, ...args) => {
        const isNetworkValid = await checkNetwork();
        if (!isNetworkValid) {
            console.error('Network mismatch. Please switch to the correct network.');
            return false;
        }
        try {
            return await contract[method](...args);
        } catch (error) {
            console.error(`Error calling contract method ${method}:`, error);
            return false;
        }
    };

    const disconnectAccount = () => {
        setUserAccount(null);
        setNetworkMismatch(false);
    };

    return (
        <WalletContext.Provider value={{ userAccount, networkMismatch, requestAccount, checkNetwork, disconnectAccount, callContractMethod, message, setMessage, open, setOpen }}>
            {children}
        </WalletContext.Provider>
    );
};
