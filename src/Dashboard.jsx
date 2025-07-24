import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import AddTutorForm from './AddTutorForm';
import AddTrialRequestForm from './AddTrialRequestForm';

// Import MUI Components
import { 
    Button, CircularProgress, Box, Typography, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, List, ListItem, ListItemText, Stack,
    Grid, Card, CardContent, Avatar, IconButton, Fade, Zoom, Skeleton
} from '@mui/material';

// Import Icons
import {
    People as PeopleIcon,
    School as SchoolIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUpIcon,
    PersonAdd as PersonAddIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
} from '@mui/icons-material';

// Premium Stats Card Component
const StatsCard = ({ title, value, icon: Icon, trend, color = 'primary', loading = false }) => (
    <Card 
        className="premium-card stats-card"
        sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${color === 'primary' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(33, 150, 243, 0.1)'} 0%, ${color === 'primary' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 152, 0, 0.1)'} 100%)`,
            border: `1px solid ${color === 'primary' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(33, 150, 243, 0.2)'}`,
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar
                    sx={{
                        width: 56,
                        height: 56,
                        background: `linear-gradient(135deg, ${color === 'primary' ? '#FF9800' : '#2196F3'} 0%, ${color === 'primary' ? '#F57C00' : '#1976D2'} 100%)`,
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    <Icon sx={{ fontSize: 28 }} />
                </Avatar>
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                        <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                            {trend}
                        </Typography>
                    </Box>
                )}
            </Box>
            {loading ? (
                <>
                    <Skeleton variant="text" width="60%" height={48} />
                    <Skeleton variant="text" width="80%" height={24} />
                </>
            ) : (
                <>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${color === 'primary' ? '#FF9800' : '#2196F3'} 0%, ${color === 'primary' ? '#F57C00' : '#1976D2'} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1,
                            mb: 1,
                        }}
                    >
                        {value}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {title}
                    </Typography>
                </>
            )}
        </CardContent>
    </Card>
);

