import React from 'react';
import { 
  Calendar, CheckCircle, Clock, AlertCircle, ArrowRight,
  ExternalLink, Sparkles, Battery, CheckSquare, Shield
} from 'lucide-react';

interface HomeViewProps {
  isDark: boolean;
  headBattery: number;
  bodyBattery: number;
  dockState: 'STANDALONE' | 'DOCKED';
  onNavigate: (tab: string, subTab?: string) => void;
  onStartFocus: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  isDark,
  headBattery,
  bodyBattery,
  dockState,
  onNavigate,
  onStartFocus
}) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight font-medium">Good morning, Alex.</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tuesday, 13 October · A little space to do your best work.
          </p>
        </div>

        <button
          onClick={onStartFocus}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-md transition-all flex items-center gap-2 transform active:scale-95 ${
            isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Start a focus session</span>
        </button>
      </div>

      {/* Top 2-Column Hero: Day At A Glance + Still One Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Your Day at a Glance */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3">
              <span className="uppercase tracking-wider font-semibold">Your day, at a glance</span>
              <span>Updated 09:40</span>
            </div>

            <h2 className="text-2xl font-serif font-medium leading-snug">
              A clear morning for the things<br />that matter.
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed max-w-xl">
              Your design review is at 11:00. There are five open tasks in Desk refresh, and your research notes are ready to pick up.
            </p>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/10 dark:border-slate-800 mt-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('companion', 'chat')}
                className={`px-4 py-2 rounded-xl text-xs font-medium text-white transition-all ${
                  isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                }`}
              >
                Plan my morning
              </button>
              <button
                onClick={() => onNavigate('workspace', 'notes')}
                className={`px-4 py-2 rounded-xl text-xs border transition-colors ${
                  isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                }`}
              >
                Open today's notes
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Today's notes · Last edited 09:12</span>
          </div>
        </div>

        {/* Right Column: Still One Robot Status Widget */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Still One</span>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
              dockState === 'DOCKED' 
                ? 'bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-600/30'
                : 'bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-600/30'
            }`}>
              {dockState === 'DOCKED' ? 'Docked robot' : 'Standalone head'}
            </span>
          </div>

          {/* Miniature Robot Visual & Status */}
          <div className="my-4 flex items-center gap-4">
            <div className={`relative w-20 h-24 rounded-2xl border flex flex-col items-center justify-center p-2 shadow-inner shrink-0 ${
              isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#f4f3ea] border-[#dcd9cb]'
            }`}>
              <div className="w-14 h-9 bg-black rounded-lg flex items-center justify-center">
                <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest drop-shadow-[0_0_6px_#06b6d4]">
                  ^  ^
                </span>
              </div>
              <div className="w-12 h-6 -mt-1 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Ready when you are
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Sensors clear<br />
                Calibrated · movement ready
              </div>
            </div>
          </div>

          {/* Battery Status Gauges */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/10 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Head · {headBattery}%</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Body · {bodyBattery}%</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom 3-Column Section: Agenda, Tasks, Needs A Moment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Column 1: Your Agenda */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Your agenda</h3>
              <button 
                onClick={() => onNavigate('workspace', 'planner')} 
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <span>View planner</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-slate-400 shrink-0 w-11">10:00</span>
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Deep work</div>
                  <div className="text-[11px] text-slate-400">Desk refresh · 45 min</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-slate-400 shrink-0 w-11">11:00</span>
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Design review</div>
                  <div className="text-[11px] text-slate-400">Meet · Maya & Noah · 30 min</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-slate-400 shrink-0 w-11">14:00</span>
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Research synthesis</div>
                  <div className="text-[11px] text-slate-400">Studio research · 60 min</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-4 border-t border-slate-700/10 dark:border-slate-800 mt-5 font-mono">
            Google Calendar · Synced 09:38
          </div>
        </div>

        {/* Column 2: Keep Things Moving (Tasks) */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Keep things moving</h3>
              <span className="text-xs text-slate-400 font-mono">3 active</span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-emerald-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Review desk layout</div>
                    <div className="text-[11px] text-slate-400">Desk refresh · Today</div>
                  </div>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  High
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-emerald-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Compare monitor arms</div>
                    <div className="text-[11px] text-slate-400">Desk refresh · Today</div>
                  </div>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 font-semibold">
                  Normal
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded text-emerald-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">Summarize interview notes</div>
                    <div className="text-[11px] text-slate-400">Studio research · Tomorrow</div>
                  </div>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 font-semibold">
                  Normal
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('workspace', 'tasks')}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pt-4 border-t border-slate-700/10 dark:border-slate-800 mt-5 text-left font-medium flex items-center justify-between"
          >
            <span>Open all tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Column 3: Needs a Moment */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Needs a moment</h3>
              <span className="text-xs text-slate-400 font-mono">2 new</span>
            </div>

            <div className="space-y-4">
              {/* Approval Card */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Your approval is needed
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Still prepared a calendar block for deep work. Review before it is added.
                </p>
                <button
                  onClick={() => onNavigate('companion', 'agent')}
                  className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Review action →</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">Agent Console · 09:39</span>
                </button>
              </div>

              {/* Firmware Update Notification */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  A small update for Still One
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Firmware 2.4.1 is available. Install when your companion is charging.
                </p>
                <button
                  onClick={() => onNavigate('settings', 'firmware')}
                  className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
                >
                  View update →
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-4 border-t border-slate-700/10 dark:border-slate-800 mt-5 font-mono">
            Safety boundaries strictly enforced
          </div>
        </div>

      </div>

    </div>
  );
};
