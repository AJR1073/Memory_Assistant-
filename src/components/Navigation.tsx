import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LibraryBooks as LibraryIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../hooks/useModules';
import { moduleConfig } from '../modules/config';

function Navigation() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { currentUser, logout } = useAuth();
  const { hasModuleAccess } = useModules();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Verses', path: '/verses', icon: <LibraryIcon /> },
    { text: 'Add Verse', path: '/add-verse', icon: <AddIcon /> },
    { text: 'Rehearsals', path: '/rehearsals', icon: <CalendarIcon /> },
    { text: 'Leaderboard', path: '/leaderboard', icon: <TrophyIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <DashboardIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Memory Assistant
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {currentUser && (
                <>
                  {menuItems.map((item) => (
                    <MenuItem 
                      key={item.path}
                      component={RouterLink} 
                      to={item.path} 
                      onClick={handleCloseNavMenu}
                    >
                      <Typography textAlign="center">{item.text}</Typography>
                    </MenuItem>
                  ))}
                  {hasModuleAccess('acting') && (
                    <MenuItem 
                      key="scripts"
                      component={RouterLink} 
                      to="/scripts" 
                      onClick={handleCloseNavMenu}
                    >
                      <Typography textAlign="center">Scripts</Typography>
                    </MenuItem>
                  )}
                </>
              )}
            </Menu>
          </Box>

          <DashboardIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Memory Assistant
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {currentUser && (
              <>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    sx={{ my: 2, color: 'white', display: 'flex', gap: 1 }}
                  >
                    {item.icon}
                    {item.text}
                  </Button>
                ))}
                {hasModuleAccess('acting') && (
                  <Button
                    key="scripts"
                    component={RouterLink}
                    to="/scripts"
                    sx={{ my: 2, color: 'white', display: 'flex', gap: 1 }}
                  >
                    <TheaterComedy />
                    Scripts
                  </Button>
                )}
              </>
            )}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            {currentUser ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={currentUser.email?.charAt(0).toUpperCase()} src="/static/images/avatar/2.jpg" />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem component={RouterLink} to="/settings" onClick={handleCloseUserMenu}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography textAlign="center">Settings</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleCloseUserMenu(); handleLogout(); }}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navigation;
