import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Chip,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useVerses } from '../hooks/useVerses';
import { useTranslations } from '../hooks/useTranslations';
import { useBrowserSpeechRecognition } from '../hooks/useBrowserSpeechRecognition';
import { useAuth } from '../contexts/AuthContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { compareTexts, generateHighlightedText } from '../utils/textComparison';
import '../styles/verseHighlight.css';

export default function PracticeVerse() {
  const { verseId } = useParams<{ verseId: string }>();
  const navigate = useNavigate();
  const { verses, loading } = useVerses();
  const { translations } = useTranslations();
  const { currentUser } = useAuth();
  const { updateUserScore } = useLeaderboard();
  
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [practiceCount, setPracticeCount] = useState(0);
  const [showVerse, setShowVerse] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{
    missingWords: string[];
    extraWords: string[];
    synonymsUsed: { used: string; reference: string }[];
  } | null>(null);

  const [isListening, setIsListening] = useState(false);

  const verse = verses.find(v => v.id === verseId);

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useBrowserSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setUserInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (!verse && !loading) {
      navigate('/verses');
    }
  }, [loading, verse, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verse || !currentUser) return;

    const comparison = compareTexts(verse.text, userInput);
    const isMatch = comparison.accuracy >= 0.9;
    setScore(Math.round(comparison.accuracy * 100));
    setIsCorrect(isMatch);
    setShowAnswer(true);
    setComparisonResult({
      missingWords: comparison.missingWords,
      extraWords: comparison.extraWords,
      synonymsUsed: comparison.synonymsUsed
    });

    if (isMatch) {
      setFeedback('Great job! The verse matches perfectly!');
      try {
        // Update practice stats
        const practiceRef = doc(db, 'verses', verseId, 'practices', currentUser.uid);
        const practiceDoc = await getDoc(practiceRef);
        const currentCount = practiceDoc.exists() ? practiceDoc.data().count || 0 : 0;
        const newCount = currentCount + 1;
        
        await setDoc(practiceRef, {
          userId: currentUser.uid,
          count: newCount,
          lastPracticed: new Date(),
          accuracy: comparison.accuracy
        });

        setPracticeCount(newCount);

        // Update user's score in leaderboard
        await updateUserScore(newCount * 100, newCount);
      } catch (error) {
        console.error('Error updating practice stats:', error);
      }
    } else {
      setFeedback(`Accuracy: ${Math.round(comparison.accuracy * 100)}%`);
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setScore(0);
    setFeedback(null);
    setShowAnswer(false);
    setShowVerse(false);
    setComparisonResult(null);
    resetTranscript();
  };

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      try {
        await startListening();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  if (loading || !verse) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" component="h1" gutterBottom>
            Practice Verse
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {verse.reference} ({verse.translation})
          </Typography>
          
          {/* Toggle Verse Visibility */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title={showVerse ? "Hide verse" : "Show verse"}>
              <IconButton onClick={() => setShowVerse(!showVerse)}>
                {showVerse ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Verse Text - Only shown if showVerse is true or after checking */}
          {(showVerse || showAnswer) && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              {showAnswer ? (
                <Box className="verse-comparison">
                  <div dangerouslySetInnerHTML={{ 
                    __html: generateHighlightedText(verse.text, userInput)
                  }} />
                  {comparisonResult && (
                    <Box sx={{ mt: 2 }}>
                      {comparisonResult.missingWords.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="error">Missing Words:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {comparisonResult.missingWords.map((word, index) => (
                              <Chip key={index} label={word} color="error" size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {comparisonResult.extraWords.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="warning.main">Extra Words:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {comparisonResult.extraWords.map((word, index) => (
                              <Chip key={index} label={word} color="warning" size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {comparisonResult.synonymsUsed.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" color="info.main">Synonyms Used:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {comparisonResult.synonymsUsed.map((syn, index) => (
                              <Chip 
                                key={index} 
                                label={`${syn.used} → ${syn.reference}`} 
                                color="info" 
                                size="small" 
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body1">{verse.text}</Typography>
              )}
            </Paper>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type or speak the verse from memory..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {browserSupportsSpeechRecognition && (
              <Tooltip title={isListening ? "Stop recording" : "Start recording"}>
                <IconButton 
                  onClick={toggleListening}
                  color={isListening ? "error" : "primary"}
                >
                  {isListening ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {feedback && (
            <Alert 
              severity={isCorrect ? "success" : "info"} 
              sx={{ mb: 2 }} 
              onClose={() => setFeedback(null)}
            >
              {feedback}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {showAnswer ? (
              <Button
                variant="outlined"
                onClick={handleTryAgain}
                color="primary"
              >
                Try Again
              </Button>
            ) : (
              <Button
                variant="contained"
                type="submit"
                color="primary"
                disabled={!userInput.trim()}
              >
                Check
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
