import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { usePageTitle, updateFavicon } from './hooks/usePageTitle';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    Grid,
    Paper,
    LinearProgress,
    Stack,
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Assessment as AssessmentIcon,
    Star as StarIcon,
    Timeline as TimelineIcon,
    Speed as SpeedIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Score indicator component with color coding
const ScoreIndicator = ({ value, label, icon: Icon }) => {
    const getScoreColor = (score) => {
        if (score >= 7) return '#4CAF50'; // Green
        if (score >= 5) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

    const getScoreLevel = (score) => {
        if (score >= 7) return 'Excellent';
        if (score >= 5) return 'Good';
        return 'Needs Improvement';
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ color: getScoreColor(value), fontSize: 20 }} />
            <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: getScoreColor(value) }}>
                    {value?.toFixed(1) || '5.0'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.7rem' }}>
                    {getScoreLevel(value)}
                </Typography>
            </Box>
        </Box>
    );
};

// Composite score display with progress bar
const CompositeScore = ({ score }) => {
    const maxScore = 1000; // 10 * 10 * 10
    const percentage = (score / maxScore) * 100;
    
    const getScoreColor = (score) => {
        if (score >= 343) return '#4CAF50'; // 7*7*7
        if (score >= 125) return '#FF9800'; // 5*5*5
        return '#F44336';
    };

    return (
        <Box sx={{ minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: getScoreColor(score) }}>
                    {score?.toFixed(0) || '125'}
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={percentage} 
                    sx={{ 
                        flexGrow: 1, 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: getScoreColor(score)
                        }
                    }} 
                />
            </Box>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                Ranking Score
            </Typography>
        </Box>
    );
};

