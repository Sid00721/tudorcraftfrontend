import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import AddTutorForm from './AddTutorForm';
import AddTrialRequestForm from './AddTrialRequestForm';

import { 
    Button, CircularProgress, Box, Typography, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, 
    Grid, Card, CardContent, Avatar, IconButton, Container, Stack
} from '@mui/material';

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
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

// Premium Enterprise Stats Card
const EnterpriseStatsCard = ({ title, value, icon: Icon, trend, color = 'primary', loading = false }) => (
    <Card 
        sx={{ 
            height: '100%',
            border: '1px solid #E4E7EB',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderColor: color === 'primary' ? '#2D5BFF' : '#FF6B2C',
            },
        }}
    >
        <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: color === 'primary' ? '#EBF0FF' : '#FFF0EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon sx={{ fontSize: 24, color: color === 'primary' ? '#2D5BFF' : '#FF6B2C' }} />
                </Box>
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981' }} />
                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                            {trend}
                        </Typography>
                    </Box>
                )}
            </Box>
            
            {loading ? (
                <Box>
                    <Box sx={{ width: '60%', height: 32, bgcolor: '#F4F6F8', borderRadius: 1, mb: 1 }} />
                    <Box sx={{ width: '80%', height: 20, bgcolor: '#F4F6F8', borderRadius: 1 }} />
                </Box>
            ) : (
                <>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: '#111827',
                            lineHeight: 1,
                            mb: 1,
                        }}
                    >
                        {value}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#6B7280',
                            fontWeight: 500,
                        }}
                    >
                        {title}
                    </Typography>
                </>
            )}
        </CardContent>
    </Card>
);

// Premium Action Card
const ActionCard = ({ title, description, icon: Icon, to, color = 'primary' }) => (
    <Card
        component={Link}
        to={to}
        sx={{
            textDecoration: 'none',
            height: '100%',
            border: '1px solid #E4E7EB',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderColor: color === 'primary' ? '#2D5BFF' : '#FF6B2C',
                '& .action-icon': {
                    transform: 'scale(1.1)',
                },
            },
        }}
    >
        <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                className="action-icon"
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: color === 'primary' ? '#EBF0FF' : '#FFF0EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    transition: 'transform 0.2s ease-in-out',
                }}
            >
                <Icon sx={{ fontSize: 24, color: color === 'primary' ? '#2D5BFF' : '#FF6B2C' }} />
            </Box>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 600,
                    color: '#111827',
                    mb: 1,
                }}
            >
                {title}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    color: '#6B7280',
                    flexGrow: 1,
                }}
            >
                {description}
            </Typography>
        </CardContent>
    </Card>
);

