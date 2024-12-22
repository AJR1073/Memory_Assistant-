import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

// Get the appropriate speech recognition constructor for the browser
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  
  return window.SpeechRecognition ||
         window.webkitSpeechRecognition ||
         window.mozSpeechRecognition ||
         window.msSpeechRecognition;
};

export function useBrowserSpeechRecognition({
  onResult,
  onError,
  language = 'en-US',
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [hasSupport, setHasSupport] = useState(false);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    const supported = !!SpeechRecognition;
    setHasSupport(supported);

    if (!supported) {
      console.warn('Speech recognition is not supported in this browser.');
      onError?.('Speech recognition is not supported in this browser. Please try Chrome or Firefox.');
      return;
    }

    try {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        onResult?.(currentTranscript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access was denied. Please allow microphone access and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech was detected. Please try again.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone was found. Please check your microphone connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        onError?.(errorMessage);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      setRecognition(recognitionInstance);

      return () => {
        if (recognitionInstance) {
          try {
            recognitionInstance.stop();
          } catch (error) {
            console.error('Error stopping recognition:', error);
          }
        }
      };
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      onError?.('Error initializing speech recognition. Please try reloading the page.');
      setHasSupport(false);
    }
  }, [language, onError, onResult]);

  const startListening = useCallback(async () => {
    if (!recognition) {
      onError?.('Speech recognition not initialized. Please try reloading the page.');
      return;
    }
    
    try {
      // Request microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognition.start();
      setIsListening(true);
      setTranscript('');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Microphone access was denied. Please allow microphone access and try again.');
      setIsListening(false);
    }
  }, [recognition, onError]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasSupport,
  };
}
