import { useState } from 'react'
import { supabase } from './supabaseClient'
import {
    Box,
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    Alert,
    Fade,
    CircularProgress,
    Divider,
    Link,
    Container,
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    LockReset as LockResetIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)

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
            
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
                <Fade in={true} timeout={600}>
                    <Card
                        sx={{
                            maxWidth: 440,
                            margin: '0 auto',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E4E7EB',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            borderRadius: 3,
                        }}
                    >
                        <CardContent sx={{ p: 6 }}>
                            {/* Header */}
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

                            {/* Alerts */}
                            {error && (
                                <Fade in={true}>
                                    <Alert severity="error" sx={{ mb: 3 }}>
                                        {error}
                                    </Alert>
                                </Fade>
                            )}
                            {success && (
                                <Fade in={true}>
                                    <Alert severity="success" sx={{ mb: 3 }}>
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
                                {/* Email Field */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: '#374151',
                                            mb: 1,
                                        }}
                                    >
                                        Email address
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="Enter your email"
                                        InputProps={{
                                            startAdornment: (
                                                <EmailIcon sx={{ color: '#9DA4AE', mr: 1, fontSize: 20 }} />
                                            ),
                                        }}
                                    />
                                </Box>

                                {/* Password Field */}
                                {!isForgotPassword && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: '#374151',
                                                mb: 1,
                                            }}
                                        >
                                            Password
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="Enter your password"
                                            InputProps={{
                                                startAdornment: (
                                                    <LockIcon sx={{ color: '#9DA4AE', mr: 1, fontSize: 20 }} />
                                                ),
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Forgot Password Link */}
                                {!isSignUp && !isForgotPassword && (
                                    <Box sx={{ textAlign: 'right', mb: 4 }}>
                                        <Link
                                            component="button"
                                            type="button"
                                            onClick={() => setIsForgotPassword(true)}
                                            sx={{
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#2D5BFF',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                },
                                            }}
                                        >
                                            Forgot password?
                                        </Link>
                                    </Box>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        py: 1.5,
                                        mb: 4,
                                        background: 'linear-gradient(135deg, #2D5BFF 0%, #1E47E6 100%)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #1E47E6 0%, #1538CC 100%)',
                                        },
                                    }}
                                >
                                    {loading ? 'Processing...' : (
                                        isForgotPassword ? 'Send reset email' : 
                                        isSignUp ? 'Create account' : 
                                        'Sign in'
                                    )}
                                </Button>

                                {/* Toggle Auth Mode */}
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {isForgotPassword ? 'Remember your password?' :
                                         isSignUp ? 'Already have an account?' : 
                                         'Need an account?'}
                                    </Typography>
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            if (isForgotPassword) {
                                                setIsForgotPassword(false)
                                            } else {
                                                setIsSignUp(!isSignUp)
                                            }
                                            setError('')
                                            setSuccess('')
                                        }}
                                        sx={{
                                            fontWeight: 600,
                                            color: '#2D5BFF',
                                        }}
                                    >
                                        {isForgotPassword ? 'Back to sign in' :
                                         isSignUp ? 'Sign in instead' : 
                                         'Create account'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Fade>
            </Container>
        </Box>
    )
}
