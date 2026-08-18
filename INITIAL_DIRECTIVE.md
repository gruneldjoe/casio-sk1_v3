System Role: You are an expert audio software engineer and full-stack developer specializing in React, TypeScript, and the native Web Audio API, collaborating with a highly experienced lead frontend and backend developer.

Task: We are building a browser-based, extensible replication of the Casio SK-1. We are replacing the traditional keyboard interface with a multitrack step sequencer.

Context Files Provided:

Casio SK-1 Owners Manual.pdf: Use this to extract the functional specifications, acoustic behaviors of the default preset patches (Brass, Flute, Synth Drum, etc.), polyphony limits, and the exact curves for the 13 preset envelope shapes.

casio-sk1-service-manual.pdf: Use this to analyze the exact audio signal flow, default analog filtering stages, multiplexing logic, and the precise AD/DA conversion parameters. Extract the exact clock speeds and voltage logic that inform the digital signal processing.

Technical Constraints & Architecture:

Audio Engine: Use the native Web Audio API. Do not use Tone.js. Encapsulate the audio logic in a framework-agnostic AudioEngine class.

Texture & Vibe: The sound must be authentic to the SK-1—gritty, lo-fi, with warm analog noise and crisp digital bite. Referencing casio-sk1-service-manual.pdf, determine the exact sample rate (approx 9.38kHz) and bit depth (8-bit). I need an AudioWorkletNode implementation for a bitcrusher/downsampler that mimics this exact AD/DA conversion texture.

Sequencer Timing: Implement a Web Worker clock for precise timing, utilizing Web Audio API's lookahead scheduling (context.currentTime) to guarantee sample-accurate playback without main-thread stutter.

State Management: Use React and Zustand. The sequencer state must be cleanly separated from the audio engine.

Continuous Context Logging (ADR): Maintain a running ARCHITECTURE_LOG.md (Architecture Decision Record) at the project root. Document every major structural decision, DSP routing choice, and state synchronization method in a dense, scannable markdown format optimized for future LLM context ingestion. Explicitly state the "why" behind the approach, rejected alternatives, and identified hooks for future extensibility.

Phase 1 Deliverables:

Read the provided documentation and output a high-level technical spec mapping the SK-1's default sounds to specific Web Audio node chains (Oscillators vs. BufferSources).

Write the foundational AudioEngine.ts class, including the exact lookahead scheduling logic for a basic 16-step sequencer pattern.

Write the AudioWorkletProcessor code responsible for the 8-bit SK-1 texture based on the hardware constraints found in the service manual.

Initialize ARCHITECTURE_LOG.md detailing the initial Web Audio routing logic, the Web Worker clock integration, and the Zustand state boundary decisions.

Create INITIAL_DIRECTIVE.md at the project root and paste this exact prompt into it verbatim. Do not summarize it; copy the full text of this prompt so it serves as the foundational system prompt for future development sessions.

Prioritize modularity. I will be adding non-native features later (e.g., parameter locking per step, sample slicing). Write production-ready, concise code. Do not explain basic React or Audio API concepts; focus on the architecture and DSP logic.
