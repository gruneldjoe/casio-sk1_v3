import React, { useEffect, useState } from 'react';
import {
  Zap,
  Cpu,
  Flame,
  Radio,
  Sliders,
  RotateCcw,
  Sparkles,
  Repeat,
  Activity,
  Layers,
  Power,
  Volume2,
} from 'lucide-react';
import { useBendingStore, CASPER_BEND_DEFINITIONS } from '../store/useBendingStore';
import { BendTargetId } from '../types';
import { audioEngine } from '../audio/AudioEngine';

const PATCH_SOURCE_PINS = [
  { id: 'RAM_IO0', label: 'RAM IO0', chip: 'DRAM (Pin 11)' },
  { id: 'RAM_IO4', label: 'RAM IO4', chip: 'DRAM (Pin 15)' },
  { id: 'CPU_A9', label: 'CPU A9', chip: 'CPU (Pin 44)' },
  { id: 'RAM_A4', label: 'RAM A4', chip: 'DRAM (Pin 4)' },
  { id: 'DATA_BUS', label: 'DATA BUS', chip: 'Pins 32-39' },
  { id: 'DATA_LSB', label: 'DATA LSB', chip: 'Pins 32-35' },
  { id: 'XTAL_7M', label: 'XTAL 7.24M', chip: 'Crystal Osc' },
  { id: 'RES_R98', label: 'RES R98', chip: 'CH1 Melody' },
  { id: 'DAC_OUT', label: 'DAC OUT', chip: 'CPU Pin 89' },
];

const PATCH_TARGET_PINS = [
  { id: 'RAM_IO3', label: 'RAM IO3', chip: 'DRAM (Pin 14)' },
  { id: 'RAM_IO7', label: 'RAM IO7', chip: 'DRAM (Pin 18)' },
  { id: 'CLK_DIV', label: 'CLK DIV Q3', chip: 'Aleatron Latch' },
  { id: 'RAM_A11', label: 'RAM A11', chip: 'DRAM (Pin 23)' },
  { id: 'VDD_RAIL', label: 'VDD (+5V)', chip: 'Logic High' },
  { id: 'GND_RAIL', label: 'GND (0V)', chip: 'Logic Low' },
  { id: 'VAR_POT', label: 'STARVE POT', chip: 'Variable Sag' },
  { id: 'RES_R47', label: 'RES R47', chip: 'CH2 Obbligato' },
  { id: 'FILTER_IN', label: 'FILTER IN', chip: 'Sallen-Key Pre' },
];

