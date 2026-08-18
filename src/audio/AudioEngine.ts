import {
  AudioEngineStatus,
  DrumSoundId,
  EnvelopeShapeId,
  HarmonicLevels,
  Pattern,
  PresetToneId,
  SampleData,
} from '../types';
import { applySK1Envelope, SK1_ENVELOPE_PRESETS } from './envelopes';
import { DEFAULT_HARMONIC_LEVELS, generateHarmonicWaveBuffer } from './harmonicSynth';
import { generateDrumBuffer, generatePCMWavetable } from './pcmData';
import { createClockWorker } from './workers/clockWorker';
import { SK1_BITCRUSHER_PROCESSOR_NAME, sk1BitcrusherWorkletCode } from './worklets/sk1-bitcrusher';

export interface VoiceNode {
  id: string;
  midiNote: number;
  startTime: number;
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  vibratoOsc?: OscillatorNode;
  vibratoGain?: GainNode;
  isReleased: boolean;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tuningParam: number = 0; // -50 to +50 cents
  private bitcrusherNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Filter buses
  private melodyFilter: BiquadFilterNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private percussionFilter: BiquadFilterNode | null = null;

  // Voice management (4-voice polyphony limit like SK-1)
  private activeVoices: Map<string, VoiceNode> = new Map();
  private maxPolyphony: number = 4;

  // Sample cache
  private pcmWaveBuffers: Map<PresetToneId, AudioBuffer> = new Map();
  private drumBuffers: Map<DrumSoundId, AudioBuffer> = new Map();
  private harmonicBuffer: AudioBuffer | null = null;
  private userSampleBuffer: AudioBuffer | null = null;

  // Sequencer & Lookahead Scheduler
  private clockWorker: Worker | null = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private bpm: number = 110;
  private swingAmount: number = 0; // 0 to 0.6
  private currentPattern: Pattern | null = null;
  private lookaheadMs: number = 100; // Schedule ahead by 100ms
  private scheduleIntervalMs: number = 25; // Worker tick interval

  // Sampling system
  private mediaStream: MediaStream | null = null;
  private sampleRecorderNode: ScriptProcessorNode | null = null;
  private isSampling: boolean = false;
  private sampleRecordingBuffer: Float32Array | null = null;
  private sampleRecordIndex: number = 0;
  private sampleTriggered: boolean = false;
  private autoTriggerThreshold: number = 0.08; // ~0.315V equivalent
  private onSamplingProgress?: (level: number, progress: number) => void;
  private onSamplingComplete?: (sample: SampleData) => void;

  // Global settings
  private vibratoActive: boolean = false;
  private portamentoActive: boolean = false;
  private portamentoTime: number = 0.06; // 60ms glide
  private lastMidiNote: number = 69;
  private harmonicLevels: HarmonicLevels = { ...DEFAULT_HARMONIC_LEVELS };

  // Callbacks
  private onStepChange?: (step: number) => void;

  constructor() {
    // Lazy audio context initialization on user interaction
  }

