import React, { useState } from 'react';
import { 
  CheckCircle, PauseCircle, Clock, AlertTriangle, X, 
  ArrowRight, ShieldCheck, Check, Calendar, FileText
} from 'lucide-react';

interface AgentConsoleViewProps {
  isDark: boolean;
  onNavigateToCalendar?: () => void;
}

export const AgentConsoleView: React.FC<AgentConsoleViewProps> = ({
  isDark,
  onNavigateToCalendar
}) => {
  const [activeFilter, setActiveFilter] = useState<'active' | 'completed' | 'canceled'>('active');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionApproved, setActionApproved] = useState(false);
  const [actionRejected, setActionRejected] = useState(false);
  const [actionEdited, setActionEdited] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);

  // Audio chime feedback
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleApprove = () => {
    setActionApproved(true);
    playChime();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn relative">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight font-medium">Agent Console</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Follow each step. You decide what happens next.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button 
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              activeFilter === 'active' 
                ? (isDark ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-slate-200 border-slate-300 text-slate-900 font-bold') 
                : 'border-transparent text-slate-400'
            }`}
          >
            Active · 1
          </button>
          <button 
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              activeFilter === 'completed' 
                ? (isDark ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-slate-200 border-slate-300 text-slate-900 font-bold') 
                : 'border-transparent text-slate-400'
            }`}
          >
            Completed · 8
          </button>
          <button 
            onClick={() => setActiveFilter('canceled')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              activeFilter === 'canceled' 
                ? (isDark ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-slate-200 border-slate-300 text-slate-900 font-bold') 
                : 'border-transparent text-slate-400'
            }`}
          >
            Canceled · 2
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tasks Overview + Right Detailed Execution Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Recent Runs */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div className="space-y-4">
            {/* Active Run Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#2c332d] border-emerald-800 text-emerald-200' : 'bg-[#edf5ee] border-[#c2dec6] text-[#244228]'
            }`}>
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider">Awaiting your approval</div>
              <h3 className="text-sm font-semibold mt-1">Plan my morning</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Started 09:34 · From chat<br />
                Run A-108 · 3 of 4 steps<br />
                Calendar · Tasks · Notes
              </p>
            </div>

            {/* Recent Activity List */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Recent Activity</span>
              <div className="space-y-3 mt-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-700/10 dark:border-slate-800">
                  <div className="font-medium">Summarize interview notes</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Yesterday, 16:48 · Completed</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-700/10 dark:border-slate-800">
                  <div className="font-medium">Organize research folder</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">12 Oct · Completed</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-700/10 dark:border-slate-800">
                  <div className="font-medium">Find monitor arm options</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">12 Oct · Completed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-[11px] text-slate-400">
            External actions always pause for user consent.
          </div>
        </div>

        {/* Right Column: Execution Flow Steps (Pages 8-9) */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/10 dark:border-slate-800 mb-5">
              <div>
                <h2 className="text-xl font-serif font-medium">Plan my morning</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                  "Make space for focused work before my design review."
                </p>
              </div>

              {!isCanceled && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className={`px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#d8d6cc] hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel run
                </button>
              )}
            </div>

            {/* Timeline Steps */}
            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Read today's calendar</div>
                  <div className="text-[11px] text-slate-400 font-mono">09:34:02 · 3 events found · Read-only</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Check active tasks</div>
                  <div className="text-[11px] text-slate-400 font-mono">09:34:04 · 3 tasks in Desk refresh and Studio research</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Draft a focus block</div>
                  <div className="text-[11px] text-slate-400 font-mono">09:34:08 · 10:00–10:45 · No conflicts</div>
                </div>
              </div>

              {/* Step 4: Add event to calendar (Interactive Approval Gate) */}
              <div className="flex items-start gap-3">
                {actionApproved ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : actionRejected ? (
                  <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                ) : isCanceled ? (
                  <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                ) : (
                  <PauseCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                )}
                <div className="flex-1">
                  <div className="text-xs font-semibold">Add event to calendar</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {actionApproved ? '09:39:12 · Event confirmed on Google Calendar' :
                     actionRejected ? 'Rejected by user · No event created' :
                     isCanceled ? 'Run canceled' : 'Paused · Your approval is required'}
                  </div>

                  {/* APPROVAL CARD */}
                  {!actionApproved && !actionRejected && !isCanceled && (
                    <div className={`mt-3 p-5 rounded-2xl border text-xs space-y-3.5 transition-all ${
                      isDark ? 'bg-[#292e27] border-[#445b41]' : 'bg-[#fcf8ec] border-[#e6dcbe]'
                    }`}>
                      <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
                        <Calendar className="w-4 h-4" />
                        <span>Allow Still to create this event?</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-500/20 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Deep work · Desk refresh
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Tue, 13 Oct · 10:00–10:45 · Google Calendar / Personal
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1">
                          One event will be created. No invitations will be sent.
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={handleApprove}
                          className={`px-4 py-2 rounded-xl text-xs font-medium text-white shadow-md transition-all ${
                            isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                          }`}
                        >
                          Approve once
                        </button>
                        <button
                          onClick={() => setActionEdited(true)}
                          className={`px-3 py-2 rounded-xl text-xs border transition-colors ${
                            isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-white'
                          }`}
                        >
                          Edit event
                        </button>
                        <button
                          onClick={() => setActionRejected(true)}
                          className={`px-3 py-2 rounded-xl text-xs border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirmed Banner */}
                  {actionApproved && (
                    <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Event successfully committed to personal calendar.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-5 border-t border-slate-700/10 dark:border-slate-800 mt-6">
            External changes always pause for approval. This run has not changed your calendar without verification.
          </div>
        </div>

      </div>

      {/* PAGE 9 CONFIRMATION MODAL: CANCEL THIS RUN? */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-700 text-slate-100' : 'bg-white border-[#d8d6cc] text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-medium">Cancel this run?</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Still will stop "Plan my morning" and discard the pending calendar action. The three completed read-only steps will remain in your activity history.
            </p>

            {/* Info notice box */}
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isDark ? 'bg-[#1b251d] border-emerald-800/40 text-emerald-200' : 'bg-[#eef5ef] border-[#cbe1ce] text-[#29482d]'
            }`}>
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>No changes to undo</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                No event has been created. Your calendar and tasks will stay as they are.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className={`px-4 py-2 rounded-xl text-xs border transition-colors ${
                  isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                }`}
              >
                Keep running
              </button>
              <button
                onClick={() => {
                  setIsCanceled(true);
                  setShowCancelModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-500 shadow-md transition-all"
              >
                Cancel run
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
