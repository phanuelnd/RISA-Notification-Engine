import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Description as TemplatesIcon,
  Business as ServicesIcon,
  Analytics as AnalyticsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'persistent' | 'temporary';
}

/**
 * Sidebar navigation component
 * Provides main navigation links with icons and active states
 */
export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onClose, 
  variant = 'persistent' 
}) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: DashboardIcon,
      description: 'Overview and statistics'
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: NotificationsIcon,
      description: 'Manage notifications',
      badge: 3 // Mock notification count
    },
    {
      name: 'Templates',
      path: '/templates',
      icon: TemplatesIcon,
      description: 'Email and SMS templates'
    },
    {
      name: 'Services',
      path: '/services',
      icon: ServicesIcon,
      description: 'Manage services and API keys'
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: AnalyticsIcon,
      description: 'Reports and insights'
    },
    {
      name: 'Users',
      path: '/users',
      icon: UsersIcon,
      description: 'User management'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      description: 'System configuration'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main', 
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
              NE
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Notification Engine
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {navigationItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                sx={{
                  borderRadius: 1,
                  backgroundColor: active ? 'primary.50' : 'transparent',
                  border: active ? 1 : 0,
                  borderColor: active ? 'primary.200' : 'transparent',
                  '&:hover': {
                    backgroundColor: active ? 'primary.100' : 'action.hover',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.50',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      <item.icon sx={{ 
                        color: active ? 'primary.main' : 'text.secondary',
                        fontSize: 20
                      }} />
                    </Badge>
                  ) : (
                    <item.icon sx={{ 
                      color: active ? 'primary.main' : 'text.secondary',
                      fontSize: 20
                    }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: active ? 600 : 400,
                    color: active ? 'primary.main' : 'text.primary',
                    fontSize: '0.875rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: 'text.secondary'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/help"
            onClick={isMobile ? onClose : undefined}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HelpIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Help & Support"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                color: 'text.secondary'
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : variant}
      open={isOpen}
      onClose={onClose}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          position: 'fixed',
          height: '100vh',
          zIndex: 1200,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
