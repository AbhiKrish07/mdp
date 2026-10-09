import { useState, useEffect } from 'react';
import { RobotFace } from './components/RobotFace';
import type { FaceState } from './components/RobotFace';
import { DeskSimulator } from './components/DeskSimulator';
import { VisionScanner } from './components/VisionScanner';
import { VoiceChat } from './components/VoiceChat';
import { SituationalTimer } from './components/SituationalTimer';
import { CalibrationPanel } from './components/CalibrationPanel';
import { Bot, Shield, Wifi } from 'lucide-react';

export default function App() {
  const [faceState, setFaceState] = useState<FaceState>('idle');
  const [currentGesture, setCurrentGesture] = useState<string>('neutral');
  const [privacyActive, setPrivacyActive] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

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
      content: "Hello! I am your AI Desk Companion. I am right here at your desk watching your progress. Show me a document, circuit component, or ask me anything!",
      timestamp: new Date().toLocaleTimeString(),
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

    // Attempt call to Python FastAPI backend
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

        const botMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.assistant_reply || "I'm keeping track of your desk session!",
          timestamp: new Date().toLocaleTimeString(),
          expression: data.expression,
          gesture: data.gesture
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsProcessing(false);
        setTimeout(() => setFaceState('idle'), 3500);
        return;
      } catch (err) {
        console.warn("Backend request failed, falling back to Web Client Engine:", err);
      }
    }

    // Web Dual-Mode Fallback Engine
    setTimeout(() => {
      let reply = "I'm right here at your desk monitoring your progress. Keep up the great work!";
      let exp: FaceState = 'speaking';
      let gest = 'neutral';

      const q = query.toLowerCase();
      if (visionContext) {
        reply = `I took a look at your physical workspace item! ${visionContext}. Everything looks correctly set up for your project.`;
        exp = 'happy';
        gest = 'point';
      } else if (q.includes('resistor') || q.includes('component')) {
        reply = "That looks like a 10k Ohm axial resistor (brown-black-orange-gold). It fits your breadboard circuit perfectly!";
        exp = 'happy';
        gest = 'point';
      } else if (q.includes('note') || q.includes('formula') || q.includes('paper')) {
        reply = "I've scanned the page on your desk. The top formula reads V_out = V_in * (R2 / (R1 + R2)).";
        exp = 'thinking';
        gest = 'point';
      } else if (q.includes('hello') || q.includes('hey')) {
        reply = "Hello there! I'm active on your desk surface. What are we working on today?";
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
      setTimeout(() => setFaceState('idle'), 3500);
    }, 1000);
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
    setTimeout(() => {
      setFaceState('idle');
      setCurrentGesture('neutral');
    }, 4000);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Top Navbar */}
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg glow-cyan">
            <Bot className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              AI Desk Companion
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                MDP Full Prototype v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Desk-Mounted Physical Workspace Companion & Vision Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Wifi className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{backendOnline ? 'Python FastAPI Service Online (Port 8000)' : 'Web Simulation Mode Active'}</span>
          </div>

          <button
            onClick={handleTogglePrivacy}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
              privacyActive
                ? 'bg-red-500 hover:bg-red-400 text-white border-red-400 glow-red'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{privacyActive ? 'Privacy: HARD CUTOFF' : 'Privacy: Hardware Active'}</span>
          </button>
        </div>
      </header>

      {/* Top Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Face Screen & Situational Monitor */}
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
        </div>

        {/* Right Column (7 cols): Spoken Chat */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <VoiceChat
            messages={messages}
            onSendMessage={(q) => handleSendMessage(q)}
            apiKey={apiKey}
            onUpdateApiKey={setApiKey}
            privacyActive={privacyActive}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Middle Grid: Desk Mobility Simulator & Multimodal Vision Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <DeskSimulator
            currentGesture={currentGesture}
            onTriggerGesture={(g) => {
              setCurrentGesture(g);
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
        </div>

        <div className="lg:col-span-6">
          <VisionScanner
            onScanComplete={handleScanComplete}
            privacyActive={privacyActive}
          />
        </div>
      </div>

      {/* Bottom Grid: Calibration & Hardware Tuning */}
      <div className="grid grid-cols-1">
        <CalibrationPanel
          logs={messages.map((m) => ({
            timestamp: m.timestamp,
            role: m.role,
            content: m.content,
            metadata: m.expression ? `expression=${m.expression},gesture=${m.gesture}` : undefined
          }))}
        />
      </div>

    </div>
  );
}
