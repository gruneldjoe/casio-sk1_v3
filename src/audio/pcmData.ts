import { DrumSoundId, PresetToneId } from '../types';

/**
 * 8-Bit Lo-Fi PCM sample generators for the Casio SK-1 default tones and drums.
 * Generates raw Float32Array buffers quantized to 8-bit at exactly 9387.5 Hz.
 */

const SK1_SAMPLE_RATE = 9387.5;

function quantizeTo8Bit(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return Math.round(clamped * 127.5) / 127.5;
}

/**
 * Generates looped 8-bit PCM single/multi-cycle wavetable for preset melody tones.
 */
export function generatePCMWavetable(tone: PresetToneId, audioContext: AudioContext): AudioBuffer {
  const cycles = 4;
  const fundamentalFreq = 442.0; // SK-1 nominal A4 calibration
  const duration = (1 / fundamentalFreq) * cycles;
  const numSamples = Math.floor(duration * SK1_SAMPLE_RATE);
  
  const buffer = audioContext.createBuffer(1, numSamples, SK1_SAMPLE_RATE);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SK1_SAMPLE_RATE;
    const phase = (t * fundamentalFreq * 2 * Math.PI) % (2 * Math.PI);
    let sample = 0;

    switch (tone) {
      case 'piano': {
        // Struck acoustic string with bright odd & even harmonics
        sample =
          Math.sin(phase) * 0.6 +
          Math.sin(phase * 2) * 0.25 +
          Math.sin(phase * 3) * 0.15 +
          Math.sin(phase * 4) * 0.1 +
          Math.sin(phase * 5) * 0.08 +
          Math.sin(phase * 7) * 0.04;
        break;
      }
      case 'brass': {
        // Multi-saw brass ensemble with detuned rich overtones
        const saw1 = 2 * ((phase / (2 * Math.PI)) % 1) - 1;
        const saw2 = 2 * (((phase * 1.006) / (2 * Math.PI)) % 1) - 1;
        sample = (saw1 * 0.6 + saw2 * 0.4) * 0.8;
        break;
      }
      case 'trumpet': {
        // Piercing trumpet with bright upper harmonics
        sample =
          Math.sin(phase) * 0.45 +
          Math.sin(phase * 2) * 0.35 +
          Math.sin(phase * 3) * 0.28 +
          Math.sin(phase * 4) * 0.22 +
          Math.sin(phase * 5) * 0.15 +
          Math.sin(phase * 6) * 0.1;
        break;
      }
      case 'synth_drums': {
        // Punchy 80s pitch-swept square/triangle zap tone
        sample = (Math.sin(phase) > 0 ? 0.7 : -0.7) * 0.6 + Math.sin(phase * 2) * 0.3;
        break;
      }
      case 'human_voice': {
        // Classic SK-1 robotic "la-la-la / ahhh" formant filter simulation
        const base = Math.sin(phase);
        // Formant peaks around 800Hz, 1200Hz, 2400Hz relative to fundamental
        const f1 = Math.sin(phase * 2) * 0.5;
        const f2 = Math.sin(phase * 3) * 0.35;
        const f3 = Math.sin(phase * 6) * 0.2;
        sample = (base * 0.5 + f1 + f2 + f3) * 0.85;
        break;
      }
      case 'flute': {
        // Pure soft sine with gentle 2nd harmonic
        sample = Math.sin(phase) * 0.85 + Math.sin(phase * 2) * 0.12 + Math.sin(phase * 3) * 0.03;
        break;
      }
      case 'pipe_organ': {
        // 16', 8', 4', 2' additive church organ registration
        sample =
          Math.sin(phase * 0.5) * 0.4 +
          Math.sin(phase) * 0.5 +
          Math.sin(phase * 2) * 0.35 +
          Math.sin(phase * 4) * 0.2;
        break;
      }
      case 'jazz_organ': {
        // 8', 4', 2 2/3', 1' percussive drawbar organ with bite
        sample =
          Math.sin(phase) * 0.6 +
          Math.sin(phase * 2) * 0.4 +
          Math.sin(phase * 3) * 0.3 +
          Math.sin(phase * 8) * 0.2;
        break;
      }
      default:
        sample = Math.sin(phase);
    }

    data[i] = quantizeTo8Bit(sample);
  }

  return buffer;
}

/**
 * Generates authentic 8-bit PCM drum samples modeled after the SK-1 internal ROM.
 */
export function generateDrumBuffer(drum: DrumSoundId, audioContext: AudioContext): AudioBuffer {
  let duration = 0.25;
  if (drum === 'hihat_closed') duration = 0.06;
  if (drum === 'hihat_open') duration = 0.35;
  if (drum === 'kick') duration = 0.28;
  if (drum === 'snare') duration = 0.22;
  if (drum === 'bongo_high' || drum === 'bongo_low') duration = 0.2;

  const numSamples = Math.floor(duration * SK1_SAMPLE_RATE);
  const buffer = audioContext.createBuffer(1, numSamples, SK1_SAMPLE_RATE);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SK1_SAMPLE_RATE;
    const progress = t / duration;
    let sample = 0;

    switch (drum) {
      case 'kick': {
        // Pitch drop 130Hz -> 38Hz + snappy transient click
        const freq = 130 * Math.exp(-progress * 14) + 38;
        const phase = 2 * Math.PI * freq * t;
        const env = Math.exp(-progress * 6.5);
        const click = progress < 0.03 ? (Math.random() - 0.5) * 0.6 : 0;
        sample = (Math.sin(phase) * 0.85 + click) * env;
        break;
      }
      case 'snare': {
        // 8-bit noise burst + 180Hz body tone
        const noise = (Math.random() - 0.5) * 1.5;
        const tone = Math.sin(2 * Math.PI * 190 * Math.exp(-progress * 8) * t) * 0.5;
        const env = Math.exp(-progress * 8.5);
        sample = (noise * 0.75 + tone * 0.35) * env;
        break;
      }
      case 'hihat_closed': {
        // High frequency metallic square noise cluster
        const noise = (Math.random() - 0.5) * 1.2;
        const metallic = (Math.sin(t * 7000 * 2 * Math.PI) > 0 ? 0.3 : -0.3);
        const env = Math.exp(-progress * 28);
        sample = (noise * 0.7 + metallic) * env;
        break;
      }
      case 'hihat_open': {
        // Sustained metallic shimmer
        const noise = (Math.random() - 0.5) * 1.0;
        const metallic = Math.sin(t * 6200 * 2 * Math.PI) * 0.3 + Math.sin(t * 8400 * 2 * Math.PI) * 0.2;
        const env = Math.exp(-progress * 5.0);
        sample = (noise * 0.65 + metallic) * env;
        break;
      }
      case 'bongo_high': {
        // High acoustic bongo pitch strike
        const freq = 380 * Math.exp(-progress * 5) + 240;
        const tone = Math.sin(2 * Math.PI * freq * t);
        const overtone = Math.sin(2 * Math.PI * freq * 2.1 * t) * 0.3;
        const env = Math.exp(-progress * 7.5);
        sample = (tone + overtone) * env * 0.85;
        break;
      }
      case 'bongo_low': {
        // Low acoustic bongo pitch strike
        const freq = 220 * Math.exp(-progress * 4.5) + 140;
        const tone = Math.sin(2 * Math.PI * freq * t);
        const overtone = Math.sin(2 * Math.PI * freq * 1.8 * t) * 0.25;
        const env = Math.exp(-progress * 6.5);
        sample = (tone + overtone) * env * 0.85;
        break;
      }
    }

    data[i] = quantizeTo8Bit(sample);
  }

  return buffer;
}
