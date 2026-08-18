import React from 'react';
import { useSequencerStore, midiToNoteName } from '../store/useSequencerStore';
import { SK1_ENVELOPE_PRESETS } from '../audio/envelopes';
import { EnvelopeShapeId } from '../types';
import { X, Volume2, Clock, Sparkles } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

interface StepInspectorModalProps {
  trackId: string;
  stepIndex: number;
  onClose: () => void;
}

const SCALE_NOTES = [
  { name: 'C', offset: 0 },
  { name: 'C#', offset: 1 },
  { name: 'D', offset: 2 },
  { name: 'D#', offset: 3 },
  { name: 'E', offset: 4 },
  { name: 'F', offset: 5 },
  { name: 'F#', offset: 6 },
  { name: 'G', offset: 7 },
  { name: 'G#', offset: 8 },
  { name: 'A', offset: 9 },
  { name: 'A#', offset: 10 },
  { name: 'B', offset: 11 },
];

export const StepInspectorModal: React.FC<StepInspectorModalProps> = ({
  trackId,
  stepIndex,
  onClose,
}) => {
  const { pattern, setStepNote, setStepVelocity, setStepGate, setTrackEnvelope } =
    useSequencerStore();

  const track = pattern.tracks.find((t) => t.id === trackId);
  const step = track?.steps[stepIndex];

  if (!track || !step) return null;

  const currentOctave = Math.floor(step.midiNote / 12) - 1;
  const currentNoteIndex = step.midiNote % 12;

  const handleSelectNote = (noteName: string, offset: number) => {
    const newMidi = (currentOctave + 1) * 12 + offset;
    const fullNoteName = `${noteName}${currentOctave}`;
    setStepNote(trackId, stepIndex, fullNoteName, newMidi);

    // Audio preview
    audioEngine.triggerNote(
      'preview',
      track.tone,
      track.envelopeId,
      newMidi + track.octaveOffset * 12,
      step.velocity,
      0.3
    );
  };

  const handleOctaveChange = (newOctave: number) => {
    const offset = currentNoteIndex;
    const newMidi = (newOctave + 1) * 12 + offset;
    const noteLetter = SCALE_NOTES.find((n) => n.offset === offset)?.name || 'C';
    setStepNote(trackId, stepIndex, `${noteLetter}${newOctave}`, newMidi);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">
              STEP {stepIndex + 1} PARAMETER LOCKS
            </span>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
              {track.name} — <span className="font-mono text-orange-400">{step.note}</span> (MIDI {step.midiNote})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pitch Selector (Only for synth/sampler/bass tracks) */}
        {track.type !== 'drum' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400 uppercase font-semibold">
                Pitch & Octave (C1 – C7)
              </span>
              {/* Octave buttons */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                <span className="text-[10px] font-mono text-neutral-500 px-1">OCT</span>
                {[1, 2, 3, 4, 5, 6, 7].map((oct) => (
                  <button
                    key={oct}
                    onClick={() => handleOctaveChange(oct)}
                    className={`w-6 h-6 rounded text-xs font-mono font-bold transition-colors ${
                      currentOctave === oct
                        ? 'bg-orange-500 text-neutral-950'
                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {oct}
                  </button>
                ))}
              </div>
            </div>

            {/* Piano Keys Matrix */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
              {SCALE_NOTES.map((note) => {
                const isCurrent = currentNoteIndex === note.offset;
                const isBlackKey = note.name.includes('#');
                return (
                  <button
                    key={note.name}
                    onClick={() => handleSelectNote(note.name, note.offset)}
                    className={`h-12 rounded flex flex-col items-center justify-between py-1 font-mono text-xs font-bold transition-all active:scale-95 ${
                      isCurrent
                        ? 'bg-orange-500 text-neutral-950 ring-2 ring-orange-400'
                        : isBlackKey
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        : 'bg-neutral-200 text-neutral-900 hover:bg-white'
                    }`}
                  >
                    <span className="text-[10px]">{note.name}</span>
                    <span className="text-[9px] opacity-70">{currentOctave}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Velocity and Gate Sliders */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-orange-400" /> Velocity
              </span>
              <span className="text-neutral-200">{Math.round(step.velocity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={step.velocity}
              onChange={(e) => setStepVelocity(trackId, stepIndex, parseFloat(e.target.value))}
              className="accent-orange-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" /> Gate Duration
              </span>
              <span className="text-neutral-200">{Math.round(step.gate * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={step.gate}
              onChange={(e) => setStepGate(trackId, stepIndex, parseFloat(e.target.value))}
              className="accent-orange-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Track Envelope Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono text-neutral-400 uppercase font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Track Envelope Shape (1 – 13)
          </span>
          <div className="grid grid-cols-6 sm:grid-cols-13 gap-1 bg-neutral-950 p-1.5 rounded border border-neutral-800">
            {Object.values(SK1_ENVELOPE_PRESETS).map((env) => (
              <button
                key={env.id}
                onClick={() => setTrackEnvelope(trackId, env.id as EnvelopeShapeId)}
                title={`${env.id}. ${env.name}`}
                className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  track.envelopeId === env.id
                    ? 'bg-orange-500 text-neutral-950'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                {env.id}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-lg active:scale-98"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
