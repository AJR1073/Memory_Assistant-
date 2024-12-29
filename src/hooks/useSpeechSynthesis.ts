import { useState, useCallback } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  speaking: boolean;
  cancel: () => void;
  hasSupport: boolean;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [speaking, setSpeaking] = useState(false);
  const hasSupport = 'speechSynthesis' in window;

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!hasSupport) {
      console.error('Speech synthesis is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      setSpeaking(false);
    }
  }, [cancel, hasSupport]);

  return {
    speak,
    speaking,
    cancel,
    hasSupport,
  };
}
