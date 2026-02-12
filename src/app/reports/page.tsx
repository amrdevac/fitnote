"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import BottomNav from "@/components/shared/BottomNav";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import type { WorkoutMovement } from "@/types/workout";
import { CalendarDays, ChartArea, MedalIcon, Repeat, TrendingUp } from "lucide-react";
import MovementChart from "@/components/charts/MovementChart";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return formatter.format(new Date(dateIso));
};

const formatSessionLabel = (dateIso: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
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
  const [rangeMode, setRangeMode] = useState<"today" | "7d" | "20d" | "1m" | "3m" | "custom">(
    "7d"
  );
  const [startDate, setStartDate] = useState(() =>
    formatDateInput(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000))
  );
  const [endDate, setEndDate] = useState(() => formatDateInput(today));
  const [activeMovementName, setActiveMovementName] = useState<string | null>(null);
  const [movementFilter, setMovementFilter] = useState("");
  const [activeMovementSession, setActiveMovementSession] = useState<{
    movement: WorkoutMovement;
    sessionLabel: string;
  } | null>(null);
  const showMovementPicker = !activeMovementName;
  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    reps: true,
    rest: true,
  });
  const [isSheetMounted, setIsSheetMounted] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [sheetDragStart, setSheetDragStart] = useState<number | null>(null);
  const sheetAnimationDuration = 260;
  const sheetCloseThreshold = 120;
  const cardsScrollerRef = useRef<HTMLDivElement | null>(null);
  const summarySectionRef = useRef<HTMLDivElement | null>(null);
  const bestLiftScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [shouldScrollToSummary, setShouldScrollToSummary] = useState(false);
  const [bestLiftIndex, setBestLiftIndex] = useState(0);

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

  const topStats = useMemo(() => {
    const windowEnd = new Date();
    const windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - 29);

    const movementMap = new Map<string, MovementStat>();

    workoutSession.sessions
      .filter((session) => !session.archivedAt)
      .forEach((session) => {
        const createdAt = new Date(session.createdAt);
        if (createdAt < windowStart || createdAt > windowEnd) return;
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
          });
          movementMap.set(movement.name, existing);
        });
      });

    const movementStats = Array.from(movementMap.values()).sort(
      (a, b) => b.totalSets - a.totalSets
    );
    return { movementStats, windowStart, windowEnd };
  }, [workoutSession.sessions]);

  const podium = useMemo(() => topStats.movementStats.slice(0, 3), [topStats.movementStats]);

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
        if (set.weight > recordWeight) {
          recordWeight = set.weight;
          recordReps = set.reps;
        } else if (set.weight === recordWeight) {
          recordReps = Math.max(recordReps, set.reps);
        }
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

  useEffect(() => {
    if (rangeMode === "custom") return;
    const now = new Date();
    let start: Date;
    if (rangeMode === "today") {
      start = new Date(now);
    } else if (rangeMode === "7d") {
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (rangeMode === "20d") {
      start = new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000);
    } else if (rangeMode === "1m") {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
    } else {
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
    }
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(now));
  }, [rangeMode]);

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

  const cardCount = activeMovementName && activeMovementSummary ? (timeline ? 2 : 1) : 0;
  const bestLiftCards = useMemo(() => {
    if (!topStats.movementStats.length) return [];
    return topStats.movementStats
      .slice()
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 3);
  }, [topStats.movementStats]);
  const bestLiftCount = bestLiftCards.length || 1;

  useEffect(() => {
    const node = cardsScrollerRef.current;
    if (!node || cardCount <= 1) return;
    const handleScroll = () => {
      const children = Array.from(node.children) as HTMLElement[];
      if (!children.length) return;
      const current = node.scrollLeft;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      children.forEach((child, index) => {
        const distance = Math.abs(child.offsetLeft - current);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      setActiveCardIndex(bestIndex);
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [cardCount]);

  useEffect(() => {
    const node = bestLiftScrollerRef.current;
    if (!node || bestLiftCount <= 1) return;
    const handleScroll = () => {
      const children = Array.from(node.children) as HTMLElement[];
      if (!children.length) return;
      const current = node.scrollLeft;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      children.forEach((child, index) => {
        const distance = Math.abs(child.offsetLeft - current);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      setBestLiftIndex(bestIndex);
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [bestLiftCount]);

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

  useEffect(() => {
    if (!shouldScrollToSummary || !activeMovementName) return;
    const node = summarySectionRef.current;
    if (node) {
      requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToSummary(false);
      });
    } else {
      setShouldScrollToSummary(false);
    }
  }, [activeMovementName, shouldScrollToSummary]);


  return (
    <div
      className="min-h-dvh bg-slate-50 pb-24"
      style={{ background: "linear-gradient(180deg, #F1FBF6 0%, #FFFFFF 40%)" }}
    >
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-10 pt-8">
        <PageHeader title="Laporan" />

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md px-5 report-fade-up report-delay-1">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              Top Exercises
            </p>
            {podium.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-400">No data yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-3 items-end gap-3">
                {[podium[1], podium[0], podium[2]].map((item, index) => {
                  if (!item) return <div key={`empty-${index}`} />;
                  const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
                  const heights = ["h-30", "h-44", "h-26"];
                  const cardStyles = [
                    "bg-slate-900 text-white",
                    "bg-indigo-600 text-white",
                    "bg-slate-200 text-slate-600",
                  ];
                  const offsets = ["", "translate-y-4", ""];
                  const trophyColors = [
                    "text-amber-400",
                    "text-slate-400",
                    "text-amber-700",
                  ];
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className="flex flex-col items-center  transition-transform active:scale-[0.94]"
                      onClick={() => {
                        setActiveMovementName(item.name);
                        setShouldScrollToSummary(true);
                      }}
                    >
                      <MedalIcon className={`size-4 ${trophyColors[rank - 1]}`} />

                      <div
                        className={`flex w-full flex-col items-center justify-center rounded-4xl ${heights[index]} ${cardStyles[index]} ${offsets[index]} px-2 py
                        -3`}
                      >
                        <span className={cn("text-[10px]", rank == 3 ? "text-slate-900" : "text-white")}>
                          #{rank}
                        </span>

                        <span className="text-center text-[9px] font-semibold uppercase text">
                          {item.name}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-semibold text-slate-500 ${rank === 1 ? "translate-y-4" : ""
                          }`}
                      >
                        {item.totalSets} sets
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div
            ref={bestLiftScrollerRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 px-4 pt-4 report-fade-up report-delay-2"
          >
            {bestLiftCards.map((movement, index) => (
              <div
                key={`${movement.name}-${index}`}
                className={cn(
                  "relative min-w-[80%] snap-center overflow-hidden rounded-md bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700 px-5 py-4 text-white transition-transform duration-300",
                  bestLiftIndex === index ? "scale-[1.06] z-10" : "scale-[0.98]"
                )}
              >
                <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-slate-950/20 blur-2xl" />
                <span className="pointer-events-none absolute -right-6 top-2 h-20 w-20 rounded-full bg-white/10" />
                <span className="pointer-events-none absolute right-10 top-10 h-12 w-12 rounded-full bg-white/15" />
                <span className="pointer-events-none absolute -bottom-6 right-2 h-24 w-24 rounded-full bg-white/10" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-100">
                  Personal best lift
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-semibold">{movement.maxWeight}</span>
                  <span className="pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                    kg
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-indigo-100">
                  <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold text-white">
                    {movement.name}
                  </span>
                  <span>Set {movement.maxSetIndex}</span>
                  <span>•</span>
                  <span>{formatDayLabel(movement.maxDate)}</span>
                </div>
              </div>
            ))}
            {bestLiftCards.length === 0 && (
              <div className="min-w-[80%] snap-start rounded-md bg-slate-100 px-5 py-6 text-sm text-slate-400">
                No data yet.
              </div>
            )}
          </div>
          {bestLiftCount > 1 && (
            <div className="mt-2 flex items-center justify-center gap-2">
              {Array.from({ length: bestLiftCount }).map((_, index) => (
                <span
                  key={`bestlift-dot-${index}`}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    bestLiftIndex === index ? "bg-slate-900" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_18px_40px_rgba(79,70,229,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Timeframe
          </p>
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <label className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <CalendarDays className="size-4 text-indigo-500" />
              </div>
              <div className="flex-1">
                <select
                  className="w-full appearance-none bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                  value={rangeMode}
                  onChange={(event) =>
                    setRangeMode(
                      event.target.value as "today" | "7d" | "20d" | "1m" | "3m" | "custom"
                    )
                  }
                >
                  <option value="today">Hari ini</option>
                  <option value="7d">7 days</option>
                  <option value="20d">20 days</option>
                  <option value="1m">1 month</option>
                  <option value="3m">3 months</option>
                  <option value="custom">Rentang tanggal</option>
                </select>
              </div>
              <Repeat className="size-4 text-indigo-400" />
            </label>
          </div>
          {rangeMode === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-500">
                Mulai
                <input
                  type="date"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Selesai
                <input
                  type="date"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Active streak: {stats.totalSessions} sessions
          </div>
        </section>

        <section className=" top-0 z-20 rounded-2xl bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Exercise details
            </p>
            {activeMovementName && (
              <button
                type="button"
                onClick={() => {
                  setActiveMovementName(null);
                  setMovementFilter("");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                ×
              </button>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <TrendingUp className="size-4 text-indigo-500" />
              </div>
              <input
                className="w-full bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                placeholder="Start typing a movement..."
                value={movementFilter || activeMovementName || ""}
                onChange={(event) => {
                  setMovementFilter(event.target.value);
                  setActiveMovementName(null);
                }}
              />
            </div>
            {movementFilter && (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl">
                {filteredMovementOptions.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">
                    Gerakan tidak ditemukan.
                  </p>
                )}
                {filteredMovementOptions.map((movement) => (
                  <button
                    type="button"
                    key={movement.id}
                    className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50"
                    onClick={() => {
                      setActiveMovementName(movement.name);
                      setMovementFilter("");
                    }}
                  >
                    <span className="block font-medium text-slate-900">{movement.name}</span>
                    <span className="text-[9px] text-slate-500">
                      {movement.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {activeMovementName && activeMovementSummary && (
          <section ref={summarySectionRef} className="space-y-3">
            {cardCount > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: cardCount }).map((_, index) => (
                  <span
                    key={`card-dot-${index}`}
                    className={`h-1.5 w-1.5 rounded-full transition ${activeCardIndex === index ? "bg-slate-900" : "bg-slate-300"
                      }`}
                  />
                ))}
              </div>
            )}
            <div
              ref={cardsScrollerRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 px-2 py-2"
            >
              <section className="min-w-[96%] snap-center rounded-md   shadow-[0_18px_25px_rgba(79,70,229,0.18)] bg-white p-5 ">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Summary
                </p>
                {activeMovementSummary.totalSessions === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No data for this movement in the selected date range.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-md bg-indigo-500 text-white px-3 py-1">
                        {activeMovementSummary.totalSessions} sessions
                      </span>
                      <span className="rounded-md bg-indigo-500 text-white px-3 py-1">
                        {activeMovementSummary.totalSets} set
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 sm:grid-cols-2">
                      <div className="rounded-md border w-full bg-gradient-to-br  from-indigo-600 via-indigo-500 to-indigo-700  text-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-white flex items-center  gap-2"><TrendingUp size={15} />Max</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {activeMovementSummary.recordWeight}kg
                        </p>
                      </div>
                      <div className="rounded-md border w-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700  text-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-white flex items-center  gap-2"><Repeat size={15} />Max</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {activeMovementSummary.recordReps} reps
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Workout days
                      </p>
                      <div className="mt-3 max-h-44  w-full space-y-3 overflow-y-auto ">
                        {activeMovementSummary.sessions.map((session) => (
                          <button
                            key={session.sessionId}
                            type="button"
                            className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 w-full"
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

              {timeline && (
                <section className="min-w-[96%] snap-center rounded-md  shadow-[10px_18px_25px_rgba(79,70,229,0.18)] p-5 ">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2">
                    <ChartArea /> Chart
                    {/* {activeMovementName} */}
                  </p>
                  <MovementChart
                    points={timeline.points.map((point, index) => ({
                      index: index + 1,
                      weight: point.weight,
                      reps: point.reps,
                      rest: point.rest,
                    }))}
                    visibleLines={visibleLines}
                    onToggleLine={(key) =>
                      setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    showLegend
                    showPointLabels
                  />
                </section>
              )}
            </div>
            <p className="text-center text-[10px] text-slate-400">Swipe sideways to view other cards.</p>
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
                className="relative z-10 flex w-full flex-col rounded-t-md bg-white px-6 pb-8 pt-4 shadow-[0_-20px_60px_rgba(15,23,42,0.25)] transition-transform duration-300"
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
                        className="flex items-center justify-between rounded-md border border-white/60 px-5 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
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
                          <p className="text-[11px] text-slate-400">{set.rest} sec rest</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={closeMovementSessionSheet}
                  className="mt-2 flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_6px_19px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                >
                  Tutup
                </button>
              </div>
            </div>,
            document.body
          )}
      </main>
      <BottomNav />
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
