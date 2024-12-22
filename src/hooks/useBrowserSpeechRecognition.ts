import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult?: (result: { text: string; isFinal: boolean; isNewSentence: boolean }) => void;
  onError?: (error: string) => void;
  language?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = {
  new (): SpeechRecognitionInstance;
};

declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

// Get the appropriate speech recognition constructor for the browser
const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;

  // Standard SpeechRecognition for Firefox
  if ('SpeechRecognition' in (window as any)) {
    console.log('Using standard SpeechRecognition');
    return (window as any).SpeechRecognition;
  }
  
  // Webkit prefixed for Chrome, Safari, Edge
  if ('webkitSpeechRecognition' in (window as any)) {
    console.log('Using webkitSpeechRecognition');
    return (window as any).webkitSpeechRecognition;
  }

  console.log('No speech recognition support found');
  return null;
};

export function useBrowserSpeechRecognition({
  onResult,
  onError,
  language = 'en-US',
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  // Initialize recognition instance
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    const supported = !!SpeechRecognition;
    setHasSupport(supported);

    if (!supported) {
      const message = 'Speech recognition is not supported in your browser. Please try using Chrome.';
      console.warn(message);
      onError?.(message);
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

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log('Recognition result:', transcript, 'isFinal:', event.results[i].isFinal);
          
          if (event.results[i].isFinal) {
            finalTranscript = transcript;
          }
        }

        // Only send final results to prevent duplicates
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          onResult?.({
            text: finalTranscript,
            isFinal: true,
            isNewSentence: true
          });
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech was detected. Please try speaking again.';
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
          case 'language-not-supported':
            errorMessage = `The language ${language} is not supported. Please try a different language.`;
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
            recognitionRef.current = null;
          } catch (error) {
            console.error('Error stopping recognition:', error);
          }
        }
      };
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      onError?.('Error initializing speech recognition. Please try using Chrome.');
      setHasSupport(false);
    }
  }, [language, onError]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      onError?.('Speech recognition not initialized. Please try using Chrome.');
      return;
    }
    
    try {
      // Request microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      transcriptRef.current = '';
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      const errorMessage = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        : 'Error starting speech recognition. Please check your microphone settings.';
      onError?.(errorMessage);
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

  return {
    isListening,
    startListening,
    stopListening,
    hasSupport,
  };
}
