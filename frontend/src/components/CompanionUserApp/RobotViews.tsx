import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ShieldAlert, 
  RotateCw, RefreshCw, AlertTriangle, ShieldCheck, Check,
  Clock, Plus, Trash2, Sliders, Activity
} from 'lucide-react';

interface RobotViewsProps {
  isDark: boolean;
  dockState: 'STANDALONE' | 'DOCKED';
  headBattery: number;
  bodyBattery: number;
  onToggleDock: () => void;
  backendOnline: boolean;
  activeSubTab: 'controls' | 'routines';
}

export const RobotViews: React.FC<RobotViewsProps> = ({
  isDark,
  dockState,
  headBattery,
  bodyBattery,
  onToggleDock,
  backendOnline,
  activeSubTab
}) => {
  // Motion & Canvas State
  const [robotPos, setRobotPos] = useState({ x: 250, y: 150, headingDeg: 0 });
  const [isDriving, setIsDriving] = useState(false);
  const [driveAction, setDriveAction] = useState<string>('STOPPED');
  const [speedVal, setSpeedVal] = useState('0.1');
  const [isEstop, setIsEstop] = useState(false);
  const [activeGesture, setActiveGesture] = useState<string>('idle');
  const [edgeSensorStatus, setEdgeSensorStatus] = useState<'Clear · surface stable' | 'Edge detected!'>('Clear · surface stable');

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dockState === 'STANDALONE' || isEstop) return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) handleDrive('FORWARD');
      else if (['ArrowDown', 'KeyS'].includes(e.code)) handleDrive('BACKWARD');
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) handleDrive('LEFT');
      else if (['ArrowRight', 'KeyD'].includes(e.code)) handleDrive('RIGHT');
      else if (e.code === 'Space') handleStop();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dockState, isEstop, robotPos]);

  // Render Interactive Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desk Surface Pattern
    ctx.strokeStyle = isDark ? '#262a30' : '#e8e5dc';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Desk Edge Safety Boundary Zone
    ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(30, 20, canvas.width - 60, canvas.height - 40);
    ctx.setLineDash([]);

    // Check boundary
    const isNearEdge = 
      robotPos.x < 50 || robotPos.x > canvas.width - 50 || 
      robotPos.y < 40 || robotPos.y > canvas.height - 40;

    if (isNearEdge && edgeSensorStatus !== 'Edge detected!') {
      setEdgeSensorStatus('Edge detected!');
    } else if (!isNearEdge && edgeSensorStatus === 'Edge detected!') {
      setEdgeSensorStatus('Clear · surface stable');
    }

    // Draw Robot (Still One)
    ctx.save();
    ctx.translate(robotPos.x, robotPos.y);
    ctx.rotate((robotPos.headingDeg * Math.PI) / 180);

    // Shadow
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Base (if Docked)
    if (dockState === 'DOCKED') {
      ctx.fillStyle = isDark ? '#2b3036' : '#dcd8cc';
      ctx.beginPath();
      ctx.roundRect(-20, -14, 40, 28, 8);
      ctx.fill();

      // Dual wheels
      ctx.fillStyle = isDark ? '#111315' : '#333';
      ctx.fillRect(-22, -12, 4, 24);
      ctx.fillRect(18, -12, 4, 24);

      // Gesture Arms
      if (activeGesture === 'wave') {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-26, -18, 5, 12);
      }
    }

    // Head Module
    ctx.fillStyle = isDark ? '#1a1d21' : '#ffffff';
    ctx.strokeStyle = isDark ? '#4b5563' : '#b0aba0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-16, -12, 32, 24, 6);
    ctx.fill();
    ctx.stroke();

    // Cyan glowing headphone rings
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillRect(-18, -6, 2, 12);
    ctx.fillRect(16, -6, 2, 12);
    ctx.shadowBlur = 0;

    // Face screen
    ctx.fillStyle = '#000000';
    ctx.fillRect(-12, -8, 24, 16);

    // Glowing Cyan Eyes
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const eyes = activeGesture === 'nod' ? '-  -' : 
                 activeGesture === 'look' ? 'o  o' : 
                 activeGesture === 'wave' ? '^  o' : '^  ^';
    ctx.fillText(eyes, 0, 0);

    ctx.restore();
  }, [robotPos, dockState, isDark, activeGesture]);

  // Motion Handlers
  const handleDrive = async (dir: string) => {
    if (dockState === 'STANDALONE' || isEstop) return;

    setIsDriving(true);
    setDriveAction(dir);

    // Update physical coordinates
    const step = 14;
    setRobotPos(prev => {
      let nx = prev.x;
      let ny = prev.y;
      let nh = prev.headingDeg;

      if (dir === 'FORWARD') {
        nx += Math.sin((nh * Math.PI) / 180) * step;
        ny -= Math.cos((nh * Math.PI) / 180) * step;
      } else if (dir === 'BACKWARD') {
        nx -= Math.sin((nh * Math.PI) / 180) * step;
        ny += Math.cos((nh * Math.PI) / 180) * step;
      } else if (dir === 'LEFT') {
        nh = (nh - 25) % 360;
      } else if (dir === 'RIGHT') {
        nh = (nh + 25) % 360;
      }

      // Constrain inside desk
      nx = Math.max(35, Math.min(465, nx));
      ny = Math.max(25, Math.min(275, ny));
      return { x: nx, y: ny, headingDeg: nh };
    });

    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/body-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: `MOVE_${dir}`, params: { speed: parseFloat(speedVal) } })
        });
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      setIsDriving(false);
      setDriveAction('STOPPED');
    }, 400);
  };

  const handleStop = async () => {
    setDriveAction('STOPPED');
    setIsDriving(false);
    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/body-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STOP' })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleGesture = async (gesture: string) => {
    setActiveGesture(gesture);
    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/gesture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gesture })
        });
      } catch (err) {
        console.error(err);
      }
    }
    setTimeout(() => setActiveGesture('idle'), 2500);
  };

  const handleEmergencyStop = async () => {
    setIsEstop(true);
    handleStop();
    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/emergency-stop', { method: 'POST' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* SUBTAB 1: ROBOT CONTROLS (PAGES 16-18) */}
      {activeSubTab === 'controls' && (
        <div className="space-y-6">
          
          {/* Header & E-Stop */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif tracking-tight font-medium">Stay in control.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dockState === 'DOCKED'
                  ? 'Docked robot mode · Head and body connected, safety checks passed.'
                  : 'Standalone head mode · Conversation, vision, and head gestures only.'}
              </p>
            </div>

            <button
              onClick={isEstop ? () => setIsEstop(false) : handleEmergencyStop}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                isEstop ? 'bg-red-700 animate-pulse' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isEstop ? 'STOP ENGAGED (CLICK TO RESET)' : 'Emergency stop'}</span>
            </button>
          </div>

          {/* Warning banner if detached or E-Stop */}
          {dockState === 'STANDALONE' && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isDark ? 'bg-amber-950/20 border-amber-600/30 text-amber-200' : 'bg-[#fff9eb] border-[#ebdcb2] text-[#5c4214]'
            }`}>
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>No body movement in standalone head mode</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                The body is disconnected. Driving, body gestures, and return-to-dock are disabled. Attach the head to a connected, calibrated body to enable them.
              </p>
            </div>
          )}

          {isEstop && (
            <div className="p-4 rounded-2xl border border-red-500/40 bg-red-950/20 text-red-200 text-xs">
              <span className="font-bold">Emergency stop engaged · movement unavailable:</span> Motor PWM zeroed immediately.
            </div>
          )}

          {/* Main 2-Column Controls Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Device & Hardware Card */}
            <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
              isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/10 dark:border-slate-800 mb-4">
                  <span className="text-sm font-semibold">Still One</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {dockState === 'DOCKED' ? 'Docked robot' : 'Head only'}
                  </span>
                </div>

                {/* Robot visualizer */}
                <div className="flex justify-center my-4">
                  <div className={`w-28 h-32 rounded-2xl border flex flex-col items-center justify-center p-3 shadow-inner ${
                    isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#f4f3ea] border-[#dcd9cb]'
                  }`}>
                    <div className="w-20 h-12 bg-black rounded-xl flex items-center justify-center">
                      <span className="text-sm font-mono text-cyan-400 font-bold tracking-widest">
                        {activeGesture !== 'idle' ? `^ ${activeGesture} ^` : '^  ^'}
                      </span>
                    </div>
                    {dockState === 'DOCKED' && (
                      <div className="w-16 h-8 -mt-1 rounded-xl bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-mono pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Head · H-024</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{headBattery}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Body · B-024</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {dockState === 'DOCKED' ? `${bodyBattery}%` : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Charging dock</span>
                    <span className="text-slate-400">Nearby</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 mt-4 space-y-2">
                <button
                  onClick={onToggleDock}
                  className={`w-full py-2 rounded-xl text-xs border font-medium ${
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                  }`}
                >
                  {dockState === 'DOCKED' ? 'Detach Head (Handheld)' : 'Dock Head to Body'}
                </button>
                <div className="text-[10px] text-slate-400 text-center font-mono">
                  The head is docked on the body. The robot is not charging.
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Canvas, D-Pad, Gestures & Telemetry */}
            <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-5 ${
              isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
            }`}>
              
              {/* Top Row: Speed & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Movement</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {dockState === 'DOCKED' ? 'Movement ready · Surface calibrated' : 'Movement disabled'}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Speed</span>
                  <select
                    value={speedVal}
                    onChange={(e) => setSpeedVal(e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
                    }`}
                  >
                    <option value="0.1">Low · 0.1 m/s</option>
                    <option value="0.2">Med · 0.2 m/s</option>
                    <option value="0.35">Max · 0.35 m/s</option>
                  </select>
                </div>
              </div>

              {/* LIVE DESK CANVAS */}
              <div className="relative w-full flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={300}
                  className={`w-full max-w-[500px] h-[300px] rounded-2xl border shadow-inner ${
                    isDark ? 'bg-[#141618] border-slate-800' : 'bg-[#f7f5ed] border-[#e2dfd4]'
                  }`}
                />
              </div>

              {/* D-Pad Controller */}
              <div className="flex flex-col items-center gap-2">
                <button
                  disabled={dockState === 'STANDALONE' || isEstop}
                  onClick={() => handleDrive('FORWARD')}
                  className={`p-3 rounded-xl border text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-[#d8d6cc] hover:bg-slate-100'
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <button
                    disabled={dockState === 'STANDALONE' || isEstop}
                    onClick={() => handleDrive('LEFT')}
                    className={`p-3 rounded-xl border text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-[#d8d6cc] hover:bg-slate-100'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleStop}
                    className={`w-12 h-12 rounded-xl border font-mono text-[10px] flex items-center justify-center font-bold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100 border-[#d8d6cc] text-slate-600'
                    }`}
                  >
                    {driveAction}
                  </button>

                  <button
                    disabled={dockState === 'STANDALONE' || isEstop}
                    onClick={() => handleDrive('RIGHT')}
                    className={`p-3 rounded-xl border text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-[#d8d6cc] hover:bg-slate-100'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <button
                  disabled={dockState === 'STANDALONE' || isEstop}
                  onClick={() => handleDrive('BACKWARD')}
                  className={`p-3 rounded-xl border text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-[#d8d6cc] hover:bg-slate-100'
                  }`}
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 text-center font-mono">
                Arrow keys / WASD to move · Space to stop
              </div>

              {/* Expressive Gestures (Page 16) */}
              <div className="pt-3 border-t border-slate-700/10 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold">Gestures</span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleGesture('nod')}
                    className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                      isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                    }`}
                  >
                    Nod
                  </button>
                  <button
                    onClick={() => handleGesture('look')}
                    className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                      isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                    }`}
                  >
                    Look around
                  </button>
                  <button
                    disabled={dockState === 'STANDALONE'}
                    onClick={() => handleGesture('wave')}
                    className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                      isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                    }`}
                  >
                    Wave body
                  </button>
                  <button
                    disabled={dockState === 'STANDALONE'}
                    onClick={() => handleDrive('RIGHT')}
                    className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                      isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                    }`}
                  >
                    Turn in place
                  </button>
                </div>
              </div>

              {/* Safety & Sensors Live Table (Page 16) */}
              <div className="pt-3 border-t border-slate-700/10 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Safety & sensors</span>
                  <span className="text-[10px] text-slate-400 font-mono">Updated just now</span>
                </div>
                <div className="divide-y divide-slate-700/10 dark:divide-slate-800 font-mono text-[11px]">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-400">Body connection</span>
                    <span className="text-emerald-500 font-bold">{dockState === 'DOCKED' ? 'Connected' : 'Offline · movement locked'}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-400">Emergency stop</span>
                    <span className={isEstop ? 'text-red-500 font-bold' : 'text-slate-500'}>
                      {isEstop ? 'Engaged · release after resolving' : 'Not engaged'}
                    </span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-400">Edge & obstacle sensors</span>
                    <span className={edgeSensorStatus.includes('detected') ? 'text-red-500 font-bold' : 'text-emerald-500'}>
                      {edgeSensorStatus}
                    </span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-400">Calibration</span>
                    <span className="text-emerald-500">Passed · 12 Oct 2026</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 2: ROUTINES (PAGE 19) */}
      {activeSubTab === 'routines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Routine List */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Your routines</span>
                <button className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cc]'
                }`}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* Active Morning arrival */}
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-[#2c332d] border-emerald-800 text-emerald-200' : 'bg-[#edf5ee] border-[#c2dec6] text-[#244228]'
              }`}>
                <div className="font-semibold text-xs">Morning arrival</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Weekdays · 09:00 · Enabled</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-700/10 dark:border-slate-800 text-xs">
                <div className="font-medium">Focus companion</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">When focus starts · Enabled</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-700/10 dark:border-slate-800 text-xs opacity-60">
                <div className="font-medium">End-of-day reset</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Weekdays · 18:00 · Paused</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Templates</span>
              <div className="space-y-1.5 mt-2">
                <div className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">A gentle break reminder →</div>
                <div className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">A daily planning moment →</div>
              </div>
            </div>
          </div>

          {/* Right Routine Step Builder */}
          <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-5 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/10 dark:border-slate-800 mb-4">
                <div>
                  <h2 className="text-xl font-serif font-medium">Morning arrival</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Daily desktop sequence</p>
                </div>
                <button className={`px-4 py-2 rounded-xl text-xs font-medium text-white shadow-sm ${
                  isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
                }`}>
                  Save routine
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Routine name</label>
                  <input
                    type="text"
                    defaultValue="Morning arrival"
                    className={`w-full mt-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Trigger</label>
                  <select
                    className={`w-full mt-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
                    }`}
                  >
                    <option>On a schedule</option>
                    <option>When seated</option>
                  </select>
                </div>
              </div>

              {/* Action Sequence Steps */}
              <div className="space-y-3">
                <span className="text-xs font-semibold">Then do these things</span>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#e8e6dc]'
                }`}>
                  <div>
                    <div className="font-semibold">Offer a morning greeting</div>
                    <div className="text-[11px] text-slate-400 font-mono">Head gesture: nod · Voice: soft</div>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">Step 1</span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#e8e6dc]'
                }`}>
                  <div>
                    <div className="font-semibold">Read my next two events</div>
                    <div className="text-[11px] text-slate-400 font-mono">Google Calendar · Read-only · Keep private</div>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">Step 2</span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#e8e6dc]'
                }`}>
                  <div>
                    <div className="font-semibold">Suggest a focus task</div>
                    <div className="text-[11px] text-slate-400 font-mono">From active tasks · Ask before starting a timer</div>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">Step 3</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button className={`px-3 py-1.5 rounded-xl border text-xs ${
                  isDark ? 'border-slate-700' : 'border-[#d8d6cb]'
                }`}>
                  Add action
                </button>
                <button 
                  onClick={() => handleGesture('nod')}
                  className={`px-3 py-1.5 rounded-xl border text-xs text-emerald-600 dark:text-emerald-400 ${
                    isDark ? 'border-emerald-800' : 'border-[#c2dec6]'
                  }`}
                >
                  Test routine
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              Movement actions are skipped in head mode or when any safety check fails. A routine can never override emergency stop or approval requirements.
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
