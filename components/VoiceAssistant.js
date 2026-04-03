// components/VoiceAssistant.js - CREATE NEW FILE
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VoiceAssistant({ onLocationSelect, language = 'hi' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processVoiceCommand(text);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Could not recognize. Please try again.');
      };
      
      setRecognition(recognitionInstance);
    }
  }, [language]);

  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    // Hindi commands
    if (lowerCommand.includes('उज्जैन') || lowerCommand.includes('ujjain')) {
      onLocationSelect('Ujjain Mahakaleshwar Temple');
      toast.success('📍 Ujjain selected');
    }
    else if (lowerCommand.includes('ओंकारेश्वर') || lowerCommand.includes('omkareshwar')) {
      onLocationSelect('Omkareshwar Temple');
      toast.success('📍 Omkareshwar selected');
    }
    else if (lowerCommand.includes('खजुराहो') || lowerCommand.includes('khajuraho')) {
      onLocationSelect('Khajuraho Temple');
      toast.success('📍 Khajuraho selected');
    }
    else if (lowerCommand.includes('अयोध्या') || lowerCommand.includes('ayodhya')) {
      onLocationSelect('Ayodhya Ram Mandir');
      toast.success('📍 Ayodhya selected');
    }
    else if (lowerCommand.includes('काशी') || lowerCommand.includes('varanasi')) {
      onLocationSelect('Kashi Vishwanath Temple');
      toast.success('📍 Varanasi selected');
    }
    else {
      toast.info(`You said: "${command}"`);
      onLocationSelect(command);
    }
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      toast('🎤 Listening... Speak now', { icon: '🎤' });
    } else {
      toast.error('Voice recognition not supported in your browser');
    }
  };

  const speakText = (text, lang = 'hi-IN') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        animate={isListening ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 1 } } : {}}
        onClick={startListening}
        className={`p-4 rounded-full shadow-lg transition-all ${
          isListening 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-xl'
        }`}
      >
        <span className="text-2xl">{isListening ? '🎤' : '🎙️'}</span>
      </motion.button>
      
      {transcript && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
          "{transcript}"
        </div>
      )}
      
      <div className="mt-2 text-center">
        <button
          onClick={() => speakText('नमस्ते! कहाँ जाना है? बोलिए...', 'hi-IN')}
          className="text-xs text-white/60 hover:text-white/80"
        >
          🔊 Hindi Guide
        </button>
      </div>
    </div>
  );
}