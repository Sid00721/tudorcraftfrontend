import { useState } from 'react';
import { supabase } from './supabaseClient';
import {
    Box,
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    Avatar,
    Alert,
    Fade,
    Zoom,
    CircularProgress,
    Divider,
    useTheme,
} from '@mui/material';
import {
    School as SchoolIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

export default function TutorAuth() {
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const theme = useTheme();

    const handleAuthAction = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.error_description || error.message);
        } else {
            // Handle Sign Up
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'tutor'
                    }
                }
            });
            if (error) {
                setError(error.error_description || error.message);
            } else {
                alert('Signup successful! Please check your email to verify your account.');
                setIsLogin(true);
            }
        }
        setLoading(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2196F3 0%, #FF9800 100%)',
                padding: 2,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                    zIndex: 1,
                },
            }}
        >
            <Fade in={true} timeout={800}>
                <Card
                    sx={{
                        maxWidth: 480,
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 4,
                        boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        position: 'relative',
                        zIndex: 2,
                        overflow: 'visible',
                    }}
                >
                    <CardContent sx={{ p: 6 }}>
                        {/* Logo and Header */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Zoom in={true} timeout={600}>
                                <Avatar
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        margin: '0 auto 24px',
                                        background: 'linear-gradient(135deg, #2196F3 0%, #FF9800 100%)',
                                        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
                                    }}
                                >
                                    <SchoolIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                            </Zoom>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #2196F3 0%, #FF9800 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                }}
                            >
                                TutorCraft
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    mb: 1,
                                }}
                            >
                                Tutor Portal
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                {isLogin ? 'Welcome back, educator!' : 'Join our teaching community'}
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Fade in={true}>
                                <Alert 
                                    severity="error" 
                                    sx={{ 
                                        mb: 3, 
                                        borderRadius: 2,
                                        '& .MuiAlert-icon': {
                                            fontSize: 20,
                                        }
                                    }}
                                >
                                    {error}
                                </Alert>
                            </Fade>
                        )}

                        {/* Form */}
                        <Box
                            component="form"
                            onSubmit={handleAuthAction}
                            sx={{ width: '100%' }}
                        >
                            {!isLogin && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: 'text.primary',
                                            mb: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <PersonIcon sx={{ fontSize: 18 }} />
                                        Full Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        placeholder="Enter your full name"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                backgroundColor: 'rgba(248, 249, 250, 0.8)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(0, 0, 0, 0.12)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: theme.palette.secondary.main,
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.secondary.main,
                                                    borderWidth: '2px',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            )}

                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        mb: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <EmailIcon sx={{ fontSize: 18 }} />
                                    Email Address
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email address"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: 'rgba(248, 249, 250, 0.8)',
                                            '& fieldset': {
                                                borderColor: 'rgba(0, 0, 0, 0.12)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.secondary.main,
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: theme.palette.secondary.main,
                                                borderWidth: '2px',
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        mb: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <LockIcon sx={{ fontSize: 18 }} />
                                    Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            backgroundColor: 'rgba(248, 249, 250, 0.8)',
                                            '& fieldset': {
                                                borderColor: 'rgba(0, 0, 0, 0.12)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.secondary.main,
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: theme.palette.secondary.main,
                                                borderWidth: '2px',
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SchoolIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #2196F3 0%, #FF9800 100%)',
                                    boxShadow: '0px 8px 24px rgba(33, 150, 243, 0.3)',
                                    mb: 3,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1976D2 0%, #F57C00 100%)',
                                        boxShadow: '0px 12px 32px rgba(33, 150, 243, 0.4)',
                                        transform: 'translateY(-2px)',
                                    },
                                    '&:disabled': {
                                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.5) 0%, rgba(255, 152, 0, 0.5) 100%)',
                                        color: 'white',
                                    },
                                    transition: 'all 0.3s ease-in-out',
                                }}
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Sign In to Dashboard' : 'Create Tutor Account')}
                            </Button>

                            <Divider sx={{ mb: 3, '&::before, &::after': { borderColor: 'rgba(0, 0, 0, 0.12)' } }}>
                                <Typography variant="body2" color="text.secondary" sx={{ px: 2, fontWeight: 500 }}>
                                    or
                                </Typography>
                            </Divider>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setIsLogin(!isLogin)}
                                startIcon={isLogin ? <PersonAddIcon /> : <PersonIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderWidth: '2px',
                                    borderColor: theme.palette.secondary.main,
                                    color: theme.palette.secondary.main,
                                    '&:hover': {
                                        borderWidth: '2px',
                                        borderColor: theme.palette.secondary.dark,
                                        backgroundColor: 'rgba(33, 150, 243, 0.04)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                            </Button>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Join thousands of educators on TutorCraft
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Fade>
        </Box>
    );
}