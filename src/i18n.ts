// Self-contained on purpose (no imports): tested directly by Node in tests/i18n.test.mjs.
export type Locale = "en" | "pt-BR" | "es";

const en = {
  title: "System Monitor",
  loading: "Loading…",
  backend_unavailable: "Backend unavailable",
  status: "Status",
  section_cpu: "CPU",
  section_gpu: "GPU",
  section_memory: "Memory",
  section_battery: "Battery",
  section_fan: "Fan",
  section_processes: "Processes",
  section_settings: "Settings",
  usage: "Usage",
  frequency: "Frequency",
  temperature: "Temperature",
  clock: "Clock",
  power: "Power",
  charge: "Charge",
  state: "State",
  consumption: "Draw",
  rotation: "Speed",
  open_processes: "Usage by process",
  update_interval: "Update interval",
  group_battery: "Battery / power",
  overlay_ingame: "In-game overlay",
  overlay_position: "Overlay position",
  overlay_compact: "Compact overlay",
  pos_top_left: "Top left",
  pos_top_right: "Top right",
  pos_bottom_left: "Bottom left",
  pos_bottom_right: "Bottom right",
  proc_title: "Usage by process",
  sort_by: "Sort by",
  sort_cpu: "CPU usage",
  sort_mem: "Memory (RAM)",
  col_app: "Application",
  col_proc: "Procs",
  proc_footnote: "CPU = % of total capacity. RAM = RSS (shared pages count in each process).",
  app_fallback: "{name} (App {id})",
  bat_Charging: "Charging",
  bat_Discharging: "Discharging",
  bat_Full: "Full",
  bat_Not_charging: "Not charging",
  bat_Unknown: "Unknown",
};
export type Key = keyof typeof en;
type Dict = Record<Key, string>;

const ptBR: Dict = {
  title: "Monitor do Sistema",
  loading: "Carregando…",
  backend_unavailable: "Backend indisponível",
  status: "Status",
  section_cpu: "CPU",
  section_gpu: "GPU",
  section_memory: "Memória",
  section_battery: "Bateria",
  section_fan: "Ventoinha",
  section_processes: "Processos",
  section_settings: "Configurações",
  usage: "Uso",
  frequency: "Frequência",
  temperature: "Temperatura",
  clock: "Clock",
  power: "Potência",
  charge: "Carga",
  state: "Estado",
  consumption: "Consumo",
  rotation: "Rotação",
  open_processes: "Consumo por processo",
  update_interval: "Intervalo de atualização",
  group_battery: "Bateria / consumo",
  overlay_ingame: "Overlay no jogo",
  overlay_position: "Posição do overlay",
  overlay_compact: "Overlay compacto",
  pos_top_left: "Superior esquerdo",
  pos_top_right: "Superior direito",
  pos_bottom_left: "Inferior esquerdo",
  pos_bottom_right: "Inferior direito",
  proc_title: "Consumo por processo",
  sort_by: "Ordenar por",
  sort_cpu: "Uso de CPU",
  sort_mem: "Memória (RAM)",
  col_app: "Aplicativo",
  col_proc: "Proc.",
  proc_footnote: "CPU = % da capacidade total. RAM = RSS (páginas compartilhadas contam em cada processo).",
  app_fallback: "{name} (App {id})",
  bat_Charging: "Carregando",
  bat_Discharging: "Descarregando",
  bat_Full: "Cheia",
  bat_Not_charging: "Sem carregar",
  bat_Unknown: "Desconhecido",
};

