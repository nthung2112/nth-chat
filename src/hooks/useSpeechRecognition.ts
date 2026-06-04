import { useEffect, useRef, useState } from "react";

import {
  createSpeechRecognition,
  type SpeechRecognitionAdapterOptions,
  type SpeechRecognitionController,
} from "@/lib/browser";

const useSpeechToText = (options: SpeechRecognitionAdapterOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const controllerRef = useRef<SpeechRecognitionController | null>(null);

  useEffect(() => {
    const controller = createSpeechRecognition(options, {
      onTranscript: text => setTranscript(text.charAt(0).toUpperCase() + text.slice(1)),
      onEnd: () => {
        setIsListening(false);
        setTranscript("");
      },
      onError: error => console.error(error),
    });

    if (!controller) {
      console.error("Web Speech API is not supported");
      return;
    }

    controllerRef.current = controller;

    return () => {
      controllerRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    if (controllerRef.current && !isListening) {
      controllerRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (controllerRef.current && isListening) {
      controllerRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
};

export default useSpeechToText;
