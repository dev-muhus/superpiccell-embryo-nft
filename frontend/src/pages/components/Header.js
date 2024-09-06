import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import Link from 'next/link';
import { useWallet } from '../../contexts/WalletContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function Header({ isMintPage, handleDisconnect, onReload }) {
    const { userAccount, requestAccount, message, setMessage, open, setOpen } = useWallet();
    const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE;
    const headerTextColor = process.env.NEXT_PUBLIC_HEADER_TEXT_COLOR || '#ffffff';
    const headerBackgroundColor = process.env.NEXT_PUBLIC_HEADER_BACKGROUND_COLOR || '#333333';

    const iconStyle = {
        color: headerTextColor,
        fontSize: '2rem',
    };

    const buttonStyle = {
        fontSize: '2rem',
        padding: '16px',
        '& svg': {
            fontSize: '2rem',
        },
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
        }
    };

    const handleClose = () => {
        setOpen(false);
        setMessage(''); // Clear the message
    };

    const handleConnectWallet = () => {
        if (typeof window.ethereum === 'undefined') {
            setMessage('MetaMask is not installed. Please install MetaMask to use this feature.');
            setOpen(true); // Open dialog
        } else {
            requestAccount();
        }
    };

    return (
        <AppBar position="fixed" style={{ backgroundColor: headerBackgroundColor, boxShadow: 'none' }}>
            <Toolbar>
                <Typography variant="h6" style={{ flexGrow: 1, color: headerTextColor }}>
                    {siteTitle}
                </Typography>
                <Box sx={{ display: 'flex', gap: '15px' }}>
                    {isMintPage && userAccount && (
                        <Tooltip title="View Minted NFTs">
                            <Link href="/nft-list" passHref>
                                <IconButton sx={buttonStyle}>
                                    <ListAltIcon sx={iconStyle} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                    )}
                    {!isMintPage && (
                        <>
                            <Tooltip title="Back to Mint Page">
                                <Link href="/" passHref>
                                    <IconButton sx={buttonStyle}>
                                        <HomeIcon sx={iconStyle} />
                                    </IconButton>
                                </Link>
                            </Tooltip>
                            <Tooltip title="Reload">
                                <IconButton onClick={onReload} sx={buttonStyle}>
                                    <RefreshIcon sx={iconStyle} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    {isMintPage && (
                        userAccount ? (
                            <Tooltip title="Disconnect Wallet">
                                <IconButton sx={buttonStyle} onClick={handleDisconnect}>
                                    <ExitToAppIcon sx={iconStyle} />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <Tooltip title="Connect Wallet">
                                <IconButton sx={buttonStyle} onClick={handleConnectWallet}>
                                    <AccountBalanceWalletIcon sx={iconStyle} />
                                </IconButton>
                            </Tooltip>
                        )
                    )}
                </Box>
            </Toolbar>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Wallet Connection</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
}
