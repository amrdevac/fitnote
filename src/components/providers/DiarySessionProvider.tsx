"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DiaryMode } from "@/types/diary";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

type SessionStatus = "loading" | "locked" | "ready";

export interface BlurSettings {
  composeBlur: boolean;
  feedBlurEnabled: boolean;
  feedRevealMode?: "hover" | "manual";
}

interface DiarySessionValue {
  status: SessionStatus;
  mode: DiaryMode | null;
  blurSettings: BlurSettings;
  updateBlurSettings: (updater: (prev: BlurSettings) => BlurSettings) => void;
  unlock: (pin: string) => Promise<DiaryMode>;
  lock: () => void;
}

const DiarySessionContext = createContext<DiarySessionValue | undefined>(undefined);

const DEFAULT_BLUR: BlurSettings = {
  composeBlur: true,
  feedBlurEnabled: true,
  feedRevealMode: "hover",
};

const BLUR_STORAGE_KEY = "diary_blur_settings";

export default function DiarySessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [mode, setMode] = useState<DiaryMode | null>(null);
  const [blurSettings, setBlurSettings] = useState<BlurSettings>(DEFAULT_BLUR);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(BLUR_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setBlurSettings((prev) => ({
          composeBlur: typeof parsed.composeBlur === "boolean" ? parsed.composeBlur : prev.composeBlur,
          feedBlurEnabled: typeof parsed.feedBlurEnabled === "boolean" ? parsed.feedBlurEnabled : prev.feedBlurEnabled,
          feedRevealMode: parsed.feedRevealMode === "manual" ? "manual" : "hover",
        }));
      } catch {
        // ignore broken data
      }
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(BLUR_STORAGE_KEY, JSON.stringify(blurSettings));
    } catch {
      // ignore storage failures
    }
  }, [blurSettings, hydrated]);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/pin", { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal memuat sesi");
        const data = await res.json();
        if (!active) return;
        if (data.mode === "real" || data.mode === "decoy") {
          setMode(data.mode);
          setStatus("ready");
        } else {
          setMode(null);
          setStatus("locked");
        }
      } catch {
        if (!active) return;
        setMode(null);
        setStatus("locked");
      }
    }
    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Pin salah");
    }
    const data = await res.json();
    if (data.mode !== "real" && data.mode !== "decoy") {
      throw new Error("Respon tidak dikenal");
    }
    setMode(data.mode);
    setStatus("ready");
    return data.mode;
  }, []);

  const lock = useCallback(() => {
    setMode(null);
    setStatus("locked");
    fetch("/api/auth/pin", { method: "DELETE" }).catch(() => null);
  }, []);

  useEffect(() => {
    const pressed = new Set<string>();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) {
        pressed.clear();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "k" || key === "l") {
        pressed.add(key);
      } else {
        pressed.clear();
        return;
      }
      if (pressed.has("k") && pressed.has("l")) {
        event.preventDefault();
        lock();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "k" || key === "l") {
        pressed.delete(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [lock]);

  const value = useMemo<DiarySessionValue>(
    () => ({
      status,
      mode,
      blurSettings,
      updateBlurSettings: (updater) =>
        setBlurSettings((prev) => {
          const next = updater(prev);
          return {
            composeBlur: next.composeBlur,
            feedBlurEnabled: next.feedBlurEnabled,
            feedRevealMode: next.feedRevealMode ?? "hover",
          };
        }),
      unlock,
      lock,
    }),
    [status, mode, blurSettings, unlock, lock]
  );

  return (
    <DiarySessionContext.Provider value={value}>
      {status === "ready" ? children : null}
      <PinOverlay />
    </DiarySessionContext.Provider>
  );
}

export function useDiarySession() {
  const ctx = useContext(DiarySessionContext);
  if (!ctx) {
    throw new Error("useDiarySession harus di dalam DiarySessionProvider");
  }
  return ctx;
}

function PinOverlay() {
  const { status, unlock } = useDiarySession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = status !== "ready";
  useEffect(() => {
    if (!visible) {
      setPin("");
      setError(null);
      setSubmitting(false);
      return;
    }
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, status]);

  if (!visible) return null;

  const loading = status === "loading";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await unlock(pin);
      setPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pin salah");
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl text-white space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Private Diary</p>
          <h2 className="text-2xl font-semibold">
            {loading ? "Menyiapkan ruang rahasia..." : "Masukkan PIN"}
          </h2>
          <p className="text-sm text-slate-300">
            {loading
              ? "Tunggu sebentar ya."
              : "Gunakan PIN utama untuk akses asli atau decoy PIN untuk tampilan palsu."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="••••••"
            disabled={loading || submitting}
            className="text-lg tracking-widest text-center"
            ref={inputRef}
          />
          {error && (
            <p className="text-sm text-red-300 text-center">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading || submitting || !pin}
            className={cn(
              "w-full font-semibold text-base py-3",
              loading && "cursor-wait"
            )}
          >
            {submitting ? "Memeriksa..." : "Masuk"}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Shortcut panik: <span className="font-mono">Ctrl + K + L</span> buat munculin PIN lagi kapan saja.
        </p>
      </div>
    </div>
  );
}
