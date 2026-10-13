import { useState, useEffect } from 'react';
import { RobotFace } from './components/RobotFace';
import type { FaceState } from './components/RobotFace';
import { DeskSimulator } from './components/DeskSimulator';
import { VisionScanner } from './components/VisionScanner';
import { VoiceChat } from './components/VoiceChat';
import { SituationalTimer } from './components/SituationalTimer';
import { CalibrationPanel } from './components/CalibrationPanel';

// Virtual Desktop & Softwares
import { VSCodeSimulator } from './components/VirtualDesktop/VSCodeSimulator';
import { TerminalSimulator } from './components/VirtualDesktop/TerminalSimulator';
import { SlackWorkspace } from './components/VirtualDesktop/SlackWorkspace';
import { NotionWorkspace } from './components/VirtualDesktop/NotionWorkspace';
import { SystemMonitorWidget } from './components/VirtualDesktop/SystemMonitorWidget';

// Multi-Agent Swarm & Integrations
import { MultiAgentSwarm } from './components/AgentOrchestrator/MultiAgentSwarm';
import { ReasoningTraceView } from './components/AgentOrchestrator/ReasoningTraceView';
import { IntegrationsPanel } from './components/IntegrationsHub/IntegrationsPanel';
import { ModularCompanionView } from './components/ModularCompanionView';
import { CompanionUserApp } from './components/CompanionUserApp/CompanionUserApp';

import type { AgentInfo, AgentRole, ToolCallRecord, VirtualAppId } from './types/agent';
import { 
  Bot, Shield, Wifi, LayoutDashboard, Terminal as TerminalIcon, 
  Code2, MessageSquare, BookOpen, Layers, Sparkles, Sliders, Boxes, Smartphone 
} from 'lucide-react';

