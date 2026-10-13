import React, { useState } from 'react';
import { 
  FileCode, Play, Check, Sparkles, Folder, 
  ChevronRight, ChevronDown, RefreshCw, Terminal, Eye
} from 'lucide-react';

interface VSCodeSimulatorProps {
  onAgentAction: (actionName: string, payload: any) => void;
  onCodeInspect: (fileName: string, content: string) => void;
}

interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
  diffSuggestion?: {
    summary: string;
    oldCode: string;
    newCode: string;
  };
}

const SAMPLE_FILES: CodeFile[] = [
  {
    name: 'serial_protocol.cpp',
    path: 'firmware/pico/src/serial_protocol.cpp',
    language: 'cpp',
    content: `// Pico Serial Packet Protocol Implementation
#include "serial_protocol.h"
#include <hardware/uart.h>

void parse_packet(const uint8_t* buffer, size_t len) {
    if (len < HEADER_SIZE) return;
    
    uint8_t cmd_type = buffer[0];
    uint8_t servo_id = buffer[1];
    uint16_t angle = (buffer[2] << 8) | buffer[3];

    // Check servo hardware limits
    if (angle > 180) {
        log_error("Servo angle exceeded 180 deg bound");
        return;
    }
    
    set_servo_pwm(servo_id, angle);
}`,
    diffSuggestion: {
      summary: 'AI Code Agent: Added safety clamp and CRC checksum verification',
      oldCode: `    if (angle > 180) {\n        log_error("Servo angle exceeded 180 deg bound");\n        return;\n    }`,
      newCode: `    // Auto-clamped by AI Desk Agent for motor protection\n    angle = (angle > 180) ? 180 : (angle < 0 ? 0 : angle);\n    if (!verify_crc16(buffer, len)) return;`
    }
  },
  {
    name: 'test_action.py',
    path: 'tests/test_action.py',
    language: 'python',
    content: `import pytest
from action.action_service import ActionService

def test_arm_gesture_range():
    svc = ActionService()
    res = svc.execute_arm_gesture("wave")
    assert res["status"] == "ok"
    assert res["servo_degrees"] <= 180

def test_safety_boundary_cutoff():
    svc = ActionService()
    res = svc.execute_arm_gesture("invalid_extrema")
    assert res["clamped"] is True`,
  },
  {
    name: 'main.py',
    path: 'ai-desk-companion/main.py',
    language: 'python',
    content: `"""
AI Desk Companion - Main Application Orchestrator
Connects Sensing, Perception, Reasoning, Action, and Storage layers via an async event loop.
"""
import asyncio
from storage.storage_service import StorageService
from sensing.sensing_service import SensingService
from perception.perception_service import PerceptionService
from reasoning.reasoning_service import ReasoningService
from action.action_service import ActionService

class AIDeskCompanion:
    def __init__(self, api_key: str = None):
        print("🤖 Initializing AI Desk Companion System...")
        self.storage = StorageService()
        self.sensing = SensingService()
        self.perception = PerceptionService()
        self.reasoning = ReasoningService()
        self.action = ActionService()`,
  }
];

