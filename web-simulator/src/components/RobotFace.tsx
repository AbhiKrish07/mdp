import React, { useEffect, useState } from 'react';

export type FaceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'alert' | 'nudge';

interface RobotFaceProps {
  state: FaceState;
  privacyActive: boolean;
  micLevel?: number;
}

export const RobotFace: React.FC<RobotFaceProps> = ({ state, privacyActive, micLevel = 0 }) => {
  const [blink, setBlink] = useState(false);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

  // Blinking loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Micro pupil wander in idle
  useEffect(() => {
    if (state === 'idle') {
      const interval = setInterval(() => {
        setPupilPos({
          x: (Math.random() - 0.5) * 12,
          y: (Math.random() - 0.5) * 8
        });
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setPupilPos({ x: 0, y: 0 });
    }
  }, [state]);

  if (privacyActive) {
    return (
      <div className="relative w-full h-56 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-red-900/40 p-4">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center mb-3 glow-red">
          <div className="w-6 h-6 rounded-sm bg-red-500 animate-pulse" />
        </div>
        <div className="text-red-400 font-mono text-sm tracking-wide uppercase font-bold">HARD PRIVACY CUTOFF ENGAGED</div>
        <div className="text-slate-500 text-xs mt-1">Camera & Microphone physically disconnected</div>
      </div>
    );
  }

  // Color dynamic based on state
  const getStateGlow = () => {
    switch (state) {
      case 'listening': return 'border-cyan-400/60 shadow-[0_0_30px_rgba(0,242,254,0.35)]';
      case 'thinking': return 'border-purple-400/60 shadow-[0_0_30px_rgba(127,0,255,0.35)] animate-pulse';
      case 'speaking': return 'border-blue-400/60 shadow-[0_0_35px_rgba(79,172,254,0.4)]';
      case 'happy': return 'border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.35)]';
      case 'alert': return 'border-amber-400/60 shadow-[0_0_30px_rgba(255,179,2,0.4)]';
      case 'nudge': return 'border-pink-400/60 shadow-[0_0_30px_rgba(236,72,153,0.4)]';
      default: return 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,254,0.15)]';
    }
  };

  return (
    <div className={`relative w-full h-56 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center border transition-all duration-500 overflow-hidden ${getStateGlow()}`}>
      
      {/* Background Matrix HUD grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {/* Robot Eye Container */}
      <div className="flex items-center justify-center gap-12 z-10">
        
        {/* Left Eye */}
        <div className={`relative transition-all duration-300 ${blink ? 'scale-y-10' : 'scale-y-100'}`}>
          <svg width="76" height="76" viewBox="0 0 76 76" className="overflow-visible">
            <defs>
              <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
              </linearGradient>
            </defs>

            {/* Outer ring */}
            <circle cx="38" cy="38" r="34" fill="none" stroke="url(#eyeGrad)" strokeWidth="3" opacity="0.8" />
            
            {/* Eye shape based on state */}
            {state === 'happy' ? (
              <path d="M 18 44 Q 38 20 58 44" fill="none" stroke="#00f2fe" strokeWidth="6" strokeLinecap="round" />
            ) : state === 'alert' ? (
              <polygon points="38,12 62,56 14,56" fill="none" stroke="#ffb302" strokeWidth="4" />
            ) : (
              <>
                <circle cx={38 + pupilPos.x} cy={38 + pupilPos.y} r="22" fill="url(#eyeGrad)" className="transition-transform duration-200" />
                <circle cx={44 + pupilPos.x} cy={32 + pupilPos.y} r="6" fill="#ffffff" opacity="0.9" />
              </>
            )}
          </svg>
        </div>

        {/* Right Eye */}
        <div className={`relative transition-all duration-300 ${blink ? 'scale-y-10' : 'scale-y-100'}`}>
          <svg width="76" height="76" viewBox="0 0 76 76" className="overflow-visible">
            {/* Outer ring */}
            <circle cx="38" cy="38" r="34" fill="none" stroke="url(#eyeGrad)" strokeWidth="3" opacity="0.8" />
            
            {/* Eye shape based on state */}
            {state === 'happy' ? (
              <path d="M 18 44 Q 38 20 58 44" fill="none" stroke="#00f2fe" strokeWidth="6" strokeLinecap="round" />
            ) : state === 'alert' ? (
              <polygon points="38,12 62,56 14,56" fill="none" stroke="#ffb302" strokeWidth="4" />
            ) : (
              <>
                <circle cx={38 + pupilPos.x} cy={38 + pupilPos.y} r="22" fill="url(#eyeGrad)" className="transition-transform duration-200" />
                <circle cx={44 + pupilPos.x} cy={32 + pupilPos.y} r="6" fill="#ffffff" opacity="0.9" />
              </>
            )}
          </svg>
        </div>

      </div>

      {/* Voice Wave / Speech Dynamics Mouth Bar */}
      <div className="mt-4 flex items-center gap-1.5 h-6">
        {state === 'speaking' || state === 'listening' ? (
          [12, 22, 16, 28, 18, 10].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-cyan-400 rounded-full animate-pulse transition-all"
              style={{
                height: state === 'speaking' ? `${Math.max(6, (h + Math.sin(Date.now() / 150 + i) * 12))}px` : `${Math.max(4, micLevel * 30)}px`,
                animationDelay: `${i * 80}ms`
              }}
            />
          ))
        ) : (
          <div className="w-12 h-1 bg-cyan-500/40 rounded-full" />
        )}
      </div>

      {/* Status Badge */}
      <div className="absolute bottom-3 left-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${state === 'listening' ? 'bg-cyan-400 animate-ping' : 'bg-cyan-500'}`} />
        <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">{state} MODE</span>
      </div>

    </div>
  );
};
