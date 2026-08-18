import { HarmonicFootage, HarmonicLevels } from '../types';

export const FOOTAGE_RATIOS: Record<HarmonicFootage, number> = {
  '16': 0.5,
  '8': 1.0,
  '5_1_3': 1.5,
  '4': 2.0,
  '2_2_3': 3.0,
  '2': 4.0,
  '1_3_5': 5.0,
  '1_1_3': 6.0,
  '1': 8.0,
};

export const FOOTAGE_LABELS: { id: HarmonicFootage; label: string; name: string }[] = [
  { id: '16', label: "16'", name: 'Sub-Octave' },
  { id: '8', label: "8'", name: 'Fundamental' },
  { id: '5_1_3', label: "5 1/3'", name: 'Fifth' },
  { id: '4', label: "4'", name: 'Octave' },
  { id: '2_2_3', label: "2 2/3'", name: 'Twelfth' },
  { id: '2', label: "2'", name: 'Fifteenth' },
  { id: '1_3_5', label: "1 3/5'", name: 'Seventeenth' },
  { id: '1_1_3', label: "1 1/3'", name: 'Nineteenth' },
  { id: '1', label: "1'", name: 'Twenty-Second' },
];

export const DEFAULT_HARMONIC_LEVELS: HarmonicLevels = {
  '16': 4,
  '8': 8,
  '5_1_3': 2,
  '4': 6,
  '2_2_3': 1,
  '2': 3,
  '1_3_5': 0,
  '1_1_3': 0,
  '1': 0,
};

/**
 * Famous SK-1 manual harmonic synthesis templates
 */
export const HARMONIC_PRESET_TEMPLATES: {
  name: string;
  levels: HarmonicLevels;
  suggestedEnvelope: number;
}[] = [
  {
    name: 'Clarinet',
    levels: { '16': 4, '8': 1, '5_1_3': 3, '4': 0, '2_2_3': 0, '2': 0, '1_3_5': 0, '1_1_3': 0, '1': 0 },
    suggestedEnvelope: 3,
  },
  {
    name: 'Oboe',
    levels: { '16': 0, '8': 3, '5_1_3': 5, '4': 1, '2_2_3': 0, '2': 0, '1_3_5': 0, '1_1_3': 0, '1': 0 },
    suggestedEnvelope: 3,
  },
  {
    name: 'Violin',
    levels: { '16': 1, '8': 1, '5_1_3': 0, '4': 1, '2_2_3': 1, '2': 2, '1_3_5': 2, '1_1_3': 2, '1': 2 },
    suggestedEnvelope: 5,
  },
  {
    name: 'Harpsichord',
    levels: { '16': 0, '8': 1, '5_1_3': 1, '4': 1, '2_2_3': 0, '2': 2, '1_3_5': 2, '1_1_3': 2, '1': 2 },
    suggestedEnvelope: 1,
  },
  {
    name: 'Electric Piano',
    levels: { '16': 10, '8': 4, '5_1_3': 0, '4': 0, '2_2_3': 0, '2': 0, '1_3_5': 0, '1_1_3': 0, '1': 1 },
    suggestedEnvelope: 1,
  },
  {
    name: 'Toy Piano',
    levels: { '16': 0, '8': 0, '5_1_3': 0, '4': 0, '2_2_3': 0, '2': 0, '1_3_5': 0, '1_1_3': 1, '1': 6 },
    suggestedEnvelope: 13,
  },
  {
    name: 'Vibraphone 1',
    levels: { '16': 0, '8': 0, '5_1_3': 0, '4': 0, '2_2_3': 0, '2': 0, '1_3_5': 0, '1_1_3': 1, '1': 1 },
    suggestedEnvelope: 1,
  },
  {
    name: 'Full Drawbars',
    levels: { '16': 8, '8': 8, '5_1_3': 6, '4': 6, '2_2_3': 5, '2': 4, '1_3_5': 3, '1_1_3': 2, '1': 1 },
    suggestedEnvelope: 2,
  },
];

/**
 * Synthesizes a periodic 8-bit periodic wavetable buffer based on drawbar harmonic levels.
 */
export function generateHarmonicWaveBuffer(
  levels: HarmonicLevels,
  audioContext: AudioContext,
  sampleRate: number = 9387.5
): AudioBuffer {
  const fundamentalFreq = 442.0;
  const numSamples = Math.floor(sampleRate / fundamentalFreq) * 8;
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  let maxPeak = 0;
  const temp = new Float32Array(numSamples);

  // Sum up all footages
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sum = 0;

    for (const [footage, level] of Object.entries(levels)) {
      if (level > 0) {
        const ratio = FOOTAGE_RATIOS[footage as HarmonicFootage];
        const amplitude = level / 14.0;
        const phase = 2 * Math.PI * fundamentalFreq * ratio * t;
        sum += Math.sin(phase) * amplitude;
      }
    }

    temp[i] = sum;
    if (Math.abs(sum) > maxPeak) {
      maxPeak = Math.abs(sum);
    }
  }

  const normFactor = maxPeak > 0.001 ? 0.9 / maxPeak : 1.0;
  for (let i = 0; i < numSamples; i++) {
    const norm = temp[i] * normFactor;
    // Quantize to 8-bit
    data[i] = Math.round(norm * 127.5) / 127.5;
  }

  return buffer;
}
