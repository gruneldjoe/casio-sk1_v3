import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';

interface OscilloscopeProps {
  className?: string;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = audioEngine.getAnalyser();
      const width = canvas.width;
      const height = canvas.height;

      // Dark retro phosphor background
      ctx.fillStyle = '#121714';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope grid lines
      ctx.strokeStyle = '#1e2d24';
      ctx.lineWidth = 1;

      // Vertical grid lines
      const xDiv = width / 8;
      for (let x = xDiv; x < width; x += xDiv) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      const yDiv = height / 4;
      for (let y = yDiv; y < height; y += yDiv) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center crosshair
      ctx.strokeStyle = '#274433';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!analyser) {
        // Flat center line if no audio
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Draw glowing green 8-bit stepped waveform
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#39ff14';
      ctx.strokeStyle = '#43ff64';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Stepped representation to accentuate 8-bit DAC texture
          const prevV = dataArray[i - 1] / 128.0;
          const prevY = (prevV * height) / 2;
          ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div id="sk1-oscilloscope-container" className={`relative rounded border border-neutral-800 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={360}
        height={90}
        className="w-full h-full block"
      />
      <div className="absolute top-1 left-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-500/80 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        8-BIT DAC MONITOR (9.387 kHz)
      </div>
      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-500/60 pointer-events-none">
        OKI MSM6283
      </div>
    </div>
  );
};
