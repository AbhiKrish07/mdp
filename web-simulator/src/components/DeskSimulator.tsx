import { useState } from 'react';
import { ShieldAlert, Move } from 'lucide-react';

interface DeskSimulatorProps {
  currentGesture: string;
  onTriggerGesture: (gesture: string) => void;
  privacyActive: boolean;
}

export const DeskSimulator: React.FC<DeskSimulatorProps> = ({
  currentGesture,
  onTriggerGesture,
  privacyActive
}) => {
  const [robotPos, setRobotPos] = useState({ x: 50, y: 55 }); // percentage coordinates on desk
  const [edgeDetected, setEdgeDetected] = useState(false);
  const [wheelSpeed, setWheelSpeed] = useState(0);

  const moveRobot = (dx: number, dy: number) => {
    if (privacyActive) return;
    const newX = Math.min(88, Math.max(12, robotPos.x + dx));
    const newY = Math.min(88, Math.max(12, robotPos.y + dy));

    // Edge sensor boundary check (if robot comes within 15% of boundary)
    if (newX <= 15 || newX >= 85 || newY <= 15 || newY >= 85) {
      setEdgeDetected(true);
      setWheelSpeed(0);
      setTimeout(() => setEdgeDetected(false), 2000);
      return;
    }

    setEdgeDetected(false);
    setWheelSpeed(0.5);
    setRobotPos({ x: newX, y: newY });
    setTimeout(() => setWheelSpeed(0), 400);
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-slate-100 text-base">Desk Mobility & Hardware Simulator</h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Scale: 60cm x 90cm Desk
        </span>
      </div>

      {/* 2D Interactive Desk Topography Canvas */}
      <div 
        className="relative w-full h-64 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden cursor-crosshair flex items-center justify-center"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 100;
          const clickY = ((e.clientY - rect.top) / rect.height) * 100;
          setRobotPos({ x: Math.min(85, Math.max(15, clickX)), y: Math.min(85, Math.max(15, clickY)) });
        }}
      >
        {/* Grid markings */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

        {/* Desk edge warning borders */}
        <div className="absolute inset-2 border-2 border-dashed border-red-500/20 rounded-lg pointer-events-none flex items-center justify-center">
          <span className="text-[10px] font-mono text-red-500/40 uppercase tracking-widest absolute top-1">DESK EDGE SAFETY BOUNDARY</span>
        </div>

        {/* Physical Laptop / Notebook representation on desk */}
        <div className="absolute top-6 left-8 w-28 h-16 rounded border border-slate-700 bg-slate-900/60 flex items-center justify-center">
          <span className="text-[10px] font-mono text-slate-500">WORKSTATION</span>
        </div>

        {/* Handwritten Notes / Component area */}
        <div className="absolute bottom-6 right-8 w-20 h-16 rounded border border-slate-700/80 bg-amber-950/20 flex flex-col items-center justify-center">
          <span className="text-[9px] font-mono text-amber-400/80">NOTES & PARTS</span>
        </div>

        {/* Robot Chassis Representation */}
        <div
          className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 flex flex-col items-center justify-center"
          style={{ left: `${robotPos.x}%`, top: `${robotPos.y}%` }}
        >
          {/* Wheel tracks */}
          <div className={`absolute -left-2 w-3 h-14 bg-slate-700 rounded-sm border border-slate-600 ${wheelSpeed > 0 ? 'animate-pulse' : ''}`} />
          <div className={`absolute -right-2 w-3 h-14 bg-slate-700 rounded-sm border border-slate-600 ${wheelSpeed > 0 ? 'animate-pulse' : ''}`} />

          {/* Main Body */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-400/50 shadow-lg flex flex-col items-center justify-center relative">
            
            {/* Left Arm */}
            <div className={`absolute -left-4 w-4 h-2 bg-cyan-400 rounded-full transition-transform duration-300 ${currentGesture === 'wave' || currentGesture === 'nudge' ? 'rotate-45' : ''}`} />
            
            {/* Right Arm */}
            <div className={`absolute -right-4 w-4 h-2 bg-cyan-400 rounded-full transition-transform duration-300 ${currentGesture === 'point' ? '-rotate-45' : ''}`} />

            {/* Camera lens indicator */}
            <div className="w-5 h-5 rounded-full bg-slate-950 border border-cyan-400 flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full ${privacyActive ? 'bg-red-500' : 'bg-cyan-400 animate-ping'}`} />
            </div>

            <span className="text-[9px] font-mono font-bold text-slate-300 mt-1">PI-ROBOT</span>
          </div>
        </div>

        {/* Edge Cutoff Alert Overlay */}
        {edgeDetected && (
          <div className="absolute top-2 bg-red-950/90 border border-red-500 text-red-300 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 animate-bounce shadow-lg">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>IR EDGE SAFETY CUTOFF ENGAGED!</span>
          </div>
        )}
      </div>

      {/* Manual Movement & Gesture Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-400 font-mono">DESK REPOSITIONING</span>
          <div className="grid grid-cols-3 gap-1 max-w-[140px]">
            <div />
            <button onClick={() => moveRobot(0, -10)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs text-center font-bold">▲</button>
            <div />
            <button onClick={() => moveRobot(-10, 0)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs text-center font-bold">◄</button>
            <button onClick={() => moveRobot(0, 10)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs text-center font-bold">▼</button>
            <button onClick={() => moveRobot(10, 0)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs text-center font-bold">►</button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-400 font-mono">EXPRESSIVE ARM GESTURES</span>
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => onTriggerGesture('wave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${currentGesture === 'wave' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              👋 Wave Arm
            </button>
            <button 
              onClick={() => onTriggerGesture('point')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${currentGesture === 'point' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              👉 Point at Note
            </button>
            <button 
              onClick={() => onTriggerGesture('nudge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${currentGesture === 'nudge' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              🤏 Gentle Nudge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
