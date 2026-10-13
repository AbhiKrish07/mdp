import React from 'react';
import { Code2, Search, Calendar, Cpu, Zap, Activity } from 'lucide-react';
import type { AgentInfo, AgentRole } from '../../types/agent';

interface MultiAgentSwarmProps {
  agents: AgentInfo[];
  activeAgent: AgentRole;
  onSelectAgent: (role: AgentRole) => void;
  onTriggerAgentTask: (role: AgentRole, taskDescription: string) => void;
}

export const MultiAgentSwarm: React.FC<MultiAgentSwarmProps> = ({
  agents,
  activeAgent,
  onSelectAgent,
  onTriggerAgentTask
}) => {
  const getAgentIcon = (role: AgentRole) => {
    switch (role) {
      case 'coder': return <Code2 className="w-4 h-4 text-cyan-400" />;
      case 'researcher': return <Search className="w-4 h-4 text-purple-400" />;
      case 'executive': return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'robot': return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: AgentInfo['status']) => {
    switch (status) {
      case 'acting':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">ACTING</span>;
      case 'thinking':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">THINKING</span>;
      case 'waiting':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">WAITING</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">IDLE</span>;
    }
  };

  return (
    <div className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm">Autonomous Multi-Agent Swarm</h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800">
          4 Agents Active • ReAct Tool Calling
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {agents.map((ag) => (
          <div
            key={ag.id}
            onClick={() => onSelectAgent(ag.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              activeAgent === ag.id
                ? 'bg-slate-900 border-cyan-500/70 shadow-[0_0_15px_rgba(0,242,254,0.15)] ring-1 ring-cyan-500/50'
                : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                  {getAgentIcon(ag.id)}
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-xs">{ag.name}</div>
                  <div className="text-[10px] text-slate-400">{ag.title}</div>
                </div>
              </div>
              {getStatusBadge(ag.status)}
            </div>

            <div className="text-[11px] text-slate-300 bg-black/30 p-1.5 rounded border border-slate-800/50 min-h-[34px] line-clamp-2">
              {ag.currentTask || 'Awaiting software triggers or user prompt'}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
              <span>Tools used: {ag.toolsUsedCount}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerAgentTask(ag.id, `Trigger manual cycle for ${ag.name}`);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                <span>Run Loop</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
