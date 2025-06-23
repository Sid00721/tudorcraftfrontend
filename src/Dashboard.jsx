import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import AddTutorForm from './AddTutorForm';
import AddTrialRequestForm from './AddTrialRequestForm';

// Import MUI Components
import { 
    Button, CircularProgress, Box, Typography, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, List, ListItem, ListItemText 
} from '@mui/material';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState([]);
  const [trialRequests, setTrialRequests] = useState([]);
  const [showAddTutorForm, setShowAddTutorForm] = useState(false);
  const [showAddRequestForm, setShowAddRequestForm] = useState(false);

  // --- NEW STATE FOR THE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [loadingTutorDetails, setLoadingTutorDetails] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: tutorsData } = await supabase.from('tutors').select('*').order('created_at', { ascending: false });
    setTutors(tutorsData || []);

    const { data: requestsData } = await supabase.from('trial_requests').select('*').order('created_at', { ascending: false });
    setTrialRequests(requestsData || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDataAdded = () => {
    setShowAddTutorForm(false);
    setShowAddRequestForm(false);
    fetchData();
  };
  
  // --- NEW FUNCTIONS TO HANDLE THE MODAL ---
  const handleOpenTutorModal = async (tutorId) => {
    setIsModalOpen(true);
    setLoadingTutorDetails(true);
    const { data, error } = await supabase
      .from('tutors')
      .select('*, subjects (name)') // Fetch tutor and their related subjects
      .eq('id', tutorId)
      .single();

    if (error) {
      console.error('Error fetching tutor details', error);
      alert('Could not load tutor details.');
      setIsModalOpen(false);
    } else {
      setSelectedTutor(data);
    }
    setLoadingTutorDetails(false);
  };

  const handleCloseTutorModal = () => {
    setIsModalOpen(false);
    setSelectedTutor(null); // Clear the selected tutor data
  };


  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Tutors Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Tutors</Typography>
        {!showAddTutorForm && (<Button variant="contained" onClick={() => setShowAddTutorForm(true)}>+ Add New Tutor</Button>)}
      </Box>
      {showAddTutorForm && <AddTutorForm onTutorAdded={handleDataAdded} onCancel={() => setShowAddTutorForm(false)} />}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell> {/* <-- ADDED ACTIONS HEADER */}
            </TableRow>
          </TableHead>
          <TableBody>
            {tutors.map((tutor) => (
              <TableRow key={tutor.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{tutor.full_name}</TableCell>
                <TableCell>{tutor.email}</TableCell>
                <TableCell>{tutor.phone_number}</TableCell>
                <TableCell>
                    {/* --- ADDED VIEW BUTTON --- */}
                    <Button variant="outlined" size="small" onClick={() => handleOpenTutorModal(tutor.id)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Trial Requests Section (No changes here) --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Typography variant="h5">Trial Requests</Typography>
        {!showAddRequestForm && (<Button variant="contained" onClick={() => setShowAddRequestForm(true)}>+ Add New Request</Button>)}
      </Box>
      {showAddRequestForm && <AddTrialRequestForm onTrialRequestAdded={handleDataAdded} onCancel={() => setShowAddRequestForm(false)} />}
      <TableContainer component={Paper}>
        {/* ... The entire trial requests table JSX remains the same ... */}
        <Table>
            <TableHead><TableRow><TableCell>Subject</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Created At</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>{trialRequests.map((request) => (<TableRow key={request.id}><TableCell>{request.subject}</TableCell><TableCell>{request.location}</TableCell><TableCell>{request.status}</TableCell><TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell><TableCell><Button component={Link} to={`/trial/${request.id}`} variant="outlined" size="small">View</Button></TableCell></TableRow>))}</TableBody>
        </Table>
      </TableContainer>

      {/* --- NEW TUTOR PROFILE MODAL --- */}
      <Dialog open={isModalOpen} onClose={handleCloseTutorModal} fullWidth maxWidth="sm">
        <DialogTitle>Tutor Profile</DialogTitle>
        <DialogContent>
          {loadingTutorDetails ? (
            <CircularProgress />
          ) : selectedTutor ? (
            <Box>
                <Typography variant="h6">{selectedTutor.full_name}</Typography>
                <List dense>
                    <ListItem><ListItemText primary="Email" secondary={selectedTutor.email} /></ListItem>
                    <ListItem><ListItemText primary="Phone" secondary={selectedTutor.phone_number || 'Not provided'} /></ListItem>
                    <ListItem><ListItemText primary="Suburb" secondary={selectedTutor.suburb || 'Not provided'} /></ListItem>
                </List>
                <Typography variant="h6" sx={{mt: 2}}>Subjects:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedTutor.subjects.length > 0 ? selectedTutor.subjects.map(subject => (
                        <Chip key={subject.name} label={subject.name} />
                    )) : <Typography variant="body2">No subjects assigned.</Typography>}
                </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTutorModal}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}