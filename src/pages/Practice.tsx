import { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';
import { useVerses } from '../hooks/useVerses';
import { useBrowserSpeechRecognition } from '../hooks/useBrowserSpeechRecognition';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Verse } from '../types';

export default function Practice() {
  const navigate = useNavigate();
  const { verseId } = useParams<{ verseId?: string }>();
  const { verses, loading, error } = useVerses();
  const { currentUser } = useAuth();
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [userInput, setUserInput] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
    details?: string;
  } | null>(null);

  const handleSpeechResult = useCallback(
    (result: { text: string; isFinal: boolean; isNewSentence: boolean }) => {
      if (!result.isFinal) return; // Only handle final results
      
      setUserInput((prevInput) => {
        const currentInput = String(prevInput || '');
        // Always append with a space if there's existing text
        return currentInput ? `${currentInput} ${result.text}` : result.text;
      });
    },
    []
  );

  const handleSpeechError = useCallback((error: string) => {
    setSpeechError(error);
    setFeedback({
      message: error,
      severity: 'error'
    });
  }, []);

  const {
    isListening: isSpeechListening,
    startListening,
    stopListening,
    hasSupport,
  } = useBrowserSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
  });

  // Display speech recognition status
  useEffect(() => {
    if (speechError) {
      setFeedback({
        message: "Speech Recognition Error",
        severity: "error",
        details: speechError
      });
    }
  }, [speechError]);

  const toggleListening = async () => {
    if (isSpeechListening) {
      stopListening();
    } else {
      setFeedback(null);
      await startListening();
    }
  };

  // Set initial verse based on verseId or random selection
  useEffect(() => {
    if (!loading && verses.length > 0 && !currentVerse) {
      if (verseId) {
        const verse = verses.find(v => v.id === verseId);
        if (verse) {
          setCurrentVerse(verse);
        } else {
          // If verse not found, redirect to practice with random verse
          navigate('/practice');
        }
      } else {
        const randomIndex = Math.floor(Math.random() * verses.length);
        setCurrentVerse(verses[randomIndex]);
      }
    }
  }, [loading, verses.length, verseId, navigate]);

  const checkVerse = (input: string, verse: Verse) => {
    // Remove punctuation and convert to lowercase for comparison
    const normalizeText = (text: string) =>
      text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedInput = normalizeText(input);
    const normalizedVerse = normalizeText(verse.text);

    // Split into words for detailed comparison
    const inputWords = normalizedInput.split(' ');
    const verseWords = normalizedVerse.split(' ');

    // Find missing and extra words
    const missingWords = verseWords.filter((word) => !inputWords.includes(word));
    const extraWords = inputWords.filter((word) => !verseWords.includes(word));

    // Calculate similarity
    const correctWords = verseWords.filter((word) => inputWords.includes(word));
    const similarity = correctWords.length / verseWords.length;

    return {
      isCorrect: similarity >= 0.8,
      missingWords,
      extraWords,
      similarity: Math.round(similarity * 100),
    };
  };

  const updateLeaderboard = async (accuracy: number) => {
    if (!currentUser) {
      console.log('No current user, skipping leaderboard update');
      return;
    }
    
    try {
      console.log('Updating leaderboard for user:', currentUser.uid, 'with accuracy:', accuracy);
      const leaderboardRef = doc(db, 'leaderboard', currentUser.uid);
      const leaderboardDoc = await getDoc(leaderboardRef);
      
      const points = accuracy >= 95 ? 10 : accuracy >= 80 ? 5 : 2;
      console.log('Points to award:', points);
      
      if (leaderboardDoc.exists()) {
        console.log('Updating existing leaderboard entry');
        await setDoc(leaderboardRef, {
          totalScore: increment(points),
          versesMemorized: increment(1),
          lastUpdated: new Date(),
          userId: currentUser.uid,
          initials: currentUser.email?.substring(0, 2).toUpperCase() || 'AA'
        }, { merge: true });
      } else {
        console.log('Creating new leaderboard entry');
        await setDoc(leaderboardRef, {
          userId: currentUser.uid,
          initials: currentUser.email?.substring(0, 2).toUpperCase() || 'AA',
          totalScore: points,
          versesMemorized: 1,
          lastUpdated: new Date()
        });
      }
      console.log('Leaderboard update successful');
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentVerse && userInput.trim()) {
      const result = checkVerse(userInput, currentVerse);
      if (result.isCorrect) {
        setFeedback({
          message: "Correct! Well done!",
          severity: "success",
          details: result.similarity === 100
            ? "Perfect match!"
            : `Accuracy: ${result.similarity}%`
        });
        // Update leaderboard when verse is correct
        updateLeaderboard(result.similarity);
      } else {
        let details = `Accuracy: ${result.similarity}%\n`;
        if (result.missingWords.length > 0) {
          details += `\nMissing words: "${result.missingWords.join('", "')}"`;
        }
        if (result.extraWords.length > 0) {
          details += `\nExtra words: "${result.extraWords.join('", "')}"`;
        }
        details += `\n\nCorrect verse: "${currentVerse.text}"`;
        
        setFeedback({
          message: "Not quite right. Try again!",
          severity: "error",
          details
        });
      }
    }
  };

  const handleNextVerse = () => {
    setFeedback(null);
    setUserInput('');
    const newIndex = Math.floor(Math.random() * verses.length);
    setCurrentVerse(verses[newIndex]);
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
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!currentVerse) {
    return (
      <Container>
        <Box mt={4}>
          <Alert severity="info">
            No verses available. Please add some verses first.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/add')}
            sx={{ mt: 2 }}
          >
            Add Verse
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Practice
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {currentVerse.reference}
          </Typography>
        </Box>

        {speechError && (
          <Alert
            severity="error"
            onClose={() => setSpeechError(null)}
            sx={{ mb: 2 }}
          >
            {speechError}
          </Alert>
        )}

        {feedback && (
          <Alert
            severity={feedback.severity}
            sx={{
              mb: 2,
              whiteSpace: 'pre-wrap',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {feedback.message}
            </Typography>
            {feedback.details && (
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                {feedback.details}
              </Typography>
            )}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ position: 'relative' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="practice"
              label="Type or speak the verse from memory"
              multiline
              rows={4}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              autoFocus
              disabled={isSpeechListening}
            />
            {hasSupport && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  bgcolor: 'background.paper',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <Tooltip title={isSpeechListening ? "Stop Listening" : "Start Listening"}>
                  <IconButton
                    onClick={toggleListening}
                    color={isSpeechListening ? "error" : "primary"}
                    sx={{ ml: 1 }}
                  >
                    {isSpeechListening ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!userInput.trim()}
            >
              Check
            </Button>
            {feedback?.severity === 'success' && (
              <Button
                variant="contained"
                color="success"
                onClick={handleNextVerse}
              >
                Next Verse
              </Button>
            )}
            {hasSupport && (
              <Tooltip title={isSpeechListening ? "Stop Listening" : "Start Listening"}>
                <IconButton
                  onClick={toggleListening}
                  color={isSpeechListening ? "error" : "primary"}
                  sx={{ ml: 1 }}
                >
                  {isSpeechListening ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
