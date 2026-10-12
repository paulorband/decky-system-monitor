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

export type Group = "cpu" | "gpu" | "mem" | "battery" | "fan";

export interface Settings {
  interval_ms: number;
  auto_check: boolean;
  show: Record<Group, boolean>;
}

export const DEFAULT_SETTINGS: Settings = {
  interval_ms: 1000,
  auto_check: true,
  show: { cpu: true, gpu: true, mem: true, battery: true, fan: true },
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
