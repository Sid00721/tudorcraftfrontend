import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';

// Import MUI Components
import { 
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, CircularProgress, Button, Alert,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function TutorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedTrials, setConfirmedTrials] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  // --- NEW STATE FOR THE CONFIRMATION MODAL ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const fetchAllData = useCallback(async (userId) => {
    // ... (This function remains unchanged)
    const { data: pendingData } = await supabase.from('outreach_attempts').select('id, trial_requests (*)').eq('tutor_id', userId).eq('status', 'pending');
    setPendingRequests(pendingData || []);
    const { data: confirmedData } = await supabase.from('trial_requests').select('*').eq('assigned_tutor_id', userId).eq('status', 'Confirmed');
    setConfirmedTrials(confirmedData || []);
  }, []);

  useEffect(() => {
    // ... (This function remains unchanged)
    const getInitialData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentUserId = session.user.id;
        setUser(session.user);
        const { data: profileData } = await supabase.from('tutors').select('suburb, phone_number').eq('id', currentUserId).single();
        setProfile(profileData);
        await fetchAllData(currentUserId);
      }
      setLoading(false);
    };
    getInitialData();
  }, [fetchAllData]);

  // --- UPDATED RESPONSE HANDLING LOGIC ---

  // This function now just opens the modal
  const handleOpenConfirmModal = (attempt) => {
    setSelectedAttempt(attempt);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedAttempt(null);
  };
  
  // The original API call logic is now here
  const handleFinalConfirm = async () => {
    if (!selectedAttempt) return;
    await handleResponse(selectedAttempt.id, 'accepted');
    handleCloseConfirmModal();
  };

  const handleResponse = async (attemptId, response) => {
    setRespondingId(attemptId);
    try {
      const apiResponse = await fetch(`${API_URL}/api/outreach-attempts/${attemptId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) { throw new Error(data.error || `Failed to submit response.`); }
      alert(`Your response has been recorded. Thank you!`);
      await fetchAllData(user.id);
    } catch (error) {
      console.error('Error responding to outreach:', error);
      alert('Error: ' + error.message);
    }
    setRespondingId(null);
  };

  const isProfileIncomplete = profile && (!profile.suburb || !profile.phone_number);
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* ... Header and Profile Alert are unchanged ... */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Tutor Dashboard</Typography>
        <Button component={Link} to="/tutor/profile" variant="contained">Edit My Profile</Button>
      </Box>
      {isProfileIncomplete && <Alert severity="warning" sx={{ mb: 2 }}>Your profile is incomplete. Please add your suburb and phone number to be eligible for trial lessons.</Alert>}


      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>New Trial Requests</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow><TableCell>Subject</TableCell><TableCell>Location</TableCell><TableCell>Proposed Lesson Time</TableCell><TableCell align="right">Actions</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>{attempt.trial_requests.subject}</TableCell>
                  <TableCell>{attempt.trial_requests.location}</TableCell>
                  <TableCell>
                    {attempt.trial_requests.lesson_datetime ? 
                      formatInTimeZone(new Date(attempt.trial_requests.lesson_datetime), attempt.trial_requests.lesson_timezone, 'd MMM yyyy, h:mm a (zzz)')
                      : 'Not set'
                    }
                  </TableCell>
                  <TableCell align="right">
                    {/* --- THE ACCEPT BUTTON NOW OPENS THE MODAL --- */}
                    <Button variant="contained" color="success" sx={{ mr: 1 }} disabled={respondingId !== null} onClick={() => handleOpenConfirmModal(attempt)}>
                        Accept
                    </Button>
                    <Button variant="outlined" color="error" sx={{ mr: 1 }} disabled={respondingId !== null} onClick={() => handleResponse(attempt.id, 'declined')}>
                        Decline
                    </Button>
                    {attempt.trial_requests.location.toLowerCase() !== 'online' && (
                       <Button variant="outlined" color="info" disabled={respondingId !== null} onClick={() => handleResponse(attempt.id, 'reschedule_requested')}>
                            New Time?
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>You have no new trial requests.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* The Confirmed Trials table is unchanged */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Your Confirmed Trials</Typography>
      {/* ... */}


      {/* --- NEW CONFIRMATION MODAL DIALOG --- */}
      <Dialog open={isConfirmModalOpen} onClose={handleCloseConfirmModal}>
        <DialogTitle>Tutor Commitment Policy: Accepting Students Comes With Responsibility</DialogTitle>
        <DialogContent>
          <DialogContentText>
            When you accept a student, you are making a professional commitment to that family and to Tudorcraft. That means showing up consistently, on time, and prepared — especially during the early stages of the relationship.
            <br/><br/>
            We understand that life happens — illness, family emergencies, and schedule changes. In cases such as these, a 12 hours notice must be provided. A failure to do so is a failure to follow through with your committment and damages the trust we've built with the parent and reflects directly on you, and will result in your deprioritisation when receiving future students.
          </DialogContentText>
          <Typography variant="h6" sx={{ mt: 3 }}>
            Are you 100% sure you can take this student?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmModal}>Cancel</Button>
          <Button onClick={handleFinalConfirm} variant="contained" color="success" disabled={respondingId !== null}>
            {respondingId ? <CircularProgress size={24} color="inherit"/> : "Yes, I can"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}