export default function App() {
  const [faceState, setFaceState] = useState<FaceState>('idle');
  const [currentGesture, setCurrentGesture] = useState<string>('neutral');
  const [privacyActive, setPrivacyActive] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Active view navigation - Default to the Still One Figma Companion User App
  const [mainView, setMainView] = useState<'workstation' | 'robot' | 'modular' | 'agents' | 'integrations' | 'calibration' | 'deskbot' | 'figma'>('figma');
  const [virtualApp, setVirtualApp] = useState<VirtualAppId>('vscode');
  const [userAppDisplayMode, setUserAppDisplayMode] = useState<'interactive' | 'figma'>('interactive');

  // Multi-Agent Swarm State
  const [activeAgentRole, setActiveAgentRole] = useState<AgentRole>('coder');
  const [agents, setAgents] = useState<AgentInfo[]>([
    {
      id: 'coder',
      name: 'Code Agent',
      title: 'Active Buffer & Diagnostics',
      avatar: '💻',
      color: '#00f2fe',
      status: 'idle',
      currentTask: 'Monitoring VS Code editor buffer and pytest suites',
      toolsUsedCount: 3
    },
    {
      id: 'researcher',
      name: 'Research Agent',
      title: 'Docs & Web Search',
      avatar: '🔍',
      color: '#7f00ff',
      status: 'idle',
      currentTask: 'Indexed Raspberry Pi Pico SDK UART docs & Pinout schemas',
      toolsUsedCount: 2
    },
    {
      id: 'executive',
      name: 'Executive Agent',
      title: 'Agenda & Wellness Sync',
      avatar: '📋',
      color: '#ffb302',
      status: 'idle',
      currentTask: 'Tracking sit timer (25 min elapsed) and Notion sprint tasks',
      toolsUsedCount: 4
    },
    {
      id: 'robot',
      name: 'Physical Robot Agent',
      title: 'Desk Kinematics & Vision',
      avatar: '🤖',
      color: '#10b981',
      status: 'idle',
      currentTask: 'Edge avoidance radar online; tracking physical desk workspace',
      toolsUsedCount: 5
    }
  ]);

  // ReAct Tool Calls Record
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([
    {
      id: 'tc-1',
      timestamp: '22:12:05',
      agent: 'coder',
      toolName: 'devtools.vscode.inspect_buffer',
      input: { file: 'firmware/pico/src/serial_protocol.cpp', lineCount: 24 },
      output: { status: 'ok', symbolsFound: ['parse_packet', 'set_servo_pwm'] },
      status: 'success',
      executionMs: 42
    },
    {
      id: 'tc-2',
      timestamp: '22:13:30',
      agent: 'robot',
      toolName: 'hardware.robot.servo_kinematics',
      input: { servo: 'arm_left', angle: 45, speed: 'smooth' },
      output: { status: 'acknowledged', pwm_us: 1520 },
      status: 'success',
      executionMs: 18
    }
  ]);

  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    expression?: FaceState;
    gesture?: string;
  }>>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am your AI Desk Companion & Agentic Workstation Co-pilot. I am monitoring your physical desk and your user softwares (VS Code, Terminal, Slack, and Notion). How can I assist you right now?",
      timestamp: '10:00:00 AM',
      expression: 'idle'
    }
  ]);

  // Ping Python FastAPI backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:8088/', { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          setBackendOnline(true);
          setPrivacyActive(data.privacy_mode);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const recordToolCall = (agent: AgentRole, toolName: string, input: any, output: any, ms = 45) => {
    const record: ToolCallRecord = {
      id: `tc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      agent,
      toolName,
      input,
      output,
      status: 'success',
      executionMs: ms
    };
    setToolCalls((prev) => [record, ...prev]);
    setAgents((prev) =>
      prev.map((ag) => (ag.id === agent ? { ...ag, toolsUsedCount: ag.toolsUsedCount + 1 } : ag))
    );
  };

  const handleSendMessage = async (query: string, visionContext?: string) => {
    if (privacyActive) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setFaceState('thinking');

    // Update agent statuses
    setAgents((prev) =>
      prev.map((ag) => ({ ...ag, status: ag.id === 'coder' ? 'acting' : 'thinking' }))
    );

    // Call Python backend if online
    if (backendOnline) {
      try {
        const res = await fetch('http://localhost:8088/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, vision_context: visionContext, api_key: apiKey })
        });
        const data = await res.json();

        setFaceState(data.expression || 'speaking');
        if (data.gesture) {
          setCurrentGesture(data.gesture);
          setTimeout(() => setCurrentGesture('neutral'), 2500);
        }

        recordToolCall('robot', 'fastapi.orchestrate_query', { query }, data, 120);

        const botMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.assistant_reply || "I've handled that with the companion agent pipeline!",
          timestamp: new Date().toLocaleTimeString(),
          expression: data.expression,
          gesture: data.gesture
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsProcessing(false);
        setAgents((prev) => prev.map((ag) => ({ ...ag, status: 'idle' })));
        setTimeout(() => setFaceState('idle'), 3500);
        return;
      } catch (err) {
        console.warn("Backend request failed, falling back to Web Client Engine:", err);
      }
    }

    // Web Dual-Mode Agentic Engine with Autonomous Tool Dispatching
    setTimeout(() => {
      let reply = "I'm right here at your desk monitoring your workspace and connected software suites.";
      let exp: FaceState = 'speaking';
      let gest = 'neutral';
      const q = query.toLowerCase();

      if (q.includes('test') || q.includes('pytest')) {
        recordToolCall('coder', 'devtools.terminal.exec_pytest', { suite: 'tests/test_action.py' }, { passed: 4, failed: 0, duration: '0.42s' }, 85);
        reply = "I ran pytest across your test suite in the virtual terminal. All 4 tests passed with zero failures!";
        exp = 'happy';
        gest = 'point';
      } else if (q.includes('patch') || q.includes('fix') || q.includes('code') || q.includes('bug')) {
        recordToolCall('coder', 'devtools.vscode.apply_patch', { file: 'serial_protocol.cpp', fix: 'clamp servo 180 deg' }, { patchApplied: true }, 55);
        reply = "Code Agent detected the bounds issue in serial_protocol.cpp and prepared a safety clamp patch. You can review and apply it in the VS Code tab!";
        exp = 'happy';
        gest = 'wave';
      } else if (q.includes('slack') || q.includes('post') || q.includes('team')) {
        recordToolCall('executive', 'workspace.slack.post_message', { channel: '#desk-companion-bot', text: 'Telemetry status green' }, { ok: true }, 60);
        reply = "I posted an update to the engineering team on Slack (#desk-companion-bot) confirming our station status.";
        exp = 'happy';
        gest = 'wave';
      } else if (q.includes('notion') || q.includes('task') || q.includes('sprint')) {
        recordToolCall('executive', 'workspace.notion.append_task', { title: 'Review robot edge telemetry', sprint: 'Week 42' }, { pageId: 'notion-992' }, 70);
        reply = "I synchronized the new task with your Notion sprint backlog. It's listed under active engineering items.";
        exp = 'thinking';
        gest = 'point';
      } else if (visionContext) {
        recordToolCall('robot', 'perception.vision.inspect_item', { context: visionContext }, { recognized: true, confidence: 0.94 }, 110);
        reply = `I inspected the physical item on your desk! ${visionContext}. Everything looks ready for your circuit prototype.`;
        exp = 'happy';
        gest = 'point';
      } else if (q.includes('break') || q.includes('stretch') || q.includes('posture')) {
        recordToolCall('executive', 'wellness.posture.trigger_nudge', { reason: 'Sit threshold reached' }, { alertDispatched: true }, 30);
        reply = "Great timing for a posture reset! Roll your shoulders back and take a 2-minute stretch break.";
        exp = 'nudge';
        gest = 'wave';
      } else if (q.includes('hello') || q.includes('hi')) {
        reply = "Hello! Your multi-agent workstation is fully linked: VS Code, Terminal, Slack, Notion, and Desk Robot are online. What are we building today?";
        exp = 'happy';
        gest = 'wave';
      }

      setFaceState(exp);
      setCurrentGesture(gest);
      setTimeout(() => setCurrentGesture('neutral'), 2500);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: reply,
        timestamp: new Date().toLocaleTimeString(),
        expression: exp,
        gesture: gest
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsProcessing(false);
      setAgents((prev) => prev.map((ag) => ({ ...ag, status: 'idle' })));
      setTimeout(() => setFaceState('idle'), 3500);
    }, 900);
  };

  const handleScanComplete = (summary: string, prompt: string) => {
    handleSendMessage(prompt, summary);
  };

  const handleTogglePrivacy = async () => {
    const nextState = !privacyActive;
    setPrivacyActive(nextState);
    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/privacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ privacy_active: nextState })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleTriggerBreakNudge = () => {
    setFaceState('nudge');
    setCurrentGesture('wave');
    recordToolCall('executive', 'wellness.posture.trigger_nudge', { manualTrigger: true }, { ok: true }, 20);
    setTimeout(() => {
      setFaceState('idle');
      setCurrentGesture('neutral');
    }, 4000);
  };

  const handleCodeInspect = (fileName: string, content: string) => {
    recordToolCall('coder', 'devtools.vscode.inspect_buffer', { fileName, bytes: content.length }, { lines: content.split('\n').length }, 35);
    handleSendMessage(`I am currently looking at ${fileName} in VS Code. Please analyze it for any safety or hardware integration issues.`);
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c111d]/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-slate-950">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-100 flex items-center gap-2">
              AI Desk Companion & Workstation OS Simulator
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Agentic v2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Desk Robot Companion + Virtual Software Environment (VS Code, Terminal, Slack, Notion)</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMainView('workstation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'workstation'
                ? 'bg-cyan-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Unified Workstation</span>
          </button>

          <button
            onClick={() => setMainView('robot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'robot'
                ? 'bg-cyan-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Robot & Desk View</span>
          </button>

          <button
            onClick={() => setMainView('modular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'modular'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-purple-300" />
            <span>Modular Muse & Dock</span>
          </button>

          <button
            onClick={() => setMainView('agents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'agents'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Agent Swarm</span>
          </button>

          <button
            onClick={() => setMainView('integrations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'integrations'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Software Bridges</span>
          </button>

          <button
            onClick={() => setMainView('calibration')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'calibration'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Hardware Logs</span>
          </button>

          <button
            onClick={() => setMainView('deskbot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'deskbot'
                ? 'bg-amber-600 text-white font-bold shadow-md'
                : 'text-amber-400 hover:text-amber-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Deskbot Sim (:3001)</span>
          </button>

          <button
            onClick={() => setMainView('figma')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mainView === 'figma'
                ? 'bg-pink-600 text-white font-bold shadow-md'
                : 'text-pink-400 hover:text-pink-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-pink-400" />
            <span>User App (Figma)</span>
          </button>
        </div>

        {/* Status Indicators & Privacy Cutoff */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Wifi className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{backendOnline ? 'Python FastAPI (Port 8088) Online' : 'Dual-Mode Web Simulator'}</span>
          </div>

          <button
            onClick={handleTogglePrivacy}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
              privacyActive
                ? 'bg-red-500 hover:bg-red-400 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{privacyActive ? 'PRIVACY HARD CUTOFF' : 'Hardware Active'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Multi-Agent Swarm Header Bar */}
        <MultiAgentSwarm
          agents={agents}
          activeAgent={activeAgentRole}
          onSelectAgent={setActiveAgentRole}
          onTriggerAgentTask={(role, taskDesc) => {
            recordToolCall(role, `${role}.autonomous_cycle`, { description: taskDesc }, { dispatched: true });
            handleSendMessage(`Run an autonomous agent task for ${role}: ${taskDesc}`);
          }}
        />

        {/* VIEW 1: UNIFIED WORKSTATION (Side-by-side Physical Robot + Virtual Desktop Softwares) */}
        {mainView === 'workstation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Cols: Physical Robot Companion & Chat */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RobotFace
                state={faceState}
                privacyActive={privacyActive}
              />

              <SituationalTimer
                privacyActive={privacyActive}
                onTogglePrivacy={handleTogglePrivacy}
                onTriggerBreakNudge={handleTriggerBreakNudge}
              />

              <VoiceChat
                messages={messages}
                onSendMessage={(q) => handleSendMessage(q)}
                apiKey={apiKey}
                onUpdateApiKey={setApiKey}
                privacyActive={privacyActive}
                isProcessing={isProcessing}
              />

              <SystemMonitorWidget />
            </div>

            {/* Right 7 Cols: Interactive Virtual Desktop OS Softwares */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Virtual App Switcher Bar */}
              <div className="bg-[#121620] border border-slate-800 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setVirtualApp('vscode')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      virtualApp === 'vscode'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>VS Code</span>
                  </button>

                  <button
                    onClick={() => setVirtualApp('terminal')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      virtualApp === 'terminal'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Terminal</span>
                  </button>

                  <button
                    onClick={() => setVirtualApp('slack')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      virtualApp === 'slack'
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Slack</span>
                  </button>

                  <button
                    onClick={() => setVirtualApp('notion')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      virtualApp === 'notion'
                        ? 'bg-amber-700 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span>Notion</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  Agentic Hook Active
                </span>
              </div>

              {/* Active Software Window */}
              <div className="flex-1 min-h-[460px]">
                {virtualApp === 'vscode' && (
                  <VSCodeSimulator
                    onAgentAction={(action, payload) => {
                      recordToolCall('coder', action, payload, { status: 'applied', ok: true }, 40);
                      handleSendMessage(`I just updated code in VS Code (${action}). Please verify the change.`);
                    }}
                    onCodeInspect={handleCodeInspect}
                  />
                )}

                {virtualApp === 'terminal' && (
                  <TerminalSimulator
                    onExecuteCommand={(cmd) => {
                      recordToolCall('coder', 'devtools.terminal.exec', { command: cmd }, { code: 0 }, 50);
                      if (cmd.includes('pytest')) {
                        handleSendMessage("I ran the pytest suite in the terminal. All tests are passing!");
                      }
                    }}
                  />
                )}

                {virtualApp === 'slack' && (
                  <SlackWorkspace
                    onPostMessage={(msg) => {
                      recordToolCall('executive', 'workspace.slack.post', { message: msg }, { ok: true }, 30);
                    }}
                  />
                )}

                {virtualApp === 'notion' && (
                  <NotionWorkspace
                    onTaskToggle={(id, title, comp) => {
                      recordToolCall('executive', 'workspace.notion.update_task', { taskId: id, title, completed: comp }, { ok: true }, 25);
                    }}
                    onAddTask={(title) => {
                      recordToolCall('executive', 'workspace.notion.add_task', { title }, { ok: true }, 30);
                      handleSendMessage(`I added a new sprint task to Notion: "${title}".`);
                    }}
                  />
                )}
              </div>

              {/* ReAct Tool Calling Trace Panel */}
              <ReasoningTraceView
                toolCalls={toolCalls}
                onClearLogs={() => setToolCalls([])}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: ROBOT & DESK MOBILITY FOCUS VIEW */}
        {mainView === 'robot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RobotFace
                state={faceState}
                privacyActive={privacyActive}
              />
              <SituationalTimer
                privacyActive={privacyActive}
                onTogglePrivacy={handleTogglePrivacy}
                onTriggerBreakNudge={handleTriggerBreakNudge}
              />
              <VoiceChat
                messages={messages}
                onSendMessage={(q) => handleSendMessage(q)}
                apiKey={apiKey}
                onUpdateApiKey={setApiKey}
                privacyActive={privacyActive}
                isProcessing={isProcessing}
              />
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              <DeskSimulator
                currentGesture={currentGesture}
                onTriggerGesture={(g) => {
                  setCurrentGesture(g);
                  recordToolCall('robot', 'hardware.robot.gesture', { gesture: g }, { status: 'executed' }, 35);
                  if (g === 'wave') setFaceState('happy');
                  if (g === 'point') setFaceState('thinking');
                  if (g === 'nudge') setFaceState('nudge');
                  setTimeout(() => {
                    setCurrentGesture('neutral');
                    setFaceState('idle');
                  }, 2500);
                }}
                privacyActive={privacyActive}
              />

              <VisionScanner
                onScanComplete={handleScanComplete}
                privacyActive={privacyActive}
              />
            </div>
          </div>
        )}

        {/* VIEW 2.5: MODULAR COMPANION & META MUSE HANDHELD VIEW */}
        {mainView === 'modular' && (
          <ModularCompanionView
            backendOnline={backendOnline}
            privacyActive={privacyActive}
            onTogglePrivacy={handleTogglePrivacy}
            onDispatchToolCall={recordToolCall}
          />
        )}

        {/* VIEW 3: MULTI-AGENT SWARM & REASONING TRACE */}
        {mainView === 'agents' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReasoningTraceView
                toolCalls={toolCalls}
                onClearLogs={() => setToolCalls([])}
              />

              <div className="bg-[#0f1420] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Model Context Protocol (MCP) Tool Registry</h3>
                </div>
                <p className="text-slate-400">
                  Standardized tool definitions exposed to Groq LLM brain and external AI agents.
                </p>

                <div className="space-y-2">
                  {[
                    { name: 'devtools.vscode.inspect_buffer', desc: 'Inspect active file in editor and retrieve AST/diagnostics' },
                    { name: 'devtools.vscode.apply_patch', desc: 'Apply unified diff directly to source files' },
                    { name: 'devtools.terminal.exec', desc: 'Run shell commands and capture stdout/stderr' },
                    { name: 'workspace.slack.post', desc: 'Post automated messages to engineering Slack channel' },
                    { name: 'workspace.notion.sync', desc: 'Sync sprint roadmap and tick completed tasks' },
                    { name: 'hardware.robot.servo_kinematics', desc: 'Drive pan/tilt head and left/right servo arms' },
                    { name: 'perception.vision.inspect_item', desc: 'Multimodal image identification for desk components' },
                  ].map((tool) => (
                    <div key={tool.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-cyan-300 font-bold">{tool.name}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{tool.desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          recordToolCall('coder', tool.name, { simulated: true }, { status: 'ok' }, 40);
                          handleSendMessage(`Triggered MCP tool: ${tool.name}`);
                        }}
                        className="px-2.5 py-1 rounded bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 text-[11px] transition-colors"
                      >
                        Execute
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SOFTWARE BRIDGES & LIVE INTEGRATIONS */}
        {mainView === 'integrations' && (
          <IntegrationsPanel
            backendOnline={backendOnline}
            onTestWebhook={(service, url) => {
              recordToolCall('executive', 'webhook.dispatch', { service, url }, { status: 200 }, 75);
            }}
            onExecuteMCPTool={(toolName) => {
              recordToolCall('robot', toolName, { action: 'test' }, { acknowledged: true }, 40);
              setCurrentGesture('wave');
              setFaceState('happy');
              setTimeout(() => {
                setCurrentGesture('neutral');
                setFaceState('idle');
              }, 2500);
            }}
          />
        )}

        {/* VIEW 5: HARDWARE CALIBRATION & DIAGNOSTICS */}
        {mainView === 'calibration' && (
          <CalibrationPanel
            logs={messages.map((m) => ({
              timestamp: m.timestamp,
              role: m.role,
              content: m.content,
              metadata: m.expression ? `expression=${m.expression},gesture=${m.gesture}` : undefined
            }))}
            backendOnline={backendOnline}
            onTestbenchRun={(tid, result) => {
              recordToolCall('robot', 'hardware.hal.testbench', { test_id: tid }, result, 45);
              if (tid === 2) {
                setCurrentGesture('wave');
                setFaceState('happy');
                setTimeout(() => {
                  setCurrentGesture('neutral');
                  setFaceState('idle');
                }, 2500);
              } else if (tid === 6) {
                setFaceState('happy');
                setTimeout(() => setFaceState('idle'), 3000);
              }
            }}
          />
        )}

        {/* VIEW 6: DESKBOT INTERACTIVE DESK SIMULATOR (PORT 3001) */}
        {mainView === 'deskbot' && (
          <div className="flex flex-col gap-4">
            <div className="glass-panel p-4 flex items-center justify-between border border-amber-600/40 bg-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    Deskbot — 90cm × 60cm Interactive Desk Simulator
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Port 3001 Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Linked to Python FastAPI at http://localhost:8088 · Multi-modal voice, gesture, and perimeter safety simulator
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Open Deskbot in New Window ↗</span>
                </a>
              </div>
            </div>

            <div className="w-full h-[850px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
              <iframe
                src="http://localhost:3001"
                title="Deskbot Simulator"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* VIEW 7: FIGMA USER COMPANION APP DESIGNS & INTERACTIVE SCREENS */}
        {mainView === 'figma' && (
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4 border border-pink-500/30 bg-gradient-to-r from-[#170c1e] via-[#1b0f24] to-[#120d22]">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-xl shadow-pink-500/25">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    AI Companion User App
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800">
                      Screens 01-05
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official companion application UI for users with the modular desktop robot and standalone Meta Muse head
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Switcher between Interactive App & Figma Embed */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setUserAppDisplayMode('interactive')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      userAppDisplayMode === 'interactive'
                        ? 'bg-pink-600 text-white font-bold shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Interactive React App
                  </button>
                  <button
                    onClick={() => setUserAppDisplayMode('figma')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      userAppDisplayMode === 'figma'
                        ? 'bg-pink-600 text-white font-bold shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Figma Embed
                  </button>
                </div>

                <a
                  href="https://embed.figma.com/design/SqWm00RrtOZRpR6g8CkZaY/Untitled?node-id=0-1&embed-host=share"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-800/60 font-semibold text-xs transition-all"
                >
                  Open in Figma ↗
                </a>
              </div>
            </div>

            {userAppDisplayMode === 'interactive' ? (
              <CompanionUserApp
                backendOnline={backendOnline}
                privacyActive={privacyActive}
                onTogglePrivacy={handleTogglePrivacy}
                onOpenTestbench={() => setMainView('workstation')}
              />
            ) : (
              <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <iframe
                  style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  width="100%"
                  height="750"
                  src="https://embed.figma.com/design/SqWm00RrtOZRpR6g8CkZaY/Untitled?node-id=0-1&embed-host=share"
                  allowFullScreen
                  title="Figma Companion User App Design"
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
