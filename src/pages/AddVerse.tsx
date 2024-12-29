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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareToPublic, setShareToPublic] = useState(false);

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

  const handleCancel = () => {
    navigate('/verses');
  };

  const validateForm = () => {
    if (!text.trim()) {
      setError('Verse text is required');
      return false;
    }

    if (chapter && (isNaN(Number(chapter)) || Number(chapter) < 1)) {
      setError('Chapter must be a positive number');
      return false;
    }

    if (verse && (isNaN(Number(verse)) || Number(verse) < 1)) {
      setError('Verse must be a positive number');
      return false;
    }

    if (text.length > 2000) {
      setError('Verse text is too long (maximum 2000 characters)');
      return false;
    }

    if (!book) {
      setError('Book is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to add verses');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const verseData = {
        reference: book + (chapter ? ` ${chapter}` : '') + (verse ? `:${verse}` : ''),
        text,
        translation,
        userId: currentUser.uid,
        createdAt: new Date(),
      };

      // Add to user's verses
      await addDoc(collection(db, 'verses'), verseData);

      // Add to public library if shared
      if (shareToPublic) {
        await addDoc(collection(db, 'publicLibrary'), {
          ...verseData,
          contributedBy: currentUser.uid,
          contributorName: currentUser.displayName || 'Anonymous User',
          likedBy: [],
        });
      }

      navigate('/verses');
    } catch (err) {
      console.error('Error adding verse:', err);
      setError('Failed to add verse. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (translationsLoading || booksLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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

          <Box sx={{ mb: 2 }}>
            <Autocomplete
              options={books.map(b => b.name)}
              value={book}
              onChange={(_, value) => setBook(value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Book"
                  required
                  error={!!error && !book}
                  helperText={error && !book ? 'Book is required' : ''}
                />
              )}
            />
          </Box>

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="Chapter (optional)"
              type="number"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
              error={!!(chapter && (isNaN(Number(chapter)) || Number(chapter) < 1))}
              helperText={chapter && (isNaN(Number(chapter)) || Number(chapter) < 1) ? 'Must be a positive number' : ''}
            />
            <TextField
              label="Verse (optional)"
              type="number"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
              error={!!(verse && (isNaN(Number(verse)) || Number(verse) < 1))}
              helperText={verse && (isNaN(Number(verse)) || Number(verse) < 1) ? 'Must be a positive number' : ''}
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
              error={!text.trim() || text.length > 2000}
              helperText={
                !text.trim() 
                  ? 'Verse text is required' 
                  : text.length > 2000 
                    ? 'Text is too long (maximum 2000 characters)' 
                    : `${text.length}/2000 characters`
              }
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={[]}
              onChange={() => {}}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags (optional)"
                  placeholder="Add tags"
                />
              )}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Share to Public Library</InputLabel>
              <Select
                value={shareToPublic}
                label="Share to Public Library"
                onChange={(e) => setShareToPublic(e.target.value === 'true')}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Adding...
                </>
              ) : (
                'Add Verse'
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
