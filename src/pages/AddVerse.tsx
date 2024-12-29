import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTranslations } from '../hooks/useTranslations';
import { useBooks } from '../hooks/useBooks';
import { initializeDatabase } from '../utils/initializeData';

export default function AddVerse() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { translations, loading: translationsLoading } = useTranslations();
  const { books, loading: booksLoading } = useBooks();
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialize database with default data
  useEffect(() => {
    if (currentUser) {
      initializeDatabase(currentUser.uid);
    }
  }, [currentUser]);

  // Set default translation
  useEffect(() => {
    if (translations.length > 0 && !translation) {
      const defaultTranslation = translations.find(t => t.isDefault) || translations[0];
      setTranslation(defaultTranslation.id);
    }
  }, [translations, translation]);

  if (translationsLoading || booksLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to add verses');
      return;
    }

    if (!text.trim()) {
      setError('Verse text is required');
      return;
    }

    try {
      // Generate reference based on available fields
      let reference = '';
      if (book) {
        reference += book;
        if (chapter) {
          reference += ` ${chapter}`;
          if (verse) {
            reference += `:${verse}`;
          }
        }
      }

      const verseData = {
        book: book || null,
        chapter: chapter ? parseInt(chapter) : null,
        verse: verse ? parseInt(verse) : null,
        text: text.trim(),
        translation,
        reference: reference || 'Custom Verse',
        createdBy: currentUser.uid,
        createdAt: new Date(),
        tags
      };

      await addDoc(collection(db, 'verses'), verseData);
      setSuccess(true);
      // Clear form
      setBook('');
      setChapter('');
      setVerse('');
      setText('');
      setTags([]);
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to add verse. Please try again.');
      console.error('Error adding verse:', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} mt={4}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Add New Verse
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Verse added successfully! Redirecting...
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Autocomplete
              options={books.map(b => b.name)}
              value={book}
              onChange={(_, newValue) => setBook(newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Book (optional)"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Typography variant="body1">{option}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    {books.find(b => b.name === option)?.description}
                  </Typography>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option === value || (!option && !value)}
            />
          </Box>

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="Chapter (optional)"
              type="number"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              fullWidth
            />
            <TextField
              label="Verse (optional)"
              type="number"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              fullWidth
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Translation</InputLabel>
              <Select
                value={translation}
                label="Translation"
                onChange={(e) => setTranslation(e.target.value)}
                required
              >
                {translations.map((trans) => (
                  <MenuItem key={trans.id} value={trans.id}>
                    {trans.name} ({trans.abbreviation})
                    {trans.isDefault && ' - Default'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              required
              label="Verse Text"
              multiline
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              error={!text.trim()}
              helperText={!text.trim() ? 'Verse text is required' : ''}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Add tags"
                  helperText="Press enter to add tags"
                />
              )}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={success}
            >
              Add Verse
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
