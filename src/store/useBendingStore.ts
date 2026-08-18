import { create } from 'zustand';
import { BendConfiguration, BendTargetId, PatchbayMatrixConnection } from '../types';

export interface BendingState {
  bends: Record<BendTargetId, BendConfiguration>;
  matrixConnections: PatchbayMatrixConnection[];
  masterBendingActive: boolean;
  activeMomentaryBends: Set<BendTargetId>;

  // Actions
  toggleBend: (id: BendTargetId, enabled?: boolean) => void;
  setBendIntensity: (id: BendTargetId, intensity: number) => void;
  setBendParameter: (id: BendTargetId, params: Partial<BendConfiguration>) => void;
  triggerMomentaryBend: (id: BendTargetId, durationMs?: number) => void;
  toggleMatrixNode: (sourcePin: string, targetPin: string) => void;
  setMasterBendingActive: (active: boolean) => void;
  resetAllBends: () => void;
  applyBendPreset: (preset: 'clean' | 'subtle_lofi' | 'aleatron_frenzy' | 'ram_meltdown' | 'cybernetic_crush') => void;

  // Real-time DSP Helper Evaluators
  getComputedDataBitmasks: () => { xorMask: number; andMask: number; orMask: number };
  getComputedAddressMask: () => number;
  getComputedStutterWindow: () => number;
  getComputedClockSag: () => number;
  getComputedCrossTalk: () => number;
}

