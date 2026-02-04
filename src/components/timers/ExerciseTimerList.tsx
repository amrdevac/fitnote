"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2Icon,
  TimerResetIcon,
  HourglassIcon,
  PlayIcon,
  PlusIcon,
  XIcon,
  MoreVerticalIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import useExerciseTimers from "@/hooks/useExerciseTimers";
import { useTabataPlayerStore } from "@/store/tabataPlayer";
import { useTimerSettings } from "@/store/timerSettings";
import PageHeader from "@/components/shared/PageHeader";

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
  const leadInSeconds = useTimerSettings((state) => state.leadInSeconds);
  const setLeadInSeconds = useTimerSettings((state) => state.setLeadInSeconds);
  const vibrationMs = useTimerSettings((state) => state.vibrationMs);
  const setVibrationMs = useTimerSettings((state) => state.setVibrationMs);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeAnimationRef = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);
  const [panelState, setPanelState] = useState<"enter" | "active" | "exit">("enter");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [leadInMinutes, setLeadInMinutes] = useState("00");
  const [leadInSecs, setLeadInSecs] = useState("03");
  const [vibrationInput, setVibrationInput] = useState("200");

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

  const panelClass = panelState === "active" ? "translate-x-0" : "-translate-x-full";

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex h-full w-full flex-col overflow-y-auto transition-transform duration-300 ${panelClass}`}
      >
        <div
          ref={containerRef}
          className="mx-auto flex h-full w-full max-w-2xl flex-col px-6 pb-32 pt-0 text-slate-900"
        >
          <PageHeader
            title="Pengelolaan Timer"
            onBack={closePanel}
            onSettings={() => setSettingsOpen(true)}
            backPosition="right"
            className="mb-3 pb-6 pt-8"
          />

          <div className="mt-2 space-y-4 pb-10">
            <div className="flex items-center justify-between gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                <TimerResetIcon className="size-4" />
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timer tersimpan</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/timers/new")}
              >
                <PlusIcon className="mr-1 size-4" />
                Tambah
              </Button>
            </div>
            {timerStore.timers.length === 0 && timerStore.isLoaded && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                Belum ada preset timer. Simpan kombinasi exercise + rest untuk siap dijalankan kapan saja.
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
                          className="text-slate-500 hover:text-emerald-600"
                          onClick={() => {
                            loadTimer(timer);
                            playTimer();
                          }}
                          aria-label="Jalankan timer"
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
                          aria-label="Aksi"
                        >
                          <MoreVerticalIcon className="size-5" />
                        </Button>
                        {menuOpenId === timer.id && (
                          <div
                            className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
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
                              Hapus
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
              <span>Pilih timer untuk mulai latihan.</span>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
          <div className="w-full rounded-t-[28px] bg-white px-6 pb-8 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">Pengaturan Timer</p>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)}>
                <XIcon className="size-5" />
              </Button>
            </div>
            <div className="mt-5">
              <Label className="text-xs uppercase text-slate-500">Aba-aba global (mm:ss)</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  value={leadInMinutes}
                  onChange={(event) => setLeadInMinutes(sanitizeTimeInput(event.target.value))}
                  onBlur={() => setLeadInMinutes(padTime(leadInMinutes))}
                  className="w-16 text-center text-lg font-semibold"
                />
                <span className="text-lg font-semibold text-slate-400">:</span>
                <Input
                  inputMode="numeric"
                  value={leadInSecs}
                  onChange={(event) => setLeadInSecs(sanitizeTimeInput(event.target.value))}
                  onBlur={() => setLeadInSecs(padTime(leadInSecs))}
                  className="w-16 text-center text-lg font-semibold"
                />
              </div>
            </div>
            <div className="mt-5">
              <Label className="text-xs uppercase text-slate-500">Durasi getar (ms)</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  value={vibrationInput}
                  onChange={(event) =>
                    setVibrationInput(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  onBlur={() =>
                    setVibrationInput(
                      Math.max(0, Number.parseInt(vibrationInput || "0", 10)).toString()
                    )
                  }
                  className="w-24 text-center text-lg font-semibold"
                />
                <span className="text-xs text-slate-400">0 untuk nonaktif</span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSettingsOpen(false)}>
                Batal
              </Button>
              <Button
                className="flex-1"
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
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseTimerList;
