"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  RotateCcwIcon,
  PlusIcon,
  MinusIcon,
  SquareIcon,
} from "lucide-react";
import { Button } from "@/ui/button";
import { useTabataPlayerStore } from "@/store/tabataPlayer";
import { useTimerSettings } from "@/store/timerSettings";

const formatSeconds = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const TabataPlayerBar = () => {
  const queue = useTabataPlayerStore((state) => state.queue);
  const currentIndex = useTabataPlayerStore((state) => state.currentIndex);
  const remainingSeconds = useTabataPlayerStore((state) => state.remainingSeconds);
  const status = useTabataPlayerStore((state) => state.status);
  const currentTimerName = useTabataPlayerStore((state) => state.currentTimerName);
  const play = useTabataPlayerStore((state) => state.play);
  const pause = useTabataPlayerStore((state) => state.pause);
  const reset = useTabataPlayerStore((state) => state.reset);
  const stop = useTabataPlayerStore((state) => state.stop);
  const next = useTabataPlayerStore((state) => state.next);
  const prev = useTabataPlayerStore((state) => state.prev);
  const adjustSeconds = useTabataPlayerStore((state) => state.adjustSeconds);
  const tick = useTabataPlayerStore((state) => state.tick);
  const vibrationMs = useTimerSettings((state) => state.vibrationMs);
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const previousPaddingRef = useRef<string | null>(null);
  const lastAnnouncedRef = useRef<{ stepId: string | null; second: number | null }>({
    stepId: null,
    second: null,
  });
  const lastStepLabelRef = useRef<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastIndexRef = useRef<number | null>(null);
  const tingAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasUserInteractedRef = useRef(false);

  const currentStep = useMemo(() => queue[currentIndex], [queue, currentIndex]);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, tick]);

  useEffect(() => {
    if (queue.length) {
      setIsClosing(false);
    }
  }, [queue.length]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (queue.length && !isClosing) {
      if (previousPaddingRef.current === null) {
        previousPaddingRef.current = document.body.style.paddingBottom;
      }
      root.style.setProperty("--player-offset", "150px");
      document.body.style.paddingBottom = "120px";
      return;
    }
    root.style.removeProperty("--player-offset");
    if (previousPaddingRef.current !== null) {
      document.body.style.paddingBottom = previousPaddingRef.current;
      previousPaddingRef.current = null;
    }
  }, [isClosing, queue.length]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    if (status !== "running" || !hasUserInteractedRef.current) return;
    let cancelled = false;

    const requestWakeLock = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch {
        // ignore wake lock errors
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status === "running") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    tingAudioRef.current = new Audio("/ting.mp3");
    tingAudioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFirstInteraction = () => {
      hasUserInteractedRef.current = true;
      const audio = tingAudioRef.current;
      if (audio) {
        const previousVolume = audio.volume;
        audio.volume = 0;
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = previousVolume;
          })
          .catch(() => {
            audio.volume = previousVolume;
          });
      }
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    return () => window.removeEventListener("pointerdown", handleFirstInteraction);
  }, []);

  useEffect(() => {
    if (!currentStep) return;
    if (lastIndexRef.current === null) {
      lastIndexRef.current = currentIndex;
      return;
    }
    if (currentIndex === lastIndexRef.current) return;
    lastIndexRef.current = currentIndex;
    if (!hasUserInteractedRef.current) return;
    const audio = tingAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [currentIndex, currentStep]);

  useEffect(() => {
    if (status !== "running") return;
    if (!currentStep) return;
    if (lastStepLabelRef.current === currentStep.id) return;
    lastStepLabelRef.current = currentStep.id;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "id-ID";
    utterance.rate = 1.1;
    utterance.text = currentStep.label.toLowerCase();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [currentStep, status]);

  useEffect(() => {
    if (status !== "running") return;
    if (!currentStep) return;
    if (remainingSeconds < 1 || remainingSeconds > 5) return;
    if (lastAnnouncedRef.current.stepId === currentStep.id &&
      lastAnnouncedRef.current.second === remainingSeconds) {
      return;
    }
    lastAnnouncedRef.current = { stepId: currentStep.id, second: remainingSeconds };
    if (vibrationMs > 0 && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(vibrationMs);
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "id-ID";
    utterance.rate = 1.4;
    switch (remainingSeconds) {
      case 5:
        utterance.text = "lima";
        break;
      case 4:
        utterance.text = "empat";
        break;
      case 3:
        utterance.text = "tiga";
        break;
      case 2:
        utterance.text = "dua";
        break;
      case 1:
        utterance.text = "satu";
        break;
      default:
        utterance.text = remainingSeconds.toString();
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [currentStep, remainingSeconds, status, vibrationMs]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    dragStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = dragStartY.current - currentY;
    if (!isExpanded && delta > 40) {
      setIsExpanded(true);
      dragStartY.current = null;
    } else if (isExpanded && delta < -40) {
      setIsExpanded(false);
      dragStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    dragStartY.current = null;
  };

  if (!queue.length && !isClosing) return null;

  const isRunning = status === "running";
  const isFinished = status === "finished";

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30"
          onClick={() => setIsExpanded(false)}
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-300 ${isClosing ? "translate-y-full" : "translate-y-0"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4">
          <button
            type="button"
            className="mx-auto h-1.5 w-14 rounded-full bg-slate-200"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label="Toggle detail"
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sedang berjalan</p>
              <p className="text-base font-semibold text-slate-900">
                {currentTimerName ?? "Timer"}
              </p>
              <p className="text-sm text-slate-500">
                {currentStep ? `${currentStep.label} • Step ${currentIndex + 1}/${queue.length}` : "-"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-slate-900">
                {isFinished ? "Selesai" : formatSeconds(remainingSeconds)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button type="button" size="icon" variant="ghost" onClick={prev} aria-label="Sebelumnya">
                <SkipBackIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={() => {
                  hasUserInteractedRef.current = true;
                  if (isRunning) {
                    pause();
                  } else {
                    play();
                  }
                }}
                aria-label={isRunning ? "Pause" : "Play"}
              >
                {isRunning ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={next} aria-label="Berikutnya">
                <SkipForwardIcon className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={reset} aria-label="Reset">
                <RotateCcwIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsClosing(true);
                  window.setTimeout(() => {
                    stop();
                    setIsClosing(false);
                  }, 260);
                }}
                aria-label="Stop"
              >
                <SquareIcon className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => adjustSeconds(-5)}
                aria-label="Kurangi 5 detik"
              >
                <MinusIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => adjustSeconds(5)}
                aria-label="Tambah 5 detik"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
          </div>
          <div
            className={`mx-auto w-full max-w-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[60vh] pb-6" : "max-h-0"
              }`}
          >
            <div className="px-4 pb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Queue</p>
              <div className="mt-3 space-y-2">
                {queue.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${index === currentIndex
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                      }`}
                  >
                    <span>
                      {step.label} • {index + 1}/{queue.length}
                    </span>
                    <span className="text-xs uppercase">{step.duration}s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TabataPlayerBar;
