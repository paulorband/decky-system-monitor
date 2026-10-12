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
  proc_title: "Usage by process",
  sort_by: "Sort by",
  sort_cpu: "CPU usage",
  sort_mem: "Memory (RAM)",
  col_app: "Application",
  col_proc: "Procs",
  proc_footnote: "CPU = % of total capacity. RAM = RSS (shared pages count in each process).",
  app_fallback: "{name} (App {id})",
  section_updates: "Updates",
  current_version: "Current version",
  latest_version: "New version",
  up_to_date: "You are up to date",
  not_checked: "Not checked yet",
  check_now: "Check for updates",
  checking: "Checking…",
  install_update: "Install {v}",
  installing: "Installing…",
  install_ok: "Installed {v}. Decky is restarting to load it…",
  install_failed: "Update failed: {e}",
  check_failed: "Could not check for updates",
  auto_check: "Check for updates at startup",
  toast_title: "System Monitor update",
  toast_body: "Version {v} is available. Open the plugin to install it.",
  restart_hint: "Installed. If Decky does not restart by itself, reboot the device (or restart plugin_loader in Desktop Mode) to finish.",
  language: "Language",
  test_channel: "Include test builds",
  test_channel_warning: "Test builds are unreleased and may contain bugs. They can break the plugin, and there is no automatic rollback. Only enable this to help test.",
  test_channel_hint: "⚠ Test builds may contain bugs and break the plugin. No automatic rollback.",
  rate_limited: "GitHub request limit reached. Try again in about {m} min.",
  test_enable_title: "Enable test builds?",
  test_enable_ok: "Enable",
  test_enable_cancel: "Cancel",
  test_label: "test {c}",
  install_test: "Install test build {v}",
  toast_body_test: "Test build {v} is available. Open the plugin to install it.",
  lang_auto: "Auto",
  lang_sources: "Detected: Steam UI {u} · registry {r} · browser {b}",
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
  proc_title: "Consumo por processo",
  sort_by: "Ordenar por",
  sort_cpu: "Uso de CPU",
  sort_mem: "Memória (RAM)",
  col_app: "Aplicativo",
  col_proc: "Proc.",
  proc_footnote: "CPU = % da capacidade total. RAM = RSS (páginas compartilhadas contam em cada processo).",
  app_fallback: "{name} (App {id})",
  section_updates: "Atualizações",
  current_version: "Versão atual",
  latest_version: "Nova versão",
  up_to_date: "Você está atualizado",
  not_checked: "Ainda não verificado",
  check_now: "Verificar atualizações",
  checking: "Verificando…",
  install_update: "Instalar {v}",
  installing: "Instalando…",
  install_ok: "{v} instalada. O Decky está reiniciando para carregá-la…",
  install_failed: "Falha na atualização: {e}",
  check_failed: "Não foi possível verificar atualizações",
  auto_check: "Verificar atualizações ao iniciar",
  toast_title: "Atualização do Monitor do Sistema",
  toast_body: "A versão {v} está disponível. Abra o plugin para instalar.",
  restart_hint: "Instalada. Se o Decky não reiniciar sozinho, reinicie o aparelho (ou o plugin_loader no modo desktop) para concluir.",
  language: "Idioma",
  test_channel: "Incluir builds de teste",
  test_channel_warning: "Builds de teste não foram publicadas e podem conter erros. Elas podem deixar o plugin inoperante, e não há reversão automática. Ative apenas para ajudar a testar.",
  test_channel_hint: "⚠ Builds de teste podem conter erros e deixar o plugin inoperante. Sem reversão automática.",
  rate_limited: "Limite de requisições do GitHub atingido. Tente de novo em cerca de {m} min.",
  test_enable_title: "Ativar builds de teste?",
  test_enable_ok: "Ativar",
  test_enable_cancel: "Cancelar",
  test_label: "teste {c}",
  install_test: "Instalar build de teste {v}",
  toast_body_test: "O build de teste {v} está disponível. Abra o plugin para instalar.",
  lang_auto: "Auto",
  lang_sources: "Detectado: interface do Steam {u} · registry {r} · navegador {b}",
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
  proc_title: "Consumo por proceso",
  sort_by: "Ordenar por",
  sort_cpu: "Uso de CPU",
  sort_mem: "Memoria (RAM)",
  col_app: "Aplicación",
  col_proc: "Proc.",
  proc_footnote: "CPU = % de la capacidad total. RAM = RSS (las páginas compartidas cuentan en cada proceso).",
  app_fallback: "{name} (App {id})",
  section_updates: "Actualizaciones",
  current_version: "Versión actual",
  latest_version: "Nueva versión",
  up_to_date: "Estás al día",
  not_checked: "Aún sin comprobar",
  check_now: "Buscar actualizaciones",
  checking: "Comprobando…",
  install_update: "Instalar {v}",
  installing: "Instalando…",
  install_ok: "{v} instalada. Decky se está reiniciando para cargarla…",
  install_failed: "Error al actualizar: {e}",
  check_failed: "No se pudo buscar actualizaciones",
  auto_check: "Buscar actualizaciones al iniciar",
  toast_title: "Actualización de Monitor del sistema",
  toast_body: "La versión {v} está disponible. Abre el plugin para instalarla.",
  restart_hint: "Instalada. Si Decky no se reinicia solo, reinicia el equipo (o plugin_loader en el modo escritorio) para terminar.",
  language: "Idioma",
  test_channel: "Incluir versiones de prueba",
  test_channel_warning: "Las versiones de prueba no se han publicado y pueden tener errores. Pueden dejar el plugin inutilizable y no hay reversión automática. Actívalo solo para ayudar a probar.",
  test_channel_hint: "⚠ Las versiones de prueba pueden tener errores y dejar el plugin inutilizable. Sin reversión automática.",
  rate_limited: "Se alcanzó el límite de solicitudes de GitHub. Inténtalo de nuevo en unos {m} min.",
  test_enable_title: "¿Activar versiones de prueba?",
  test_enable_ok: "Activar",
  test_enable_cancel: "Cancelar",
  test_label: "prueba {c}",
  install_test: "Instalar versión de prueba {v}",
  toast_body_test: "La versión de prueba {v} está disponible. Abre el plugin para instalarla.",
  lang_auto: "Auto",
  lang_sources: "Detectado: interfaz de Steam {u} · registry {r} · navegador {b}",
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

