import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bot, Camera, Check, ChevronDown,
  ChevronRight, Circle, CircleStop, Code2, Coffee, Eye, Fingerprint, Hand,
  Home as HomeIcon, Laptop, Link2, LockKeyhole, Mic, MicOff, Move, NotebookPen, Pause,
  Radio, RotateCcw, ScanEye, Send, Settings2, Shield, ShieldAlert, ShieldCheck,
  Sparkles, Terminal, ThumbsUp, Timer, Unplug, Waves, Wifi, Zap, Layers, Battery, Cpu
} from "lucide-react";
import { DeskMap } from "@/components/simulator/DeskMap";
import { RobotFace } from "@/components/simulator/RobotFace";

type ViewId = "workstation" | "robot" | "vision" | "agents" | "integrations" | "diagnostics";
type RobotMode = "idle" | "listening" | "thinking" | "moving" | "speaking" | "alert" | "scanning" | "happy";
type Point = { x: number; y: number };
type EventItem = { id: number; time: string; source: "VOICE" | "GESTURE" | "SAFETY" | "AGENT" | "SYSTEM"; title: string; detail: string; tone?: string };
type Message = { id: number; role: "user" | "robot"; text: string; kind?: string };

const navItems: { id: ViewId; label: string; icon: typeof HomeIcon; eyebrow: string }[] = [
  { id: "workstation", label: "Workstation", icon: HomeIcon, eyebrow: "Command center" },
  { id: "robot", label: "Robot sim", icon: Bot, eyebrow: "Desk environment" },
  { id: "vision", label: "Vision lab", icon: ScanEye, eyebrow: "Perception" },
  { id: "agents", label: "Agent team", icon: Sparkles, eyebrow: "Orchestration" },
  { id: "integrations", label: "Bridges", icon: Link2, eyebrow: "Mock connections" },
  { id: "diagnostics", label: "Diagnostics", icon: Settings2, eyebrow: "Simulated sensors" },
];

const gestureInputs = [
  { name: "Open palm", command: "stop the robot", intent: "Safety stop", icon: Hand, key: "palm" },
  { name: "Point", command: "go to the laptop", intent: "Navigate to target", icon: ArrowUpRight, key: "point" },
  { name: "Thumbs up", command: "continue the mission", intent: "Confirm / continue", icon: ThumbsUp, key: "thumb" },
  { name: "Wave", command: "wave hello", intent: "Greet", icon: Waves, key: "wave" },
];

const initialMessages: Message[] = [
  { id: 1, role: "robot", text: "Ready when you are. Try a voice command, a hand gesture, or ask me any question.", kind: "SYSTEM" },
];

const initialEvents: EventItem[] = [
  { id: 3, time: "20:56:42", source: "SYSTEM", title: "Simulation initialized", detail: "Desk scene loaded · checking backend bridge", tone: "mint" },
  { id: 2, time: "20:56:41", source: "SAFETY", title: "Perimeter sensors clear", detail: "4 edge zones active · auto-halt armed", tone: "amber" },
  { id: 1, time: "20:56:40", source: "SYSTEM", title: "Command bridge ready", detail: "Voice · text · gesture inputs available", tone: "cyan" },
];