  public async initialize(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create Master Gain and Analyser
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Build Analog Filters according to Service Manual schematic
    this.melodyFilter = this.ctx.createBiquadFilter();
    this.melodyFilter.type = 'lowpass';
    this.melodyFilter.frequency.setValueAtTime(3800, this.ctx.currentTime);
    this.melodyFilter.Q.setValueAtTime(0.85, this.ctx.currentTime);

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.setValueAtTime(520, this.ctx.currentTime);
    this.bassFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.percussionFilter = this.ctx.createBiquadFilter();
    this.percussionFilter.type = 'lowpass';
    this.percussionFilter.frequency.setValueAtTime(4200, this.ctx.currentTime);
    this.percussionFilter.Q.setValueAtTime(0.9, this.ctx.currentTime);

    // Initialize Bitcrusher AudioWorklet
    try {
      const blob = new Blob([sk1BitcrusherWorkletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await this.ctx.audioWorklet.addModule(workletUrl);

      this.bitcrusherNode = new AudioWorkletNode(this.ctx, SK1_BITCRUSHER_PROCESSOR_NAME, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        parameterData: {
          targetSampleRate: 9387.5,
          bitDepth: 8,
          analogWarmth: 0.15,
          active: 1,
        },
      });

      // Route: Filters -> Bitcrusher -> Master -> Analyser -> Output
      this.melodyFilter.connect(this.bitcrusherNode);
      this.bassFilter.connect(this.bitcrusherNode);
      this.percussionFilter.connect(this.bitcrusherNode);

      this.bitcrusherNode.connect(this.masterGain);
    } catch (err) {
      console.warn('AudioWorklet could not be loaded, using fallback routing', err);
      this.melodyFilter.connect(this.masterGain);
      this.bassFilter.connect(this.masterGain);
      this.percussionFilter.connect(this.masterGain);
    }

    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    // Pre-cache PCM wavetables & drum buffers
    this.generateAllPresetBuffers();

    // Initialize Web Worker Clock
    this.clockWorker = createClockWorker();
    this.clockWorker.onmessage = (e) => {
      if (e.data && e.data.type === 'tick') {
        this.onWorkerTick();
      }
    };
  }

  private generateAllPresetBuffers(): void {
    if (!this.ctx) return;
    const presets: PresetToneId[] = [
      'piano',
      'brass',
      'trumpet',
      'synth_drums',
      'human_voice',
      'flute',
      'pipe_organ',
      'jazz_organ',
    ];
    presets.forEach((p) => {
      this.pcmWaveBuffers.set(p, generatePCMWavetable(p, this.ctx!));
    });

    const drums: DrumSoundId[] = [
      'kick',
      'snare',
      'hihat_closed',
      'hihat_open',
      'bongo_high',
      'bongo_low',
    ];
    drums.forEach((d) => {
      this.drumBuffers.set(d, generateDrumBuffer(d, this.ctx!));
    });

    this.updateHarmonicBuffer(this.harmonicLevels);
  }

  public updateHarmonicBuffer(levels: HarmonicLevels): void {
    if (!this.ctx) return;
    this.harmonicLevels = { ...levels };
    this.harmonicBuffer = generateHarmonicWaveBuffer(levels, this.ctx);
  }

  // --- Voice Triggering & Polyphony ---

  public triggerNote(
    trackId: string,
    tone: PresetToneId,
    envelopeId: EnvelopeShapeId,
    midiNote: number,
    velocity: number = 1.0,
    gateDuration: number = 0.3,
    filterType: 'melody' | 'bass' = 'melody',
    scheduledTime?: number
  ): string {
    if (!this.ctx) return '';
    const now = scheduledTime !== undefined ? scheduledTime : this.ctx.currentTime;

    // Enforce 4-voice polyphony with intelligent voice stealing
    if (this.activeVoices.size >= this.maxPolyphony) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, voice] of this.activeVoices.entries()) {
        if (voice.startTime < oldestTime) {
          oldestTime = voice.startTime;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.stopVoice(oldestKey, now);
      }
    }

    let buffer: AudioBuffer | undefined;
    let isLooped = true;

    if (tone === 'harmonic_synth') {
      if (!this.harmonicBuffer) this.updateHarmonicBuffer(this.harmonicLevels);
      buffer = this.harmonicBuffer || undefined;
    } else if (tone === 'sampled_sound') {
      buffer = this.userSampleBuffer || this.pcmWaveBuffers.get('piano');
      isLooped = false; // Sample playback
    } else {
      buffer = this.pcmWaveBuffers.get(tone) || this.pcmWaveBuffers.get('piano');
    }

    if (!buffer) return '';

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = isLooped;

    // Calculate playbackRate: A4 (midi 69) = 1.0
    const semitoneRatio = Math.pow(2, (midiNote - 69 + this.tuningParam / 100) / 12);

    if (this.portamentoActive && this.lastMidiNote !== midiNote) {
      const prevRatio = Math.pow(2, (this.lastMidiNote - 69) / 12);
      source.playbackRate.setValueAtTime(prevRatio, now);
      source.playbackRate.exponentialRampToValueAtTime(semitoneRatio, now + this.portamentoTime);
    } else {
      source.playbackRate.setValueAtTime(semitoneRatio, now);
    }
    this.lastMidiNote = midiNote;

    const voiceGain = this.ctx.createGain();
    const voiceFilter = this.ctx.createBiquadFilter();
    voiceFilter.type = 'lowpass';
    voiceFilter.frequency.setValueAtTime(filterType === 'bass' ? 650 : 4500, now);

