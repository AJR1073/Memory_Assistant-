import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon } from '@mui/icons-material';
import { useVerses } from '../hooks/useVerses';
import type { Verse, PracticeAttempt } from '../types';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function Practice() {
  const { verses, loading } = useVerses();
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      setUserInput('');
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  const calculateScore = (input: string, target: string): [number, string[]] => {
    const inputWords = input.toLowerCase().trim().split(/\s+/);
    const targetWords = target.toLowerCase().trim().split(/\s+/);
    const mistakes: string[] = [];
    let correctWords = 0;

    inputWords.forEach((word, index) => {
      if (index < targetWords.length) {
        if (word === targetWords[index]) {
          correctWords++;
        } else {
          mistakes.push(`"${word}" should be "${targetWords[index]}"`);
        }
      }
    });

    const score = Math.round((correctWords / targetWords.length) * 100);
    return [score, mistakes];
  };

  const handleSubmit = async () => {
    if (!selectedVerse || !currentUser) return;

    const [calculatedScore, mistakes] = calculateScore(userInput, selectedVerse.text);
    setScore(calculatedScore);
    setFeedback(mistakes);

    // Save attempt to Firestore
    try {
      const attempt: Omit<PracticeAttempt, 'id'> = {
        userId: currentUser.uid,
        verseId: selectedVerse.id,
        inputText: userInput,
        score: calculatedScore,
        mistakes,
        usedSpeechInput: isRecording,
        timestamp: new Date(),
      };

      await addDoc(collection(db, 'attempts'), attempt);
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Practice Verses
      </Typography>

      {!selectedVerse ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select a verse to practice:
          </Typography>
          {verses.map((verse) => (
            <Card
              key={verse.id}
              sx={{ mb: 2, cursor: 'pointer' }}
              onClick={() => setSelectedVerse(verse)}
            >
              <CardContent>
                <Typography variant="h6">{verse.reference}</Typography>
                <Typography color="text.secondary">{verse.translation}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {selectedVerse.reference} ({selectedVerse.translation})
          </Typography>
          
          <Box sx={{ my: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type or speak the verse from memory..."
              disabled={isRecording}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!userInput.trim()}
            >
              Check
            </Button>
            <IconButton
              color={isRecording ? 'secondary' : 'primary'}
              onClick={toggleRecording}
              disabled={!recognition}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </IconButton>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedVerse(null);
                setUserInput('');
                setScore(null);
                setFeedback([]);
              }}
            >
              Choose Different Verse
            </Button>
          </Box>

          {score !== null && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Score: {score}%
              </Typography>
              {feedback.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Corrections needed:
                  </Typography>
                  <ul>
                    {feedback.map((mistake, index) => (
                      <li key={index}>{mistake}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}
