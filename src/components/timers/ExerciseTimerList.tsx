"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2Icon,
  TimerResetIcon,
  HourglassIcon,
  PlayIcon,
  PlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  MinusIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/ui/use-toast";
import useExerciseTimers from "@/hooks/useExerciseTimers";
import { useTabataPlayerStore } from "@/store/tabataPlayer";
import { useTimerSettings } from "@/store/timerSettings";
import PageHeader from "@/components/shared/PageHeader";
import SettingsSheet from "@/components/shared/SettingsSheet";

const secondsToLabel = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const padTime = (value: string) => value.padStart(2, "0").slice(-2);
const sanitizeTimeInput = (value: string) => value.replace(/\D/g, "").slice(0, 2);
const parseTime = (minutesValue: string, secondsValue: string) => {
  const minutes = Number.parseInt(minutesValue || "0", 10);
  const seconds = Number.parseInt(secondsValue || "0", 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds) || seconds >= 60 || seconds < 0) {
    return Number.NaN;
  }
  return minutes * 60 + seconds;
};

type ExerciseTimerListProps = {
  onClose?: () => void;
  embedded?: boolean;
};

const ExerciseTimerList = ({ onClose, embedded = false }: ExerciseTimerListProps) => {
  const router = useRouter();
  const timerStore = useExerciseTimers();
  const loadTimer = useTabataPlayerStore((state) => state.loadTimer);
  const playTimer = useTabataPlayerStore((state) => state.play);
  const playerStatus = useTabataPlayerStore((state) => state.status);
  const currentTimerId = useTabataPlayerStore((state) => state.currentTimerId);
  const leadInSeconds = useTimerSettings((state) => state.leadInSeconds);
  const setLeadInSeconds = useTimerSettings((state) => state.setLeadInSeconds);
  const vibrationMs = useTimerSettings((state) => state.vibrationMs);
  const setVibrationMs = useTimerSettings((state) => state.setVibrationMs);
  const wakeLockEnabled = useTimerSettings((state) => state.wakeLockEnabled);
  const setWakeLockEnabled = useTimerSettings((state) => state.setWakeLockEnabled);
  const countdownVolume = useTimerSettings((state) => state.countdownVolume);
  const setCountdownVolume = useTimerSettings((state) => state.setCountdownVolume);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const leadInSecondsRef = useRef<HTMLInputElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeAnimationRef = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);
  const [panelState, setPanelState] = useState<"enter" | "active" | "exit">("enter");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [leadInMinutes, setLeadInMinutes] = useState("00");
  const [leadInSecs, setLeadInSecs] = useState("03");
  const [vibrationInput, setVibrationInput] = useState("200");
  const vibrationStep = 50;
  const vibrationMax = 1000;

  const clampVibration = (value: number) => Math.min(vibrationMax, Math.max(0, value));
  const previewCountdownVoice = (volume: "low" | "normal" | "medium" | "loud") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance("Hello");
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    switch (volume) {
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
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleClose = () => setMenuOpenId(null);
    if (menuOpenId) {
      window.addEventListener("click", handleClose);
    }
    return () => window.removeEventListener("click", handleClose);
  }, [menuOpenId]);

  const applySwipeProgress = (progress: number) => {
    if (!embedded) return;
    swipeProgressRef.current = progress;
    if (swipeAnimationRef.current) return;
    swipeAnimationRef.current = window.requestAnimationFrame(() => {
      swipeAnimationRef.current = null;
      const node = containerRef.current;
      if (!node) return;
      if (swipeProgressRef.current === 0) {
        node.style.transform = "";
        node.style.opacity = "";
        node.style.transition = "";
        return;
      }
      const clamped = Math.min(1, Math.abs(swipeProgressRef.current));
      const scale = 1 - 0.04 * clamped;
      const opacity = 1 - 0.35 * clamped;
      node.style.transform = `scale(${scale})`;
      node.style.opacity = `${opacity}`;
      node.style.transition = "none";
    });
  };

  const handleDeleteTimer = async (timerId: string) => {
    await timerStore.deleteTimer(timerId);
  };

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!embedded) return;
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!embedded || swipeStartX.current === null) return;
    const currentX = event.touches[0]?.clientX ?? 0;
    const deltaX = swipeStartX.current - currentX;
    const progress = Math.max(0, Math.min(1, deltaX / 220));
    applySwipeProgress(progress);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!embedded) return;
    if (swipeStartX.current === null) return;
    const delta = swipeStartX.current - (event.changedTouches[0]?.clientX ?? 0);
    if (delta > 60) {
      closePanel();
    }
    applySwipeProgress(0);
    swipeStartX.current = null;
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setPanelState("active"));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const previousBehavior = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "none";
    return () => {
      root.style.overscrollBehaviorY = previousBehavior;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (swipeAnimationRef.current) {
        cancelAnimationFrame(swipeAnimationRef.current);
      }
    };
  }, []);

  const closePanel = () => {
    if (panelState === "exit") return;
    setPanelState("exit");
    setTimeout(() => {
      if (embedded && onClose) {
        onClose();
        return;
      }
      router.push("/");
    }, 250);
  };

  const panelClass =
    panelState === "active"
      ? "translate-y-0 opacity-100"
      : panelState === "exit"
        ? "translate-y-6 opacity-0"
        : "translate-y-6 opacity-0";

  const timersSummary = useMemo(() => {
    return timerStore.timers.map((timer) => {
      const totalDurationBase = timer.segments.reduce((acc, segment, index) => {
        const base = segment.laps * (segment.exerciseSeconds + segment.restSeconds);
        if (index < timer.segments.length - 1 && segment.setRestSeconds > 0) {
          return acc + base + segment.setRestSeconds;
        }
        return acc + base;
      }, 0);
      const workoutLaps = Math.max(1, timer.workoutLaps ?? 1);
      const totalLaps = timer.segments.reduce((acc, segment) => acc + segment.laps, 0) * workoutLaps;
      return {
        timer,
        totalDuration: totalDurationBase * workoutLaps + (leadInSeconds > 0 ? leadInSeconds : 0),
        totalLaps,
      };
    });
  }, [leadInSeconds, timerStore.timers]);

  useEffect(() => {
    const minutes = Math.floor(leadInSeconds / 60);
    const seconds = leadInSeconds % 60;
    setLeadInMinutes(padTime(minutes.toString()));
    setLeadInSecs(padTime(seconds.toString()));
  }, [leadInSeconds]);

  useEffect(() => {
    setVibrationInput(Math.max(0, Math.round(vibrationMs)).toString());
  }, [vibrationMs]);

  return (
    <div
      data-swipe-ignore={embedded ? true : undefined}
      className="fixed inset-0 z-50 flex bg-gradient-to-b from-emerald-50 via-white to-white"
      onTouchStart={embedded ? handleTouchStart : undefined}
      onTouchMove={embedded ? handleTouchMove : undefined}
      onTouchEnd={embedded ? handleTouchEnd : undefined}
    >
      <div
        className={`flex h-full w-full flex-col overflow-y-auto transition-all duration-200 ease-out ${panelClass}`}
      >
        <div
          ref={containerRef}
          className="mx-auto flex h-full w-full max-w-2xl flex-col px-6 pb-32 pt-0 text-slate-900"
        >
          <PageHeader
            title="Timer Management"
            onSettings={() => setSettingsOpen(true)}
            className="mb-3 pb-6 pt-8"
          />

          <div className="mt-2 space-y-4 pb-10">
            <div className="flex items-center justify-between gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                <TimerResetIcon className="size-4" />
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved timers</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/timers/new")}
              >
                <PlusIcon className="mr-1 size-4" />
                Add
              </Button>
            </div>
            {timerStore.timers.length === 0 && timerStore.isLoaded && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                No timer presets yet. Save exercise + rest combos to run anytime.
              </div>
            )}
            <div className="space-y-4">
              {timersSummary.map(({ timer, totalDuration, totalLaps }) => (
                <Card key={timer.id} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{timer.name}</CardTitle>
                        <CardDescription>
                          {totalLaps} lap · {secondsToLabel(totalDuration)}
                        </CardDescription>
                      </div>
                      <div className="relative flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`text-slate-500 hover:text-emerald-600 ${
                            playerStatus === "running" ? "cursor-not-allowed opacity-50 hover:text-slate-500" : ""
                          }`}
                          onClick={() => {
                            if (playerStatus === "running") {
                              toast({
                                title: "Timer is running",
                                description: "Pause or stop before restarting.",
                              });
                              return;
                            }
                            loadTimer(timer);
                            playTimer();
                          }}
                          aria-label="Start timer"
                          disabled={playerStatus === "running"}
                        >
                          <PlayIcon className="size-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpenId((prev) => (prev === timer.id ? null : timer.id));
                          }}
                          aria-label="Actions"
                        >
                          <MoreVerticalIcon className="size-5" />
                        </Button>
                        {menuOpenId === timer.id && (
                          <div
                            className="absolute right-0 top-10 z-[150] w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              onClick={() => {
                                setMenuOpenId(null);
                                router.push(`/timers/new?edit=${timer.id}`);
                              }}
                            >
                              <PencilIcon className="size-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setMenuOpenId(null);
                                handleDeleteTimer(timer.id);
                              }}
                            >
                              <Trash2Icon className="size-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <HourglassIcon className="size-4" />
              <span>Select a timer to start a workout.</span>
            </div>
          </div>
        </div>
      </div>

      <SettingsSheet
        title="Timer Settings"
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        preventAutoFocus
      >
        <div className="mt-2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <TimerResetIcon className="size-4 text-indigo-500" />
              <span>Global lead-in (mm:ss)</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4">
              <div className="text-center">
                <Input
                  inputMode="numeric"
                  value={leadInMinutes}
                  onChange={(event) => {
                    const next = sanitizeTimeInput(event.target.value);
                    setLeadInMinutes(next);
                    if (next.length >= 2) {
                      leadInSecondsRef.current?.focus();
                    }
                  }}
                  onFocus={(event) => event.target.select()}
                  onBlur={() => setLeadInMinutes(padTime(leadInMinutes))}
                  className="w-14 border-none bg-transparent text-center text-2xl font-semibold text-slate-900 shadow-none focus-visible:ring-0"
                />
                <p className="mt-1 text-[10px] font-semibold text-slate-400">MIN</p>
              </div>
              <span className="text-2xl font-semibold text-slate-300">:</span>
              <div className="text-center">
                <Input
                  inputMode="numeric"
                  ref={leadInSecondsRef}
                  value={leadInSecs}
                  onChange={(event) => setLeadInSecs(sanitizeTimeInput(event.target.value))}
                  onFocus={(event) => event.target.select()}
                  onBlur={() => setLeadInSecs(padTime(leadInSecs))}
                  className="w-14 border-none bg-transparent text-center text-2xl font-semibold text-slate-900 shadow-none focus-visible:ring-0"
                />
                <p className="mt-1 text-[10px] font-semibold text-slate-400">SEC</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <HourglassIcon className="size-4 text-indigo-500" />
                <span>Vibration duration</span>
              </div>
              <span className="text-[10px] text-slate-400">0 to disable</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-end gap-1">
                <span className="text-2xl font-semibold text-slate-900">
                  {vibrationInput || "0"}
                </span>
                <span className="pb-1 text-xs font-semibold text-slate-400">ms</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  onClick={() => {
                    const nextValue = clampVibration(
                      Number.parseInt(vibrationInput || "0", 10) - vibrationStep
                    );
                    setVibrationInput(nextValue.toString());
                  }}
                  aria-label="Decrease vibration"
                >
                  <MinusIcon className="size-4" />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  onClick={() => {
                    const nextValue = clampVibration(
                      Number.parseInt(vibrationInput || "0", 10) + vibrationStep
                    );
                    setVibrationInput(nextValue.toString());
                  }}
                  aria-label="Increase vibration"
                >
                  <PlusIcon className="size-4" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={vibrationMax}
              step={vibrationStep}
              value={clampVibration(Number.parseInt(vibrationInput || "0", 10))}
              onChange={(event) => setVibrationInput(event.target.value)}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-500"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <TimerResetIcon className="size-4 text-indigo-500" />
              <span>Countdown volume</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { id: "low", label: "Low" },
                { id: "normal", label: "Normal" },
                { id: "medium", label: "Medium" },
                { id: "loud", label: "Loud" },
              ].map((option) => {
                const active = countdownVolume === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-indigo-500 text-white shadow-[0_10px_20px_rgba(79,70,229,0.35)]"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    onClick={() => {
                      const next = option.id as "low" | "normal" | "medium" | "loud";
                      setCountdownVolume(next);
                      previewCountdownVoice(next);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Wake lock</p>
                <p className="text-xs text-slate-400">Keep the screen on while timer runs</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={wakeLockEnabled}
                onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${wakeLockEnabled ? "bg-indigo-500" : "bg-slate-300"
                  }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${wakeLockEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>

          <div className=" -mx-6 ">
            <div className="flex gap-3 px-6 w-full">
              <Button
                className="flex-1 rounded-2xl bg-indigo-500 text-white shadow-[0_16px_30px_rgba(79,70,229,0.35)]"
                onClick={() => {
                  const seconds = parseTime(leadInMinutes, leadInSecs);
                  if (!Number.isNaN(seconds)) {
                    setLeadInSeconds(seconds);
                  }
                  const vibrationValue = Number.parseInt(vibrationInput || "0", 10);
                  if (!Number.isNaN(vibrationValue)) {
                    setVibrationMs(vibrationValue);
                  }
                  setSettingsOpen(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </SettingsSheet>
    </div>
  );
};

export default ExerciseTimerList;
