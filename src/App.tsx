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
import { AuthProvider } from './contexts/AuthContext';
import { useModules } from './hooks/useModules';
import PrivateRoute from './components/PrivateRoute';

function AppRoutes() {
  const { hasModuleAccess } = useModules();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
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
          <Practice />
        </PrivateRoute>
      } />
      <Route path="/practice-verse/:verseId" element={
        <PrivateRoute>
          <PracticeVerse />
        </PrivateRoute>
      } />
      <Route path="/leaderboard" element={
        <PrivateRoute>
          <Leaderboard />
        </PrivateRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
