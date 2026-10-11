import { CSSProperties, FC } from "react";
import { pct, temp, watts } from "./format";
import { useSettings, useStore } from "./hooks";
import { Position } from "./types";

const POS: Record<Position, CSSProperties> = {
  "top-left": { top: 8, left: 8 },
  "top-right": { top: 8, right: 8 },
  "bottom-left": { bottom: 8, left: 8 },
  "bottom-right": { bottom: 8, right: 8 },
};

/** Non-interactive in-game overlay (REQ-200…205). Never takes focus. */
export const Overlay: FC = () => {
  const cfg = useSettings();
  return cfg.overlay.enabled ? <OverlayView /> : null; // OverlayView mounts => polls
};

const OverlayView: FC = () => {
  const { stats: s, settings: cfg } = useStore();
  if (!s) return null;

  const parts: string[] = [];
  const { show } = cfg;
  if (show.cpu && s.cpu) parts.push(`CPU ${pct(s.cpu.usage)}${s.cpu.temp_c !== undefined ? ` ${temp(s.cpu.temp_c)}` : ""}`);
  if (show.gpu && s.gpu) parts.push(`GPU ${pct(s.gpu.usage)}${s.gpu.temp_c !== undefined ? ` ${temp(s.gpu.temp_c)}` : ""}`);
  if (show.mem && s.mem) parts.push(`RAM ${pct(s.mem.percent)}`);
  if (show.battery && s.battery) {
    if (s.battery.power_w !== undefined) parts.push(watts(s.battery.power_w));
    if (s.battery.percent !== undefined) parts.push(`BAT ${pct(s.battery.percent)}`);
  }
  if (parts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        ...POS[cfg.overlay.position],
        zIndex: 7002,
        pointerEvents: "none",
        padding: "4px 8px",
        borderRadius: 6,
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        fontSize: 13,
        lineHeight: 1.3,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: cfg.overlay.compact ? "nowrap" : "normal",
        display: "flex",
        flexDirection: cfg.overlay.compact ? "row" : "column",
        gap: cfg.overlay.compact ? 10 : 0,
      }}
    >
      {parts.map((p) => <span key={p}>{p}</span>)}
    </div>
  );
};
