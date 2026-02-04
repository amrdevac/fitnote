import { create } from "zustand";

type TimerSettingsState = {
  leadInSeconds: number;
  vibrationMs: number;
  setLeadInSeconds: (value: number) => void;
  setVibrationMs: (value: number) => void;
};

const storageKey = "fitnote:timer-settings";

const loadSettings = () => {
  if (typeof window === "undefined") return { leadInSeconds: 0, vibrationMs: 200 };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { leadInSeconds: 0, vibrationMs: 200 };
    const parsed = JSON.parse(raw) as { leadInSeconds?: number; vibrationMs?: number };
    if (typeof parsed.leadInSeconds !== "number" || parsed.leadInSeconds < 0) {
      return { leadInSeconds: 0, vibrationMs: 200 };
    }
    const vibrationMs =
      typeof parsed.vibrationMs === "number" && parsed.vibrationMs >= 0
        ? parsed.vibrationMs
        : 200;
    return { leadInSeconds: parsed.leadInSeconds, vibrationMs };
  } catch {
    return { leadInSeconds: 0, vibrationMs: 200 };
  }
};

const saveSettings = (leadInSeconds: number, vibrationMs: number) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ leadInSeconds, vibrationMs }));
  } catch {
    // ignore storage errors
  }
};

export const useTimerSettings = create<TimerSettingsState>((set) => ({
  ...loadSettings(),
  setLeadInSeconds: (value) => {
    const next = Number.isNaN(value) || value < 0 ? 0 : value;
    set((state) => {
      saveSettings(next, state.vibrationMs);
      return { leadInSeconds: next };
    });
  },
  setVibrationMs: (value) => {
    const next = Number.isNaN(value) || value < 0 ? 0 : value;
    set((state) => {
      saveSettings(state.leadInSeconds, next);
      return { vibrationMs: next };
    });
  },
}));
