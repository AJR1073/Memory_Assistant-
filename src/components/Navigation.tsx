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
  MenuBook,
  TheaterComedy,
  Settings as SettingsIcon,
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

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <MenuBook sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
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
                  <MenuItem component={RouterLink} to="/practice" onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">Practice</Typography>
                  </MenuItem>
                  <MenuItem component={RouterLink} to="/leaderboard" onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">Leaderboard</Typography>
                  </MenuItem>
                  {hasModuleAccess('acting') && (
                    <MenuItem component={RouterLink} to="/scripts" onClick={handleCloseNavMenu}>
                      <Typography textAlign="center">Scripts</Typography>
                    </MenuItem>
                  )}
                </>
              )}
            </Menu>
          </Box>

          <MenuBook sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
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
                <Button
                  component={RouterLink}
                  to="/practice"
                  sx={{ my: 2, color: 'white', display: 'flex', gap: 1 }}
                >
                  <MenuBook />
                  Practice
                </Button>
                <Button
                  component={RouterLink}
                  to="/leaderboard"
                  sx={{ my: 2, color: 'white' }}
                >
                  Leaderboard
                </Button>
                {hasModuleAccess('acting') && (
                  <Button
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
