import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { usePageTitle, updateFavicon } from './hooks/usePageTitle'
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Card,
    CardContent,
    Avatar,
    Alert,
    Fade,
    Zoom,
    CircularProgress,
    Divider,
    useTheme,
    Link,
} from '@mui/material';
import {
    AdminPanelSettings as AdminIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    LockReset as LockResetIcon,
} from '@mui/icons-material';

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const theme = useTheme();
    
    // Set dynamic page title based on auth state
    const getTitle = () => {
        if (isForgotPassword) return 'Reset Password';
        if (isSignUp) return 'Create Admin Account';
        return 'Admin Login';
    };
    
    usePageTitle(getTitle());
    
    useEffect(() => {
        updateFavicon('admin');
    }, []);

    const handleLogin = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.error_description || error.message)
        }
        setLoading(false)
    }

    const handleSignUp = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        // Check if email is already registered
        const { data: existingUser } = await supabase.auth.signInWithPassword({
            email,
            password: 'dummy-check' // This will fail but tell us if user exists
        });

        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    role: 'admin'
                }
            }
        })

        if (error) {
            if (error.message.includes('User already registered')) {
                setError('This email address is already registered. Please use the Sign In option instead.')
            } else {
                setError(error.error_description || error.message)
            }
        } else {
            setError('')
            setSuccess('Sign up successful! Please check your email to verify your account.')
            setTimeout(() => {
                setIsSignUp(false)
                setSuccess('')
            }, 3000)
        }
        setLoading(false)
    }

    const handleForgotPassword = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (!email) {
            setError('Please enter your email address first.')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/admin/login`,
        })

        if (error) {
            setError(error.error_description || error.message)
        } else {
            setSuccess('Password reset email sent! Please check your inbox and follow the instructions.')
            setTimeout(() => {
                setIsForgotPassword(false)
                setSuccess('')
            }, 3000)
        }
        setLoading(false)
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #EBF0FF 0%, #FFF0EB 100%)',
                padding: 2,
                position: 'relative',
            }}
        >
            {/* Subtle background pattern */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 25% 25%, rgba(45, 91, 255, 0.05) 0%, transparent 25%),
                        radial-gradient(circle at 75% 75%, rgba(255, 107, 44, 0.05) 0%, transparent 25%)
                    `,
                    zIndex: 1,
                }}
            />
            <Fade in={true} timeout={800}>
                <Card
                    sx={{
                        maxWidth: 440,
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E4E7EB',
                        borderRadius: 3,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        position: 'relative',
                        zIndex: 2,
                    }}
                >
                    <CardContent sx={{ p: 6 }}>
                        {/* Logo and Header */}
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    margin: '0 auto 24px',
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '24px',
                                    fontWeight: 700,
                                }}
                            >
                                TC
                            </Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: '#111827',
                                    mb: 1,
                                }}
                            >
                                TutorCraft
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#6B7280',
                                    fontWeight: 500,
                                }}
                            >
                                {isForgotPassword 
                                    ? 'Reset your password' 
                                    : isSignUp 
                                        ? 'Create your admin account' 
                                        : 'Sign in to continue'
                                }
                            </Typography>
                        </Box>

                        {/* Error & Success Alerts */}
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
                        {success && (
                            <Fade in={true}>
                                <Alert 
                                    severity="success" 
                                    sx={{ 
                                        mb: 3, 
                                        borderRadius: 2,
                                        '& .MuiAlert-icon': {
                                            fontSize: 20,
                                        }
                                    }}
                                >
                                    {success}
                                </Alert>
                            </Fade>
                        )}

                        {/* Form */}
                        <Box
                            component="form"
                            onSubmit={isForgotPassword ? handleForgotPassword : (isSignUp ? handleSignUp : handleLogin)}
                            sx={{ width: '100%' }}
                        >
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
                                                borderColor: theme.palette.primary.main,
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: theme.palette.primary.main,
                                                borderWidth: '2px',
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            {!isForgotPassword && (
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
                                                    borderColor: theme.palette.primary.main,
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: '2px',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Forgot Password Link - only show on login */}
                            {!isSignUp && !isForgotPassword && (
                                <Box sx={{ textAlign: 'right', mb: 3 }}>
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => setIsForgotPassword(true)}
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: theme.palette.primary.main,
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        Forgot your password?
                                    </Link>
                                </Box>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : (isForgotPassword ? <LockResetIcon /> : <AdminIcon />)}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
                                    boxShadow: '0px 8px 24px rgba(255, 152, 0, 0.3)',
                                    mb: 3,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #F57C00 0%, #1976D2 100%)',
                                        boxShadow: '0px 12px 32px rgba(255, 152, 0, 0.4)',
                                        transform: 'translateY(-2px)',
                                    },
                                    '&:disabled': {
                                        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.5) 0%, rgba(33, 150, 243, 0.5) 100%)',
                                        color: 'white',
                                    },
                                    transition: 'all 0.3s ease-in-out',
                                }}
                            >
                                {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Email' : (isSignUp ? 'Create Admin Account' : 'Sign In to Dashboard'))}
                            </Button>

                            <Divider sx={{ mb: 3, '&::before, &::after': { borderColor: 'rgba(0, 0, 0, 0.12)' } }}>
                                <Typography variant="body2" color="text.secondary" sx={{ px: 2, fontWeight: 500 }}>
                                    or
                                </Typography>
                            </Divider>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    if (isForgotPassword) {
                                        setIsForgotPassword(false)
                                        setError('')
                                        setSuccess('')
                                    } else {
                                        setIsSignUp(!isSignUp)
                                        setError('')
                                        setSuccess('')
                                    }
                                }}
                                startIcon={<PersonIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderWidth: '2px',
                                    borderColor: theme.palette.primary.main,
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        borderWidth: '2px',
                                        borderColor: theme.palette.primary.dark,
                                        backgroundColor: 'rgba(255, 152, 0, 0.04)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                {isForgotPassword ? 'Back to Sign In' : (isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up')}
                            </Button>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Secure admin access to TutorCraft platform
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Fade>
        </Box>
    )
}git
