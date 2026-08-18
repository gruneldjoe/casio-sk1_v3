import React from 'react';
import { DrumSoundId, RhythmPatternId } from '../types';
import { useSequencerStore } from '../store/useSequencerStore';
import { audioEngine } from '../audio/AudioEngine';
import { Activity, Sparkles, Volume2 } from 'lucide-react';

const DRUM_PADS: { id: DrumSoundId; label: string; sub: string; color: string }[] = [
  { id: 'kick', label: 'BASS DRUM', sub: '8-bit stepped punch', color: '#C2185B' },
  { id: 'snare', label: 'SNARE DRUM', sub: '190Hz + noise cluster', color: '#8E24AA' },
  { id: 'hihat_closed', label: 'CLOSED HAT', sub: '7kHz metallic pulse', color: '#5E35B1' },
  { id: 'hihat_open', label: 'OPEN HAT', sub: 'Sustained sizzle', color: '#3949AB' },
  { id: 'bongo_high', label: 'HIGH BONGO', sub: '380Hz acoustic ring', color: '#00897B' },
  { id: 'bongo_low', label: 'LOW BONGO', sub: '220Hz acoustic punch', color: '#E65100' },
];

const RHYTHMS: { id: RhythmPatternId; label: string; bpm: number }[] = [
  { id: 'disco', label: 'DISCO', bpm: 120 },
  { id: 'rock', label: 'ROCK', bpm: 116 },
  { id: 'pops', label: 'POPS', bpm: 118 },
  { id: 'march', label: 'MARCH', bpm: 110 },
  { id: 'samba', label: 'SAMBA', bpm: 130 },
  { id: 'bossa_nova', label: 'BOSSA NOVA', bpm: 108 },
  { id: 'rhumba', label: 'RHUMBA', bpm: 104 },
  { id: 'four_beat', label: '4-BEAT', bpm: 114 },
  { id: 'swing', label: 'SWING', bpm: 122 },
  { id: 'slow_rock', label: 'SLOW ROCK', bpm: 78 },
  { id: 'waltz', label: 'WALTZ (3/4)', bpm: 96 },
];

export const DrumMachinePanel: React.FC = () => {
  const { applyRhythmPreset, setBpm, setActiveTab } = useSequencerStore();

  const handleTriggerDrum = (id: DrumSoundId) => {
    audioEngine.triggerDrum(id, 1.0);
  };

  const handleSelectRhythm = (rhythm: (typeof RHYTHMS)[0]) => {
    applyRhythmPreset(rhythm.id);
    setBpm(rhythm.bpm);
  };

  const handleFillIn = () => {
    // Immediate snare / tom grace notes fill-in
    const now = (audioEngine as any).ctx?.currentTime || 0;
    audioEngine.triggerDrum('snare', 0.8, now);
    audioEngine.triggerDrum('bongo_high', 0.85, now + 0.08);
    audioEngine.triggerDrum('bongo_low', 0.9, now + 0.16);
    audioEngine.triggerDrum('snare', 1.0, now + 0.24);
  };

  return (
    <div id="sk1-drum-machine-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-mono font-bold text-neutral-100 uppercase tracking-wide">
            SK-1 DRUMS & 11 AUTO-RHYTHM GENERATOR
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFillIn}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-black text-xs uppercase tracking-wider transition-all shadow active:scale-95 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            FILL-IN GRACE
          </button>
        </div>
      </div>

      {/* 6 Direct Drum Trigger Pads */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono text-neutral-400 uppercase font-semibold">
          Hardware Drum Pads (Percussion Filter Pin 97 SC)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DRUM_PADS.map((pad) => (
            <button
              key={pad.id}
              id={`drum-pad-${pad.id}`}
              onClick={() => handleTriggerDrum(pad.id)}
              className="h-28 rounded-xl p-3 flex flex-col justify-between text-left transition-all active:scale-95 border border-neutral-800 shadow-md group relative overflow-hidden bg-neutral-950 hover:bg-neutral-900"
            >
              {/* Color Accent Bar */}
              <div
                className="w-full h-1.5 rounded-full"
                style={{ backgroundColor: pad.color }}
              />

              <div>
                <span className="font-mono font-bold text-xs text-neutral-100 block leading-tight">
                  {pad.label}
                </span>
                <span className="text-[9px] font-mono text-neutral-500 block mt-1">
                  {pad.sub}
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                <span>PAD</span>
                <Volume2 className="w-3 h-3 text-orange-400 opacity-60 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 11 Auto-Rhythm Presets */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-400 uppercase font-semibold">
            11 Preset Auto-Rhythms (Injects patterns into Sequencer)
          </span>
          <button
            onClick={() => setActiveTab('sequencer')}
            className="text-xs font-mono text-orange-400 hover:underline"
          >
            View in Sequencer Grid →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {RHYTHMS.map((rhythm) => (
            <button
              key={rhythm.id}
              id={`rhythm-preset-${rhythm.id}`}
              onClick={() => handleSelectRhythm(rhythm)}
              className="p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left transition-all active:scale-95 group"
            >
              <span className="font-mono font-bold text-xs text-neutral-200 group-hover:text-orange-400 block">
                {rhythm.label}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 block">
                {rhythm.bpm} BPM
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