export const CircuitBendingPanel: React.FC = () => {
  const {
    bends,
    matrixConnections,
    masterBendingActive,
    activeMomentaryBends,
    toggleBend,
    setBendIntensity,
    setBendParameter,
    triggerMomentaryBend,
    toggleMatrixNode,
    setMasterBendingActive,
    resetAllBends,
    applyBendPreset,
    getComputedDataBitmasks,
    getComputedStutterWindow,
    getComputedClockSag,
  } = useBendingStore();

  const [activeTabSub, setActiveTabSub] = useState<'bends' | 'matrix' | 'bus_inspector'>('bends');

  const activeCount = Object.values(bends).filter((b) => b.enabled || activeMomentaryBends.has(b.id)).length;
  const { xorMask, andMask, orMask } = getComputedDataBitmasks();

  return (
    <div id="sk1-circuit-bending-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-6">
      {/* Top Header & Master Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-500/80 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-mono font-black text-neutral-100 uppercase tracking-wider">
                CASPER ELECTRONICS CIRCUIT BENDING MATRIX
              </h2>
              <span className="text-[10px] font-mono uppercase bg-neutral-950 border border-neutral-800 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                {activeCount} BENDS ACTIVE
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">
              Virtual RAM/CPU Pin Shorts • Bitwise Data Bus Glitching • Aleatron Address Latch • 7.24MHz Clock Starve
            </p>
          </div>
        </div>

        {/* Master Power Toggle & Global Glitch Burst Button */}
        <div className="flex items-center gap-2">
          <button
            id="bend-master-toggle"
            onClick={() => setMasterBendingActive(!masterBendingActive)}
            className={`px-3 py-2 rounded-lg font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all border ${
              masterBendingActive
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>PATCHBAY: {masterBendingActive ? 'ENABLED' : 'BYPASS'}</span>
          </button>

          <button
            id="bend-momentary-master"
            onMouseDown={() => {
              triggerMomentaryBend('ram_short_a', 250);
              triggerMomentaryBend('aleatron_glitch', 250);
            }}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-1.5 ring-2 ring-red-500/30"
          >
            <Flame className="w-4 h-4 fill-current animate-pulse" />
            <span>MOMENTARY GLITCH BURST</span>
          </button>
        </div>
      </div>

      {/* Preset Bank Quick Selectors & View Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-neutral-400 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            BEND PRESETS:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => applyBendPreset('subtle_lofi')}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-orange-400 transition-colors"
            >
              Subtle Lo-Fi (D0-D3)
            </button>
            <button
              onClick={() => applyBendPreset('aleatron_frenzy')}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-orange-400 transition-colors"
            >
              Aleatron Frenzy (A9 Latch)
            </button>
            <button
              onClick={() => applyBendPreset('ram_meltdown')}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-orange-400 transition-colors"
            >
              RAM Meltdown (Full Bus)
            </button>
            <button
              onClick={() => applyBendPreset('cybernetic_crush')}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-orange-400 transition-colors"
            >
              Cybernetic Crush (4-Bit + Sag)
            </button>
            <button
              onClick={resetAllBends}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
        </div>

        {/* View Sub-Tabs */}
        <div className="flex items-center bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs font-mono">
          <button
            onClick={() => setActiveTabSub('bends')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTabSub === 'bends' ? 'bg-orange-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            CIRCUIT BENDS (9)
          </button>
          <button
            onClick={() => setActiveTabSub('matrix')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTabSub === 'matrix' ? 'bg-orange-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            PATCHBAY MATRIX
          </button>
          <button
            onClick={() => setActiveTabSub('bus_inspector')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTabSub === 'bus_inspector' ? 'bg-orange-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            8-BIT BUS INSPECTOR
          </button>
        </div>
      </div>

      {/* Main Sub-view Content */}
      {activeTabSub === 'bends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(bends).map((bend) => {
            const isMomentary = activeMomentaryBends.has(bend.id);
            const isActive = bend.enabled || isMomentary;

            return (
              <div
                key={bend.id}
                id={`bend-card-${bend.id}`}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-neutral-800/90 border-orange-500 shadow-lg ring-1 ring-orange-500/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          isActive
                            ? 'bg-orange-400 shadow-[0_0_10px_#f97316]'
                            : 'bg-neutral-800 border border-neutral-700'
                        }`}
                      />
                      <span className="font-mono font-bold text-sm text-neutral-100">
                        {bend.name}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleBend(bend.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase transition-colors ${
                        bend.enabled
                          ? 'bg-orange-500 text-neutral-950'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {bend.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-orange-400/90">
                    {bend.hardwarePinMapping}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-400 font-sans my-3 leading-relaxed">
                  {bend.description}
                </p>

                {/* Intensity Slider & Momentary Touch Pad */}
                <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>INTENSITY</span>
                    <span className="text-orange-400 font-bold">{Math.round(bend.intensity * 100)}%</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={bend.intensity}
                    onChange={(e) => setBendIntensity(bend.id, parseFloat(e.target.value))}
                    className="accent-orange-500 h-1.5 bg-neutral-900 rounded cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-2 mt-1">
                    {/* Specialized parameter display */}
                    <div className="text-[10px] font-mono text-neutral-500">
                      {bend.dataXorMask > 0 && `XOR: 0x${bend.dataXorMask.toString(16).toUpperCase()}`}
                      {bend.stutterWindow > 0 && `STUTTER: ${bend.stutterWindow} spl`}
                      {bend.clockSagFactor < 1 && `SAG: ${(bend.clockSagFactor * 100).toFixed(0)}%`}
                    </div>

                    <button
                      onMouseDown={() => triggerMomentaryBend(bend.id, 250)}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 active:bg-orange-500 active:text-neutral-950 border border-neutral-700 text-[10px] font-mono font-bold uppercase transition-all"
                      title="Hold for momentary bend burst"
                    >
                      MOMENTARY
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Matrix View: Physical Patchbay Pin Grid */}
      {activeTabSub === 'matrix' && (
        <div className="flex flex-col gap-4 bg-neutral-950 p-4 sm:p-6 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
            <span>CASPER ELECTRONICS 9-POINT VIRTUAL PATCHBAY MATRIX</span>
            <span>Click any intersection node to solder/disconnect a patch wire</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left font-mono text-xs text-neutral-500 uppercase">SOURCE \ DEST</th>
                  {PATCH_TARGET_PINS.map((t) => (
                    <th key={t.id} className="p-2 font-mono text-[11px] text-neutral-300">
                      <div className="font-bold text-orange-400">{t.label}</div>
                      <div className="text-[9px] text-neutral-500">{t.chip}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PATCH_SOURCE_PINS.map((s, rowIdx) => (
                  <tr key={s.id} className="border-t border-neutral-900 hover:bg-neutral-900/40">
                    <td className="p-2 text-left font-mono text-xs font-bold text-neutral-300">
                      <div className="text-emerald-400">{s.label}</div>
                      <div className="text-[9px] text-neutral-500">{s.chip}</div>
                    </td>
                    {PATCH_TARGET_PINS.map((t, colIdx) => {
                      const connection = matrixConnections.find(
                        (c) => c.sourcePin === s.id && c.targetPin === t.id
                      );
                      const isDiagonal = rowIdx === colIdx;

                      return (
                        <td key={t.id} className="p-2">
                          <button
                            id={`patch-node-${s.id}-${t.id}`}
                            onClick={() => toggleMatrixNode(s.id, t.id)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                              connection?.active
                                ? 'bg-orange-500 border-orange-400 text-neutral-950 shadow-[0_0_10px_#f97316]'
                                : isDiagonal
                                ? 'bg-neutral-900 border-neutral-700 hover:border-orange-500/60'
                                : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                            }`}
                            title={`Patch ${s.label} to ${t.label}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                connection?.active ? 'bg-neutral-950' : 'bg-neutral-700'
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8-Bit Bus & Data Line Inspector */}
      {activeTabSub === 'bus_inspector' && (
        <div className="flex flex-col gap-4 bg-neutral-950 p-5 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-orange-400" />
              OKI MSM6283 CPU & DRAM DATA BUS MONITOR (D0–D7)
            </span>
            <span>Real-time Computed Masks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2">
              <span className="text-xs font-mono text-neutral-400">DATA XOR MASK (Pin Inversion)</span>
              <span className="text-2xl font-mono font-black text-orange-400">
                0x{xorMask.toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                BINARY: {xorMask.toString(2).padStart(8, '0')}
              </span>
            </div>

            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2">
              <span className="text-xs font-mono text-neutral-400">DATA AND MASK (Pin Pull-down)</span>
              <span className="text-2xl font-mono font-black text-emerald-400">
                0x{andMask.toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                BINARY: {andMask.toString(2).padStart(8, '0')}
              </span>
            </div>

            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2">
              <span className="text-xs font-mono text-neutral-400">DATA OR MASK (Pin Pull-up)</span>
              <span className="text-2xl font-mono font-black text-amber-400">
                0x{orMask.toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="text-xs font-mono text-neutral-500">
                BINARY: {orMask.toString(2).padStart(8, '0')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
