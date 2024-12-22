import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useVerses } from '../hooks/useVerses';

export default function EditVerse() {
  const { verseId } = useParams<{ verseId: string }>();
  const navigate = useNavigate();
  const { verses, updateVerse, loading, error } = useVerses();
  
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const verse = verses.find(v => v.id === verseId);
    if (verse) {
      setReference(verse.reference);
      setText(verse.text);
    }
  }, [verses, verseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseId) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateVerse(verseId, {
        reference,
        text,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating verse:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to update verse');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box mt={4}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!verses.find(v => v.id === verseId)) {
    return (
      <Container>
        <Box mt={4}>
          <Alert severity="error">
            Verse not found
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Verse
        </Typography>

        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
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
            disabled={saving}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="text"
            label="Verse Text"
            id="text"
            multiline
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={saving}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
