import { callable, toaster } from "@decky/api";
import { useCallback, useEffect, useState } from "react";
import { t } from "./i18n";
import { initLanguage } from "./language";
import { setLanguagePreference } from "./i18n";
import { Settings } from "./types";

export interface UpdateState {
  current: string;
  latest?: string;
  latest_kind?: "stable" | "test";
  commit?: string;
  current_commit?: string | null;
  current_kind?: "stable" | "test" | null;
  retry_minutes?: number;
  channel?: "stable" | "test";
  available: boolean;
  checked: boolean;
  error?: string;
}

const getUpdateState = callable<[], UpdateState>("get_update_state");
const checkUpdate = callable<[boolean], UpdateState>("check_update");
const installUpdate = callable<[], { ok: boolean; version?: string; error?: string }>("install_update");
const getSettings = callable<[], Settings>("get_settings");

/** REQ-600/610: once per plugin start; silent on any failure (REQ-602). */
export async function startupUpdateCheck(): Promise<void> {
  try {
    await initLanguage(); // so the toast is in the right language
    const cfg = await getSettings();
    setLanguagePreference(cfg.language); // REQ-510: the toast follows the chosen language
    if (!cfg.auto_check) return; // REQ-604
    const st = await checkUpdate(false);
    if (st.available && st.latest) {
      const test = st.latest_kind === "test";
      toaster.toast({
        title: t("toast_title"),
        body: t(test ? "toast_body_test" : "toast_body", { v: `v${st.latest}` }),
        duration: 10000,
      });
    }
  } catch { /* offline / backend not ready */ }
}

export type Busy = "check" | "install" | null;

export function useUpdates() {
  const [state, setState] = useState<UpdateState | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getUpdateState().then((s) => alive && setState(s)).catch((e) => alive && setMessage(`${t("check_failed")}: ${String(e)}`));
    return () => { alive = false; };
  }, []);

  const check = useCallback(async () => {
    setBusy("check"); setMessage(null);
    try {
      const s = await checkUpdate(true);
      setState(s);
      if (s.retry_minutes) setMessage(t("rate_limited", { m: s.retry_minutes })); // REQ-662
      else if (s.error) setMessage(`${t("check_failed")}: ${s.error}`);
    } catch (e) { setMessage(`${t("check_failed")}: ${String(e)}`); }
    finally { setBusy(null); }
  }, []);

  const install = useCallback(async () => {
    setBusy("install"); setMessage(null);
    try {
      const r = await installUpdate();
      if (r.ok) {
        setMessage(t("install_ok", { v: `v${r.version}` }));
        // If Decky does not restart on its own, stop waiting forever and say what to do.
        setTimeout(() => {
          setMessage(t("restart_hint"));
          setBusy(null);
          setState((p) => (p ? { ...p, available: false } : p));
        }, 20000);
      }
      else { setMessage(t("install_failed", { e: r.error ?? "?" })); setBusy(null); }
    } catch (e) {
      setMessage(t("install_failed", { e: String(e) }));
      setBusy(null);
    }
  }, []);

  return { state, busy, message, check, install };
}
