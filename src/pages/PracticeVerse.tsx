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
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useVerses } from '../hooks/useVerses';
import { useBrowserSpeechRecognition } from '../hooks/useBrowserSpeechRecognition';

// Function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const correctWords = words1.filter((word, index) => word === words2[index]);
  return (correctWords.length / Math.max(words1.length, words2.length)) * 100;
}

// Function to compare words and highlight differences
function compareWords(input: string, correct: string): JSX.Element[] {
  const inputWords = input.split(/\s+/);
  const correctWords = correct.split(/\s+/);
  
  return correctWords.map((word, index) => {
    const inputWord = inputWords[index] || '';
    const isCorrect = inputWord.toLowerCase() === word.toLowerCase();
    
    return (
      <span
        key={index}
        style={{
          color: isCorrect ? 'inherit' : 'red',
          textDecoration: isCorrect ? 'none' : 'underline',
          marginRight: '4px',
        }}
      >
        {word}
      </span>
    );
  });
}

export default function PracticeVerse() {
  const { verseId } = useParams<{ verseId: string }>();
  const navigate = useNavigate();
  const { verses, loading, error } = useVerses();
  
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const verse = verses.find(v => v.id === verseId);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasSupport,
  } = useBrowserSpeechRecognition({
    onResult: (text) => setUserInput(text),
    onError: (error) => setSpeechError(error),
  });

  useEffect(() => {
    if (!loading && !verse) {
      navigate('/dashboard');
    }
  }, [verse, loading, navigate]);

  const handleCheck = () => {
    if (!verse) return;
    
    const similarity = calculateSimilarity(userInput, verse.text);
    setScore(similarity);
    
    if (similarity >= 95) {
      setFeedback('Excellent! Perfect recall!');
    } else if (similarity >= 80) {
      setFeedback('Very good! Just a few minor differences.');
    } else if (similarity >= 60) {
      setFeedback('Good effort! Keep practicing to improve accuracy.');
    } else {
      setFeedback('Keep practicing! Try reading the verse a few more times.');
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setScore(null);
    setShowAnswer(false);
    setFeedback(null);
    resetTranscript();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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

  if (!verse) {
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
          Practice Verse
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {verse.reference}
          </Typography>
        </Box>

        {speechError && (
          <Alert severity="error" onClose={() => setSpeechError(null)} sx={{ mb: 2 }}>
            {speechError}
          </Alert>
        )}

        {!score && (
          <Box component="form" noValidate>
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
                disabled={isListening}
              />
              <Box sx={{ 
                position: 'absolute', 
                right: 8, 
                bottom: 8, 
                display: 'flex',
                gap: 1,
                bgcolor: 'background.paper',
                padding: '4px',
                borderRadius: '4px'
              }}>
                {hasSupport ? (
                  <Tooltip title={isListening ? 'Stop speaking' : 'Start speaking'}>
                    <IconButton
                      onClick={toggleListening}
                      color={isListening ? 'error' : 'primary'}
                      sx={{
                        animation: isListening ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': {
                            transform: 'scale(1)',
                          },
                          '50%': {
                            transform: 'scale(1.1)',
                          },
                          '100%': {
                            transform: 'scale(1)',
                          },
                        },
                      }}
                    >
                      {isListening ? <MicOffIcon /> : <MicIcon />}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Speech recognition is not supported in this browser">
                    <span>
                      <IconButton disabled>
                        <MicIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                {userInput && (
                  <Tooltip title="Clear input">
                    <IconButton onClick={handleTryAgain} color="default">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCheck}
                disabled={!userInput.trim()}
              >
                Check
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>
        )}

        {score !== null && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Score: {Math.round(score)}%
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={score}
                color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            {feedback && (
              <Alert severity={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'} sx={{ mb: 2 }}>
                {feedback}
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleTryAgain}
                sx={{ mr: 2 }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Button>
            </Box>

            {showAnswer && (
              <Box sx={{ mt: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Your answer:
                  </Typography>
                  <Typography paragraph>
                    {userInput || '(empty)'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Correct verse (differences highlighted):
                  </Typography>
                  <Typography paragraph>
                    {compareWords(userInput, verse.text)}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
