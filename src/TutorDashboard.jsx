import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

// Import MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function TutorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedTrials, setConfirmedTrials] = useState([]);
  const [respondingId, setRespondingId] = useState(null); // To show loading on a specific button

  const fetchAllData = useCallback(async (userId) => {
    // Fetch pending outreach attempts
    const { data: pendingData, error: pendingError } = await supabase
      .from('outreach_attempts')
      .select('id, trial_requests (*)')
      .eq('tutor_id', userId)
      .eq('status', 'pending');
    if (pendingError) console.error('Error fetching pending requests:', pendingError);
    else setPendingRequests(pendingData || []);

    // Fetch confirmed trials
    const { data: confirmedData, error: confirmedError } = await supabase
      .from('trial_requests')
      .select('*')
      .eq('assigned_tutor_id', userId)
      .eq('status', 'Confirmed');
    if (confirmedError) console.error('Error fetching confirmed trials:', confirmedError);
    else setConfirmedTrials(confirmedData || []);
  }, []);

  useEffect(() => {
    const getInitialData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase.from('tutors').select('suburb, phone_number').eq('id', session.user.id).single();
        setProfile(profileData);
        await fetchAllData(session.user.id);
      }
      setLoading(false);
    };
    getInitialData();
  }, [fetchAllData]);

  // --- NEW FUNCTION TO HANDLE ACCEPT/DECLINE ---
  const handleResponse = async (attemptId, response) => {
    setRespondingId(attemptId); // Show loading spinner on the button
    try {
      const apiResponse = await fetch(`${API_URL}/api/outreach-attempts/${attemptId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }), // "accepted" or "declined"
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) {
        throw new Error(data.error || `Failed to submit response.`);
      }

      alert(`You have successfully ${response} the trial.`);
      // Refresh the data on the page to show the change
      await fetchAllData(user.id);

    } catch (error) {
      console.error('Error responding to outreach:', error);
      alert('Error: ' + error.message);
    }
    setRespondingId(null); // Hide loading spinner
  };

  const isProfileIncomplete = profile && (!profile.suburb || !profile.phone_number);
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Tutor Dashboard</Typography>
        <Button component={Link} to="/tutor/profile" variant="contained">Edit My Profile</Button>
      </Box>

      {isProfileIncomplete && <Alert severity="warning" sx={{ mb: 2 }}>Your profile is incomplete. Please add your suburb and phone number to be eligible for trial lessons.</Alert>}

      {/* --- PENDING REQUESTS SECTION --- */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>New Trial Requests</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Subject</TableCell><TableCell>Location</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>{attempt.trial_requests.subject}</TableCell>
                  <TableCell>{attempt.trial_requests.location}</TableCell>
                  <TableCell align="right">
                    {/* --- UPDATED BUTTONS --- */}
                    <Button 
                      variant="contained" 
                      color="success" 
                      sx={{ mr: 1 }} 
                      disabled={respondingId !== null}
                      onClick={() => handleResponse(attempt.id, 'accepted')}
                    >
                      {respondingId === attempt.id ? <CircularProgress size={24} color="inherit"/> : 'Accept'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      disabled={respondingId !== null}
                      onClick={() => handleResponse(attempt.id, 'declined')}
                    >
                      {respondingId === attempt.id ? <CircularProgress size={24} color="inherit"/> : 'Decline'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan="3" align="center" sx={{ py: 3 }}>You have no new trial requests.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- CONFIRMED TRIALS SECTION --- */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Your Confirmed Trials</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Subject</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Date Confirmed</TableCell></TableRow></TableHead>
          <TableBody>
            {confirmedTrials.length > 0 ? (
              confirmedTrials.map((trial) => (
                <TableRow key={trial.id}><TableCell>{trial.subject}</TableCell><TableCell>{trial.location}</TableCell><TableCell>{trial.status}</TableCell><TableCell>{new Date(trial.created_at).toLocaleDateString()}</TableCell></TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan="4" align="center" sx={{ py: 3 }}>You have no confirmed trials yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}