/**
 * Core TypeScript definitions for Casio SK-1 Multitrack Step Sequencer
 */

export type PresetToneId =
  | 'piano'
  | 'brass'
  | 'trumpet'
  | 'synth_drums'
  | 'human_voice'
  | 'flute'
  | 'pipe_organ'
  | 'jazz_organ'
  | 'harmonic_synth'
  | 'sampled_sound';

export type DrumSoundId =
  | 'kick'
  | 'snare'
  | 'hihat_closed'
  | 'hihat_open'
  | 'bongo_high'
  | 'bongo_low';

export type RhythmPatternId =
  | 'disco'
  | 'rock'
  | 'pops'
  | 'march'
  | 'samba'
  | 'bossa_nova'
  | 'rhumba'
  | 'four_beat'
  | 'swing'
  | 'slow_rock'
  | 'waltz';

export type EnvelopeShapeId =
  | 1 // Damped Tone (Piano/Guitar slow decay)
  | 2 // Organ with attack
  | 3 // Organ (Sustain)
  | 4 // Slow attack I
  | 5 // Slow attack II
  | 6 // Long release damped
  | 7 // Long release sustained
  | 8 // Long reverb
  | 9 // Tremolo I (Fast LFO)
  | 10 // Tremolo II (Slow LFO)
  | 11 // Slow attack damped
  | 12 // Short release sustained
  | 13; // Short release damped

export interface EnvelopePreset {
  id: EnvelopeShapeId;
  name: string;
  category: 'Damped' | 'Sustained' | 'Modulated';
  description: string;
  attackTime: number; // in seconds
  decayTime: number; // in seconds
  sustainLevel: number; // 0 to 1
  releaseTime: number; // in seconds
  isSustained: boolean;
  tremoloRate?: number; // Hz (for shapes 9 and 10)
  tremoloDepth?: number; // 0 to 1
  curvePath: string; // SVG path string for UI rendering
}

export type HarmonicFootage =
  | '16'
  | '8'
  | '5_1_3'
  | '4'
  | '2_2_3'
  | '2'
  | '1_3_5'
  | '1_1_3'
  | '1';

export type HarmonicLevels = Record<HarmonicFootage, number>; // 0 to 14

export interface StepData {
  id: string;
  active: boolean;
  note: string; // e.g. "C4", "A4"
  midiNote: number; // e.g. 60 for C4
  velocity: number; // 0 to 1
  gate: number; // 0.1 to 1.0 (step duration ratio)
  // Extensibility hook: Parameter locks
  pLocks?: {
    pitchOffset?: number;
    envelopeOverride?: EnvelopeShapeId;
    cutoffOverride?: number;
    sampleSliceOffset?: number;
  };
}

export interface TrackConfig {
  id: string;
  name: string;
  color: string;
  type: 'synth' | 'sampler' | 'bass' | 'chord' | 'drum';
  tone: PresetToneId;
  envelopeId: EnvelopeShapeId;
  drumSound?: DrumSoundId;
  octaveOffset: number; // -2 to +2
  gain: number; // 0 to 1
  muted: boolean;
  solo: boolean;
  steps: StepData[];
}

export interface Pattern {
  id: string;
  name: string;
  tracks: TrackConfig[];
}

export interface SampleData {
  buffer: Float32Array | null;
  sampleRate: number; // 9387 Hz
  duration: number; // in seconds, max 1.445s
  isLooping: boolean;
  rootMidiNote: number; // 69 (A4 = 440/442Hz)
  envelopeId: EnvelopeShapeId;
  recordedAt: number | null;
}

export interface AudioEngineStatus {
  isInitialized: boolean;
  isPlaying: boolean;
  currentStep: number;
  cpuLoad: number;
  sampleRate: number;
  activeVoices: number;
  isRecordingSample: boolean;
  recordingLevel: number;
}

export type BendTargetId =
  | 'ram_short_a'
  | 'ram_short_b'
  | 'aleatron_glitch'
  | 'address_bus_scramble'
  | 'data_line_flip'
  | 'data_line_drop'
  | 'clock_starve'
  | 'channel_crosstalk'
  | 'feedback_screamer';

export interface BendConfiguration {
  id: BendTargetId;
  name: string;
  hardwarePinMapping: string;
  description: string;
  enabled: boolean;
  intensity: number; // 0 to 1
  momentary: boolean;
  dataXorMask: number; // 0 to 255
  dataAndMask: number; // 0 to 255
  dataOrMask: number; // 0 to 255
  addressXorMask: number; // 0 to 65535
  stutterWindow: number; // 16 to 1024 samples
  clockSagFactor: number; // 0.1 to 1.0 multiplier
}

export interface PatchbayMatrixConnection {
  sourcePin: string;
  targetPin: string;
  resistance: number; // in Ohms (0 = hard short)
  active: boolean;
  bendId: BendTargetId;
}