export const VSCodeSimulator: React.FC<VSCodeSimulatorProps> = ({ onAgentAction, onCodeInspect }) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(SAMPLE_FILES[0]);
  const [codeContent, setCodeContent] = useState<string>(SAMPLE_FILES[0].content);
  const [hasAppliedDiff, setHasAppliedDiff] = useState<boolean>(false);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [explorerOpen, setExplorerOpen] = useState<boolean>(true);

  const handleSelectFile = (file: CodeFile) => {
    setSelectedFile(file);
    setCodeContent(file.content);
    setHasAppliedDiff(false);
  };

  const handleApplyDiff = () => {
    if (!selectedFile.diffSuggestion) return;
    const updated = codeContent.replace(
      selectedFile.diffSuggestion.oldCode,
      selectedFile.diffSuggestion.newCode
    );
    setCodeContent(updated);
    setHasAppliedDiff(true);
    onAgentAction('vscode_apply_patch', {
      file: selectedFile.name,
      patchSummary: selectedFile.diffSuggestion.summary
    });
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    onAgentAction('terminal_exec_pytest', { testFile: selectedFile.name });
    setTimeout(() => {
      setIsRunningTests(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-slate-200 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
      {/* VS Code Titlebar */}
      <div className="bg-[#181825] px-3 py-2 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-400 font-sans ml-2 text-[11px]">
            Visual Studio Code — {selectedFile.path}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCodeInspect(selectedFile.name, codeContent)}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 rounded text-[11px] transition-colors"
            title="Send active buffer context to AI Desk Companion"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Feed to Companion</span>
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded text-[11px] transition-colors"
          >
            {isRunningTests ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-emerald-300" />
            )}
            <span>Run PyTest</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[360px]">
        {/* Explorer Sidebar */}
        <div className={`bg-[#181825] border-r border-slate-800 transition-all ${explorerOpen ? 'w-52' : 'w-10'}`}>
          <div 
            onClick={() => setExplorerOpen(!explorerOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-between font-sans uppercase text-[10px] tracking-wider border-b border-slate-800/60"
          >
            <span>Explorer</span>
            {explorerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          {explorerOpen && (
            <div className="py-2">
              <div className="px-2 py-1 flex items-center gap-1.5 text-slate-400 font-sans text-[11px]">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>ai-desk-companion</span>
              </div>
              <div className="pl-4 flex flex-col gap-0.5 mt-1">
                {SAMPLE_FILES.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => handleSelectFile(f)}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-left transition-colors font-mono text-[11px] ${
                      selectedFile.path === f.path 
                        ? 'bg-[#313244] text-cyan-300 font-medium' 
                        : 'text-slate-400 hover:bg-[#252538] hover:text-slate-200'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${f.name.endsWith('.py') ? 'text-blue-400' : 'text-amber-400'}`} />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1e1e2e]">
          {/* File Tabs */}
          <div className="flex items-center bg-[#181825] border-b border-slate-800 overflow-x-auto">
            {SAMPLE_FILES.map((f) => (
              <div
                key={f.name}
                onClick={() => handleSelectFile(f)}
                className={`flex items-center gap-2 px-3 py-1.5 border-r border-slate-800 text-[11px] cursor-pointer select-none ${
                  selectedFile.path === f.path
                    ? 'bg-[#1e1e2e] text-cyan-300 border-t-2 border-t-cyan-400'
                    : 'text-slate-400 hover:bg-[#1f1f30]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{f.name}</span>
              </div>
            ))}
          </div>

          {/* AI Code Agent Suggestion Banner (if available) */}
          {selectedFile.diffSuggestion && !hasAppliedDiff && (
            <div className="bg-purple-950/40 border-b border-purple-500/30 p-2.5 flex items-center justify-between gap-3 text-[11px] animate-fadeIn">
              <div className="flex items-center gap-2 text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{selectedFile.diffSuggestion.summary}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleApplyDiff}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply Patch</span>
                </button>
              </div>
            </div>
          )}

          {hasAppliedDiff && (
            <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-3 py-1.5 flex items-center gap-2 text-[11px] text-emerald-300">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Patch successfully applied and verified by Code Agent.</span>
            </div>
          )}

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 p-3 overflow-auto flex font-mono leading-relaxed select-text">
            {/* Line numbers */}
            <div className="text-slate-600 pr-3 select-none text-right">
              {codeContent.split('\n').map((_, idx) => (
                <div key={idx} className="h-5 text-[11px]">{idx + 1}</div>
              ))}
            </div>

            {/* Code lines */}
            <div className="flex-1 text-slate-200 pl-2">
              <pre className="text-[11px] font-mono whitespace-pre font-normal text-slate-200">
                {codeContent}
              </pre>
            </div>
          </div>

          {/* VS Code Status Bar */}
          <div className="bg-[#181825] px-3 py-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-sans">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>main* (git)</span>
              </span>
              <span>UTF-8</span>
              <span>{selectedFile.language.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">● AI Desk Copilot Linked</span>
              <span>Ln {codeContent.split('\n').length}, Col 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
