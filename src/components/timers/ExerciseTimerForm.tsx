"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusIcon,
  Trash2Icon,
  HourglassIcon,
  ArrowLeftIcon,
  XIcon,
  TimerIcon,
  MinusIcon,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/ui/use-toast";
import useExerciseTimers, { NewSegmentInput } from "@/hooks/useExerciseTimers";
import { useTimerSettings } from "@/store/timerSettings";

type FormSegment = {
  id: string;
  exerciseMin: string;
  exerciseSec: string;
  restMin: string;
  restSec: string;
  setRestMin: string;
  setRestSec: string;
  useExercise: boolean;
  useRest: boolean;
  useSetRest: boolean;
  laps: string;
};

const createFormSegment = (): FormSegment => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  exerciseMin: "00",
  exerciseSec: "00",
  restMin: "00",
  restSec: "00",
  setRestMin: "00",
  setRestSec: "00",
  useExercise: false,
  useRest: false,
  useSetRest: false,
  laps: "1",
});

const secondsToLabel = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const secondsToClock = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const parseTime = (minutesValue: string, secondsValue: string) => {
  const minutes = Number.parseInt(minutesValue || "0", 10);
  const seconds = Number.parseInt(secondsValue || "0", 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds) || seconds >= 60 || seconds < 0) {
    return Number.NaN;
  }
  return minutes * 60 + seconds;
};

const sanitizeTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, 2);
};

const padTime = (value: string) => value.padStart(2, "0").slice(-2);

type TimeValue = {
  minutes: string;
  seconds: string;
};

type TimeInputProps = {
  id?: string;
  label: string;
  value: TimeValue;
  onChange: (next: TimeValue) => void;
  size?: "compact" | "large";
  autoFocus?: boolean;
  align?: "left" | "center";
};

const TimeInput = ({
  id,
  label,
  value,
  onChange,
  size = "compact",
  autoFocus = false,
  align = "left",
}: TimeInputProps) => {
  const minutesRef = useRef<HTMLInputElement | null>(null);
  const secondsRef = useRef<HTMLInputElement | null>(null);
  const inputClass =
    size === "large"
      ? "w-20 text-center text-3xl font-semibold border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      : "w-16 text-center";
  const containerClass =
    size === "large"
      ? "rounded-2xl bg-white px-4 py-3"
      : "";

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.setTimeout(() => {
      minutesRef.current?.focus();
      minutesRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [autoFocus]);

  const alignClass = align === "center" ? "items-center text-center" : "";

  return (
    <div className={`flex flex-col ${alignClass}`}>
      <Label htmlFor={id} className="text-xs uppercase text-slate-500">
        {label}
      </Label>
      <div
        className={`mt-1 flex items-center gap-2 ${containerClass} ${align === "center" ? "justify-center" : ""}`}
      >
        <Input
          id={id}
          inputMode="numeric"
          value={value.minutes}
          ref={minutesRef}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const nextMinutes = sanitizeTimeInput(event.target.value);
            onChange({ minutes: nextMinutes, seconds: value.seconds });
            if (nextMinutes.length === 2) {
              secondsRef.current?.focus();
            }
          }}
          onBlur={(event) =>
            onChange({
              minutes: padTime(sanitizeTimeInput(event.currentTarget.value)),
              seconds: value.seconds,
            })
          }
          className={inputClass}
        />
        <span className={`${size === "large" ? "text-3xl" : "text-sm"} font-semibold text-slate-400`}>
          :
        </span>
        <Input
          inputMode="numeric"
          value={value.seconds}
          ref={secondsRef}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          onChange={(event) =>
            onChange({ minutes: value.minutes, seconds: sanitizeTimeInput(event.target.value) })
          }
          onBlur={(event) =>
            onChange({
              minutes: value.minutes,
              seconds: padTime(sanitizeTimeInput(event.currentTarget.value)),
            })
          }
          className={inputClass}
        />
      </div>
    </div>
  );
};

