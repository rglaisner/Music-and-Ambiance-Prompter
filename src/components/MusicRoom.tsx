import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Download, Volume2, VolumeX, Music, ArrowLeft } from 'lucide-react';

interface MusicRoomProps {
  audioUrl: string;
  lyrics: string;
  prompt: string;
  blob: Blob;
  onBack: () => void;
}

export default function MusicRoom({
  audioUrl,
  lyrics,
  prompt,
  blob,
  onBack,
}: MusicRoomProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showLyrics, setShowLyrics] = useState(true);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        void audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadMusic = () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sonic-architect-track.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-20 flex flex-col min-h-screen">
        <header className="p-6 flex justify-between items-center backdrop-blur-md bg-black/20 border-b border-white/5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">New Architecture</span>
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={downloadMusic}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all shadow-lg shadow-indigo-500/20 group"
              title="Download Music"
            >
              <Download size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 p-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/10 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-black"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-8 bg-white/10 rounded-full border border-white/20">
                <Music size={48} className="text-white" />
              </div>
            </div>
          </motion.div>

          <div className="flex-1 w-full max-w-xl">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">Sonic Architecture</h2>
              <p className="text-white/60 text-sm line-clamp-3 italic">&quot;{prompt}&quot;</p>
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/10 p-8 backdrop-blur-xl h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Music size={18} className="text-indigo-400" />
                  Lyrics
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLyrics(!showLyrics)}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  {showLyrics ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {showLyrics ? (
                    <motion.div
                      key="lyrics"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-pre-wrap text-lg leading-relaxed text-white/80 font-serif italic"
                    >
                      {lyrics || 'Instrumental track. No lyrics generated.'}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-white/50 font-mono"
                    >
                      {prompt}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-8 backdrop-blur-2xl bg-black/40 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-mono text-white/40 w-10">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-indigo-500"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = time;
                    setCurrentTime(time);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
              </div>
              <span className="text-xs font-mono text-white/40 w-10">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white/60 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <motion.button
                type="button"
                onClick={togglePlay}
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                {isPlaying ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" className="ml-1" />
                )}
              </motion.button>

              <div className="w-10" aria-hidden />
            </div>
          </div>
        </footer>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
