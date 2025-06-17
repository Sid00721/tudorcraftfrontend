import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import AddTutorForm from './AddTutorForm';
import AddTrialRequestForm from './AddTrialRequestForm';
import { Link } from 'react-router-dom'; // <-- 1. IMPORT THE LINK COMPONENT

// Import MUI Components
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState([]);
  const [trialRequests, setTrialRequests] = useState([]);
  const [showAddTutorForm, setShowAddTutorForm] = useState(false);
  const [showAddRequestForm, setShowAddRequestForm] = useState(false);

  const fetchData = useCallback(async () => {
    // We won't set loading to true for refreshes to avoid screen flicker
    const { data: tutorsData, error: tutorsError } = await supabase.from('tutors').select('*').order('created_at', { ascending: false });
    if (tutorsError) console.error('Error fetching tutors:', tutorsError);
    else setTutors(tutorsData);

    const { data: requestsData, error: requestsError } = await supabase.from('trial_requests').select('*').order('created_at', { ascending: false });
    if (requestsError) console.error('Error fetching trial requests:', requestsError);
    else setTrialRequests(requestsData);

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

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Tutors Section (No change here) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Tutors</Typography>
        {!showAddTutorForm && (
          <Button variant="contained" onClick={() => setShowAddTutorForm(true)}>+ Add New Tutor</Button>
        )}
      </Box>
      {showAddTutorForm && <AddTutorForm onTutorAdded={handleDataAdded} onCancel={() => setShowAddTutorForm(false)} />}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Suburb</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tutors.map((tutor) => (
              <TableRow key={tutor.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{tutor.full_name}</TableCell>
                <TableCell>{tutor.email}</TableCell>
                <TableCell>{tutor.phone_number}</TableCell>
                <TableCell>{tutor.suburb}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Trial Requests Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Typography variant="h5">Trial Requests</Typography>
        {!showAddRequestForm && (
          <Button variant="contained" onClick={() => setShowAddRequestForm(true)}>+ Add New Request</Button>
        )}
      </Box>
      {showAddRequestForm && <AddTrialRequestForm onTrialRequestAdded={handleDataAdded} onCancel={() => setShowAddRequestForm(false)} />}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell> {/* <-- 2. ADD NEW HEADER */}
            </TableRow>
          </TableHead>
          <TableBody>
            {trialRequests.map((request) => (
              <TableRow key={request.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{request.subject}</TableCell>
                <TableCell>{request.location}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {/* --- 3. ADD THIS BUTTON/LINK --- */}
                  <Button component={Link} to={`/trial/${request.id}`} variant="outlined" size="small">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}