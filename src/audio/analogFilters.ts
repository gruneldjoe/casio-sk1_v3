/**
 * Analog filter topologies extracted from Casio SK-1 / Concertmate-500 Service Manual.
 * Emulates the TC50H4066P analog switch and discrete transistor filtering stages (T10, T11, T12-T20).
 */

export interface FilterProfile {
  name: string;
  type: BiquadFilterType;
  frequency: number;
  q: number;
  gain?: number;
}

export const SK1_FILTER_PROFILES: Record<'melody' | 'bass' | 'chord' | 'percussion', FilterProfile[]> = {
  melody: [
    { name: 'Melody Lowpass (Sallen-Key)', type: 'lowpass', frequency: 3800, q: 0.85 },
    { name: 'RC High Cut Anti-Imaging', type: 'lowpass', frequency: 4600, q: 0.5 },
  ],
  bass: [
    { name: 'Bass Lowpass', type: 'lowpass', frequency: 480, q: 1.2 },
    { name: 'Bass Resonant Peak', type: 'peaking', frequency: 120, q: 1.4, gain: 4.5 },
  ],
  chord: [
    { name: 'Chord Band Lowpass', type: 'lowpass', frequency: 2200, q: 0.7 },
  ],
  percussion: [
    { name: 'Percussion Shaper', type: 'lowpass', frequency: 4200, q: 0.9 },
    { name: 'Percussion Body Punch', type: 'peaking', frequency: 180, q: 1.5, gain: 3.5 },
  ],
};
