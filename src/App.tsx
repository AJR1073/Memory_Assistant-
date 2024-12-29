import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Practice from './pages/Practice';
import PracticeVerse from './pages/PracticeVerse';
import Leaderboard from './pages/Leaderboard';
import Dashboard from './pages/Dashboard';
import AddVerse from './pages/AddVerse';
import EditVerse from './pages/EditVerse';
import ManageTranslations from './pages/ManageTranslations';
import Settings from './pages/Settings';
import RehearsalSchedule from './pages/RehearsalSchedule';
import { AuthProvider } from './contexts/AuthContext';
import { useModules } from './hooks/useModules';
import PrivateRoute from './components/PrivateRoute';

function AppRoutes() {
  const { hasModuleAccess } = useModules();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/add-verse" element={
        <PrivateRoute>
          <AddVerse />
        </PrivateRoute>
      } />
      <Route path="/edit-verse/:verseId" element={
        <PrivateRoute>
          <EditVerse />
        </PrivateRoute>
      } />
      <Route path="/practice" element={
        <PrivateRoute>
          <Practice />
        </PrivateRoute>
      } />
      <Route path="/practice/:verseId" element={
        <PrivateRoute>
          <PracticeVerse />
        </PrivateRoute>
      } />
      <Route path="/leaderboard" element={
        <PrivateRoute>
          <Leaderboard />
        </PrivateRoute>
      } />
      <Route path="/translations" element={
        <PrivateRoute>
          <ManageTranslations />
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      } />
      <Route path="/rehearsals" element={
        <PrivateRoute>
          <RehearsalSchedule />
        </PrivateRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <Navigation />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <AppRoutes />
              </Box>
            </Box>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
