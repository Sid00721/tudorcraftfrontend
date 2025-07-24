import React from 'react';
import { Box, Typography, Button, Card, CardContent, Avatar, Stack } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Error caught by boundary:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
                        padding: 2,
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                            zIndex: 1,
                        },
                    }}
                >
                    <Card
                        sx={{
                            maxWidth: 600,
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: 4,
                            boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        <CardContent sx={{ p: 6, textAlign: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    margin: '0 auto 24px',
                                    background: 'linear-gradient(135deg, #F44336 0%, #FF9800 100%)',
                                    boxShadow: '0px 8px 24px rgba(244, 67, 54, 0.3)',
                                }}
                            >
                                <ErrorIcon sx={{ fontSize: 40 }} />
                            </Avatar>

                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #F44336 0%, #FF9800 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 2,
                                }}
                            >
                                Oops! Something went wrong
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'text.secondary',
                                    mb: 4,
                                    fontWeight: 500,
                                }}
                            >
                                We encountered an unexpected error. Don't worry, our team has been notified and we're working on fixing it.
                            </Typography>

                            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshIcon />}
                                    onClick={this.handleRetry}
                                    sx={{
                                        borderRadius: 3,
                                        px: 3,
                                        py: 1.5,
                                        background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #F57C00 0%, #1976D2 100%)',
                                            transform: 'translateY(-2px)',
                                        },
                                        transition: 'all 0.3s ease-in-out',
                                    }}
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<HomeIcon />}
                                    onClick={this.handleGoHome}
                                    sx={{
                                        borderRadius: 3,
                                        px: 3,
                                        py: 1.5,
                                        borderWidth: '2px',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderWidth: '2px',
                                            transform: 'translateY(-2px)',
                                        },
                                        transition: 'all 0.3s ease-in-out',
                                    }}
                                >
                                    Go Home
                                </Button>
                            </Stack>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Box
                                    sx={{
                                        textAlign: 'left',
                                        background: 'rgba(244, 67, 54, 0.1)',
                                        border: '1px solid rgba(244, 67, 54, 0.3)',
                                        borderRadius: 2,
                                        p: 2,
                                        mt: 3,
                                        maxHeight: 200,
                                        overflow: 'auto',
                                    }}
                                >
                                    <Typography variant="subtitle2" color="error" fontWeight={600} mb={1}>
                                        Error Details (Development Only):
                                    </Typography>
                                    <Typography variant="body2" color="error" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {this.state.error.toString()}
                                        {this.state.errorInfo.componentStack}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 