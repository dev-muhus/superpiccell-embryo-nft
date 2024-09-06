import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          color: '#3498db',
          fontWeight: 'bold',
          transition: 'color 0.3s ease, border-bottom 0.3s ease',
          '&:hover': {
            color: '#2980b9',
            borderBottom: '2px solid #2980b9',
          },
        },
      },
    },
  },
});

export default theme;
