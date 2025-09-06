import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { usePageTitle, updateFavicon } from './hooks/usePageTitle';
// import { SmartSearchBar } from './components/SmartSearch';
// import { useNotification } from './components/NotificationSystem';
import { 
    Box, Typography, Card, CardContent, Button, Chip, Avatar, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Grid, Alert, CircularProgress, IconButton, List, ListItem,
    ListItemText, Divider, Paper, Stack, Rating, Container
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    School as SchoolIcon,
    Visibility as ViewIcon,
    Star as StarIcon,
    Search as SearchIcon,
} from '@mui/icons-material';

export default function TutorApprovalManager() {
    const [loading, setLoading] = useState(true);
    const [tutors, setTutors] = useState([]);
    const [filteredTutors, setFilteredTutors] = useState([]);
    
    // Set page title
    usePageTitle(`Tutor Approvals (${tutors.filter(t => t.profile_complete).length} ready)`);
    
    useEffect(() => {
        updateFavicon('admin');
    }, []);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [user, setUser] = useState(null);
    
    // Use notification system (temporarily disabled)
    // const { notify } = useNotification();
    const notify = {
        success: (msg) => alert(msg),
        error: (msg) => alert(msg),
    };

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user);
        };
        getUser();
    }, []);

    const fetchTutors = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tutors_pending_approval')
                .select('*')
                .order('profile_complete', { ascending: false })
                .order('last_profile_update', { ascending: false });

            if (error) throw error;
            setTutors(data || []);
            setFilteredTutors(data || []);
        } catch (error) {
            console.error('Error fetching tutors:', error);
            alert('Error loading tutors: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTutors();
    }, [fetchTutors]);

    const handleViewTutor = async (tutorId) => {
        try {
            const { data, error } = await supabase
                .from('tutors')
                .select(`
                    *,
                    subjects:tutor_subjects(subject_id, subjects(name, state_curriculum, level))
                `)
                .eq('id', tutorId)
                .single();

            if (error) throw error;
            setSelectedTutor(data);
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Error fetching tutor details:', error);
            alert('Error loading tutor details: ' + error.message);
        }
    };

    const handleApprovalAction = async (action) => {
        if (!selectedTutor || !user) return;

        setProcessing(true);
        try {
            const updateData = {
                approval_status: action,
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                approval_notes: approvalNotes || null
            };

            const { error } = await supabase
                .from('tutors')
                .update(updateData)
                .eq('id', selectedTutor.id);

            if (error) throw error;

            // Refresh the list
            await fetchTutors();
            
            // Close dialog and reset
            setIsDialogOpen(false);
            setSelectedTutor(null);
            setApprovalNotes('');

            // Smart notification
            notify.success(
                `${selectedTutor.full_name} has been ${action}! ${action === 'approved' ? 'They can now receive student assignments.' : 'They will need to reapply or contact support.'}`,
                { 
                    title: `Tutor ${action === 'approved' ? 'Approved' : 'Rejected'}`,
                    duration: 6000
                }
            );
        } catch (error) {
            console.error('Error updating approval status:', error);
            alert('Error updating approval: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'suspended': return 'warning';
            default: return 'default';
        }
    };

    const getReviewStatusColor = (reviewStatus) => {
        return reviewStatus === 'Ready for review' ? 'success' : 'warning';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>
                        Tutor Approvals
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6B7280', mb: 4 }}>
                        Review and approve tutors before they can be assigned to students
                    </Typography>
                    
                    {/* Basic Search - Smart search temporarily disabled */}
                    <TextField
                        fullWidth
                        placeholder="Search tutors by name, email, or location..."
                        onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const filtered = tutors.filter(tutor => 
                                tutor.full_name?.toLowerCase().includes(searchTerm) ||
                                tutor.email?.toLowerCase().includes(searchTerm) ||
                                tutor.suburb?.toLowerCase().includes(searchTerm)
                            );
                            setFilteredTutors(filtered);
                        }}
                        sx={{ mb: 4 }}
                        InputProps={{
                            startAdornment: (
                                <Box sx={{ mr: 1, color: '#9DA4AE' }}>
                                    <SearchIcon />
                                </Box>
                            ),
                        }}
                    />
                </Box>

                {filteredTutors.length === 0 ? (
                    <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, p: 6, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                            {tutors.length === 0 ? 'No tutors pending approval' : 'No tutors match your search'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9DA4AE' }}>
                            {tutors.length === 0 ? 'All tutors have been processed.' : 'Try adjusting your search criteria.'}
                        </Typography>
                    </Card>
                ) : (
                    <Grid container spacing={3}>
                        {filteredTutors.map((tutor) => (
                        <Grid item xs={12} md={6} lg={4} key={tutor.id}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    border: '1px solid #E4E7EB',
                                    borderRadius: 3,
                                    backgroundColor: '#FFFFFF',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        borderColor: tutor.profile_complete ? '#2D5BFF' : '#F59E0B',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {tutor.full_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Registered: {new Date(tutor.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Stack spacing={1} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EmailIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{tutor.email}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhoneIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{tutor.phone_number || 'Not provided'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{tutor.suburb || 'Not provided'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SchoolIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{tutor.subject_count} subjects</Typography>
                                        </Box>
                                    </Stack>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Chip 
                                            label={tutor.approval_status} 
                                            color={getStatusColor(tutor.approval_status)}
                                            size="small"
                                        />
                                        <Chip 
                                            label={tutor.review_status} 
                                            color={getReviewStatusColor(tutor.review_status)}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Box>

                                    <Button
                                        variant="contained"
                                        startIcon={<ViewIcon />}
                                        onClick={() => handleViewTutor(tutor.id)}
                                        fullWidth
                                        disabled={!tutor.profile_complete}
                                    >
                                        {tutor.profile_complete ? 'Review Profile' : 'Profile Incomplete'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Tutor Review Dialog */}
            <Dialog 
                open={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                            src={selectedTutor?.profile_photo_url} 
                            sx={{ width: 60, height: 60 }}
                        >
                            <PersonIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5">{selectedTutor?.full_name}</Typography>
                            <Typography variant="subtitle2" color="text.secondary">
                                Profile Review
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    {selectedTutor && (
                        <Box>
                            {/* Basic Information */}
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" gutterBottom>📋 Basic Information</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Email</Typography>
                                        <Typography variant="body1">{selectedTutor.email}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                                        <Typography variant="body1">{selectedTutor.phone_number || 'Not provided'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Location</Typography>
                                        <Typography variant="body1">{selectedTutor.suburb || 'Not provided'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Registration Date</Typography>
                                        <Typography variant="body1">
                                            {new Date(selectedTutor.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Profile Information */}
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" gutterBottom>🎓 Profile Information</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">University</Typography>
                                        <Typography variant="body1">{selectedTutor.university || 'Not provided'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Degree</Typography>
                                        <Typography variant="body1">{selectedTutor.degree || 'Not provided'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Study Year</Typography>
                                        <Typography variant="body1">{selectedTutor.study_year || 'Not provided'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">ATAR</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body1">
                                                {selectedTutor.atar ? selectedTutor.atar : 'Not provided'}
                                            </Typography>
                                            {selectedTutor.atar && (
                                                <Rating 
                                                    value={Math.min(5, Math.floor(selectedTutor.atar / 20))} 
                                                    readOnly 
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Teaching Bio</Typography>
                                        <Typography variant="body1" sx={{ fontStyle: selectedTutor.teaching_bio ? 'normal' : 'italic' }}>
                                            {selectedTutor.teaching_bio || 'Not provided'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Subjects */}
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" gutterBottom>📚 Teaching Subjects</Typography>
                                {selectedTutor.subjects && selectedTutor.subjects.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedTutor.subjects.map((subject, index) => (
                                            <Chip
                                                key={index}
                                                label={`${subject.subjects.name} (${subject.subjects.state_curriculum} - ${subject.subjects.level})`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No subjects selected
                                    </Typography>
                                )}
                            </Paper>

                            {/* Approval Notes */}
                            <TextField
                                fullWidth
                                label="Approval Notes (optional)"
                                multiline
                                rows={3}
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                placeholder="Add any notes about this approval decision..."
                                sx={{ mb: 2 }}
                            />

                            {!selectedTutor.profile_complete && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    This tutor's profile is incomplete. They need to fill out all required fields before approval.
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleApprovalAction('rejected')}
                        color="error"
                        startIcon={<RejectIcon />}
                        disabled={processing}
                    >
                        Reject
                    </Button>
                    <Button
                        onClick={() => handleApprovalAction('approved')}
                        color="success"
                        variant="contained"
                        startIcon={<ApproveIcon />}
                        disabled={processing || !selectedTutor?.profile_complete}
                    >
                        {processing ? <CircularProgress size={20} /> : 'Approve'}
                    </Button>
                </DialogActions>
            </Dialog>
            </Container>
        </Box>
    );
}