/**
 * Map one language tag to a supported locale. Steam reports names ("brazilian", "latam")
 * in some places and BCP-47 codes ("pt-BR", "es-419") in others, so accept both.
 * Anything else is a recognised-but-unsupported language -> English.
 */
export function mapLanguage(tag: string): Locale {
  const t = tag.trim().toLowerCase().replace(/_/g, "-");
  if (t === "brazilian" || t === "portuguese" || /^pt(-|$)/.test(t)) return "pt-BR";
  if (t === "spanish" || t === "latam" || /^es(-|$)/.test(t)) return "es";
  return DEFAULT_LOCALE;
}

/** REQ-502. Steam language wins; otherwise the browser language; otherwise English. */
export function resolveLocale(steamLang?: string | null, navLang?: string | null): Locale {
  if (steamLang) return mapLanguage(steamLang);
  return navLang ? mapLanguage(navLang) : DEFAULT_LOCALE;
}

/** Where the language came from, for display and debugging (REQ-509/510). */
export interface LanguageInfo {
  locale: Locale;
  source: "setting" | "steam-ui" | "registry" | "browser" | "default";
  raw: string | null;
}

/** REQ-510: what the user picked in the plugin ("auto" = detect). */
export type LanguagePref = "auto" | Locale;
export const LANGUAGE_PREFS: LanguagePref[] = ["auto", "en", "pt-BR", "es"];

let preference: LanguagePref = "auto";
let backendLanguage: string | null = null;

export function setLanguagePreference(pref: string | null | undefined): void {
  preference = (LANGUAGE_PREFS as string[]).includes(pref as string) ? (pref as LanguagePref) : "auto";
}

/** REQ-509: language read by the backend from Steam's registry.vdf (fallback source). */
export function setBackendLanguage(raw: string | null | undefined): void {
  backendLanguage = raw ? raw : null;
}

/** What each automatic source says right now (REQ-511 diagnostics). */
export function getLanguageSources(): { steamUi: string | null; registry: string | null; browser: string | null } {
  let steam: string | undefined;
  try { steam = (globalThis as any).LocalizationManager?.m_rgLocalesToUse?.[0]; } catch { /* ignore */ }
  let nav: string | undefined;
  try { nav = (globalThis as any).navigator?.language; } catch { /* ignore */ }
  return { steamUi: steam || null, registry: backendLanguage, browser: nav || null };
}

export function getLanguageInfo(): LanguageInfo {
  if (preference !== "auto") return { locale: preference, source: "setting", raw: preference }; // REQ-510
  const src = getLanguageSources();
  if (src.steamUi) return { locale: mapLanguage(src.steamUi), source: "steam-ui", raw: src.steamUi };
  if (src.registry) return { locale: mapLanguage(src.registry), source: "registry", raw: src.registry };
  if (src.browser) return { locale: mapLanguage(src.browser), source: "browser", raw: src.browser };
  return { locale: DEFAULT_LOCALE, source: "default", raw: null };
}

export function getLocale(): Locale {
  return getLanguageInfo().locale;
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