export const CASPER_BEND_DEFINITIONS: Record<BendTargetId, BendConfiguration> = {
  ram_short_a: {
    id: 'ram_short_a',
    name: 'RAM Short A (D0 ↔ D3)',
    hardwarePinMapping: 'RAM Pin 11 (IO0) ↔ Pin 14 (IO3)',
    description: 'Shorts lower data lines, producing metallic harmonic overtones and ring-mod grit without total system crash.',
    enabled: false,
    intensity: 0.8,
    momentary: false,
    dataXorMask: 0x09, // Bits 0 and 3 flipped
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
  ram_short_b: {
    id: 'ram_short_b',
    name: 'RAM Short B (D4 ↔ D7)',
    hardwarePinMapping: 'RAM Pin 15 (IO4) ↔ Pin 18 (IO7)',
    description: 'Shorts upper nibble data lines, causing high-magnitude phase-wrapping, bit-reversal fuzz, and heavy square waves.',
    enabled: false,
    intensity: 0.9,
    momentary: false,
    dataXorMask: 0x90, // Bits 4 and 7 flipped
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
  aleatron_glitch: {
    id: 'aleatron_glitch',
    name: 'Aleatron Glitch',
    hardwarePinMapping: 'CPU Pin 44 (A9) ↔ Clock Divider Q3',
    description: 'Mimics the legendary Casper Aleatron mod: latches the address bus to create rhythmic micro-loop stuttering and time-freeze.',
    enabled: false,
    intensity: 0.75,
    momentary: false,
    dataXorMask: 0x00,
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0200, // Address line 9 toggle
    stutterWindow: 64, // 64-sample granular repeat buffer
    clockSagFactor: 1.0,
  },
  address_bus_scramble: {
    id: 'address_bus_scramble',
    name: 'Address Bus Scramble (A4 ↔ A11)',
    hardwarePinMapping: 'RAM Pin 4 (A4) ↔ Pin 23 (A11)',
    description: 'Swaps address memory lookup pointers, generating wild octave-transposition jumps and reversed granular slices.',
    enabled: false,
    intensity: 0.85,
    momentary: false,
    dataXorMask: 0x00,
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0810, // A4 (0x10) and A11 (0x800)
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
  data_line_flip: {
    id: 'data_line_flip',
    name: 'Data Line Invert (D0–D7 ↔ VDD)',
    hardwarePinMapping: 'CPU Data Bus (Pins 32–39) ↔ VDD Pull-up',
    description: 'Inverts full 8-bit byte stream, creating harsh polarity reflection and intense fuzz distortion.',
    enabled: false,
    intensity: 1.0,
    momentary: false,
    dataXorMask: 0xff, // Invert all 8 bits
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
  data_line_drop: {
    id: 'data_line_drop',
    name: 'Data Line Drop (LSB Disconnect)',
    hardwarePinMapping: 'RAM IO0–IO3 ↔ GND Pull-down',
    description: 'Forces lower 4 bits to zero, reducing resolution to severe 4-bit stepped staircase quantization.',
    enabled: false,
    intensity: 0.9,
    momentary: false,
    dataXorMask: 0x00,
    dataAndMask: 0xf0, // Discard lower 4 bits
    dataOrMask: 0x00,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
  clock_starve: {
    id: 'clock_starve',
    name: 'Pitch Clock Starve / Sag',
    hardwarePinMapping: '7.24MHz Crystal ↔ LTC1799 VDD Starve Pot',
    description: 'Starves the master CPU clock, decelerating sampling clock to 1.8kHz for massive downsample aliasing and frequency droop.',
    enabled: false,
    intensity: 0.7,
    momentary: false,
    dataXorMask: 0x00,
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 0.25, // Drops 9387Hz down to ~2346Hz
  },
  channel_crosstalk: {
    id: 'channel_crosstalk',
    name: 'Channel Cross-Talk (R98 ↔ R47 ↔ Pin 97)',
    hardwarePinMapping: 'Resistors R98 (CH1) ↔ R47 (CH2) ↔ R81 (CH3)',
    description: 'Bridges summing resistors between melody and percussion, injecting drum transients into the synth filter.',
    enabled: false,
    intensity: 0.65,
    momentary: false,
    dataXorMask: 0x00,
    dataAndMask: 0xff,
    dataOrMask: 0x00,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
  feedback_screamer: {
    id: 'feedback_screamer',
    name: 'Resistor Ladder Feedback Screamer',
    hardwarePinMapping: 'DAC Output (Pin 89) ↔ Pre-Filter Input',
    description: 'Routes raw DAC staircase current back into the Sallen-Key filter input for self-oscillating resonant shrieks.',
    enabled: false,
    intensity: 0.8,
    momentary: false,
    dataXorMask: 0x04,
    dataAndMask: 0xff,
    dataOrMask: 0x02,
    addressXorMask: 0x0000,
    stutterWindow: 0,
    clockSagFactor: 1.0,
  },
};

const INITIAL_PATCHBAY_CONNECTIONS: PatchbayMatrixConnection[] = [
  { sourcePin: 'RAM_IO0', targetPin: 'RAM_IO3', resistance: 0, active: false, bendId: 'ram_short_a' },
  { sourcePin: 'RAM_IO4', targetPin: 'RAM_IO7', resistance: 0, active: false, bendId: 'ram_short_b' },
  { sourcePin: 'CPU_A9', targetPin: 'CLK_DIV', resistance: 0, active: false, bendId: 'aleatron_glitch' },
  { sourcePin: 'RAM_A4', targetPin: 'RAM_A11', resistance: 0, active: false, bendId: 'address_bus_scramble' },
  { sourcePin: 'DATA_BUS', targetPin: 'VDD_RAIL', resistance: 0, active: false, bendId: 'data_line_flip' },
  { sourcePin: 'DATA_LSB', targetPin: 'GND_RAIL', resistance: 0, active: false, bendId: 'data_line_drop' },
  { sourcePin: 'XTAL_7M', targetPin: 'VAR_POT', resistance: 500, active: false, bendId: 'clock_starve' },
  { sourcePin: 'RES_R98', targetPin: 'RES_R47', resistance: 0, active: false, bendId: 'channel_crosstalk' },
  { sourcePin: 'DAC_OUT', targetPin: 'FILTER_IN', resistance: 100, active: false, bendId: 'feedback_screamer' },
];

export const useBendingStore = create<BendingState>((set, get) => ({
  bends: { ...CASPER_BEND_DEFINITIONS },
  matrixConnections: INITIAL_PATCHBAY_CONNECTIONS,
  masterBendingActive: true,
  activeMomentaryBends: new Set<BendTargetId>(),

  toggleBend: (id, enabled) => {
    set((state) => {
      const current = state.bends[id];
      const nextEnabled = enabled !== undefined ? enabled : !current.enabled;
      return {
        bends: {
          ...state.bends,
          [id]: {
            ...current,
            enabled: nextEnabled,
          },
        },
      };
    });
  },

  setBendIntensity: (id, intensity) => {
    set((state) => ({
      bends: {
        ...state.bends,
        [id]: {
          ...state.bends[id],
          intensity: Math.max(0, Math.min(1, intensity)),
        },
      },
    }));
  },

  setBendParameter: (id, params) => {
    set((state) => ({
      bends: {
        ...state.bends,
        [id]: {
          ...state.bends[id],
          ...params,
        },
      },
    }));
  },

  triggerMomentaryBend: (id, durationMs = 200) => {
    set((state) => {
      const updated = new Set(state.activeMomentaryBends);
      updated.add(id);
      return { activeMomentaryBends: updated };
    });

    setTimeout(() => {
      set((state) => {
        const updated = new Set(state.activeMomentaryBends);
        updated.delete(id);
        return { activeMomentaryBends: updated };
      });
    }, durationMs);
  },

  toggleMatrixNode: (sourcePin, targetPin) => {
    set((state) => {
      const nextConnections = state.matrixConnections.map((conn) => {
        if (conn.sourcePin === sourcePin && conn.targetPin === targetPin) {
          const nextActive = !conn.active;
          // Synchronize with target bend
          const bend = state.bends[conn.bendId];
          if (bend) {
            bend.enabled = nextActive;
          }
          return { ...conn, active: nextActive };
        }
        return conn;
      });
      return { matrixConnections: nextConnections };
    });
  },

  setMasterBendingActive: (active) => {
    set({ masterBendingActive: active });
  },

  resetAllBends: () => {
    set((state) => {
      const resetBends = { ...state.bends };
      Object.keys(resetBends).forEach((k) => {
        const key = k as BendTargetId;
        resetBends[key] = { ...resetBends[key], enabled: false, momentary: false };
      });

      const resetConns = state.matrixConnections.map((c) => ({ ...c, active: false }));

      return {
        bends: resetBends,
        matrixConnections: resetConns,
        activeMomentaryBends: new Set<BendTargetId>(),
      };
    });
  },

  applyBendPreset: (preset) => {
    const { resetAllBends } = get();
    resetAllBends();

    set((state) => {
      const newBends = { ...state.bends };
      if (preset === 'subtle_lofi') {
        newBends.ram_short_a.enabled = true;
        newBends.ram_short_a.intensity = 0.4;
      } else if (preset === 'aleatron_frenzy') {
        newBends.aleatron_glitch.enabled = true;
        newBends.aleatron_glitch.intensity = 0.85;
        newBends.address_bus_scramble.enabled = true;
        newBends.address_bus_scramble.intensity = 0.6;
      } else if (preset === 'ram_meltdown') {
        newBends.ram_short_a.enabled = true;
        newBends.ram_short_b.enabled = true;
        newBends.data_line_flip.enabled = true;
      } else if (preset === 'cybernetic_crush') {
        newBends.data_line_drop.enabled = true;
        newBends.clock_starve.enabled = true;
        newBends.clock_starve.intensity = 0.8;
      }

      return { bends: newBends };
    });
  },

  getComputedDataBitmasks: () => {
    const { bends, masterBendingActive, activeMomentaryBends } = get();
    if (!masterBendingActive) {
      return { xorMask: 0x00, andMask: 0xff, orMask: 0x00 };
    }

    let xorMask = 0x00;
    let andMask = 0xff;
    let orMask = 0x00;

    for (const bend of Object.values(bends)) {
      const isActive = bend.enabled || activeMomentaryBends.has(bend.id);
      if (isActive && bend.intensity > 0) {
        if (bend.dataXorMask !== 0x00) {
          xorMask ^= Math.floor(bend.dataXorMask * bend.intensity);
        }
        if (bend.dataAndMask !== 0xff) {
          andMask &= bend.dataAndMask;
        }
        if (bend.dataOrMask !== 0x00) {
          orMask |= Math.floor(bend.dataOrMask * bend.intensity);
        }
      }
    }

    return {
      xorMask: xorMask & 0xff,
      andMask: andMask & 0xff,
      orMask: orMask & 0xff,
    };
  },

  getComputedAddressMask: () => {
    const { bends, masterBendingActive, activeMomentaryBends } = get();
    if (!masterBendingActive) return 0x0000;

    let mask = 0x0000;
    for (const bend of Object.values(bends)) {
      const isActive = bend.enabled || activeMomentaryBends.has(bend.id);
      if (isActive && bend.addressXorMask !== 0x0000) {
        mask ^= bend.addressXorMask;
      }
    }
    return mask & 0xffff;
  },

  getComputedStutterWindow: () => {
    const { bends, masterBendingActive, activeMomentaryBends } = get();
    if (!masterBendingActive) return 0;

    const aleatron = bends.aleatron_glitch;
    const isActive = aleatron.enabled || activeMomentaryBends.has('aleatron_glitch');
    if (isActive) {
      return aleatron.stutterWindow || 64;
    }
    return 0;
  },

  getComputedClockSag: () => {
    const { bends, masterBendingActive, activeMomentaryBends } = get();
    if (!masterBendingActive) return 1.0;

    const starve = bends.clock_starve;
    const isActive = starve.enabled || activeMomentaryBends.has('clock_starve');
    if (isActive) {
      return Math.max(0.1, 1.0 - starve.intensity * (1.0 - starve.clockSagFactor));
    }
    return 1.0;
  },

  getComputedCrossTalk: () => {
    const { bends, masterBendingActive, activeMomentaryBends } = get();
    if (!masterBendingActive) return 0.0;

    const xtalk = bends.channel_crosstalk;
    const isActive = xtalk.enabled || activeMomentaryBends.has('channel_crosstalk');
    if (isActive) {
      return xtalk.intensity * 0.5;
    }
    return 0.0;
  },
}));
