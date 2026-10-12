import { callable } from "@decky/api";
import { setBackendLanguage } from "./i18n";

const getLanguage = callable<[], { steam: string | null }>("get_language");

let pending: Promise<void> | null = null;

/** Ask the backend for Steam's language once (REQ-509). Safe to await from anywhere. */
export function initLanguage(): Promise<void> {
  if (!pending) {
    pending = getLanguage()
      .then((r) => setBackendLanguage(r?.steam))
      .catch(() => { pending = null; }); // retry next time; falls back to Steam UI / browser
  }
  return pending;
}
