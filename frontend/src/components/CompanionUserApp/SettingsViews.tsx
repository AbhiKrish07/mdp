import React, { useState } from 'react';
import { 
  Sliders, Cpu, Shield, Activity, RefreshCw, Layers,
  Check, X, AlertTriangle, ExternalLink, Moon, Sun, 
  Trash2, Plus, Download, HardDrive, Smartphone
} from 'lucide-react';

interface SettingsViewsProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activeSubTab: 'integrations' | 'models' | 'memory' | 'diagnostics' | 'calibration' | 'firmware';
}

export const SettingsViews: React.FC<SettingsViewsProps> = ({
  isDark,
  onToggleTheme,
  activeSubTab
}) => {
  // Integrations state
  const [calRead, setCalRead] = useState(true);
  const [calCreate, setCalCreate] = useState(true);

  // AI Models state
  const [selectedModel, setSelectedModel] = useState<'balanced' | 'deep' | 'local'>('balanced');
  const [temperature, setTemperature] = useState(0.35);
  const [voiceName, setVoiceName] = useState('Juniper · Calm');

  // Memories state
  const [memories, setMemories] = useState([
    { id: '1', text: 'Prefers concise replies and clear next steps.', date: '10 Oct 2026' },
    { id: '2', text: 'Focused work is best in the morning.', date: '11 Oct 2026' },
    { id: '3', text: 'Desk refresh is the current priority.', date: '12 Oct 2026' },
    { id: '4', text: 'Keep voice volume low during work.', date: '12 Oct 2026' }
  ]);

  // Calibration state
  const [calibrationProgress, setCalibrationProgress] = useState(68);

  // Firmware state
  const [firmwareProgress, setFirmwareProgress] = useState(62);
  const [isSimulatingFwError, setIsSimulatingFwError] = useState(false);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* SUBTAB 1: INTEGRATIONS (PAGE 20) */}
      {activeSubTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-6 rounded-3xl border transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <h1 className="text-2xl font-serif font-medium">Connect only what you need.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bring your everyday tools into Still, with clear permissions.
              </p>
            </div>

            <div className="divide-y divide-slate-700/10 dark:divide-slate-800 pt-2 text-xs">
              {/* Google Calendar */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Google Calendar</div>
                  <div className="text-[11px] text-slate-400 font-mono">alex.chen@example.com · Synced 09:38</div>
                </div>
                <button className={`px-3 py-1.5 rounded-xl border ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cc]'
                }`}>
                  Manage
                </button>
              </div>

              {/* Notion */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Notion</div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">Token expired · Last synced yesterday</div>
                </div>
                <button className="px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  Reconnect
                </button>
              </div>

              {/* Local files */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Local files</div>
                  <div className="text-[11px] text-slate-400 font-mono">~/Documents/Still · 12 files indexed</div>
                </div>
                <button className={`px-3 py-1.5 rounded-xl border ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cc]'
                }`}>
                  Manage
                </button>
              </div>

              {/* Apple Reminders */}
              <div className="py-3 flex items-center justify-between opacity-60">
                <div>
                  <div className="font-semibold">Apple Reminders</div>
                  <div className="text-[11px] text-slate-400">Not connected</div>
                </div>
                <button className={`px-3 py-1.5 rounded-xl border ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cc]'
                }`}>
                  Connect
                </button>
              </div>

              {/* Slack */}
              <div className="py-3 flex items-center justify-between opacity-60">
                <div>
                  <div className="font-semibold">Slack</div>
                  <div className="text-[11px] text-slate-400">Not connected</div>
                </div>
                <button className={`px-3 py-1.5 rounded-xl border ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cc]'
                }`}>
                  Connect
                </button>
              </div>
            </div>
          </div>

          {/* Right Permissions Panel */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Google Calendar</h3>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">alex.chen@example.com</div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400">Allowed access</span>
                <div className="flex items-center justify-between">
                  <span>Read personal calendar</span>
                  <button onClick={() => setCalRead(!calRead)} className={`w-9 h-5 rounded-full transition-colors relative ${calRead ? 'bg-[#3b4d3c]' : 'bg-slate-300'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${calRead ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Create events with approval</span>
                  <button onClick={() => setCalCreate(!calCreate)} className={`w-9 h-5 rounded-full transition-colors relative ${calCreate ? 'bg-[#3b4d3c]' : 'bg-slate-300'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${calCreate ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                Still asks before creating, changing, or deleting an event. Permissions can be revoked at any time.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 flex items-center justify-between text-xs">
              <button className="text-emerald-600 dark:text-emerald-400 font-medium">Sync now</button>
              <button className="text-red-500 hover:underline">Disconnect</button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: AI MODELS (PAGE 21) */}
      {activeSubTab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <h1 className="text-2xl font-serif font-medium">Choose how Still thinks.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Balance response quality, speed, and where your data is processed.
              </p>
            </div>

            {/* Model Cards */}
            <div className="space-y-3">
              <div 
                onClick={() => setSelectedModel('balanced')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedModel === 'balanced'
                    ? (isDark ? 'bg-[#2c332d] border-emerald-800 text-emerald-200' : 'bg-[#edf5ee] border-[#c2dec6] text-[#244228]')
                    : 'border-slate-700/10 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Still Balanced</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/10">Default</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Cloud · Everyday conversation and workspace reasoning
                </p>
              </div>

              <div 
                onClick={() => setSelectedModel('deep')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedModel === 'deep'
                    ? (isDark ? 'bg-[#2c332d] border-emerald-800 text-emerald-200' : 'bg-[#edf5ee] border-[#c2dec6] text-[#244228]')
                    : 'border-slate-700/10 dark:border-slate-800'
                }`}
              >
                <div className="font-semibold text-xs">Still Deep</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Cloud · More considered answers for complex work
                </p>
              </div>

              <div 
                onClick={() => setSelectedModel('local')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedModel === 'local'
                    ? (isDark ? 'bg-[#2c332d] border-emerald-800 text-emerald-200' : 'bg-[#edf5ee] border-[#c2dec6] text-[#244228]')
                    : 'border-slate-700/10 dark:border-slate-800'
                }`}
              >
                <div className="font-semibold text-xs">Still Local</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  On this computer · Offline text and private notes (2.1 GB)
                </p>
              </div>
            </div>

            {/* Response Style Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Response style</span>
                <span className="font-mono text-slate-400">Exploratory: {temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>More precise</span>
                <span>More exploratory</span>
              </div>
            </div>

            {/* Appearance Theme Selector (Page 21) */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-700/10 dark:border-slate-800">
              <span className="text-xs font-semibold">Appearance</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-700/10 dark:border-slate-800 text-xs">
                <button
                  onClick={isDark ? onToggleTheme : undefined}
                  className={`px-3 py-1 rounded-lg ${!isDark ? 'bg-slate-200 font-bold' : ''}`}
                >
                  Light
                </button>
                <button
                  onClick={!isDark ? onToggleTheme : undefined}
                  className={`px-3 py-1 rounded-lg ${isDark ? 'bg-slate-800 font-bold' : ''}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Right Info Box */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Processing & privacy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cloud models receive your message and only the context you allow. Local models keep processing on your computer, but don't support every capability.
              </p>

              <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400">Offline fallback</span>
                <div className="text-xs font-semibold mt-1">Ready for offline chat</div>
                <div className="text-[11px] text-slate-400 font-mono">Local model downloaded · 2.1 GB</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-[11px] text-slate-400">
              Agent actions still need approval.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MEMORY & PRIVACY (PAGE 22) */}
      {activeSubTab === 'memory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-6 rounded-3xl border transition-colors shadow-sm space-y-5 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <h1 className="text-2xl font-serif font-medium">A companion with boundaries.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Decide what Still can remember, see, and hear.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Saved memories · {memories.length}</span>
                <button className={`px-2.5 py-1 rounded-lg border text-xs ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cb]'
                }`}>
                  Add memory
                </button>
              </div>

              <div className="space-y-2">
                {memories.map(m => (
                  <div key={m.id} className="p-3.5 rounded-2xl border border-slate-700/10 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-800 dark:text-slate-200">{m.text}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">You shared this · {m.date}</div>
                    </div>
                    <button 
                      onClick={() => setMemories(memories.filter(x => x.id !== m.id))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800">
              <button 
                onClick={() => setMemories([])}
                className="text-xs text-red-500 hover:underline"
              >
                Delete all memories
              </button>
            </div>
          </div>

          {/* Right Permissions Panel */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-semibold">Device permissions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Microphone</div>
                    <div className="text-[10px] text-slate-400">Only while voice is active</div>
                  </div>
                  <span className="text-emerald-500 font-bold">ON</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Camera</div>
                    <div className="text-[10px] text-slate-400">Only in Vision Studio</div>
                  </div>
                  <span className="text-emerald-500 font-bold">ON</span>
                </div>
                <div className="flex items-center justify-between opacity-60">
                  <div>
                    <div className="font-medium">Background listening</div>
                    <div className="text-[10px] text-slate-400">Off · no wake word detection</div>
                  </div>
                  <span className="text-slate-400 font-bold">OFF</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed pt-2">
                The physical microphone mute and camera shutter always override app permissions.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-[11px] text-slate-400">
              Data retention: 30 days history
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DIAGNOSTICS (PAGE 23) */}
      {activeSubTab === 'diagnostics' && (
        <div className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium">Everything, in good order.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Connection health, sensor readings, and recent device activity.
              </p>
            </div>
            <button className={`px-4 py-2 rounded-xl text-xs font-medium text-white shadow-sm ${
              isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
            }`}>
              Run health check
            </button>
          </div>

          {/* Telemetry Matrix (Page 23) */}
          <div className="divide-y divide-slate-700/10 dark:divide-slate-800 text-xs font-mono">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Front proximity</span>
              <span className="text-emerald-500 font-bold">48 cm · clear (Normal)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Edge detection</span>
              <span className="text-emerald-500 font-bold">Surface detected (Normal)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Body orientation</span>
              <span className="text-emerald-500 font-bold">0.4° pitch / 0.2° roll (Normal)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Wheel encoders</span>
              <span className="text-emerald-500 font-bold">Stationary · 0 ticks/s (Normal)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Head camera</span>
              <span className="text-emerald-500 font-bold">1080p · shutter open (Normal)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Microphone array</span>
              <span className="text-emerald-500 font-bold">Input available (Normal)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Dock contact</span>
              <span className="text-emerald-500 font-bold">Head seated (Normal)</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: CALIBRATION (PAGE 24) */}
      {activeSubTab === 'calibration' && (
        <div className={`p-8 rounded-3xl border text-center transition-colors shadow-sm space-y-6 max-w-2xl mx-auto ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">STEP 2 OF 3</span>
            <h2 className="text-2xl font-serif font-medium mt-1">Checking your surface</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Still is checking level, edge distance, and wheel alignment. Leave at least 30 cm of clear space around the robot.
            </p>
          </div>

          {/* 30 cm clearance box visualizer */}
          <div className="py-4">
            <div className="relative w-64 h-44 mx-auto border-2 border-dashed border-stone-400/50 rounded-2xl flex items-center justify-center p-4">
              <span className="text-[10px] font-mono text-slate-400 absolute top-2">30 cm clear on all sides</span>
              <div className="w-16 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <span className="text-xs font-mono text-cyan-400 font-bold">^ ^</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Checking edge sensors…</span>
              <span className="font-bold text-emerald-500">{calibrationProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                style={{ width: `${calibrationProgress}%` }}
                className="h-full bg-emerald-600 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button className={`px-5 py-2.5 rounded-xl text-xs font-medium text-white shadow-sm ${
              isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
            }`}>
              Continue
            </button>
            <button className={`px-4 py-2.5 rounded-xl text-xs border ${
              isDark ? 'border-slate-700' : 'border-[#d8d6cb]'
            }`}>
              Cancel calibration
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 6: FIRMWARE (PAGES 25-26) */}
      {activeSubTab === 'firmware' && (
        <div className={`p-8 rounded-3xl border transition-colors shadow-sm space-y-6 max-w-2xl mx-auto ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <h1 className="text-2xl font-serif font-medium">A little better, over time.</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Firmware updates for your head and robot body.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-700/10 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold">Still One · 2.4.1</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Released 13 Oct 2026 · Head + body · 84 MB</div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
              Installing {firmwareProgress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                style={{ width: `${firmwareProgress}%` }}
                className="h-full bg-emerald-600 transition-all duration-300"
              />
            </div>
            <div className="text-[10px] text-slate-400">About 2 minutes remaining · 52.1 of 84 MB</div>
          </div>

          <div className="space-y-2 text-xs font-mono text-left pt-2">
            <div className="flex items-center gap-2 text-emerald-500">
              <Check className="w-3.5 h-3.5" />
              <span>Download & verify (Package verified)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Install on head (In progress)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block"></span>
              <span>Install on body (Waiting)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed text-left pt-2 border-t border-slate-700/10 dark:border-slate-800">
            If the connection drops, Still pauses safely and shows recovery steps. Your workspace data is not affected.
          </p>
        </div>
      )}

    </div>
  );
};
