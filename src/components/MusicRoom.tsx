import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Play, Pause, Download, Volume2, VolumeX, Music, Image as ImageIcon, ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface MusicRoomProps {
  audioUrl: string;
  lyrics: string;
  ambianceUrl: string;
  prompt: string;
  blob: Blob;
  onBack: () => void;
}

export default function MusicRoom({ audioUrl, lyrics, ambianceUrl, prompt, blob, onBack }: MusicRoomProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showLyrics, setShowLyrics] = useState(true);
  const [showVisualControls, setShowVisualControls] = useState(false);

  // Visual Settings
  const [visualSettings, setVisualSettings] = useState({
    intensity: 1,
    mode: 'hybrid' as 'particles' | 'glow' | 'hybrid',
    reactiveTo: 'energy' as 'bass' | 'treble' | 'energy'
  });

  // Audio Analysis State
  const [audioData, setAudioData] = useState({ bass: 0, mid: 0, treble: 0, energy: 0 });
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const initAnalyzer = () => {
    if (!audioRef.current || analyzerRef.current) return;

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyzer = context.createAnalyser();
    const source = context.createMediaElementSource(audioRef.current);

    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzer.connect(context.destination);

    analyzerRef.current = analyzer;
    contextRef.current = context;
  };

  const updateAnalysis = () => {
    if (!analyzerRef.current) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzerRef.current.getByteFrequencyData(dataArray);

    // Calculate frequency ranges
    // Bass: 0-20 (approx 0-400Hz)
    // Mid: 20-60 (approx 400-1200Hz)
    // Treble: 60-100 (approx 1200-2000Hz+)
    
    let bass = 0;
    let mid = 0;
    let treble = 0;

    for (let i = 0; i < 20; i++) bass += dataArray[i];
    for (let i = 20; i < 60; i++) mid += dataArray[i];
    for (let i = 60; i < 100; i++) treble += dataArray[i];

    const energy = (bass + mid + treble) / 100;
    
    setAudioData({
      bass: bass / 20 / 255,
      mid: mid / 40 / 255,
      treble: treble / 40 / 255,
      energy: energy / 255
    });

    animationRef.current = requestAnimationFrame(updateAnalysis);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      } else {
        initAnalyzer();
        if (contextRef.current?.state === 'suspended') {
          contextRef.current.resume();
        }
        audioRef.current.play();
        updateAnalysis();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (contextRef.current) contextRef.current.close();
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
  };

  const downloadAmbiance = () => {
    const a = document.createElement('a');
    a.href = ambianceUrl;
    a.download = 'sonic-architect-ambiance.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Dynamic elements logic
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; speed: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 0.5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Ambiance */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          scale: 1.05 + (audioData.bass * 0.05)
        }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={ambianceUrl} 
          alt="Music Ambiance" 
          className="w-full h-full object-cover opacity-60 scale-105 blur-[2px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </motion.div>

      {/* Dynamic Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {(visualSettings.mode === 'particles' || visualSettings.mode === 'hybrid') && particles.map((p) => {
          const reactivity = audioData[visualSettings.reactiveTo];
          return (
            <motion.div
              key={p.id}
              className="absolute bg-white/30 rounded-full blur-[1px]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: (0.2 + (audioData.treble * 0.6)) * visualSettings.intensity,
                scale: (1 + (audioData.energy * 0.5)) * visualSettings.intensity,
              }}
              animate={isPlaying ? {
                y: [0, -100 - (reactivity * 100 * visualSettings.intensity), 0],
              } : {}}
              transition={{
                duration: (5 / p.speed) / (1 + reactivity * 2 * visualSettings.intensity),
                repeat: Infinity,
                ease: "linear"
              }}
            />
          );
        })}
        
        {/* Pulsing glow aligned to bass */}
        {(visualSettings.mode === 'glow' || visualSettings.mode === 'hybrid') && (
          <motion.div
            className="absolute inset-0 bg-indigo-500/20 pointer-events-none"
            animate={{
              opacity: isPlaying ? (audioData[visualSettings.reactiveTo] * 0.4 * visualSettings.intensity) : 0,
              scale: 1 + (audioData[visualSettings.reactiveTo] * 0.1 * visualSettings.intensity),
            }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-6 flex justify-between items-center backdrop-blur-md bg-black/20 border-b border-white/5">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">New Architecture</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowVisualControls(!showVisualControls)}
              className={cn(
                "p-3 rounded-full transition-all group",
                showVisualControls ? "bg-indigo-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/70"
              )}
              title="Visual Controls"
            >
              <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={downloadAmbiance}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all group"
              title="Download Ambiance"
            >
              <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={downloadMusic}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all shadow-lg shadow-indigo-500/20 group"
              title="Download Music"
            >
              <Download size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {/* Main Experience */}
        <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 p-8 max-w-7xl mx-auto w-full relative">
          {/* Visual Controls Panel */}
          <AnimatePresence>
            {showVisualControls && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute left-8 top-8 z-50 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Visual Engine</h4>
                  <button onClick={() => setShowVisualControls(false)} className="text-white/40 hover:text-white">×</button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs text-white/60 block">Intensity: {visualSettings.intensity.toFixed(1)}x</label>
                  <input 
                    type="range" min="0.1" max="3" step="0.1"
                    value={visualSettings.intensity}
                    onChange={(e) => setVisualSettings(prev => ({ ...prev, intensity: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs text-white/60 block">Engine Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['particles', 'glow', 'hybrid'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setVisualSettings(prev => ({ ...prev, mode }))}
                        className={cn(
                          "text-[10px] py-2 rounded-lg border transition-all capitalize",
                          visualSettings.mode === mode ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs text-white/60 block">Reactivity Link</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bass', 'treble', 'energy'] as const).map(link => (
                      <button
                        key={link}
                        onClick={() => setVisualSettings(prev => ({ ...prev, reactiveTo: link }))}
                        className={cn(
                          "text-[10px] py-2 rounded-lg border transition-all capitalize",
                          visualSettings.reactiveTo === link ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {link}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visualizer / Album Art */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1 + (audioData.energy * 0.05), 
              opacity: 1,
              rotate: audioData.bass * 2
            }}
            className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/10"
          >
            <img 
              src={ambianceUrl} 
              alt="Cover Art" 
              className={cn(
                "w-full h-full object-cover transition-transform duration-[10s] ease-linear",
                isPlaying ? "scale-125 rotate-3" : "scale-100"
              )}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <motion.div
                animate={{
                  scale: 1 + (audioData.energy * 0.4),
                  rotate: audioData.mid * 10
                }}
                className="p-8 bg-white/10 rounded-full border border-white/20"
              >
                <Music size={48} className="text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Info & Lyrics */}
          <div className="flex-1 w-full max-w-xl">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">Sonic Architecture #01</h2>
              <p className="text-white/60 text-sm line-clamp-2 italic">"{prompt}"</p>
            </div>

            <div 
              className="bg-white/5 rounded-3xl border border-white/10 p-8 backdrop-blur-xl h-[400px] flex flex-col transition-shadow duration-100"
              style={{
                boxShadow: isPlaying ? `0 0 ${audioData.energy * 40}px rgba(99, 102, 241, ${audioData.energy * 0.3})` : 'none'
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-400" />
                  AI Generated Lyrics
                </h3>
                <button 
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
                      {lyrics || "Instrumental track. No lyrics generated."}
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

        {/* Player Controls */}
        <footer className="p-8 backdrop-blur-2xl bg-black/40 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-mono text-white/40 w-10">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-indigo-500"
                  style={{ 
                    width: `${(currentTime / duration) * 100}%`,
                    boxShadow: isPlaying ? `0 0 ${audioData.energy * 20}px #6366f1` : 'none'
                  }}
                />
                <input 
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = time;
                    setCurrentTime(time);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-xs font-mono text-white/40 w-10">{formatTime(duration)}</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button 
                  onClick={toggleMute}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
              </div>

              <motion.button 
                onClick={togglePlay}
                animate={{
                  scale: isPlaying ? 1 + (audioData.bass * 0.1) : 1,
                  boxShadow: isPlaying ? `0 0 ${audioData.energy * 60}px rgba(255, 255, 255, ${audioData.energy * 0.5})` : 'none'
                }}
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </motion.button>

              <div className="flex items-center gap-6">
                <button className="text-white/60 hover:text-white transition-colors">
                  <Share2 size={24} />
                </button>
              </div>
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
