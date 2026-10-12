import { callable, toaster } from "@decky/api";
import { useCallback, useEffect, useState } from "react";
import { t } from "./i18n";
import { Settings } from "./types";

export interface UpdateState {
  current: string;
  latest?: string;
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
    const cfg = await getSettings();
    if (!cfg.auto_check) return; // REQ-604
    const st = await checkUpdate(false);
    if (st.available && st.latest) {
      toaster.toast({ title: t("toast_title"), body: t("toast_body", { v: `v${st.latest}` }), duration: 10000 });
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
      if (s.error) setMessage(`${t("check_failed")}: ${s.error}`);
    } catch (e) { setMessage(`${t("check_failed")}: ${String(e)}`); }
    finally { setBusy(null); }
  }, []);

  const install = useCallback(async () => {
    setBusy("install"); setMessage(null);
    try {
      const r = await installUpdate();
      if (r.ok) setMessage(t("install_ok", { v: `v${r.version}` }));
      else setMessage(t("install_failed", { e: r.error ?? "?" }));
      if (!r.ok) setBusy(null); // on success stay disabled: Decky is about to restart
    } catch (e) {
      setMessage(t("install_failed", { e: String(e) }));
      setBusy(null);
    }
  }, []);

  return { state, busy, message, check, install };
}
