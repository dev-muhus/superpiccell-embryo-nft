import { useState, useEffect } from 'react';
import { Container, Box, CircularProgress, Typography, Grid, Card, CardContent, CardActions, Button, Fab, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { ethers } from 'ethers';
import Head from 'next/head';
import Footer from './components/Footer';
import Header from './components/Header';
import { useWallet } from '../contexts/WalletContext';
import spenContractData from '../../public/SPEN.json';
import coreContractData from '../../public/SuperPiccellCore.json';
import { fetchContents } from '../utils/fetchContents';

const SPEN_ABI = spenContractData.abi;
const CORE_ABI = coreContractData.abi;

export default function Home() {
  const { userAccount, requestAccount, networkMismatch, checkNetwork, callContractMethod } = useWallet();
  const [nftCount, setNftCount] = useState(0);
  const [shouldReconnect, setShouldReconnect] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  const [showScroll, setShowScroll] = useState(false);
  const [open, setOpen] = useState(false);
  const [transactionUrl, setTransactionUrl] = useState('');
  const [mintLoadingId, setMintLoadingId] = useState(null);
  const [isProtected, setIsProtected] = useState(false);
  const [mintedContents, setMintedContents] = useState(new Set());
  const [mintConfig, setMintConfig] = useState(null);
  const [mintDisabledStates, setMintDisabledStates] = useState({}); // State to manage button disable state

  const headerImageUrl = process.env.NEXT_PUBLIC_HEADER_IMAGE_URL;
  const backgroundColor = process.env.NEXT_PUBLIC_BACKGROUND_COLOR || 'transparent';
  const backgroundImageUrl = process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL || '';
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
  const coreContractAddress = process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS;
  const contentType = process.env.NEXT_PUBLIC_CONTENT_TYPE;
  const checkCoreProtectedMode = process.env.NEXT_PUBLIC_CHECK_CORE_PROTECTED_MODE?.toLowerCase() === 'true';
  const checkContentProtectedMode = process.env.NEXT_PUBLIC_CHECK_CONTENT_PROTECTED_MODE?.toLowerCase() === 'true';
  const checkMintedContent = process.env.NEXT_PUBLIC_CHECK_MINTED_CONTENT?.toLowerCase() === 'true';

  const backgroundStyle = backgroundImageUrl
    ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: backgroundColor };

  // Fetch NFT count when user account changes
  useEffect(() => {
    if (userAccount) {
      const loadNftCount = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(nftContractAddress, SPEN_ABI, provider);
        const count = await callContractMethod(contract, 'totalSupply');
        if (count === false) {
          console.error('Network mismatch or error occurred while loading NFT count. Please switch to the correct network.');
          return;
        }
        setNftCount(count.toNumber());
      };
      loadNftCount();
    } else if (shouldReconnect) {
      requestAccount();
    }
  }, [userAccount, shouldReconnect]);

  const handleDisconnect = () => {
    setShouldReconnect(false);
    setLoading(false);
    disconnectAccount();
  };

  useEffect(() => {
    if (userAccount) {
      setLoading(false);
    } else if (shouldReconnect) {
      setLoading(true);
    }
  }, [userAccount, shouldReconnect]);

  // Load initial data and check statuses
  useEffect(() => {
    setIsLoading(true);
    fetchContents(contentType)
      .then((fetchedContents) => {
        setContents(fetchedContents);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch contents:', error);
        setIsLoading(false);
      });

    if (checkCoreProtectedMode) {
      checkProtectionStatus();
    }

    if (checkMintedContent) {
      fetchMintedContents();
    }

    fetchMintConfiguration();
  }, []);

  // Fetch minting configuration from the contract
  const fetchMintConfiguration = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(nftContractAddress, SPEN_ABI, provider);
      const config = await callContractMethod(contract, 'getMintConfig');
      if (config === false) {
        console.error('Network mismatch or error occurred while fetching mint configuration. Please switch to the correct network.');
        return;
      }
      setMintConfig({
        mintingEnabled: config.mintingEnabled,
        mintPrice: ethers.utils.formatEther(config.mintPrice),
        paymentTokenAddress: config.paymentTokenAddress,
        isFreeMint: config.isFreeMint,
        paymentTokenSymbol: config.paymentTokenSymbol,
      });
    }
  };

  // Check if the contract is in protected mode
  const checkProtectionStatus = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const coreContract = new ethers.Contract(coreContractAddress, CORE_ABI, provider);
      const protectedStatus = await coreContract.isContractProtected();
      setIsProtected(protectedStatus);
    }
  };

  // Check if a specific content is protected
  const checkContentProtectionStatus = async (contentId) => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const coreContract = new ethers.Contract(coreContractAddress, CORE_ABI, provider);
      try {
        const isContentProtected = await coreContract.isContentProtected(contentId.toString());
        return isContentProtected;
      } catch (error) {
        console.error('Error checking content protection status:', error);
        return false;
      }
    }
    return false;
  };

  // Fetch all minted content IDs
  const fetchMintedContents = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(nftContractAddress, SPEN_ABI, provider);
      const totalSupply = await callContractMethod(contract, 'totalSupply');
      if (totalSupply === false) {
        console.error('Network mismatch or error occurred while fetching mint configuration. Please switch to the correct network.');
        return;
      }

      const mintedContentIds = new Set();
      for (let i = 0; i < totalSupply; i++) {
        if (await isValidTokenId(contract, i)) {
          try {
            const tokenURI = await contract.tokenURI(i);
            const tokenData = JSON.parse(tokenURI);
            if (tokenData.contentId) {
              mintedContentIds.add(ethers.BigNumber.from(tokenData.contentId).toString());
            }
          } catch (error) {
            console.error('Error fetching token URI:', error);
          }
        } else {
          console.warn(`Token ID ${i} is invalid or does not exist.`);
        }
      }
      setMintedContents(mintedContentIds);
    }
  };

  // Check if a token ID is valid
  const isValidTokenId = async (contract, tokenId) => {
    try {
      await contract.ownerOf(tokenId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleClose = () => {
    setOpen(false);
    setMintStatus('');
  };

  // Validate the network
  const validateNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      return await checkNetwork();
    }
    return false;
  };

  useEffect(() => {
    if (userAccount) {
      validateNetwork();
    }
  }, [userAccount]);

  // Update the mint button disable states
  useEffect(() => {
    const updateMintDisabledStates = async () => {
      const newMintDisabledStates = {};
  
      for (let content of contents) {
        let isDisabled = mintLoadingId === content.id || networkMismatch;
  
        if (checkCoreProtectedMode && !isProtected) {
          isDisabled = true;
        }
  
        if (checkContentProtectedMode) {
          const isContentProtected = await checkContentProtectionStatus(content.id);
          if (!isContentProtected) {
            isDisabled = true;
          }
        }
  
        if (checkMintedContent && mintedContents.has(ethers.BigNumber.from(content.id).toString())) {
          isDisabled = true;
        }
  
        newMintDisabledStates[content.id] = isDisabled;
      }
  
      setMintDisabledStates(newMintDisabledStates);
    };
  
    updateMintDisabledStates();
  }, [contents, isProtected, mintLoadingId, networkMismatch, checkCoreProtectedMode, checkContentProtectedMode, checkMintedContent, mintedContents]);

  const mintNFT = async (content) => {
    if (!userAccount) {
      setMintStatus('Please connect your wallet to mint an NFT.');
      setOpen(true);
      return;
    }

    const isNetworkValid = await validateNetwork();
    if (!isNetworkValid) {
      setMintStatus('Please switch to the correct network to mint an NFT.');
      setOpen(true);
      return;
    }

    // Check if the contract is in protected mode (for core protection)
    if (checkCoreProtectedMode && !isProtected) {
      setMintStatus('Contract is not in protected mode. Cannot mint NFT.');
      setOpen(true);
      return;
    }

    // Check if the content is protected (for content protection)
    if (checkContentProtectedMode) {
      const isContentProtected = await checkContentProtectionStatus(content.id);
      if (!isContentProtected) {
        setMintStatus('This content is not protected and cannot be minted.');
        setOpen(true);
        return;
      }
    }

    // Check if the content has already been minted
    if (checkMintedContent && mintedContents.has(ethers.BigNumber.from(content.id).toString())) {
      setMintStatus('This content has already been minted.');
      setOpen(true);
      return;
    }

    setMintLoadingId(content.id);

    try {
      const metadata = JSON.parse(content.content) || {};
      const excludedKeys = ['name', 'description', 'image'];
      const nftMetadata = {
        name: metadata.name || "No Name",
        description: metadata.description || "No Description",
        image: metadata.image || "No Image",
        attributes: Object.keys(metadata)
          .filter((key) => !excludedKeys.includes(key))
          .map((key) => ({
            trait_type: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
            value: String(metadata[key] || ""),
          })),
        contentId: content.id,
      };

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(nftContractAddress, SPEN_ABI, signer);

      const tx = await contract.mintNFT(userAccount, JSON.stringify(nftMetadata), content.id, { value: ethers.utils.parseEther(mintConfig.mintPrice) });
      await tx.wait();

      setMintStatus('NFT successfully minted!');
      setTransactionUrl(`https://${process.env.NEXT_PUBLIC_NETWORK_NAME}.etherscan.io/tx/${tx.hash}`);
      setOpen(true);

      setMintedContents((prev) => new Set(prev).add(ethers.BigNumber.from(content.id).toString()));

      const count = await callContractMethod(contract, 'totalSupply');
      setNftCount(count.toNumber());
    } catch (error) {
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        console.log('Transaction rejected by user.');
      } else {
        console.error('Error minting NFT:', error);
        setMintStatus(`Error minting NFT: ${error.message}`);
        setOpen(true);
      }
    } finally {
      setMintLoadingId(null);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => {
      window.removeEventListener('scroll', checkScrollTop);
    };
  }, [showScroll]);

  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_SITE_TITLE}</title>
        <meta name="description" content={process.env.NEXT_PUBLIC_META_DESCRIPTION} />
      </Head>
      <div style={{ ...backgroundStyle, minHeight: '100vh', padding: '0', display: 'flex', flexDirection: 'column' }}>
        <Header isMintPage={true} handleDisconnect={handleDisconnect} />
        <div style={{ paddingTop: '64px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          {headerImageUrl && (
            <img src={headerImageUrl} alt="Header" style={{ width: '100%', height: 'auto' }} />
          )}
        </div>
        <Container style={{ paddingTop: '64px', paddingBottom: '64px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
              <Typography variant="h6" style={{ marginLeft: '10px' }}>Loading contents...</Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {contents.map(content => {
                  const isMintButtonDisabled = mintDisabledStates[content.id] || false; // Use the state to determine if the button is disabled
                  return (
                    <Grid item xs={12} sm={6} md={4} key={content.id}>
                      <Card>
                        <CardContent>
                          {Object.entries(JSON.parse(content.content)).map(([key, value]) => (
                            <Typography key={key} variant="body2" color="textSecondary" component="p">
                              {key === 'image' ? (
                                <img src={value} alt="content" style={{ width: '100%', height: 'auto' }} />
                              ) : (
                                <>
                                  <strong>{key}:</strong> {value || '-'}
                                </>
                              )}
                            </Typography>
                          ))}
                          {mintConfig && !mintConfig.isFreeMint && (
                            <Typography variant="h6" color="textPrimary" component="p" style={{ fontWeight: 'bold', marginTop: '10px', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                              Mint Price: {mintConfig.mintPrice} {mintConfig.paymentTokenSymbol}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="primary" 
                            onClick={() => mintNFT(content)} 
                            disabled={isMintButtonDisabled}
                            sx={{
                              fontSize: { xs: '1rem', sm: '1rem', md: '1.25rem', lg: '1.5rem' }, 
                              padding: { xs: '8px 16px', sm: '8px 16px', md: '10px 20px', lg: '12px 24px' },
                              minWidth: '150px',
                              height: '45px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            {mintLoadingId === content.id ? <CircularProgress size={24} /> : mintedContents.has(ethers.BigNumber.from(content.id).toString()) ? 'Already Minted' : 'Mint NFT'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
        </Container>
        <Fab
          color="primary"
          aria-label="scroll back to top"
          onClick={scrollToTop}
          style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: showScroll ? 'block' : 'none' }}
        >
          <ArrowUpwardIcon />
        </Fab>
        <Footer />
      </div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>NFT Minting</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {mintStatus}
          </DialogContentText>
          {transactionUrl && (
            <DialogContentText>
              <a href={transactionUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                View on Etherscan
              </a>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
