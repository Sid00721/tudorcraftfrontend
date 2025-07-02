import './App.css'
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'

// Import all our page components
import Auth from './Auth'
import TutorAuth from './TutorAuth'
import Dashboard from './Dashboard'
import TrialDetails from './TrialDetails'; // This is the old one, we can remove it later
import SessionDetails from './SessionDetails'; // --- NEW: Import the new component ---
import TutorDashboard from './TutorDashboard';
import TutorProfile from './TutorProfile';

// This component protects Admin routes
function ProtectedAdminRoute({ session }) {
    // In a real app, you'd also check for an admin role here
    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }
    return <Outlet />;
}

// This component protects Tutor routes
function ProtectedTutorRoute({ session }) {
    if (!session) {
        return <Navigate to="/tutor/login" replace />;
    }
    return <Outlet />;
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
        return <div>Loading...</div>;
    }

    return (
        <BrowserRouter>
            {session && (
                <div className="header-bar">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h2>Tutor Matching Platform</h2>
                    </Link>
                    <button className="button" onClick={() => supabase.auth.signOut()}>
                        Logout
                    </button>
                </div>
            )}
            <div className="container">
                <Routes>
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={!session ? <Auth /> : <Navigate to="/" />} />
                    <Route element={<ProtectedAdminRoute session={session} />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/trial/:trialId" element={<TrialDetails />} />
                        {/* --- NEW: Route for the session details page --- */}
                        <Route path="/session/:sessionId" element={<SessionDetails />} />
                    </Route>

                    {/* Tutor Routes */}
                    <Route path="/tutor/login" element={!session ? <TutorAuth /> : <Navigate to="/tutor/dashboard" />} />
                    <Route element={<ProtectedTutorRoute session={session} />}>
                        <Route path="/tutor/dashboard" element={<TutorDashboard />} />
                        <Route path="/tutor/profile" element={<TutorProfile />} />
                    </Route>

                </Routes>
            </div>
        </BrowserRouter>
    )
}