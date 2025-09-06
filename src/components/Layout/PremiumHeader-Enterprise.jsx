import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Container,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

export default function PremiumHeader({ user, userRole = 'admin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    handleProfileMenuClose();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.includes('/admin/approvals')) return 'Tutor Approvals';
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
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4E7EB',
        color: '#111827',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ px: 0, py: 1 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
                mr: 2,
              }}
            >
              TC
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#111827',
                textDecoration: 'none',
              }}
              component={Link}
              to="/"
            >
              TutorCraft
            </Typography>
          </Box>

          {/* Navigation */}
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={<item.icon sx={{ fontSize: 18 }} />}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    color: isActive ? '#2D5BFF' : '#6B7280',
                    backgroundColor: isActive ? '#EBF0FF' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: isActive ? '#EBF0FF' : '#F4F6F8',
                      color: isActive ? '#2D5BFF' : '#374151',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={userRole === 'admin' ? 'Admin' : 'Tutor'}
              size="small"
              sx={{
                backgroundColor: userRole === 'admin' ? '#EBF0FF' : '#FFF0EB',
                color: userRole === 'admin' ? '#2D5BFF' : '#FF6B2C',
                fontWeight: 600,
                border: 'none',
              }}
            />
            
            <Button
              onClick={handleProfileMenuOpen}
              sx={{
                minWidth: 'auto',
                p: 1,
                borderRadius: 2,
                color: '#374151',
                '&:hover': {
                  backgroundColor: '#F4F6F8',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 1,
                  backgroundColor: '#2D5BFF',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <ArrowDownIcon sx={{ fontSize: 16, ml: 0.5 }} />
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  border: '1px solid #E4E7EB',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                  {user?.email}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {userRole === 'admin' ? 'Administrator' : 'Tutor'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleSignOut} sx={{ px: 3, py: 1.5 }}>
                <LogoutIcon sx={{ fontSize: 18, mr: 2, color: '#6B7280' }} />
                <Typography variant="body2">Sign out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
