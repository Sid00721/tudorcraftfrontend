import { useState, useEffect, createContext, useContext } from 'react';
import { 
    Snackbar, 
    Alert, 
    Box, 
    Typography, 
    IconButton, 
    Slide, 
    Fade,
    Stack,
    Avatar,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

// Notification Context
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Advanced notification with multiple types and positions
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      position: 'top-right',
      action: null,
      persistent: false,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Smart notification shortcuts
  const notify = {
    success: (message, options = {}) => addNotification({ 
      type: 'success', 
      message, 
      title: 'Success',
      ...options 
    }),
    error: (message, options = {}) => addNotification({ 
      type: 'error', 
      message, 
      title: 'Error',
      persistent: true,
      ...options 
    }),
    warning: (message, options = {}) => addNotification({ 
      type: 'warning', 
      message, 
      title: 'Warning',
      ...options 
    }),
    info: (message, options = {}) => addNotification({ 
      type: 'info', 
      message, 
      title: 'Info',
      ...options 
    }),
    loading: (message, options = {}) => addNotification({ 
      type: 'info', 
      message, 
      title: 'Processing',
      persistent: true,
      ...options 
    }),
  };

  const getIcon = (type) => {
    const icons = {
      success: SuccessIcon,
      error: ErrorIcon,
      warning: WarningIcon,
      info: InfoIcon,
    };
    return icons[type] || InfoIcon;
  };

  const getColors = (type) => {
    const colors = {
      success: { bg: '#ECFDF5', border: '#D1FAE5', icon: '#10B981' },
      error: { bg: '#FEF2F2', border: '#FECACA', icon: '#EF4444' },
      warning: { bg: '#FFFBEB', border: '#FED7AA', icon: '#F59E0B' },
      info: { bg: '#EBF0FF', border: '#DBEAFE', icon: '#2D5BFF' },
    };
    return colors[type] || colors.info;
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, clearAll, notify }}>
      {children}
      
      {/* Notification Container */}
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Stack spacing={2}>
          {notifications.map((notification) => {
            const IconComponent = getIcon(notification.type);
            const colors = getColors(notification.type);
            
            return (
              <Slide
                key={notification.id}
                direction="left"
                in={true}
                timeout={300}
              >
                <Box
                  sx={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: colors.icon,
                        color: 'white',
                      }}
                    >
                      <IconComponent sx={{ fontSize: 18 }} />
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {notification.title && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: '#111827',
                            mb: 0.5,
                          }}
                        >
                          {notification.title}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#374151',
                          lineHeight: 1.5,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      {notification.action && (
                        <Box sx={{ mt: 2 }}>
                          {notification.action}
                        </Box>
                      )}
                    </Box>
                    
                    <IconButton
                      size="small"
                      onClick={() => removeNotification(notification.id)}
                      sx={{
                        color: '#6B7280',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  
                  {/* Progress bar for timed notifications */}
                  {!notification.persistent && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: 3,
                        backgroundColor: colors.icon,
                        animation: `shrink ${notification.duration}ms linear`,
                        '@keyframes shrink': {
                          from: { width: '100%' },
                          to: { width: '0%' },
                        },
                      }}
                    />
                  )}
                </Box>
              </Slide>
            );
          })}
        </Stack>
      </Box>
    </NotificationContext.Provider>
  );
};
