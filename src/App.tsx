import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Navigation />
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
