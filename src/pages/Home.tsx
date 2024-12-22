import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        Memory Assistant
      </Typography>
      <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
        Your Personal Bible Verse Memorization Tool
      </Typography>
      <Box sx={{ mt: 4 }}>
        {currentUser ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        ) : (
          <Box sx={{ '& > *': { m: 1 } }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
