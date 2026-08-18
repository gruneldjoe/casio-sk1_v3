import React from 'react';
import { SK1Header } from './components/SK1Header';
import { ToneSelectorBar } from './components/ToneSelectorBar';
import { StepSequencer } from './components/StepSequencer';
import { HarmonicSynthesizerPanel } from './components/HarmonicSynthesizerPanel';
import { EnvelopeSelectorPanel } from './components/EnvelopeSelectorPanel';
import { SamplingStudio } from './components/SamplingStudio';
import { DrumMachinePanel } from './components/DrumMachinePanel';
import { CircuitBendingPanel } from './components/CircuitBendingPanel';
import { useSequencerStore } from './store/useSequencerStore';
import { useBendingStore } from './store/useBendingStore';
import { Music2, Play, Sparkles, Disc3, Radio, Zap } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

export default function App() {
  const { activeTab, setActiveTab, isPlaying, togglePlay, setBpm, applyRhythmPreset } = useSequencerStore();
  const { applyBendPreset } = useBendingStore();

  const handleLoadDemo = (type: 'toy_symphony' | 'synthwave' | 'bossa' | 'glitch_aleatron') => {
    if (type === 'toy_symphony') {
      setBpm(132);
      applyRhythmPreset('march');
    } else if (type === 'synthwave') {
      setBpm(118);
      applyRhythmPreset('rock');
    } else if (type === 'bossa') {
      setBpm(108);
      applyRhythmPreset('bossa_nova');
    } else if (type === 'glitch_aleatron') {
      setBpm(124);
      applyRhythmPreset('disco');
      applyBendPreset('aleatron_frenzy');
      setActiveTab('bending');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-neutral-950">
      {/* Top SK-1 Hardware Header */}
      <SK1Header />

      {/* Preset Tone Selector Strip */}
      <ToneSelectorBar />

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Quick Demo Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 p-2.5 px-4 rounded-xl border border-neutral-800/80 text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-400">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-neutral-200">QUICK DEMO PRESETS:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadDemo('toy_symphony')}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              <Disc3 className="w-3 h-3 text-orange-400" />
              Toy Symphony (Casio ROM)
            </button>

            <button
              onClick={() => handleLoadDemo('synthwave')}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              <Radio className="w-3 h-3 text-amber-400" />
              80s Lo-Fi Synth
            </button>

            <button
              onClick={() => handleLoadDemo('bossa')}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              <Music2 className="w-3 h-3 text-emerald-400" />
              Bossa Nova Groove
            </button>

            <button
              onClick={() => handleLoadDemo('glitch_aleatron')}
              className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/60 hover:bg-amber-900 text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 font-bold"
            >
              <Zap className="w-3 h-3 fill-current text-amber-400" />
              Aleatron Circuit Bend (Glitch)
            </button>
          </div>
        </div>

        {/* View Switcher based on Active Tab */}
        {activeTab === 'sequencer' && <StepSequencer />}
        {activeTab === 'harmonic' && <HarmonicSynthesizerPanel />}
        {activeTab === 'envelopes' && <EnvelopeSelectorPanel />}
        {activeTab === 'sampler' && <SamplingStudio />}
        {activeTab === 'drums' && <DrumMachinePanel />}
        {activeTab === 'bending' && <CircuitBendingPanel />}
      </main>

      {/* Retro Bottom Status Bar */}
      <footer className="bg-neutral-900 border-t border-neutral-800 px-4 py-3 sm:px-6 text-[11px] font-mono text-neutral-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>CASIO COMPUTER CO., LTD. • SK-1 EMULATION ENGINE</span>
          <span>|</span>
          <span>OKI MSM6283-01GS DSP</span>
          <span>|</span>
          <span>CLOCK: 7.24MHz / 9.387kHz</span>
        </div>
        <div className="flex items-center gap-3">
          <span>4-VOICE POLYPHONY</span>
          <span>•</span>
          <span>8-BIT LINEAR PCM</span>
          <span>•</span>
          <span>WEB AUDIO + WORKLET</span>
        </div>
      </footer>
    </div>
  );
}