type ExerciseTimerFormProps = {
  onClose?: () => void;
  embedded?: boolean;
};

type SegmentEditorMode = "add" | "edit";
type SegmentType = "exercise" | "rest" | "setRest";

const ExerciseTimerForm = ({ onClose, embedded = false }: ExerciseTimerFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerStore = useExerciseTimers();
  const { toast } = useToast();
  const [timerName, setTimerName] = useState("");
  const leadInSeconds = useTimerSettings((state) => state.leadInSeconds);
  const [segments, setSegments] = useState<FormSegment[]>([createFormSegment()]);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutLaps, setWorkoutLaps] = useState(1);
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<SegmentEditorMode>("add");
  const [editorType, setEditorType] = useState<SegmentType>("exercise");
  const [editorTime, setEditorTime] = useState<TimeValue>({ minutes: "00", seconds: "00" });
  const [editorLaps, setEditorLaps] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalQueues = useMemo(() => {
    let lapsTotal = 0;
    let durationTotal = 0;
    segments.forEach((segment, index) => {
      if (!segment.useExercise && !segment.useRest && !segment.useSetRest) {
        return;
      }
      const exerciseSeconds = segment.useExercise
        ? parseTime(segment.exerciseMin, segment.exerciseSec)
        : 0;
      const restSeconds = segment.useRest ? parseTime(segment.restMin, segment.restSec) : 0;
      const setRestSeconds = segment.useSetRest
        ? parseTime(segment.setRestMin, segment.setRestSec)
        : 0;
      const laps = Number.parseInt(segment.laps, 10) || 0;
      if (
        Number.isNaN(exerciseSeconds) ||
        Number.isNaN(restSeconds) ||
        Number.isNaN(setRestSeconds) ||
        laps <= 0
      ) {
        return;
      }
      durationTotal += laps * (exerciseSeconds + restSeconds);
      if (index < segments.length - 1 && setRestSeconds > 0) {
        durationTotal += setRestSeconds;
      }
      lapsTotal += laps;
    });
    const workoutLoop = Math.max(1, workoutLaps);
    const totalDuration = durationTotal * workoutLoop + (leadInSeconds > 0 ? leadInSeconds : 0);
    return {
      laps: lapsTotal * workoutLoop,
      duration: totalDuration,
    };
  }, [leadInSeconds, segments, workoutLaps]);

  const updateSegment = (segmentId: string, patch: Partial<FormSegment>) => {
    setSegments((prev) =>
      prev.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment))
    );
  };

  const openEditor = (mode: SegmentEditorMode, type: SegmentType, segment?: FormSegment) => {
    setEditorMode(mode);
    setEditorType(type);
    if (segment) {
      setEditingId(segment.id);
      const timeValue =
        type === "exercise"
          ? { minutes: segment.exerciseMin, seconds: segment.exerciseSec }
          : type === "rest"
            ? { minutes: segment.restMin, seconds: segment.restSec }
            : { minutes: segment.setRestMin, seconds: segment.setRestSec };
      setEditorTime(timeValue);
      setEditorLaps(segment.laps);
    } else {
      setEditingId(null);
      setEditorTime({ minutes: "00", seconds: "30" });
      setEditorLaps("1");
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setIsFabOpen(false);
  };

  const saveEditor = () => {
    const durationSeconds = parseTime(editorTime.minutes, editorTime.seconds);
    const lapsValue = Number.parseInt(editorLaps, 10);
    if (Number.isNaN(durationSeconds) || durationSeconds <= 0 || Number.isNaN(lapsValue) || lapsValue <= 0) {
      showError("Durasi dan lap harus valid.");
      return;
    }

    const patch: Partial<FormSegment> = {
      useExercise: editorType === "exercise",
      useRest: editorType === "rest",
      useSetRest: editorType === "setRest",
      exerciseMin: editorType === "exercise" ? editorTime.minutes : "00",
      exerciseSec: editorType === "exercise" ? editorTime.seconds : "00",
      restMin: editorType === "rest" ? editorTime.minutes : "00",
      restSec: editorType === "rest" ? editorTime.seconds : "00",
      setRestMin: editorType === "setRest" ? editorTime.minutes : "00",
      setRestSec: editorType === "setRest" ? editorTime.seconds : "00",
      laps: editorLaps,
    };

    if (editorMode === "add") {
      setSegments((prev) => [...prev, { ...createFormSegment(), ...patch }]);
    } else if (editingId) {
      updateSegment(editingId, patch);
    }

    closeEditor();
  };

  const removeSegment = (segmentId: string) => {
    setSegments((prev) => (prev.length === 1 ? prev : prev.filter((segment) => segment.id !== segmentId)));
  };

  function showError(message: string) {
    toast({
      title: "Form belum lengkap",
      description: message,
      variant: "error",
    });
  }

  function showSuccess(message: string) {
    toast({ title: message, variant: "success" });
  }

  async function handleSaveTimer(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = timerName.trim();
    if (!trimmedName) {
      showError("Nama timer wajib diisi.");
      return;
    }
    const parsedSegments: NewSegmentInput[] = [];
    const activeSegments = segments.filter(
      (segment) => segment.useExercise || segment.useRest || segment.useSetRest
    );
    if (activeSegments.length === 0) {
      showError("Tambahkan minimal satu interval.");
      return;
    }
    for (const segment of activeSegments) {
      const exerciseSeconds = segment.useExercise
        ? parseTime(segment.exerciseMin, segment.exerciseSec)
        : 0;
      const restSeconds = segment.useRest ? parseTime(segment.restMin, segment.restSec) : 0;
      const setRestSeconds = segment.useSetRest
        ? parseTime(segment.setRestMin, segment.setRestSec)
        : 0;
      const laps = Number.parseInt(segment.laps, 10);
      if (
        Number.isNaN(exerciseSeconds) ||
        (segment.useExercise && exerciseSeconds <= 0) ||
        Number.isNaN(restSeconds) ||
        (segment.useRest && restSeconds < 0) ||
        Number.isNaN(setRestSeconds) ||
        (segment.useSetRest && setRestSeconds < 0) ||
        Number.isNaN(laps) ||
        laps <= 0
      ) {
        showError("Durasi harus mm:ss dan lap harus valid.");
        return;
      }
      parsedSegments.push({
        exerciseSeconds,
        restSeconds,
        setRestSeconds,
        laps,
      });
    }

    setIsSaving(true);
    try {
      if (editingTimerId && editingCreatedAt) {
        await timerStore.updateTimer({
          id: editingTimerId,
          name: trimmedName,
          createdAt: editingCreatedAt,
          leadInSeconds,
          workoutLaps,
          segments: parsedSegments.map((segment) => ({
            ...segment,
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          })),
        });
      } else {
        await timerStore.createTimer(trimmedName, parsedSegments, leadInSeconds, workoutLaps);
      }
      setTimerName("");
      setSegments([createFormSegment()]);
      setWorkoutLaps(1);
      setEditingTimerId(null);
      setEditingCreatedAt(null);
      showSuccess("Timer latihan tersimpan.");
      if (embedded && onClose) {
        onClose();
      } else {
        router.push("/timers");
      }
    } catch {
      showError("Gagal menyimpan timer. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  const closePanel = () => {
    if (embedded && onClose) {
      onClose();
      return;
    }
    router.push("/timers");
  };

  const secondsToTimeValue = (totalSeconds: number): TimeValue => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: padTime(minutes.toString()),
      seconds: padTime(seconds.toString()),
    };
  };

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const timer = timerStore.timers.find((item) => item.id === editId);
    if (!timer) return;
    setEditingTimerId(timer.id);
    setEditingCreatedAt(timer.createdAt);
    setTimerName(timer.name);
    setWorkoutLaps(Math.max(1, timer.workoutLaps ?? 1));
    const mappedSegments: FormSegment[] = [];
    timer.segments.forEach((segment) => {
      if (segment.exerciseSeconds > 0) {
        const timeValue = secondsToTimeValue(segment.exerciseSeconds);
        mappedSegments.push({
          ...createFormSegment(),
          useExercise: true,
          useRest: false,
          useSetRest: false,
          exerciseMin: timeValue.minutes,
          exerciseSec: timeValue.seconds,
          laps: segment.laps.toString(),
        });
      }
      if (segment.restSeconds > 0) {
        const timeValue = secondsToTimeValue(segment.restSeconds);
        mappedSegments.push({
          ...createFormSegment(),
          useExercise: false,
          useRest: true,
          useSetRest: false,
          restMin: timeValue.minutes,
          restSec: timeValue.seconds,
          laps: segment.laps.toString(),
        });
      }
      if (segment.setRestSeconds > 0) {
        const timeValue = secondsToTimeValue(segment.setRestSeconds);
        mappedSegments.push({
          ...createFormSegment(),
          useExercise: false,
          useRest: false,
          useSetRest: true,
          setRestMin: timeValue.minutes,
          setRestSec: timeValue.seconds,
          laps: segment.laps.toString(),
        });
      }
    });
    setSegments(mappedSegments.length ? mappedSegments : [createFormSegment()]);
  }, [searchParams, timerStore.timers]);

  return (
    <div className="fixed inset-0 z-50 flex bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="flex h-full w-full flex-col overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-5 pb-40 pt-5 text-slate-900">
          <form onSubmit={handleSaveTimer} className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closePanel}
                className="text-slate-600"
              >
                <ArrowLeftIcon className="size-5" />
              </Button>
              <Button type="submit" variant="ghost" className="text-slate-700" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-400/90 text-white shadow">
                <TimerIcon className="size-6" />
              </div>
              <Input
                id="timer-name"
                placeholder="Workout Title"
                value={timerName}
                onChange={(event) => setTimerName(event.target.value)}
                className="mt-4 h-10 w-full max-w-xs border-0 border-b border-slate-200 text-center text-2xl font-semibold text-slate-800 shadow-none focus-visible:ring-0"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Calories</p>
                <p className="text-xl font-semibold text-slate-800">0</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                <p className="text-xl font-semibold text-slate-800">
                  {secondsToClock(totalQueues.duration)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Exercises</p>
                <p className="text-xl font-semibold text-slate-800">
                  {segments.filter((segment) => segment.useExercise || segment.useRest || segment.useSetRest).length}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Enter description
            </div>


            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Exercises</p>
              </div>

              {segments.filter((segment) => segment.useExercise || segment.useRest || segment.useSetRest).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500">
                  Add your first exercise interval
                </div>
              ) : (
                <div className="space-y-3">
                  {segments
                    .filter((segment) => segment.useExercise || segment.useRest || segment.useSetRest)
                    .map((segment, index) => {
                      const type: SegmentType = segment.useExercise
                        ? "exercise"
                        : segment.useRest
                          ? "rest"
                          : "setRest";
                      const durationSecondsRaw =
                        type === "exercise"
                          ? parseTime(segment.exerciseMin, segment.exerciseSec)
                          : type === "rest"
                            ? parseTime(segment.restMin, segment.restSec)
                            : parseTime(segment.setRestMin, segment.setRestSec);
                      const durationSeconds = Number.isNaN(durationSecondsRaw) ? 0 : durationSecondsRaw;
                      const label =
                        type === "exercise"
                          ? "Interval"
                          : type === "rest"
                            ? "Break"
                            : "Rest per set";
                      return (
                        <div
                          key={segment.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              className="flex min-w-0 items-center gap-3 text-left"
                              onClick={() => openEditor("edit", type, segment)}
                            >
                              <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <TimerIcon className="size-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800">
                                  {label} {index + 1}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                  {type}
                                </p>
                              </div>
                            </button>
                            <div className="ml-auto hidden sm:block">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditor("edit", type, segment)}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="flex flex-wrap justify-between items-center gap-2 sm:justify-end">
                              <span className="rounded-full bg-rose-500/90 px-3 py-1 text-xs font-semibold text-white">
                                {secondsToLabel(durationSeconds)}
                              </span>
                              <div className="flex items-center gap-1 text-slate-600">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateSegment(segment.id, {
                                      laps: Math.max(1, Number.parseInt(segment.laps, 10) - 1).toString(),
                                    })
                                  }
                                >
                                  <MinusIcon className="size-4" />
                                </Button>
                                <span className="text-sm font-semibold">x {segment.laps}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateSegment(segment.id, {
                                      laps: (Number.parseInt(segment.laps, 10) + 1).toString(),
                                    })
                                  }
                                >
                                  <PlusIcon className="size-4" />
                                </Button>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-slate-500 hover:text-red-600"
                                onClick={() => removeSegment(segment.id)}
                                aria-label="Hapus segmen"
                              >
                                <Trash2Icon className="size-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Global lap</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setWorkoutLaps((prev) => Math.max(1, prev - 1))}
                >
                  <MinusIcon className="size-4" />
                </Button>
                <span className="text-lg font-semibold">x {workoutLaps}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setWorkoutLaps((prev) => prev + 1)}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 mb-96">
              <div className="flex items-center gap-2">
                <HourglassIcon className="size-4" />
                <span>
                  Total lap: <strong>{totalQueues.laps}</strong> • Estimasi durasi:{" "}
                  <strong>{secondsToLabel(totalQueues.duration)}</strong>
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="fixed bottom-7 right-6 z-40">
        <div
          className={`pointer-events-none absolute bottom-16 right-0 flex flex-col items-end gap-2 transition-all duration-300 ${
            isFabOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <Button
            type="button"
            className="pointer-events-auto rounded-full bg-amber-500 text-white shadow"
            onClick={() => openEditor("add", "exercise")}
          >
            Add Exercise
          </Button>
          <Button
            type="button"
            className="pointer-events-auto rounded-full bg-amber-500 text-white shadow"
            onClick={() => openEditor("add", "rest")}
          >
            Add Break
          </Button>
        </div>
        <Button
          type="button"
          size="icon"
          className="h-14 w-14 rounded-full bg-amber-500 text-white shadow-lg transition-transform duration-300"
          onClick={() => setIsFabOpen((prev) => !prev)}
          aria-label="Tambah"
        >
          {isFabOpen ? <XIcon className="size-6" /> : <PlusIcon className="size-6" />}
        </Button>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
          <div className="w-full rounded-t-[32px] bg-white px-6 pb-10 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">
                {editorMode === "add" ? "Add Interval" : "Edit Interval"}
              </p>
              <Button variant="ghost" size="icon" onClick={closeEditor}>
                <XIcon className="size-5" />
              </Button>
            </div>
            <div className="mt-6 space-y-5 text-center">
              <TimeInput
                label="Durasi"
                value={editorTime}
                onChange={setEditorTime}
                size="large"
                autoFocus={isEditorOpen}
                align="center"
              />
              <div>
                <Label className="text-xs uppercase text-slate-500">Lap</Label>
                <div className="mt-2 flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setEditorLaps((prev) => Math.max(1, Number.parseInt(prev || "1", 10) - 1).toString())
                    }
                  >
                    <MinusIcon className="size-4" />
                  </Button>
                  <span className="text-lg font-semibold">x {editorLaps}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setEditorLaps((prev) => (Number.parseInt(prev || "1", 10) + 1).toString())
                    }
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1" onClick={saveEditor}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseTimerForm;
