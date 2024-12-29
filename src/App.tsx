import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet, useRouteError } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
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

function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom color="error">
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </Typography>
          <Button variant="contained" color="primary" href="/">
            Return to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function Layout() {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorBoundary />}>
      <Route element={<Layout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="/"
          element={<RequireAuth><Dashboard /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="verses"
          element={<RequireAuth><Verses /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="verses/add"
          element={<RequireAuth><AddVerse /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="verses/edit/:verseId"
          element={<RequireAuth><EditVerse /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="public-library"
          element={<RequireAuth><PublicLibrary /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="practice/:verseId"
          element={<RequireAuth><PracticeVerse /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="leaderboard"
          element={<RequireAuth><Leaderboard /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="settings"
          element={<RequireAuth><Settings /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route
          path="rehearsals"
          element={<RequireAuth><RehearsalSchedule /></RequireAuth>}
          errorElement={<ErrorBoundary />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
