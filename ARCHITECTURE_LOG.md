# Architecture Decision Record (ADR) — Casio SK-1 Step Sequencer

## Status
**Active / Phase 1 Complete**

---

## 1. Context & Architectural Overview
The objective is to create an authentic, browser-based, extensible software replica of the 1986 Casio SK-1 sampling keyboard, replacing the traditional physical keybed with a modern multitrack step sequencer while meticulously preserving the digital signal processing (DSP) parameters, circuit topology, and acoustic idiosyncrasies documented in the official *Casio SK-1 Operation Manual* and *Realistic Concertmate-500 / Casio SK-1 Service Manual*.

---

## 2. Hardware Analysis & DSP Specifications (from Service Manual)

### 2.1 Clock Speeds & Sampling Rate
- **Master Crystal**: 7.24 MHz crystal oscillator connected to LSI 1 (OKI MSM6283-01GS CPU).
- **Sampling Frequency**: 9.387 kHz (nominally 9.34 kHz – 9.387 kHz derived via internal 1/771 clock divider).
- **Sampling Bit-Depth**: 8-bit unsigned PCM linear quantization ($2^8 = 256$ discrete quantization steps).
- **DRAM Capacity**: Dual $\mu$PD4168C 64Kbit dynamic RAMs (128Kbit total). Sampling allocation is $108.544\text{ Kbit}$, yielding:
  $$\text{Max Duration} = \frac{108.544\text{ Kbit}}{8\text{ bits} \times 9.387\text{ kHz}} = 1.4454\text{ seconds} \approx 1.4\text{ s}$$
- **Input Threshold Trigger**: Sampling auto-trigger threshold at $\pm 0.315\text{V}$ ($2.5\text{V} \pm 0.315\text{V}$ around the virtual ground bias point).

### 2.2 Polyphony & Voice Allocation
- **Polyphony Cap**: Hard 4-note polyphonic voice allocation across channels (Melody, Obbligato, Chord, Bass) controlled by differential mixing transistors (T15/T16/T17) and an analog FET changeover switch (IC2 TC50H4066P).
- **Percussion Sound Generation**: Independent stepped DAC pulse output on CPU pin 97 (`SC`), routed through a discrete multi-stage analog percussion filter without robbing voice channels from the 4-voice polyphony limit.

### 2.3 Preset Tones & Synthesis Architectures
- **5 PCM Tones**: Piano, Brass Ensemble, Trumpet, Synth Drums, Human Voice (formant "la-la-la"). Modeled via 8-bit wavetables sample-rate reduced to 9.387 kHz.
- **3 Preset Harmonic Synthesis Tones**: Flute, Pipe Organ, Jazz Organ. Generated via additive harmonic synthesis.
- **Harmonic Synthesizer (Drawbar Engine)**: 9 footages (`16'`, `8'`, `5 1/3'`, `4'`, `2 2/3'`, `2'`, `1 3/5'`, `1 1/3'`, `1'`), each with 15 discrete levels ($0$ to $14$).
- **13 Envelope Shapes**: 
  1. *Damped Tone* (Piano/guitar exponential decay)
  2. *Organ with attack* (Fast percussive attack, sustained body)
  3. *Organ* (Instant gate on/off sustain)
  4. *Slow attack I* (Medium linear ramp attack)
  5. *Slow attack II* (Slow cello ramp attack, decaying tail)
  6. *Long release damped* (Extended slow release on release)
  7. *Long release sustained* (Held level followed by long release upon gate low)
  8. *Long reverb* (Dual-stage decay with lingering ambient tail)
  9. *Tremolo I* (6.5 Hz sinusoidal amplitude modulation)
  10. *Tremolo II* (3.2 Hz relaxed amplitude modulation)
  11. *Slow attack damped* (Swelling attack followed by slow deterioration)
  12. *Short release sustained* (Instant sustain, snappy gate cutoff)
  13. *Short release damped* (Woodblock / acoustic strike snappy damping)

---

## 3. Web Audio DSP Signal Flow & Routing

