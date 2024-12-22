import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddVerse from './pages/AddVerse';
import Practice from './pages/Practice';
import Leaderboard from './pages/Leaderboard';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import EditVerse from './pages/EditVerse';
import PracticeVerse from './pages/PracticeVerse';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-verse"
              element={
                <PrivateRoute>
                  <AddVerse />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-verse/:verseId"
              element={
                <PrivateRoute>
                  <EditVerse />
                </PrivateRoute>
              }
            />
            <Route
              path="/practice"
              element={
                <PrivateRoute>
                  <Practice />
                </PrivateRoute>
              }
            />
            <Route
              path="/practice/:verseId"
              element={
                <PrivateRoute>
                  <Practice />
                </PrivateRoute>
              }
            />
            <Route
              path="/practice-verse/:verseId"
              element={
                <PrivateRoute>
                  <PracticeVerse />
                </PrivateRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <PrivateRoute>
                  <Leaderboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
