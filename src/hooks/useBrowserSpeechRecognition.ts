import { useState, useEffect, useCallback, useRef } from 'react';

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
         (window as any).mozSpeechRecognition ||
         (window as any).msSpeechRecognition;
};

export function useBrowserSpeechRecognition({
  onResult,
  onError,
  language = 'en-US',
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Initialize recognition instance
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
        transcriptRef.current = currentTranscript;
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

      recognitionRef.current = recognitionInstance;

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
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
  }, [language]); // Only reinitialize if language changes

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      onError?.('Speech recognition not initialized. Please try reloading the page.');
      return;
    }
    
    try {
      // Request microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognitionRef.current.start();
      transcriptRef.current = '';
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Microphone access was denied. Please allow microphone access and try again.');
      setIsListening(false);
    }
  }, [onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript: transcriptRef.current,
    startListening,
    stopListening,
    resetTranscript,
    hasSupport,
  };
}
