import React from 'react';
import { SK1_ENVELOPE_PRESETS } from '../audio/envelopes';
import { EnvelopeShapeId } from '../types';
import { useSequencerStore } from '../store/useSequencerStore';
import { Sparkles, Volume2 } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

export const EnvelopeSelectorPanel: React.FC = () => {
  const { selectedEnvelopeId, setSelectedEnvelopeId, selectedTone, selectedTrackId, pattern } =
    useSequencerStore();

  const currentTrack = pattern.tracks.find((t) => t.id === selectedTrackId);

  const handleSelectEnvelope = (id: EnvelopeShapeId) => {
    setSelectedEnvelopeId(id);
    // Audition sound with this envelope
    audioEngine.triggerNote('preview', selectedTone, id, 69, 0.9, 0.5);
  };

  return (
    <div id="sk1-envelope-selector-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-mono font-bold text-neutral-100 uppercase tracking-wide">
            13 CASIO SK-1 PRESET ENVELOPE SELECTOR
          </h2>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          Target Track: <strong className="text-orange-400">{currentTrack?.name}</strong> • Active: ENV {selectedEnvelopeId}
        </span>
      </div>

      {/* Grid of 13 Envelope Shapes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Object.values(SK1_ENVELOPE_PRESETS).map((env) => {
          const isSelected = selectedEnvelopeId === env.id;

          return (
            <button
              key={env.id}
              id={`envelope-card-${env.id}`}
              onClick={() => handleSelectEnvelope(env.id as EnvelopeShapeId)}
              className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all relative group active:scale-98 ${
                isSelected
                  ? 'bg-neutral-800 border-orange-500 shadow-lg ring-1 ring-orange-500/30'
                  : 'bg-neutral-950 hover:bg-neutral-900/90 border-neutral-800/90 text-neutral-300'
              }`}
            >
              {/* Header with LED & Number */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      isSelected
                        ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                        : 'bg-neutral-800 border border-neutral-700'
                    }`}
                  />
                  <span className="font-mono font-black text-sm text-orange-400">
                    {env.id}. {env.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  {env.category}
                </span>
              </div>

              {/* Vector Envelope Curve Visualizer */}
              <div className="h-16 bg-neutral-900/80 rounded-lg border border-neutral-800/80 p-1 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full stroke-orange-400 fill-none" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                  {/* Curve */}
                  <path d={env.curvePath} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                {env.description}
              </p>

              {/* Numeric Parameters */}
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-800/60">
                <span>A: {Math.round(env.attackTime * 1000)}ms</span>
                <span>{env.isSustained ? `S: ${Math.round(env.sustainLevel * 100)}%` : `D: ${env.decayTime}s`}</span>
                <span>R: {Math.round(env.releaseTime * 1000)}ms</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Audition Trigger Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-neutral-300">
          <Volume2 className="w-4 h-4 text-orange-400" />
          <span>Click any envelope card above to immediately audition with the selected tone ({selectedTone.replace('_', ' ')})</span>
        </div>
      </div>
    </div>
  );
};