export default function TutorPerformance() {
    const [loading, setLoading] = useState(true);
    const [tutors, setTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [newScores, setNewScores] = useState({
        score_success: '',
        score_reliability: '',
        score_availability: '',
        reason: ''
    });

    // Set page title and favicon
    usePageTitle('Tutor Performance Management');
    
    useEffect(() => {
        updateFavicon('admin');
    }, []);

    // Fetch tutors data directly from Supabase
    const fetchTutors = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        
        try {
            const { data: tutors, error } = await supabase
                .from('tutors')
                .select(`
                    id,
                    full_name,
                    email,
                    score_success,
                    score_reliability,
                    score_availability,
                    approval_status,
                    updated_at,
                    created_at
                `)
                .order('updated_at', { ascending: false });

            if (error) {
                throw error;
            }

            // Calculate composite score for each tutor
            const tutorsWithComposite = tutors.map(tutor => ({
                ...tutor,
                composite_score: (tutor.score_success || 5) * (tutor.score_reliability || 5) * (tutor.score_availability || 5)
            }));

            setTutors(tutorsWithComposite);
        } catch (error) {
            console.error('Error fetching tutors:', error);
            setErrorMessage('Failed to load tutor performance data: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTutors();
    }, [fetchTutors]);

    // Handle edit button click
    const handleEditClick = (tutor) => {
        setSelectedTutor(tutor);
        setNewScores({
            score_success: tutor.score_success?.toString() || '5',
            score_reliability: tutor.score_reliability?.toString() || '5',
            score_availability: tutor.score_availability?.toString() || '5',
            reason: ''
        });
        setIsModalOpen(true);
        setSuccessMessage('');
        setErrorMessage('');
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTutor(null);
        setNewScores({
            score_success: '',
            score_reliability: '',
            score_availability: '',
            reason: ''
        });
        setErrorMessage('');
    };

    // Handle score update directly via Supabase
    const handleScoreUpdate = async () => {
        if (!selectedTutor) return;

        setSaving(true);
        setErrorMessage('');

        try {
            // Get current user session for admin verification
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                throw new Error('Not authenticated');
            }

            // Validate score ranges (0-10)
            const scores = {
                score_success: parseFloat(newScores.score_success),
                score_reliability: parseFloat(newScores.score_reliability),
                score_availability: parseFloat(newScores.score_availability)
            };

            for (const [field, value] of Object.entries(scores)) {
                if (isNaN(value) || value < 0 || value > 10) {
                    throw new Error(`Invalid ${field}: must be a number between 0 and 10`);
                }
            }

            // Update tutor scores directly in Supabase
            const { error: updateError } = await supabase
                .from('tutors')
                .update({
                    score_success: scores.score_success,
                    score_reliability: scores.score_reliability,
                    score_availability: scores.score_availability,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedTutor.id);

            if (updateError) {
                throw updateError;
            }

            // Log the manual score change for auditing (optional)
            const logMessage = `Admin ${session.user.email} manually updated scores for ${selectedTutor.full_name}. ` +
                `Changes: success: ${selectedTutor.score_success} → ${scores.score_success}, ` +
                `reliability: ${selectedTutor.score_reliability} → ${scores.score_reliability}, ` +
                `availability: ${selectedTutor.score_availability} → ${scores.score_availability}` +
                (newScores.reason ? ` | Reason: ${newScores.reason}` : '');

            // Insert audit log
            await supabase
                .from('logs')
                .insert({
                    message: logMessage,
                    level: 'INFO',
                    metadata: {
                        action: 'manual_score_update',
                        admin_user_id: session.user.id,
                        tutor_id: selectedTutor.id,
                        reason: newScores.reason,
                        old_scores: {
                            score_success: selectedTutor.score_success,
                            score_reliability: selectedTutor.score_reliability,
                            score_availability: selectedTutor.score_availability
                        },
                        new_scores: scores
                    }
                });

            setSuccessMessage(`✅ Successfully updated scores for ${selectedTutor.full_name}`);
            handleModalClose();
            await fetchTutors(); // Refresh the data
        } catch (error) {
            console.error('Error updating scores:', error);
            setErrorMessage('Failed to update scores: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Calculate stats
    const stats = {
        totalTutors: tutors.length,
        avgSuccess: tutors.length > 0 ? (tutors.reduce((sum, t) => sum + (t.score_success || 5), 0) / tutors.length) : 5,
        avgReliability: tutors.length > 0 ? (tutors.reduce((sum, t) => sum + (t.score_reliability || 5), 0) / tutors.length) : 5,
        avgAvailability: tutors.length > 0 ? (tutors.reduce((sum, t) => sum + (t.score_availability || 5), 0) / tutors.length) : 5,
        topPerformers: tutors.filter(t => (t.composite_score || 125) >= 343).length,
        needsAttention: tutors.filter(t => (t.composite_score || 125) < 125).length
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress size={40} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AssessmentIcon sx={{ fontSize: 32, color: '#2D5BFF' }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
                            Tutor Performance Management
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchTutors}
                        disabled={loading}
                    >
                        Refresh Data
                    </Button>
                </Box>
                <Typography variant="body1" sx={{ color: '#6B7280' }}>
                    Monitor and manually adjust tutor performance scores that drive the automated matching system.
                </Typography>
            </Box>

            {/* Success/Error Messages */}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}
            {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
                    {errorMessage}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D5BFF' }}>
                            {stats.totalTutors}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Total Tutors
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                            {stats.topPerformers}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Top Performers
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#F44336' }}>
                            {stats.needsAttention}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Needs Attention
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
                            {stats.avgSuccess.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Avg Success
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                            {stats.avgReliability.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Avg Reliability
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Tutors Table */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Tutor</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Success Score</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Reliability Score</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Availability Score</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Composite Score</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tutors.map((tutor) => (
                                    <TableRow key={tutor.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {tutor.full_name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                    {tutor.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <ScoreIndicator 
                                                value={tutor.score_success} 
                                                label="Success" 
                                                icon={StarIcon}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <ScoreIndicator 
                                                value={tutor.score_reliability} 
                                                label="Reliability" 
                                                icon={CheckCircleIcon}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <ScoreIndicator 
                                                value={tutor.score_availability} 
                                                label="Availability" 
                                                icon={SpeedIcon}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <CompositeScore score={tutor.composite_score} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={tutor.approval_status || 'pending'}
                                                size="small"
                                                color={
                                                    tutor.approval_status === 'approved' ? 'success' :
                                                    tutor.approval_status === 'rejected' ? 'error' :
                                                    tutor.approval_status === 'suspended' ? 'warning' : 'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                {tutor.updated_at ? format(new Date(tutor.updated_at), 'MMM d, yyyy') : 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit Scores">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleEditClick(tutor)}
                                                    sx={{ color: '#2D5BFF' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Edit Scores Modal */}
            <Dialog 
                open={isModalOpen} 
                onClose={handleModalClose} 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon />
                        Edit Scores for {selectedTutor?.full_name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
                            Adjust the performance scores for this tutor. These scores directly affect their ranking in the automated matching system.
                        </Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Success Score"
                                    type="number"
                                    fullWidth
                                    value={newScores.score_success}
                                    onChange={(e) => setNewScores({ ...newScores, score_success: e.target.value })}
                                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                                    helperText="0-10 (trial success rate)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Reliability Score"
                                    type="number"
                                    fullWidth
                                    value={newScores.score_reliability}
                                    onChange={(e) => setNewScores({ ...newScores, score_reliability: e.target.value })}
                                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                                    helperText="0-10 (cancellation rate)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Availability Score"
                                    type="number"
                                    fullWidth
                                    value={newScores.score_availability}
                                    onChange={(e) => setNewScores({ ...newScores, score_availability: e.target.value })}
                                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                                    helperText="0-10 (response time)"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Reason for Change"
                                    multiline
                                    rows={3}
                                    fullWidth
                                    value={newScores.reason}
                                    onChange={(e) => setNewScores({ ...newScores, reason: e.target.value })}
                                    placeholder="Explain why you're adjusting these scores (optional but recommended for auditing)"
                                />
                            </Grid>
                        </Grid>

                        {errorMessage && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {errorMessage}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleModalClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleScoreUpdate}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : null}
                    >
                        {saving ? 'Updating...' : 'Update Scores'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
