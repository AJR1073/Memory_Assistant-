import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Verses from './pages/Verses';
import PracticeVerse from './pages/PracticeVerse';
import EditVerse from './pages/EditVerse';
import AddVerse from './pages/AddVerse';
import PublicLibrary from './pages/PublicLibrary';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import RehearsalSchedule from './pages/RehearsalSchedule';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <Router>
            <Navigation />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/verses" element={<RequireAuth><Verses /></RequireAuth>} />
              <Route path="/verses/add" element={<RequireAuth><AddVerse /></RequireAuth>} />
              <Route path="/verses/edit/:verseId" element={<RequireAuth><EditVerse /></RequireAuth>} />
              <Route path="/public-library" element={<RequireAuth><PublicLibrary /></RequireAuth>} />
              <Route path="/practice/:verseId" element={<RequireAuth><PracticeVerse /></RequireAuth>} />
              <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/rehearsals" element={<RequireAuth><RehearsalSchedule /></RequireAuth>} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default App;