// Premium Table Card Component
const PremiumTableCard = ({ title, action, children, loading = false }) => (
    <Card className="premium-card" sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {title}
                </Typography>
                {action}
            </Box>
            {loading ? (
                <Box sx={{ p: 3 }}>
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1 }} />
                    ))}
                </Box>
            ) : (
                <Box className="premium-table-container" sx={{ borderRadius: 0 }}>
                    {children}
                </Box>
            )}
        </CardContent>
    </Card>
);

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [tutors, setTutors] = useState([]);
    const [trialSessions, setTrialSessions] = useState([]);
    const [showAddTutorForm, setShowAddTutorForm] = useState(false);
    const [showAddRequestForm, setShowAddRequestForm] = useState(false);

    // --- NEW STATE FOR THE MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [loadingTutorDetails, setLoadingTutorDetails] = useState(false);

    // Stats calculations
    const stats = {
        totalTutors: tutors.length,
        totalSessions: trialSessions.length,
        confirmedSessions: trialSessions.filter(s => s.status === 'Confirmed').length,
        pendingSessions: trialSessions.filter(s => s.status === 'Pending').length,
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: tutorsData } = await supabase.from('tutors').select('*').order('created_at', { ascending: false });
            setTutors(tutorsData || []);

            const { data: sessionsData, error: sessionsError } = await supabase
                .from('trial_sessions')
                .select('*, trial_lessons(*, subjects(name))')
                .order('created_at', { ascending: false });

            if (sessionsError) console.error("Error fetching trial sessions:", sessionsError);
            setTrialSessions(sessionsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <Box className="premium-container">
                <Box className="premium-loading">
                    <CircularProgress size={48} />
                </Box>
            </Box>
        );
    }

    return (
        <Box className="premium-container">
            <Fade in={true} timeout={600}>
                <Box>
                    {/* Premium Page Header */}
                    <Box className="premium-page-header">
                        <Box>
                            <Typography 
                                variant="h3" 
                                sx={{ 
                                    fontWeight: 700, 
                                    background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1
                                }}
                            >
                                Admin Dashboard
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Manage tutors, sessions, and platform analytics
                            </Typography>
                        </Box>
                        <Box className="premium-actions">
                            <Button component={Link} to="/admin/resources" variant="contained" color="secondary" size="large">
                                Manage Resources
                            </Button>
                            <Button component={Link} to="/admin/messages" variant="contained" color="info" size="large">
                                Message History
                            </Button>
                            <Button component={Link} to="/admin/cancellations" variant="contained" color="warning" size="large">
                                AI Analysis
                            </Button>
                            <Button component={Link} to="/admin/reschedules" variant="contained" color="error" size="large">
                                Reschedules
                            </Button>
                        </Box>
                    </Box>

                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Zoom in={true} timeout={400}>
                                <div>
                                    <StatsCard
                                        title="Total Tutors"
                                        value={stats.totalTutors}
                                        icon={PeopleIcon}
                                        trend="+12% this month"
                                        color="primary"
                                    />
                                </div>
                            </Zoom>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Zoom in={true} timeout={500}>
                                <div>
                                    <StatsCard
                                        title="Total Sessions"
                                        value={stats.totalSessions}
                                        icon={SchoolIcon}
                                        trend="+8% this week"
                                        color="secondary"
                                    />
                                </div>
                            </Zoom>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Zoom in={true} timeout={600}>
                                <div>
                                    <StatsCard
                                        title="Confirmed"
                                        value={stats.confirmedSessions}
                                        icon={CheckCircleIcon}
                                        color="primary"
                                    />
                                </div>
                            </Zoom>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Zoom in={true} timeout={700}>
                                <div>
                                    <StatsCard
                                        title="Pending"
                                        value={stats.pendingSessions}
                                        icon={PendingIcon}
                                        color="secondary"
                                    />
                                </div>
                            </Zoom>
                        </Grid>
                    </Grid>

                    {/* Tutors Section */}
                    <PremiumTableCard
                        title="Tutors"
                        action={
                            !showAddTutorForm && (
                                <Button 
                                    variant="contained" 
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setShowAddTutorForm(true)}
                                    sx={{ borderRadius: 3, px: 3 }}
                                >
                                    Add New Tutor
                                </Button>
                            )
                        }
                    >
                        {showAddTutorForm && (
                            <Box sx={{ p: 3, borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                                <AddTutorForm onTutorAdded={handleDataAdded} onCancel={() => setShowAddTutorForm(false)} />
                            </Box>
                        )}
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tutor</TableCell>
                                        <TableCell>Contact</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tutors.map((tutor) => (
                                        <TableRow key={tutor.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {tutor.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {tutor.full_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ID: {tutor.id.slice(0, 8)}...
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="body2">{tutor.email}</Typography>
                                                    </Box>
                                                    {tutor.phone_number && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                            <Typography variant="body2">{tutor.phone_number}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">
                                                        {tutor.suburb || 'Not specified'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    variant="outlined" 
                                                    size="small" 
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleOpenTutorModal(tutor.id)}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    View Profile
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </PremiumTableCard>

                    {/* Trial Sessions Section */}
                    <PremiumTableCard
                        title="Trial Sessions"
                        action={
                            !showAddRequestForm && (
                                <Button 
                                    variant="contained" 
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowAddRequestForm(true)}
                                    sx={{ borderRadius: 3, px: 3 }}
                                >
                                    Add New Session
                                </Button>
                            )
                        }
                    >
                        {showAddRequestForm && (
                            <Box sx={{ p: 3, borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                                <AddTrialRequestForm onTrialRequestAdded={handleDataAdded} onCancel={() => setShowAddRequestForm(false)} />
                            </Box>
                        )}
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Parent & Student</TableCell>
                                        <TableCell>Subjects</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {trialSessions.map((session) => (
                                        <TableRow key={session.id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {session.parent_name || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Session #{session.id.slice(0, 8)}...
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {session.trial_lessons && session.trial_lessons.length > 0 ? (
                                                        session.trial_lessons.map(lesson => (
                                                            <Chip 
                                                                key={lesson.id} 
                                                                label={lesson.subjects?.name || 'Unknown Subject'} 
                                                                size="small"
                                                                sx={{ 
                                                                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
                                                                    border: '1px solid rgba(255, 152, 0, 0.3)',
                                                                    fontWeight: 500
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">No lessons</Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">{session.location}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={session.status} 
                                                    size="small" 
                                                    className={`status-chip ${session.status === 'Confirmed' ? 'status-confirmed' : 'status-pending'}`}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    component={Link} 
                                                    to={`/session/${session.id}`} 
                                                    variant="outlined" 
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </PremiumTableCard>

                    {/* Enhanced Tutor Profile Modal */}
                    <Dialog 
                        open={isModalOpen} 
                        onClose={handleCloseTutorModal} 
                        fullWidth 
                        maxWidth="md"
                        className="premium-modal"
                        PaperProps={{
                            sx: {
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 251, 252, 0.95) 100%)',
                                backdropFilter: 'blur(20px)',
                            }
                        }}
                    >
                        <DialogTitle sx={{ pb: 1 }}>
                            <Typography variant="h5" fontWeight={700}>
                                Tutor Profile
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 2 }}>
                            {loadingTutorDetails ? (
                                <Box sx={{ display: 'flex', justify: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : selectedTutor ? (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                                            <Avatar
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    fontSize: 36,
                                                    fontWeight: 700,
                                                    background: 'linear-gradient(135deg, #FF9800 0%, #2196F3 100%)',
                                                    mb: 2,
                                                }}
                                            >
                                                {selectedTutor.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                            </Avatar>
                                            <Typography variant="h6" fontWeight={600} textAlign="center">
                                                {selectedTutor.full_name}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <Card sx={{ p: 2, background: 'rgba(255, 255, 255, 0.7)', borderRadius: 3 }}>
                                            <List dense>
                                                <ListItem>
                                                    <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                                                    <ListItemText 
                                                        primary="Email" 
                                                        secondary={selectedTutor.email}
                                                        primaryTypographyProps={{ fontWeight: 600 }}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
                                                    <ListItemText 
                                                        primary="Phone" 
                                                        secondary={selectedTutor.phone_number || 'Not provided'}
                                                        primaryTypographyProps={{ fontWeight: 600 }}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                                                    <ListItemText 
                                                        primary="Location" 
                                                        secondary={selectedTutor.suburb || 'Not provided'}
                                                        primaryTypographyProps={{ fontWeight: 600 }}
                                                    />
                                                </ListItem>
                                            </List>
                                        </Card>
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                                Teaching Subjects
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {selectedTutor.subjects?.length > 0 ? selectedTutor.subjects.map(subject => (
                                                    <Chip 
                                                        key={subject.name} 
                                                        label={subject.name} 
                                                        sx={{ 
                                                            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
                                                            border: '1px solid rgba(255, 152, 0, 0.3)',
                                                            fontWeight: 500
                                                        }}
                                                    />
                                                )) : 
                                                    <Typography variant="body2" color="text.secondary">
                                                        No subjects assigned yet.
                                                    </Typography>
                                                }
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : null}
                        </DialogContent>
                        <DialogActions sx={{ p: 3, pt: 1 }}>
                            <Button 
                                onClick={handleCloseTutorModal} 
                                variant="contained" 
                                sx={{ borderRadius: 3, px: 4 }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Fade>
        </Box>
    );
}