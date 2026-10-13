import React from 'react';
import { Check, X, Shield, ArrowRight, Wifi, RefreshCw } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  headBattery: number;
  bodyBattery: number;
  isDark: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  headBattery,
  bodyBattery,
  isDark
}) => {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [name, setName] = React.useState('Alex Chen');
  const [deskName, setDeskName] = React.useState("Alex's desk");
  const [agreeTerms, setAgreeTerms] = React.useState(true);
  const [wifiSsid, setWifiSsid] = React.useState('Studio_5G');
  const [wifiPassword, setWifiPassword] = React.useState('••••••••••••');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-4xl h-[620px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border transition-colors ${
        isDark ? 'bg-[#1e2124] border-slate-800 text-slate-100' : 'bg-[#faf9f5] border-[#e7e5dc] text-[#1e2321]'
      }`}>
        
        {/* Left Editorial Branding Column */}
        <div className={`w-full md:w-5/12 p-8 flex flex-col justify-between border-r ${
          isDark ? 'bg-[#17191b] border-slate-800' : 'bg-[#f3f2ea] border-[#e7e5dc]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-serif tracking-tight font-medium">still</span>
              <span className="text-xs text-slate-400 font-mono">Setup help ↗</span>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-6 mb-8 text-[11px] font-medium tracking-wide text-slate-400">
              <span className={`cursor-pointer transition-colors ${step === 1 ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : ''}`} onClick={() => setStep(1)}>
                • Welcome
              </span>
              <span className={`cursor-pointer transition-colors ${step === 2 ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : ''}`} onClick={() => setStep(2)}>
                • Connect
              </span>
              <span className={`cursor-pointer transition-colors ${step === 3 ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : ''}`} onClick={() => setStep(3)}>
                • Make it yours
              </span>
            </div>

            {/* Still One Render Illustration */}
            <div className="my-6 flex justify-center">
              <div className="relative w-36 h-40 flex flex-col items-center justify-center">
                {/* Robot Head */}
                <div className={`w-28 h-20 rounded-2xl border flex items-center justify-center shadow-lg relative ${
                  isDark ? 'bg-[#25292e] border-slate-700' : 'bg-white border-[#d8d6cb]'
                }`}>
                  <div className="w-20 h-14 bg-black rounded-xl flex items-center justify-center">
                    <span className="text-xl font-mono text-cyan-400 tracking-widest font-bold">^  ^</span>
                  </div>
                  {/* Cyan headphone rings */}
                  <div className="absolute -left-2 w-2.5 h-6 rounded-l-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                  <div className="absolute -right-2 w-2.5 h-6 rounded-r-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                </div>
                {/* Robot Body */}
                <div className={`w-24 h-16 -mt-2 rounded-2xl border flex items-center justify-center shadow-md ${
                  isDark ? 'bg-[#202327] border-slate-700' : 'bg-[#eae8dd] border-[#cfcdc2]'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-serif font-medium mt-2 leading-snug">
              A little presence.<br />A clearer day.
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Meet Still One. A thoughtful desk companion for your ideas, your work, and everything in between.
            </p>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t pt-4 border-slate-700/20">
            Use the head on its own for conversation and vision. Connect the body to enable safe movement and gestures.
          </p>
        </div>

        {/* Right Form Workflow Column */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between overflow-y-auto">
          
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                  Getting Started · 1 of 3
                </span>
                <h2 className="text-2xl font-serif font-medium mt-1">Make room for a better day.</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Let's set up your companion. It takes about three minutes, and you're always in control.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                      isDark ? 'bg-[#17191b] border-slate-700 focus:border-cyan-500' : 'bg-white border-[#d8d6cc] focus:border-[#3b4d3c]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Workspace name
                  </label>
                  <input
                    type="text"
                    value={deskName}
                    onChange={(e) => setDeskName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                      isDark ? 'bg-[#17191b] border-slate-700 focus:border-cyan-500' : 'bg-white border-[#d8d6cc] focus:border-[#3b4d3c]'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">You can change this any time in Settings.</p>
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <span className="text-xs text-slate-500 leading-snug">
                    I agree to the Terms of Service and have read the Privacy Policy.
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  disabled={!agreeTerms}
                  onClick={() => setStep(2)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-medium text-white shadow-md transition-all flex items-center gap-2 ${
                    isDark ? 'bg-[#405644] hover:bg-[#4e6853]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                  }`}
                >
                  <span>Continue to device setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-700/20">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Built around your boundaries</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Camera and microphone access are optional. Still will ask before taking an action outside your workspace.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: CONNECT */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                  Getting Started · 2 of 3
                </span>
                <h2 className="text-2xl font-serif font-medium mt-1">Find your Still One.</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Turn on the head and keep it nearby. Your computer and companion should use the same Wi-Fi network.
                </p>
              </div>

              {/* Error banner option */}
              {connectionError ? (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-600/40 text-amber-200 text-xs flex flex-col gap-1.5">
                  <span className="font-semibold text-amber-300">Wi-Fi connection timed out</span>
                  <span className="text-[11px] text-slate-400">
                    The network didn't respond within 30 seconds. Your device hasn't been paired. Error NET-104.
                  </span>
                  <button 
                    onClick={() => setConnectionError(false)} 
                    className="text-[11px] underline text-amber-300 self-start mt-1"
                  >
                    Dismiss and retry
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Searching for nearby devices… 1 found</span>
                </div>
              )}

              {/* Device Card */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-[#17191b] border-slate-700' : 'bg-white border-[#d8d6cc]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="font-medium text-xs">Still One · H-024</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-500">Ready to pair</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Head · Bluetooth nearby · signal strong<br />
                  Body B-024 will connect after the head is paired.
                </p>
              </div>

              {/* Wi-Fi inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Wi-Fi network
                  </label>
                  <select
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-[#17191b] border-slate-700' : 'bg-white border-[#d8d6cc]'
                    }`}
                  >
                    <option value="Studio_5G">Studio_5G</option>
                    <option value="Home_Office_IoT">Home_Office_IoT</option>
                    <option value="Desk_Guest">Desk_Guest</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Network password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-[#17191b] border-slate-700' : 'bg-white border-[#d8d6cc]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-medium text-white shadow-md transition-all ${
                    isDark ? 'bg-[#405644] hover:bg-[#4e6853]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                  }`}
                >
                  Pair selected device
                </button>
                <button
                  onClick={() => { setIsScanning(true); setTimeout(() => setIsScanning(false), 800); }}
                  className={`px-4 py-2.5 rounded-xl text-xs border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                  }`}
                >
                  Refresh scan
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Don't see your device? Hold the head's pairing button for 3 seconds until its indicator pulses.
              </p>
            </div>
          )}

          {/* STEP 3: READY */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                  Getting Started · 3 of 3
                </span>
                <h2 className="text-2xl font-serif font-medium mt-1">Your companion is ready.</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Both pieces are connected. You can use the head independently or keep it docked on the robot body.
                </p>
              </div>

              {/* Status Modules */}
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-[#17191b] border-slate-700' : 'bg-white border-[#d8d6cc]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div>
                      <div className="text-xs font-semibold">Head · H-024</div>
                      <div className="text-[11px] text-slate-400">{headBattery}% battery · Wi-Fi connected</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-[#17191b] border-slate-700' : 'bg-white border-[#d8d6cc]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div>
                      <div className="text-xs font-semibold">Body · B-024</div>
                      <div className="text-[11px] text-slate-400">{bodyBattery}% battery · dock connection verified</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              {/* Safety notice banner */}
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isDark ? 'bg-[#1a251e] border-emerald-800 text-emerald-200' : 'bg-[#edf5ee] border-[#c2dec6] text-[#244228]'
              }`}>
                <div className="font-semibold flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Movement needs a safety check</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Movement stays disabled until calibration is complete and the sensors confirm a clear surface. Emergency stop is always available.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-xl text-xs font-medium text-white shadow-md transition-all ${
                    isDark ? 'bg-[#405644] hover:bg-[#4e6853]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                  }`}
                >
                  Run calibration & enter app
                </button>
                <button
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                  }`}
                >
                  Explore in head mode
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
