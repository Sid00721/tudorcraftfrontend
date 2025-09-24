import './App.css'
import './premium-styles.css'
import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from './supabaseClient'
import theme from './theme-premium';
import PremiumHeader from './components/Layout/PremiumHeader';
import ErrorBoundary from './components/Layout/ErrorBoundary';
import { PageTitleManager } from './components/PageTitleManager';
// import { NotificationProvider } from './components/NotificationSystem';

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
const TutorApprovalManager = lazy(() => import('./TutorApprovalManager'));
const TutorPerformance = lazy(() => import('./TutorPerformance'));

// Premium Enterprise Loading Component
const PremiumLoader = () => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
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
        
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
                zIndex: 2,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E7EB',
                borderRadius: 3,
                padding: 6,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
        >
            {/* Logo */}
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 700,
                    mb: 2,
                }}
            >
                TC
            </Box>
            
            {/* Loading spinner */}
            <CircularProgress 
                size={32} 
                sx={{ 
                    color: '#2D5BFF',
                    mb: 1
                }} 
            />
            
            <Typography
                variant="h6"
                sx={{
                    color: '#111827',
                    fontWeight: 600,
                    textAlign: 'center',
                }}
            >
                Loading TutorCraft
            </Typography>
            
            <Typography
                variant="body2"
                sx={{
                    color: '#6B7280',
                    textAlign: 'center',
                }}
            >
                Preparing your dashboard...
            </Typography>
        </Box>
    </Box>
);

// Premium Component Loading Fallback
const ComponentLoader = () => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            backgroundColor: '#FAFBFC',
            borderRadius: 3,
            border: '1px solid #E4E7EB',
            margin: 2,
        }}
    >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress 
                size={32} 
                sx={{ color: '#2D5BFF' }} 
            />
            <Typography 
                variant="body2" 
                sx={{ 
                    color: '#6B7280', 
                    fontWeight: 500 
                }}
            >
                Loading component...
            </Typography>
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
                    <PageTitleManager>
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
                            <Route path="/admin/approvals" element={<TutorApprovalManager />} />
                            <Route path="/admin/performance" element={<TutorPerformance />} />
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
                    </PageTitleManager>
                </BrowserRouter>
            </ThemeProvider>
        </ErrorBoundary>
    )
}