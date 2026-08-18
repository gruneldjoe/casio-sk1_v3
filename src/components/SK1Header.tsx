import React from 'react';
import {
  Play,
  Square,
  Volume2,
  Waves,
  Activity,
  Sliders,
  Mic,
  Music,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useSequencerStore } from '../store/useSequencerStore';
import { Oscilloscope } from './Oscilloscope';

export const SK1Header: React.FC = () => {
  const {
    isPlaying,
    togglePlay,
    stop,
    bpm,
    setBpm,
    swing,
    setSwing,
    masterVolume,
    setMasterVolume,
    tuningCents,
    setTuningCents,
    vibrato,
    toggleVibrato,
    portamento,
    togglePortamento,
    bitcrusherActive,
    toggleBitcrusher,
    activeTab,
    setActiveTab,
  } = useSequencerStore();

  return (
    <header id="sk1-main-header" className="bg-neutral-900 border-b border-neutral-800 text-neutral-200 shadow-xl">
      {/* Top Retro Strip */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        {/* SK-1 Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-950 px-3.5 py-1.5 rounded border border-neutral-700 flex items-baseline gap-2">
            <span className="font-extrabold tracking-widest text-lg text-neutral-100 uppercase font-sans">
              CASIO
            </span>
            <span className="font-mono font-black text-xl text-orange-500 tracking-tighter">
              SK-1
            </span>
            <span className="text-[10px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded ml-1">
              8-BIT SAMPLING SYNTHESIZER
            </span>
          </div>
        </div>

        {/* Oscilloscope Centerpiece */}
        <div className="w-full sm:w-64 md:w-80 h-20">
          <Oscilloscope />
        </div>

        {/* Master Output & Retro Tuning */}
        <div className="flex items-center gap-4 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-xs">
          {/* Master Volume */}
          <div className="flex flex-col gap-1 w-24">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="flex items-center gap-1 font-mono uppercase text-[10px]">
                <Volume2 className="w-3 h-3 text-orange-400" /> Vol
              </span>
              <span className="font-mono">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              id="sk1-master-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="accent-orange-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          {/* Master Tuning (-50 to +50 cents) */}
          <div className="flex flex-col gap-1 w-24 border-l border-neutral-800 pl-3">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="font-mono uppercase text-[10px]">Tuning</span>
              <span className="font-mono">{tuningCents > 0 ? `+${tuningCents}` : tuningCents}¢</span>
            </div>
            <input
              id="sk1-master-tuning-slider"
              type="range"
              min={-50}
              max={50}
              step={1}
              value={tuningCents}
              onChange={(e) => setTuningCents(parseInt(e.target.value, 10))}
              className="accent-orange-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Transport & Mode Selector Strip */}
      <div className="bg-neutral-950/80 border-t border-neutral-800/80 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Transport Controls */}
          <div className="flex items-center gap-2">
            <button
              id="sk1-play-btn"
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                isPlaying
                  ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            <button
              id="sk1-stop-btn"
              onClick={stop}
              className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs uppercase tracking-wider transition-colors active:scale-95"
            >
              STOP
            </button>

            {/* Tempo BPM Controls */}
            <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800 ml-2">
              <span className="font-mono text-[10px] uppercase text-neutral-400">BPM</span>
              <button
                id="sk1-bpm-down"
                onClick={() => setBpm(bpm - 1)}
                className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 font-mono text-xs"
              >
                -
              </button>
              <input
                id="sk1-bpm-input"
                type="number"
                value={bpm}
                min={40}
                max={240}
                onChange={(e) => setBpm(parseInt(e.target.value, 10) || 110)}
                className="w-12 bg-neutral-950 text-center font-mono font-bold text-orange-400 text-xs py-0.5 rounded border border-neutral-800 focus:outline-none focus:border-orange-500"
              />
              <button
                id="sk1-bpm-up"
                onClick={() => setBpm(bpm + 1)}
                className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 font-mono text-xs"
              >
                +
              </button>
            </div>

            {/* Swing Control */}
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-800">
              <span className="font-mono text-[10px] uppercase text-neutral-400">Swing</span>
              <span className="font-mono text-xs text-neutral-200">{Math.round(swing * 100)}%</span>
              <input
                id="sk1-swing-slider"
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={swing}
                onChange={(e) => setSwing(parseFloat(e.target.value))}
                className="w-14 accent-orange-500 h-1 bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Authentic Hardware Switches (8-bit, Vibrato, Portamento) */}
          <div className="flex items-center gap-2">
            <button
              id="sk1-bitcrusher-toggle"
              onClick={toggleBitcrusher}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                bitcrusherActive
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
              title="OKI MSM6283 8-bit / 9.387kHz DAC emulation"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>8-BIT DAC: {bitcrusherActive ? 'ON' : 'BYPASS'}</span>
            </button>

            <button
              id="sk1-vibrato-toggle"
              onClick={toggleVibrato}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                vibrato
                  ? 'bg-orange-950/60 border-orange-500 text-orange-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>VIBRATO</span>
            </button>

            <button
              id="sk1-portamento-toggle"
              onClick={togglePortamento}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-mono transition-colors ${
                portamento
                  ? 'bg-orange-950/60 border-orange-500 text-orange-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>PORTAMENTO</span>
            </button>
          </div>

          {/* Tab Navigation Modules */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button
              id="tab-sequencer"
              onClick={() => setActiveTab('sequencer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'sequencer'
                  ? 'bg-orange-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              SEQUENCER
            </button>

            <button
              id="tab-harmonic"
              onClick={() => setActiveTab('harmonic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'harmonic'
                  ? 'bg-orange-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              HARMONIC SYNTH
            </button>

            <button
              id="tab-envelopes"
              onClick={() => setActiveTab('envelopes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'envelopes'
                  ? 'bg-orange-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              13 ENVELOPES
            </button>

            <button
              id="tab-sampler"
              onClick={() => setActiveTab('sampler')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'sampler'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              SAMPLER
            </button>

            <button
              id="tab-drums"
              onClick={() => setActiveTab('drums')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'drums'
                  ? 'bg-orange-500 text-neutral-950 font-bold shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              RHYTHMS
            </button>

            <button
              id="tab-bending"
              onClick={() => setActiveTab('bending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'bending'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow ring-2 ring-amber-400/50'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-neutral-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              CIRCUIT BENDS
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
