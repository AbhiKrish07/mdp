import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Check, RefreshCw, FileText, Image as ImageIcon,
  ArrowRight, Shield, Sparkles, Layers, Box, Eye
} from 'lucide-react';

interface VisionStudioViewProps {
  isDark: boolean;
  privacyActive: boolean;
  onNavigateToChat: () => void;
}

export const VisionStudioView: React.FC<VisionStudioViewProps> = ({
  isDark,
  privacyActive,
  onNavigateToChat
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'documents' | 'diagrams'>('camera');
  const [analysisTab, setAnalysisTab] = useState<'summary' | 'extracted' | 'diagram'>('summary');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam if available and privacy switch is off
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!privacyActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            setWebcamActive(true);
          }
        })
        .catch(() => {
          setWebcamActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [privacyActive]);

  // Capture frame
  const handleCapture = () => {
    setIsCapturing(true);
    if (webcamActive && videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/png'));
      }
    } else {
      // Fallback captured state
      setCapturedImage("simulated");
    }

    setTimeout(() => {
      setIsCapturing(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight font-medium">Vision Studio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bring the things on your desk into your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className={`px-4 py-2 rounded-xl text-xs border font-medium flex items-center gap-2 transition-colors ${
            isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
          }`}>
            <Upload className="w-3.5 h-3.5" />
            <span>Upload a document</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Camera & Captures (Left) + Inspection & Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Viewfinder & Captures */}
        <div className={`lg:col-span-7 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/10 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Head camera · H-024</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Camera active</span>
              </div>
            </div>

            {/* Viewfinder Window */}
            <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border flex items-center justify-center ${
              isDark ? 'bg-black border-slate-700' : 'bg-slate-900 border-[#d8d6cb]'
            }`}>
              {/* Privacy overlay if engaged */}
              {privacyActive ? (
                <div className="text-center p-6 space-y-2">
                  <Shield className="w-8 h-8 text-red-500 mx-auto" />
                  <div className="text-sm font-semibold text-white">Physical Privacy Cutoff Engaged</div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Camera shutter is mechanically closed or isolated in hardware. Toggle privacy switch on head to resume video.
                  </p>
                </div>
              ) : webcamActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : (
                /* High-fidelity desk sketch visualizer */
                <div className="relative w-full h-full bg-[#3d372e] flex items-center justify-center p-8">
                  {/* Visualized paper sketch on desk */}
                  <div className="relative w-72 h-56 bg-[#fbf9f1] rounded-lg shadow-xl p-4 text-[#2b2b2b] flex flex-col justify-between font-mono text-[9px] border border-stone-300">
                    <div className="border-b border-stone-300 pb-1 flex justify-between">
                      <span className="font-bold">DESK LAYOUT SKETCH</span>
                      <span>Flow: Left to Right</span>
                    </div>

                    <div className="my-2 border border-dashed border-stone-400 p-2 rounded flex flex-col items-center justify-center">
                      <span className="font-bold text-[10px] text-stone-700">MONITOR STAND (ARM)</span>
                      <div className="flex gap-4 mt-2">
                        <span className="border p-1">KEYBOARD</span>
                        <span className="border p-1 bg-stone-100">WRITING AREA</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[8px] text-stone-500 pt-1">
                      <span>Ergonomics: 65cm Depth</span>
                      <span>Cable Tray: Rear Edge</span>
                    </div>

                    {/* Auto crop corners */}
                    <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
                    <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
                  </div>

                  {/* Watermark badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>LIVE · 1080p · Camera access allowed</span>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Viewfinder Controls */}
            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-mono border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  Document
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Auto crop on
                </span>
              </div>

              <button
                disabled={privacyActive}
                onClick={handleCapture}
                className={`px-5 py-2.5 rounded-xl text-xs font-medium text-white shadow-md transition-all flex items-center gap-2 ${
                  isCapturing ? 'opacity-80' : ''
                } ${isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'}`}
              >
                <Camera className="w-4 h-4" />
                <span>{isCapturing ? 'Analyzing…' : 'Capture'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Only captured images are saved. Live video isn't recorded. Your physical camera shutter always takes priority.
            </p>
          </div>

          {/* Recent Captures */}
          <div className="pt-5 border-t border-slate-700/10 dark:border-slate-800 mt-5">
            <h4 className="text-xs font-semibold mb-3">Recent captures</h4>
            <div className="space-y-2">
              <div className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                isDark ? 'bg-[#181a1d] border-slate-700 hover:border-slate-600' : 'bg-[#fbfaf5] border-[#e7e5dc] hover:border-[#cfcdc1]'
              }`}>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-medium">Desk layout sketch</div>
                    <div className="text-[10px] text-slate-400 font-mono">Today, 09:28 · 1 page · Analyzed</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                isDark ? 'bg-[#181a1d] border-slate-700 hover:border-slate-600' : 'bg-[#fbfaf5] border-[#e7e5dc] hover:border-[#cfcdc1]'
              }`}>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-xs font-medium">Interview notes</div>
                    <div className="text-[10px] text-slate-400 font-mono">Yesterday, 16:42 · 3 pages · Analyzed</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Structured Document & Diagram Interpretation */}
        <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/10 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-sm font-semibold">Desk layout sketch</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Captured 09:28 · Document + diagram · 1 page
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Analyzed
              </span>
            </div>

            {/* Analysis subtabs */}
            <div className="flex items-center gap-4 text-xs font-medium border-b border-slate-700/10 dark:border-slate-800 pb-2 mb-4">
              <button 
                onClick={() => setAnalysisTab('summary')}
                className={`transition-colors ${analysisTab === 'summary' ? 'text-emerald-600 dark:text-emerald-400 font-bold underline' : 'text-slate-400'}`}
              >
                Summary
              </button>
              <button 
                onClick={() => setAnalysisTab('extracted')}
                className={`transition-colors ${analysisTab === 'extracted' ? 'text-emerald-600 dark:text-emerald-400 font-bold underline' : 'text-slate-400'}`}
              >
                Extracted text
              </button>
              <button 
                onClick={() => setAnalysisTab('diagram')}
                className={`transition-colors ${analysisTab === 'diagram' ? 'text-emerald-600 dark:text-emerald-400 font-bold underline' : 'text-slate-400'}`}
              >
                Diagram
              </button>
            </div>

            {/* Content Tab: Summary */}
            {analysisTab === 'summary' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">A quieter, more flexible desk</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    The sketch proposes a centered monitor, an open writing area on the right, and a charging zone behind the monitor. Three callouts were found.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-mono pt-1">
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-emerald-600">01</span>
                    <span>Monitor arm clears the surface</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-emerald-600">02</span>
                    <span>Keep a 30 cm writing zone</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-emerald-600">03</span>
                    <span>Route cables along the rear edge</span>
                  </div>
                </div>

                {/* Diagram interpretation wireframe */}
                <div className="pt-2">
                  <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2">Diagram interpretation</span>
                  <div className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-xs font-mono ${
                    isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#e8e6dc]'
                  }`}>
                    <div className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-center font-medium">
                      Monitor + charging zone
                    </div>
                    <span className="text-slate-400">↓</span>
                    <div className="grid grid-cols-2 gap-2 w-full text-center">
                      <div className="py-2 px-2 rounded-xl border border-slate-300 dark:border-slate-700">Keyboard</div>
                      <div className="py-2 px-2 rounded-xl border border-slate-300 dark:border-slate-700">Writing area</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab: Extracted text */}
            {analysisTab === 'extracted' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed space-y-2">
                <p># Desk Layout Sketch (V1)</p>
                <p>- Centered monitor on pole / arm mount</p>
                <p>- Available cable gap: 80 mm</p>
                <p>- Rear edge thickness: 24 mm</p>
                <p>- Writing zone width: 30 cm min</p>
              </div>
            )}

            {/* Content Tab: Diagram */}
            {analysisTab === 'diagram' && (
              <div className="p-4 rounded-2xl border text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Detected Boxes:</span>
                  <span className="text-emerald-500 font-bold">3 zones</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Arrow Links:</span>
                  <span className="text-emerald-500 font-bold">1 vertical hierarchy</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-700/10 dark:border-slate-800 mt-5 space-y-3">
            <p className="text-[10px] text-slate-400 leading-snug">
              Check measurements against the original. Handwritten text may be misread.
            </p>
            <div className="flex items-center gap-3">
              <button className={`px-4 py-2 rounded-xl text-xs font-medium text-white transition-all ${
                isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
              }`}>
                Save to Desk refresh
              </button>
              <button 
                onClick={onNavigateToChat}
                className={`px-4 py-2 rounded-xl text-xs border transition-colors ${
                  isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                }`}
              >
                Ask Still
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
