import React from 'react';
import {
  FOOTAGE_LABELS,
  HARMONIC_PRESET_TEMPLATES,
} from '../audio/harmonicSynth';
import { useSequencerStore } from '../store/useSequencerStore';
import { HarmonicFootage } from '../types';
import { audioEngine } from '../audio/AudioEngine';
import { Sparkles, Sliders, Volume2 } from 'lucide-react';

const AUDITION_NOTES = [
  { label: 'C4', midi: 60 },
  { label: 'D4', midi: 62 },
  { label: 'E4', midi: 64 },
  { label: 'F4', midi: 65 },
  { label: 'G4', midi: 67 },
  { label: 'A4', midi: 69 },
  { label: 'B4', midi: 71 },
  { label: 'C5', midi: 72 },
  { label: 'D5', midi: 74 },
  { label: 'E5', midi: 76 },
];

export const HarmonicSynthesizerPanel: React.FC = () => {
  const {
    harmonicLevels,
    setHarmonicLevel,
    setHarmonicLevels,
    selectedEnvelopeId,
    setSelectedEnvelopeId,
    setSelectedTone,
  } = useSequencerStore();

  const handleApplyPreset = (preset: (typeof HARMONIC_PRESET_TEMPLATES)[0]) => {
    setHarmonicLevels(preset.levels);
    setSelectedEnvelopeId(preset.suggestedEnvelope as any);
    setSelectedTone('harmonic_synth');
    // Audition sound
    audioEngine.triggerNote('audition', 'harmonic_synth', preset.suggestedEnvelope as any, 69, 0.9, 0.5);
  };

  const handlePlayKey = (midi: number) => {
    audioEngine.triggerNote('audition', 'harmonic_synth', selectedEnvelopeId, midi, 0.9, 0.5);
  };

  return (
    <div id="sk1-harmonic-synthesizer-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-mono font-bold text-neutral-100 uppercase tracking-wide">
            HARMONIC SYNTHESIZER (FOOTAGES 16' — 1')
          </h2>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          9 Additive Harmonics • 15 Discrete Levels (0–14) • 8-Bit Quantized Wavetable
        </span>
      </div>

      {/* Manual Preset Combinations from Page 12 of Manual */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          Classic Casio SK-1 Synthesizer Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {HARMONIC_PRESET_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => handleApplyPreset(tmpl)}
              className="px-3 py-1.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-mono font-medium text-neutral-300 hover:text-orange-400 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>{tmpl.name}</span>
              <span className="text-[10px] text-orange-400/80 bg-neutral-900 px-1 rounded">
                ENV {tmpl.suggestedEnvelope}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 9 Drawbars / Footages */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
        {FOOTAGE_LABELS.map((foot) => {
          const currentLevel = harmonicLevels[foot.id];
          return (
            <div
              key={foot.id}
              className="flex flex-col items-center gap-2 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800/80"
            >
              <div className="text-center">
                <span className="text-sm font-mono font-black text-orange-400 block leading-tight">
                  {foot.label}
                </span>
                <span className="text-[9px] font-mono text-neutral-400 truncate block">
                  {foot.name}
                </span>
              </div>

              {/* Slider (0 to 14) */}
              <div className="h-44 flex items-center justify-center py-2">
                <input
                  type="range"
                  min={0}
                  max={14}
                  step={1}
                  value={currentLevel}
                  onChange={(e) =>
                    setHarmonicLevel(foot.id, parseInt(e.target.value, 10))
                  }
                  className="accent-orange-500 h-36 -rotate-90 w-36 bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              {/* Numeric Level Display */}
              <div className="w-8 h-8 rounded flex items-center justify-center bg-neutral-950 border border-neutral-700 font-mono font-bold text-sm text-neutral-100">
                {currentLevel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Audition Keys */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-orange-400" /> Audition Harmonics Keybed
          </span>
          <span>Click or touch keys to test synthesized tone</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
          {AUDITION_NOTES.map((k) => (
            <button
              key={k.label}
              onClick={() => handlePlayKey(k.midi)}
              className="h-14 rounded bg-neutral-200 hover:bg-white text-neutral-900 font-mono font-bold text-xs flex flex-col justify-end p-2 transition-all active:scale-95 shadow active:bg-orange-400"
            >
              <span>{k.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
