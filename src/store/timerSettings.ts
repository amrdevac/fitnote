import { create } from "zustand";

type TimerSettingsState = {
  leadInSeconds: number;
  setLeadInSeconds: (value: number) => void;
};

const storageKey = "fitnote:timer-settings";

const loadSettings = () => {
  if (typeof window === "undefined") return { leadInSeconds: 0 };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { leadInSeconds: 0 };
    const parsed = JSON.parse(raw) as { leadInSeconds?: number };
    if (typeof parsed.leadInSeconds !== "number" || parsed.leadInSeconds < 0) {
      return { leadInSeconds: 0 };
    }
    return { leadInSeconds: parsed.leadInSeconds };
  } catch {
    return { leadInSeconds: 0 };
  }
};

const saveSettings = (leadInSeconds: number) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ leadInSeconds }));
  } catch {
    // ignore storage errors
  }
};

export const useTimerSettings = create<TimerSettingsState>((set) => ({
  ...loadSettings(),
  setLeadInSeconds: (value) => {
    const next = Number.isNaN(value) || value < 0 ? 0 : value;
    set({ leadInSeconds: next });
    saveSettings(next);
  },
}));
