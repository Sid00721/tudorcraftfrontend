import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Import MUI Components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';

export default function TrialDetails() {
  const { trialId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState(null);
  const [matchedTutors, setMatchedTutors] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [assigningTutorId, setAssigningTutorId] = useState(null);
  const [isStartingOutreach, setIsStartingOutreach] = useState(false); // <-- NEW: Loading state for automation button

  // This function will be called to refresh the trial status from the DB
  const fetchTrialDetails = async () => {
    const { data, error } = await supabase.from('trial_requests').select('*').eq('id', trialId).single();
    if (error) {
      console.error('Error fetching trial details', error);
      navigate('/');
    } else {
      setTrial(data);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTrialDetails().finally(() => setLoading(false));
  }, [trialId, navigate]);

  const handleFindMatch = async () => {
    // ... (This function remains the same as before)
    setIsMatching(true);
    setMatchedTutors([]);
    try {
      const response = await fetch('http://localhost:4000/api/match-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId: trial.id }),
      });
      const data = await response.json();
      if (response.ok && data.matchedTutors) {
        setMatchedTutors(data.matchedTutors);
      } else { throw new Error(data.error || 'Failed to fetch matches.'); }
    } catch (error) {
      console.error('Failed to fetch matches', error);
      alert('Failed to fetch matches. Is the backend server running?');
    }
    setIsMatching(false);
  };

  const handleAssignTutor = async (tutorId) => {
    // ... (This function remains the same as before)
     setAssigningTutorId(tutorId);
    try {
      const response = await fetch(`http://localhost:4000/api/trials/${trialId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || 'Failed to assign tutor.'); }
      alert('Tutor successfully assigned and trial confirmed!');
      navigate('/');
    } catch (error) {
      console.error('Failed to assign tutor', error);
      alert('Error: ' + error.message);
    }
    setAssigningTutorId(null);
  };

  // --- NEW FUNCTION TO START THE AUTOMATED SEQUENCE ---
  const handleStartOutreach = async () => {
    setIsStartingOutreach(true);
    try {
      const response = await fetch(`http://localhost:4000/api/trials/${trialId}/start-outreach`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || 'Failed to start outreach.'); }
      
      alert(data.message); // Show success message from backend
      await fetchTrialDetails(); // Refresh trial details to show the new "Outreach in Progress" status

    } catch (error) {
      console.error('Failed to start outreach', error);
      alert('Error: ' + error.message);
    }
    setIsStartingOutreach(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!trial) return <Typography>Trial not found. <Link to="/">Go back to Dashboard</Link>.</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* ... (The top part with trial details remains the same) ... */}
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

      {/* --- ADD THE NEW AUTOMATION BUTTON --- */}
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
      
      {/* ... (The rest of the Table code remains the same) ... */}
       <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell><TableCell>Suburb</TableCell><TableCell>Travel Time</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isMatching ? (
              <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : matchedTutors.length > 0 ? (
              matchedTutors.map(tutor => (
                <TableRow key={tutor.id}>
                  <TableCell>{tutor.full_name}</TableCell>
                  <TableCell>{tutor.suburb}</TableCell>
                  <TableCell>{tutor.travelTime || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => handleAssignTutor(tutor.id)}
                      disabled={trial.status !== 'Pending' || assigningTutorId !== null}
                    >
                      {assigningTutorId === tutor.id ? <CircularProgress size={24} /> : 'Manual Assign'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} align="center">No tutors matched yet. Click button to find them.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}