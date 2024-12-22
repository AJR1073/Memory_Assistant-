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

// Function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const correctWords = words1.filter((word, index) => word === words2[index]);
  return (correctWords.length / Math.max(words1.length, words2.length)) * 100;
}

export default function PracticeVerse() {
  const navigate = useNavigate();
  const { verseId } = useParams<{ verseId: string }>();
  const { verses, loading } = useVerses();
  const { currentUser } = useAuth();
  
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error' | 'warning';
  } | null>(null);

  const verse = verses.find(v => v.id === verseId);

  const {
    isListening: isSpeechListening,
    startListening,
    stopListening,
    hasSupport,
  } = useBrowserSpeechRecognition({
    onResult: ({ text, isFinal, isNewSentence }) => {
      console.log('Speech recognition result:', { text, isFinal, isNewSentence });
      
      setUserInput((prevInput: string) => {
        // Always ensure prevInput is a string
        const currentInput = String(prevInput || '');
        
        // If it's a new sentence (after a pause), add a space
        if (isNewSentence && currentInput.trim()) {
          return `${currentInput.trim()} ${text}`;
        }
        
        // If we're still in the same sentence, replace the interim results
        if (!isFinal) {
          // Find the last complete sentence and keep it
          const lastSentenceMatch = currentInput.match(/(.*[.!?])\s*([^.!?]*)$/);
          if (lastSentenceMatch) {
            return `${lastSentenceMatch[1]} ${text}`;
          }
          // If no complete sentence found, just use the new text
          return text;
        }
        
        // For final results in the same sentence, update the current sentence
        const lastChar = currentInput.slice(-1);
        // Add a space if the last character is a sentence ending punctuation
        if (/[.!?]/.test(lastChar)) {
          return `${currentInput} ${text}`;
        }
        return text;
      });
    },
    onError: (error) => {
      console.log('Speech recognition error:', error);
      setFeedback({
        message: error,
        severity: 'error'
      });
      setIsListening(false);
    },
  });

  useEffect(() => {
    setIsListening(isSpeechListening);
  }, [isSpeechListening]);

  useEffect(() => {
    if (!loading && !verse) {
      navigate('/dashboard');
    }
  }, [loading, verse, navigate]);

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
    if (!verse || !userInput.trim()) return;

    const similarity = calculateSimilarity(userInput, verse.text);
    setScore(similarity);

    if (similarity === 100) {
      setFeedback({
        message: "Perfect! You've memorized this verse perfectly!",
        severity: "success"
      });
      updateLeaderboard(similarity);
    } else if (similarity >= 80) {
      setFeedback({
        message: "Great job! You're very close to perfect memorization.",
        severity: "success"
      });
      updateLeaderboard(similarity);
    } else if (similarity >= 60) {
      setFeedback({
        message: "Good effort! Keep practicing to improve your accuracy.",
        severity: "warning"
      });
    } else {
      setFeedback({
        message: "Keep practicing! You'll get better with time.",
        severity: "error"
      });
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setScore(null);
    setFeedback(null);
  };

  const toggleListening = async () => {
    if (isListening) {
      console.log('Stopping speech recognition...');
      setFeedback(null);
      stopListening();
      setIsListening(false);
    } else {
      console.log('Starting speech recognition...');
      setFeedback(null);
      setUserInput('');
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await startListening();
        setIsListening(true);
      } catch (error) {
        console.error('Error toggling speech recognition:', error);
        setFeedback({
          message: 'Please allow microphone access to use speech recognition.',
          severity: 'error'
        });
        setIsListening(false);
      }
    }
  };

  if (loading || !verse) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 4, p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Practice Verse
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            {verse.reference}
          </Typography>
        </Box>

        {feedback && (
          <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type or speak the verse..."
              sx={{ mb: 2 }}
            />
            {hasSupport && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 8,
                  bottom: 24,
                }}
              >
                <Tooltip title={isListening ? "Stop Listening" : "Start Listening"}>
                  <IconButton
                    onClick={toggleListening}
                    color={isListening ? "error" : "primary"}
                  >
                    {isListening ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!userInput.trim()}
            >
              Check
            </Button>
            {score !== null && (
              <Button
                variant="outlined"
                onClick={handleTryAgain}
              >
                Try Again
              </Button>
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
