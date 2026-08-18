import { create } from 'zustand';
import {
  DrumSoundId,
  EnvelopeShapeId,
  HarmonicLevels,
  Pattern,
  PresetToneId,
  RhythmPatternId,
  SampleData,
  TrackConfig,
} from '../types';
import { audioEngine } from '../audio/AudioEngine';
import { DEFAULT_HARMONIC_LEVELS } from '../audio/harmonicSynth';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

const DEFAULT_INITIAL_TRACKS: TrackConfig[] = [
  {
    id: 'track-melody',
    name: 'Lead / Melody',
    color: '#E65100',
    type: 'synth',
    tone: 'human_voice',
    envelopeId: 4,
    octaveOffset: 0,
    gain: 0.9,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-mel-${i}`,
      active: [0, 3, 6, 8, 11, 14].includes(i),
      note: i === 0 ? 'A4' : i === 3 ? 'C5' : i === 6 ? 'D5' : i === 8 ? 'E5' : i === 11 ? 'D5' : 'C5',
      midiNote: i === 0 ? 69 : i === 3 ? 72 : i === 6 ? 74 : i === 8 ? 76 : i === 11 ? 74 : 72,
      velocity: 0.9,
      gate: 0.75,
    })),
  },
  {
    id: 'track-chords',
    name: 'Harmonic Synth',
    color: '#F57C00',
    type: 'chord',
    tone: 'harmonic_synth',
    envelopeId: 2,
    octaveOffset: 0,
    gain: 0.8,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-ch-${i}`,
      active: [0, 4, 8, 12].includes(i),
      note: i === 0 ? 'F4' : i === 4 ? 'A4' : i === 8 ? 'D4' : 'G4',
      midiNote: i === 0 ? 65 : i === 4 ? 69 : i === 8 ? 62 : 67,
      velocity: 0.85,
      gate: 0.9,
    })),
  },
  {
    id: 'track-sampler',
    name: 'SK-1 Sampler',
    color: '#00897B',
    type: 'sampler',
    tone: 'sampled_sound',
    envelopeId: 1,
    octaveOffset: 0,
    gain: 0.9,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-smp-${i}`,
      active: [2, 10].includes(i),
      note: i === 2 ? 'A4' : 'F4',
      midiNote: i === 2 ? 69 : 65,
      velocity: 0.95,
      gate: 0.8,
    })),
  },
  {
    id: 'track-bass',
    name: 'Bass Line',
    color: '#3949AB',
    type: 'bass',
    tone: 'pipe_organ',
    envelopeId: 1,
    octaveOffset: -1,
    gain: 0.95,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-bass-${i}`,
      active: [0, 2, 4, 6, 8, 10, 12, 14].includes(i),
      note: i < 8 ? 'A2' : 'D2',
      midiNote: i < 8 ? 45 : 38,
      velocity: 0.9,
      gate: 0.65,
    })),
  },
  {
    id: 'track-kick',
    name: 'Kick Drum',
    color: '#C2185B',
    type: 'drum',
    tone: 'synth_drums',
    drumSound: 'kick',
    envelopeId: 13,
    octaveOffset: 0,
    gain: 1.0,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-k-${i}`,
      active: [0, 4, 8, 12].includes(i),
      note: 'C3',
      midiNote: 48,
      velocity: 1.0,
      gate: 0.5,
    })),
  },
  {
    id: 'track-snare',
    name: 'Snare Drum',
    color: '#8E24AA',
    type: 'drum',
    tone: 'synth_drums',
    drumSound: 'snare',
    envelopeId: 13,
    octaveOffset: 0,
    gain: 0.9,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-sn-${i}`,
      active: [4, 12].includes(i),
      note: 'D3',
      midiNote: 50,
      velocity: 0.95,
      gate: 0.5,
    })),
  },
  {
    id: 'track-hihat',
    name: 'Hi-Hat',
    color: '#5E35B1',
    type: 'drum',
    tone: 'synth_drums',
    drumSound: 'hihat_closed',
    envelopeId: 13,
    octaveOffset: 0,
    gain: 0.8,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      id: `step-hh-${i}`,
      active: [0, 2, 4, 6, 8, 10, 12, 14].includes(i),
      note: 'F#3',
      midiNote: 54,
      velocity: i % 4 === 0 ? 0.9 : 0.65,
      gate: 0.3,
    })),
  },
];

export interface SequencerStore {
  // Transport & Clock
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  swing: number;
  masterVolume: number;
  tuningCents: number;

  // Effects & Vintage Hardware Modes
  vibrato: boolean;
  portamento: boolean;
  bitcrusherActive: boolean;
  selectedEnvelopeId: EnvelopeShapeId;
  selectedTone: PresetToneId;
  harmonicLevels: HarmonicLevels;

