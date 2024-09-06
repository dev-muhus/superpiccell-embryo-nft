import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Container, Grid, Card, CardContent, Typography, CircularProgress, Fab, Box, Link, ThemeProvider } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import spenContractData from '../../public/SPEN.json';
import Header from './components/Header';
import Footer from './components/Footer';
import { useWallet } from '../contexts/WalletContext';
import theme from '../styles/theme';

const SPEN_ABI = spenContractData.abi;
const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const etherscanURL = process.env.NEXT_PUBLIC_ETHERSCAN_URL;
const openseaURL = process.env.NEXT_PUBLIC_OPENSEA_URL;

export default function NFTList() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScroll, setShowScroll] = useState(false);
  const { userAccount, requestAccount, checkNetwork, networkMismatch, callContractMethod } = useWallet();

  const isValidTokenId = async (contract, tokenId) => {
    try {
      const tokenOwner = await contract.ownerOf(tokenId);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const fetchNFTs = async (userAddress) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(nftContractAddress, SPEN_ABI, provider);
  
    try {
      const totalSupply = await callContractMethod(contract, 'totalSupply');
      if (totalSupply === false) {
          setError('Network mismatch or error occurred while fetching NFTs. Please switch to the correct network.');
          return [];
      }
      const nftPromises = [];
  
      for (let i = 0; i < totalSupply; i++) {
        if (await isValidTokenId(contract, i)) {
          const tokenURI = await contract.tokenURI(i);
          const owner = await contract.ownerOf(i);
          nftPromises.push({ tokenId: i, tokenURI, owner });
        } else {
          console.warn(`Token ID ${i} is invalid or does not exist.`);
        }
      }
  
      const nfts = await Promise.all(nftPromises.map(async ({ tokenId, tokenURI, owner }) => {
        const metadata = JSON.parse(tokenURI);
        return { tokenId, metadata, owner, isOwnedByUser: owner.toLowerCase() === userAddress.toLowerCase() };
      }));
  
      return nfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  };

  const loadNFTs = async () => {
    if (networkMismatch) {
      console.error('Network mismatch. Cannot load NFTs.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const nftData = await fetchNFTs(userAccount);
    setNfts(nftData);
    setLoading(false);
  };

  useEffect(() => {
    const initConnection = async () => {
      await requestAccount();
      setLoading(false);
    };
    initConnection();
  }, []);

  useEffect(() => {
    if (userAccount && !networkMismatch) {
      loadNFTs();
    }
  }, [userAccount, networkMismatch]);

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

  const headerImageUrl = process.env.NEXT_PUBLIC_HEADER_IMAGE_URL;
  const backgroundColor = process.env.NEXT_PUBLIC_BACKGROUND_COLOR || 'transparent';
  const backgroundImageUrl = process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL || '';

  const backgroundStyle = backgroundImageUrl
    ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: backgroundColor };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{ ...backgroundStyle, minHeight: '100vh', padding: '0', display: 'flex', flexDirection: 'column' }}>
        <Header isMintPage={false} onReload={loadNFTs} />
        <Container style={{ paddingTop: '64px', paddingBottom: '64px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
              <Typography variant="h6" style={{ marginLeft: '10px' }}>Loading contents...</Typography>
            </Box>
          ) : (
            <Grid container spacing={3} style={{ marginTop: '20px' }}>
              {nfts.map((nft, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card style={{ position: 'relative' }}>
                    <CardContent>
                      {nft.metadata ? (
                        <>
                          <Typography variant="h5" component="h2">
                            <Link href={`${openseaURL}/${nftContractAddress}/${nft.tokenId}`} target="_blank" rel="noopener noreferrer">
                              {nft.metadata.name}
                            </Link>
                          </Typography>
                          <Typography variant="body2" color="textSecondary" component="p">
                            <Link href={`${etherscanURL}/${nftContractAddress}/${nft.tokenId}`} target="_blank" rel="noopener noreferrer">
                              <strong>Token ID:</strong> {nft.tokenId}
                            </Link>
                          </Typography>
                          {/* Conditionally render the image only if it exists */}
                          {nft.metadata.image && nft.metadata.image !== 'No Image' && (
                            <img src={nft.metadata.image} alt={nft.metadata.name} style={{ width: '100%', height: 'auto' }} />
                          )}
                          {nft.metadata.attributes && nft.metadata.attributes.map((attr, idx) => (
                            <Typography key={idx} variant="body2" component="p">
                              <strong>{attr.trait_type}:</strong> {attr.value}
                            </Typography>
                          ))}
                          {nft.metadata.description && (
                            <Typography variant="body2" component="p">
                              <strong>Description:</strong> {nft.metadata.description}
                            </Typography>
                          )}
                          {nft.isOwnedByUser && (
                            <Typography className="owned-badge">
                              Owned by you
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="error">
                          Error loading metadata for token ID {nft.tokenId}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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
    </ThemeProvider>
  );
}
