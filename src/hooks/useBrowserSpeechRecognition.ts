import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult?: (transcript: { text: string, isFinal: boolean, isNewSentence: boolean }) => void;
  onError?: (error: string) => void;
  language?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    mozSpeechRecognition: any;
    msSpeechRecognition: any;
  }
}

// Get the appropriate speech recognition constructor for the browser
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;

  // Standard SpeechRecognition for Firefox
  if ('SpeechRecognition' in window) {
    console.log('Using standard SpeechRecognition');
    return window.SpeechRecognition;
  }
  
  // Webkit prefixed for Chrome, Safari, Edge
  if ('webkitSpeechRecognition' in window) {
    console.log('Using webkitSpeechRecognition');
    return window.webkitSpeechRecognition;
  }

  console.log('No speech recognition support found');
  return null;
};

const getBrowserName = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('edg/')) {
    return 'Edge';
  } else if (userAgent.includes('chrome')) {
    return 'Chrome';
  } else if (userAgent.includes('safari')) {
    return 'Safari';
  } else {
    return 'your browser';
  }
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
  const shouldRestartRef = useRef(false);
  const lastResultRef = useRef<{text: string, timestamp: number}>({ text: '', timestamp: 0 });

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
        shouldRestartRef.current = true;
      };

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log('Recognition result:', transcript, 'isFinal:', event.results[i].isFinal);
          
          if (event.results[i].isFinal) {
            finalTranscript = transcript;
          } else {
            interimTranscript = transcript;
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
            shouldRestartRef.current = false;
            break;
          case 'no-speech':
            errorMessage = 'No speech was detected. Please try speaking again.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            shouldRestartRef.current = false;
            break;
          case 'audio-capture':
            errorMessage = 'No microphone was found. Please check your microphone connection.';
            shouldRestartRef.current = false;
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          case 'language-not-supported':
            errorMessage = `The language ${language} is not supported. Please try a different language.`;
            shouldRestartRef.current = false;
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        onError?.(errorMessage);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        
        // Only restart if we haven't explicitly stopped and should restart
        if (shouldRestartRef.current && recognitionRef.current) {
          console.log('Restarting speech recognition...');
          setTimeout(() => {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
              setIsListening(false);
              onError?.('Speech recognition stopped unexpectedly. Please try again.');
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognitionInstance;

      return () => {
        shouldRestartRef.current = false;
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
      onError?.('Error initializing speech recognition. Please try using Chrome or Edge.');
      setHasSupport(false);
    }
  }, [language, onError]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      onError?.('Speech recognition not initialized. Please try using Chrome or Edge.');
      return;
    }
    
    try {
      // Request microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      shouldRestartRef.current = true;
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
    shouldRestartRef.current = false;
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
    transcript: transcriptRef.current,
  };
}
