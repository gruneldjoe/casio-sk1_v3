import React from 'react';
import { PresetToneId } from '../types';
import { useSequencerStore } from '../store/useSequencerStore';
import { audioEngine } from '../audio/AudioEngine';

interface ToneOption {
  id: PresetToneId;
  label: string;
  category: 'PCM' | 'HARMONIC' | 'USER';
  subtext: string;
}

const TONE_OPTIONS: ToneOption[] = [
  { id: 'piano', label: 'PIANO', category: 'PCM', subtext: '8-bit acoustic strike' },
  { id: 'brass', label: 'BRASS ENSEMBLE', category: 'PCM', subtext: 'Resonant multi-saw' },
  { id: 'trumpet', label: 'TRUMPET', category: 'PCM', subtext: 'Bright brass overtones' },
  { id: 'synth_drums', label: 'SYNTH DRUMS', category: 'PCM', subtext: '80s pitch zap tom' },
  { id: 'human_voice', label: 'HUMAN VOICE', category: 'PCM', subtext: 'Lo-fi choir formant' },
  { id: 'flute', label: 'FLUTE', category: 'HARMONIC', subtext: 'Soft pure sine' },
  { id: 'pipe_organ', label: 'PIPE ORGAN', category: 'HARMONIC', subtext: 'Cathedral ranks' },
  { id: 'jazz_organ', label: 'JAZZ ORGAN', category: 'HARMONIC', subtext: 'Drawbar with click' },
  { id: 'harmonic_synth', label: 'HARMO. SYNTH', category: 'USER', subtext: 'Additive drawbars' },
  { id: 'sampled_sound', label: 'SAMPLING', category: 'USER', subtext: '1.4s 8-bit RAM' },
];

export const ToneSelectorBar: React.FC = () => {
  const { selectedTone, setSelectedTone, selectedTrackId, pattern } = useSequencerStore();

  const currentTrack = pattern.tracks.find((t) => t.id === selectedTrackId);

  const handleSelectTone = (tone: PresetToneId) => {
    setSelectedTone(tone);
    // Audition sound
    const env = currentTrack?.envelopeId || 1;
    audioEngine.triggerNote('preview', tone, env, 69, 0.9, 0.4);
  };

  return (
    <div id="sk1-tone-selector-bar" className="bg-neutral-900/90 border-b border-neutral-800 p-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
              PRESET TONE SELECTOR
            </span>
            <span className="text-[10px] font-mono text-orange-400/90 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
              TARGET: {currentTrack?.name || 'MASTER'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            5 PCM Tones + 3 Harmonic Synthesis + User Waveforms
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
          {TONE_OPTIONS.map((item) => {
            const isSelected = selectedTone === item.id;
            return (
              <button
                key={item.id}
                id={`tone-btn-${item.id}`}
                onClick={() => handleSelectTone(item.id)}
                className={`relative flex flex-col items-center justify-center p-2 rounded border transition-all text-center group active:scale-95 ${
                  isSelected
                    ? 'bg-neutral-800 border-orange-500 shadow-md ring-1 ring-orange-500/30'
                    : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {/* Red LED Indicator */}
                <div
                  className={`w-2 h-2 rounded-full mb-1 transition-all ${
                    isSelected
                      ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                      : 'bg-neutral-800 border border-neutral-700'
                  }`}
                />
                <span
                  className={`text-[11px] font-mono font-bold tracking-tight uppercase leading-tight ${
                    isSelected ? 'text-orange-400' : 'text-neutral-300'
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-[8px] font-mono text-neutral-500 mt-0.5 truncate max-w-full">
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
