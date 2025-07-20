import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { formatInTimeZone } from 'date-fns-tz';
import DateTimePicker from 'react-datetime-picker';

// Import MUI Components
import {
    Box, Button, Typography, Paper, CircularProgress, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, Card, CardContent,
    Alert, Stack, Accordion, AccordionSummary, AccordionDetails,
    MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function RescheduleManager() {
    const [loading, setLoading] = useState(true);
    const [rescheduleRequests, setRescheduleRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDateTime, setNewDateTime] = useState(new Date());
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [sessions, setSessions] = useState([]);
    const [processing, setProcessing] = useState(false);

    const fetchRescheduleRequests = useCallback(async () => {
        setLoading(true);
        try {
            const { data: requests, error } = await supabase
                .from('reschedule_requests')
                .select(`
                    *,
                    trial_sessions (
                        id,
                        parent_name,
                        location,
                        assigned_tutor_id,
                        trial_lessons (
                            student_name,
                            lesson_datetime,
                            subjects (name)
                        )
                    ),
                    priority_tutor:priority_tutor_id (
                        full_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRescheduleRequests(requests || []);
        } catch (error) {
            console.error('Error fetching reschedule requests:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAvailableSessions = useCallback(async () => {
        try {
            const { data: sessionData, error } = await supabase
                .from('trial_sessions')
                .select(`
                    id,
                    parent_name,
                    location,
                    status,
                    trial_lessons (
                        student_name,
                        lesson_datetime,
                        subjects (name)
                    )
                `)
                .in('status', ['Confirmed', 'Outreach in Progress'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSessions(sessionData || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    }, []);

    useEffect(() => {
        fetchRescheduleRequests();
        fetchAvailableSessions();
    }, [fetchRescheduleRequests, fetchAvailableSessions]);

    const getStatusChip = (status) => {
        const statusConfig = {
            pending: { color: 'warning', label: 'Pending', icon: <PriorityHighIcon fontSize="small" /> },
            approved: { color: 'success', label: 'Approved', icon: <CheckCircleIcon fontSize="small" /> },
            rejected: { color: 'error', label: 'Rejected', icon: <CancelIcon fontSize="small" /> },
            expired: { color: 'default', label: 'Expired', icon: <ScheduleIcon fontSize="small" /> }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Chip
                size="small"
                color={config.color}
                label={config.label}
                icon={config.icon}
            />
        );
    };

    const getRequesterTypeChip = (requesterType) => {
        const typeConfig = {
            tutor: { color: 'primary', label: 'Tutor Request' },
            parent: { color: 'secondary', label: 'Parent Request' },
            admin: { color: 'info', label: 'Admin Request' }
        };
        const config = typeConfig[requesterType] || typeConfig.admin;
        return <Chip size="small" variant="outlined" color={config.color} label={config.label} />;
    };

    const handleCreateRescheduleRequest = async () => {
        if (!selectedSessionId || !rescheduleReason.trim()) {
            alert('Please select a session and provide a reason.');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`${API_URL}/api/sessions/${selectedSessionId}/reschedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newDateTime: newDateTime.toISOString(),
                    reason: rescheduleReason,
                    requesterId: 'admin', // In real app, get from authenticated user
                    requesterType: 'admin'
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setIsCreateModalOpen(false);
                setSelectedSessionId('');
                setRescheduleReason('');
                setNewDateTime(new Date());
                fetchRescheduleRequests();
                alert('Reschedule request created successfully!');
            } else {
                throw new Error(data.error || 'Failed to create reschedule request');
            }
        } catch (error) {
            console.error('Error creating reschedule request:', error);
            alert('Failed to create reschedule request: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to approve this reschedule request?')) {
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`${API_URL}/api/reschedule-requests/${requestId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: 'accepted',
                    tutorId: selectedRequest.priority_tutor_id
                }),
            });

            const data = await response.json();
            if (response.ok) {
                fetchRescheduleRequests();
                setSelectedRequest(null);
                setIsRescheduleModalOpen(false);
                alert('Reschedule request approved successfully!');
            } else {
                throw new Error(data.error || 'Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectRequest = async (requestId) => {
        const rejectionReason = prompt('Please provide a reason for rejection:');
        if (!rejectionReason) return;

        setProcessing(true);
        try {
            const response = await fetch(`${API_URL}/api/reschedule-requests/${requestId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: 'declined',
                    tutorId: selectedRequest.priority_tutor_id
                }),
            });

            const data = await response.json();
            if (response.ok) {
                fetchRescheduleRequests();
                setSelectedRequest(null);
                setIsRescheduleModalOpen(false);
                alert('Reschedule request rejected. New tutor search will begin.');
            } else {
                throw new Error(data.error || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleViewRequest = (request) => {
        setSelectedRequest(request);
        setIsRescheduleModalOpen(true);
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    🔄 Reschedule Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<ScheduleIcon />}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Create Reschedule Request
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {rescheduleRequests.filter(r => r.status === 'pending').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pending Requests
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {rescheduleRequests.filter(r => r.status === 'approved').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Approved
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error.main">
                                {rescheduleRequests.filter(r => r.status === 'rejected').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Rejected
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="text.secondary">
                                {rescheduleRequests.filter(r => r.status === 'expired').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Expired
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Reschedule Requests Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Created</strong></TableCell>
                                <TableCell><strong>Session</strong></TableCell>
                                <TableCell><strong>Requester</strong></TableCell>
                                <TableCell><strong>Original Time</strong></TableCell>
                                <TableCell><strong>Requested Time</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Priority Deadline</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rescheduleRequests.map((request) => (
                                <TableRow key={request.id} hover>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatInTimeZone(new Date(request.created_at), 'Australia/Sydney', 'dd/MM HH:mm')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {request.trial_sessions?.parent_name || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {request.trial_sessions?.trial_lessons?.[0]?.student_name || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {getRequesterTypeChip(request.requester_type)}
                                        {request.priority_tutor && (
                                            <Typography variant="caption" display="block">
                                                {request.priority_tutor.full_name}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {request.original_datetime ? 
                                                formatInTimeZone(new Date(request.original_datetime), 'Australia/Sydney', 'dd/MM @ HH:mm') 
                                                : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {request.requested_datetime ? 
                                                formatInTimeZone(new Date(request.requested_datetime), 'Australia/Sydney', 'dd/MM @ HH:mm') 
                                                : 'To be set'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(request.status)}
                                    </TableCell>
                                    <TableCell>
                                        {request.priority_response_deadline ? (
                                            <Typography variant="caption">
                                                {formatInTimeZone(new Date(request.priority_response_deadline), 'Australia/Sydney', 'dd/MM HH:mm')}
                                            </Typography>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                No deadline
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => handleViewRequest(request)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {rescheduleRequests.length === 0 && (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">
                            No reschedule requests found.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Create Reschedule Request Modal */}
            <Dialog
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Create New Reschedule Request</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Select Session</InputLabel>
                                <Select
                                    value={selectedSessionId}
                                    label="Select Session"
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                >
                                    {sessions.map(session => (
                                        <MenuItem key={session.id} value={session.id}>
                                            {session.parent_name} - {session.trial_lessons?.[0]?.student_name || 'N/A'} 
                                            ({session.trial_lessons?.[0]?.subjects?.name || 'N/A'})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                New Date & Time
                            </Typography>
                            <DateTimePicker
                                value={newDateTime}
                                onChange={setNewDateTime}
                                calendarIcon={null}
                                clearIcon={null}
                                format="dd/MM/yyyy h:mm a"
                                minDate={new Date()}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Reason for Reschedule"
                                value={rescheduleReason}
                                onChange={(e) => setRescheduleReason(e.target.value)}
                                placeholder="Explain why this session needs to be rescheduled..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateRescheduleRequest}
                        disabled={processing}
                    >
                        {processing ? <CircularProgress size={20} /> : 'Create Request'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View/Manage Reschedule Request Modal */}
            <Dialog
                open={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Reschedule Request Details
                    {selectedRequest && (
                        <Box mt={1}>
                            {getStatusChip(selectedRequest.status)}
                            {getRequesterTypeChip(selectedRequest.requester_type)}
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box>
                            {/* Priority Tutor Alert */}
                            {selectedRequest.priority_tutor && selectedRequest.status === 'pending' && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <strong>Priority Response:</strong> {selectedRequest.priority_tutor.full_name} has priority until{' '}
                                    {selectedRequest.priority_response_deadline ? 
                                        formatInTimeZone(new Date(selectedRequest.priority_response_deadline), 'Australia/Sydney', 'dd/MM/yyyy @ h:mm a') 
                                        : 'no deadline set'}
                                </Alert>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Session
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedRequest.trial_sessions?.parent_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedRequest.trial_sessions?.trial_lessons?.[0]?.student_name || 'N/A'} - {' '}
                                        {selectedRequest.trial_sessions?.trial_lessons?.[0]?.subjects?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Location
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedRequest.trial_sessions?.location || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Original Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedRequest.original_datetime ? 
                                            formatInTimeZone(new Date(selectedRequest.original_datetime), 'Australia/Sydney', 'EEEE, d MMMM yyyy @ h:mm a') 
                                            : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Requested Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedRequest.requested_datetime ? 
                                            formatInTimeZone(new Date(selectedRequest.requested_datetime), 'Australia/Sydney', 'EEEE, d MMMM yyyy @ h:mm a') 
                                            : 'To be determined'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Reason
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                        <Typography variant="body2">
                                            {selectedRequest.reason || 'No reason provided'}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                {selectedRequest.admin_notes && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Admin Notes
                                        </Typography>
                                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                            <Typography variant="body2">
                                                {selectedRequest.admin_notes}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsRescheduleModalOpen(false)}>
                        Close
                    </Button>
                    {selectedRequest?.status === 'pending' && (
                        <>
                            <Button
                                color="error"
                                onClick={() => handleRejectRequest(selectedRequest.id)}
                                disabled={processing}
                            >
                                Reject
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleApproveRequest(selectedRequest.id)}
                                disabled={processing}
                            >
                                {processing ? <CircularProgress size={20} /> : 'Approve'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
} 