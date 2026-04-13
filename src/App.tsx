import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Sparkles, Key, ExternalLink } from 'lucide-react';
import Wizard from './components/Wizard';
import MusicRoom from './components/MusicRoom';

interface GeneratedData {
  audioUrl: string;
  lyrics: string;
  prompt: string;
  blob: Blob;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [view, setView] = useState<'landing' | 'wizard' | 'room'>('landing');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  useEffect(() => {
    void checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true);
    }
  };

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerationComplete = (data: GeneratedData) => {
    setGeneratedData(data);
    setView('room');
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-3xl text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="text-indigo-400" size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4">API Key Required</h1>
          <p className="text-gray-400 mb-8">
            To generate full-length music tracks using Lyria Pro, you must select a paid Gemini API
            key.
          </p>
          <button
            type="button"
            onClick={() => void handleOpenKey()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all mb-4 flex items-center justify-center gap-2"
          >
            Select API Key
            <ExternalLink size={18} />
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:underline"
          >
            Learn about Gemini API billing
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />

            <div className="max-w-3xl text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-sm font-medium"
              >
                <Sparkles size={16} />
                <span>Powered by you one and only,Remy</span>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
              >
                Sonic Architect
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-400 mb-12 leading-relaxed"
              >
                Architect full-length music tracks through a layered cascading choice system.
                Listen back in a focused player with lyrics.
              </motion.p>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                type="button"
                onClick={() => setView('wizard')}
                className="group relative px-12 py-6 bg-white text-black rounded-full font-bold text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Begin Construction
                  <Music size={24} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {view === 'wizard' && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="min-h-screen pt-12"
          >
            <Wizard onComplete={handleGenerationComplete} />
          </motion.div>
        )}

        {view === 'room' && generatedData && (
          <motion.div
            key="room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <MusicRoom {...generatedData} onBack={() => setView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