const es: Dict = {
  title: "Monitor del sistema",
  loading: "Cargando…",
  backend_unavailable: "Backend no disponible",
  status: "Estado",
  section_cpu: "CPU",
  section_gpu: "GPU",
  section_memory: "Memoria",
  section_battery: "Batería",
  section_fan: "Ventilador",
  section_processes: "Procesos",
  section_settings: "Ajustes",
  usage: "Uso",
  frequency: "Frecuencia",
  temperature: "Temperatura",
  clock: "Reloj",
  power: "Potencia",
  charge: "Carga",
  state: "Estado",
  consumption: "Consumo",
  rotation: "Velocidad",
  open_processes: "Consumo por proceso",
  update_interval: "Intervalo de actualización",
  group_battery: "Batería / consumo",
  overlay_ingame: "Superposición en el juego",
  overlay_position: "Posición de la superposición",
  overlay_compact: "Superposición compacta",
  pos_top_left: "Superior izquierda",
  pos_top_right: "Superior derecha",
  pos_bottom_left: "Inferior izquierda",
  pos_bottom_right: "Inferior derecha",
  proc_title: "Consumo por proceso",
  sort_by: "Ordenar por",
  sort_cpu: "Uso de CPU",
  sort_mem: "Memoria (RAM)",
  col_app: "Aplicación",
  col_proc: "Proc.",
  proc_footnote: "CPU = % de la capacidad total. RAM = RSS (las páginas compartidas cuentan en cada proceso).",
  app_fallback: "{name} (App {id})",
  bat_Charging: "Cargando",
  bat_Discharging: "Descargando",
  bat_Full: "Completa",
  bat_Not_charging: "Sin cargar",
  bat_Unknown: "Desconocido",
};

// Plural forms kept apart from the main dictionaries (REQ-507).
const PLURALS: Record<Locale, { one: string; other: string }> = {
  en: { one: "process", other: "processes" },
  "pt-BR": { one: "processo", other: "processos" },
  es: { one: "proceso", other: "procesos" },
};

export const DICTIONARIES: Record<Locale, Dict> = { en, "pt-BR": ptBR, es };
export const DEFAULT_LOCALE: Locale = "en";

/** REQ-502. Steam UI language wins; otherwise the browser language; otherwise English. */
export function resolveLocale(steamLang?: string | null, navLang?: string | null): Locale {
  if (steamLang) {
    switch (steamLang.toLowerCase()) {
      case "brazilian":
      case "portuguese":
        return "pt-BR";
      case "spanish":
      case "latam":
        return "es";
      default:
        return "en";
    }
  }
  const n = (navLang || "").toLowerCase();
  if (n.startsWith("pt")) return "pt-BR";
  if (n.startsWith("es")) return "es";
  return DEFAULT_LOCALE;
}

let cached: Locale | null = null;

export function getLocale(): Locale {
  if (cached) return cached;
  let steam: string | undefined;
  try {
    steam = (globalThis as any).LocalizationManager?.m_rgLocalesToUse?.[0];
  } catch { /* ignore */ }
  let nav: string | undefined;
  try { nav = (globalThis as any).navigator?.language; } catch { /* ignore */ }
  const loc = resolveLocale(steam, nav);
  if (steam) cached = loc; // keep re-checking until Steam reports its language
  return loc;
}

/** Translate a key; falls back to English, then to the key itself (REQ-501). */
export function t(key: Key, vars?: Record<string, string | number>, locale: Locale = getLocale()): string {
  let s = DICTIONARIES[locale]?.[key] ?? en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

export function tProcesses(n: number, locale: Locale = getLocale()): string {
  const p = PLURALS[locale] ?? PLURALS[DEFAULT_LOCALE];
  return `${n} ${n === 1 ? p.one : p.other}`;
}

/** Kernel battery status -> translated; unknown values pass through (REQ-506). */
export function tBatteryStatus(status: string, locale: Locale = getLocale()): string {
  const key = `bat_${status.replace(/\s+/g, "_")}` as Key;
  return key in en ? t(key, undefined, locale) : status;
}

/** Locale-aware number (REQ-505). */
export function fmtNum(v: number, digits = 0, locale: Locale = getLocale()): string {
  try {
    return v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  } catch {
    return v.toFixed(digits);
  }
}
