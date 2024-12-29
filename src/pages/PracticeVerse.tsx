import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Stack,
  Collapse,
} from '@mui/material';
import {
  Stop as StopIcon,
  Mic as MicIcon,
  VolumeUp as SpeakIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  doc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface Verse {
  id: string;
  reference: string;
  text: string;
  translation: string;
}

interface SpeechSynthesis {
  speak: (text: string) => void;
  speaking: boolean;
  cancel: () => void;
}

interface SpeechRecognition {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
}

interface WordComparison {
  word: string;
  status: 'correct' | 'incorrect' | 'missing';
  expected?: string;
}

// Real speech synthesis implementation
const useSpeechSynthesis = () => {
  const synth = window.speechSynthesis;

  return {
    speak: (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    },
    speaking: synth.speaking,
    cancel: () => synth.cancel(),
  };
};

// Real speech recognition implementation
const useSpeechRecognition = ({ onResult }: { onResult: (text: string) => void }) => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ');
    onResult(transcript);
  };

  return {
    startListening: async () => {
      try {
        await recognition.start();
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    },
    stopListening: async () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    },
  };
};

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    speechSynthesis: SpeechSynthesis;
  }
}

export default function PracticeVerse() {
  const { verseId } = useParams<{ verseId: string }>();
  const { currentUser } = useAuth();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showTypedAccuracy, setShowTypedAccuracy] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState<WordComparison[]>([]);
  const [showVerse, setShowVerse] = useState(false);
  const { speak, speaking, cancel } = useSpeechSynthesis();
  const { startListening, stopListening } = useSpeechRecognition({
    onResult: (text: string) => {
      const cleanText = text.trim();
      setSpokenText(cleanText);
      setTypedText(cleanText);
      if (verse) {
        const { accuracy: score, comparison } = compareTexts(cleanText, verse.text);
        setAccuracy(score);
        setComparisonResult(comparison);
        updateUserScore(score);
      }
    },
  });

  const compareTexts = (input: string, target: string): { accuracy: number; comparison: WordComparison[] } => {
    // Normalize both texts: lowercase and split into words
    const normalize = (text: string) => 
      text.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 0);

    const inputWords = normalize(input);
    const targetWords = normalize(target);
    
    // Create a similarity matrix for each word pair
    const similarityMatrix: number[][] = [];
    for (let i = 0; i < inputWords.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < targetWords.length; j++) {
        // Calculate word similarity (0 to 1)
        const similarity = calculateWordSimilarity(inputWords[i], targetWords[j]);
        similarityMatrix[i][j] = similarity;
      }
    }

    // Track which target words have been matched
    const matchedTargetIndices = new Set<number>();
    const comparison: WordComparison[] = [];
    let totalScore = 0;

    // For each input word, find its best match in remaining target words
    inputWords.forEach((inputWord, inputIndex) => {
      let bestMatch = {
        targetIndex: -1,
        similarity: 0
      };

      // Find the best unmatched target word
      for (let j = 0; j < targetWords.length; j++) {
        if (!matchedTargetIndices.has(j) && similarityMatrix[inputIndex][j] > bestMatch.similarity) {
          bestMatch = {
            targetIndex: j,
            similarity: similarityMatrix[inputIndex][j]
          };
        }
      }

      if (bestMatch.targetIndex !== -1 && bestMatch.similarity > 0.8) {
        // Good match found
        matchedTargetIndices.add(bestMatch.targetIndex);
        totalScore += bestMatch.similarity;
        
        if (bestMatch.similarity === 1) {
          comparison.push({
            word: inputWord,
            status: 'correct'
          });
        } else {
          comparison.push({
            word: inputWord,
            status: 'incorrect',
            expected: targetWords[bestMatch.targetIndex]
          });
        }
      } else {
        // No good match found - this is an extra word
        comparison.push({
          word: inputWord,
          status: 'incorrect',
          expected: undefined
        });
      }
    });

    // Add missing target words
    for (let i = 0; i < targetWords.length; i++) {
      if (!matchedTargetIndices.has(i)) {
        comparison.push({
          word: '___',
          status: 'missing',
          expected: targetWords[i]
        });
      }
    }

    const accuracy = (totalScore / targetWords.length) * 100;
    return { accuracy, comparison };
  };

  const calculateWordSimilarity = (word1: string, word2: string): number => {
    if (word1 === word2) return 1;
    
    // Calculate Levenshtein distance
    const m = word1.length;
    const n = word2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (word1[i - 1] === word2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1      // insertion
          );
        }
      }
    }

    // Convert distance to similarity score (0 to 1)
    const maxLength = Math.max(m, n);
    const distance = dp[m][n];
    return Math.max(0, (maxLength - distance) / maxLength);
  };

  const updateUserScore = async (accuracy: number) => {
    if (!currentUser) return;
    
    try {
      const pointsEarned = Math.floor(accuracy); // 1 point per percentage of accuracy
      const userRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        score: increment(pointsEarned)
      });
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  useEffect(() => {
    const fetchVerse = async () => {
      if (!verseId) return;

      try {
        // First try to fetch from user's verses
        const verseDoc = await getDoc(doc(db, 'verses', verseId));
        
        if (verseDoc.exists()) {
          setVerse({ id: verseDoc.id, ...verseDoc.data() } as Verse);
        } else {
          // If not found, try public library
          const publicVerseDoc = await getDoc(doc(db, 'publicLibrary', verseId));
          if (publicVerseDoc.exists()) {
            setVerse({ id: publicVerseDoc.id, ...publicVerseDoc.data() } as Verse);
          } else {
            setError('Verse not found');
          }
        }
      } catch (err) {
        console.error('Error fetching verse:', err);
        setError('Failed to load verse');
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [verseId]);

  const handleStartListening = async () => {
    setIsListening(true);
    setSpokenText('');
    setTypedText('');
    setAccuracy(null);
    setShowTypedAccuracy(null);
    await startListening();
  };

  const handleStopListening = async () => {
    setIsListening(false);
    await stopListening();
  };

  const handleSpeak = () => {
    if (verse) {
      speak(verse.text);
    }
  };

  const handleCheckTyped = () => {
    if (verse) {
      const { accuracy: score, comparison } = compareTexts(typedText, verse.text);
      setShowTypedAccuracy(score);
      setComparisonResult(comparison);
      updateUserScore(score);
      setShowVerse(true); // Show verse after checking
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

  if (error || !verse) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Verse not found'}
        </Alert>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {verse.reference} ({verse.translation})
            </Typography>
            <Tooltip title={showVerse ? "Hide verse" : "Show verse"}>
              <IconButton onClick={() => setShowVerse(!showVerse)}>
                {showVerse ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Collapse in={showVerse}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: 'primary.light',
                color: 'primary.contrastText'
              }}
            >
              <Typography variant="body1">
                {verse.text}
              </Typography>
            </Paper>
          </Collapse>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Tooltip title="Speak verse">
              <IconButton onClick={handleSpeak} disabled={speaking}>
                <SpeakIcon />
              </IconButton>
            </Tooltip>
            
            {!isListening ? (
              <Tooltip title="Start recording">
                <IconButton onClick={handleStartListening} color="primary">
                  <MicIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Stop recording">
                <IconButton onClick={handleStopListening} color="error">
                  <StopIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {(accuracy !== null || showTypedAccuracy !== null) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Comparison Results:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {comparisonResult.map((item, index) => (
                    <Box key={index}>
                      {item.status === 'correct' && (
                        <Typography 
                          component="span" 
                          sx={{ color: 'success.main' }}
                        >
                          {item.word}{' '}
                        </Typography>
                      )}
                      {item.status === 'incorrect' && (
                        <Tooltip title={`Expected: ${item.expected}`}>
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: 'error.main',
                              textDecoration: 'line-through'
                            }}
                          >
                            {item.word}{' '}
                            <Typography 
                              component="span" 
                              sx={{ 
                                color: 'warning.main',
                                textDecoration: 'none'
                              }}
                            >
                              ({item.expected})
                            </Typography>
                          </Typography>
                        </Tooltip>
                      )}
                      {item.status === 'missing' && (
                        <Tooltip title={`Missing: ${item.expected}`}>
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: 'warning.main',
                              textDecoration: 'underline',
                              fontStyle: 'italic'
                            }}
                          >
                            {item.expected}{' '}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Paper>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Accuracy: {(accuracy ?? showTypedAccuracy)?.toFixed(1)}%
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Type verse here"
            value={typedText}
            onChange={(e) => {
              setTypedText(e.target.value);
              setShowTypedAccuracy(null);
              setShowVerse(false); // Hide verse when typing
            }}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={handleCheckTyped}
            startIcon={<CheckIcon />}
            disabled={!typedText}
          >
            Check Text
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
