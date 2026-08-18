import { EnvelopePreset, EnvelopeShapeId } from '../types';

export const SK1_ENVELOPE_PRESETS: Record<EnvelopeShapeId, EnvelopePreset> = {
  1: {
    id: 1,
    name: 'Damped Tone',
    category: 'Damped',
    description: 'Piano/Guitar acoustic slow natural decay',
    attackTime: 0.005,
    decayTime: 1.6,
    sustainLevel: 0.0,
    releaseTime: 0.08,
    isSustained: false,
    curvePath: 'M 0 100 L 2 10 C 20 40, 60 80, 100 100',
  },
  2: {
    id: 2,
    name: 'Organ With Attack',
    category: 'Sustained',
    description: 'Percussive key strike transient with organ sustain',
    attackTime: 0.004,
    decayTime: 0.08,
    sustainLevel: 0.72,
    releaseTime: 0.06,
    isSustained: true,
    curvePath: 'M 0 100 L 4 0 L 15 30 L 80 30 L 100 100',
  },
  3: {
    id: 3,
    name: 'Organ',
    category: 'Sustained',
    description: 'Instant full volume held while key is pressed',
    attackTime: 0.005,
    decayTime: 0.0,
    sustainLevel: 1.0,
    releaseTime: 0.03,
    isSustained: true,
    curvePath: 'M 0 100 L 4 10 L 85 10 L 100 100',
  },
  4: {
    id: 4,
    name: 'Slow Attack I',
    category: 'Sustained',
    description: 'Smooth swelling synth pad / string attack',
    attackTime: 0.45,
    decayTime: 0.2,
    sustainLevel: 0.85,
    releaseTime: 0.35,
    isSustained: true,
    curvePath: 'M 0 100 C 30 70, 45 20, 50 15 L 80 20 L 100 100',
  },
  5: {
    id: 5,
    name: 'Slow Attack II',
    category: 'Damped',
    description: 'Cello/Bowed slow crescendo into natural decay',
    attackTime: 0.75,
    decayTime: 2.2,
    sustainLevel: 0.0,
    releaseTime: 0.4,
    isSustained: false,
    curvePath: 'M 0 100 C 30 70, 50 20, 55 10 C 70 40, 85 70, 100 100',
  },
  6: {
    id: 6,
    name: 'Long Release (Damped)',
    category: 'Damped',
    description: 'Extended acoustic guitar/bell slow ringing tail',
    attackTime: 0.005,
    decayTime: 2.8,
    sustainLevel: 0.0,
    releaseTime: 0.4,
    isSustained: false,
    curvePath: 'M 0 100 L 4 10 C 30 40, 70 70, 100 100',
  },
  7: {
    id: 7,
    name: 'Long Release (Sustained)',
    category: 'Sustained',
    description: 'Full sustain with lush lingering release tail',
    attackTime: 0.005,
    decayTime: 0.0,
    sustainLevel: 1.0,
    releaseTime: 1.8,
    isSustained: true,
    curvePath: 'M 0 100 L 4 10 L 50 10 C 70 30, 90 70, 100 100',
  },
  8: {
    id: 8,
    name: 'Long Reverb',
    category: 'Sustained',
    description: 'Initial decay followed by persistent chamber tail',
    attackTime: 0.005,
    decayTime: 0.7,
    sustainLevel: 0.35,
    releaseTime: 2.2,
    isSustained: true,
    curvePath: 'M 0 100 L 3 10 C 15 50, 25 65, 50 65 C 75 75, 90 90, 100 100',
  },
  9: {
    id: 9,
    name: 'Tremolo I',
    category: 'Modulated',
    description: 'Fast 6.5Hz rhythmic amplitude flutter',
    attackTime: 0.02,
    decayTime: 0.0,
    sustainLevel: 0.85,
    releaseTime: 0.08,
    isSustained: true,
    tremoloRate: 6.5,
    tremoloDepth: 0.45,
    curvePath: 'M 0 100 L 4 20 Q 15 5, 25 30 T 45 30 T 65 30 T 85 30 L 100 100',
  },
  10: {
    id: 10,
    name: 'Tremolo II',
    category: 'Modulated',
    description: 'Slow 3.2Hz gentle pulsing modulation',
    attackTime: 0.02,
    decayTime: 0.0,
    sustainLevel: 0.85,
    releaseTime: 0.08,
    isSustained: true,
    tremoloRate: 3.2,
    tremoloDepth: 0.45,
    curvePath: 'M 0 100 L 4 20 Q 20 0, 40 40 T 80 40 L 100 100',
  },
  11: {
    id: 11,
    name: 'Slow Attack Damped',
    category: 'Damped',
    description: 'Gentle swell into decaying acoustic deterioration',
    attackTime: 0.35,
    decayTime: 2.4,
    sustainLevel: 0.0,
    releaseTime: 0.2,
    isSustained: false,
    curvePath: 'M 0 100 C 20 60, 35 15, 40 10 C 60 40, 80 75, 100 100',
  },
  12: {
    id: 12,
    name: 'Short Release (Sustained)',
    category: 'Sustained',
    description: 'Snappy clean cutoff without reverberation',
    attackTime: 0.005,
    decayTime: 0.0,
    sustainLevel: 1.0,
    releaseTime: 0.015,
    isSustained: true,
    curvePath: 'M 0 100 L 3 10 L 95 10 L 100 100',
  },
  13: {
    id: 13,
    name: 'Short Release (Damped)',
    category: 'Damped',
    description: 'Woodblock / percussive strike instant damping',
    attackTime: 0.002,
    decayTime: 0.2,
    sustainLevel: 0.0,
    releaseTime: 0.02,
    isSustained: false,
    curvePath: 'M 0 100 L 2 10 L 20 100 L 100 100',
  },
};

/**
 * Apply the exact SK-1 envelope curve to a Web Audio GainNode
 */
export function applySK1Envelope(
  gainParam: AudioParam,
  envelopeId: EnvelopeShapeId,
  startTime: number,
  gateDuration: number,
  velocity: number = 1.0
): number {
  const preset = SK1_ENVELOPE_PRESETS[envelopeId] || SK1_ENVELOPE_PRESETS[1];
  const peakGain = Math.max(0.001, velocity);

  gainParam.cancelScheduledValues(startTime);
  gainParam.setValueAtTime(0.0001, startTime);

  const attackEnd = startTime + preset.attackTime;
  gainParam.linearRampToValueAtTime(peakGain, attackEnd);

  let endTime: number;

  if (preset.isSustained) {
    const sustainLevel = Math.max(0.001, peakGain * preset.sustainLevel);
    if (preset.decayTime > 0) {
      const decayEnd = attackEnd + preset.decayTime;
      gainParam.exponentialRampToValueAtTime(sustainLevel, Math.min(decayEnd, startTime + gateDuration));
    } else {
      gainParam.setValueAtTime(sustainLevel, attackEnd);
    }

    const releaseStart = startTime + gateDuration;
    gainParam.setValueAtTime(sustainLevel, releaseStart);
    endTime = releaseStart + preset.releaseTime;
    gainParam.exponentialRampToValueAtTime(0.0001, endTime);
  } else {
    // Damped / non-sustained envelope
    const decayDuration = Math.min(preset.decayTime, gateDuration + preset.releaseTime);
    endTime = attackEnd + decayDuration;
    gainParam.exponentialRampToValueAtTime(0.0001, endTime);
  }

  return endTime;
}
