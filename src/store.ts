import { callable } from "@decky/api";
import { DEFAULT_SETTINGS, Settings, Stats } from "./types";

const getStats = callable<[], Stats>("get_stats");
const getSettings = callable<[], Settings>("get_settings");
const setSettings = callable<[Settings], Settings>("set_settings");

type Listener = () => void;

/** Single shared poller (REQ-300): timer runs only while there are subscribers. */
class Store {
  stats: Stats | null = null;
  error = false;
  settings: Settings = DEFAULT_SETTINGS;
  private listeners = new Set<Listener>();
  private watchers = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private inflight = false;
  private loaded: Promise<void> | null = null;

  subscribe = (cb: Listener): (() => void) => {
    this.listeners.add(cb);
    this.ensureLoaded().then(() => this.restart());
    return () => {
      this.listeners.delete(cb);
      this.restart();
    };
  };

  /** Observe settings only; never starts the poll timer. */
  watch = (cb: Listener): (() => void) => {
    this.watchers.add(cb);
    this.ensureLoaded();
    return () => { this.watchers.delete(cb); };
  };

  get subscriberCount() {
    return this.listeners.size;
  }

  private ensureLoaded() {
    if (!this.loaded) {
      this.loaded = getSettings()
        .then((s) => { this.settings = s; })
        .catch(() => { this.error = true; })
        .then(() => this.emit());
    }
    return this.loaded;
  }

  private restart() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.listeners.size === 0) return;
    this.tick();
    this.timer = setInterval(() => this.tick(), this.settings.interval_ms);
  }

  private async tick() {
    if (this.inflight) return; // skip, never pile up
    this.inflight = true;
    try {
      this.stats = await getStats();
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.inflight = false;
      this.emit();
    }
  }

  async update(patch: (s: Settings) => Settings) {
    const next = patch(structuredClone(this.settings));
    this.settings = next; // optimistic
    this.emit();
    try { this.settings = await setSettings(next); } catch { this.error = true; }
    this.restart();
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
    this.watchers.forEach((l) => l());
  }
}

export const store = new Store();
