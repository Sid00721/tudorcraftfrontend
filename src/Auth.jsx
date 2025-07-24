import { useState } from 'react'
import { supabase } from './supabaseClient'
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
} from '@mui/material';
import {
    AdminPanelSettings as AdminIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    School as SchoolIcon,
} from '@mui/icons-material';

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const theme = useTheme();

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
            setError(error.error_description || error.message)
        } else {
            setError('')
            alert('Sign up successful! Please check your email to verify your account.')
            setIsSignUp(false)
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
                                        background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
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
                                    background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
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
                                Admin Portal
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                {isSignUp ? 'Create your admin account' : 'Sign in to your account'}
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
                            onSubmit={isSignUp ? handleSignUp : handleLogin}
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

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AdminIcon />}
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
                                {loading ? 'Processing...' : (isSignUp ? 'Create Admin Account' : 'Sign In to Dashboard')}
                            </Button>

                            <Divider sx={{ mb: 3, '&::before, &::after': { borderColor: 'rgba(0, 0, 0, 0.12)' } }}>
                                <Typography variant="body2" color="text.secondary" sx={{ px: 2, fontWeight: 500 }}>
                                    or
                                </Typography>
                            </Divider>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setIsSignUp(!isSignUp)}
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
                                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
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
}