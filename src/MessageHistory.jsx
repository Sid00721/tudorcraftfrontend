import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { formatInTimeZone } from 'date-fns-tz';

// Import MUI Components
import {
    Box, Button, Typography, Paper, CircularProgress, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Grid,
    Select, MenuItem, InputLabel, FormControl, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, Pagination, Card, CardContent,
    Accordion, AccordionSummary, AccordionDetails, Alert, Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function MessageHistory() {
    const [loading, setLoading] = useState(true);
    const [messageHistory, setMessageHistory] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(25);
    const [totalMessages, setTotalMessages] = useState(0);

    // Filter state
    const [filters, setFilters] = useState({
        sessionId: '',
        messageType: '',
        recipientType: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    const messageTypes = [
        { value: 'outreach', label: 'Outreach' },
        { value: 'reminder', label: 'Reminder' },
        { value: 'notification', label: 'Notification' },
        { value: 'reschedule', label: 'Reschedule' },
        { value: 'cancellation', label: 'Cancellation' },
        { value: 'diagnostic', label: 'Diagnostic' }
    ];

    const recipientTypes = [
        { value: 'parent', label: 'Parent' },
        { value: 'tutor', label: 'Tutor' },
        { value: 'admin', label: 'Admin' }
    ];

    const fetchMessageHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: ((currentPage - 1) * limit).toString()
            });

            // Add filters to params
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim()) {
                    params.append(key, value.trim());
                }
            });

            const response = await fetch(`${API_URL}/api/admin/message-history?${params}`);
            const data = await response.json();

            if (response.ok) {
                setMessageHistory(data.messageHistory || []);
                setTotalMessages(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / limit));
            } else {
                console.error('Error fetching message history:', data.error);
            }
        } catch (error) {
            console.error('Failed to fetch message history:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit, filters]);

    const fetchAnalytics = useCallback(async () => {
        try {
            // Fetch communication analytics for recent sessions
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            // This would be an aggregated analytics endpoint
            // For now, we'll calculate basic analytics from the current data
            const stats = {
                totalMessages: messageHistory.length,
                messagesByType: {},
                messagesByRecipient: {},
                failedMessages: 0
            };

            messageHistory.forEach(msg => {
                stats.messagesByType[msg.message_type] = (stats.messagesByType[msg.message_type] || 0) + 1;
                stats.messagesByRecipient[msg.recipient_type] = (stats.messagesByRecipient[msg.recipient_type] || 0) + 1;
                if (msg.delivery_status === 'failed') stats.failedMessages++;
            });

            setAnalytics(stats);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    }, [messageHistory, filters.startDate, filters.endDate]);

    useEffect(() => {
        fetchMessageHistory();
    }, [fetchMessageHistory]);

    useEffect(() => {
        if (messageHistory.length > 0) {
            fetchAnalytics();
        }
    }, [fetchAnalytics]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleClearFilters = () => {
        setFilters({
            sessionId: '',
            messageType: '',
            recipientType: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setCurrentPage(1);
    };

    const handleViewMessage = (message) => {
        setSelectedMessage(message);
        setIsMessageModalOpen(true);
    };

    const getStatusChip = (deliveryStatus) => {
        const statusConfig = {
            sent: { color: 'info', label: 'Sent' },
            delivered: { color: 'success', label: 'Delivered' },
            failed: { color: 'error', label: 'Failed' },
            bounced: { color: 'warning', label: 'Bounced' }
        };
        const config = statusConfig[deliveryStatus] || statusConfig.sent;
        return <Chip size="small" color={config.color} label={config.label} />;
    };

    const getMessageTypeChip = (messageType) => {
        const typeConfig = {
            outreach: { color: 'primary', label: 'Outreach' },
            reminder: { color: 'warning', label: 'Reminder' },
            notification: { color: 'info', label: 'Notification' },
            reschedule: { color: 'secondary', label: 'Reschedule' },
            cancellation: { color: 'error', label: 'Cancellation' },
            diagnostic: { color: 'success', label: 'Diagnostic' }
        };
        const config = typeConfig[messageType] || typeConfig.notification;
        return <Chip size="small" variant="outlined" color={config.color} label={config.label} />;
    };

    if (loading && messageHistory.length === 0) {
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
                    📧 Message History & Communication Analytics
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                    >
                        Analytics
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchMessageHistory}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>
            </Box>

            {/* Analytics Section */}
            {isAnalyticsOpen && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Communication Analytics
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary">
                                        {totalMessages.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Messages
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="error">
                                        {analytics.failedMessages || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Failed Messages
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="info">
                                        {analytics.messagesByType?.outreach || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Outreach Messages
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="warning">
                                        {analytics.messagesByType?.reminder || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Reminder Messages
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Paper>
            )}

            {/* Filters */}
            <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FilterListIcon sx={{ mr: 1 }} />
                    <Typography>Advanced Filters</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                label="Session ID"
                                value={filters.sessionId}
                                onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Message Type</InputLabel>
                                <Select
                                    value={filters.messageType}
                                    label="Message Type"
                                    onChange={(e) => handleFilterChange('messageType', e.target.value)}
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    {messageTypes.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Recipient Type</InputLabel>
                                <Select
                                    value={filters.recipientType}
                                    label="Recipient Type"
                                    onChange={(e) => handleFilterChange('recipientType', e.target.value)}
                                >
                                    <MenuItem value="">All Recipients</MenuItem>
                                    {recipientTypes.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                label="Start Date"
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                label="End Date"
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <Button
                                variant="outlined"
                                onClick={handleClearFilters}
                                fullWidth
                            >
                                Clear Filters
                            </Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Message History Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Date & Time</strong></TableCell>
                                <TableCell><strong>Session</strong></TableCell>
                                <TableCell><strong>Type</strong></TableCell>
                                <TableCell><strong>Recipient</strong></TableCell>
                                <TableCell><strong>Subject</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {messageHistory.map((message) => (
                                <TableRow key={message.id} hover>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatInTimeZone(new Date(message.sent_at), 'Australia/Sydney', 'dd/MM/yyyy HH:mm')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {message.trial_sessions?.parent_name || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {message.session_id.slice(0, 8)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {getMessageTypeChip(message.message_type)}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                            {message.recipient_type}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {message.recipient_email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                                            {message.message_subject || 'No subject'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(message.delivery_status)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => handleViewMessage(message)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {messageHistory.length === 0 && !loading && (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">
                            No message history found. Try adjusting your filters.
                        </Typography>
                    </Box>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box p={2} display="flex" justifyContent="center">
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={(_, page) => setCurrentPage(page)}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>

            {/* Message Detail Modal */}
            <Dialog
                open={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Message Details
                    {selectedMessage && (
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                            {getMessageTypeChip(selectedMessage.message_type)}
                            {getStatusChip(selectedMessage.delivery_status)}
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent>
                    {selectedMessage && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Sent At
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatInTimeZone(new Date(selectedMessage.sent_at), 'Australia/Sydney', 'EEEE, d MMMM yyyy @ h:mm a zzz')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Recipient
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedMessage.recipient_email} ({selectedMessage.recipient_type})
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Subject
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedMessage.message_subject || 'No subject'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Message Content
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                                <div dangerouslySetInnerHTML={{ __html: selectedMessage.message_content }} />
                            </Paper>

                            {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Metadata
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                        <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {JSON.stringify(selectedMessage.metadata, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsMessageModalOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 