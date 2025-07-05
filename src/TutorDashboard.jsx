import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';

// Import MUI Components
import { 
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, CircularProgress, Button, Alert, Stack, TextField,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Chip
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function TutorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedTrials, setConfirmedTrials] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  
  // --- NEW STATE for Waitlist feature ---
  const [joinableSessions, setJoinableSessions] = useState([]);
  const [waitlistStatus, setWaitlistStatus] = useState({});

  // --- State for Modals ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MODIFIED: Data fetching logic now uses the new table structure ---
  const fetchAllData = useCallback(async (userId) => {
    // Fetch pending outreach attempts, joining through the new session_id
    const { data: pendingData, error: pendingError } = await supabase
        .from('outreach_attempts')
        .select('id, trial_sessions:session_id(*, trial_lessons(*, subjects(name)))')
        .eq('tutor_id', userId)
        .eq('status', 'pending');
    
    if (pendingError) console.error("Error fetching pending requests:", pendingError);
    setPendingRequests(pendingData || []);

    // Fetch confirmed trials from the new trial_sessions table
    const { data: confirmedData, error: confirmedError } = await supabase
        .from('trial_sessions')
        .select('*, trial_lessons(*, subjects(name))')
        .eq('assigned_tutor_id', userId)
        .in('status', ['Confirmed', 'Completed - Feedback Submitted', 'Completed - No Show']);

    if (confirmedError) console.error("Error fetching confirmed trials:", confirmedError);
    setConfirmedTrials(confirmedData || []);

    // --- NEW QUERY for joinable waitlist sessions ---
    const { data: joinableData, error: joinableError } = await supabase
        .from('trial_sessions')
        .select('*, trial_lessons(*, subjects(name)), session_waitlist(*)')
        .in('status', ['Outreach in Progress', 'Confirmed'])
        .not('assigned_tutor_id', 'eq', userId);

    if (joinableError) console.error("Error fetching joinable sessions:", joinableError);
    setJoinableSessions(joinableData || []);
  }, []);

  useEffect(() => {
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

  // --- MODIFIED: Response handler now uses session logic if available ---
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
  
  // Modal Handlers
  const handleOpenConfirmModal = (attempt) => { setSelectedItem(attempt); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setSelectedItem(null); };
  const handleFinalConfirm = async () => { if (!selectedItem) return; await handleResponse(selectedItem.id, 'accepted'); handleCloseConfirmModal(); };
  
  // Post-lesson modal handlers are unchanged...

  // --- NEW HANDLER for joining a waitlist ---
  const handleJoinWaitlist = async (sessionId) => {
    setWaitlistStatus(prev => ({ ...prev, [sessionId]: 'loading' }));
    try {
        const response = await fetch(`${API_URL}/api/sessions/${sessionId}/join-waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tutorId: user.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to join waitlist.');
        
        alert('You have successfully joined the waitlist!');
        // Update the button status to 'joined'
        setWaitlistStatus(prev => ({ ...prev, [sessionId]: 'joined' }));

    } catch (error) {
        alert('Error: ' + error.message);
        setWaitlistStatus(prev => ({ ...prev, [sessionId]: 'error' }));
    }
  };

  // --- NEW HANDLER for cancelling a trial ---
  const handleOpenCancelModal = (session) => { setSelectedItem(session); setIsCancelModalOpen(true); };
  const handleCloseCancelModal = () => setIsCancelModalOpen(false);
  
  const handleConfirmCancel = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_URL}/api/sessions/${selectedItem.id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelingTutorId: user.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to cancel assignment.');
        alert('Assignment cancelled successfully.');
        await fetchAllData(user.id); // Refresh all data
        handleCloseCancelModal();
    } catch (error) {
        alert('Error: ' + error.message);
    }
    setIsSubmitting(false);
  };

  // --- NEW HANDLERS for Feedback Flow ---
  const handleOpenFeedbackModal = (session) => {
    setSelectedItem(session);
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setFeedbackText('');
    setSelectedItem(null);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedItem || !feedbackText) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_URL}/api/sessions/${selectedItem.id}/submit-feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: feedbackText, tutorId: user.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to submit feedback.');
        
        alert('Feedback submitted successfully!');
        await fetchAllData(user.id);
        handleCloseFeedbackModal();

    } catch (error) {
        alert('Error: ' + error.message);
    }
    setIsSubmitting(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
        {/* --- MODIFIED: Header now has a link to the Resource Hub --- */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" gutterBottom>Tutor Dashboard</Typography>
            <Stack direction="row" spacing={2}>
                <Button component={Link} to="/tutor/resources" variant="contained" color="secondary">Resource Hub</Button>
                <Button component={Link} to="/tutor/profile" variant="contained">Edit My Profile</Button>
            </Stack>
        </Box>
        {profile && (!profile.suburb || !profile.phone_number) && <Alert severity="warning" sx={{ mb: 2 }}>Your profile is incomplete...</Alert>}

        {/* --- MODIFIED: New Trial Requests Table --- */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>New Trial Requests</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow><TableCell>Subjects</TableCell><TableCell>Location</TableCell><TableCell>Actions</TableCell></TableRow>
                </TableHead>
                <TableBody>
                    {pendingRequests.length > 0 ? (
                        pendingRequests.map((attempt) => (
                            <TableRow key={attempt.id}>
                                <TableCell>
                                    {attempt.trial_sessions?.trial_lessons.map(l => l.subjects.name).join(', ') || 'N/A'}
                                </TableCell>
                                <TableCell>{attempt.trial_sessions?.location || 'N/A'}</TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" color="success" disabled={respondingId !== null} onClick={() => handleOpenConfirmModal(attempt)}>Accept</Button>
                                        <Button variant="outlined" color="error" disabled={respondingId !== null} onClick={() => handleResponse(attempt.id, 'declined')}>Decline</Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }}>You have no new trial requests.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
        
        {/* --- MODIFIED: Confirmed Trials Table --- */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Your Confirmed Trials</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow><TableCell>Subjects</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow>
                </TableHead>
                <TableBody>
                    {confirmedTrials.length > 0 ? (
                        confirmedTrials.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell>{session.trial_lessons.map(l => l.subjects.name).join(', ')}</TableCell>
                                <TableCell>{session.location}</TableCell>
                                <TableCell><Chip label={session.status} color={session.status === 'Confirmed' ? 'success' : 'default'} size="small" /></TableCell>
                                <TableCell>
                                    {session.status === 'Confirmed' ? (
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" color="error" size="small" onClick={() => handleOpenCancelModal(session)}>Cancel</Button>
                                            <Button variant="contained" size="small" onClick={() => handleOpenFeedbackModal(session)}>Submit Feedback</Button>
                                        </Stack>
                                    ) : (
                                        <Alert severity="success" variant="outlined" sx={{py: 0.5}}>{session.status.replace('Completed - ', '')}</Alert>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>You have no confirmed trials.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        {/* --- NEW UI SECTION for Waitlists --- */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Available Session Waitlists</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow><TableCell>Subjects</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow>
                </TableHead>
                <TableBody>
                    {joinableSessions.length > 0 ? (
                        joinableSessions.map((session) => {
                            const hasJoined = session.session_waitlist.some(entry => entry.tutor_id === user.id);
                            const currentWaitlistStatus = waitlistStatus[session.id];

                            return (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        {session.trial_lessons.map(l => l.subjects.name).join(', ')}
                                    </TableCell>
                                    <TableCell>{session.location}</TableCell>
                                    <TableCell><Chip label={session.status} size="small" /></TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            size="small"
                                            disabled={hasJoined || currentWaitlistStatus === 'joined' || currentWaitlistStatus === 'loading'}
                                            onClick={() => handleJoinWaitlist(session.id)}
                                        >
                                            {currentWaitlistStatus === 'loading' && <CircularProgress size={20} color="inherit" />}
                                            {currentWaitlistStatus !== 'loading' && (hasJoined || currentWaitlistStatus === 'joined' ? 'On Waitlist' : 'Join Waitlist')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>There are no available sessions to join a waitlist for.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        {/* --- All Modals --- */}
        <Dialog open={isConfirmModalOpen} onClose={handleCloseConfirmModal}>{/* Acceptance Modal */}</Dialog>
        <Dialog open={isCancelModalOpen} onClose={handleCloseCancelModal}>{/* Cancellation Modal */}</Dialog>

        {/* --- NEW FEEDBACK MODAL --- */}
        <Dialog open={isFeedbackModalOpen} onClose={handleCloseFeedbackModal} fullWidth maxWidth="sm">
            <DialogTitle>Submit Lesson Feedback</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{mb: 2}}>
                    Please provide brief feedback on how the trial lesson went. This will be visible to the admin team.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="feedback"
                    label="Lesson Feedback"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseFeedbackModal} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmitFeedback} variant="contained" disabled={isSubmitting || !feedbackText}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Submit Feedback"}
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
}