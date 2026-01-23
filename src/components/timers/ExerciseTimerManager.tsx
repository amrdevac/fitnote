"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon, TimerResetIcon, HourglassIcon, CopyIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/ui/use-toast";
import useExerciseTimers, { NewSegmentInput } from "@/hooks/useExerciseTimers";

type FormSegment = {
  id: string;
  exercise: string;
  rest: string;
  laps: string;
};

const createFormSegment = (): FormSegment => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  exercise: "",
  rest: "",
  laps: "1",
});

function secondsToLabel(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

type ExerciseTimerManagerProps = {
  onClose?: () => void;
  embedded?: boolean;
};

const ExerciseTimerManager = ({ onClose, embedded = false }: ExerciseTimerManagerProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const timerStore = useExerciseTimers();
  const [timerName, setTimerName] = useState("");
  const [segments, setSegments] = useState<FormSegment[]>([createFormSegment()]);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeAnimationRef = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);
  const [panelState, setPanelState] = useState<"enter" | "active" | "exit">("enter");

  const applySwipeProgress = (progress: number) => {
    if (!embedded) return;
    swipeProgressRef.current = progress;
    if (swipeAnimationRef.current) return;
    swipeAnimationRef.current = window.requestAnimationFrame(() => {
      swipeAnimationRef.current = null;
      const node = containerRef.current;
      if (!node) return;
      const clamped = Math.min(1, Math.abs(swipeProgressRef.current));
      const scale = 1 - 0.04 * clamped;
      const opacity = 1 - 0.35 * clamped;
      node.style.transform = `scale(${scale})`;
      node.style.opacity = `${opacity}`;
      node.style.transition = "none";
    });
  };

  const totalQueues = useMemo(() => {
    return segments.reduce(
      (acc, segment) => {
        const exerciseSeconds = Number.parseInt(segment.exercise, 10);
        const restSeconds = Number.parseInt(segment.rest, 10);
        const laps = Number.parseInt(segment.laps, 10) || 0;
        if (Number.isNaN(exerciseSeconds) || Number.isNaN(restSeconds) || laps <= 0) {
          return acc;
        }
        const totalDuration = laps * (exerciseSeconds + restSeconds);
        return {
          laps: acc.laps + laps,
          duration: acc.duration + totalDuration,
        };
      },
      { laps: 0, duration: 0 }
    );
  }, [segments]);

  function showError(message: string) {
    toast({
      title: "Form belum lengkap",
      description: message,
      variant: "destructive",
    });
  }

  function showSuccess(message: string) {
    toast({ title: message });
  }

  const updateSegment = (segmentId: string, field: keyof FormSegment, value: string) => {
    setSegments((prev) =>
      prev.map((segment) => (segment.id === segmentId ? { ...segment, [field]: value } : segment))
    );
  };

  const addSegment = () => setSegments((prev) => [...prev, createFormSegment()]);

  const duplicateSegment = (segmentId: string) => {
    setSegments((prev) => {
      const target = prev.find((segment) => segment.id === segmentId);
      if (!target) return prev;
      const copy: FormSegment = {
        ...target,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
      const index = prev.findIndex((segment) => segment.id === segmentId);
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const removeSegment = (segmentId: string) => {
    setSegments((prev) => (prev.length === 1 ? prev : prev.filter((segment) => segment.id !== segmentId)));
  };

  async function handleSaveTimer(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = timerName.trim();
    if (!trimmedName) {
      showError("Nama timer wajib diisi.");
      return;
    }
    const parsedSegments: NewSegmentInput[] = [];
    for (const segment of segments) {
      const exerciseSeconds = Number.parseInt(segment.exercise, 10);
      const restSeconds = Number.parseInt(segment.rest, 10);
      const laps = Number.parseInt(segment.laps, 10);
      if (
        Number.isNaN(exerciseSeconds) ||
        exerciseSeconds <= 0 ||
        Number.isNaN(restSeconds) ||
        restSeconds < 0 ||
        Number.isNaN(laps) ||
        laps <= 0
      ) {
        showError("Semua segmen wajib memiliki durasi dan jumlah lap yang valid.");
        return;
      }
      parsedSegments.push({
        exerciseSeconds,
        restSeconds,
        laps,
      });
    }

    setIsSaving(true);
    try {
      await timerStore.createTimer(trimmedName, parsedSegments);
      setTimerName("");
      setSegments([createFormSegment()]);
      showSuccess("Timer latihan tersimpan.");
    } catch {
      showError("Gagal menyimpan timer. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

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

  return (
    <div
      data-swipe-ignore={embedded ? true : undefined}
      className="fixed inset-0 z-50 flex bg-gradient-to-b from-emerald-50 via-white to-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`flex h-full w-full flex-col transition-transform duration-300 ${panelClass}`}>
        <div
          ref={containerRef}
          className="mx-auto flex h-full w-full max-w-2xl flex-col px-5 pb-20 pt-5 text-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className=" uppercase tracking-wide text-slate-400">Pengelolaan Timer</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={"ghost"} size="icon" onClick={closePanel} className="text-slate-600">
                <ArrowRightIcon className="size-5" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSaveTimer} className="space-y-4 rounded-2xl bg-white p-5 shadow">
            <div>
              <Label htmlFor="timer-name">Nama timer</Label>
              <Input
                id="timer-name"
                placeholder="Contoh: 45 mins extreme"
                value={timerName}
                onChange={(event) => setTimerName(event.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Segmen timer</p>
                <Button type="button" variant="ghost" size="sm" onClick={addSegment}>
                  <PlusIcon className="mr-1 size-4" />
                  Tambah segmen
                </Button>
              </div>
              <div className="space-y-3">
                {segments.map((segment, index) => (
                  <Card key={segment.id} className="border-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-slate-700">
                          Segmen {index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => duplicateSegment(segment.id)}
                            aria-label="Duplikasi segmen"
                          >
                            <CopyIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-red-600"
                            onClick={() => removeSegment(segment.id)}
                            aria-label="Hapus segmen"
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label className="text-xs uppercase text-slate-500">Exercise (detik)</Label>
                        <Input
                          inputMode="numeric"
                          value={segment.exercise}
                          onChange={(event) => updateSegment(segment.id, "exercise", event.target.value)}
                          placeholder="35"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase text-slate-500">Rest (detik)</Label>
                        <Input
                          inputMode="numeric"
                          value={segment.rest}
                          onChange={(event) => updateSegment(segment.id, "rest", event.target.value)}
                          placeholder="60"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase text-slate-500">Lap</Label>
                        <Input
                          inputMode="numeric"
                          value={segment.laps}
                          onChange={(event) => updateSegment(segment.id, "laps", event.target.value)}
                          placeholder="1"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <HourglassIcon className="size-4" />
                <span>
                  Total lap: <strong>{totalQueues.laps}</strong> • Estimasi durasi:{" "}
                  <strong>{secondsToLabel(totalQueues.duration)}</strong>
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan timer"}
            </Button>
          </form>

          <div className="mt-8 space-y-4 pb-10">
            <div className="flex items-center gap-2 text-slate-600">
              <TimerResetIcon className="size-4" />
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timer tersimpan</p>
            </div>
            {timerStore.timers.length === 0 && timerStore.isLoaded && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                Belum ada preset timer. Simpan kombinasi exercise + rest untuk siap dijalankan kapan saja.
              </div>
            )}
            <div className="space-y-4">
              {timerStore.timers.map((timer) => {
                const totalDuration = timer.segments.reduce(
                  (acc, segment) => acc + segment.laps * (segment.exerciseSeconds + segment.restSeconds),
                  0
                );
                const totalLaps = timer.segments.reduce((acc, segment) => acc + segment.laps, 0);
                return (
                  <Card key={timer.id} className="border-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{timer.name}</CardTitle>
                          <CardDescription>
                            {timer.segments.length} segmen · {totalLaps} lap · {secondsToLabel(totalDuration)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => handleDeleteTimer(timer.id)}
                          aria-label="Hapus timer"
                        >
                          <Trash2Icon className="size-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {timer.segments.map((segment, index) => (
                        <div
                          key={segment.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                        >
                          <p className="font-semibold text-slate-800">Segmen {index + 1}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
                            <span>Exercise: {secondsToLabel(segment.exerciseSeconds)}</span>
                            <span>Rest: {secondsToLabel(segment.restSeconds)}</span>
                            <span>Lap: {segment.laps}x</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTimerManager;
