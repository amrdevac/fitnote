import { create } from "zustand";

type TimerSettingsState = {
  leadInSeconds: number;
  vibrationMs: number;
  wakeLockEnabled: boolean;
  setLeadInSeconds: (value: number) => void;
  setVibrationMs: (value: number) => void;
  setWakeLockEnabled: (value: boolean) => void;
};

const storageKey = "fitnote:timer-settings";

const loadSettings = () => {
  if (typeof window === "undefined") {
    return { leadInSeconds: 0, vibrationMs: 200, wakeLockEnabled: false };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { leadInSeconds: 0, vibrationMs: 200, wakeLockEnabled: false };
    const parsed = JSON.parse(raw) as {
      leadInSeconds?: number;
      vibrationMs?: number;
      wakeLockEnabled?: boolean;
    };
    if (typeof parsed.leadInSeconds !== "number" || parsed.leadInSeconds < 0) {
      return { leadInSeconds: 0, vibrationMs: 200, wakeLockEnabled: false };
    }
    const vibrationMs =
      typeof parsed.vibrationMs === "number" && parsed.vibrationMs >= 0
        ? parsed.vibrationMs
        : 200;
    const wakeLockEnabled = typeof parsed.wakeLockEnabled === "boolean" ? parsed.wakeLockEnabled : false;
    return { leadInSeconds: parsed.leadInSeconds, vibrationMs, wakeLockEnabled };
  } catch {
    return { leadInSeconds: 0, vibrationMs: 200, wakeLockEnabled: false };
  }
};

const saveSettings = (leadInSeconds: number, vibrationMs: number, wakeLockEnabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ leadInSeconds, vibrationMs, wakeLockEnabled })
    );
  } catch {
    // ignore storage errors
  }
};

export const useTimerSettings = create<TimerSettingsState>((set) => ({
  ...loadSettings(),
  setLeadInSeconds: (value) => {
    const next = Number.isNaN(value) || value < 0 ? 0 : value;
    set((state) => {
      saveSettings(next, state.vibrationMs, state.wakeLockEnabled);
      return { leadInSeconds: next };
    });
  },
  setVibrationMs: (value) => {
    const next = Number.isNaN(value) || value < 0 ? 0 : value;
    set((state) => {
      saveSettings(state.leadInSeconds, next, state.wakeLockEnabled);
      return { vibrationMs: next };
    });
  },
  setWakeLockEnabled: (value) => {
    const next = Boolean(value);
    set((state) => {
      saveSettings(state.leadInSeconds, state.vibrationMs, next);
      return { wakeLockEnabled: next };
    });
  },
}));