  // Multitrack Pattern Grid
  pattern: Pattern;
  selectedTrackId: string;
  selectedStepIndex: number | null;

  // Sampler state
  sampleData: SampleData | null;
  isSampling: boolean;
  samplingLevel: number;
  samplingProgress: number;

  // Active view tabs (Sequencer / Harmonic Synth / Envelopes / Sampler / Drums / Circuit Bending)
  activeTab: 'sequencer' | 'harmonic' | 'envelopes' | 'sampler' | 'drums' | 'bending';

  // Actions
  togglePlay: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setSwing: (swing: number) => void;
  setMasterVolume: (vol: number) => void;
  setTuningCents: (cents: number) => void;
  toggleVibrato: () => void;
  togglePortamento: () => void;
  toggleBitcrusher: () => void;
  setSelectedEnvelopeId: (id: EnvelopeShapeId) => void;
  setSelectedTone: (tone: PresetToneId) => void;
  setHarmonicLevel: (footage: keyof HarmonicLevels, level: number) => void;
  setHarmonicLevels: (levels: HarmonicLevels) => void;

  // Track & Step Actions
  setSelectedTrackId: (id: string) => void;
  setSelectedStepIndex: (index: number | null) => void;
  toggleStep: (trackId: string, stepIndex: number) => void;
  setStepNote: (trackId: string, stepIndex: number, note: string, midiNote: number) => void;
  setStepVelocity: (trackId: string, stepIndex: number, velocity: number) => void;
  setStepGate: (trackId: string, stepIndex: number, gate: number) => void;
  setTrackMute: (trackId: string, muted: boolean) => void;
  setTrackSolo: (trackId: string, solo: boolean) => void;
  setTrackTone: (trackId: string, tone: PresetToneId) => void;
  setTrackEnvelope: (trackId: string, envId: EnvelopeShapeId) => void;
  setTrackOctave: (trackId: string, octave: number) => void;
  setTrackGain: (trackId: string, gain: number) => void;
  clearTrack: (trackId: string) => void;
  randomizeTrack: (trackId: string) => void;

  // Sampler Actions
  startSampling: () => Promise<void>;
  stopSampling: () => void;
  setSampleLooping: (isLooping: boolean) => void;
  setSampleEnvelope: (envId: EnvelopeShapeId) => void;
  playSampleAudition: (midiNote?: number) => void;

  // Rhythms
  activeRhythm: RhythmPatternId | null;
  applyRhythmPreset: (rhythmId: RhythmPatternId) => void;

  // Navigation
  setActiveTab: (tab: 'sequencer' | 'harmonic' | 'envelopes' | 'sampler' | 'drums' | 'bending') => void;
}

