import { ArrowUpRight, Coffee, Laptop, NotebookPen, Move, Waves } from "lucide-react";

type Point = { x: number; y: number };
type DeskMapProps = {
  position: Point;
  heading: number;
  mode: string;
  onNavigate: (destination: string) => void;
  compact?: boolean;
};

export function DeskMap({ position, heading, mode, onNavigate, compact = false }: DeskMapProps) {
  return (
    <div className={`desk-map-wrap ${compact ? "desk-map-compact" : ""}`}>
      <div className="map-axis axis-top"><span>0 cm</span><span>45 cm</span><span>90 cm</span></div>
      <div className="desk-map">
        <div className="desk-grid" />
        <div className="safe-zone safe-top" /><div className="safe-zone safe-right" />
        <div className="safe-zone safe-bottom" /><div className="safe-zone safe-left" />
        <div className="map-corner-label">DESK BOUNDARY · 90 × 60 CM</div>
        <button className="map-obstacle laptop-obstacle" onClick={() => onNavigate("inspect the laptop") } aria-label="Navigate to laptop">
          <Laptop size={compact ? 18 : 22} /><span>LAPTOP</span>
        </button>
        <button className="map-obstacle mug-obstacle" onClick={() => onNavigate("inspect the mug") } aria-label="Navigate to mug">
          <Coffee size={compact ? 18 : 21} /><span>MUG</span>
        </button>
        <button className="map-obstacle notes-obstacle" onClick={() => onNavigate("inspect the notebook") } aria-label="Navigate to notebook">
          <NotebookPen size={compact ? 17 : 20} /><span>NOTES</span>
        </button>
        <div className="path-dash path-a" /><div className="path-dash path-b" />
        <div className="robot-map-position" style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <span className={`robot-map-ping ${mode === "moving" ? "ping-moving" : ""}`} />
          <div className="robot-map-body" style={{ transform: `rotate(${heading}deg)` }}>
            <span className="robot-map-eye" /><span className="robot-map-eye" /><span className="robot-map-nose"><ArrowUpRight size={11} /></span>
          </div>
          <span className="robot-map-name">DESKBOT</span>
        </div>
        <span className="map-scale"><i /> 10 cm</span>
        <span className="map-motion-label"><Move size={12} /> {mode === "moving" ? "PATH ACTIVE" : "POSITION LOCKED"}</span>
        <span className="map-sensor-mark sensor-n"><Waves size={12} /></span><span className="map-sensor-mark sensor-e"><Waves size={12} /></span>
      </div>
      <div className="map-axis axis-bottom"><span>0 cm</span><span>30 cm</span><span>60 cm</span></div>
    </div>
  );
}
