import { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Typography,
    Fab,
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    BottomNavigation,
    BottomNavigationAction,
    useMediaQuery,
    useTheme,
    SwipeableDrawer,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    School as SchoolIcon,
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    Notifications as NotificationsIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// Mobile-first navigation drawer
export const MobileNavigation = ({ 
    navigationItems = [], 
    currentPath = '/', 
    onNavigate,
    user 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (!isMobile) return null;

    return (
        <>
            {/* Mobile Menu Button */}
            <IconButton
                onClick={() => setIsOpen(true)}
                sx={{
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 1200,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                        backgroundColor: '#F4F6F8',
                    },
                }}
            >
                <MenuIcon />
            </IconButton>

            {/* Mobile Drawer */}
            <SwipeableDrawer
                anchor="left"
                open={isOpen}
                onClose={() => setIsOpen(false)}
                onOpen={() => setIsOpen(true)}
                PaperProps={{
                    sx: {
                        width: 280,
                        borderRadius: '0 16px 16px 0',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ p: 4, borderBottom: '1px solid #E4E7EB' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1.5,
                                    background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                }}
                            >
                                TC
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                                TutorCraft
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setIsOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, backgroundColor: '#2D5BFF' }}>
                                {user.email?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                    {user.email}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                    Administrator
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Navigation Items */}
                <List sx={{ p: 2 }}>
                    {navigationItems.map((item) => {
                        const isActive = currentPath === item.path;
                        return (
                            <ListItem
                                key={item.path}
                                button
                                onClick={() => {
                                    onNavigate?.(item.path);
                                    setIsOpen(false);
                                }}
                                sx={{
                                    borderRadius: 2,
                                    mb: 1,
                                    backgroundColor: isActive ? '#EBF0FF' : 'transparent',
                                    color: isActive ? '#2D5BFF' : '#6B7280',
                                    '&:hover': {
                                        backgroundColor: isActive ? '#EBF0FF' : '#F4F6F8',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                    <item.icon sx={{ fontSize: 20 }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </SwipeableDrawer>
        </>
    );
};

// Mobile bottom navigation
export const MobileBottomNav = ({ 
    navigationItems = [], 
    currentPath = '/', 
    onNavigate 
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    if (!isMobile || navigationItems.length === 0) return null;

    const getCurrentIndex = () => {
        return navigationItems.findIndex(item => item.path === currentPath);
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1100,
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #E4E7EB',
                boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
        >
            <BottomNavigation
                value={getCurrentIndex()}
                onChange={(_, newValue) => {
                    if (navigationItems[newValue]) {
                        onNavigate?.(navigationItems[newValue].path);
                    }
                }}
                sx={{
                    '& .MuiBottomNavigationAction-root': {
                        color: '#9DA4AE',
                        '&.Mui-selected': {
                            color: '#2D5BFF',
                        },
                    },
                }}
            >
                {navigationItems.slice(0, 4).map((item, index) => (
                    <BottomNavigationAction
                        key={item.path}
                        label={item.label}
                        icon={<item.icon />}
                    />
                ))}
            </BottomNavigation>
        </Box>
    );
};

// Mobile-optimized floating action button
export const MobileSpeedDial = ({ actions = [] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    if (!isMobile || actions.length === 0) return null;

    return (
        <SpeedDial
            ariaLabel="Quick actions"
            sx={{
                position: 'fixed',
                bottom: 80,
                right: 16,
                '& .MuiSpeedDial-fab': {
                    background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                    color: 'white',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1E47E6 0%, #E55A1F 100%)',
                    },
                },
            }}
            icon={<SpeedDialIcon />}
        >
            {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={action.onClick}
                    sx={{
                        '& .MuiSpeedDialAction-fab': {
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E4E7EB',
                            color: '#6B7280',
                            '&:hover': {
                                backgroundColor: '#F4F6F8',
                                color: '#374151',
                            },
                        },
                    }}
                />
            ))}
        </SpeedDial>
    );
};

// Touch-optimized card component
export const TouchCard = ({ children, onTap, onLongPress, ...props }) => {
    const [isPressed, setIsPressed] = useState(false);
    const [pressTimer, setPressTimer] = useState(null);

    const handleTouchStart = () => {
        setIsPressed(true);
        const timer = setTimeout(() => {
            onLongPress?.();
        }, 500);
        setPressTimer(timer);
    };

    const handleTouchEnd = () => {
        setIsPressed(false);
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    const handleClick = () => {
        if (!pressTimer) return; // Prevent click after long press
        onTap?.();
    };

    return (
        <Card
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
            sx={{
                transform: isPressed ? 'scale(0.98)' : 'scale(1)',
                transition: 'transform 0.1s ease-in-out',
                cursor: onTap ? 'pointer' : 'default',
                ...props.sx
            }}
            {...props}
        >
            {children}
        </Card>
    );
};
