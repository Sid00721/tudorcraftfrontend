import './App.css'
import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { supabase } from './supabaseClient'
import theme from './theme';
import PremiumHeader from './components/Layout/PremiumHeader';
import ErrorBoundary from './components/Layout/ErrorBoundary';

// Lazy load components for better performance
const Auth = lazy(() => import('./Auth'));
const TutorAuth = lazy(() => import('./TutorAuth'));
const Dashboard = lazy(() => import('./Dashboard'));
const TrialDetails = lazy(() => import('./TrialDetails'));
const SessionDetails = lazy(() => import('./SessionDetails'));
const TutorDashboard = lazy(() => import('./TutorDashboard'));
const TutorProfile = lazy(() => import('./TutorProfile'));
const ResourceManagement = lazy(() => import('./ResourceManagement'));
const ResourceHub = lazy(() => import('./ResourceHub'));
const MessageHistory = lazy(() => import('./MessageHistory'));
const CancellationAnalysis = lazy(() => import('./CancellationAnalysis'));
const RescheduleManager = lazy(() => import('./RescheduleManager'));

// Premium Loading Component with enhanced styling
const PremiumLoader = () => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
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
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
                zIndex: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                padding: 4,
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
        >
            <Box
                sx={{
                    width: 60,
                    height: 60,
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '4px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            />
            <Box
                sx={{
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textAlign: 'center',
                }}
            >
                Loading TutorCraft...
            </Box>
        </Box>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </Box>
);

// Component Loading Fallback
const ComponentLoader = () => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
            borderRadius: 3,
            border: '1px solid rgba(255, 152, 0, 0.2)',
            margin: 2,
        }}
    >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Box sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Loading component...
            </Box>
        </Box>
    </Box>
);

// This component protects Admin routes
function ProtectedAdminRoute({ session }) {
    // In a real app, you'd also check for an admin role here
    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }
    return (
        <>
            <PremiumHeader user={session.user} userRole="admin" />
            <Box component="main" sx={{ minHeight: 'calc(100vh - 72px)' }}>
                <Suspense fallback={<ComponentLoader />}>
                    <Outlet />
                </Suspense>
            </Box>
        </>
    );
}

// This component protects Tutor routes
function ProtectedTutorRoute({ session }) {
    if (!session) {
        return <Navigate to="/tutor/login" replace />;
    }
    return (
        <>
            <PremiumHeader user={session.user} userRole="tutor" />
            <Box component="main" sx={{ minHeight: 'calc(100vh - 72px)' }}>
                <Suspense fallback={<ComponentLoader />}>
                    <Outlet />
                </Suspense>
            </Box>
        </>
    );
}

export default function App() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, [])

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <PremiumLoader />
            </ThemeProvider>
        );
    }

    return (
        <ErrorBoundary>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        {/* Admin Routes */}
                        <Route 
                            path="/admin/login" 
                            element={
                                !session ? (
                                    <Suspense fallback={<PremiumLoader />}>
                                        <Auth />
                                    </Suspense>
                                ) : (
                                    <Navigate to="/" />
                                )
                            } 
                        />
                        <Route element={<ProtectedAdminRoute session={session} />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/trial/:trialId" element={<TrialDetails />} />
                            <Route path="/session/:sessionId" element={<SessionDetails />} />
                            <Route path="/admin/resources" element={<ResourceManagement />} />
                            <Route path="/admin/messages" element={<MessageHistory />} />
                            <Route path="/admin/cancellations" element={<CancellationAnalysis />} />
                            <Route path="/admin/reschedules" element={<RescheduleManager />} />
                        </Route>

                        {/* Tutor Routes */}
                        <Route 
                            path="/tutor/login" 
                            element={
                                !session ? (
                                    <Suspense fallback={<PremiumLoader />}>
                                        <TutorAuth />
                                    </Suspense>
                                ) : (
                                    <Navigate to="/tutor/dashboard" />
                                )
                            } 
                        />
                        <Route element={<ProtectedTutorRoute session={session} />}>
                            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
                            <Route path="/tutor/profile" element={<TutorProfile />} />
                            <Route path="/tutor/resources" element={<ResourceHub />} />
                        </Route>

                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </ErrorBoundary>
    )
}