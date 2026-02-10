"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import type { WorkoutMovement } from "@/types/workout";
import { ChartArea, MedalIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createPortal } from "react-dom";

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string, endOfDay = false) => {
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDayLabel = (dateIso: string) => {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return formatter.format(new Date(dateIso));
};

const formatSessionLabel = (dateIso: string) => {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(new Date(dateIso));
};

const setCardColors = ["#E5EEFF", "#FFE7EE", "#E8FBEF", "#FFF6DA", "#F1EAFF"];

type MovementStat = {
  name: string;
  totalSets: number;
  totalReps: number;
  maxWeight: number;
  maxSetIndex: number;
  maxSetReps: number;
  maxSetRest: number;
  maxDate: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const workoutSession = useWorkoutSession();
  const today = new Date();
  const [startDate, setStartDate] = useState(() =>
    formatDateInput(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000))
  );
  const [endDate, setEndDate] = useState(() => formatDateInput(today));
  const [activeMovementName, setActiveMovementName] = useState<string | null>(null);
  const [movementFilter, setMovementFilter] = useState("");
  const [activeMovementSession, setActiveMovementSession] = useState<{
    movement: WorkoutMovement;
    sessionLabel: string;
  } | null>(null);
  const [isSheetMounted, setIsSheetMounted] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [sheetDragStart, setSheetDragStart] = useState<number | null>(null);
  const sheetAnimationDuration = 260;
  const sheetCloseThreshold = 120;

  const stats = useMemo(() => {
    const start = parseLocalDate(startDate, false);
    const end = parseLocalDate(endDate, true);
    if (!start || !end || start > end) {
      return {
        movementStats: [] as MovementStat[],
        totalSessions: 0,
        mostFrequent: null as MovementStat | null,
        heaviestOverall: null as {
          name: string;
          weight: number;
          reps: number;
          rest: number;
          setIndex: number;
          date: string;
        } | null,
      };
    }

    const movementMap = new Map<string, MovementStat>();
    let totalSessions = 0;
    let heaviestOverall: {
      name: string;
      weight: number;
      reps: number;
      rest: number;
      setIndex: number;
      date: string;
    } | null = null;

    workoutSession.sessions
      .filter((session) => !session.archivedAt)
      .forEach((session) => {
        const createdAt = new Date(session.createdAt);
        if (createdAt < start || createdAt > end) return;
        totalSessions += 1;
        session.movements.forEach((movement) => {
          const existing = movementMap.get(movement.name) ?? {
            name: movement.name,
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0,
            maxSetIndex: 0,
            maxSetReps: 0,
            maxSetRest: 0,
            maxDate: "",
          };
          movement.sets.forEach((set, index) => {
            existing.totalSets += 1;
            existing.totalReps += set.reps;
            if (set.weight > existing.maxWeight) {
              existing.maxWeight = set.weight;
              existing.maxSetIndex = index + 1;
              existing.maxSetReps = set.reps;
              existing.maxSetRest = set.rest;
              existing.maxDate = session.createdAt;
            }
            if (!heaviestOverall || set.weight > heaviestOverall.weight) {
              heaviestOverall = {
                name: movement.name,
                weight: set.weight,
                reps: set.reps,
                rest: set.rest,
                setIndex: index + 1,
                date: session.createdAt,
              };
            }
          });
          movementMap.set(movement.name, existing);
        });
      });

    const movementStats = Array.from(movementMap.values()).sort(
      (a, b) => b.totalSets - a.totalSets
    );
    const mostFrequent = movementStats[0] ?? null;

    return { movementStats, totalSessions, mostFrequent, heaviestOverall, start, end };
  }, [workoutSession.sessions, startDate, endDate]);

  const podium = useMemo(() => stats.movementStats.slice(0, 3), [stats.movementStats]);

  const filteredMovementOptions = useMemo(() => {
    const query = movementFilter.trim().toLowerCase();
    if (!query) return workoutSession.movementLibrary;
    return workoutSession.movementLibrary.filter((movement) =>
      movement.name.toLowerCase().includes(query)
    );
  }, [movementFilter, workoutSession.movementLibrary]);

  const activeMovementSummary = useMemo(() => {
    if (!activeMovementName || !stats.start || !stats.end) return null;
    const sessionsInRange = workoutSession.sessions.filter((session) => {
      if (session.archivedAt) return false;
      const createdAt = new Date(session.createdAt);
      return createdAt >= stats.start! && createdAt <= stats.end!;
    });

    const movementSessions = sessionsInRange.flatMap((session) => {
      const movement = session.movements.find(
        (item) => item.name.toLowerCase() === activeMovementName.toLowerCase()
      );
      return movement ? [{ session, movement }] : [];
    });

    if (!movementSessions.length) {
      return {
        days: [] as string[],
        totalSets: 0,
        totalSessions: 0,
        recordWeight: 0,
        recordReps: 0,
        recordSets: 0,
        sessions: [] as { sessionId: string; sessionLabel: string; movement: WorkoutMovement }[],
      };
    }

    const days = Array.from(
      new Set(movementSessions.map((entry) => formatDayLabel(entry.session.createdAt)))
    );

    let recordWeight = 0;
    let recordReps = 0;
    let recordSets = 0;
    let totalSets = 0;

    movementSessions.forEach(({ movement }) => {
      recordSets = Math.max(recordSets, movement.sets.length);
      movement.sets.forEach((set) => {
        totalSets += 1;
        recordWeight = Math.max(recordWeight, set.weight);
        recordReps = Math.max(recordReps, set.reps);
      });
    });

    return {
      days,
      totalSets,
      totalSessions: movementSessions.length,
      recordWeight,
      recordReps,
      recordSets,
      sessions: movementSessions
        .slice()
        .sort((a, b) => (a.session.createdAt < b.session.createdAt ? 1 : -1))
        .map(({ session, movement }) => ({
          sessionId: session.id,
          sessionLabel: formatSessionLabel(session.createdAt),
          movement,
        })),
    };
  }, [activeMovementName, workoutSession.sessions, stats.start, stats.end]);

  const timeline = useMemo(() => {
    if (!activeMovementName || !stats.start || !stats.end) return null;
    const points: {
      date: string;
      weight: number;
      reps: number;
      rest: number;
      setIndex: number;
      sessionIndex: number;
    }[] = [];
    workoutSession.sessions
      .filter((session) => !session.archivedAt)
      .forEach((session) => {
        const createdAt = new Date(session.createdAt);
        if (createdAt < stats.start || createdAt > stats.end) return;
        const movement = session.movements.find(
          (item) => item.name.toLowerCase() === activeMovementName.toLowerCase()
        );
        if (!movement) return;
        movement.sets.forEach((set, index) => {
          points.push({
            date: session.createdAt,
            weight: set.weight,
            reps: set.reps,
            rest: set.rest,
            setIndex: index + 1,
            sessionIndex: points.length + 1,
          });
        });
      });
    points.sort((a, b) => (a.date < b.date ? -1 : 1));
    if (points.length === 0) return null;
    const weights = points.map((point) => point.weight);
    const reps = points.map((point) => point.reps);
    const rests = points.map((point) => point.rest);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const minReps = Math.min(...reps);
    const maxReps = Math.max(...reps);
    const minRest = Math.min(...rests);
    const maxRest = Math.max(...rests);
    const spanDays = Math.max(
      1,
      Math.ceil((stats.end.getTime() - stats.start.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      points,
      min,
      max,
      minReps,
      maxReps,
      minRest,
      maxRest,
      spanDays,
      sessions: points.length,
    };
  }, [activeMovementName, workoutSession.sessions, stats.start, stats.end]);

  const openMovementSessionSheet = (movement: WorkoutMovement, sessionLabel: string) => {
    setActiveMovementSession({ movement, sessionLabel });
    setSheetDragOffset(0);
    setSheetDragStart(null);
    setIsSheetMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsSheetVisible(true));
    });
  };

  const closeMovementSessionSheet = () => {
    if (!isSheetMounted) return;
    setSheetDragOffset(0);
    setSheetDragStart(null);
    setIsSheetVisible(false);
    setTimeout(() => {
      setIsSheetMounted(false);
      setActiveMovementSession(null);
    }, sheetAnimationDuration);
  };

  const handleSheetTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isSheetVisible) return;
    const touch = event.touches[0];
    setSheetDragStart(touch?.clientY ?? null);
  };

  const handleSheetTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (sheetDragStart === null || !isSheetVisible) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = currentY - sheetDragStart;
    if (delta <= 0) return;
    event.preventDefault();
    setSheetDragOffset(delta);
    if (delta > sheetCloseThreshold) {
      setSheetDragStart(null);
      closeMovementSessionSheet();
    }
  };

  const handleSheetTouchEnd = () => {
    if (!isSheetVisible) return;
    if (sheetDragOffset > sheetCloseThreshold) {
      closeMovementSessionSheet();
      return;
    }
    setSheetDragOffset(0);
    setSheetDragStart(null);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isSheetMounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSheetMounted]);

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-10 pt-8">
        <PageHeader title="Laporan" onBack={() => router.push("/")} backPosition="left" />

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Rentang tanggal
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-500">
              Mulai
              <input
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Selesai
              <input
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Total sesi: {stats.totalSessions}
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Exercise paling sering
            </p>
            {podium.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Belum ada data.</p>
            ) : (
              <div className="mt-4 grid grid-cols-3 items-end gap-3">
                {[podium[1], podium[0], podium[2]].map((item, index) => {
                  if (!item) return <div key={`empty-${index}`} />;
                  const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
                  const heights = ["h-20", "h-24", "h-16"];
                  const bg = [
                    "bg-slate-900 text-white",
                    "bg-indigo-600 text-white",
                    "bg-slate-200 text-slate-700",
                  ];
                  return (
                    <div key={item.name} className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <MedalIcon
                          className={`size-4 ${
                            rank === 1
                              ? "text-amber-500"
                              : rank === 2
                                ? "text-slate-400"
                                : "text-orange-700"
                          }`}
                        />
                        <span>#{rank}</span>
                      </div>
                      <div className={`flex w-full items-end justify-center rounded-2xl ${heights[index]} ${bg[index]}`}>
                        <div className="flex w-full flex-col items-center gap-1 px-2 py-2 text-center text-[10px] font-semibold uppercase">
                          <span className="block w-full truncate">{item.name}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400">{item.totalSets} set</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Beban paling berat
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {stats.heaviestOverall ? `${stats.heaviestOverall.weight}kg` : "-"}
            </p>
            <p className="text-sm text-slate-500">
              {stats.heaviestOverall
                ? `${stats.heaviestOverall.name} • Set ${stats.heaviestOverall.setIndex}`
                : "Belum ada data"}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Daftar gerakan
          </p>
          <input
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            placeholder="Cari gerakan..."
            value={movementFilter}
            onChange={(event) => setMovementFilter(event.target.value)}
          />
          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {filteredMovementOptions.length === 0 && (
              <p className="text-sm text-slate-400">Gerakan tidak ditemukan.</p>
            )}
            {filteredMovementOptions.map((movement) => (
              <button
                key={movement.id}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  activeMovementName?.toLowerCase() === movement.name.toLowerCase()
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-100 bg-white"
                }`}
                onClick={() => setActiveMovementName(movement.name)}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{movement.name}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {activeMovementName && activeMovementSummary && (
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Detail {activeMovementName}
            </p>
            {activeMovementSummary.totalSessions === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Belum ada data untuk gerakan ini di rentang tanggal.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {activeMovementSummary.totalSessions} sesi
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {activeMovementSummary.totalSets} set
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Rekor beban</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {activeMovementSummary.recordWeight}kg
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Rekor reps</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {activeMovementSummary.recordReps} reps
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Rekor set</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {activeMovementSummary.recordSets} set
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Hari latihan
                  </p>
                  <div className="mt-3 grid gap-3">
                    {activeMovementSummary.sessions.map((session) => (
                      <button
                        key={session.sessionId}
                        type="button"
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                        onClick={() =>
                          openMovementSessionSheet(session.movement, session.sessionLabel)
                        }
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{session.sessionLabel}</p>
                          <p className="text-xs text-slate-500">
                            {session.movement.sets.length} set
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p className="font-semibold text-slate-900">
                            {Math.max(...session.movement.sets.map((set) => set.weight))}kg
                          </p>
                          <p>Max beban</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {timeline && (
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2">
              <ChartArea/> {activeMovementName}
            </p>
            <div className=" px-0">
              <div className=" h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeline.points.map((point, index) => ({
                      index: index + 1,
                      weight: point.weight,
                      reps: point.reps,
                      rest: point.rest,
                      setIndex: point.setIndex,
                    }))}
                    margin={{ top: 20, right: 14, left: 6, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="index" tick={{ fontSize: 9 }} tickMargin={6} padding={{ left: 16, right: 16 }} />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      width={20}
                      tickMargin={10}
                      axisLine={true}
                      padding={{ top: 17, bottom: 6 }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "weight") return [`${value} kg`, "Beban"];
                        if (name === "reps") return [`${value} reps`, "Reps"];
                        return [`${value} dtk`, "Istirahat"];
                      }}
                      labelFormatter={(label) => `Set ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      label={{ position: "top", fontSize: 9, fill: "#4b5563", offset: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="reps"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      label={{ position: "top", fontSize: 9, fill: "#4b5563", offset: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rest"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      label={{ position: "top", fontSize: 9, fill: "#4b5563", offset: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  Beban (kg)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
                  Reps
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
                  Istirahat (dtk)
                </span>
              </div>
            </div>
          </section>
        )}
        {isSheetMounted && activeMovementSession && typeof document !== "undefined" &&
          createPortal(
            <div
              className={`fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/40 transition-opacity duration-300 ${isSheetVisible ? "opacity-100" : "opacity-0"}`}
              onClick={closeMovementSessionSheet}
            >
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 flex w-full flex-col rounded-t-[32px] bg-white px-6 pb-8 pt-4 shadow-[0_-20px_60px_rgba(15,23,42,0.25)] transition-transform duration-300"
                style={{
                  transform: `translateY(calc(${isSheetVisible ? "0%" : "100%"} + ${sheetDragOffset}px))`,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="mb-4"
                  onTouchStart={handleSheetTouchStart}
                  onTouchMove={handleSheetTouchMove}
                  onTouchEnd={handleSheetTouchEnd}
                >
                  <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-200" />
                  <p className="text-xl font-semibold text-slate-900">
                    {activeMovementSession.movement.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{activeMovementSession.sessionLabel}</p>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto pb-4">
                  {activeMovementSession.movement.sets.map((set, index) => {
                    const cardColor = setCardColors[index % setCardColors.length];
                    return (
                      <div
                        key={set.id}
                        className="flex items-center justify-between rounded-[24px] border border-white/60 px-5 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                        style={{ backgroundColor: cardColor }}
                      >
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Set {index + 1}
                          </p>
                          <p className="text-xl font-semibold text-slate-900">{set.weight}kg</p>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <p className="text-sm font-semibold text-slate-700">{set.reps} reps</p>
                          <p className="text-[11px] text-slate-400">{set.rest} dtk istirahat</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={closeMovementSessionSheet}
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_6px_19px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                >
                  Tutup
                </button>
              </div>
            </div>,
            document.body
          )}
      </main>
    </div>
  );
}
