import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { formatInTimeZone } from 'date-fns-tz';
import { usePageTitle } from './hooks/usePageTitle';

// Import MUI Components
import { Box, Button, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, List, ListItem, ListItemText, Chip } from '@mui/material';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Helper function to determine chip color based on log level
const getLogChipColor = (level) => {
  switch (level) {
    case 'SUCCESS': return 'success';
    case 'ERROR': return 'error';
    default: return 'info';
  }
};

export default function TrialDetails() {
  const { trialId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState(null);
  const [matchedTutors, setMatchedTutors] = useState([]);
  
  // Set dynamic page title
  usePageTitle(trial ? `Trial: ${trial.student_name}` : 'Trial Details');
  const [logs, setLogs] = useState([]); // <-- NEW STATE FOR LOGS
  const [isMatching, setIsMatching] = useState(false);
  const [assigningTutorId, setAssigningTutorId] = useState(null);
  const [isStartingOutreach, setIsStartingOutreach] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchTrialDetails = useCallback(async () => {
    // This function now also fetches logs
    const { data, error } = await supabase.from('trial_requests').select('*').eq('id', trialId).single();
    
    if (error) {
      navigate('/');
    } else {
      setTrial(data);
      // --- NEW: FETCH LOGS FOR THIS TRIAL ---
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .eq('trial_request_id', trialId)
        .order('created_at', { ascending: false }); // Newest logs first

      setLogs(logsData || []);
    }
  }, [trialId, navigate]);

  useEffect(() => {
    setLoading(true);
    fetchTrialDetails().finally(() => setLoading(false));
  }, [fetchTrialDetails]);

  const handleFindMatch = async () => {
    setIsMatching(true);
    setMatchedTutors([]);
    try {
      const response = await fetch(`${API_URL}/api/match-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId: trial.id }),
      });
      const data = await response.json();
      if (response.ok && data.matchedTutors) {
        setMatchedTutors(data.matchedTutors);
      } else { throw new Error(data.error || 'Failed to fetch matches.'); }
    } catch (error) {
      alert('Failed to fetch matches. Is the backend server running?');
    }
    setIsMatching(false);
  };
  
  const handleAssignTutor = async (tutorId) => {
    setAssigningTutorId(tutorId);
    try {
      const response = await fetch(`${API_URL}/api/trials/${trialId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || 'Failed to assign tutor.'); }
      alert('Tutor successfully assigned and trial confirmed!');
      navigate('/');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setAssigningTutorId(null);
  };

  const handleStartOutreach = async () => {
    setIsStartingOutreach(true);
    try {
      const response = await fetch(`${API_URL}/api/trials/${trialId}/start-outreach`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || 'Failed to start outreach.'); }
      alert(data.message);
      await fetchTrialDetails();
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsStartingOutreach(false);
  };
  
  const handleRetryOutreach = async () => {
    setIsRetrying(true);
    try {
        const response = await fetch(`${API_URL}/api/trials/${trialId}/retry`, {
            method: 'POST',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to retry outreach.');
        alert(data.message);
        await fetchTrialDetails();
    } catch (error) {
        alert('Error: ' + error.message);
    }
    setIsRetrying(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!trial) return <Typography>Trial not found. <Link to="/">Go back to Dashboard</Link>.</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Button component={Link} to="/" sx={{ mb: 2 }}>&larr; Back to Dashboard</Button>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Trial Request Details</Typography>
        <Typography><strong>Subject:</strong> {trial.subject}</Typography>
        <Typography><strong>Location:</strong> {trial.location}</Typography>
        <Typography><strong>Status:</strong> {trial.status}</Typography>
      </Paper>

      {['Confirmed', 'Outreach in Progress'].includes(trial.status) && (
        <Alert severity={trial.status === 'Confirmed' ? 'success' : 'info'} sx={{mb: 2}}>
          {trial.status === 'Confirmed' ? 'This trial has been confirmed and assigned.' : 'Automated outreach is currently in progress.'}
        </Alert>
      )}

      {trial.status === 'Failed - No Tutors' && (
        <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={handleRetryOutreach} disabled={isRetrying}>
                {isRetrying ? <CircularProgress size={24} color="inherit"/> : 'Re-open and Retry Outreach'}
            </Button>
        } sx={{mb: 2}}>
          This outreach failed to find an available tutor. You can add new tutors and try again.
        </Alert>
      )}

      {matchedTutors.length > 0 && trial.status === 'Pending' && (
        <Paper sx={{ p: 2, mb: 4, backgroundColor: '#e8f4fd' }}>
          <Typography variant="h6">Ready to Go!</Typography>
          <Typography sx={{mb: 2}}>You have a shortlist of {matchedTutors.length} tutors. You can now start the automated outreach.</Typography>
          <Button variant="contained" color="primary" onClick={handleStartOutreach} disabled={isStartingOutreach}>
           {isStartingOutreach ? <CircularProgress size={24} /> : 'Start Automated Outreach'}
          </Button>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Manual Controls</Typography>
        {trial.status === 'Pending' && (
          <Button variant="outlined" onClick={handleFindMatch} disabled={isMatching}>
            {isMatching ? <CircularProgress size={24} /> : 'Find Matching Tutors'}
          </Button>
        )}
      </Box>
      
        <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Suburb</TableCell><TableCell>Travel Time</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {isMatching ? (<TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>) : matchedTutors.length > 0 ? (matchedTutors.map(tutor => (<TableRow key={tutor.id}><TableCell>{tutor.full_name}</TableCell><TableCell>{tutor.suburb}</TableCell><TableCell>{tutor.travelTime || 'N/A'}</TableCell><TableCell align="right"><Button variant="outlined" size="small" onClick={() => handleAssignTutor(tutor.id)} disabled={trial.status !== 'Pending' || assigningTutorId !== null}>{assigningTutorId === tutor.id ? <CircularProgress size={24} /> : 'Manual Assign'}</Button></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} align="center">No tutors matched yet. Click "Find Matching Tutors" to begin.</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- NEW EVENT LOG SECTION --- */}
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{p: 2}}>Event Log</Typography>
        <List dense>
          {logs.length > 0 ? logs.map(log => (
            <ListItem key={log.id} divider>
              <ListItemText
                primary={log.message}
                secondary={
                  formatInTimeZone(new Date(log.created_at), 'Australia/Sydney', 'd MMM yyyy, h:mm:ss a')
                }
              />
              <Chip label={log.level} color={getLogChipColor(log.level)} size="small" />
            </ListItem>
          )) : (
            <Typography variant="body2" sx={{p: 2}}>No log entries for this trial yet.</Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
}