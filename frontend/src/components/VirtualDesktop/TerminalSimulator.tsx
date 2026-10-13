import React, { useState } from 'react';
import { Terminal as TerminalIcon, Play, CornerDownLeft, Trash2 } from 'lucide-react';

interface TerminalSimulatorProps {
  onExecuteCommand: (cmd: string) => void;
  incomingLogs?: string[];
}

interface CommandHistoryItem {
  command: string;
  output: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({ onExecuteCommand }) => {
  const [inputCmd, setInputCmd] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'python server.py',
      output: '[INFO] Uvicorn running on http://0.0.0.0:8088 (Press CTRL+C to quit)\n[INFO] AI Desk Companion REST & WebSocket API active\n[INFO] Connected hardware: Pico UART @ /dev/ttyACM0 (baud 115200)',
      timestamp: '22:14:02',
      type: 'info'
    },
    {
      command: 'pytest tests/test_action.py -v',
      output: '============================= test session starts ==============================\nplatform darwin -- Python 3.12.2, pytest-8.1.1\ncollected 2 items\n\ntests/test_action.py::test_arm_gesture_range PASSED                       [ 50%]\ntests/test_action.py::test_safety_boundary_cutoff PASSED                  [100%]\n\n============================== 2 passed in 0.42s ===============================',
      timestamp: '22:14:28',
      type: 'success'
    }
  ]);

  const runCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    let output = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    const lower = trimmed.toLowerCase();
    if (lower.startsWith('pytest')) {
      output = `============================= test session starts ==============================
rootdir: /Users/abhivalo360gmail.com/Downloads/MDP
collected 4 items

tests/test_action.py::test_arm_gesture_range PASSED                       [ 25%]
tests/test_action.py::test_safety_boundary_cutoff PASSED                  [ 50%]
tests/test_perception.py::test_camera_stream_format PASSED                [ 75%]
tests/test_reasoning.py::test_offline_fallback_response PASSED            [100%]

============================== 4 passed in 0.88s ===============================`;
      type = 'success';
    } else if (lower.startsWith('git status')) {
      output = `On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  modified:   firmware/pico/src/serial_protocol.cpp
  modified:   web-simulator/src/App.tsx

Untracked files:
  web-simulator/src/components/VirtualDesktop/`;
      type = 'info';
    } else if (lower.startsWith('git commit')) {
      output = `[main 7f20c4a] feat(agentic): add multi-agent workstation simulator & software bridges
 6 files changed, 842 insertions(+), 32 deletions(-)
 create mode 100644 web-simulator/src/types/agent.ts`;
      type = 'success';
    } else if (lower.includes('curl') || lower.includes('status')) {
      output = `{"status":"online","device":"AI Desk Companion","privacy_mode":false,"face_state":"idle","agents":["coder","researcher","executive","robot"]}`;
      type = 'success';
    } else if (lower === 'clear') {
      setHistory([]);
      setInputCmd('');
      return;
    } else if (lower === 'help') {
      output = `Supported quick commands:
  pytest                  - Run test suite
  git status              - Check git tracking
  git commit -m "..."     - Commit changes
  python server.py        - Inspect FastAPI backend status
  mcp list                - List registered Model Context Protocol tools
  clear                   - Clear terminal screen`;
      type = 'info';
    } else if (lower.startsWith('mcp')) {
      output = `[MCP Tool Registry]
- devtools.vscode.patch_file: Apply unified diff to code buffer
- devtools.terminal.exec: Run isolated shell command
- workspace.slack.post: Dispatch notification to Slack channel
- workspace.notion.append_task: Insert task into active sprint
- hardware.robot.gesture: Trigger physical arm motor sequence`;
      type = 'info';
    } else {
      output = `bash: command executed: '${trimmed}' [exit code 0]`;
      type = 'info';
    }

    const item: CommandHistoryItem = {
      command: trimmed,
      output,
      timestamp: new Date().toLocaleTimeString(),
      type
    };

    setHistory((prev) => [...prev, item]);
    setInputCmd('');
    onExecuteCommand(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(inputCmd);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Titlebar */}
      <div className="bg-[#161b22] px-3 py-2 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">zsh — Terminal Simulator</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">macOS Darwin arm64</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="bg-[#161b22]/50 px-3 py-1.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-sans">Quick Exec:</span>
        <button
          onClick={() => runCommand('pytest')}
          className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <Play className="w-2.5 h-2.5" /> pytest
        </button>
        <button
          onClick={() => runCommand('git status')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          git status
        </button>
        <button
          onClick={() => runCommand('mcp list')}
          className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-300 transition-colors"
        >
          mcp list
        </button>
        <button
          onClick={() => runCommand('curl http://localhost:8088/')}
          className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 transition-colors"
        >
          ping API
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono leading-relaxed select-text min-h-[220px]">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-emerald-400 font-semibold">dev@workstation</span>
              <span className="text-slate-600">:</span>
              <span className="text-cyan-400">~/Downloads/MDP</span>
              <span className="text-slate-500">$</span>
              <span className="text-slate-100 font-bold">{item.command}</span>
              <span className="text-[10px] text-slate-600 ml-auto">{item.timestamp}</span>
            </div>
            <pre className={`p-2 rounded bg-black/40 text-[11px] whitespace-pre-wrap ${
              item.type === 'success' ? 'text-emerald-300' :
              item.type === 'error' ? 'text-red-400' :
              item.type === 'warning' ? 'text-amber-300' : 'text-slate-300'
            }`}>
              {item.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Input Prompt */}
      <div className="p-2.5 bg-[#161b22] border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 font-semibold shrink-0">dev@workstation</span>
        <span className="text-cyan-400 shrink-0">~/MDP</span>
        <span className="text-slate-500 shrink-0">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type command (e.g. pytest, git status, help)..."
          className="flex-1 bg-transparent text-slate-100 outline-none text-xs font-mono placeholder:text-slate-600"
        />
        <button
          onClick={() => runCommand(inputCmd)}
          className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
