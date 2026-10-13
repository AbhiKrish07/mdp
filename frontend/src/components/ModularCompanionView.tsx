import { useState, useEffect } from 'react';
import { 
  Bot, ShieldAlert, Cpu, Battery, Radio, 
  Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Hand, Volume2, Mic, AlertTriangle, Layers,
  Compass, Sliders, CheckCircle2, Box
} from 'lucide-react';
import type { AgentRole } from '../types/agent';

interface ModularCompanionViewProps {
  backendOnline: boolean;
  privacyActive: boolean;
  onTogglePrivacy: () => void;
  onDispatchToolCall?: (agent: AgentRole, tool: string, input: any, output: any) => void;
}

type ColorwayType = 'Matte White' | 'Graphite Gray' | 'Sage Green';

export const ModularCompanionView: React.FC<ModularCompanionViewProps> = ({
  backendOnline,
  privacyActive,
  onTogglePrivacy,
  onDispatchToolCall
}) => {
  // Modular Dock State
  const [dockState, setDockState] = useState<'STANDALONE' | 'DOCKED'>('DOCKED');
  const [headBattery, setHeadBattery] = useState(94);
  const [bodyBattery, setBodyBattery] = useState(88);
  const [heartbeatActive, setHeartbeatActive] = useState(true);
  const [lastHeartbeatMs, setLastHeartbeatMs] = useState(120);
  const [activeGesture, setActiveGesture] = useState<string>('idle');
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // CMF Industrial Colorway
  const [colorway, setColorway] = useState<ColorwayType>('Matte White');

  // 2-DOF Arm Kinematics & Gripper
  const [shoulderPitchDeg, setShoulderPitchDeg] = useState(15); // -45 to 90
  const [elbowRotationDeg, setElbowRotationDeg] = useState(40); // 0 to 135
  const [gripperState, setGripperState] = useState<'release' | 'grasp'>('release');

  // Edge sensors
  const [cliffLeft, setCliffLeft] = useState(false);
  const [cliffCenter, setCliffCenter] = useState(false);
  const [cliffRight, setCliffRight] = useState(false);

  // Motor locomotion state
  const [motorState, setMotorState] = useState<'IDLE' | 'MOVING' | 'STOPPED'>('IDLE');
  const [motorSpeed, setMotorSpeed] = useState(0.2); // m/s
  const [driveDirection, setDriveDirection] = useState<string>('STOPPED');

  // Tap-to-talk in handheld mode
  const [isTapToTalking, setIsTapToTalking] = useState(false);
  const [handheldAudioLog, setHandheldAudioLog] = useState<string[]>([]);

  // Periodically fetch telemetry from FastAPI backend if online
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      if (!backendOnline) return;
      try {
        const res = await fetch('http://localhost:8088/api/v1/modular/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          if (data.dock_state) {
            setDockState(data.dock_state === 'STANDALONE' ? 'STANDALONE' : 'DOCKED');
          }
          if (data.colorway && ['Matte White', 'Graphite Gray', 'Sage Green'].includes(data.colorway)) {
            setColorway(data.colorway as ColorwayType);
          }
          if (data.arm_kinematics) {
            if (typeof data.arm_kinematics.shoulder_pitch_deg === 'number') {
              setShoulderPitchDeg(data.arm_kinematics.shoulder_pitch_deg);
            }
            if (typeof data.arm_kinematics.elbow_rotation_deg === 'number') {
              setElbowRotationDeg(data.arm_kinematics.elbow_rotation_deg);
            }
            if (data.arm_kinematics.gripper_state) {
              setGripperState(data.arm_kinematics.gripper_state);
            }
          }
          if (data.head?.battery_pct !== undefined) {
            setHeadBattery(data.head.battery_pct);
          }
          if (data.body?.body_battery_pct !== undefined) {
            setBodyBattery(data.body.body_battery_pct);
          }
          if (data.body?.watchdog_elapsed_ms !== undefined) {
            setLastHeartbeatMs(data.body.watchdog_elapsed_ms);
            setHeartbeatActive(data.body.watchdog_ok);
          }
        }
      } catch {
        // Fallback to internal simulation
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [backendOnline]);

  // Simulate heartbeat pulse
  useEffect(() => {
    const pulse = setInterval(() => {
      setLastHeartbeatMs(prev => (prev > 350 ? 80 : prev + 40));
    }, 400);
    return () => clearInterval(pulse);
  }, []);

  // Handle Colorway Change
  const handleColorwayChange = async (cw: ColorwayType) => {
    setColorway(cw);
    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/colorway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colorway: cw })
        });
      } catch (err) {
        console.error("Failed to sync colorway:", err);
      }
    }
  };

  // Handle Arm Kinematics Update
  const handleArmKinematicsChange = async (
    shoulder: number = shoulderPitchDeg,
    elbow: number = elbowRotationDeg,
    gripper: 'release' | 'grasp' = gripperState
  ) => {
    setShoulderPitchDeg(shoulder);
    setElbowRotationDeg(elbow);
    setGripperState(gripper);

    if (dockState === 'STANDALONE') {
      setFallbackMessage("Arms disconnected: Arm kinematics can only execute when Head is docked onto Torso.");
      return;
    }

    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/arm-kinematics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shoulder_pitch_deg: shoulder,
            elbow_rotation_deg: elbow,
            gripper_state: gripper
          })
        });
      } catch (err) {
        console.error("Failed to sync arm kinematics:", err);
      }
    }
  };

  // Preset Arm Poses
  const applyArmPreset = (name: string, shoulder: number, elbow: number, gripper: 'release' | 'grasp') => {
    handleArmKinematicsChange(shoulder, elbow, gripper);
    setFallbackMessage(`Arm kinematic preset applied: ${name} (Shoulder ${shoulder}°, Elbow ${elbow}°, Gripper ${gripper.toUpperCase()})`);
  };

  // Handle Dock / Undock Transition
  const handleToggleDock = async () => {
    const nextState = dockState === 'DOCKED' ? 'STANDALONE' : 'DOCKED';
    setDockState(nextState);

    if (nextState === 'STANDALONE') {
      setMotorState('STOPPED');
      setDriveDirection('STOPPED');
      setFallbackMessage("Head detached: Operating as Meta Muse Charm handheld companion. Locomotion & servos disabled.");
    } else {
      setFallbackMessage("Head magnetically docked: 5-pin pogo connection active. Full robot locomotion & 2-DOF arms restored.");
    }

    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/dock-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: nextState })
        });
      } catch (err) {
        console.error("Error setting dock state:", err);
      }
    }

    if (onDispatchToolCall) {
      onDispatchToolCall('robot', 'modular.dock_manager.transition', { targetState: nextState }, { ok: true });
    }
  };

  // Dispatch gesture
  const handleTriggerGesture = async (gesture: string) => {
    setActiveGesture(gesture);

    if (dockState === 'STANDALONE') {
      setFallbackMessage(`Fallback active: Gesture "${gesture}" redirected to on-screen animated face expression & voice description.`);
    } else {
      setFallbackMessage(`Physical actuator active: Driving body servo arms for "${gesture}".`);
      if (gesture === 'wave') {
        handleArmKinematicsChange(45, 80, 'release');
      } else if (gesture === 'point') {
        handleArmKinematicsChange(30, 20, 'release');
      } else if (gesture === 'nudge') {
        handleArmKinematicsChange(0, 90, 'grasp');
      }
    }

    if (backendOnline) {
      try {
        const res = await fetch('http://localhost:8088/api/v1/modular/gesture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gesture })
        });
        const data = await res.json();
        if (data.spoken_announcement) {
          setHandheldAudioLog(prev => [data.spoken_announcement, ...prev.slice(0, 4)]);
        }
      } catch {
        // simulation
      }
    }

    setTimeout(() => {
      setActiveGesture('idle');
    }, 2800);
  };

  // Motor locomotion command
  const handleMotorDrive = async (action: string) => {
    if (dockState === 'STANDALONE') {
      setFallbackMessage("Cannot move: Head is detached in Muse handheld mode.");
      return;
    }

    if (cliffLeft || cliffCenter || cliffRight) {
      setFallbackMessage("Movement rejected: Cliff IR sensor boundary tripped!");
      return;
    }

    setMotorState('MOVING');
    setDriveDirection(action);

    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/body-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: `MOVE_${action}`,
            params: { speed: motorSpeed, duration_ms: 600 }
          })
        });
      } catch (err) {
        console.error("Motor drive call failed:", err);
      }
    }

    setTimeout(() => {
      setMotorState('IDLE');
      setDriveDirection('STOPPED');
    }, 800);
  };

  // Emergency Stop
  const handleEmergencyStop = async () => {
    setMotorState('STOPPED');
    setDriveDirection('STOPPED');
    setFallbackMessage("EMERGENCY STOP ACTIVATED: Body MCU motor PWM zeroed instantly.");

    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/emergency-stop', { method: 'POST' });
      } catch (err) {
        console.error("Emergency stop failed:", err);
      }
    }
  };

  // Cliff override simulation
  const handleToggleCliff = async (sensor: 'left' | 'center' | 'right') => {
    let nextVal = false;
    if (sensor === 'left') {
      nextVal = !cliffLeft;
      setCliffLeft(nextVal);
    } else if (sensor === 'center') {
      nextVal = !cliffCenter;
      setCliffCenter(nextVal);
    } else {
      nextVal = !cliffRight;
      setCliffRight(nextVal);
    }

    if (nextVal) {
      setMotorState('STOPPED');
      setDriveDirection('STOPPED');
      setFallbackMessage(`CLIFF SAFETY TRIP on ${sensor.toUpperCase()} sensor! Motors locked.`);
    }

    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/cliff-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sensor, tripped: nextVal })
        });
      } catch (err) {
        console.error("Cliff override error:", err);
      }
    }
  };

  // Colorway styling helper
  const getColorwayBadge = () => {
    switch (colorway) {
      case 'Matte White':
        return {
          border: 'border-slate-300/40',
          bg: 'bg-slate-200/10',
          text: 'text-slate-100',
          desc: 'Clean & minimal (Pearl white matte casing, cyan glow accents)'
        };
      case 'Graphite Gray':
        return {
          border: 'border-zinc-500/40',
          bg: 'bg-zinc-800/30',
          text: 'text-zinc-200',
          desc: 'Modern & premium (Anodized graphite alloy texture, cyan glow accents)'
        };
      case 'Sage Green':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/30',
          text: 'text-emerald-300',
          desc: 'Subtle & playful (Natural sage matte finish, cyan eye indicators)'
        };
    }
  };

  const currentBadge = getColorwayBadge();

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans">
      
      {/* Top Banner: Industrial Design & Modular Architecture */}
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30 bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#121029]">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl shadow-xl transition-all ${
            dockState === 'DOCKED' 
              ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-cyan-500/25' 
              : 'bg-gradient-to-tr from-purple-500 to-pink-600 text-white shadow-purple-500/25'
          }`}>
            {dockState === 'DOCKED' ? <Bot className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">
                AI Desk Companion — Compact · Modular · Expressive · Productive
              </h2>
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                dockState === 'DOCKED'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                  : 'bg-purple-950/80 text-purple-300 border-purple-700'
              }`}>
                {dockState === 'DOCKED' ? 'MODE: FULL ROBOT DOCKED (270mm H)' : 'MODE: META MUSE CHARM STANDALONE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Exploded 3-Tier Architecture · Head (180×140mm, 250–350g) · Torso (300–450g) · Dual Legs/Feet (160×150mm, 200–350g) · Total Mass: 750–1,150g
            </p>
          </div>
        </div>

        {/* Master Detach / Dock Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleDock}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all transform active:scale-95 ${
              dockState === 'DOCKED'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {dockState === 'DOCKED' ? 'Detach Head (Meta Muse Handheld)' : 'Snap & Dock Head (5-Pin Magnetic)'}
            </span>
          </button>
        </div>
      </div>

      {/* CMF Colorway Selector Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800 bg-[#0b101c]/90">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">CMF Industrial Materials & Color Options</div>
            <div className="text-[11px] text-slate-400">{currentBadge.desc}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['Matte White', 'Graphite Gray', 'Sage Green'] as ColorwayType[]).map((cw) => {
            const isSelected = colorway === cw;
            const swatchBg = cw === 'Matte White' ? 'bg-slate-100' : cw === 'Graphite Gray' ? 'bg-zinc-700' : 'bg-emerald-700';
            return (
              <button
                key={cw}
                onClick={() => handleColorwayChange(cw)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isSelected 
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm shadow-cyan-500/20' 
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${swatchBg} border border-white/20`} />
                <span>{cw}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Physical & Kinematics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: 3-Tier Exploded Mechanical Stack Diagram */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* TIER 1: UPPER HEAD MODULE */}
          <div className={`glass-panel p-5 rounded-2xl border transition-all ${
            dockState === 'STANDALONE' 
              ? 'border-purple-500/50 bg-[#100f24]/90 shadow-[0_0_25px_rgba(168,85,247,0.15)]' 
              : 'border-slate-800 bg-[#0d131f]/90'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  Module 1: Standalone Head (Detachable AI Brain)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Meta Muse Charm Spec
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>180 mm W × 140 mm D</span>
                <span className="text-cyan-400 font-bold">250–350 g</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Face Screen Preview with Glowing Headphone Ring Accents */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-2">
                  2.8" LCD Display (Cyan Eyes)
                </div>
                
                {/* Visual Representation of Robot Head with Cyan Ring Headphones */}
                <div className="relative flex items-center justify-center w-28 h-20 bg-slate-900 rounded-2xl border border-slate-700 shadow-inner">
                  {/* Left Cyan Headphone Ring Glow */}
                  <div className="absolute -left-2.5 w-3.5 h-8 rounded-l-full bg-cyan-500 shadow-[0_0_12px_#06b6d4] border border-cyan-300"></div>
                  
                  {/* Face Display Screen */}
                  <div className="w-20 h-14 bg-black rounded-xl border border-slate-800 flex items-center justify-center">
                    <span className="text-2xl font-bold text-cyan-400 font-mono tracking-wider drop-shadow-[0_0_8px_#06b6d4]">
                      {activeGesture === 'wave' ? '^ o ^' :
                       activeGesture === 'point' ? 'o _ o' :
                       activeGesture === 'nudge' ? '> _ <' :
                       privacyActive ? '- _ -' : '^   ^'}
                    </span>
                  </div>

                  {/* Right Cyan Headphone Ring Glow */}
                  <div className="absolute -right-2.5 w-3.5 h-8 rounded-r-full bg-cyan-500 shadow-[0_0_12px_#06b6d4] border border-cyan-300"></div>
                </div>

                <div className="flex items-center justify-between w-full mt-3 px-1 text-[10px] font-mono text-slate-400">
                  <span>1080p 120° FOV Cam</span>
                  <span className="text-cyan-400">Dual Far-Field Mics</span>
                </div>

                {dockState === 'STANDALONE' && (
                  <div className="absolute top-1 right-2 text-[9px] font-mono text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded">
                    Handheld Active
                  </div>
                )}
              </div>

              {/* Head Hardware Stats */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between text-xs font-mono space-y-1.5">
                <div className="text-[10px] uppercase text-slate-400 font-bold flex items-center justify-between">
                  <span>Compute & Blower</span>
                  <span className="text-cyan-400 font-bold">Pi 5 (8GB)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-cyan-400" /> Active Cooler</span>
                  <span className="text-cyan-400">42.5°C / 3800 RPM</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5 text-emerald-400" /> Li-ion Battery</span>
                  <span className="text-emerald-400">{headBattery}% (2500 mAh)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5 text-blue-400" /> Mic Array</span>
                  <span className="text-blue-400">Far-field Active</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5 text-purple-400" /> 3W Speaker</span>
                  <span className="text-purple-400">Clear Voice OK</span>
                </div>
              </div>

              {/* Camera & Tap-to-Talk Handheld Controls */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] uppercase text-slate-400 font-bold font-mono">
                  <span>Physical Privacy</span>
                  <button 
                    onClick={onTogglePrivacy}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      privacyActive ? 'bg-red-500 text-white' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {privacyActive ? 'HARDWARE OFF' : 'HARDWARE ON'}
                  </button>
                </div>

                {/* Meta Muse Tap-To-Talk Button */}
                <button
                  onMouseDown={() => setIsTapToTalking(true)}
                  onMouseUp={() => setIsTapToTalking(false)}
                  onTouchStart={() => setIsTapToTalking(true)}
                  onTouchEnd={() => setIsTapToTalking(false)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    isTapToTalking
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white scale-[0.98] ring-2 ring-purple-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-800/60'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>{isTapToTalking ? 'Listening to Voice...' : 'Tap & Hold (Muse)'}</span>
                </button>

                <div className="text-[10px] text-slate-500 text-center font-mono">
                  Magnetic Dock / USB-C link ready
                </div>
              </div>
            </div>
          </div>

          {/* TIER 2 DOCKING CONNECTOR: 5-PIN MAGNETIC POGO */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="z-10 px-4 py-1.5 rounded-full bg-slate-900 border border-cyan-500/50 text-[11px] font-mono text-cyan-300 flex items-center gap-2.5 shadow-lg">
              <Radio className={`w-3.5 h-3.5 ${dockState === 'DOCKED' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              </div>
              <span>
                {dockState === 'DOCKED' 
                  ? '5-Pin Magnetic Pogo Dock Engaged · Keyed Polarity · 115.2k Baud' 
                  : 'Dock Detached · Magnets Open · Auto Disconnect Safe'}
              </span>
            </div>
          </div>

          {/* TIER 2: COMPACT TORSO MODULE */}
          <div className={`glass-panel p-5 rounded-2xl border transition-all ${
            dockState === 'DOCKED' 
              ? 'border-cyan-500/40 bg-[#0d1424]/90' 
              : 'border-slate-800/60 bg-[#0a0d14]/70 opacity-60'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dockState === 'DOCKED' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}></div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  Module 2: Compact Torso & Actuators
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    ESP32 Core
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>Controllers & Servos</span>
                <span className="text-cyan-400 font-bold">300–450 g</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Watchdog & Heartbeat */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between text-xs font-mono space-y-2">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Heartbeat Watchdog</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={heartbeatActive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {lastHeartbeatMs} ms (Healthy)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auto-Kill Limit:</span>
                  <span className="text-amber-400">500 ms Max</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Arm Drivers:</span>
                  <span className="text-cyan-400">2x 2-DOF PWM</span>
                </div>
              </div>

              {/* Body Power Rail */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between text-xs font-mono space-y-2">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Torso Power Rail</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Motor 2S LiPo:</span>
                  <span className="text-emerald-400 font-bold">{bodyBattery}% (7.4V)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ground Isolation:</span>
                  <span className="text-emerald-400">Opto-Isolated</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Leg Mount:</span>
                  <span className="text-cyan-400">Reinforced Joint</span>
                </div>
              </div>

              {/* Cliff / Drop Sensors Radar */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between text-xs font-mono">
                <div className="text-[10px] uppercase text-slate-400 font-bold">3x Cliff IR Sensors</div>
                <div className="flex items-center justify-between gap-1 my-2">
                  <button
                    onClick={() => handleToggleCliff('left')}
                    className={`flex-1 py-1 px-1 rounded text-center text-[10px] font-bold border transition-colors ${
                      cliffLeft ? 'bg-red-900/80 text-red-200 border-red-600' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    L: {cliffLeft ? 'TRIP' : 'OK'}
                  </button>
                  <button
                    onClick={() => handleToggleCliff('center')}
                    className={`flex-1 py-1 px-1 rounded text-center text-[10px] font-bold border transition-colors ${
                      cliffCenter ? 'bg-red-900/80 text-red-200 border-red-600' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    C: {cliffCenter ? 'TRIP' : 'OK'}
                  </button>
                  <button
                    onClick={() => handleToggleCliff('right')}
                    className={`flex-1 py-1 px-1 rounded text-center text-[10px] font-bold border transition-colors ${
                      cliffRight ? 'bg-red-900/80 text-red-200 border-red-600' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    R: {cliffRight ? 'TRIP' : 'OK'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 text-center">
                  Simulate desk edge detection
                </div>
              </div>
            </div>
          </div>

          {/* TIER 3: LEG & FOOT MODULES */}
          <div className={`glass-panel p-5 rounded-2xl border transition-all ${
            dockState === 'DOCKED' 
              ? 'border-blue-500/30 bg-[#0c1220]/90' 
              : 'border-slate-800/50 bg-[#090d14]/60 opacity-60'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  Module 3: Dual Structural Legs & Feet (Pair)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    High Stability
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>160 mm W × 150 mm D Footprint</span>
                <span className="text-cyan-400 font-bold">200–350 g (pair)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Structural Leg Frame</div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Aluminum + ABS hollow frame with internal cable routing & reinforced joint.
                </p>
                <div className="text-[10px] text-emerald-400 mt-2 font-bold">Rigid & Lightweight</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Wide Foot Base</div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Low-profile wide foot design with large contact area for desk-scale stability.
                </p>
                <div className="text-[10px] text-cyan-400 mt-2 font-bold">Non-slip Rubber Sole</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Stability Sensors</div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Load sensor / IMU for balance feedback & drop detection on desk surfaces.
                </p>
                <div className="text-[10px] text-purple-400 mt-2 font-bold">Dual Load Feedback OK</div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 2-DOF Arm Kinematics & Locomotion Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Status & Fallback Message Card */}
          {fallbackMessage && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-200 text-xs flex items-start gap-3 shadow-lg animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">Safety & Capability Notification</div>
                <div className="mt-0.5 leading-relaxed">{fallbackMessage}</div>
              </div>
            </div>
          )}

          {/* 2-DOF ARM KINEMATICS & SOFT GRIPPER CONTROLLER */}
          <div className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 border transition-all ${
            dockState === 'STANDALONE' ? 'border-slate-800 opacity-60' : 'border-cyan-500/40 bg-[#0d1526]/90'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm text-slate-100">Arm Articulation & Kinematics (2-DOF)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Left & Right Servos
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Precise control of Shoulder (Forward/Back & Up/Down), Elbow (Rotation), and Soft Rubberized Gripper.
            </p>

            {/* Slider 1: Shoulder Servo Pitch */}
            <div className="flex flex-col gap-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">Shoulder Servo (Pitch/Sweep):</span>
                <span className="text-cyan-400 font-bold">{shoulderPitchDeg}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="90"
                value={shoulderPitchDeg}
                disabled={dockState === 'STANDALONE'}
                onChange={(e) => handleArmKinematicsChange(parseInt(e.target.value), elbowRotationDeg, gripperState)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-45° (Back/Down)</span>
                <span>0° (Neutral)</span>
                <span>+90° (Up/Forward)</span>
              </div>
            </div>

            {/* Slider 2: Elbow Servo Rotation */}
            <div className="flex flex-col gap-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">Elbow Servo (Rotation):</span>
                <span className="text-cyan-400 font-bold">{elbowRotationDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="135"
                value={elbowRotationDeg}
                disabled={dockState === 'STANDALONE'}
                onChange={(e) => handleArmKinematicsChange(shoulderPitchDeg, parseInt(e.target.value), gripperState)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0° (Straight)</span>
                <span>45° (Natural)</span>
                <span>135° (Full Flex)</span>
              </div>
            </div>

            {/* Soft Gripper State Toggle */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <div className="text-slate-200 font-semibold">Soft Gripper (Object-Safe)</div>
                <div className="text-[10px] text-slate-400">Rubberized compliant contact</div>
              </div>
              <button
                disabled={dockState === 'STANDALONE'}
                onClick={() => handleArmKinematicsChange(
                  shoulderPitchDeg, 
                  elbowRotationDeg, 
                  gripperState === 'release' ? 'grasp' : 'release'
                )}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  gripperState === 'grasp'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {gripperState === 'grasp' ? 'GRASP ENGAGED' : 'RELEASED (OPEN)'}
              </button>
            </div>

            {/* Quick Pose Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                disabled={dockState === 'STANDALONE'}
                onClick={() => applyArmPreset('Rest', 0, 10, 'release')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 transition-all text-center"
              >
                Rest
              </button>
              <button
                disabled={dockState === 'STANDALONE'}
                onClick={() => applyArmPreset('Reach', 60, 30, 'release')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 transition-all text-center"
              >
                Reach
              </button>
              <button
                disabled={dockState === 'STANDALONE'}
                onClick={() => applyArmPreset('Inspect', 45, 90, 'grasp')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 transition-all text-center"
              >
                Inspect
              </button>
            </div>
          </div>

          {/* Gestures Card */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm text-slate-100">Expressive Gesture Actions</h4>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                dockState === 'DOCKED' ? 'bg-cyan-950 text-cyan-300' : 'bg-purple-950 text-purple-300'
              }`}>
                {dockState === 'DOCKED' ? 'Physical Arms (PWM)' : 'Fallback: Screen + Voice'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleTriggerGesture('wave')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600/50 flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-xl">👋</span>
                <span className="text-xs font-semibold">Wave</span>
              </button>

              <button
                onClick={() => handleTriggerGesture('point')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600/50 flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-xl">👉</span>
                <span className="text-xs font-semibold">Point</span>
              </button>

              <button
                onClick={() => handleTriggerGesture('nudge')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600/50 flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-xl">⏰</span>
                <span className="text-xs font-semibold">Break Nudge</span>
              </button>
            </div>
          </div>

          {/* Desk Mobility Controls (Wheel Locomotion) */}
          <div className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 transition-all ${
            dockState === 'STANDALONE' ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm text-slate-100">Desk Mobility & Drive Controller</h4>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {driveDirection} ({motorSpeed} m/s)
              </span>
            </div>

            {/* D-Pad Drive Controls */}
            <div className="flex flex-col items-center gap-2 my-1">
              <button
                onClick={() => handleMotorDrive('FORWARD')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-900/60 border border-slate-800 hover:border-cyan-500 text-slate-200 transition-all shadow-md active:scale-95"
              >
                <ArrowUp className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleMotorDrive('LEFT')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-900/60 border border-slate-800 hover:border-cyan-500 text-slate-200 transition-all shadow-md active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400">
                  {motorState}
                </div>

                <button
                  onClick={() => handleMotorDrive('RIGHT')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-900/60 border border-slate-800 hover:border-cyan-500 text-slate-200 transition-all shadow-md active:scale-95"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => handleMotorDrive('BACKWARD')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-900/60 border border-slate-800 hover:border-cyan-500 text-slate-200 transition-all shadow-md active:scale-95"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            {/* Speed slider */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Drive Speed Limit:</span>
              <div className="flex items-center gap-2">
                {[0.1, 0.2, 0.35].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setMotorSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      motorSpeed === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {spd} m/s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Stop Button */}
          <button
            onClick={handleEmergencyStop}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>EMERGENCY MOTOR CUTOFF (HARD STOP)</span>
          </button>

          {/* Standalone Audio Log (Meta Muse Mode) */}
          {handheldAudioLog.length > 0 && (
            <div className="glass-panel p-4 rounded-xl text-xs font-mono space-y-1.5">
              <div className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Head Speaker Audio Transcripts</span>
              </div>
              {handheldAudioLog.map((log, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-purple-200">
                  {log}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
