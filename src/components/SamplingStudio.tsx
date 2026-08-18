import React from 'react';
import {
  Mic,
  Square,
  Repeat,
  Sparkles,
  Volume2,
  RefreshCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { useSequencerStore } from '../store/useSequencerStore';
import { SK1_ENVELOPE_PRESETS } from '../audio/envelopes';
import { EnvelopeShapeId } from '../types';

const AUDITION_NOTES = [
  { label: 'F3', midi: 53 },
  { label: 'G3', midi: 55 },
  { label: 'A3', midi: 57 },
  { label: 'C4', midi: 60 },
  { label: 'D4', midi: 62 },
  { label: 'F4', midi: 65 },
  { label: 'A4 (Root)', midi: 69 },
  { label: 'C5', midi: 72 },
  { label: 'E5', midi: 76 },
  { label: 'A5', midi: 81 },
];

export const SamplingStudio: React.FC = () => {
  const {
    sampleData,
    isSampling,
    samplingLevel,
    samplingProgress,
    startSampling,
    stopSampling,
    setSampleLooping,
    setSampleEnvelope,
    playSampleAudition,
    setSelectedTone,
  } = useSequencerStore();

  const handleToggleSampling = () => {
    if (isSampling) {
      stopSampling();
    } else {
      startSampling();
    }
  };

  const handleUseInSequencer = () => {
    setSelectedTone('sampled_sound');
  };

  return (
    <div id="sk1-sampling-studio" className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-mono font-bold text-neutral-100 uppercase tracking-wide">
            CASIO SK-1 SAMPLING STUDIO (8-BIT PCM @ 9.387 kHz)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span>Capacity: <strong>1.445s</strong></span>
          <span>•</span>
          <span>DRAM: <strong>108.5 Kbit</strong></span>
          <span>•</span>
          <span>Trigger: <strong>±0.315V Auto</strong></span>
        </div>
      </div>

      {/* Main Recording Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-950 p-5 rounded-xl border border-neutral-800">
        {/* Left: Recording Controls & VU Meter */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              id="sk1-sampling-record-btn"
              onClick={handleToggleSampling}
              className={`flex-1 py-3 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                isSampling
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSampling ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
              {isSampling ? 'STOP SAMPLING' : 'START SAMPLING (MIC)'}
            </button>

            {sampleData && (
              <button
                onClick={handleUseInSequencer}
                className="px-3 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono font-bold uppercase transition-all shadow"
                title="Assign to Active Sequencer Track"
              >
                USE IN TRACK
              </button>
            )}
          </div>

          {/* Real-time Level Meter & Auto-Trigger status */}
          <div className="flex flex-col gap-2 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">INPUT SIGNAL LEVEL</span>
              <span className="text-emerald-400 font-bold">
                {isSampling ? (samplingProgress > 0 ? 'RECORDING BUFFER' : 'WAITING FOR AUDIO TRIGGER') : 'STANDBY'}
              </span>
            </div>

            {/* VU Meter */}
            <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 relative">
              {/* Threshold Marker line (at 12%) */}
              <div className="absolute top-0 bottom-0 left-[12%] w-0.5 bg-orange-400 z-10" title="Auto-Trigger Threshold" />
              <div
                className={`h-full transition-all duration-75 ${
                  samplingLevel > 0.8
                    ? 'bg-red-500'
                    : samplingLevel > 0.4
                    ? 'bg-yellow-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, samplingLevel * 100)}%` }}
              />
            </div>

            {/* Buffer Fill Progress Bar */}
            {isSampling && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                  <span>RAM DURATION (MAX 1.445s)</span>
                  <span>{Math.round(samplingProgress * 100)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-75"
                    style={{ width: `${samplingProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Loop Set & Envelope Selection */}
          <div className="grid grid-cols-2 gap-3">
            {/* Loop Toggle */}
            <button
              id="sk1-loop-set-btn"
              onClick={() => setSampleLooping(!sampleData?.isLooping)}
              disabled={!sampleData}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                sampleData?.isLooping
                  ? 'bg-neutral-800 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              } ${!sampleData ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <Repeat className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">
                  {sampleData?.isLooping ? 'LOOP ON' : 'ONE-SHOT'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold mt-2 text-neutral-200">
                LOOP SET
              </span>
            </button>

            {/* Envelope Preset for Sample */}
            <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">
                SAMPLE ENVELOPE
              </span>
              <select
                value={sampleData?.envelopeId || 1}
                onChange={(e) => setSampleEnvelope(parseInt(e.target.value, 10) as EnvelopeShapeId)}
                disabled={!sampleData}
                className="bg-neutral-950 border border-neutral-700 text-orange-400 text-xs font-mono font-bold rounded p-1 mt-1 focus:outline-none"
              >
                {Object.values(SK1_ENVELOPE_PRESETS).map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.id}. {env.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Waveform Display & Status */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>8-BIT PCM WAVEFORM BUFFER</span>
            <span>
              {sampleData
                ? `${sampleData.duration.toFixed(3)}s (${Math.round(sampleData.duration * 9387.5)} samples)`
                : 'No sample recorded'}
            </span>
          </div>

          {/* Waveform Canvas / SVG Container */}
          <div className="h-44 bg-neutral-900 rounded-xl border border-neutral-800 p-3 flex items-center justify-center overflow-hidden relative">
            {sampleData && sampleData.buffer ? (
              <svg viewBox="0 0 400 100" className="w-full h-full stroke-emerald-400 fill-none" preserveAspectRatio="none">
                {/* Center Baseline */}
                <line x1="0" y1="50" x2="400" y2="50" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                {/* 8-bit stepped wave */}
                <path
                  d={(() => {
                    const buf = sampleData.buffer;
                    const step = Math.max(1, Math.floor(buf.length / 200));
                    let d = `M 0 50`;
                    for (let i = 0; i < buf.length; i += step) {
                      const x = (i / buf.length) * 400;
                      const y = 50 - buf[i] * 45;
                      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }
                    return d;
                  })()}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <div className="text-center flex flex-col items-center gap-2 text-neutral-500">
                <Mic className="w-8 h-8 opacity-40" />
                <span className="text-xs font-mono">
                  Press "START SAMPLING" and make a sound into your microphone.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chromatic Audition Keybed for Sample */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Chromatic Transposition Keybed
          </span>
          <span>Plays recorded sample pitched across key range</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
          {AUDITION_NOTES.map((k) => (
            <button
              key={k.label}
              onClick={() => playSampleAudition(k.midi)}
              className={`h-14 rounded font-mono font-bold text-xs flex flex-col justify-end p-2 transition-all active:scale-95 shadow ${
                k.midi === 69
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 ring-2 ring-emerald-300'
                  : 'bg-neutral-200 hover:bg-white text-neutral-900'
              }`}
            >
              <span>{k.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
