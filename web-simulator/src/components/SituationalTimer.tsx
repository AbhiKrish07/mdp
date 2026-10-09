import { useState, useEffect } from 'react';
import { Clock, ShieldCheck, ShieldAlert, Coffee, Bell } from 'lucide-react';

interface SituationalTimerProps {
  privacyActive: boolean;
  onTogglePrivacy: () => void;
  onTriggerBreakNudge: () => void;
}

export const SituationalTimer: React.FC<SituationalTimerProps> = ({
  privacyActive,
  onTogglePrivacy,
  onTriggerBreakNudge
}) => {
  const [secondsSit, setSecondsSit] = useState(1420); // sample initial sit time (23 min 40s)
  const [breakNudgeAlert, setBreakNudgeAlert] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSit((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleSimulateLongSit = () => {
    setSecondsSit(5460); // 91 minutes
    const alertMsg = "Situational Rules Engine Triggered: You've been working continuously for 91 minutes. Time for a 2-minute stretch!";
    setBreakNudgeAlert(alertMsg);
    onTriggerBreakNudge();
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-100 text-base">Situational Awareness & Rules Engine</h3>
        </div>
        <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
          Rule-Based Monitor
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        
        {/* Sit Duration Counter */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>DESK FOCUS TIMER</span>
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-300 my-1">
            {formatTime(secondsSit)}
          </div>
          <button
            onClick={handleSimulateLongSit}
            className="text-[10px] font-mono py-1 px-2 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 transition-all"
          >
            ⚡ Test 90-Min Break Rule
          </button>
        </div>

        {/* Physical Privacy Switch Control */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
          privacyActive ? 'bg-red-950/40 border-red-500/60' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={privacyActive ? 'text-red-400 font-bold' : 'text-slate-400'}>PRIVACY SWITCH</span>
            {privacyActive ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          </div>

          <div className="text-xs font-semibold my-1">
            {privacyActive ? (
              <span className="text-red-300 font-mono">DISCONNECTED</span>
            ) : (
              <span className="text-emerald-400 font-mono">HARDWARE ACTIVE</span>
            )}
          </div>

          <button
            onClick={onTogglePrivacy}
            className={`text-xs font-bold py-1.5 px-3 rounded-lg border transition-all ${
              privacyActive
                ? 'bg-red-500 hover:bg-red-400 text-white border-red-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {privacyActive ? 'Re-enable Sensors' : 'Engage Hard Cutoff'}
          </button>
        </div>

      </div>

      {breakNudgeAlert && (
        <div className="p-3 rounded-xl bg-pink-950/40 border border-pink-500/50 flex items-start gap-2 text-xs text-pink-200 animate-pulse">
          <Bell className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">Gentle Break Nudge:</span>
            <span>{breakNudgeAlert}</span>
          </div>
        </div>
      )}
    </div>
  );
};