export const useSequencerStore = create<SequencerStore>((set, get) => ({
  isPlaying: false,
  currentStep: 0,
  bpm: 118,
  swing: 0.1,
  masterVolume: 0.85,
  tuningCents: 0,

  vibrato: false,
  portamento: false,
  bitcrusherActive: true,
  selectedEnvelopeId: 1,
  selectedTone: 'human_voice',
  harmonicLevels: { ...DEFAULT_HARMONIC_LEVELS },

  pattern: {
    id: 'pattern-1',
    name: 'Casio SK-1 Groove',
    tracks: DEFAULT_INITIAL_TRACKS,
  },
  selectedTrackId: 'track-melody',
  selectedStepIndex: null,

  sampleData: null,
  isSampling: false,
  samplingLevel: 0,
  samplingProgress: 0,

  activeRhythm: null,

  activeTab: 'sequencer',

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      audioEngine.stopSequencer();
      set({ isPlaying: false, currentStep: 0 });
    } else {
      const { pattern, bpm, swing } = get();
      audioEngine.setPattern(pattern);
      audioEngine.setBpm(bpm);
      audioEngine.setSwing(swing);
      audioEngine.startSequencer((step) => {
        set({ currentStep: step });
      });
      set({ isPlaying: true });
    }
  },

  stop: () => {
    audioEngine.stopSequencer();
    set({ isPlaying: false, currentStep: 0 });
  },

  setBpm: (bpm: number) => {
    const clamped = Math.max(40, Math.min(240, bpm));
    audioEngine.setBpm(clamped);
    set({ bpm: clamped });
  },

  setSwing: (swing: number) => {
    const clamped = Math.max(0, Math.min(0.6, swing));
    audioEngine.setSwing(clamped);
    set({ swing: clamped });
  },

  setMasterVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    audioEngine.setMasterGain(clamped);
    set({ masterVolume: clamped });
  },

  setTuningCents: (cents: number) => {
    const clamped = Math.max(-50, Math.min(50, cents));
    audioEngine.setTuning(clamped);
    set({ tuningCents: clamped });
  },

  toggleVibrato: () => {
    const next = !get().vibrato;
    audioEngine.setVibrato(next);
    set({ vibrato: next });
  },

  togglePortamento: () => {
    const next = !get().portamento;
    audioEngine.setPortamento(next);
    set({ portamento: next });
  },

  toggleBitcrusher: () => {
    const next = !get().bitcrusherActive;
    audioEngine.setBitcrusherActive(next);
    set({ bitcrusherActive: next });
  },

  setSelectedEnvelopeId: (id: EnvelopeShapeId) => {
    const { selectedTrackId, pattern } = get();
    set({ selectedEnvelopeId: id });
    // Also update selected track envelope
    const updatedTracks = pattern.tracks.map((t) =>
      t.id === selectedTrackId ? { ...t, envelopeId: id } : t
    );
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setSelectedTone: (tone: PresetToneId) => {
    const { selectedTrackId, pattern } = get();
    set({ selectedTone: tone });
    const updatedTracks = pattern.tracks.map((t) =>
      t.id === selectedTrackId ? { ...t, tone } : t
    );
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setHarmonicLevel: (footage, level) => {
    const newLevels = { ...get().harmonicLevels, [footage]: Math.max(0, Math.min(14, level)) };
    audioEngine.updateHarmonicBuffer(newLevels);
    set({ harmonicLevels: newLevels });
  },

  setHarmonicLevels: (levels) => {
    audioEngine.updateHarmonicBuffer(levels);
    set({ harmonicLevels: levels });
  },

  setSelectedTrackId: (id: string) => {
    const track = get().pattern.tracks.find((t) => t.id === id);
    if (track) {
      set({
        selectedTrackId: id,
        selectedTone: track.tone,
        selectedEnvelopeId: track.envelopeId,
      });
    }
  },

  setSelectedStepIndex: (index: number | null) => {
    set({ selectedStepIndex: index });
  },

  toggleStep: (trackId: string, stepIndex: number) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const updatedSteps = track.steps.map((step, idx) => {
        if (idx !== stepIndex) return step;
        const newActive = !step.active;
        if (newActive) {
          // Play preview
          if (track.type === 'drum' && track.drumSound) {
            audioEngine.triggerDrum(track.drumSound, step.velocity * track.gain);
          } else {
            audioEngine.triggerNote(
              track.id,
              track.tone,
              track.envelopeId,
              step.midiNote + track.octaveOffset * 12,
              step.velocity * track.gain,
              0.25,
              track.type === 'bass' ? 'bass' : 'melody'
            );
          }
        }
        return { ...step, active: newActive };
      });
      return { ...track, steps: updatedSteps };
    });

    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern, activeRhythm: null });
  },

  setStepNote: (trackId: string, stepIndex: number, note: string, midiNote: number) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const updatedSteps = track.steps.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return { ...step, note, midiNote };
      });
      return { ...track, steps: updatedSteps };
    });
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setStepVelocity: (trackId: string, stepIndex: number, velocity: number) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const updatedSteps = track.steps.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return { ...step, velocity: Math.max(0.1, Math.min(1, velocity)) };
      });
      return { ...track, steps: updatedSteps };
    });
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setStepGate: (trackId: string, stepIndex: number, gate: number) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const updatedSteps = track.steps.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return { ...step, gate: Math.max(0.1, Math.min(1.0, gate)) };
      });
      return { ...track, steps: updatedSteps };
    });
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setTrackMute: (trackId: string, muted: boolean) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) => (t.id === trackId ? { ...t, muted } : t));
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setTrackSolo: (trackId: string, solo: boolean) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) => ({
      ...t,
      solo: t.id === trackId ? solo : false,
      muted: solo ? t.id !== trackId : false,
    }));
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setTrackTone: (trackId: string, tone: PresetToneId) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) => (t.id === trackId ? { ...t, tone } : t));
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern, selectedTone: tone });
  },

  setTrackEnvelope: (trackId: string, envId: EnvelopeShapeId) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) => (t.id === trackId ? { ...t, envelopeId: envId } : t));
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern, selectedEnvelopeId: envId });
  },

  setTrackOctave: (trackId: string, octave: number) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) =>
      t.id === trackId ? { ...t, octaveOffset: Math.max(-2, Math.min(2, octave)) } : t
    );
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  setTrackGain: (trackId: string, gain: number) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) =>
      t.id === trackId ? { ...t, gain: Math.max(0, Math.min(1, gain)) } : t
    );
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  clearTrack: (trackId: string) => {
    const { pattern } = get();
    const updatedTracks = pattern.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        steps: t.steps.map((s) => ({ ...s, active: false })),
      };
    });
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  randomizeTrack: (trackId: string) => {
    const { pattern } = get();
    const scaleNotes = [60, 62, 64, 65, 67, 69, 71, 72]; // C Major
    const updatedTracks = pattern.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        steps: t.steps.map((s) => {
          const active = Math.random() > 0.6;
          const midi = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
          return {
            ...s,
            active,
            midiNote: midi,
            note: midiToNoteName(midi),
            velocity: 0.7 + Math.random() * 0.3,
            gate: 0.5 + Math.random() * 0.4,
          };
        }),
      };
    });
    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern });
  },

  // --- Sampler Actions ---

  startSampling: async () => {
    set({ isSampling: true, samplingLevel: 0, samplingProgress: 0 });
    try {
      await audioEngine.startSampling(
        (level, progress) => {
          set({ samplingLevel: level, samplingProgress: progress });
        },
        (sample) => {
          set({
            sampleData: sample,
            isSampling: false,
            samplingProgress: 1.0,
          });
        }
      );
    } catch {
      set({ isSampling: false });
    }
  },

  stopSampling: () => {
    audioEngine.stopSampling();
    set({ isSampling: false });
  },

  setSampleLooping: (isLooping: boolean) => {
    const { sampleData } = get();
    if (!sampleData) return;
    const updated = { ...sampleData, isLooping };
    if (sampleData.buffer) {
      audioEngine.setUserSample(sampleData.buffer, isLooping, sampleData.envelopeId);
    }
    set({ sampleData: updated });
  },

  setSampleEnvelope: (envId: EnvelopeShapeId) => {
    const { sampleData } = get();
    if (!sampleData) return;
    const updated = { ...sampleData, envelopeId: envId };
    set({ sampleData: updated });
  },

  playSampleAudition: (midiNote: number = 69) => {
    const { sampleData, selectedEnvelopeId } = get();
    audioEngine.triggerNote(
      'audition',
      sampleData ? 'sampled_sound' : 'piano',
      sampleData?.envelopeId || selectedEnvelopeId,
      midiNote,
      1.0,
      0.6
    );
  },

  // --- Rhythm Presets ---

  applyRhythmPreset: (rhythmId: RhythmPatternId) => {
    const { pattern } = get();
    const drumTracks = pattern.tracks.filter((t) => t.type === 'drum');
    
    let kickHits: number[] = [0, 4, 8, 12];
    let snareHits: number[] = [4, 12];
    let hihatHits: number[] = [0, 2, 4, 6, 8, 10, 12, 14];

    switch (rhythmId) {
      case 'disco':
        kickHits = [0, 4, 8, 12];
        snareHits = [4, 12];
        hihatHits = [2, 6, 10, 14];
        break;
      case 'rock':
        kickHits = [0, 8, 10];
        snareHits = [4, 12];
        hihatHits = [0, 2, 4, 6, 8, 10, 12, 14];
        break;
      case 'pops':
        kickHits = [0, 6, 8];
        snareHits = [4, 12];
        hihatHits = [0, 2, 4, 6, 8, 10, 12, 14];
        break;
      case 'march':
        kickHits = [0, 8];
        snareHits = [2, 4, 6, 10, 12, 14];
        hihatHits = [0, 4, 8, 12];
        break;
      case 'samba':
        kickHits = [0, 6, 8, 14];
        snareHits = [4, 10, 12];
        hihatHits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        break;
      case 'bossa_nova':
        kickHits = [0, 6, 10];
        snareHits = [3, 6, 8, 12];
        hihatHits = [0, 2, 4, 6, 8, 10, 12, 14];
        break;
      case 'rhumba':
        kickHits = [0, 3, 6, 10, 12];
        snareHits = [4, 12];
        hihatHits = [0, 4, 8, 12];
        break;
      case 'four_beat':
        kickHits = [0, 4, 8, 12];
        snareHits = [4, 12];
        hihatHits = [0, 4, 8, 12];
        break;
      case 'swing':
        kickHits = [0, 8];
        snareHits = [4, 12];
        hihatHits = [0, 3, 4, 7, 8, 11, 12, 15];
        break;
      case 'slow_rock':
        kickHits = [0, 8];
        snareHits = [4, 12];
        hihatHits = [0, 2, 4, 6, 8, 10, 12, 14];
        break;
      case 'waltz':
        kickHits = [0];
        snareHits = [4, 8];
        hihatHits = [0, 4, 8];
        break;
    }

    const updatedTracks = pattern.tracks.map((t) => {
      if (t.type !== 'drum') return t;
      let targetHits: number[] = [];
      if (t.drumSound === 'kick') targetHits = kickHits;
      if (t.drumSound === 'snare') targetHits = snareHits;
      if (t.drumSound?.startsWith('hihat')) targetHits = hihatHits;

      return {
        ...t,
        steps: t.steps.map((s, idx) => ({
          ...s,
          active: targetHits.includes(idx),
        })),
      };
    });

    const updatedPattern = { ...pattern, tracks: updatedTracks };
    audioEngine.setPattern(updatedPattern);
    set({ pattern: updatedPattern, activeRhythm: rhythmId });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
