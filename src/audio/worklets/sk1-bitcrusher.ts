/**
 * AudioWorklet processor for Casio SK-1 8-bit PCM DAC and 9.387kHz sample-and-hold emulation.
 * Modeled after the OKI MSM6283-01GS LSI and TC50H4066P multiplexer.
 */

export const SK1_BITCRUSHER_PROCESSOR_NAME = 'sk1-bitcrusher-processor';

export const sk1BitcrusherWorkletCode = `
class SK1BitcrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'targetSampleRate',
        defaultValue: 9387.5, // SK-1 exact crystal-derived sample rate
        minValue: 500,
        maxValue: 48000,
        automationRate: 'k-rate'
      },
      {
        name: 'bitDepth',
        defaultValue: 8, // 8-bit quantization
        minValue: 2,
        maxValue: 16,
        automationRate: 'k-rate'
      },
      {
        name: 'analogWarmth',
        defaultValue: 0.15, // Subtle resistor ladder saturation & noise
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate'
      },
      {
        name: 'active',
        defaultValue: 1, // 1 = bitcrush on, 0 = bypass
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate'
      },
      {
        name: 'dataXorMask',
        defaultValue: 0, // 0x00 to 0xFF (Casper data bus short)
        minValue: 0,
        maxValue: 255,
        automationRate: 'k-rate'
      },
      {
        name: 'dataAndMask',
        defaultValue: 255, // 0xFF (Casper bit drop)
        minValue: 0,
        maxValue: 255,
        automationRate: 'k-rate'
      },
      {
        name: 'dataOrMask',
        defaultValue: 0,
        minValue: 0,
        maxValue: 255,
        automationRate: 'k-rate'
      },
      {
        name: 'stutterWindow',
        defaultValue: 0, // 0 = disabled, >0 = Aleatron address latch loop size
        minValue: 0,
        maxValue: 512,
        automationRate: 'k-rate'
      }
    ];
  }

  constructor() {
    super();
    this.phase = 0.0;
    this.heldSampleL = 0.0;
    this.heldSampleR = 0.0;
    this.dcOffset = -0.003;
    
    // Aleatron ring buffer emulation for address bus latching
    this.historyBufferL = new Float32Array(1024);
    this.historyBufferR = new Float32Array(1024);
    this.historyIndex = 0;
    this.stutterPhase = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0 || !output || output.length === 0) {
      return true;
    }

    const inputL = input[0];
    const inputR = input[1] || inputL;
    const outputL = output[0];
    const outputR = output[1] || outputL;

    const targetSampleRate = parameters.targetSampleRate[0];
    const bitDepth = parameters.bitDepth[0];
    const analogWarmth = parameters.analogWarmth[0];
    const active = parameters.active[0] > 0.5;
    
    // Casper Circuit Bending Parameters
    const dataXor = Math.floor(parameters.dataXorMask[0]) & 0xFF;
    const dataAnd = Math.floor(parameters.dataAndMask[0]) & 0xFF;
    const dataOr = Math.floor(parameters.dataOrMask[0]) & 0xFF;
    const stutterWin = Math.floor(parameters.stutterWindow[0]);
    const hasBitGlitch = dataXor !== 0 || dataAnd !== 255 || dataOr !== 0;

    if (!active && !hasBitGlitch && stutterWin === 0) {
      for (let i = 0; i < inputL.length; i++) {
        outputL[i] = inputL[i];
        if (outputR && inputR) outputR[i] = inputR[i];
      }
      return true;
    }

    const stepSize = targetSampleRate / sampleRate;
    const numLevels = Math.pow(2, bitDepth);
    const halfLevels = numLevels / 2;

    for (let i = 0; i < inputL.length; i++) {
      this.phase += stepSize;
      
      // Update history circular buffer for Aleatron glitch
      this.historyBufferL[this.historyIndex] = inputL[i];
      this.historyBufferR[this.historyIndex] = inputR[i];
      this.historyIndex = (this.historyIndex + 1) & 1023;

      if (this.phase >= 1.0) {
        this.phase -= 1.0;
        
        let inL = inputL[i];
        let inR = inputR[i];

        // Aleatron Glitch: Latch and repeat granular micro-buffer slice
        if (stutterWin > 8) {
          this.stutterPhase = (this.stutterPhase + 1) % stutterWin;
          const readPtr = (this.historyIndex - stutterWin + this.stutterPhase) & 1023;
          inL = this.historyBufferL[readPtr];
          inR = this.historyBufferR[readPtr];
        }

        // Add subtle DAC ladder distortion / thermal noise
        const noise = (Math.random() - 0.5) * (analogWarmth * 0.008);
        let sampleValL = Math.max(-1, Math.min(1, inL + noise + this.dcOffset));
        let sampleValR = Math.max(-1, Math.min(1, inR + noise + this.dcOffset));

        if (hasBitGlitch) {
          // Convert [-1.0, 1.0] to 8-bit unsigned PCM byte [0, 255]
          let byteL = Math.floor((sampleValL + 1.0) * 127.5);
          let byteR = Math.floor((sampleValR + 1.0) * 127.5);

          // Apply physical Casper RAM/CPU Data Line bitwise operations
          byteL = ((byteL ^ dataXor) & dataAnd) | dataOr;
          byteR = ((byteR ^ dataXor) & dataAnd) | dataOr;

          // Convert back to [-1.0, 1.0] DAC voltage
          sampleValL = (byteL / 127.5) - 1.0;
          sampleValR = (byteR / 127.5) - 1.0;
        }

        // 8-bit uniform quantization (MSM6283 DAC ladder)
        const quantizedL = Math.round(sampleValL * halfLevels) / halfLevels;
        const quantizedR = Math.round(sampleValR * halfLevels) / halfLevels;

        // Mild non-linear soft clip characteristic of the 2SC1740 differential mixing stage
        this.heldSampleL = Math.tanh(quantizedL * 1.05);
        this.heldSampleR = Math.tanh(quantizedR * 1.05);
      }

      outputL[i] = this.heldSampleL;
      if (outputR) {
        outputR[i] = this.heldSampleR;
      }
    }

    return true;
  }
}

registerProcessor('${SK1_BITCRUSHER_PROCESSOR_NAME}', SK1BitcrusherProcessor);
`;
