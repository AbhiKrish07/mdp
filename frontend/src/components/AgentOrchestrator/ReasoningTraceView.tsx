import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import type { ToolCallRecord } from '../../types/agent';

interface ReasoningTraceViewProps {
  toolCalls: ToolCallRecord[];
  onClearLogs?: () => void;
}

export const ReasoningTraceView: React.FC<ReasoningTraceViewProps> = ({ toolCalls, onClearLogs }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-slate-100 text-sm">Agentic Tool Calling & Reasoning Stream (ReAct)</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800">
            {toolCalls.length} Dispatched Tools
          </span>
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {toolCalls.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/60 text-center text-slate-500">
            No active tool calls yet. Interact with the chat or run an agent task above to inspect the ReAct trace.
          </div>
        ) : (
          toolCalls.map((tc) => {
            const isExpanded = !!expandedIds[tc.id];
            return (
              <div
                key={tc.id}
                className="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden text-xs font-mono"
              >
                <div
                  onClick={() => toggleExpand(tc.id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 select-none transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold text-[10px]">
                      {tc.agent.toUpperCase()}
                    </span>
                    <span className="text-cyan-300 font-bold">{tc.toolName}</span>
                    <span className="text-slate-500 text-[10px]">{tc.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">{tc.executionMs}ms</span>
                    {tc.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 border-t border-slate-800/80 bg-black/40 space-y-2 text-[11px]">
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                        Input Parameters:
                      </div>
                      <pre className="p-2 rounded bg-slate-950 text-slate-300 overflow-x-auto border border-slate-800/60">
                        {JSON.stringify(tc.input, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                        Execution Output:
                      </div>
                      <pre className="p-2 rounded bg-slate-950 text-emerald-300 overflow-x-auto border border-slate-800/60">
                        {JSON.stringify(tc.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
