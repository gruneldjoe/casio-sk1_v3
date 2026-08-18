Casio SK-1 Multitrack Step Sequencer (Phase 1)
I have completed the foundational architecture and implementation for the Casio SK-1 browser replica, replacing the traditional keyboard interface with a multitrack step sequencer driven by the native Web Audio API and Web Workers.
1. High-Level Technical Spec: SK-1 Sound Mapping to Web Audio Chains
Based on the Casio SK-1 Operation Manual and Realistic Concertmate-500 / Casio SK-1 Service Manual, here is the architectural signal flow mapping for all default patches and hardware stages:
code
Code
┌────────────────────────────────────────┐
                  │              Voice Source              │
                  │  (AudioBufferSourceNode / Oscillator)  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         13-Envelope GainNode           │
                  │   (Driven by Envelope State Curves)    │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Analog Filter Stage (Biquad)     │
                  │ (Melody 3.8kHz, Bass 480Hz, Perc 4.2kHz│
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │      SK-1 Bitcrusher AudioWorklet      │
                  │  (9.387kHz Sample & Hold + 8-bit DAC)  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Master Gain & AnalyserNode       │
                  │    (Oscilloscope + ±50¢ Detuning)      │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Audio Destination (Output)       │
                  └────────────────────────────────────────┘
Sound Generation Methods
SK-1 Tone / Voice	Source Type	Node Implementation	Filter Stage & Routing
Piano	8-Bit PCM	AudioBufferSourceNode (Looped 8-bit multi-cycle wave @ 9.387 kHz)	Sallen-Key Lowpass (
) 
 Bitcrusher
Brass Ensemble	8-Bit PCM	AudioBufferSourceNode (Multi-saw detuned wavetable @ 9.387 kHz)	Sallen-Key Lowpass (
) 
 Bitcrusher
Trumpet	8-Bit PCM	AudioBufferSourceNode (Bright odd/even harmonic wavetable)	Sallen-Key Lowpass (
) 
 Bitcrusher
Synth Drums	8-Bit PCM	AudioBufferSourceNode (Pitch-swept 80s zap wavetable)	Sallen-Key Lowpass (
) 
 Bitcrusher
Human Voice	8-Bit PCM	AudioBufferSourceNode (Lo-fi choir formants @ 800Hz / 1.2kHz / 2.4kHz)	Sallen-Key Lowpass (
) 
 Bitcrusher
Flute	Harmonic Synth	AudioBufferSourceNode (Drawbar additive wave: 
)	Melody Filter 
 Bitcrusher
Pipe Organ	Harmonic Synth	AudioBufferSourceNode (Drawbar additive wave: 
)	Melody Filter 
 Bitcrusher
Jazz Organ	Harmonic Synth	AudioBufferSourceNode (Drawbar additive wave: 
)	Melody Filter 
 Bitcrusher
User Harmonic Synth	Harmonic Synth	AudioBufferSourceNode (Real-time summed 9 footages: 
 to 
, 
 levels)	Melody Filter 
 Bitcrusher
Sampler (RAM)	8-Bit PCM	AudioBufferSourceNode (
 DRAM @ 9.387 kHz, max 
)	Melody Filter 
 Bitcrusher
Drums (Kick/Snare/Hats/Bongo)	8-Bit PCM	AudioBufferSourceNode (ROM samples from CPU Pin 97 SC)	Percussion Filter (
 lowpass + 
 bump) 
 Bitcrusher
2. Core Modules Implementeds
INITIAL_DIRECTIVE.md: Created at the project root containing the prompt verbatim to serve as the foundational specification for future development sessions.
ARCHITECTURE_LOG.md: Initialized with deep structural rationale, DSP specifications from the service manual (7.24 MHz crystal, 9.387 kHz sample rate, 4-voice polyphony limit, 
 auto-trigger threshold), and extensibility hooks.
src/audio/worklets/sk1-bitcrusher.ts: High-performance AudioWorkletProcessor executing sample-and-hold downsampling to 
 and 8-bit linear quantization with analog thermal noise and DC offset modeling.
src/audio/workers/clockWorker.ts: Web Worker clock emitting uninterrupted 25ms timer ticks regardless of main-thread UI load or browser tab backgrounding.
src/audio/envelopes.ts: Meticulous mathematical curves and Web Audio gain scheduling for all 13 Casio SK-1 Envelope Presets (Damped, Sustained, and Modulated Tremolo shapes).
src/audio/harmonicSynth.ts: Additive synthesis engine supporting all 9 drawbar footages (
, 
, 
, 
, 
, 
, 
, 
, 
) with 
 level controls and manual preset combinations (Clarinet, Oboe, Violin, Harpsichord, Toy Piano).
src/audio/AudioEngine.ts: Framework-agnostic master audio class providing 4-voice polyphonic allocation with intelligent voice stealing, lookahead step scheduling (
 horizon), vibrato/portamento, drum routing, live microphone sampling (
 @ 
), and real-time spectrum analysis.
src/store/useSequencerStore.ts: Zustand state store isolating sequencer patterns, track configurations, parameter locks, and hardware mode toggles.
UI Components:
SK1Header: Vintage 1980s Casio industrial design with master volume, 
 fine-tuning, 8-bit DAC bypass switch, vibrato/portamento toggles, and real-time phosphor cathode oscilloscope.
ToneSelectorBar: 10 tactile preset push buttons with active red LED status indicators.
StepSequencer: 16-step multitrack sequencer with step buttons, velocity/gate controls, octave selectors, mute/solo, and parameter-lock step inspector.
HarmonicSynthesizerPanel: 9 interactive drawbar sliders and live audition keybed.
EnvelopeSelectorPanel: Visual vector curve gallery for all 13 envelopes.
SamplingStudio: Live microphone recording with auto-trigger VU threshold meter, waveform viewer, and chromatic keybed.
DrumMachinePanel: 6 percussion pads with 11 authentic auto-rhythm generators (Disco, Rock, Samba, Bossa Nova, etc.) and fill-in grace triggers.