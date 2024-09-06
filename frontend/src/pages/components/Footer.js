import { Typography, Box } from '@mui/material';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Your Site Name';
  const copyrightName = process.env.NEXT_PUBLIC_COPYRIGHT_NAME || 'Your Company Name';
  const footerTextColor = process.env.NEXT_PUBLIC_FOOTER_TEXT_COLOR || '#000000';
  const footerBackgroundColor = process.env.NEXT_PUBLIC_FOOTER_BACKGROUND_COLOR || '#f8f9fa';

  return (
    <Box
      component="footer"
      sx={{ 
        py: 2, 
        textAlign: 'center', 
        mt: 'auto', 
        backgroundColor: footerBackgroundColor,
        color: footerTextColor
      }}
    >
      <Typography variant="body2">
        &copy; {currentYear} {copyrightName}. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
