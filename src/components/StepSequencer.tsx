import React, { useState } from 'react';
import {
  VolumeX,
  Volume2,
  Trash2,
  Shuffle,
  Music2,
  Sliders,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useSequencerStore } from '../store/useSequencerStore';
import { StepInspectorModal } from './StepInspectorModal';
import { audioEngine } from '../audio/AudioEngine';

export const StepSequencer: React.FC = () => {
  const {
    pattern,
    currentStep,
    isPlaying,
    selectedTrackId,
    setSelectedTrackId,
    toggleStep,
    setTrackMute,
    setTrackSolo,
    setTrackGain,
    setTrackOctave,
    clearTrack,
    randomizeTrack,
  } = useSequencerStore();

  const [inspectingStep, setInspectingStep] = useState<{ trackId: string; stepIndex: number } | null>(
    null
  );

  const handleStepClick = (e: React.MouseEvent, trackId: string, stepIndex: number) => {
    // If Shift + Click or Alt + Click, open inspector
    if (e.shiftKey || e.altKey) {
      setInspectingStep({ trackId, stepIndex });
    } else {
      toggleStep(trackId, stepIndex);
    }
  };

  const handleStepContextMenu = (e: React.MouseEvent, trackId: string, stepIndex: number) => {
    e.preventDefault();
    setInspectingStep({ trackId, stepIndex });
  };

  const previewTrackSound = (trackId: string) => {
    const track = pattern.tracks.find((t) => t.id === trackId);
    if (!track) return;
    if (track.type === 'drum' && track.drumSound) {
      audioEngine.triggerDrum(track.drumSound, track.gain);
    } else {
      audioEngine.triggerNote(
        track.id,
        track.tone,
        track.envelopeId,
        69 + track.octaveOffset * 12,
        track.gain,
        0.35,
        track.type === 'bass' ? 'bass' : 'melody'
      );
    }
  };

  return (
    <div id="sk1-step-sequencer" className="flex flex-col gap-3">
      {/* Sequencer Grid Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4 shadow-xl overflow-x-auto">
        {/* Step Indicator Header Line */}
        <div className="flex items-center min-w-[760px] pb-2 border-b border-neutral-800/80 mb-2">
          {/* Left Track Column Spacer */}
          <div className="w-56 shrink-0 flex items-center justify-between px-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            <span>TRACK / ENGINE</span>
            <span>VOL / OCT</span>
          </div>

          {/* 16 Step Header Markers & Playhead LED */}
          <div className="flex-1 grid grid-cols-16 gap-1 px-2">
            {Array.from({ length: 16 }, (_, i) => {
              const isCurrent = isPlaying && currentStep === i;
              const isBeatStart = i % 4 === 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-2.5 h-1.5 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] scale-125'
                        : isBeatStart
                        ? 'bg-neutral-700'
                        : 'bg-neutral-800'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-mono font-bold ${
                      isCurrent
                        ? 'text-amber-400'
                        : isBeatStart
                        ? 'text-neutral-400'
                        : 'text-neutral-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multitrack Rows */}
        <div className="flex flex-col gap-2 min-w-[760px]">
          {pattern.tracks.map((track) => {
            const isSelected = selectedTrackId === track.id;

            return (
              <div
                key={track.id}
                id={`track-row-${track.id}`}
                onClick={() => setSelectedTrackId(track.id)}
                className={`flex items-center rounded-lg border p-1.5 transition-all ${
                  isSelected
                    ? 'bg-neutral-800/80 border-orange-500/80 shadow-md ring-1 ring-orange-500/20'
                    : 'bg-neutral-950/70 hover:bg-neutral-900/60 border-neutral-800/80'
                }`}
              >
                {/* Track Left Info & Control Column */}
                <div className="w-56 shrink-0 flex items-center justify-between pr-3 pl-1">
                  <div className="flex items-center gap-2">
                    {/* Color Tag & Audition trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        previewTrackSound(track.id);
                      }}
                      className="w-4 h-8 rounded shrink-0 transition-transform active:scale-90 hover:opacity-80"
                      style={{ backgroundColor: track.color }}
                      title="Click to audition voice"
                    />

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-neutral-200 truncate max-w-[100px]">
                          {track.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-orange-400/80 uppercase">
                        {track.tone.replace('_', ' ')} • ENV {track.envelopeId}
                      </span>
                    </div>
                  </div>

                  {/* Track Mute / Solo / Octave / Gain Controls */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Octave Selector (only for non-drums) */}
                    {track.type !== 'drum' && (
                      <div className="flex items-center bg-neutral-900 border border-neutral-700/60 rounded px-1 text-[9px] font-mono text-neutral-300">
                        <button
                          onClick={() => setTrackOctave(track.id, track.octaveOffset - 1)}
                          className="hover:text-orange-400 font-bold px-0.5"
                        >
                          -
                        </button>
                        <span className="px-0.5 text-orange-400 font-semibold">
                          {track.octaveOffset > 0 ? `+${track.octaveOffset}` : track.octaveOffset}
                        </span>
                        <button
                          onClick={() => setTrackOctave(track.id, track.octaveOffset + 1)}
                          className="hover:text-orange-400 font-bold px-0.5"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Mute Button */}
                    <button
                      id={`mute-${track.id}`}
                      onClick={() => setTrackMute(track.id, !track.muted)}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${
                        track.muted
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Mute Track"
                    >
                      M
                    </button>

                    {/* Solo Button */}
                    <button
                      id={`solo-${track.id}`}
                      onClick={() => setTrackSolo(track.id, !track.solo)}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${
                        track.solo
                          ? 'bg-amber-500 text-neutral-950 font-black'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Solo Track"
                    >
                      S
                    </button>

                    {/* Quick Clear & Shuffle */}
                    <button
                      onClick={() => randomizeTrack(track.id)}
                      className="p-1 rounded text-neutral-500 hover:text-orange-400 transition-colors"
                      title="Randomize Steps"
                    >
                      <Shuffle className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => clearTrack(track.id)}
                      className="p-1 rounded text-neutral-500 hover:text-red-400 transition-colors"
                      title="Clear Track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 16 Step Buttons */}
                <div className="flex-1 grid grid-cols-16 gap-1 px-2" onClick={(e) => e.stopPropagation()}>
                  {track.steps.map((step, stepIdx) => {
                    const isPlayhead = isPlaying && currentStep === stepIdx;
                    const isBeatGroup = Math.floor(stepIdx / 4) % 2 === 0;

                    return (
                      <button
                        key={step.id}
                        id={`step-btn-${track.id}-${stepIdx}`}
                        onClick={(e) => handleStepClick(e, track.id, stepIdx)}
                        onContextMenu={(e) => handleStepContextMenu(e, track.id, stepIdx)}
                        className={`h-11 rounded flex flex-col items-center justify-between py-1 px-0.5 font-mono transition-all relative select-none active:scale-95 ${
                          step.active
                            ? 'bg-orange-500 text-neutral-950 font-bold shadow-md shadow-orange-950/50 ring-1 ring-orange-400'
                            : isBeatGroup
                            ? 'bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-500'
                            : 'bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/80 text-neutral-600'
                        } ${isPlayhead ? 'ring-2 ring-amber-300' : ''}`}
                        title={`Step ${stepIdx + 1}: ${step.note} (Right-click or Shift+Click for Param Locks)`}
                      >
                        {/* Note label or dot */}
                        <span className="text-[9px] tracking-tighter truncate leading-none">
                          {step.active ? (track.type === 'drum' ? '■' : step.note) : '·'}
                        </span>

                        {/* Velocity Bar */}
                        {step.active && (
                          <div className="w-full px-1">
                            <div className="w-full bg-neutral-950/50 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-neutral-950 h-full"
                                style={{ width: `${step.velocity * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequencer Footer / Help Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-neutral-400 px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Active Step
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 animate-pulse" /> Playhead
          </span>
          <span className="text-neutral-500">
            Tip: <strong>Right-Click</strong> or <strong>Shift+Click</strong> any step for Pitch, Velocity & Gate Parameter Locks.
          </span>
        </div>
      </div>

      {/* Step Inspector Parameter Modal */}
      {inspectingStep && (
        <StepInspectorModal
          trackId={inspectingStep.trackId}
          stepIndex={inspectingStep.stepIndex}
          onClose={() => setInspectingStep(null)}
        />
      )}
    </div>
  );
};
