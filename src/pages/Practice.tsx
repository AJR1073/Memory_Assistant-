import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';
import { useBrowserSpeechRecognition } from '../hooks/useBrowserSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Verse {
  id: string;
  reference: string;
  text: string;
}

export default function Practice() {
  const { verseId } = useParams<{ verseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRecognitionResult = useCallback((text: string) => {
    setRecognizedText(text);
    setDialogOpen(true);
  }, []);

  const { speak, speaking, cancel: cancelSpeech } = useSpeechSynthesis();
  const {
    isListening,
    startListening,
    stopListening,
    hasSupport: hasSpeechRecognition,
  } = useBrowserSpeechRecognition(handleRecognitionResult);

  useEffect(() => {
    const fetchVerse = async () => {
      if (!currentUser || !verseId) return;

      try {
        const verseDoc = await getDoc(doc(db, 'verses', verseId));
        if (verseDoc.exists()) {
          setVerse({ id: verseDoc.id, ...verseDoc.data() } as Verse);
        } else {
          setError('Verse not found');
        }
      } catch (err) {
        console.error('Error fetching verse:', err);
        setError('Failed to load verse');
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [currentUser, verseId]);

  const handleSpeak = () => {
    if (verse) {
      speak(verse.text);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setRecognizedText('');
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

  if (error || !verse) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Typography color="error">{error || 'Verse not found'}</Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/verses')}
            sx={{ mt: 2 }}
          >
            Back to Verses
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Practice Verse
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {verse.reference}
          </Typography>
          <Typography variant="body1" paragraph>
            {verse.text}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={speaking ? <StopIcon /> : <PlayIcon />}
              onClick={speaking ? cancelSpeech : handleSpeak}
            >
              {speaking ? 'Stop' : 'Listen'}
            </Button>

            {hasSpeechRecognition && (
              <Button
                variant="contained"
                color={isListening ? 'error' : 'primary'}
                startIcon={isListening ? <MicOffIcon /> : <MicIcon />}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? 'Stop Recording' : 'Start Recording'}
              </Button>
            )}
          </Box>
        </Paper>

        <Button
          variant="outlined"
          onClick={() => navigate('/verses')}
        >
          Back to Verses
        </Button>

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Your Recitation</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={recognizedText}
              onChange={(e) => setRecognizedText(e.target.value)}
              variant="outlined"
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            {isListening && (
              <Button 
                color="error"
                onClick={stopListening}
                startIcon={<MicOffIcon />}
              >
                Stop Recording
              </Button>
            )}
            {!isListening && (
              <Button
                color="primary"
                onClick={startListening}
                startIcon={<MicIcon />}
              >
                Start New Recording
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
