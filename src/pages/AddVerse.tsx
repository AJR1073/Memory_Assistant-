import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const translations = [
  { value: 'NIV', label: 'New International Version' },
  { value: 'ESV', label: 'English Standard Version' },
  { value: 'KJV', label: 'King James Version' },
  { value: 'NKJV', label: 'New King James Version' },
  { value: 'NLT', label: 'New Living Translation' },
];

export default function AddVerse() {
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('NIV');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to add verses');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const verseData = {
        userId: currentUser.uid,
        reference,
        text,
        translation,
        createdAt: new Date(),
        lastPracticed: null,
        accuracy: null,
      };

      await addDoc(collection(db, 'verses'), verseData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error adding verse:', err);
      setError('Failed to add verse. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Add New Verse
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="reference"
            label="Bible Reference"
            name="reference"
            autoFocus
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., John 3:16"
          />

          <TextField
            margin="normal"
            required
            fullWidth
            select
            id="translation"
            label="Bible Translation"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          >
            {translations.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            margin="normal"
            required
            fullWidth
            id="text"
            label="Verse Text"
            name="text"
            multiline
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            Add Verse
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
