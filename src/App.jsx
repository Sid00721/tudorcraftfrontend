import './App.css'
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'; // Import router components
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import TrialDetails from './TrialDetails'; // We will create this next

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <BrowserRouter>
      <div className="container">
        {!session ? (
          <Auth />
        ) : (
          <div>
            <div className="header-bar">
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2>Tutor Matching Dashboard</h2>
              </Link>
              <button className="button" onClick={() => supabase.auth.signOut()}>
                Logout
              </button>
            </div>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trial/:trialId" element={<TrialDetails />} /> {/* This is the new route for our details page */}
            </Routes>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}

export default App