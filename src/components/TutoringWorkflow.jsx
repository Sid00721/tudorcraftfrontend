import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Avatar,
    Chip,
    Stack,
    Divider,
    LinearProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    VideoCall as VideoCallIcon,
    Assignment as AssignmentIcon,
    RateReview as ReviewIcon,
    CheckCircle as CompleteIcon,
    Timer as TimerIcon,
    Person as PersonIcon,
    School as SchoolIcon,
} from '@mui/icons-material';

// Session workflow tracker
export const SessionWorkflow = ({ session, onUpdate }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [stepData, setStepData] = useState({});

    const workflowSteps = [
        {
            label: 'Session Scheduled',
            description: 'Trial session has been scheduled with student',
            icon: ScheduleIcon,
            status: 'completed',
        },
        {
            label: 'Tutor Assigned',
            description: 'Qualified tutor has been matched and confirmed',
            icon: PersonIcon,
            status: session.assigned_tutor_id ? 'completed' : 'pending',
        },
        {
            label: 'Pre-Session Prep',
            description: 'Meeting link sent, materials prepared',
            icon: VideoCallIcon,
            status: session.zoom_link ? 'completed' : 'pending',
        },
        {
            label: 'Session Conducted',
            description: 'Trial lesson completed with student',
            icon: SchoolIcon,
            status: session.status === 'completed' ? 'completed' : 'pending',
        },
        {
            label: 'Feedback Submitted',
            description: 'Diagnostic assessment and recommendations provided',
            icon: AssignmentIcon,
            status: session.diagnostic_submitted ? 'completed' : 'pending',
        },
        {
            label: 'Review Complete',
            description: 'Parent feedback received and processed',
            icon: ReviewIcon,
            status: session.review_complete ? 'completed' : 'pending',
        },
    ];

    const getStepColor = (status) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'active': return '#2D5BFF';
            case 'pending': return '#9DA4AE';
            default: return '#9DA4AE';
        }
    };

    const getCompletionPercentage = () => {
        const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
        return (completedSteps / workflowSteps.length) * 100;
    };

    return (
        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                        Session Progress
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {Math.round(getCompletionPercentage())}% complete
                    </Typography>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={getCompletionPercentage()}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#E4E7EB',
                        mb: 4,
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                        },
                    }}
                />

                <Stepper orientation="vertical" activeStep={currentStep}>
                    {workflowSteps.map((step, index) => {
                        const IconComponent = step.icon;
                        const isCompleted = step.status === 'completed';
                        const isActive = step.status === 'active';
                        
                        return (
                            <Step key={index} completed={isCompleted}>
                                <StepLabel
                                    StepIconComponent={() => (
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 2,
                                                backgroundColor: isCompleted ? '#ECFDF5' : isActive ? '#EBF0FF' : '#F4F6F8',
                                                border: `2px solid ${getStepColor(step.status)}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isCompleted ? (
                                                <CompleteIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                            ) : (
                                                <IconComponent sx={{ fontSize: 18, color: getStepColor(step.status) }} />
                                            )}
                                        </Box>
                                    )}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                        {step.label}
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                                        {step.description}
                                    </Typography>
                                    {step.status === 'active' && step.action && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => step.action(session)}
                                            sx={{
                                                background: 'linear-gradient(135deg, #2D5BFF 0%, #1E47E6 100%)',
                                            }}
                                        >
                                            {step.actionLabel}
                                        </Button>
                                    )}
                                </StepContent>
                            </Step>
                        );
                    })}
                </Stepper>
            </CardContent>
        </Card>
    );
};

// Quick action panel for tutors
export const QuickActionPanel = ({ actions = [], loading = false }) => {
    return (
        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
                    Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                    {actions.map((action, index) => {
                        const IconComponent = action.icon;
                        
                        return (
                            <Grid item xs={6} sm={4} key={index}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={action.onClick}
                                    disabled={loading || action.disabled}
                                    sx={{
                                        py: 2,
                                        flexDirection: 'column',
                                        gap: 1,
                                        borderColor: '#E4E7EB',
                                        color: '#374151',
                                        '&:hover': {
                                            borderColor: '#2D5BFF',
                                            backgroundColor: '#EBF0FF',
                                            color: '#2D5BFF',
                                        },
                                    }}
                                >
                                    <IconComponent sx={{ fontSize: 24 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'center' }}>
                                        {action.label}
                                    </Typography>
                                </Button>
                            </Grid>
                        );
                    })}
                </Grid>
            </CardContent>
        </Card>
    );
};

// Session status timeline
export const StatusTimeline = ({ events = [] }) => {
    return (
        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
                    Session Timeline
                </Typography>
                
                <Stack spacing={3}>
                    {events.map((event, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 3, position: 'relative' }}>
                            {/* Timeline line */}
                            {index < events.length - 1 && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: 16,
                                        top: 32,
                                        bottom: -24,
                                        width: 2,
                                        backgroundColor: '#E4E7EB',
                                    }}
                                />
                            )}
                            
                            {/* Event icon */}
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: event.type === 'success' ? '#ECFDF5' : 
                                                   event.type === 'warning' ? '#FFFBEB' : '#EBF0FF',
                                    color: event.type === 'success' ? '#10B981' : 
                                           event.type === 'warning' ? '#F59E0B' : '#2D5BFF',
                                }}
                            >
                                {event.icon ? (
                                    <event.icon sx={{ fontSize: 16 }} />
                                ) : (
                                    <TimerIcon sx={{ fontSize: 16 }} />
                                )}
                            </Avatar>
                            
                            {/* Event content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                    {event.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
                                    {event.description}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9DA4AE' }}>
                                    {new Date(event.timestamp).toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};