    // Apply 13 Envelope shape
    const endTime = applySK1Envelope(voiceGain.gain, envelopeId, now, gateDuration, velocity);

    // Vibrato LFO if active
    let vibratoOsc: OscillatorNode | undefined;
    let vibratoGain: GainNode | undefined;
    if (this.vibratoActive) {
      vibratoOsc = this.ctx.createOscillator();
      vibratoOsc.frequency.setValueAtTime(6.0, now); // 6Hz SK-1 vibrato
      vibratoGain = this.ctx.createGain();
      vibratoGain.gain.setValueAtTime(35, now); // ~35 cents detune depth
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(source.detune);
      vibratoOsc.start(now);
      vibratoOsc.stop(endTime + 0.1);
    }

    // Tremolo LFO for Envelope 9 & 10
    const envPreset = SK1_ENVELOPE_PRESETS[envelopeId];
    if (envPreset && envPreset.tremoloRate) {
      const tremOsc = this.ctx.createOscillator();
      const tremGain = this.ctx.createGain();
      tremOsc.frequency.setValueAtTime(envPreset.tremoloRate, now);
      tremGain.gain.setValueAtTime(envPreset.tremoloDepth || 0.4, now);
      tremOsc.connect(tremGain);
      tremGain.connect(voiceGain.gain);
      tremOsc.start(now);
      tremOsc.stop(endTime + 0.1);
    }

    // Connect node chain
    source.connect(voiceFilter);
    voiceFilter.connect(voiceGain);

    const targetFilterBus = filterType === 'bass' ? this.bassFilter! : this.melodyFilter!;
    voiceGain.connect(targetFilterBus);

    source.start(now);
    source.stop(endTime + 0.05);

    const voiceId = `${trackId}_${midiNote}_${Date.now()}_${Math.random()}`;
    const voiceNode: VoiceNode = {
      id: voiceId,
      midiNote,
      startTime: now,
      sourceNode: source,
      gainNode: voiceGain,
      filterNode: voiceFilter,
      vibratoOsc,
      vibratoGain,
      isReleased: false,
    };

    this.activeVoices.set(voiceId, voiceNode);

    source.onended = () => {
      this.activeVoices.delete(voiceId);
      try {
        source.disconnect();
        voiceGain.disconnect();
        voiceFilter.disconnect();
      } catch {}
    };