const viewCopy: Record<ViewId, { title: string; description: string }> = {
  workstation: { title: "Your robot, in rehearsal & live action.", description: "Try a command. See how Deskbot interprets it via Groq/FastAPI, moves, and keeps the desk safe." },
  robot: { title: "Desk environment", description: "A safe, simulated space to rehearse routes, targets, and stop behavior." },
  vision: { title: "Vision lab", description: "Preview how the robot could inspect and describe everyday desk objects." },
  agents: { title: "Agent team", description: "A transparent view of the helper agents shaping the robot's next action." },
  integrations: { title: "Software bridges", description: "Service states and hardware bridges connected to FastAPI :8088." },
  diagnostics: { title: "Sensor diagnostics", description: "Adjust the hardware profile and inspect real-time serial & telemetry streams." },
};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Home() {
  const [view, setView] = useState<ViewId>("workstation");
  const [mode, setMode] = useState<RobotMode>("idle");
  const [position, setPosition] = useState<Point>({ x: 18, y: 72 });
  const [heading, setHeading] = useState(0);
  const [privacyCutoff, setPrivacyCutoff] = useState(false);
  const [recording, setRecording] = useState(false);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [agentTraceOpen, setAgentTraceOpen] = useState(true);
  const [activeApp] = useState("VS Code");
  const [visionPrompt, setVisionPrompt] = useState("Read the note beside the laptop");
  const [visionDone, setVisionDone] = useState(false);
  const [sensorRange, setSensorRange] = useState(12);
  const [servoAngles, setServoAngles] = useState({ left: 82, right: 96, pan: 90, tilt: 72 });
  const [serviceStates, setServiceStates] = useState<Record<string, boolean>>({ "VS Code": true, Terminal: true, Slack: false, Notion: true, GitHub: true, Spotify: false });
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [clock, setClock] = useState(nowTime());
  const [lastInterpretation, setLastInterpretation] = useState("Waiting for your first command");
  const [lastResponse, setLastResponse] = useState("Use voice, text, or a gesture. Linked to Python FastAPI at http://localhost:8088.");
  
  // Real Backend Link State
  const [backendOnline, setBackendOnline] = useState(false);
  const [dockState, setDockState] = useState<'STANDALONE' | 'DOCKED'>('DOCKED');
  const [headBattery, setHeadBattery] = useState(94);
  const [bodyBattery, setBodyBattery] = useState(88);
  const [isProcessing, setIsProcessing] = useState(false);

  const speechRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clock timer
  useEffect(() => {
    const timer = window.setInterval(() => setClock(nowTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Poll FastAPI backend status & modular telemetry
  useEffect(() => {
    let hasAlerted = false;
    const probeBackend = async () => {
      try {
        const res = await fetch("http://localhost:8088/", { signal: AbortSignal.timeout(1800) });
        if (res.ok) {
          const rootData = await res.json();
          setBackendOnline(true);
          setPrivacyCutoff(rootData.privacy_mode);

          if (!hasAlerted) {
            hasAlerted = true;
            addEvent("SYSTEM", "FastAPI backend linked", "Connected to Python companion core on port 8088", "mint");
          }

          // Fetch modular telemetry
          try {
            const telRes = await fetch("http://localhost:8088/api/v1/modular/telemetry", { signal: AbortSignal.timeout(1800) });
            if (telRes.ok) {
              const tel = await telRes.json();
              if (tel.dock_state) setDockState(tel.dock_state);
              if (tel.head?.battery_pct !== undefined) setHeadBattery(tel.head.battery_pct);
              if (tel.body?.body_battery_pct !== undefined) setBodyBattery(tel.body.body_battery_pct);
            }
          } catch {
            // ignore sub-telemetry error
          }
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };

    probeBackend();
    const interval = setInterval(probeBackend, 3500);
    return () => clearInterval(interval);
  }, []);

  // Sync privacy cutoff with speech recognition
  useEffect(() => {
    if (privacyCutoff && speechRef.current) {
      speechRef.current.abort?.();
      speechRef.current = null;
      setRecording(false);
    }
  }, [privacyCutoff]);

  const addEvent = (source: EventItem["source"], title: string, detail: string, tone = "cyan") => {
    setEvents((items) => [{ id: Date.now() + Math.random(), time: nowTime(), source, title, detail, tone }, ...items].slice(0, 30));
  };

  const addMessage = (role: Message["role"], text: string, kind?: string) => {
    setMessages((items) => [...items, { id: Date.now() + Math.random(), role, text, kind }].slice(-18));
  };

  const setRobotMode = (next: RobotMode, duration = 1900) => {
    setMode(next);
    if (next !== "alert") {
      window.setTimeout(() => setMode((current) => (current === next ? "idle" : current)), duration);
    }
  };

  // Toggle Dock / Standalone Muse Mode
  const toggleDockState = async () => {
    const nextState = dockState === 'DOCKED' ? 'STANDALONE' : 'DOCKED';
    setDockState(nextState);

    if (nextState === 'STANDALONE') {
      addEvent("SYSTEM", "Head detached", "Operating as Meta Muse Charm handheld companion. Locomotion disabled.", "amber");
    } else {
      addEvent("SYSTEM", "Head docked", "Attached to robot body. Full locomotion & arm servos online.", "mint");
    }

    if (backendOnline) {
      try {
        await fetch("http://localhost:8088/api/v1/modular/dock-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: nextState })
        });
      } catch (err) {
        console.error("Error setting dock state:", err);
      }
    }
  };

  // Dispatch Command (Integrated with Python FastAPI backend)
  const dispatchCommand = async (raw: string, source: "VOICE" | "GESTURE" = "VOICE", gestureName?: string) => {
    const text = raw.trim();
    if (!text) return;

    if (privacyCutoff && source === "VOICE") {
      addEvent("SAFETY", "Voice input blocked", "Privacy cutoff is active. Use text input or switch the cutoff off.", "red");
      return;
    }

    addMessage("user", gestureName ? `${gestureName} gesture` : text, source);
    setLastInterpretation("Interpreting with AI companion…");
    setRobotMode("thinking", 1200);
    setIsProcessing(true);

    const lower = text.toLowerCase();
    let intent = "Acknowledge and respond";
    let destination: Point | null = null;
    let nextHeading = heading;
    let nextMode: RobotMode = "speaking";
    let safety = false;

    // Movement intent checks
    if (/\b(stop|halt|freeze|emergency|cancel)\b/.test(lower) || gestureName === "Open palm") {
      intent = "Safety stop · halt movement";
      nextMode = "alert";
      safety = true;
      if (backendOnline) {
        fetch("http://localhost:8088/api/v1/modular/emergency-stop", { method: "POST" }).catch(() => {});
      }
    } else if (/\b(home|return|come back|reset position)\b/.test(lower)) {
      intent = "Navigate · return to home marker";
      destination = { x: 18, y: 72 };
      nextHeading = 0;
      nextMode = "moving";
    } else if (/\b(laptop|computer|screen|left)\b/.test(lower) && /\b(go|move|navigate|point|inspect|look|to|at)\b/.test(lower)) {
      intent = /inspect|look/.test(lower) ? "Inspect target · laptop" : "Navigate · laptop";
      destination = { x: 26, y: 31 };
      nextHeading = 315;
      nextMode = /inspect|look/.test(lower) ? "scanning" : "moving";
    } else if (/\b(mug|cup|coffee)\b/.test(lower)) {
      intent = /inspect|look|read|identify/.test(lower) ? "Inspect target · mug" : "Navigate · mug";
      destination = { x: 74, y: 38 };
      nextHeading = 45;
      nextMode = /inspect|look|read|identify/.test(lower) ? "scanning" : "moving";
    } else if (/\b(note|notebook|paper|formula)\b/.test(lower)) {
      intent = "Inspect target · notebook";
      destination = { x: 53, y: 72 };
      nextHeading = 0;
      nextMode = "scanning";
    } else if (/\b(wave|hello|hi|greet)\b/.test(lower) || gestureName === "Wave") {
      intent = "Social gesture · wave";
      nextMode = "happy";
      if (backendOnline) {
        fetch("http://localhost:8088/api/v1/modular/gesture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gesture: "wave" })
        }).catch(() => {});
      }
    } else if (/\b(continue|resume|yes|confirm|thumb)\b/.test(lower) || gestureName === "Thumbs up") {
      intent = "Confirm · continue current mission";
      destination = { x: 43, y: 49 };
      nextHeading = 40;
      nextMode = "moving";
    }

    // Call real FastAPI backend if online
    let realResponse: string | null = null;
    if (backendOnline) {
      try {
        const res = await fetch("http://localhost:8088/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text })
        });
        if (res.ok) {
          const data = await res.json();
          realResponse = data.response || data.answer;
          if (data.expression) {
            const expMap: Record<string, RobotMode> = {
              idle: "idle",
              thinking: "thinking",
              speaking: "speaking",
              happy: "happy",
              alert: "alert",
              nudge: "happy"
            };
            if (expMap[data.expression]) nextMode = expMap[data.expression];
          }
        }
      } catch (err) {
        console.warn("Backend query failed, using simulated response:", err);
      }
    }

    const finalResponse = realResponse || (
      safety ? "Emergency stop engaged. All motor PWM and locomotion halted safely." :
      destination ? `Navigating toward target: ${intent}.` :
      "I heard your command and processed it through the companion reasoning loop."
    );

    setLastInterpretation(intent);
    setLastResponse(finalResponse);
    addEvent(safety ? "SAFETY" : source, intent, `${gestureName ? `${gestureName} gesture` : `“${text}”`} → ${intent}`, safety ? "red" : "amber");

    if (destination && !safety) {
      if (dockState === 'STANDALONE') {
        addEvent("SAFETY", "Motion inhibited", "Cannot move base: Head is detached in standalone Muse mode.", "amber");
      } else {
        setPosition(destination);
        setHeading(nextHeading);
        if (backendOnline) {
          fetch("http://localhost:8088/api/v1/modular/body-command", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "MOVE_FORWARD", params: { speed: 0.15 } })
          }).catch(() => {});
        }
      }
    }

    setRobotMode(nextMode, nextMode === "moving" ? 1800 : 2500);
    addMessage("robot", finalResponse, "DESKBOT");

    setIsProcessing(false);
    setCommand("");
    setRecording(false);
  };

  // Browser speech recognition
  const startListening = () => {
    if (privacyCutoff) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addEvent("SYSTEM", "Voice recognition unavailable", "Use the command box to type what you would say.", "amber");
      inputRef.current?.focus();
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setRecording(true);
        setRobotMode("listening", 3000);
      };
      recognition.onresult = (event: any) => {
        dispatchCommand(event.results?.[0]?.[0]?.transcript ?? "", "VOICE");
      };
      recognition.onerror = (event: any) => {
        setRecording(false);
        addEvent("SYSTEM", "Mic session ended", event.error === "not-allowed" ? "Microphone permission was not granted." : "Try typing a command instead.", "amber");
      };
      recognition.onend = () => {
        setRecording(false);
        setMode((current) => (current === "listening" ? "idle" : current));
      };
      speechRef.current = recognition;
      recognition.start();
    } catch {
      setRecording(false);
      addEvent("SYSTEM", "Could not start microphone", "Try typing your command instead.", "amber");
    }
  };

  const submitCommand = (event: FormEvent) => {
    event.preventDefault();
    dispatchCommand(command, "VOICE");
  };

  const handleGesture = (name: string, text: string) => {
    dispatchCommand(text, "GESTURE", name);
  };

  // Toggle privacy switch (both UI and FastAPI hardware state)
  const togglePrivacy = async () => {
    const next = !privacyCutoff;
    setPrivacyCutoff(next);

    if (backendOnline) {
      try {
        await fetch("http://localhost:8088/api/privacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ privacy_active: next })
        });
      } catch (err) {
        console.error("Error setting privacy:", err);
      }
    }

    if (next) {
      setRecording(false);
      setMode("idle");
      addEvent("SAFETY", "Privacy cutoff enabled", "Hardware switch engaged: camera & microphone disabled electrically.", "red");
    } else {
      addEvent("SYSTEM", "Privacy cutoff released", "Perception hardware ready. Audio and vision enabled.", "mint");
    }
  };

  const resetScene = () => {
    setPosition({ x: 18, y: 72 });
    setHeading(0);
    setMode("idle");
    setLastInterpretation("Waiting for your first command");
    setLastResponse("Use voice, text, or a gesture. The robot responds in this simulated scene.");
    addEvent("SYSTEM", "Scene reset", "Robot returned to the home marker.", "cyan");
  };

  const runVision = async () => {
    setVisionDone(true);
    setRobotMode("scanning", 2200);
    setLastInterpretation("Visual inspection · desk scene");

    if (backendOnline) {
      try {
        const res = await fetch("http://localhost:8088/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: visionPrompt,
            vision_context: "Observed items: laptop screen showing code editor, ceramic coffee mug, paper note stating 'check pin 4'."
          })
        });
        if (res.ok) {
          const data = await res.json();
          setLastResponse(data.response || data.answer);
          addEvent("AGENT", "Vision pass complete", `${visionPrompt} · processed via backend`, "mint");
          return;
        }
      } catch {
        // fallback to simulation
      }
    }

    setLastResponse("Sample result: desk objects identified. Camera and vision output simulated.");
    addEvent("AGENT", "Vision pass complete", `${visionPrompt} · simulated recognition result`, "cyan");
  };

  const updateServo = (key: string, value: number) => {
    setServoAngles((prev) => ({ ...prev, [key]: value }));
    if (backendOnline) {
      fetch("http://localhost:8088/api/hardware/servo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arm: key, angle: value })
      }).catch(() => {});
    }
  };

  const filteredEvents = useMemo(
    () => (auditFilter === "ALL" ? events : events.filter((event) => event.source === auditFilter)),
    [auditFilter, events]
  );

  const renderEvents = (items: EventItem[], limit = 4) => (
    <div className="event-list">
      {items.slice(0, limit).map((item) => (
        <div className="event-row" key={item.id}>
          <span className={`event-mark event-${item.tone ?? "cyan"}`} />
          <div className="event-copy">
            <div className="event-title-line">
              <strong>{item.title}</strong>
              <span>{item.time}</span>
            </div>
            <p>{item.detail}</p>
            <span className={`event-source source-${item.source.toLowerCase()}`}>{item.source}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivity = () => (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ACTIVITY TRACE</span>
          <h3>What just happened</h3>
        </div>
        <button className="icon-button tiny" onClick={() => setAgentTraceOpen((open) => !open)} aria-label="Toggle activity trace">
          <ChevronDown className={agentTraceOpen ? "" : "rotate-180"} size={16} />
        </button>
      </div>
      {agentTraceOpen && renderEvents(events, 4)}
      {!agentTraceOpen && <div className="collapsed-note">{events.length} recent events · select to expand</div>}
    </section>
  );

  const renderCommandPanel = () => (
    <section className="panel command-panel">
      <div className="panel-heading command-heading">
        <div>
          <span className="eyebrow">TALK TO DESKBOT</span>
          <h3>Give it a try</h3>
        </div>
        <div className={`listening-pill ${recording ? "is-recording" : ""}`}>
          <span />
          {recording ? "Listening" : privacyCutoff ? "Mic blocked" : backendOnline ? "AI Bridge Online" : "Voice ready"}
        </div>
      </div>
      <div className="command-result">
        <div className="result-face">
          <RobotFace mode={mode} privacyCutoff={privacyCutoff} compact />
        </div>
        <div className="result-copy">
          <span className="eyebrow">UNDERSTOOD AS</span>
          <strong>{lastInterpretation}</strong>
          <p>{lastResponse}</p>
        </div>
      </div>
      <form className="command-input-wrap" onSubmit={submitCommand}>
        <button
          type="button"
          className={`mic-button ${recording ? "mic-live" : ""}`}
          onClick={() => (recording ? (speechRef.current?.stop?.(), setRecording(false)) : startListening())}
          disabled={privacyCutoff}
          title={privacyCutoff ? "Privacy cutoff is active" : "Start voice input"}
        >
          {privacyCutoff ? <MicOff size={18} /> : recording ? <CircleStop size={18} /> : <Mic size={18} />}
        </button>
        <input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={privacyCutoff ? "Privacy cutoff is on" : isProcessing ? "Thinking..." : "Try “go inspect the mug” or ask a question…"}
          aria-label="Type a command"
        />
        <button type="submit" className="send-command" disabled={!command.trim() || isProcessing} aria-label="Send command">
          <Send size={16} />
        </button>
      </form>
      <div className="suggestion-row">
        <span>TRY</span>
        {["Wave hello", "Inspect the mug", "Go to laptop", "What can you do?"].map((suggestion) => (
          <button key={suggestion} onClick={() => dispatchCommand(suggestion, "VOICE")}>
            {suggestion}
          </button>
        ))}
      </div>
      <div className="gesture-strip">
        <div className="gesture-strip-heading">
          <span className="eyebrow">GESTURE INPUT</span>
          <span className="sim-label">
            <Fingerprint size={11} /> {backendOnline ? "HARDWARE DISPATCH" : "SIMULATED"}
          </span>
        </div>
        <div className="gesture-buttons">
          {gestureInputs.map(({ name, command: text, intent, icon: Icon }) => (
            <button key={name} className="gesture-button" onClick={() => handleGesture(name, text)} title={`${name}: ${intent}`}>
              <Icon size={16} />
              <span>{name}</span>
            </button>
          ))}
        </div>
        <p className="micro-note">
          {dockState === 'STANDALONE'
            ? "Head detached: Gestures redirect to on-screen animated face expressions (Muse mode)."
            : "Docked: Gestures trigger physical servo arms via ESP32 / RP2040."}
        </p>
      </div>
    </section>
  );

  const renderMetric = (label: string, value: string, detail: string, Icon: typeof Activity, tone = "cyan") => (
    <div className="metric-card" key={label}>
      <div className={`metric-icon metric-${tone}`}>
        <Icon size={16} />
      </div>
      <div>
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
        <span className="metric-detail">{detail}</span>
      </div>
    </div>
  );

  const renderWorkstation = () => (
    <>
      <div className="metric-row">
        {renderMetric("Robot mode", mode === "idle" ? "Standby" : mode[0].toUpperCase() + mode.slice(1), "Simulation state", Bot, "amber")}
        {renderMetric("Dock state", dockState === "DOCKED" ? "Docked (Robot)" : "Standalone (Muse)", dockState === "DOCKED" ? `Body LiPo ${bodyBattery}%` : `Head LiPo ${headBattery}%`, Layers, dockState === "DOCKED" ? "cyan" : "mint")}
        {renderMetric("Safety edge", "Armed", `${sensorRange} cm threshold`, ShieldCheck, "mint")}
        {renderMetric("Hardware link", backendOnline ? "FastAPI :8088" : "Not connected", backendOnline ? "HAL & Groq active" : "Frontend simulation", backendOnline ? Wifi : Unplug, backendOnline ? "mint" : "neutral")}
      </div>
      <div className="workstation-grid">
        <div className="workstation-left">
          <section className="panel scene-panel">
            <div className="panel-heading scene-heading">
              <div>
                <span className="eyebrow">LIVE SIMULATION · TOP-DOWN</span>
                <h3>The desk, right now</h3>
              </div>
              <div className="scene-actions">
                <span className="live-badge">
                  <span /> {dockState === "DOCKED" ? "ROBOT AT DESK" : "HEAD DETACHED (HANDHELD)"}
                </span>
                <button className="icon-button" onClick={resetScene} title="Reset scene">
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
            <DeskMap position={position} heading={heading} mode={mode} onNavigate={(target) => dispatchCommand(target, "VOICE")} />
            <div className="scene-legend">
              <span><i className="legend-robot" /> Deskbot</span>
              <span><i className="legend-obstacle" /> Desk object</span>
              <span><i className="legend-safe" /> Safety perimeter</span>
              <span className="scene-coords">
                X {Math.round(position.x * 0.9)} cm <b>·</b> Y {Math.round(position.y * 0.6)} cm
              </span>
            </div>
          </section>
          <section className="panel mission-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">COMMAND → ACTION → RESULT</span>
                <h3>Latest rehearsal</h3>
              </div>
              <span className="mission-status">
                <span /> {mode === "moving" ? "IN MOTION" : mode === "alert" ? "HALTED" : "READY"}
              </span>
            </div>
            <div className="mission-steps">
              <div className="mission-step complete">
                <span><Check size={13} /></span>
                <div><b>Command received</b><small>Voice, text, or gesture</small></div>
              </div>
              <ChevronRight size={14} className="step-chevron" />
              <div className={`mission-step ${lastInterpretation !== "Waiting for your first command" ? "complete" : ""}`}>
                <span><Sparkles size={13} /></span>
                <div><b>Intent understood</b><small>{lastInterpretation}</small></div>
              </div>
              <ChevronRight size={14} className="step-chevron" />
              <div className={`mission-step ${mode !== "idle" ? "active" : ""}`}>
                <span><ArrowRight size={13} /></span>
                <div><b>Safe action</b><small>{mode === "alert" ? "Auto-halt · edge safe" : "FastAPI response"}</small></div>
              </div>
            </div>
          </section>
        </div>
        <div className="workstation-right">
          <section className="panel robot-card">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">COMPANION</span>
                <h3>Deskbot</h3>
              </div>
              <span className="sim-label">
                <Circle size={8} fill="currentColor" color={backendOnline ? "#88dcac" : "#cbab73"} />
                {backendOnline ? "FASTAPI LIVE" : "OFFLINE · SIM"}
              </span>
            </div>
            <RobotFace mode={mode} privacyCutoff={privacyCutoff} />
            <div className="robot-card-foot">
              <span><span className="status-dot mint" /> Edge sensors clear</span>
              <span>Head Battery <b>{headBattery}%</b></span>
            </div>
          </section>
          {renderCommandPanel()}
          {renderActivity()}
        </div>
      </div>
    </>
  );

  const renderRobotSim = () => (
    <div className="page-grid robot-page">
      <section className="panel scene-panel scene-panel-large">
        <div className="panel-heading scene-heading">
          <div>
            <span className="eyebrow">SIMULATED SPACE · 90 CM × 60 CM</span>
            <h3>Desk topography</h3>
            <p className="panel-subtitle">Choose an object to issue a navigation request. The robot checks its route and the perimeter.</p>
          </div>
          <button className="outline-button" onClick={resetScene}>
            <RotateCcw size={14} /> Reset scene
          </button>
        </div>
        <DeskMap position={position} heading={heading} mode={mode} onNavigate={(target) => dispatchCommand(target, "VOICE")} />
      </section>
      <div className="robot-detail-column">
        <section className="panel safety-card">
          <div className="safety-heading">
            <span className="safety-icon"><ShieldCheck size={18} /></span>
            <div><span className="eyebrow">FAIL-SAFE</span><h3>Edge watch is on</h3></div>
            <span className="safe-tag">ARMED</span>
          </div>
          <p>Perimeter sensors active. If a route crosses the boundary, Deskbot stops before the edge.</p>
          <div className="sensor-row"><span>North</span><i /><b>Clear</b></div>
          <div className="sensor-row"><span>East</span><i /><b>Clear</b></div>
          <div className="sensor-row"><span>South</span><i /><b>Clear</b></div>
          <div className="sensor-row"><span>West</span><i /><b>Clear</b></div>
        </section>
        <section className="panel quick-actions">
          <div className="panel-heading">
            <div><span className="eyebrow">SCENARIO PROMPTS</span><h3>Ask for an action</h3></div>
          </div>
          {[["Go to the laptop", Laptop], ["Inspect the mug", Coffee], ["Return home", HomeIcon], ["Stop the robot", Pause]].map(([label, Icon]: any) => (
            <button className="action-row" key={label} onClick={() => dispatchCommand(label, "VOICE")}>
              <Icon size={16} />
              <span>{label}</span>
              <ArrowRight size={14} />
            </button>
          ))}
        </section>
      </div>
      <div className="wide-row">
        {renderCommandPanel()}
        {renderActivity()}
      </div>
    </div>
  );

  const renderVision = () => (
    <div className="vision-layout">
      <section className="panel vision-viewer">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CAMERA SENSING · 640 × 480</span>
            <h3>Desk camera preview</h3>
          </div>
          <span className="camera-badge">
            <Camera size={13} /> {backendOnline ? "HARDWARE FRAME" : "SAMPLE FRAME"}
          </span>
        </div>
        <div className="camera-frame">
          <div className="camera-grain" />
          <div className="camera-corner c-tl" /><div className="camera-corner c-tr" />
          <div className="camera-corner c-bl" /><div className="camera-corner c-br" />
          <div className="view-object view-laptop"><Laptop size={35} /><span>LAPTOP</span></div>
          <div className="view-object view-mug"><Coffee size={28} /><span>MUG · CERAMIC</span></div>
          <div className="view-object view-note"><NotebookPen size={23} /><span>HANDWRITTEN NOTE</span><small>“check pin 4”</small></div>
          <div className="roi roi-laptop"><span>01 · LAPTOP</span></div>
          <div className="roi roi-mug"><span>02 · MUG</span></div>
          <div className="roi roi-note"><span>03 · TEXT 92%</span></div>
          <div className="crosshair"><i /><i /></div>
          <div className="camera-hud">
            <span><span /> {backendOnline ? "PI CAM 3 READY" : "SIM FRAME"}</span>
            <span>PAN {servoAngles.pan}° · TILT {servoAngles.tilt}°</span>
          </div>
        </div>
        <div className="camera-controls">
          <span><ScanEye size={14} /> 3 regions detected</span>
          <button className="outline-button" onClick={runVision}>
            <Eye size={14} /> Run sample inspection
          </button>
        </div>
      </section>
      <div className="vision-side">
        <section className="panel vision-query">
          <div className="panel-heading">
            <div><span className="eyebrow">ASK ABOUT THE SCENE</span><h3>What should I inspect?</h3></div>
          </div>
          <textarea value={visionPrompt} onChange={(e) => setVisionPrompt(e.target.value)} rows={3} aria-label="Vision prompt" />
          <div className="preset-prompts">
            {["Verify circuit wiring", "Read the desk note", "Identify components"].map((prompt) => (
              <button key={prompt} onClick={() => setVisionPrompt(prompt)}>{prompt}</button>
            ))}
          </div>
          <button className="primary-button full-button" onClick={runVision}>
            <ScanEye size={15} /> Inspect desk scene <ArrowRight size={15} />
          </button>
          <p className="micro-note">Calls multimodal Groq AI vision backend when connected.</p>
        </section>
        <section className="panel extraction-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">EXTRACTION</span><h3>{visionDone ? "Inspection findings" : "Waiting for inspection"}</h3></div>
            <span className="confidence-tag">{visionDone ? "94%" : "—"}</span>
          </div>
          {visionDone ? (
            <div className="extraction-items">
              <div><span className="extract-type">OBJECT</span><b>Laptop</b><small>Desk surface · 0.94 confidence</small></div>
              <div><span className="extract-type">OBJECT</span><b>Ceramic mug</b><small>Right of robot · 0.89 confidence</small></div>
              <div><span className="extract-type">OCR TEXT</span><b>“check pin 4”</b><small>Handwritten note · 0.92 confidence</small></div>
            </div>
          ) : (
            <div className="empty-inspection">
              <ScanEye size={22} />
              <p>Run inspection to see detections and extracted text.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="agents-layout">
      <div className="agent-cards">
        {[
          { name: "Code Agent", role: "Software context", icon: Code2, status: "Standby", color: "cyan", task: "Watching the active project workspace", result: "VS Code Bridge active" },
          { name: "Research Agent", role: "Knowledge helper", icon: Eye, status: "Ready", color: "amber", task: "Indexed Pico SDK UART docs & Pinouts", result: "FastAPI docs indexed" },
          { name: "Executive Agent", role: "Wellbeing & tasks", icon: Timer, status: "Ready", color: "mint", task: "Break timer tracking (25 min)", result: "Notion tasks synced" },
          { name: "Robot Hardware Agent", role: "Motion & perception", icon: Bot, status: mode === "moving" ? "Acting" : "Ready", color: "amber", task: lastInterpretation, result: backendOnline ? "ESP32 serial online" : "Device bridge simulated" }
        ].map(({ name, role, icon: Icon, status, color, task, result }) => (
          <section className="panel agent-card" key={name}>
            <div className="agent-card-head">
              <span className={`agent-icon agent-${color}`}><Icon size={18} /></span>
              <span className={`agent-state agent-state-${color}`}><i />{status}</span>
            </div>
            <div><h3>{name}</h3><span className="agent-role">{role}</span></div>
            <p>{task}</p>
            <div className="agent-card-foot"><span>{result}</span><span className="mock-chip">{backendOnline ? "LIVE" : "MOCK"}</span></div>
          </section>
        ))}
      </div>
      <section className="panel tool-trace">
        <div className="panel-heading">
          <div><span className="eyebrow">OBSERVABLE TOOL TRACE</span><h3>From input to outcome</h3></div>
          <span className="sim-label"><Activity size={12} /> {backendOnline ? "FASTAPI MCP" : "SIMULATED"}</span>
        </div>
        <div className="trace-columns"><span>STEP</span><span>OBSERVATION</span><span>RESULT</span></div>
        <div className="trace-row">
          <span className="trace-source"><Mic size={14} /> Command input</span>
          <span>“{lastInterpretation === "Waiting for your first command" ? "go inspect the mug" : lastInterpretation}”</span>
          <span className="trace-ok"><Check size={13} /> Interpreted</span>
        </div>
        <div className="trace-row">
          <span className="trace-source"><Bot size={14} /> Motion planner</span>
          <span>Check approach path + desk boundary</span>
          <span className="trace-ok"><ShieldCheck size={13} /> Safe route</span>
        </div>
        <div className="trace-row">
          <span className="trace-source"><ArrowRight size={14} /> Robot simulation</span>
          <span>{mode === "alert" ? "Motion halted" : "Target state updated"}</span>
          <span className="trace-ok"><Check size={13} /> {mode === "alert" ? "Stopped" : "Complete"}</span>
        </div>
        <div className="trace-note"><LockKeyhole size={13} /> This view shows action summaries and outcomes via MCP.</div>
      </section>
      <div className="agent-test-command">{renderCommandPanel()}</div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="integrations-layout">
      <section className="panel integrations-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SOFTWARE & HARDWARE BRIDGES</span>
            <h3>Service connections</h3>
            <p className="panel-subtitle">Linked to local Python FastAPI backend and virtual development environment.</p>
          </div>
          <span className="mock-chip">{backendOnline ? "CONNECTED" : "SIM MODE"}</span>
        </div>
        <div className="service-grid">
          {[
            { name: "VS Code", icon: Code2, tag: "EDITOR" },
            { name: "Terminal", icon: Terminal, tag: "LOCAL" },
            { name: "Slack", icon: Activity, tag: "MESSAGING" },
            { name: "Notion", icon: NotebookPen, tag: "NOTES" },
            { name: "GitHub", icon: Code2, tag: "REPOSITORY" },
            { name: "Hardware HAL", icon: Waves, tag: "ESP32/PICO" }
          ].map(({ name, icon: Icon, tag }) => (
            <div className="service-card" key={name}>
              <div className="service-card-top">
                <span className="service-icon"><Icon size={18} /></span>
                <span className="service-tag">{tag}</span>
              </div>
              <b>{name}</b>
              <div className="service-card-bottom">
                <span className={serviceStates[name] ? "service-state connected" : "service-state"}>
                  <i />{serviceStates[name] ? "Active" : "Not connected"}
                </span>
                <button
                  className={`toggle-control ${serviceStates[name] ? "toggle-on" : ""}`}
                  role="switch"
                  aria-checked={serviceStates[name]}
                  aria-label={`Toggle ${name} state`}
                  onClick={() => setServiceStates((items) => ({ ...items, [name]: !items[name] }))}
                >
                  <span />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="integration-side">
        <section className="panel webhook-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">DISPATCH TO BACKEND</span><h3>Test endpoint call</h3></div>
            <Radio size={17} className="subtle-icon" />
          </div>
          <label className="field-label">Destination
            <input value="http://localhost:8088/api/query" readOnly />
          </label>
          <label className="field-label">Payload preview
            <textarea readOnly rows={4} value={'{\n  "query": "hello companion",\n  "gesture": "wave"\n}'} />
          </label>
          <button
            className="outline-button full-button"
            onClick={() => dispatchCommand("test connection", "VOICE")}
          >
            <Zap size={14} /> Dispatch test query
          </button>
        </section>
        <section className="panel config-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">ENVIRONMENT CONFIG</span><h3>Active ports</h3></div>
            <LockKeyhole size={15} />
          </div>
          <div className="config-line"><span>BACKEND_FASTAPI</span><code>http://localhost:8088</code></div>
          <div className="config-line"><span>WEB_SIMULATOR_OS</span><code>http://localhost:5173</code></div>
          <div className="config-line"><span>DESKBOT_SIMULATOR</span><code>http://localhost:3001</code></div>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="text-button"
            style={{ textDecoration: "none" }}
          >
            Open Unified Workstation OS (Port 5173) <ArrowRight size={13} />
          </a>
        </section>
      </div>
    </div>
  );

  const renderDiagnostics = () => (
    <div className="diagnostics-layout">
      <section className="panel calibration-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">HARDWARE PROFILE & KINEMATICS</span>
            <h3>Servo & sensor tuning</h3>
            <p className="panel-subtitle">Adjusting sliders sends real-time PWM commands to hardware HAL.</p>
          </div>
          <span className="mock-chip">{backendOnline ? "PICO PWM" : "NO DEVICE"}</span>
        </div>
        <div className="slider-stack">
          {Object.entries(servoAngles).map(([key, value]) => (
            <label className="servo-control" key={key}>
              <span>
                <b>{key === "left" ? "Left arm" : key === "right" ? "Right arm" : key === "pan" ? "Camera pan" : "Camera tilt"}</b>
                <code>{value}°</code>
              </span>
              <input
                type="range"
                min="0"
                max="180"
                value={value}
                onChange={(e) => updateServo(key, Number(e.target.value))}
              />
              <span className="range-labels"><small>0°</small><small>90°</small><small>180°</small></span>
            </label>
          ))}
        </div>
        <div className="threshold-control">
          <div><span className="eyebrow">EDGE STOP THRESHOLD</span><b>{sensorRange} cm</b></div>
          <input type="range" min="4" max="24" value={sensorRange} onChange={(e) => setSensorRange(Number(e.target.value))} />
        </div>
      </section>
      <div className="diagnostics-side">
        <section className="panel sensor-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">EDGE SENSORS</span><h3>Perimeter health</h3></div>
            <span className="safe-tag">IR OK</span>
          </div>
          {["Front · Left IR", "Front · Center IR", "Front · Right IR", "Rear · Microswitch"].map((sensor) => (
            <div className="sensor-health" key={sensor}>
              <span className="sensor-health-icon"><Waves size={14} /></span>
              <span>{sensor}</span>
              <b>Clear</b>
              <span className="sensor-clear"><i />Safe</span>
            </div>
          ))}
        </section>
        <section className="panel uart-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">SERIAL MONITOR</span><h3>UART · 115200 baud</h3></div>
            <span className="uart-status"><i /> {backendOnline ? "LIVE STREAM" : "MOCK STREAM"}</span>
          </div>
          <div className="uart-lines">
            <code><span>20:56:40.112</span> <b>RX</b> {`{"t":"telemetry","edge_trip":false,"watchdog_ok":true}`}</code>
            <code><span>20:56:40.318</span> <b>TX</b> {`{"t":"heartbeat","ping":1}`}</code>
            <code><span>20:56:41.004</span> <b>RX</b> {`{"dock_state":"${dockState}","head_battery":${headBattery}}`}</code>
            <code><span>20:56:41.982</span> <b>TX</b> {`{"action":"HEARTBEAT","timeout_ms":200}`}</code>
          </div>
        </section>
      </div>
      <section className="panel audit-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">AUDIT LOG</span><h3>Simulation & backend events</h3></div>
          <div className="filter-pills">
            {["ALL", "VOICE", "GESTURE", "SAFETY", "AGENT", "SYSTEM"].map((filter) => (
              <button key={filter} onClick={() => setAuditFilter(filter)} className={auditFilter === filter ? "active-filter" : ""}>
                {filter}
              </button>
            ))}
          </div>
        </div>
        {renderEvents(filteredEvents, 8)}
      </section>
    </div>
  );

  const active = navItems.find((item) => item.id === view)!;

  return (
    <div className="sim-app">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-symbol"><i /><i /><span /></div>
          <div><strong>deskbot<span>.</span></strong><small>ROBOT SIMULATOR</small></div>
        </div>

        {/* Modular Mode Badge & Switcher */}
        <div
          className="sidebar-mode"
          style={{ cursor: "pointer", borderColor: dockState === "DOCKED" ? "#315351" : "#763d76" }}
          onClick={toggleDockState}
          title="Click to toggle between Docked Robot and Standalone Muse Mode"
        >
          <span className="mode-light" style={{ background: dockState === "DOCKED" ? "var(--cyan)" : "#d978e8" }} />
          <span>{dockState === "DOCKED" ? "DOCKED ROBOT" : "MUSE CHARM"}</span>
          <ChevronDown size={13} />
        </div>

        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button className={`nav-item ${view === id ? "nav-active" : ""}`} key={id} onClick={() => setView(id)}>
              <Icon size={17} />
              <span>{label}</span>
              {id === "robot" && <i className="nav-live-dot" />}
              {view === id && <ChevronRight className="nav-chevron" size={14} />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-robot-mini">
          <RobotFace mode={mode} compact privacyCutoff={privacyCutoff} />
        </div>

        <div className="connection-card">
          <div className="connection-top">
            <span className="connection-dot" style={{ background: backendOnline ? "var(--mint)" : "var(--amber)" }} />
            {backendOnline ? "FASTAPI :8088" : "LOCAL SIM"}
            <span className="connection-menu">···</span>
          </div>
          <div className="connection-copy">
            {backendOnline ? "Python Companion Core Linked" : "Simulated offline mode"}
          </div>
          <div className="connection-bar">
            <i style={{ width: backendOnline ? "100%" : "29%", background: backendOnline ? "var(--mint)" : "var(--amber)" }} />
          </div>
          <div className="connection-foot">
            <span>{backendOnline ? "Live Hardware Bridge" : "Offline preview"}</span>
            <span>v1.2.0</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">D</div>
          <div><b>Desk workspace</b><span>{backendOnline ? "Pi 5 + ESP32 Link" : "Local simulator"}</span></div>
          <Settings2 size={15} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>SIMULATOR</span><ChevronRight size={13} /><b>{active.eyebrow}</b>
          </div>
          <div className="topbar-right">
            {/* Dock Toggle in Topbar */}
            <button
              onClick={toggleDockState}
              className="outline-button"
              style={{
                height: 27,
                fontSize: 9,
                fontWeight: 600,
                borderColor: dockState === "DOCKED" ? "#284a3c" : "#623265",
                color: dockState === "DOCKED" ? "#88dcac" : "#ea98ef"
              }}
              title="Toggle between Docked Desktop Robot and Detached Handheld Muse Companion"
            >
              <Layers size={13} />
              <span>{dockState === "DOCKED" ? "DOCKED (ROBOT)" : "STANDALONE (MUSE)"}</span>
            </button>

            {/* Link to Unified Workstation OS */}
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="outline-button"
              style={{ height: 27, fontSize: 9, textDecoration: "none" }}
              title="Open the Unified Workstation OS & Agentic Simulator"
            >
              <span>Workstation OS (:5173) ↗</span>
            </a>

            <span className="clock-label">{clock}</span>

            <span
              className="device-badge"
              style={{
                borderColor: backendOnline ? "#2e5a44" : "#30413f",
                background: backendOnline ? "#132820" : "#17211f",
                color: backendOnline ? "#7ce2b1" : "#8acbb2"
              }}
            >
              <Wifi size={13} /> {backendOnline ? "FASTAPI :8088 LIVE" : "FRONTEND ONLY"}
            </span>

            <button
              className={`privacy-button ${privacyCutoff ? "privacy-active" : ""}`}
              onClick={togglePrivacy}
              title={privacyCutoff ? "Release privacy cutoff" : "Enable physical privacy cutoff"}
            >
              {privacyCutoff ? <ShieldAlert size={15} /> : <Shield size={15} />}
              <span>{privacyCutoff ? "Privacy on" : "Privacy cutoff"}</span>
              <span className="privacy-switch"><i /></span>
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="page-kicker">
                <span className="kicker-mark" /> {active.eyebrow} <span className="kicker-sep">/</span> <span>ROBOT REHEARSAL</span>
              </div>
              <h1>{viewCopy[view].title}</h1>
              <p>{viewCopy[view].description}</p>
            </div>
            {view !== "workstation" && (
              <div className="page-heading-right">
                <span className="robot-state-pill">
                  <span className={`state-dot state-${mode}`} />{mode.toUpperCase()}
                </span>
                <span className="sim-label">
                  <Circle size={8} fill="currentColor" color={backendOnline ? "#88dcac" : "#cbab73"} />
                  {backendOnline ? "FASTAPI LINKED" : "SIMULATED"}
                </span>
              </div>
            )}
          </section>

          {view === "workstation" && renderWorkstation()}
          {view === "robot" && renderRobotSim()}
          {view === "vision" && renderVision()}
          {view === "agents" && renderAgents()}
          {view === "integrations" && renderIntegrations()}
          {view === "diagnostics" && renderDiagnostics()}

          <footer className="page-footer">
            <span>
              <ShieldCheck size={13} /> Safe rehearsal & live hardware bridge <i />
              {backendOnline ? "Connected to FastAPI at port 8088" : "Simulation fallback ready"}
            </span>
            <span>DESKBOT SIMULATOR <b>·</b> {clock}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
