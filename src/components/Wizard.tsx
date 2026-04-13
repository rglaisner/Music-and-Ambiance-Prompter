import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Sparkles, Music, RefreshCw, Layers } from 'lucide-react';
import { MUSIC_LAYERS, ExpertiseLevel } from '../constants/choices';
import { buildMasterPrompt, type LayerSelectionValue } from '../lib/masterPrompt';
import { cn } from '../lib/utils';
import { generateMusic } from '../lib/gemini';

const EXPERTISE_HIERARCHY: Record<ExpertiseLevel, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

interface WizardProps {
  onComplete: (data: {
    audioUrl: string;
    lyrics: string;
    prompt: string;
    blob: Blob;
  }) => void;
}

async function ensureAiStudioApiKey(): Promise<void> {
  if (typeof window === 'undefined') return;
  const studio = window.aistudio;
  if (!studio) return;
  const selected = await studio.hasSelectedApiKey();
  if (!selected) {
    await studio.openSelectKey();
  }
}

export default function Wizard({ onComplete }: WizardProps) {
  const [expertise, setExpertise] = useState<ExpertiseLevel | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, LayerSelectionValue>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'prompt' | 'music'>('prompt');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredLayers = React.useMemo(() => {
    if (!expertise) return [];
    const level = EXPERTISE_HIERARCHY[expertise];
    return MUSIC_LAYERS.filter(
      (layer) => EXPERTISE_HIERARCHY[layer.minExpertise] <= level,
    );
  }, [expertise]);

  const currentLayer = filteredLayers[currentStep];

  if (expertise && !currentLayer && currentStep < filteredLayers.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <RefreshCw size={48} className="text-indigo-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold mb-2">Synchronizing Layers...</h2>
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="mt-4 px-6 py-2 bg-indigo-600 rounded-xl font-semibold"
        >
          Restart Wizard
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (currentLayer) {
      const currentSelection = selections[currentLayer.id];
      setTextInput(typeof currentSelection === 'string' ? currentSelection : '');
    }
  }, [currentStep, currentLayer, selections]);

  const handleExpertiseSelect = (level: ExpertiseLevel) => {
    setExpertise(level);
    setCurrentStep(0);
    setSelections({});
    setError(null);
  };

  const handleSelect = (optionId: string) => {
    if (!currentLayer) return;
    if (currentLayer.hasRoles) {
      const current =
        (selections[currentLayer.id] as Record<string, string> | undefined) || {};
      const updated = { ...current };
      if (updated[optionId]) {
        delete updated[optionId];
      } else {
        updated[optionId] = 'lead';
      }
      setSelections((prev) => ({ ...prev, [currentLayer.id]: updated }));
    } else if (currentLayer.multiSelect) {
      const current = (selections[currentLayer.id] as string[] | undefined) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setSelections((prev) => ({ ...prev, [currentLayer.id]: updated }));
    } else {
      const nextSelections: Record<string, LayerSelectionValue> = {
        ...selections,
        [currentLayer.id]: optionId,
      };
      setSelections(nextSelections);
      if (currentStep < filteredLayers.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        generateInitialPrompt(nextSelections);
      }
    }
  };

  const handleRoleSelect = (optionId: string, role: string) => {
    if (!currentLayer) return;
    const current =
      (selections[currentLayer.id] as Record<string, string> | undefined) || {};
    setSelections((prev) => ({
      ...prev,
      [currentLayer.id]: { ...current, [optionId]: role },
    }));
  };

  const handleNext = () => {
    if (currentStep < filteredLayers.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      generateInitialPrompt(selections);
    }
  };

  const handleTextSubmit = (text: string) => {
    if (!text.trim() || !currentLayer) return;
    const nextSelections: Record<string, LayerSelectionValue> = {
      ...selections,
      [currentLayer.id]: text,
    };
    setSelections(nextSelections);
    if (currentStep < filteredLayers.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      generateInitialPrompt(nextSelections);
    }
  };

  const handlePickForMe = () => {
    if (!currentLayer) return;
    if (currentLayer.type === 'text' && currentLayer.presets) {
      const randomPreset =
        currentLayer.presets[Math.floor(Math.random() * currentLayer.presets.length)];
      handleTextSubmit(randomPreset);
    } else {
      if (currentLayer.hasRoles) {
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...currentLayer.options].sort(() => 0.5 - Math.random());
        const roles = ['lead', 'rhythm', 'bass', 'harmony'];
        const picked: Record<string, string> = {};
        shuffled.slice(0, count).forEach((o) => {
          picked[o.id] = roles[Math.floor(Math.random() * roles.length)];
        });
        const nextRoles: Record<string, LayerSelectionValue> = {
          ...selections,
          [currentLayer.id]: picked,
        };
        setSelections(nextRoles);
        if (currentStep < filteredLayers.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          generateInitialPrompt(nextRoles);
        }
      } else if (currentLayer.multiSelect) {
        const count = Math.floor(Math.random() * 2) + 1;
        const shuffled = [...currentLayer.options].sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, count).map((o) => o.id);
        const nextMulti: Record<string, LayerSelectionValue> = {
          ...selections,
          [currentLayer.id]: picked,
        };
        setSelections(nextMulti);
        if (currentStep < filteredLayers.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          generateInitialPrompt(nextMulti);
        }
      } else {
        const randomOption =
          currentLayer.options[Math.floor(Math.random() * currentLayer.options.length)];
        handleSelect(randomOption.id);
      }
    }
  };

  const generateInitialPrompt = (selectionSnapshot: Record<string, LayerSelectionValue>) => {
    const descriptivePrompt = buildMasterPrompt(filteredLayers, selectionSnapshot);
    setGeneratedPrompt(descriptivePrompt);
    setGenerationStep('prompt');
    setCurrentStep(filteredLayers.length);
  };

  const startGeneration = async () => {
    await ensureAiStudioApiKey();

    setIsGenerating(true);
    setError(null);
    try {
      setGenerationStep('music');
      const musicResult = await generateMusic(generatedPrompt);

      onComplete({
        audioUrl: musicResult.audioUrl,
        lyrics: musicResult.lyrics,
        prompt: generatedPrompt,
        blob: musicResult.blob,
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during generation.';
      if (message.includes('Requested entity was not found')) {
        setError('API Key error. Please re-select your API key.');
        const studio = typeof window !== 'undefined' ? window.aistudio : undefined;
        if (studio) {
          void studio.openSelectKey();
        }
      } else {
        setError(message);
      }
      setIsGenerating(false);
    }
  };

  if (!expertise) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 bg-indigo-500/10 rounded-3xl mb-6"
          >
            <Layers size={48} className="text-indigo-500" />
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">Choose Your Path</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            How deep do you want to go into the architectural design of your track?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as ExpertiseLevel[]).map(
            (level, i) => {
              const descriptions = {
                Beginner: 'Quick & Easy. Focus on the core vibe and genre.',
                Intermediate: 'Balanced Control. Refine the style and instrumentation.',
                Advanced: 'Detailed Craft. Control composition, style, and mix.',
                Expert: 'Full Architecture. Every sonic detail under your command.',
              };
              const layerCounts = {
                Beginner: MUSIC_LAYERS.filter((l) => EXPERTISE_HIERARCHY[l.minExpertise] <= 1)
                  .length,
                Intermediate: MUSIC_LAYERS.filter(
                  (l) => EXPERTISE_HIERARCHY[l.minExpertise] <= 2,
                ).length,
                Advanced: MUSIC_LAYERS.filter((l) => EXPERTISE_HIERARCHY[l.minExpertise] <= 3)
                  .length,
                Expert: MUSIC_LAYERS.length,
              };

              return (
                <motion.button
                  key={level}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleExpertiseSelect(level)}
                  className="group p-8 text-left rounded-3xl border border-gray-800 bg-gray-900/40 hover:border-indigo-500 hover:bg-indigo-600/5 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold group-hover:text-indigo-400 transition-colors">
                      {level}
                    </h3>
                    <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {layerCounts[level]} Layers
                    </span>
                  </div>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {descriptions[level]}
                  </p>
                </motion.button>
              );
            },
          )}
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-8"
        >
          <RefreshCw size={64} className="text-indigo-500" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-4">
          {generationStep === 'music' ? 'Composing your masterpiece...' : 'Preparing...'}
        </h2>
        <p className="text-gray-400 max-w-md">
          Our AI is weaving together your choices into a full-length track. This might take a
          minute.
        </p>

        <div className="mt-12 w-full max-w-md bg-gray-800 h-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: '0%' }}
            animate={{ width: generationStep === 'music' ? '85%' : '20%' }}
            transition={{ duration: 10 }}
          />
        </div>
      </div>
    );
  }

  if (currentStep === filteredLayers.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-8 bg-gray-900/50 rounded-3xl border border-gray-800 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-indigo-400" />
          <h2 className="text-2xl font-bold">Refine Your Vision</h2>
        </div>
        <p className="text-gray-400 mb-6">
          We&apos;ve architected a prompt based on your choices. You can edit it below to add
          more specific details before we generate the track.
        </p>
        <textarea
          value={generatedPrompt}
          onChange={(e) => setGeneratedPrompt(e.target.value)}
          className="w-full h-64 bg-black/50 border border-gray-700 rounded-2xl p-6 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none mb-8 font-mono text-sm leading-relaxed"
        />

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(filteredLayers.length - 1)}
            className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            Back to Choices
          </button>
          <button
            type="button"
            onClick={startGeneration}
            className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            Generate Music
            <Music size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (!currentLayer) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setExpertise(null)}
                className="text-indigo-400 hover:text-indigo-300 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1"
              >
                <ChevronLeft size={10} />
                {expertise} Mode
              </button>
              <span className="text-gray-600">•</span>
              <span className="text-indigo-400 font-mono text-xs uppercase tracking-widest">
                {currentLayer.group}
              </span>
            </div>
            <span className="text-gray-500 font-mono text-xs mb-2 block">
              Layer {currentStep + 1} of {filteredLayers.length}
            </span>
            <h1 className="text-4xl font-bold tracking-tight">{currentLayer.title}</h1>
          </div>
          <div className="flex gap-1">
            {filteredLayers.map((layer, i) => (
              <div
                key={layer.id}
                className={cn(
                  'h-1.5 w-4 rounded-full transition-all duration-500',
                  i <= currentStep ? 'bg-indigo-500' : 'bg-gray-800',
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-xl text-gray-400">
          {currentLayer.question}
          {currentLayer.multiSelect && (
            <span className="text-sm text-indigo-400 ml-2">(Select multiple)</span>
          )}
        </p>
      </div>

      <div className="mb-12">
        {currentLayer.type === 'text' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your thoughts here..."
              className="w-full h-48 bg-gray-900/40 border border-gray-800 rounded-3xl p-8 text-xl text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleTextSubmit(textInput)}
                disabled={!textInput.trim()}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                Next Layer
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="pt-8">
              <h4 className="text-sm font-mono text-gray-500 mb-4 uppercase tracking-widest">
                Or try a preset
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLayer.presets?.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTextInput(preset);
                      handleTextSubmit(preset);
                    }}
                    className="text-left p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="wait">
                {currentLayer.options.map((option, index) => {
                  const isSelected = currentLayer.hasRoles
                    ? !!(selections[currentLayer.id] as Record<string, string> | undefined)?.[
                        option.id
                      ]
                    : Array.isArray(selections[currentLayer.id])
                      ? (selections[currentLayer.id] as string[]).includes(option.id)
                      : selections[currentLayer.id] === option.id;

                  const currentRole = currentLayer.hasRoles
                    ? (selections[currentLayer.id] as Record<string, string> | undefined)?.[
                        option.id
                      ]
                    : null;

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'group relative p-6 text-left rounded-3xl border transition-all duration-300 overflow-hidden',
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500'
                          : 'bg-gray-900/40 border-gray-800 hover:border-gray-600 hover:bg-gray-800/40',
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <button
                          type="button"
                          onClick={() => handleSelect(option.id)}
                          className="text-left mb-4"
                        >
                          <h3 className="text-lg font-bold mb-1 group-hover:text-indigo-300 transition-colors">
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            {option.description}
                          </p>
                        </button>

                        {isSelected && currentLayer.hasRoles && (
                          <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2">
                            {['lead', 'rhythm', 'bass', 'harmony'].map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => handleRoleSelect(option.id, role)}
                                className={cn(
                                  'text-[10px] px-3 py-1 rounded-full border transition-all capitalize',
                                  currentRole === role
                                    ? 'bg-indigo-600 border-indigo-500'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10',
                                )}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          'absolute top-0 right-0 p-4 transition-all',
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        )}
                      >
                        {isSelected && (currentLayer.multiSelect || currentLayer.hasRoles) ? (
                          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Layers size={14} className="text-white" />
                          </div>
                        ) : (
                          <ChevronRight size={20} className="text-indigo-400" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {(currentLayer.multiSelect || currentLayer.hasRoles) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    !selections[currentLayer.id] ||
                    (Array.isArray(selections[currentLayer.id]) &&
                      (selections[currentLayer.id] as string[]).length === 0) ||
                    (currentLayer.hasRoles &&
                      Object.keys(
                        (selections[currentLayer.id] as Record<string, string> | undefined) ||
                          {},
                      ).length === 0)
                  }
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  Confirm & Next
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => currentStep > 0 && setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 0}
          className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-0 transition-all"
        >
          <ChevronLeft size={20} />
          Previous Layer
        </button>

        <button
          type="button"
          onClick={handlePickForMe}
          className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-medium transition-all flex items-center gap-2 group"
        >
          <Sparkles size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          Pick for me
        </button>
      </div>
    </div>
  );
}
