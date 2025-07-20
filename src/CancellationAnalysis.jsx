import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { formatInTimeZone } from 'date-fns-tz';

// Import MUI Components
import {
    Box, Button, Typography, Paper, CircularProgress, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, Card, CardContent,
    Alert, Stack, Rating, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import OverrideIcon from '@mui/icons-material/AdminPanelSettings';
import ReportIcon from '@mui/icons-material/Report';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function CancellationAnalysis() {
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideData, setOverrideData] = useState({
        overridePenalty: 0,
        overrideReason: '',
        adminId: null
    });
    const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

    // Analytics state
    const [analyticsData, setAnalyticsData] = useState({
        totalAnalyses: 0,
        averageSentimentScore: 0,
        averagePenalty: 0,
        overrideRate: 0,
        emergencyRate: 0,
        poorReasonRate: 0
    });

    const fetchAnalyses = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cancellation_analysis')
                .select(`
                    *,
                    tutors(full_name, email),
                    trial_sessions(parent_name, status, trial_lessons(*, subjects(name)))
                `)
                .order('cancellation_time', { ascending: false });

            if (error) throw error;

            setAnalyses(data || []);
            calculateAnalytics(data || []);
        } catch (error) {
            console.error('Error fetching cancellation analyses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const calculateAnalytics = (data) => {
        if (data.length === 0) return;

        const totalAnalyses = data.length;
        const avgSentimentScore = data.reduce((sum, item) => sum + (item.ai_sentiment_score || 0), 0) / totalAnalyses;
        const avgPenalty = data.reduce((sum, item) => sum + (item.final_penalty || item.calculated_penalty || 0), 0) / totalAnalyses;
        const overrideCount = data.filter(item => item.admin_override).length;
        const emergencyCount = data.filter(item => (item.ai_sentiment_score || 0) >= 0.8).length;
        const poorReasonCount = data.filter(item => (item.ai_sentiment_score || 0) <= 0.3).length;

        setAnalyticsData({
            totalAnalyses,
            averageSentimentScore: avgSentimentScore,
            averagePenalty: avgPenalty,
            overrideRate: (overrideCount / totalAnalyses) * 100,
            emergencyRate: (emergencyCount / totalAnalyses) * 100,
            poorReasonRate: (poorReasonCount / totalAnalyses) * 100
        });
    };

    useEffect(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);

    const handleOpenOverrideModal = (analysis) => {
        setSelectedAnalysis(analysis);
        setOverrideData({
            overridePenalty: analysis.final_penalty || analysis.calculated_penalty || 0,
            overrideReason: '',
            adminId: null // This would come from auth context in a real app
        });
        setIsOverrideModalOpen(true);
    };

    const handleSubmitOverride = async () => {
        if (!selectedAnalysis || !overrideData.overrideReason.trim()) {
            alert('Please provide a reason for the override.');
            return;
        }

        setIsSubmittingOverride(true);
        try {
            const response = await fetch(`${API_URL}/api/cancellation-analysis/${selectedAnalysis.id}/override`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    overridePenalty: parseFloat(overrideData.overridePenalty),
                    overrideReason: overrideData.overrideReason,
                    adminId: 'admin-user' // This would come from auth context
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert('Override applied successfully!');
                setIsOverrideModalOpen(false);
                await fetchAnalyses();
            } else {
                alert('Error: ' + (data.error || 'Failed to apply override'));
            }
        } catch (error) {
            console.error('Error submitting override:', error);
            alert('Failed to submit override');
        } finally {
            setIsSubmittingOverride(false);
        }
    };

    const getSentimentChip = (score) => {
        if (score >= 0.8) return <Chip size="small" color="success" label="Valid Emergency" />;
        if (score >= 0.5) return <Chip size="small" color="warning" label="Reasonable Excuse" />;
        return <Chip size="small" color="error" label="Poor Excuse" />;
    };

    const getPenaltyChip = (penalty) => {
        if (penalty <= 1) return <Chip size="small" color="success" label="Low Penalty" />;
        if (penalty <= 3) return <Chip size="small" color="warning" label="Medium Penalty" />;
        return <Chip size="small" color="error" label="High Penalty" />;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    🤖 AI Cancellation Analysis
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    onClick={fetchAnalyses}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {/* Analytics Dashboard */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="primary">
                                {analyticsData.totalAnalyses}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Analyses
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="info.main">
                                {analyticsData.averageSentimentScore.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Avg Sentiment Score
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="warning.main">
                                {analyticsData.averagePenalty.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Avg Penalty Applied
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="error.main">
                                {analyticsData.overrideRate.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Admin Override Rate
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="success.main">
                                {analyticsData.emergencyRate.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Valid Emergencies
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="error.main">
                                {analyticsData.poorReasonRate.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Poor Excuses
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Analysis Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Tutor</strong></TableCell>
                                <TableCell><strong>Session</strong></TableCell>
                                <TableCell><strong>Notice (Hours)</strong></TableCell>
                                <TableCell><strong>AI Sentiment</strong></TableCell>
                                <TableCell><strong>Penalty Applied</strong></TableCell>
                                <TableCell><strong>Override</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {analyses.map((analysis) => (
                                <TableRow key={analysis.id} hover>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatInTimeZone(new Date(analysis.cancellation_time), 'Australia/Sydney', 'dd/MM/yyyy HH:mm')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {analysis.tutors?.full_name || 'Unknown Tutor'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {analysis.tutors?.email || 'No email'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {analysis.trial_sessions?.parent_name || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {analysis.trial_sessions?.trial_lessons?.[0]?.subjects?.name || 'Unknown Subject'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            size="small" 
                                            label={`${analysis.notice_hours.toFixed(1)}h`}
                                            color={analysis.notice_hours < 4 ? 'error' : analysis.notice_hours < 12 ? 'warning' : 'success'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Rating 
                                                value={analysis.ai_sentiment_score || 0} 
                                                max={1} 
                                                precision={0.1} 
                                                size="small" 
                                                readOnly 
                                            />
                                            <Typography variant="caption">
                                                {((analysis.ai_sentiment_score || 0) * 100).toFixed(0)}%
                                            </Typography>
                                        </Box>
                                        {getSentimentChip(analysis.ai_sentiment_score || 0)}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            -{(analysis.final_penalty || analysis.calculated_penalty || 0).toFixed(2)}
                                        </Typography>
                                        {getPenaltyChip(analysis.final_penalty || analysis.calculated_penalty || 0)}
                                    </TableCell>
                                    <TableCell>
                                        {analysis.admin_override ? (
                                            <Chip size="small" color="info" label="Override Applied" />
                                        ) : (
                                            <Chip size="small" color="default" label="AI Decision" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                startIcon={<ReportIcon />}
                                                onClick={() => {
                                                    alert(`Reason: "${analysis.cancellation_reason}"\n\nAI Analysis: "${analysis.ai_analysis || 'No analysis available'}"`);
                                                }}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<OverrideIcon />}
                                                onClick={() => handleOpenOverrideModal(analysis)}
                                                disabled={analysis.admin_override}
                                            >
                                                Override
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {analyses.length === 0 && (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">
                            No cancellation analyses found. AI analysis will appear here when tutors cancel sessions.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Override Modal */}
            <Dialog open={isOverrideModalOpen} onClose={() => setIsOverrideModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    🛡️ Admin Override - AI Cancellation Analysis
                </DialogTitle>
                <DialogContent>
                    {selectedAnalysis && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <strong>Original AI Decision:</strong> {((selectedAnalysis.ai_sentiment_score || 0) * 100).toFixed(0)}% validity score, 
                                penalty: -{(selectedAnalysis.calculated_penalty || 0).toFixed(2)} points
                            </Alert>

                            <Accordion sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="h6">Cancellation Details</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Tutor's Reason:
                                            </Typography>
                                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                <Typography variant="body2">
                                                    "{selectedAnalysis.cancellation_reason}"
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                AI Analysis:
                                            </Typography>
                                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                <Typography variant="body2">
                                                    {selectedAnalysis.ai_analysis || 'No AI analysis available'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Notice Given:
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedAnalysis.notice_hours.toFixed(1)} hours
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Cancellation Time:
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatInTimeZone(new Date(selectedAnalysis.cancellation_time), 'Australia/Sydney', 'dd/MM/yyyy HH:mm')}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <TextField
                                label="Override Penalty"
                                type="number"
                                value={overrideData.overridePenalty}
                                onChange={(e) => setOverrideData(prev => ({ ...prev, overridePenalty: e.target.value }))}
                                helperText="Enter the penalty you want to apply (negative number for penalty, positive for bonus)"
                                fullWidth
                                sx={{ mb: 2 }}
                                inputProps={{ step: 0.1, min: -10, max: 5 }}
                            />

                            <TextField
                                label="Override Reason"
                                multiline
                                rows={3}
                                value={overrideData.overrideReason}
                                onChange={(e) => setOverrideData(prev => ({ ...prev, overrideReason: e.target.value }))}
                                placeholder="Explain why you are overriding the AI decision..."
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                            />

                            <Alert severity="warning">
                                This will adjust the tutor's availability score and override the AI decision permanently.
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsOverrideModalOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitOverride}
                        disabled={isSubmittingOverride || !overrideData.overrideReason.trim()}
                        startIcon={isSubmittingOverride ? <CircularProgress size={20} /> : <OverrideIcon />}
                    >
                        Apply Override
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 