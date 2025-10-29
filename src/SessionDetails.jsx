import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { usePageTitle } from './hooks/usePageTitle';
import {
    Box, Button, Typography, Paper, CircularProgress, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Chip, List, ListItem, ListItemText, Divider, Container,
    Card, CardContent, Avatar, Stack, IconButton, Badge
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    School as SchoolIcon,
    Schedule as ScheduleIcon,
    Search as SearchIcon,
    Assignment as AssignIcon,
    PlayArrow as StartIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function SessionDetails() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    
    // Set dynamic page title
    usePageTitle(session ? `Session: ${session.parent_name}` : 'Session Details');
    const [matchedTutors, setMatchedTutors] = useState([]);
    const [isMatching, setIsMatching] = useState(false);
    const [isStartingOutreach, setIsStartingOutreach] = useState(false);
    const [assigningTutorId, setAssigningTutorId] = useState(null);

    const fetchSessionDetails = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('trial_sessions')
            .select('*, trial_lessons(id, session_id, student_name, student_grade, subject_id, lesson_datetime, lesson_timezone, duration_minutes, video_meeting_link, diagnostic_assessment, subjects(name)), assigned_tutor:assigned_tutor_id(full_name)')
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

    if (loading) {
        return (
            <Box sx={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                        <CircularProgress sx={{ color: '#2D5BFF' }} />
                    </Box>
                </Container>
            </Box>
        );
    }
    
    if (!session) {
        return (
            <Box sx={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, p: 6, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>
                            Session not found
                        </Typography>
                        <Button component={Link} to="/" variant="contained">
                            Go back to Dashboard
                        </Button>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 6 }}>
                    <Button 
                        component={Link} 
                        to="/" 
                        startIcon={<BackIcon />}
                        sx={{ 
                            mb: 3,
                            color: '#6B7280',
                            '&:hover': {
                                backgroundColor: '#F4F6F8',
                                color: '#374151',
                            }
                        }}
                    >
                        Back to Dashboard
                    </Button>
                    
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: '#111827',
                            mb: 2,
                        }}
                    >
                        Session Details
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#6B7280',
                        }}
                    >
                        Manage and track this trial session
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    {/* Left Column: Session Information */}
                    <Grid item xs={12} lg={5}>
                        {/* Session Overview */}
                        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, mb: 4 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            backgroundColor: '#EBF0FF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <PersonIcon sx={{ fontSize: 20, color: '#2D5BFF' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                                        Session Information
                                    </Typography>
                                </Box>
                                
                                <Stack spacing={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <PersonIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Parent</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                                                {session.parent_name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <EmailIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Email</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                                                {session.parent_email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    {session.parent_phone && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <PhoneIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Phone</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                                                    {session.parent_phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <LocationIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Location</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                                                {session.location}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <ScheduleIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Status</Typography>
                                            <Chip 
                                                label={session.status} 
                                                size="small"
                                                sx={{
                                                    backgroundColor: session.status === 'Confirmed' ? '#ECFDF5' : 
                                                                    session.status === 'Pending' ? '#FFFBEB' : '#FEF2F2',
                                                    color: session.status === 'Confirmed' ? '#10B981' : 
                                                           session.status === 'Pending' ? '#F59E0B' : '#EF4444',
                                                    border: `1px solid ${session.status === 'Confirmed' ? '#D1FAE5' : 
                                                                        session.status === 'Pending' ? '#FED7AA' : '#FECACA'}`,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    {session.assigned_tutor && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CheckIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Assigned Tutor</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981' }}>
                                                    {session.assigned_tutor.full_name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                        
                        {/* Lessons Card */}
                        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            backgroundColor: '#FFF0EB',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <SchoolIcon sx={{ fontSize: 20, color: '#FF6B2C' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                                        Lessons in this Session
                                    </Typography>
                                </Box>
                                
                                <Stack spacing={2}>
                                    {session.trial_lessons.map((lesson, index) => (
                                        <Box 
                                            key={lesson.id}
                                            sx={{
                                                p: 3,
                                                border: '1px solid #E4E7EB',
                                                borderRadius: 2,
                                                backgroundColor: '#FAFBFC',
                                            }}
                                        >
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
                                                {lesson.subjects.name} - Grade {lesson.student_grade}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                                Student: {lesson.student_name}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column: Tutor Matching */}
                    <Grid item xs={12} lg={7}>
                        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                backgroundColor: '#FFF0EB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <SearchIcon sx={{ fontSize: 20, color: '#FF6B2C' }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                                            Tutor Matching
                                        </Typography>
                                    </Box>
                                    
                                    {session.status === 'Pending' && (
                                        <Button 
                                            variant="contained" 
                                            onClick={handleFindMatch} 
                                            disabled={isMatching}
                                            startIcon={isMatching ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                                            sx={{
                                                background: 'linear-gradient(135deg, #2D5BFF 0%, #1E47E6 100%)',
                                                borderRadius: 2,
                                                px: 3,
                                                py: 1.5,
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #1E47E6 0%, #1538CC 100%)',
                                                },
                                            }}
                                        >
                                            {isMatching ? 'Searching...' : 'Find Matching Tutors'}
                                        </Button>
                                    )}
                                </Box>

                                {/* Tutors Table */}
                                <Box sx={{ border: '1px solid #E4E7EB', borderRadius: 2, overflow: 'hidden' }}>
                                    <TableContainer>
                                        <Table className="premium-table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Location</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Travel Time</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {isMatching ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                                <CircularProgress sx={{ color: '#2D5BFF' }} />
                                                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                                                    Finding qualified tutors...
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : matchedTutors.length > 0 ? (
                                                    matchedTutors.map(tutor => (
                                                        <TableRow 
                                                            key={tutor.id}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: '#FAFBFC',
                                                                }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                    <Avatar sx={{ width: 32, height: 32, backgroundColor: '#2D5BFF', fontSize: '0.875rem' }}>
                                                                        {tutor.full_name?.[0] || 'T'}
                                                                    </Avatar>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                                                        {tutor.full_name}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                                                    {tutor.suburb}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                                                    {tutor.travelTimeText || 'N/A'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Button 
                                                                    variant="outlined" 
                                                                    size="small" 
                                                                    disabled={assigningTutorId !== null}
                                                                    onClick={() => handleAssignTutor(tutor.id)}
                                                                    startIcon={assigningTutorId === tutor.id ? 
                                                                        <CircularProgress size={14} color="inherit" /> : 
                                                                        <AssignIcon sx={{ fontSize: 14 }} />
                                                                    }
                                                                    sx={{
                                                                        borderColor: '#E4E7EB',
                                                                        color: '#374151',
                                                                        fontWeight: 500,
                                                                        textTransform: 'none',
                                                                        '&:hover': {
                                                                            borderColor: '#2D5BFF',
                                                                            backgroundColor: '#EBF0FF',
                                                                            color: '#2D5BFF',
                                                                        },
                                                                    }}
                                                                >
                                                                    {assigningTutorId === tutor.id ? 'Assigning...' : 'Assign'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                                                No tutors matched yet.
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#9DA4AE' }}>
                                                                Click "Find Matching Tutors" to search for qualified tutors
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>

                                {/* Outreach Action */}
                                {matchedTutors.length > 0 && session.status === 'Pending' && (
                                    <Alert 
                                        severity="success" 
                                        sx={{ 
                                            mt: 4,
                                            backgroundColor: '#ECFDF5',
                                            border: '1px solid #D1FAE5',
                                            borderRadius: 2,
                                        }}
                                        action={
                                            <Button 
                                                variant="contained" 
                                                disabled={isStartingOutreach}
                                                onClick={handleStartOutreach}
                                                startIcon={isStartingOutreach ? 
                                                    <CircularProgress size={16} color="inherit" /> : 
                                                    <StartIcon />
                                                }
                                                sx={{
                                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                    },
                                                }}
                                            >
                                                {isStartingOutreach ? 'Starting...' : 'Start Outreach'}
                                            </Button>
                                        }
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                            Ready to Go!
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                            You have a shortlist of {matchedTutors.length} qualified tutor{matchedTutors.length !== 1 ? 's' : ''}. Start automated outreach to contact them.
                                        </Typography>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}