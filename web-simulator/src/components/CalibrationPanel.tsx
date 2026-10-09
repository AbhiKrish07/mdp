import { useState } from 'react';
import { Sliders, Cpu, Settings2 } from 'lucide-react';

interface CalibrationPanelProps {
  logs: Array<{ timestamp: string; role: string; content: string; metadata?: string }>;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({ logs }) => {
  const [leftArmTrim, setLeftArmTrim] = useState(2);
  const [rightArmTrim, setRightArmTrim] = useState(-1);
  const [motorSpeedTrim, setMotorSpeedTrim] = useState(0.98);
  const [micSensitivity, setMicSensitivity] = useState(0.7);
  const [activeTab, setActiveTab] = useState<'calibration' | 'logs'>('calibration');

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-slate-100 text-base">Hardware Tuning & Database Logs</h3>
        </div>

        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('calibration')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'calibration' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Servos & Trim
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'logs' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SQLite Logs ({logs.length})
          </button>
        </div>
      </div>

      {activeTab === 'calibration' ? (
        <div className="grid grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> SERVO ARMS CALIBRATION
            </span>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Left Arm Servo Trim</span>
                <span className="font-mono text-cyan-300">{leftArmTrim}°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                value={leftArmTrim}
                onChange={(e) => setLeftArmTrim(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Right Arm Servo Trim</span>
                <span className="font-mono text-cyan-300">{rightArmTrim}°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                value={rightArmTrim}
                onChange={(e) => setRightArmTrim(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> MOTOR & MIC TUNING
            </span>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Right Wheel Speed Multiplier</span>
                <span className="font-mono text-cyan-300">{motorSpeedTrim}x</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.20"
                step="0.01"
                value={motorSpeedTrim}
                onChange={(e) => setMotorSpeedTrim(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Wake-Word Sensitivity Threshold</span>
                <span className="font-mono text-cyan-300">{micSensitivity}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={micSensitivity}
                onChange={(e) => setMicSensitivity(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-6">No interactions logged in SQLite yet.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between text-xs font-mono">
                <div>
                  <span className={`font-bold mr-2 ${log.role === 'user' ? 'text-blue-400' : 'text-cyan-400'}`}>
                    [{log.role.toUpperCase()}]
                  </span>
                  <span className="text-slate-200">{log.content}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-2">{log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}</span>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
