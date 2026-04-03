// components/VoiceSearch.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VoiceSearch({ onResult, placeholder = "Search destinations..." }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'hi-IN';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchText(transcript);
        onResult?.(transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        toast.error('Could not recognize. Please try again.');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [onResult]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      toast('🎤 Listening... Speak now', { icon: '🎤' });
    } else {
      toast.error('Voice search not supported in your browser');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-12 border rounded-xl focus:ring-2 focus:ring-orange-500"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={isListening ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 1 } } : {}}
          onClick={isListening ? stopListening : startListening}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-lg">{isListening ? '🎤' : '🎙️'}</span>
        </motion.button>
      </div>
      
      {isListening && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
          🎤 Listening... Speak now
        </div>
      )}
    </div>
  );
}