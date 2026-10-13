import React, { useState, useEffect } from 'react';
import { 
  Cpu, HardDrive, Play, Pause, SkipForward, Volume2, 
  Music, Activity, Monitor, BatteryCharging
} from 'lucide-react';

export const SystemMonitorWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(75);
  const [cpuUsage, setCpuUsage] = useState<number>(28);
  const [ramUsage, setRamUsage] = useState<number>(64);
  const [batteryLevel] = useState<number>(94);
  const [trackProgress, setTrackProgress] = useState<number>(45);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.min(85, Math.max(18, Math.round(prev + (Math.random() - 0.48) * 6))));
      setRamUsage((prev) => Math.min(80, Math.max(55, Math.round(prev + (Math.random() - 0.5) * 2))));
      if (isPlaying) {
        setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-3 font-sans text-xs">
      {/* System Telemetry Card */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">Workstation Telemetry</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            ● Normal Load
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* CPU Metric */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 text-[10px]"><Cpu className="w-3 h-3 text-cyan-400" /> CPU</span>
              <span className="font-mono text-cyan-300 font-bold">{cpuUsage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>

          {/* RAM Metric */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 text-[10px]"><HardDrive className="w-3 h-3 text-purple-400" /> RAM</span>
              <span className="font-mono text-purple-300 font-bold">{ramUsage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${ramUsage}%` }}
              />
            </div>
          </div>

          {/* Companion Robot Battery */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 text-[10px]"><BatteryCharging className="w-3 h-3 text-emerald-400" /> ROBOT</span>
              <span className="font-mono text-emerald-300 font-bold">{batteryLevel}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/40 px-2.5 py-1.5 rounded border border-slate-800/60 font-mono">
          <span className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active: VS Code (firmware/pico)</span>
          </span>
          <span className="text-slate-500">FPS: 60 | 32°C</span>
        </div>
      </div>

      {/* Spotify Music Integration */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-cyan-700 flex items-center justify-center shrink-0 shadow-md">
              <Music className="w-5 h-5 text-slate-950" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-200 text-xs truncate">Lofi Companion Sessions</div>
              <div className="text-[10px] text-slate-400 truncate">Deep Coding & Hardware Focus • Synthwave</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />}
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-200">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress & Volume Bar */}
        <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60">
          <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${trackProgress}%` }} />
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Volume2 className="w-3 h-3 text-slate-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-14 h-1 accent-emerald-400 bg-slate-700 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