// Premium Table Component
const EnterpriseTable = ({ title, data, columns, loading = false }) => (
    <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
        <Box sx={{ p: 4, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                {title}
            </Typography>
        </Box>
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableCell key={index} sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        [...Array(3)].map((_, index) => (
                            <TableRow key={index}>
                                {columns.map((_, colIndex) => (
                                    <TableCell key={colIndex}>
                                        <Box sx={{ width: '80%', height: 20, bgcolor: '#F4F6F8', borderRadius: 1 }} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No data available
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.slice(0, 5).map((row, index) => (
                            <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#FAFBFC' } }}>
                                {columns.map((column, colIndex) => (
                                    <TableCell key={colIndex}>
                                        {column.render ? column.render(row) : row[column.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Card>
);

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [tutors, setTutors] = useState([]);
    const [trialSessions, setTrialSessions] = useState([]);
    const [showAddTutorForm, setShowAddTutorForm] = useState(false);
    const [showAddRequestForm, setShowAddRequestForm] = useState(false);

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

    // Table column definitions
    const tutorColumns = [
        { 
            key: 'name', 
            label: 'Name',
            render: (tutor) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {tutor.full_name?.[0] || tutor.name?.[0] || 'T'}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {tutor.full_name || tutor.name}
                    </Typography>
                </Box>
            )
        },
        { key: 'email', label: 'Email' },
        { 
            key: 'status', 
            label: 'Status',
            render: (tutor) => (
                <Chip 
                    label={tutor.approval_status || 'Active'} 
                    size="small"
                    color={tutor.approval_status === 'approved' ? 'success' : 'default'}
                    variant="outlined"
                />
            )
        },
        { 
            key: 'actions', 
            label: 'Actions',
            render: (tutor) => (
                <IconButton size="small" sx={{ color: '#6B7280' }}>
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            )
        },
    ];

    const sessionColumns = [
        { 
            key: 'student', 
            label: 'Student',
            render: (session) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {session.student_name}
                </Typography>
            )
        },
        { key: 'subject', label: 'Subject' },
        { 
            key: 'status', 
            label: 'Status',
            render: (session) => (
                <Chip 
                    label={session.status} 
                    size="small"
                    color={session.status === 'Confirmed' ? 'success' : 'default'}
                    variant="outlined"
                />
            )
        },
        { 
            key: 'actions', 
            label: 'Actions',
            render: (session) => (
                <Button 
                    component={Link} 
                    to={`/trial/${session.id}`}
                    variant="text" 
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                >
                    View
                </Button>
            )
        },
    ];

    return (
        <Box sx={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header Section */}
                <Box sx={{ mb: 6 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: '#111827',
                            mb: 2,
                        }}
                    >
                        Dashboard
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#6B7280',
                            mb: 4,
                        }}
                    >
                        Manage your tutoring platform with enterprise-grade tools
                    </Typography>

                    {/* Quick Actions */}
                    <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => setShowAddTutorForm(true)}
                            sx={{
                                background: 'linear-gradient(135deg, #2D5BFF 0%, #1E47E6 100%)',
                                px: 3,
                                py: 1.5,
                            }}
                        >
                            Add Tutor
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddRequestForm(true)}
                            sx={{
                                borderColor: '#E4E7EB',
                                color: '#374151',
                                '&:hover': {
                                    borderColor: '#2D5BFF',
                                    backgroundColor: '#EBF0FF',
                                },
                            }}
                        >
                            Create Session
                        </Button>
                    </Stack>
                </Box>

                {/* Stats Grid */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <EnterpriseStatsCard
                            title="Total Tutors"
                            value={stats.totalTutors}
                            icon={PeopleIcon}
                            color="primary"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <EnterpriseStatsCard
                            title="Total Sessions"
                            value={stats.totalSessions}
                            icon={SchoolIcon}
                            color="secondary"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <EnterpriseStatsCard
                            title="Confirmed"
                            value={stats.confirmedSessions}
                            icon={CheckCircleIcon}
                            color="primary"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <EnterpriseStatsCard
                            title="Pending"
                            value={stats.pendingSessions}
                            icon={PendingIcon}
                            color="secondary"
                            loading={loading}
                        />
                    </Grid>
                </Grid>

                {/* Management Actions Grid */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <ActionCard
                            title="Tutor Approvals"
                            description="Review and approve new tutor applications"
                            icon={PeopleIcon}
                            to="/admin/approvals"
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <ActionCard
                            title="Resources"
                            description="Manage educational resources and materials"
                            icon={SchoolIcon}
                            to="/admin/resources"
                            color="secondary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <ActionCard
                            title="Messages"
                            description="View communication history and analytics"
                            icon={EmailIcon}
                            to="/admin/messages"
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <ActionCard
                            title="Analytics"
                            description="AI analysis and platform insights"
                            icon={AssessmentIcon}
                            to="/admin/cancellations"
                            color="secondary"
                        />
                    </Grid>
                </Grid>

                {/* Data Tables */}
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={6}>
                        <EnterpriseTable
                            title="Recent Tutors"
                            data={tutors}
                            columns={tutorColumns}
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <EnterpriseTable
                            title="Recent Sessions"
                            data={trialSessions}
                            columns={sessionColumns}
                            loading={loading}
                        />
                    </Grid>
                </Grid>

                {/* Modals */}
                <Dialog 
                    open={showAddTutorForm} 
                    onClose={() => setShowAddTutorForm(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogContent sx={{ p: 0 }}>
                        <AddTutorForm onTutorAdded={handleDataAdded} onCancel={() => setShowAddTutorForm(false)} />
                    </DialogContent>
                </Dialog>

                <Dialog 
                    open={showAddRequestForm} 
                    onClose={() => setShowAddRequestForm(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogContent sx={{ p: 0 }}>
                        <AddTrialRequestForm onTrialRequestAdded={handleDataAdded} onCancel={() => setShowAddRequestForm(false)} />
                    </DialogContent>
                </Dialog>
            </Container>
        </Box>
    );
}
