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
import ConfirmModal from "@/components/shared/ConfirmModal";

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
  const wakeLockEnabled = useTimerSettings((state) => state.wakeLockEnabled);
  const countdownVolume = useTimerSettings((state) => state.countdownVolume);
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset" | "stop" | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartPoint = useRef<{ x: number; y: number } | null>(null);
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
  const stepCounts = useMemo(() => {
    const totals = queue.reduce(
      (acc, step) => {
        if (step.type === "work") acc.work += 1;
        if (step.type === "rest" || step.type === "setRest") acc.rest += 1;
        return acc;
      },
      { work: 0, rest: 0 }
    );

    if (!queue.length) {
      return {
        totalWork: totals.work,
        totalRest: totals.rest,
        currentWork: 0,
        currentRest: 0,
      };
    }

    if (status === "finished") {
      return {
        totalWork: totals.work,
        totalRest: totals.rest,
        currentWork: totals.work,
        currentRest: totals.rest,
      };
    }

    const current = queue.slice(0, currentIndex + 1).reduce(
      (acc, step) => {
        if (step.type === "work") acc.work += 1;
        if (step.type === "rest" || step.type === "setRest") acc.rest += 1;
        return acc;
      },
      { work: 0, rest: 0 }
    );

    return {
      totalWork: totals.work,
      totalRest: totals.rest,
      currentWork: current.work,
      currentRest: current.rest,
    };
  }, [queue, currentIndex, status]);

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
      setIsMinimized(false);
    }
  }, [queue.length]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (queue.length && !isClosing) {
      if (previousPaddingRef.current === null) {
        previousPaddingRef.current = document.body.style.paddingBottom;
      }
      if (isMinimized) {
        root.style.setProperty("--player-offset", "calc(72px + var(--bottom-nav-height, 0px))");
        document.body.style.paddingBottom = "calc(84px + var(--bottom-nav-height, 0px))";
        root.style.setProperty(
          "--player-save-bottom",
          "calc(var(--bottom-nav-height, 0px) + 10px)"
        );
      } else {
        root.style.setProperty("--player-offset", "calc(150px + var(--bottom-nav-height, 0px))");
        document.body.style.paddingBottom = "calc(120px + var(--bottom-nav-height, 0px))";
        root.style.setProperty(
          "--player-save-bottom",
          "calc(var(--player-offset, 0px) - 14px)"
        );
      }
      return;
    }
    root.style.removeProperty("--player-offset");
    root.style.removeProperty("--player-save-bottom");
    if (previousPaddingRef.current !== null) {
      document.body.style.paddingBottom = previousPaddingRef.current;
      previousPaddingRef.current = null;
    }
  }, [isClosing, isMinimized, queue.length]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    if (!wakeLockEnabled) return;
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
        wakeLockRef.current.release().catch(() => { });
        wakeLockRef.current = null;
      }
    };
  }, [status, wakeLockEnabled]);

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
    audio.play().catch(() => { });
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
    switch (countdownVolume) {
      case "low":
        utterance.volume = 0.25;
        break;
      case "medium":
        utterance.volume = 0.7;
        break;
      case "loud":
        utterance.volume = 1;
        break;
      default:
        utterance.volume = 0.5;
    }
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
    dragStartPoint.current = {
      x: event.touches[0]?.clientX ?? 0,
      y: event.touches[0]?.clientY ?? 0,
    };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStartPoint.current) return;
    event.preventDefault();
    const currentX = event.touches[0]?.clientX ?? 0;
    const currentY = event.touches[0]?.clientY ?? 0;
    const deltaX = currentX - dragStartPoint.current.x;
    const deltaY = currentY - dragStartPoint.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!isExpanded && deltaY < -40 && absY > absX + 6) {
      if (isMinimized) {
        setIsMinimized(false);
      }
      setIsExpanded(true);
      dragStartPoint.current = null;
    } else if (isExpanded && deltaY > 40 && absY > absX + 6) {
      setIsExpanded(false);
      dragStartPoint.current = null;
    } else if (!isExpanded && !isMinimized && deltaY > 40 && absY > absX + 6) {
      setIsMinimized(true);
      dragStartPoint.current = null;
    }
  };

  const handleTouchEnd = () => {
    dragStartPoint.current = null;
  };

  const handleQueueTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleQueueTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleQueueTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  if (!queue.length && !isClosing) return null;

  const isRunning = status === "running";
  const isFinished = status === "finished";

  return (
    <>
      {isExpanded && !isMinimized && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30"
          onClick={() => setIsExpanded(false)}
        />
      )}
      <button
        type="button"
        style={{ bottom: "calc(var(--bottom-nav-height, 0px) + 10px)" }}
        className={`fixed left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out will-change-transform ${
          isClosing ? "translate-y-full" : "translate-y-0"
        } ${isMinimized ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-90"}`}
        onClick={() => setIsMinimized(false)}
        aria-label="Show timer"
      >
        <span className="text-sm font-semibold">
          {isFinished ? "Selesai" : formatSeconds(remainingSeconds)}
        </span>
      </button>
      <div
        style={{ bottom: "var(--bottom-nav-height, 0px)" }}
        className={`fixed inset-x-0 z-50 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 ease-out will-change-transform touch-none overscroll-contain ${
          isClosing ? "translate-y-full" : "translate-y-0"
        } ${isMinimized ? "pointer-events-none opacity-0 scale-[0.98] translate-y-2" : "opacity-100 scale-100"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 py-2.5">
          <button
            type="button"
            className="mx-auto h-1.5 w-12 rounded-full bg-slate-200"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label="Toggle detail"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 ">
              <p className="text-sm font-semibold text-slate-900">
                {currentTimerName ?? "Timer"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {currentStep ? `${currentStep.label} • ${currentIndex + 1}/${queue.length}` : "-"}
              </p>
            </div>
            <p className="whitespace-nowrap text-2xl font-semibold text-slate-900">
              {isFinished ? "Selesai" : formatSeconds(remainingSeconds)}
            </p>
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
              <Button type="button" size="icon" variant="ghost" onClick={next} aria-label="Next">
                <SkipForwardIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setConfirmAction("reset")}
                aria-label="Reset"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setConfirmAction("stop")}
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
                aria-label="Decrease 5 seconds"
              >
                <MinusIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => adjustSeconds(5)}
                aria-label="Add 5 seconds"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
          </div>
          <div
            className={`mx-auto w-full max-w-2xl overflow-hidden transition-all duration-300 ${
              isExpanded ? "max-h-[60vh] pb-6" : "max-h-0"
            }`}
          >
            <div
              className="max-h-[60vh] overflow-y-auto px-4 pb-4 touch-pan-y overscroll-contain"
              onTouchStart={handleQueueTouchStart}
              onTouchMove={handleQueueTouchMove}
              onTouchEnd={handleQueueTouchEnd}
            >
              <div className="sticky top-0 z-10 bg-white/95 pb-3 pt-2 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-400">Queue</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Work</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {stepCounts.currentWork}/{stepCounts.totalWork}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Rest</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {stepCounts.currentRest}/{stepCounts.totalRest}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {queue.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      index === currentIndex
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
      <ConfirmModal
        isOpen={confirmAction === "reset"}
        title="Reset timer?"
        message="The timer will restart from the beginning."
        confirmText="Reset"
        cancelText="Cancel"
        variant="overlay"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          reset();
          setConfirmAction(null);
        }}
      />
      <ConfirmModal
        isOpen={confirmAction === "stop"}
        title="Stop timer?"
        message="The timer will stop and exit the player."
        confirmText="Stop"
        cancelText="Cancel"
        variant="overlay"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          setIsClosing(true);
          window.setTimeout(() => {
            stop();
            setIsClosing(false);
          }, 260);
        }}
      />
    </>
  );
};

export default TabataPlayerBar;
