import { fmtNum } from "./i18n";

export const pct = (v?: number) => (v === undefined ? "—" : `${Math.round(v)}%`);
export const temp = (v?: number) => (v === undefined ? "—" : `${Math.round(v)}°C`);
export const watts = (v?: number) => (v === undefined ? "—" : `${fmtNum(v, 1)} W`);
export const mhz = (v?: number) =>
  v === undefined ? "—" : v >= 1000 ? `${fmtNum(v / 1000, 2)} GHz` : `${v} MHz`;
export const mb = (v?: number) =>
  v === undefined ? "—" : v >= 1024 ? `${fmtNum(v / 1024, 1)} GB` : `${v} MB`;

/** REQ-105: colour is only a hint; the number is always shown. */
export const tempColor = (v?: number) =>
  v === undefined ? undefined : v >= 90 ? "#ff5252" : v >= 80 ? "#ffb300" : undefined;
export const usageColor = (v?: number) =>
  v !== undefined && v >= 90 ? "#ffb300" : undefined;
