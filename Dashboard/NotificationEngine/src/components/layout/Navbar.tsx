import React, { useState, type MouseEvent } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';

interface NavbarProps {
  onMenuClick?: () => void;
}

// Extracted SearchBar for clarity and reusability
const SearchBar: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1,
        backgroundColor: alpha(theme.palette.common.black, 0.05),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.black, 0.08),
        },
        mr: 2,
        ml: 0,
        width: '100%',
        maxWidth: 300,
        display: { xs: 'none', sm: 'block' },
      }}
    >
      <Box
        sx={{
          pl: 2,
          pr: 2,
          height: '100%',
          position: 'absolute',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SearchIcon />
      </Box>
      <InputBase
        placeholder="Search…"
        inputProps={{ 'aria-label': 'search' }}
        sx={{
          color: 'inherit',
          width: '100%',
          '& .MuiInputBase-input': {
            py: 1,
            pl: 5,
            pr: 1,
            transition: (theme as any).transitions?.create?.('width'),
            width: '100%',
          },
        }}
      />
    </Box>
  );
};

// Extracted UserMenu for clarity and testability
interface UserMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: { name?: string; email?: string; avatar?: string } | null;
}
const UserMenu: React.FC<UserMenuProps> = ({ anchorEl, open, onClose, onLogout, user }) => (
  <Menu
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    onClick={onClose}
    PaperProps={{
      elevation: 0,
      sx: {
        overflow: 'visible',
        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
        mt: 1.5,
        '& .MuiAvatar-root': {
          width: 32,
          height: 32,
          ml: -0.5,
          mr: 1,
        },
        '&:before': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          right: 14,
          width: 10,
          height: 10,
          bgcolor: 'background.paper',
          transform: 'translateY(-50%) rotate(45deg)',
          zIndex: 0,
        },
      },
    }}
    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
  >
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {user?.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {user?.email}
      </Typography>
    </Box>
    <Divider />
    <MenuItem onClick={onLogout}>
      <LogoutIcon sx={{ mr: 1 }} />
      Sign out
    </MenuItem>
  </Menu>
);

/**
 * Top navigation bar component.
 * Includes user menu, notifications, search, and mobile menu.
 */
export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  // Use 'down' safely, fallback to 'md' if not present
  const isMobile = useMediaQuery((theme as any).breakpoints?.down?.('md') ?? '@media (max-width:960px)');

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
        mt: 2,
        mx: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: 'calc(100% - 32px)',
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        minHeight: { xs: 56, sm: 64 }
      }}>
        {/* Left: Menu button (mobile) and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}
              sx={{ mr: 1 }}
              size="large"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
            Dashboard
          </Typography>
        </Box>

        {/* Right: Search, notifications, settings, user */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchBar />

          <IconButton color="inherit" sx={{ mr: 1 }} size="large" aria-label="notifications">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit" sx={{ mr: 1 }} size="large" aria-label="settings">
            <SettingsIcon />
          </IconButton>

          <IconButton
            onClick={handleUserMenuOpen}
            sx={{ p: 0 }}
            size="large"
            aria-label="user menu"
            aria-controls={userMenuAnchor ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(userMenuAnchor)}
          >
            <Avatar
              src={user?.avatar}
              sx={{ width: 32, height: 32, bgcolor: !user?.avatar ? 'primary.light' : undefined }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
            </Avatar>
          </IconButton>

          <UserMenu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            onLogout={handleLogout}
            user={user}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
