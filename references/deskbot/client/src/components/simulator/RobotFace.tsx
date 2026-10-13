import { MicOff, Radio, Waves } from "lucide-react";

type RobotFaceProps = {
  mode: string;
  privacyCutoff?: boolean;
  compact?: boolean;
};

const modeCopy: Record<string, string> = {
  idle: "Standing by",
  listening: "Listening",
  thinking: "Working it out",
  moving: "On the move",
  speaking: "Responding",
  alert: "Safety stop",
  scanning: "Inspecting",
  happy: "All done",
};

export function RobotFace({ mode, privacyCutoff = false, compact = false }: RobotFaceProps) {
  return (
    <div className={`robot-face-shell ${compact ? "robot-face-compact" : ""}`}>
      <div className={`robot-visor ${mode === "alert" ? "visor-alert" : ""}`}>
        <div className="visor-glint" />
        <div className={`robot-eyes eyes-${mode}`}>
          <span className="robot-eye" />
          <span className="robot-eye" />
        </div>
        <div className={`robot-mouth mouth-${mode}`}>
          {mode === "speaking" || mode === "listening" ? (
            <span className="mouth-wave"><i /><i /><i /><i /><i /><i /><i /></span>
          ) : mode === "happy" ? <span className="smile-line" /> : <span className="mouth-line" />}
        </div>
        <span className="visor-corner corner-tl" /><span className="visor-corner corner-tr" />
        <span className="visor-corner corner-bl" /><span className="visor-corner corner-br" />
      </div>
      {!compact && <div className="face-state-row">
        <span className={`state-dot state-${mode}`} />
        <span>{privacyCutoff ? "Privacy cutoff" : modeCopy[mode] ?? "Standing by"}</span>
        <span className="face-state-meta">SIM</span>
      </div>}
      {compact && <div className="face-compact-caption"><span>{modeCopy[mode] ?? "Standing by"}</span><span className="face-small-icon">{privacyCutoff ? <MicOff size={12} /> : mode === "listening" ? <Radio size={12} /> : <Waves size={12} />}</span></div>}
    </div>
  );
}