```
[Voice Source]
 (OscillatorNode / AudioBufferSourceNode)
      │
      ▼
[Voice Envelope GainNode] ── (Driven by 13 Envelope State Curves)
      │
      ▼
[Analog Filter Stage] ───── (BiquadFilter lowpass / bandpass Sallen-Key emulation)
      │
      ▼
[SK-1 Bitcrusher Worklet] ─ (Sample & hold downsampling to 9.387kHz + 8-bit truncation + analog DC offset)
      │
      ▼
[Master Mix & Tuning Bus] ─ (Detune +/-50 cents + Master Volume)
      │
      ▼
[Stereo / AudioContext Destination & AnalyserNode]
```

### 3.1 AudioWorklet Bitcrusher (`SK1BitcrusherProcessor`)
- **Decision**: Implemented as a custom `AudioWorkletProcessor` running on the audio rendering thread.
- **Why**: Standard ScriptProcessor is deprecated and executes on the main UI thread, causing glitching and stuttering under UI load. A native Web Audio worklet handles sample-and-hold decimation at $9387.5\text{ Hz}$ and 8-bit quantization ($256$ levels) with sub-sample phase tracking.
- **Analog Character**: Subtle pre-quantization analog noise and discrete non-linear transfer curve emulating the -5V VDAC reference and resistor ladder distortion.

### 3.2 Web Worker Precision Timing & Lookahead Scheduler
- **Decision**: Decouple sequencer ticks from `setInterval`/`requestAnimationFrame` by using a dedicated Web Worker timer paired with Chris Wilson's Web Audio lookahead scheduling pattern.
- **Why**: Background browser tabs throttle `setTimeout` down to 1000ms. A Web Worker in an independent execution context guarantees uninterrupted 25ms timer ticks.
- **Scheduling Parameters**:
  - Worker Tick Interval: $25\text{ ms}$
  - Lookahead Window: $100\text{ ms}$ (`context.currentTime + 0.1`)
  - Jitter Tolerance: Zero phase drift; note trigger events scheduled strictly into Web Audio parameter automation queues (`setValueAtTime`, `linearRampToValueAtTime`).

---

## 4. State Management & Architectural Boundaries

### 4.1 Zustand State Separation
- **Sequencer State** (`useSequencerStore`):
  - Track patterns, 16-step grids, active notes, octaves, velocities, gate lengths, mutes/solos.
  - Active preset selection (PCM tone, Harmonic Synth drawbars, Envelope shape, Vibrato, Portamento, Tempo, Swing).
  - Sampling state (recording status, recorded buffer, loop flags).
- **Audio Engine** (`AudioEngine.ts`):
  - Pure framework-agnostic TypeScript class.
  - Holds `AudioContext`, `AudioWorkletNode`, active voice pool, drum sample triggers, and lookahead queue.
  - Exposes imperative methods: `triggerNote()`, `releaseNote()`, `triggerDrum()`, `startSequencer()`, `stopSequencer()`, `startSampling()`, `stopSampling()`.
- **Synchronization**:
  - The AudioEngine subscribes to store updates when tempo, swing, or track parameters change.
  - The UI consumes Zustand state via optimized selector hooks without triggering unnecessary audio node teardowns.

---

## 5. Extensibility Hooks for Future Phases
1. **Per-Step Parameter Locking**: Step data schema (`StepData`) contains optional overrides for `envelopeIndex`, `cutoff`, `pitchOffset`, `pan`, and `sampleSlice`.
2. **Sample Slicing & Chromatic Mapping**: Sample buffer is stored as raw `Float32Array` with metadata for start offset, end offset, loop points, and root frequency ($442\text{ Hz}$ default).
3. **Pattern Chaining & Song Mode**: Multi-pattern storage architecture (`patterns: Record<string, Pattern>`) ready for pattern switching and song progression triggers.
4. **MIDI Input / Output**: Web MIDI API hook points in `AudioEngine` allowing external hardware controllers to drive the 4-voice polyphonic engine.

---

## 6. Casper Electronics Virtual Patchbay

