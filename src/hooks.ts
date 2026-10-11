import { useEffect, useState } from "react";
import { store } from "./store";

/** Re-render on store changes; subscription controls the shared timer. */
export function useStore() {
  const [, force] = useState(0);
  useEffect(() => store.subscribe(() => force((n) => n + 1)), []);
  return store;
}

/** Settings only: no polling is started (REQ-204). */
export function useSettings() {
  const [, force] = useState(0);
  useEffect(() => store.watch(() => force((n) => n + 1)), []);
  return store.settings;
}
