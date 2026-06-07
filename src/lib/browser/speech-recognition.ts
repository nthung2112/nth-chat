export interface SpeechRecognitionAdapterOptions {
  interimResults?: boolean;
  lang?: string;
  continuous?: boolean;
}

export interface SpeechRecognitionHandlers {
  onTranscript: (text: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
}

const PUNCTUATION_GRAMMAR = "#JSGF V1.0; grammar punctuation; public <punc> = . | , | ! | ; | : ;";

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && "webkitSpeechRecognition" in window;
}

export function createSpeechRecognition(
  options: SpeechRecognitionAdapterOptions,
  handlers: SpeechRecognitionHandlers
): SpeechRecognitionController | null {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const recognition = new window.webkitSpeechRecognition();
  recognition.interimResults = options.interimResults ?? true;
  recognition.lang = options.lang ?? "en-US";
  recognition.continuous = options.continuous ?? false;

  if ("webkitSpeechGrammarList" in window) {
    const grammarList = new window.webkitSpeechGrammarList();
    grammarList.addFromString(PUNCTUATION_GRAMMAR, 1);
    recognition.grammars = grammarList;
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let text = "";
    for (const result of event.results) {
      text += result[0].transcript;
    }
    handlers.onTranscript(text);
  };

  recognition.onerror = event => {
    handlers.onError(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd();
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}
