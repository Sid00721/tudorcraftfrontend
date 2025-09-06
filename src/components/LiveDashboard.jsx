import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    Button,
    Stack,
    Divider,
    LinearProgress,
    Badge,
    IconButton,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Remove as StableIcon,
    Refresh as RefreshIcon,
    Notifications as NotificationIcon,
    Schedule as ScheduleIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Assessment as AssessmentIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNotification } from './NotificationSystem';

// Real-time metrics card with trend analysis
export const LiveMetricCard = ({ 
    title, 
    value, 
    previousValue, 
    icon: Icon, 
    color = 'primary',
    format = 'number',
    loading = false 
}) => {
    const [trend, setTrend] = useState('stable');
    const [trendValue, setTrendValue] = useState(0);

    useEffect(() => {
        if (previousValue !== undefined && value !== previousValue) {
            const change = value - previousValue;
            const percentChange = previousValue === 0 ? 100 : (change / previousValue) * 100;
            
            setTrendValue(Math.abs(percentChange));
            setTrend(change > 0 ? 'up' : change < 0 ? 'down' : 'stable');
        }
    }, [value, previousValue]);

    const formatValue = (val) => {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-AU', { 
                    style: 'currency', 
                    currency: 'AUD' 
                }).format(val);
            case 'percentage':
                return `${val}%`;
            case 'decimal':
                return val.toFixed(1);
            default:
                return val.toLocaleString();
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981' }} />;
            case 'down': return <TrendingDownIcon sx={{ fontSize: 16, color: '#EF4444' }} />;
            default: return <StableIcon sx={{ fontSize: 16, color: '#6B7280' }} />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up': return '#10B981';
            case 'down': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const colorConfig = {
        primary: { main: '#2D5BFF', bg: '#EBF0FF' },
        secondary: { main: '#FF6B2C', bg: '#FFF0EB' },
        success: { main: '#10B981', bg: '#ECFDF5' },
        warning: { main: '#F59E0B', bg: '#FFFBEB' },
    };

    const config = colorConfig[color] || colorConfig.primary;

    return (
        <Card 
            sx={{ 
                height: '100%',
                border: '1px solid #E4E7EB',
                borderRadius: 3,
                backgroundColor: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderColor: config.main,
                },
            }}
        >
            {loading && (
                <LinearProgress 
                    sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: 'transparent',
                        '& .MuiLinearProgress-bar': {
                            background: `linear-gradient(90deg, ${config.main}, ${config.main}aa)`,
                        },
                    }} 
                />
            )}
            
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: config.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon sx={{ fontSize: 24, color: config.main }} />
                    </Box>
                    
                    {trendValue > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getTrendIcon()}
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: getTrendColor(), 
                                    fontWeight: 600 
                                }}
                            >
                                {trendValue.toFixed(1)}%
                            </Typography>
                        </Box>
                    )}
                </Box>
                
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1,
                        mb: 1,
                    }}
                >
                    {formatValue(value)}
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
            </CardContent>
        </Card>
    );
};

// Live activity feed
export const ActivityFeed = ({ activities = [], maxItems = 5 }) => {
    const getActivityIcon = (type) => {
        const icons = {
            'tutor_registered': PeopleIcon,
            'session_created': SchoolIcon,
            'session_confirmed': CheckCircleIcon,
            'profile_updated': PeopleIcon,
            'diagnostic_submitted': AssessmentIcon,
        };
        return icons[type] || NotificationIcon;
    };

    const getActivityColor = (type) => {
        const colors = {
            'tutor_registered': '#2D5BFF',
            'session_created': '#FF6B2C',
            'session_confirmed': '#10B981',
            'profile_updated': '#F59E0B',
            'diagnostic_submitted': '#6366F1',
        };
        return colors[type] || '#6B7280';
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return time.toLocaleDateString();
    };

    return (
        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
            <Box sx={{ p: 4, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                    Live Activity
                </Typography>
                <IconButton size="small">
                    <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
            
            <CardContent sx={{ p: 0 }}>
                {activities.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            No recent activity
                        </Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />}>
                        {activities.slice(0, maxItems).map((activity, index) => {
                            const IconComponent = getActivityIcon(activity.type);
                            const color = getActivityColor(activity.type);
                            
                            return (
                                <Box key={index} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            backgroundColor: `${color}20`,
                                            color: color,
                                        }}
                                    >
                                        <IconComponent sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontWeight: 500, 
                                                color: '#111827',
                                                mb: 0.5 
                                            }}
                                        >
                                            {activity.title}
                                        </Typography>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                color: '#6B7280',
                                                display: 'block' 
                                            }}
                                        >
                                            {activity.description}
                                        </Typography>
                                    </Box>
                                    
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: '#9DA4AE',
                                            fontWeight: 500 
                                        }}
                                    >
                                        {formatTimestamp(activity.timestamp)}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};

// Real-time status indicator
export const LiveStatus = ({ status, lastUpdate }) => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const checkConnection = () => {
            setIsOnline(navigator.onLine);
        };

        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);
        
        return () => {
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
        };
    }, []);

    const getStatusColor = () => {
        if (!isOnline) return '#EF4444';
        switch (status) {
            case 'online': return '#10B981';
            case 'busy': return '#F59E0B';
            case 'away': return '#6B7280';
            default: return '#9DA4AE';
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(),
                    animation: isOnline && status === 'online' ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 },
                    },
                }}
            />
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                {isOnline ? status : 'Offline'}
            </Typography>
            {lastUpdate && (
                <Typography variant="caption" sx={{ color: '#9DA4AE' }}>
                    • Updated {formatTimestamp(lastUpdate)}
                </Typography>
            )}
        </Box>
    );
};
