import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import {
    Box, Button, Typography, Paper, CircularProgress, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Chip, List, ListItem, ListItemText, Divider
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function SessionDetails() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [matchedTutors, setMatchedTutors] = useState([]);
    const [isMatching, setIsMatching] = useState(false);
    const [isStartingOutreach, setIsStartingOutreach] = useState(false);
    const [assigningTutorId, setAssigningTutorId] = useState(null);

    const fetchSessionDetails = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('trial_sessions')
            .select('*, trial_lessons(*, subjects(name)), assigned_tutor:assigned_tutor_id(full_name)')
            .eq('id', sessionId)
            .single();

        if (error) {
            console.error('Error fetching session details', error);
            navigate('/');
        } else {
            setSession(data);
        }
        setLoading(false);
    }, [sessionId, navigate]);

    useEffect(() => {
        fetchSessionDetails();
    }, [fetchSessionDetails]);

    const handleFindMatch = async () => {
        setIsMatching(true);
        setMatchedTutors([]);
        try {
            const response = await fetch(`${API_URL}/api/sessions/${sessionId}/match`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch matches.');
            setMatchedTutors(data.matchedTutors);
        } catch (error) {
            console.error('Failed to fetch matches', error);
            alert('Error: ' + error.message);
        }
        setIsMatching(false);
    };

    const handleAssignTutor = async (tutorId) => {
        setAssigningTutorId(tutorId);
        try {
            const response = await fetch(`${API_URL}/api/sessions/${sessionId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tutorId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to assign tutor.');
            
            alert('Tutor successfully assigned!');
            setSession(data.session); // Update session state with the returned data
            setMatchedTutors([]); // Clear the matched tutors list

        } catch (error) {
            console.error('Failed to assign tutor', error);
            alert('Error: ' + error.message);
        }
        setAssigningTutorId(null);
    };

    // --- NEW: Handler for starting outreach ---
    const handleStartOutreach = async () => {
        setIsStartingOutreach(true);
        try {
            const response = await fetch(`${API_URL}/api/sessions/${sessionId}/start-outreach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchedTutors }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to start outreach.');
            alert('Automated outreach has begun!');
            fetchSessionDetails(); // Refresh data to show the new "Outreach in Progress" status
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setIsStartingOutreach(false);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (!session) return <Typography>Session not found. <Link to="/">Go back to Dashboard</Link>.</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Button component={Link} to="/" sx={{ mb: 2 }}>&larr; Back to Dashboard</Button>

            <Grid container spacing={3}>
                {/* Left Column: Details */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" gutterBottom>Session Details</Typography>
                        <Typography><strong>Parent:</strong> {session.parent_name}</Typography>
                        <Typography><strong>Email:</strong> {session.parent_email}</Typography>
                        <Typography><strong>Phone:</strong> {session.parent_phone}</Typography>
                        <Typography><strong>Location:</strong> {session.location}</Typography>
                        <Typography><strong>Status:</strong> <Chip label={session.status} size="small" color={session.status === 'Confirmed' ? 'success' : 'default'} /></Typography>
                        {session.assigned_tutor && (
                            <Typography><strong>Assigned Tutor:</strong> {session.assigned_tutor.full_name}</Typography>
                        )}
                    </Paper>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h5" gutterBottom>Lessons in this Session</Typography>
                        <List dense>
                            {session.trial_lessons.map((lesson, index) => (
                                <Box key={lesson.id}>
                                    <ListItem>
                                        <ListItemText 
                                            primary={`${lesson.subjects.name} - Grade ${lesson.student_grade}`}
                                            secondary={`Student: ${lesson.student_name}`}
                                        />
                                    </ListItem>
                                    {index < session.trial_lessons.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Right Column: Matching & Actions */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Tutor Matching</Typography>
                            {session.status === 'Pending' && (
                                <Button variant="contained" onClick={handleFindMatch} disabled={isMatching}>
                                    {isMatching ? <CircularProgress size={24} /> : 'Find Matching Tutors'}
                                </Button>
                            )}
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Suburb</TableCell>
                                        <TableCell>Travel</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isMatching ? (
                                        <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
                                    ) : matchedTutors.length > 0 ? (
                                        matchedTutors.map(tutor => (
                                            <TableRow key={tutor.id}>
                                                <TableCell>{tutor.full_name}</TableCell>
                                                <TableCell>{tutor.suburb}</TableCell>
                                                <TableCell>{tutor.travelTimeText || 'N/A'}</TableCell>
                                                <TableCell align="right">
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small" 
                                                        disabled={assigningTutorId !== null}
                                                        onClick={() => handleAssignTutor(tutor.id)}
                                                    >
                                                        {assigningTutorId === tutor.id ? <CircularProgress size={20} /> : 'Assign'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} align="center">No tutors matched yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                         {matchedTutors.length > 0 && session.status === 'Pending' && (
                            <Box sx={{ p: 2, mt: 2, backgroundColor: '#e8f4fd', borderRadius: 1 }}>
                                <Typography variant="h6">Ready to Go!</Typography>
                                <Typography sx={{mb: 2}}>You have a shortlist of {matchedTutors.length} tutors.</Typography>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    disabled={isStartingOutreach}
                                    onClick={handleStartOutreach}
                                >
                                    {isStartingOutreach ? <CircularProgress size={24} /> : 'Start Automated Outreach'}
                                </Button>
                            </Box>
                         )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}