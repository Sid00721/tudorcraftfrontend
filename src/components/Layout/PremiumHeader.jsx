import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const PremiumHeader = ({ user, userRole = 'admin' }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user profile data including photo
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('tutors')
          .select('profile_photo_url, full_name')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setUserProfile(profileData);
        }
      }
    };
    
    fetchUserProfile();
  }, [user?.id]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
    handleProfileMenuClose();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.includes('/admin/resources')) return 'Resources';
    if (path.includes('/admin/messages')) return 'Messages';
    if (path.includes('/admin/cancellations')) return 'Analytics';
    if (path.includes('/admin/reschedules')) return 'Reschedules';
    if (path.includes('/tutor/dashboard')) return 'Tutor Dashboard';
    if (path.includes('/tutor/profile')) return 'Profile';
    if (path.includes('/tutor/resources')) return 'Resource Hub';
    if (path.includes('/session/')) return 'Session Details';
    if (path.includes('/trial/')) return 'Trial Details';
    return 'TutorCraft';
  };

  const navigationItems = userRole === 'admin' ? [
    { label: 'Dashboard', path: '/', icon: DashboardIcon },
    { label: 'Approvals', path: '/admin/approvals', icon: PersonIcon },
    { label: 'Resources', path: '/admin/resources', icon: SchoolIcon },
    { label: 'Messages', path: '/admin/messages', icon: NotificationsIcon },
    { label: 'Analytics', path: '/admin/cancellations', icon: SettingsIcon },
    { label: 'Reschedules', path: '/admin/reschedules', icon: SettingsIcon },
  ] : [
    { label: 'Dashboard', path: '/tutor/dashboard', icon: DashboardIcon },
    { label: 'Profile', path: '/tutor/profile', icon: PersonIcon },
    { label: 'Resources', path: '/tutor/resources', icon: SchoolIcon },
  ];

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        backdropFilter: 'blur(20px)',
        borderBottom: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: -1,
        }
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, md: 4 } }}>
        {/* Logo and Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <SchoolIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1.25rem',
                display: { xs: 'none', sm: 'block' },
                background: 'linear-gradient(45deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              TutorCraft
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem',
                display: { xs: 'none', md: 'block' },
                letterSpacing: '0.5px',
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>
        </Box>

        {/* Navigation Items - Desktop */}
        <Box sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          gap: 1, 
          flex: 1,
          justifyContent: 'center',
        }}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={<Icon />}
                sx={{
                  color: 'white',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* User Role Badge */}
          <Chip
            label={userRole === 'admin' ? 'Admin' : 'Tutor'}
            size="small"
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontWeight: 600,
              display: { xs: 'none', sm: 'flex' },
            }}
          />

          {/* Notifications */}
          <IconButton
            onClick={handleNotificationOpen}
            sx={{
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <NotificationsIcon />
          </IconButton>

          {/* Profile Menu */}
          <IconButton onClick={handleProfileMenuOpen}>
            <Avatar
              src={userProfile?.profile_photo_url}
              sx={{
                width: 40,
                height: 40,
                background: userProfile?.profile_photo_url ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 600,
                borderRadius: '50%',
                objectFit: 'cover',
                '& img': {
                  objectFit: 'cover',
                  borderRadius: '50%',
                }
              }}
            >
              {!userProfile?.profile_photo_url && (user?.email?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
          </IconButton>

          {/* Mobile Menu Button */}
          <IconButton
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: 'white',
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => {
            handleProfileMenuClose();
            navigate('/tutor/profile');
          }}>
            <ListItemIcon>
              <AccountIcon />
            </ListItemIcon>
            <ListItemText>Profile Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleProfileMenuClose();
            navigate('/tutor/dashboard');
          }}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText>Preferences</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText>
              <Typography color="error">Sign Out</Typography>
            </ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 320,
              maxHeight: 400,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        </Menu>

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
              color: 'white',
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              TutorCraft
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
              {userRole === 'admin' ? 'Admin Panel' : 'Tutor Dashboard'}
            </Typography>
          </Box>
          
          <List>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{
                      px: 3,
                      py: 2,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default PremiumHeader; 