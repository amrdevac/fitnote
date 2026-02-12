import { create } from "zustand";

type TimerSettingsState = {
  leadInSeconds: number;
  vibrationMs: number;
  wakeLockEnabled: boolean;
  countdownVolume: "low" | "normal" | "medium" | "loud";
  setLeadInSeconds: (value: number) => void;
  setVibrationMs: (value: number) => void;
  setWakeLockEnabled: (value: boolean) => void;
  setCountdownVolume: (value: "low" | "normal" | "medium" | "loud") => void;
};

type TimerSettingsValues = Pick<
  TimerSettingsState,
  "leadInSeconds" | "vibrationMs" | "wakeLockEnabled" | "countdownVolume"
>;

const storageKey = "fitnote:timer-settings";

const loadSettings = (): TimerSettingsValues => {
  if (typeof window === "undefined") {
    return {
      leadInSeconds: 0,
      vibrationMs: 200,
      wakeLockEnabled: false,
      countdownVolume: "normal",
    };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        leadInSeconds: 0,
        vibrationMs: 200,
        wakeLockEnabled: false,
        countdownVolume: "normal",
      };
    }
    const parsed = JSON.parse(raw) as {
      leadInSeconds?: number;
      vibrationMs?: number;
      wakeLockEnabled?: boolean;
      countdownVolume?: "low" | "normal" | "medium" | "loud";
    };
    if (typeof parsed.leadInSeconds !== "number" || parsed.leadInSeconds < 0) {
      return {
        leadInSeconds: 0,
        vibrationMs: 200,
        wakeLockEnabled: false,
        countdownVolume: "normal",
      };
    }
    const vibrationMs =
      typeof parsed.vibrationMs === "number" && parsed.vibrationMs >= 0
        ? parsed.vibrationMs
        : 200;
    const wakeLockEnabled = typeof parsed.wakeLockEnabled === "boolean" ? parsed.wakeLockEnabled : false;
    const countdownVolume =
      parsed.countdownVolume === "low" ||
      parsed.countdownVolume === "normal" ||
      parsed.countdownVolume === "medium" ||
      parsed.countdownVolume === "loud"
        ? parsed.countdownVolume
        : "normal";
    return { leadInSeconds: parsed.leadInSeconds, vibrationMs, wakeLockEnabled, countdownVolume };
  } catch {
    return {
      leadInSeconds: 0,
      vibrationMs: 200,
      wakeLockEnabled: false,
      countdownVolume: "normal",
    };
  }
};

const saveSettings = (
  leadInSeconds: number,
  vibrationMs: number,
  wakeLockEnabled: boolean,
  countdownVolume: "low" | "normal" | "medium" | "loud"
) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ leadInSeconds, vibrationMs, wakeLockEnabled, countdownVolume })
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
      saveSettings(next, state.vibrationMs, state.wakeLockEnabled, state.countdownVolume);
      return { leadInSeconds: next };
    });
  },
  setVibrationMs: (value) => {
    const next = Number.isNaN(value) || value < 0 ? 0 : value;
    set((state) => {
      saveSettings(state.leadInSeconds, next, state.wakeLockEnabled, state.countdownVolume);
      return { vibrationMs: next };
    });
  },
  setWakeLockEnabled: (value) => {
    const next = Boolean(value);
    set((state) => {
      saveSettings(state.leadInSeconds, state.vibrationMs, next, state.countdownVolume);
      return { wakeLockEnabled: next };
    });
  },
  setCountdownVolume: (value) => {
    const next =
      value === "low" || value === "normal" || value === "medium" || value === "loud"
        ? value
        : "normal";
    set((state) => {
      saveSettings(state.leadInSeconds, state.vibrationMs, state.wakeLockEnabled, next);
      return { countdownVolume: next };
    });
  },
}));
