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
} from '@mui/material';
import {
  Stop as StopIcon,
  Mic as MicIcon,
  VolumeUp as SpeakIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [typedText, setTypedText] = useState('');
  const [showTypedAccuracy, setShowTypedAccuracy] = useState<number | null>(null);

  const { speak, speaking, cancel } = useSpeechSynthesis();
  const { startListening, stopListening } = useSpeechRecognition({
    onResult: (text: string) => {
      const cleanText = text.trim();
      setSpokenText(cleanText);
      setTypedText(cleanText);
      if (verse) {
        const score = calculateAccuracy(cleanText, verse.text);
        setAccuracy(score);
        setShowTypedAccuracy(score);
      }
    },
  });

  useEffect(() => {
    const fetchVerse = async () => {
      if (!verseId) return;

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

  const calculateAccuracy = (spoken: string, actual: string): number => {
    // Normalize both texts: lowercase, remove punctuation, and split into words
    const normalize = (text: string) => 
      text.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 0);

    const spokenWords = normalize(spoken);
    const actualWords = normalize(actual);
    
    let matches = 0;
    actualWords.forEach((word, i) => {
      if (i < spokenWords.length && spokenWords[i] === word) {
        matches++;
      }
    });
    
    return (matches / actualWords.length) * 100;
  };

  const handleCheckTyped = () => {
    if (verse) {
      const score = calculateAccuracy(typedText, verse.text);
      setShowTypedAccuracy(score);
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
          <Typography variant="h6" gutterBottom>
            {verse.reference} ({verse.translation})
          </Typography>
          <Typography variant="body1" paragraph>
            {verse.text}
          </Typography>
          
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

          {/* Text input section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Type the verse:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={typedText}
              onChange={(e) => {
                setTypedText(e.target.value);
                setShowTypedAccuracy(null);
              }}
              placeholder={isListening ? "Speaking..." : "Type the verse here or use the microphone..."}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleCheckTyped}
                disabled={!typedText}
              >
                Check Text
              </Button>
              {showTypedAccuracy !== null && (
                <Typography variant="h6" color={showTypedAccuracy > 90 ? 'success.main' : 'warning.main'}>
                  Accuracy: {showTypedAccuracy.toFixed(1)}%
                </Typography>
              )}
            </Box>
          </Box>

          {accuracy !== null && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" color={accuracy > 90 ? 'success.main' : 'warning.main'}>
                Speech Accuracy: {accuracy.toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
