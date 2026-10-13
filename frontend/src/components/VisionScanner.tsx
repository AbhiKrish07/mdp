import React, { useState, useRef } from 'react';
import { Camera, FileText, Cpu, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface VisionScannerProps {
  onScanComplete: (summary: string, prompt: string) => void;
  privacyActive: boolean;
}

export const VisionScanner: React.FC<VisionScannerProps> = ({ onScanComplete, privacyActive }) => {
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleItems = [
    {
      id: 'resistor',
      title: 'Circuit Resistor',
      icon: Cpu,
      desc: '10k Ohm axial resistor on breadboard',
      result: 'Identified 10k Ohm Resistor (Brown-Black-Orange-Gold tolerance 5%). Suitable for voltage divider R1.'
    },
    {
      id: 'formula',
      title: 'Handwritten Notes',
      icon: FileText,
      desc: 'Page formula: V_out = V_in * (R2 / (R1 + R2))',
      result: 'Scanned handwritten notes. Formula verified: Standard Voltage Divider Equation. V_out calculated correctly.'
    },
    {
      id: 'diagram',
      title: 'Schematic Diagram',
      icon: Sparkles,
      desc: 'Hand-drawn op-amp amplifier sketch',
      result: 'Analyzed hand-drawn schematic: Non-inverting Operational Amplifier configuration with Gain = 1 + (Rf / Rin).'
    }
  ];

  const handleScanSample = (sample: typeof sampleItems[0]) => {
    if (privacyActive) return;
    setSelectedSample(sample.id);
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(sample.result);
      onScanComplete(sample.result, `What is this ${sample.title.toLowerCase()} on my desk?`);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (privacyActive || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setIsScanning(true);
    setSelectedSample('custom');

    setTimeout(() => {
      setIsScanning(false);
      const res = `Scanned uploaded file (${file.name}): Document contains technical specification and assembly instructions.`;
      setScanResult(res);
      onScanComplete(res, `Read and explain this uploaded file: ${file.name}`);
    }, 1500);
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-slate-100 text-base">Physical World Vision Scanner</h3>
        </div>
        <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
          Multimodal Groq Vision
        </span>
      </div>

      {privacyActive ? (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Camera feed disabled due to physical privacy switch. Disengage switch to scan desk items.</span>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">
            Show handwritten notes, textbook pages, or electronic components to your AI companion. Select a physical desk item or upload a image:
          </p>

          <div className="grid grid-cols-3 gap-3">
            {sampleItems.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedSample === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleScanSample(item)}
                  disabled={isScanning}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-2 transition-all text-left ${
                    isSelected
                      ? 'bg-purple-900/30 border-purple-400 text-purple-200 glow-purple'
                      : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/50 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-800/60">
                    <Icon className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-200">{item.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Upload Custom Photo/Scan</span>
            </button>
          </div>

          {/* Vision Scan Result Display */}
          {isScanning && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center gap-3 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              <span className="text-xs font-mono text-purple-300">Processing multimodal vision analysis via Pi Camera...</span>
            </div>
          )}

          {scanResult && !isScanning && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block mb-0.5">Vision Analysis Result:</span>
                <span>{scanResult}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