    return voiceId;
  }

  public releaseNote(voiceId: string, scheduledTime?: number): void {
    const voice = this.activeVoices.get(voiceId);
    if (!voice || voice.isReleased || !this.ctx) return;
    const now = scheduledTime !== undefined ? scheduledTime : this.ctx.currentTime;
    voice.isReleased = true;
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  }

  private stopVoice(voiceId: string, time: number): void {
    const voice = this.activeVoices.get(voiceId);
    if (!voice) return;
    voice.gainNode.gain.cancelScheduledValues(time);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, time);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);
    try {
      voice.sourceNode.stop(time + 0.02);
    } catch {}
    this.activeVoices.delete(voiceId);
  }

  // --- Drum Triggering ---

  public triggerDrum(drum: DrumSoundId, velocity: number = 1.0, scheduledTime?: number): void {
    if (!this.ctx || !this.percussionFilter) return;
    const now = scheduledTime !== undefined ? scheduledTime : this.ctx.currentTime;
    const buffer = this.drumBuffers.get(drum);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.01, velocity * 0.95), now);

    source.connect(gain);
    gain.connect(this.percussionFilter);

    source.start(now);
    source.onended = () => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  // --- Sequencer Lookahead Engine ---

  public setPattern(pattern: Pattern): void {
    this.currentPattern = pattern;
  }

  public setBpm(bpm: number): void {
    this.bpm = Math.max(30, Math.min(260, bpm));
  }

  public setSwing(swing: number): void {
    this.swingAmount = Math.max(0, Math.min(0.6, swing));
  }

  public startSequencer(onStepChange: (step: number) => void): void {
    if (this.isPlaying) return;
    this.initialize().then(() => {
      this.isPlaying = true;
      this.onStepChange = onStepChange;
      this.currentStep = 0;
      this.nextStepTime = this.ctx!.currentTime + 0.05;
      this.clockWorker?.postMessage({ action: 'start', interval: this.scheduleIntervalMs });
    });
  }

  public stopSequencer(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.clockWorker?.postMessage({ action: 'stop' });
    this.currentStep = 0;
    // Release active voices
    if (this.ctx) {
      for (const [key] of this.activeVoices) {
        this.stopVoice(key, this.ctx.currentTime);
      }
    }
  }

  private onWorkerTick(): void {
    if (!this.isPlaying || !this.ctx || !this.currentPattern) return;

    const lookaheadSec = this.lookaheadMs / 1000;
    const stepDuration = 60 / this.bpm / 4; // 16th note steps

    while (this.nextStepTime < this.ctx.currentTime + lookaheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      
      // Calculate swing offset for even/odd 16th notes
      let interval = stepDuration;
      if (this.currentStep % 2 === 0 && this.swingAmount > 0) {
        interval += stepDuration * this.swingAmount;
      } else if (this.currentStep % 2 === 1 && this.swingAmount > 0) {
        interval -= stepDuration * this.swingAmount;
      }

      this.nextStepTime += interval;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  private scheduleStep(stepIndex: number, stepTime: number): void {
    if (!this.currentPattern) return;

    // Schedule UI highlight with setTimeout aligned to stepTime
    if (this.onStepChange && this.ctx) {
      const delayMs = Math.max(0, (stepTime - this.ctx.currentTime) * 1000);
      setTimeout(() => {
        if (this.isPlaying) {
          this.onStepChange?.(stepIndex);
        }
      }, delayMs);
    }

    // Iterate through all tracks
    this.currentPattern.tracks.forEach((track) => {
      if (track.muted) return;
      const step = track.steps[stepIndex];
      if (!step || !step.active) return;

      const gateLength = (60 / this.bpm / 4) * (step.gate || 0.75);
      const vel = (step.velocity ?? 1.0) * track.gain;

      if (track.type === 'drum' && track.drumSound) {
        this.triggerDrum(track.drumSound, vel, stepTime);
      } else {
        const midi = step.midiNote + track.octaveOffset * 12 + (step.pLocks?.pitchOffset || 0);
        const env = step.pLocks?.envelopeOverride || track.envelopeId;
        const filterType = track.type === 'bass' ? 'bass' : 'melody';
        this.triggerNote(
          track.id,
          track.tone,
          env,
          midi,
          vel,
          gateLength,
          filterType,
          stepTime
        );
      }
    });
  }

  // --- Live Microphone Sampling (8-bit @ 9.387kHz, max 1.445s) ---

  public async startSampling(
    onProgress: (level: number, progress: number) => void,
    onComplete: (sample: SampleData) => void
  ): Promise<void> {
    await this.initialize();
    if (!this.ctx) return;

    this.onSamplingProgress = onProgress;
    this.onSamplingComplete = onComplete;
    this.isSampling = true;
    this.sampleTriggered = false;
    this.sampleRecordIndex = 0;

    // SK-1 max sample capacity: 1.4454s * 9387.5 samples/sec = 13568 samples
    const maxSamples = Math.floor(1.4454 * 9387.5);
    this.sampleRecordingBuffer = new Float32Array(maxSamples);

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const micSource = this.ctx.createMediaStreamSource(this.mediaStream);

      // Downsample and process audio via ScriptProcessor for precise threshold triggering
      this.sampleRecorderNode = this.ctx.createScriptProcessor(1024, 1, 1);
      const decimationFactor = this.ctx.sampleRate / 9387.5;
      let decimationAcc = 0;

      this.sampleRecorderNode.onaudioprocess = (e) => {
        if (!this.isSampling || !this.sampleRecordingBuffer) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Peak detector for level meter & auto-triggering
        let blockPeak = 0;
        for (let i = 0; i < inputData.length; i++) {
          const abs = Math.abs(inputData[i]);
          if (abs > blockPeak) blockPeak = abs;

          // Auto-triggering check (+/- 0.315V equivalent)
          if (!this.sampleTriggered && abs >= this.autoTriggerThreshold) {
            this.sampleTriggered = true;
          }

          if (this.sampleTriggered && this.sampleRecordIndex < maxSamples) {
            decimationAcc += 1;
            if (decimationAcc >= decimationFactor) {
              decimationAcc -= decimationFactor;
              // 8-bit quantization
              const quantized = Math.round(inputData[i] * 127.5) / 127.5;
              this.sampleRecordingBuffer[this.sampleRecordIndex++] = quantized;
            }
          }
        }

        const progress = this.sampleTriggered ? this.sampleRecordIndex / maxSamples : 0;
        this.onSamplingProgress?.(blockPeak, progress);

        if (this.sampleTriggered && this.sampleRecordIndex >= maxSamples) {
          this.stopSampling();
        }
      };

      micSource.connect(this.sampleRecorderNode);
      this.sampleRecorderNode.connect(this.ctx.destination);
    } catch (err) {
      console.error('Failed to access microphone for sampling:', err);
      this.isSampling = false;
      throw err;
    }
  }

  public stopSampling(): void {
    if (!this.isSampling) return;
    this.isSampling = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.sampleRecorderNode) {
      try {
        this.sampleRecorderNode.disconnect();
      } catch {}
      this.sampleRecorderNode = null;
    }

    if (this.sampleRecordingBuffer && this.ctx) {
      const sampleLength = Math.max(100, this.sampleRecordIndex);
      const trimmed = this.sampleRecordingBuffer.slice(0, sampleLength);

      // Create Web Audio Buffer
      const audioBuffer = this.ctx.createBuffer(1, trimmed.length, 9387.5);
      audioBuffer.getChannelData(0).set(trimmed);
      this.userSampleBuffer = audioBuffer;

      const sampleData: SampleData = {
        buffer: trimmed,
        sampleRate: 9387.5,
        duration: trimmed.length / 9387.5,
        isLooping: false,
        rootMidiNote: 69, // A4 = 442Hz
        envelopeId: 1,
        recordedAt: Date.now(),
      };

      this.onSamplingComplete?.(sampleData);
    }
  }

  public setUserSample(buffer: Float32Array, isLooping: boolean = false, envelopeId: EnvelopeShapeId = 1): void {
    if (!this.ctx) return;
    const audioBuffer = this.ctx.createBuffer(1, buffer.length, 9387.5);
    audioBuffer.getChannelData(0).set(buffer);
    this.userSampleBuffer = audioBuffer;
  }

  // --- Parameter controls ---

  public setMasterGain(gain: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, gain)), this.ctx.currentTime);
    }
  }

  public setTuning(cents: number): void {
    this.tuningParam = Math.max(-50, Math.min(50, cents));
  }

  public setVibrato(active: boolean): void {
    this.vibratoActive = active;
  }

  public setPortamento(active: boolean): void {
    this.portamentoActive = active;
  }

  public setBitcrusherActive(active: boolean): void {
    if (this.bitcrusherNode) {
      const param = this.bitcrusherNode.parameters.get('active');
      if (param && this.ctx) {
        param.setValueAtTime(active ? 1 : 0, this.ctx.currentTime);
      }
    }
  }

  public updateBendingParameters(params: {
    dataXorMask?: number;
    dataAndMask?: number;
    dataOrMask?: number;
    stutterWindow?: number;
    targetSampleRate?: number;
  }): void {
    if (!this.bitcrusherNode || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (params.dataXorMask !== undefined) {
      this.bitcrusherNode.parameters.get('dataXorMask')?.setValueAtTime(params.dataXorMask, now);
    }
    if (params.dataAndMask !== undefined) {
      this.bitcrusherNode.parameters.get('dataAndMask')?.setValueAtTime(params.dataAndMask, now);
    }
    if (params.dataOrMask !== undefined) {
      this.bitcrusherNode.parameters.get('dataOrMask')?.setValueAtTime(params.dataOrMask, now);
    }
    if (params.stutterWindow !== undefined) {
      this.bitcrusherNode.parameters.get('stutterWindow')?.setValueAtTime(params.stutterWindow, now);
    }
    if (params.targetSampleRate !== undefined) {
      this.bitcrusherNode.parameters.get('targetSampleRate')?.setValueAtTime(params.targetSampleRate, now);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getStatus(): AudioEngineStatus {
    return {
      isInitialized: this.ctx !== null && this.ctx.state === 'running',
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      cpuLoad: this.activeVoices.size / this.maxPolyphony,
      sampleRate: this.ctx ? this.ctx.sampleRate : 44100,
      activeVoices: this.activeVoices.size,
      isRecordingSample: this.isSampling,
      recordingLevel: 0,
    };
  }
}

// Global Singleton Instance for clean React integration
export const audioEngine = new AudioEngine();
