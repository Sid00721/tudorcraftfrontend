import { createTheme } from '@mui/material/styles';

// Premium Blue & Orange Enterprise Palette
const colors = {
  primary: {
    50: '#EBF0FF',
    100: '#D1DCFF',
    200: '#A6C1FF',
    300: '#7BA5FF',
    400: '#5089FF',
    500: '#2D5BFF', // Primary Blue
    600: '#1E47E6',
    700: '#1538CC',
    800: '#0F2AB3',
    900: '#0A1F99',
  },
  orange: {
    50: '#FFF0EB',
    100: '#FFE0D6',
    200: '#FFC2AD',
    300: '#FFA384',
    400: '#FF855B',
    500: '#FF6B2C', // Accent Orange
    600: '#E55A1F',
    700: '#CC4A15',
    800: '#B23A0C',
    900: '#992D06',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFBFC',
    100: '#F4F6F8',
    200: '#E4E7EB',
    300: '#D1D6DB',
    400: '#9DA4AE',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: {
    50: '#ECFDF5',
    500: '#10B981',
    600: '#059669',
  },
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
  },
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
  },
};

// Premium theme with enterprise-grade styling
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.orange[500],
      light: colors.orange[400],
      dark: colors.orange[600],
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.neutral[50],
      paper: colors.neutral[0],
    },
    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[600],
    },
    divider: colors.neutral[200],
    success: {
      main: colors.success[500],
      light: colors.success[50],
      dark: colors.success[600],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[50],
      dark: colors.warning[600],
    },
    error: {
      main: colors.error[500],
      light: colors.error[50],
      dark: colors.error[600],
    },
    info: {
      main: colors.primary[500],
      light: colors.primary[50],
      dark: colors.primary[600],
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: colors.neutral[700],
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: colors.neutral[600],
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: colors.neutral[500],
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.025em',
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...Array(18).fill('0 25px 50px -12px rgba(0, 0, 0, 0.25)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: colors.neutral[50],
          color: colors.neutral[800],
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.025em',
          boxShadow: 'none',
          minHeight: 44,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(45, 91, 255, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
          color: '#FFFFFF',
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
            boxShadow: '0 8px 24px rgba(45, 91, 255, 0.25)',
          },
          '&:disabled': {
            background: colors.neutral[300],
            color: colors.neutral[500],
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: colors.neutral[300],
          color: colors.neutral[700],
          backgroundColor: colors.neutral[0],
          '&:hover': {
            borderColor: colors.primary[500],
            backgroundColor: colors.primary[50],
            color: colors.primary[600],
            borderWidth: 1,
          },
        },
        text: {
          color: colors.neutral[600],
          '&:hover': {
            backgroundColor: colors.neutral[100],
            color: colors.neutral[800],
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colors.neutral[200]}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          backgroundColor: colors.neutral[0],
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: colors.neutral[0],
          border: `1px solid ${colors.neutral[200]}`,
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: colors.neutral[0],
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: colors.neutral[300],
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: colors.neutral[400],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary[500],
              borderWidth: 2,
              boxShadow: `0 0 0 3px ${colors.primary[50]}`,
            },
            '&.Mui-error fieldset': {
              borderColor: colors.error[500],
            },
            '&.Mui-error.Mui-focused fieldset': {
              boxShadow: `0 0 0 3px ${colors.error[50]}`,
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: colors.neutral[600],
            '&.Mui-focused': {
              color: colors.primary[600],
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.75rem',
            marginTop: 6,
            color: colors.neutral[500],
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontSize: '0.75rem',
          fontWeight: 500,
          height: 28,
        },
        filled: {
          backgroundColor: colors.neutral[100],
          color: colors.neutral[700],
          '&:hover': {
            backgroundColor: colors.neutral[200],
          },
        },
        outlined: {
          borderColor: colors.neutral[300],
          color: colors.neutral[600],
          '&:hover': {
            backgroundColor: colors.neutral[50],
          },
        },
        colorPrimary: {
          backgroundColor: colors.primary[50],
          color: colors.primary[700],
          border: `1px solid ${colors.primary[200]}`,
        },
        colorSecondary: {
          backgroundColor: colors.orange[50],
          color: colors.orange[700],
          border: `1px solid ${colors.orange[200]}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral[0],
          color: colors.neutral[800],
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderBottom: `1px solid ${colors.neutral[200]}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: `1px solid ${colors.neutral[200]}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid',
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: colors.success[50],
          color: colors.neutral[800],
          borderColor: colors.success[200],
          '& .MuiAlert-icon': {
            color: colors.success[600],
          },
        },
        standardError: {
          backgroundColor: colors.error[50],
          color: colors.neutral[800],
          borderColor: colors.error[200],
          '& .MuiAlert-icon': {
            color: colors.error[600],
          },
        },
        standardWarning: {
          backgroundColor: colors.warning[50],
          color: colors.neutral[800],
          borderColor: colors.warning[200],
          '& .MuiAlert-icon': {
            color: colors.warning[600],
          },
        },
        standardInfo: {
          backgroundColor: colors.primary[50],
          color: colors.neutral[800],
          borderColor: colors.primary[200],
          '& .MuiAlert-icon': {
            color: colors.primary[600],
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: colors.neutral[50],
            borderBottom: `2px solid ${colors.neutral[200]}`,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.neutral[600],
            padding: '16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.neutral[200]}`,
          padding: '16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral[200],
          color: colors.neutral[600],
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: colors.neutral[100],
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
});

export default theme;
