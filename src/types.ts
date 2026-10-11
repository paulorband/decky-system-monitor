export interface Stats {
  cpu?: { usage?: number; freq_mhz?: number; temp_c?: number };
  gpu?: {
    usage?: number; freq_mhz?: number; temp_c?: number; power_w?: number;
    vram_used_mb?: number; vram_total_mb?: number;
  };
  mem?: { used_mb: number; total_mb: number; percent: number };
  swap?: { used_mb: number; total_mb: number };
  battery?: { percent?: number; status?: string; power_w?: number };
  fan?: { rpm: number };
}

export type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type Group = "cpu" | "gpu" | "mem" | "battery" | "fan";

export interface Settings {
  interval_ms: number;
  show: Record<Group, boolean>;
  overlay: { enabled: boolean; position: Position; compact: boolean };
}

export const DEFAULT_SETTINGS: Settings = {
  interval_ms: 1000,
  show: { cpu: true, gpu: true, mem: true, battery: true, fan: true },
  overlay: { enabled: false, position: "top-left", compact: true },
};

export interface ProcGroup {
  key: string;
  name: string;
  app_id?: number;
  count: number;
  cpu: number | null;
  rss_mb: number;
}
export type ProcSort = "cpu" | "mem";