### 6.1 Hardware Topology & Circuit Bending Origins
The Casio SK-1's architecture separates the CPU (OKI MSM6283-01GS), the ROM (NEC $\mu$PD23C246EAC containing 8-bit PCM lookup tables), dynamic RAM ($\mu$PD4168C for user samples), and 8-bit DAC/demux stage. Casper Electronics pioneered non-destructive and destructive patchbay circuit bending on this hardware by shorting:
1. **Bidirectional Data Lines ($D_0 \dots D_7$)**: Intercepting 8-bit sample bytes in transit between ROM/RAM and the CPU DAC.
2. **Address Bus Lines ($A_0 \dots A_{15}$)**: Forcing nonlinear memory lookup offsets and memory bank jumping.
3. **The "Aleatron" Address Latch**: Gating clock divider signals against address lines (notably $A_9$, CPU Pin 44) to freeze read-pointers in micro-loops.
4. **Channel Summing Resistors**: Bridging mixing points for CH1 (Melody / R98), CH2 (Obbligato / R47), CH3 (Chord / R81), CH4 (Bass / R64), and Pin 97 Percussion (`SC`).
5. **Pitch Clock Starvation**: Modulating the 7.24 MHz master quartz crystal reference via variable resistance/LTC1799 oscillators.

### 6.2 Mathematical Translation to Web Audio DSP

| Physical Hardware Short | Hardware Pin Mapping | Mathematical DSP Translation | Acoustic Outcome |
| :--- | :--- | :--- | :--- |
| **RAM Short A** | RAM Pin 11 ($IO_0$) $\leftrightarrow$ Pin 14 ($IO_3$) | `byte = byte ^ 0x09` | Gritty metallic ring modulation & overtone hash without system crash |
| **RAM Short B** | RAM Pin 15 ($IO_4$) $\leftrightarrow$ Pin 18 ($IO_7$) | `byte = byte ^ 0x90` | Severe upper-nibble bit-flipping, square wave fuzz, phase-wrapping |
| **Data Line Invert** | CPU Pins 32–39 ($D_0 \dots D_7$) $\leftrightarrow$ $V_{DD}$ | `byte = byte ^ 0xFF` | Polarity inversion, extreme harsh digital distortion |
| **Data Line Drop (LSB)** | RAM $IO_0 \dots IO_3 \leftrightarrow \text{GND}$ | `byte = byte & 0xF0` | 4-bit staircase quantization, vintage lo-fi crunch |
| **Aleatron Glitch** | CPU Pin 44 ($A_9$) $\leftrightarrow$ Clock Divider $Q_3$ | $\text{ptr} = (\text{readPtr} - W + (\text{phase} \bmod W)) \ \& \ 1023$ ($W \in [16, 512]$) | Rhythmic granular freeze, stuttering micro-loop bursts |
| **Address Bus Scramble** | RAM Pin 4 ($A_4$) $\leftrightarrow$ Pin 23 ($A_{11}$) | $\text{addr} = \text{readPtr} \oplus 0\text{x}0810$ | Octave transposition jumps, reversed granular slices |
| **Pitch Clock Starve** | 7.24MHz Quartz $\leftrightarrow$ Starve Pot | $f_{\text{target}} = 9387.5 \times \text{sagFactor}$ ($\text{sagFactor} \in [0.1, 1.0]$) | Severe downward pitch droop, extreme Nyquist foldover aliasing |
| **Channel Cross-Talk** | Resistor R98 (CH1) $\leftrightarrow$ R47 (CH2) $\leftrightarrow$ Pin 97 | $y_{\text{ch1}} = \frac{x_{\text{ch1}} + \alpha \tanh(1.5 x_{\text{ch2}})}{1 + 0.5 \alpha}$ | Percussion transient bleed into melody filter stage |
| **Feedback Screamer** | DAC Output (Pin 89) $\leftrightarrow$ Sallen-Key Input | `byte = ((byte ^ 0x04) | 0x02)` + non-linear feedback | Resonant high-gain scream and self-oscillation |

### 6.3 AudioWorklet Implementation Architecture
The `SK1BitcrusherProcessor` integrates continuous $k$-rate automation parameters for `dataXorMask`, `dataAndMask`, `dataOrMask`, and `stutterWindow`. Samples are converted to unsigned 8-bit bytes ($[0, 255]$), transformed via bitwise operations in single-cycle integer arithmetic, and reconstituted into normalized $[-1.0, 1.0]$ floating point signals prior to 2SC1740 analog non-linear soft-clipping modeling.
