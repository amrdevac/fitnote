"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ChevronDown, LayersIcon, Repeat2Icon, ScaleIcon, TimerIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import type { WorkoutMovement } from "@/types/workout";

function formatDate(dateIso: string) {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
  return formatter.format(new Date(dateIso));
}

type ActiveMovement = {
  movement: WorkoutMovement;
  sessionLabel: string;
};

const sheetAnimationDuration = 220;
const sheetCloseThreshold = 70;
const sheetExpandThreshold = 25;
const halfSheetHeight = 0.5;

const MobileWorkoutHome = () => {
  const workoutSession = useWorkoutSession();
  const router = useRouter();
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [activeMovement, setActiveMovement] = useState<ActiveMovement | null>(null);
  const [sheetDragStart, setSheetDragStart] = useState<number | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetMounted, setIsSheetMounted] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<"half" | "full">("half");
  const sheetAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (sheetAnimationTimeout.current) {
        clearTimeout(sheetAnimationTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !isSheetMounted) return;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    const previousTouchAction = style.touchAction;
    style.overflow = "hidden";
    style.touchAction = "none";
    return () => {
      style.overflow = previousOverflow;
      style.touchAction = previousTouchAction;
    };
  }, [isSheetMounted]);

  const openBuilder = () => {
    router.push("/builder");
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    swipeStartX.current = touch?.clientX ?? null;
    swipeStartY.current = touch?.clientY ?? null;
    setIsSwiping(false);
    setSwipeOffset(0);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (swipeStartX.current === null) return;
    const currentX = event.touches[0]?.clientX ?? 0;
    const currentY = event.touches[0]?.clientY ?? 0;
    const deltaX = swipeStartX.current - currentX;
    const deltaY = (swipeStartY.current ?? currentY) - currentY;

    if (!isSwiping) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        setIsSwiping(true);
      } else {
        return;
      }
    }

    setSwipeOffset(Math.max(0, deltaX));
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!isSwiping || swipeStartX.current === null) {
      swipeStartX.current = null;
      swipeStartY.current = null;
      setSwipeOffset(0);
      setIsSwiping(false);
      return;
    }
    if (swipeStartX.current === null) return;
    const delta = swipeStartX.current - (event.changedTouches[0]?.clientX ?? 0);
    if (delta > 80) {
      setSwipeOffset(80);
      openBuilder();
    } else {
      setSwipeOffset(0);
    }
    swipeStartX.current = null;
    setIsSwiping(false);
  }

  const clearSheetTimeout = () => {
    if (sheetAnimationTimeout.current) {
      clearTimeout(sheetAnimationTimeout.current);
      sheetAnimationTimeout.current = null;
    }
  };

  const openMovementSheet = (movement: WorkoutMovement, sessionLabel: string) => {
    clearSheetTimeout();
    setActiveMovement({ movement, sessionLabel });
    setSheetDragOffset(0);
    setSheetDragStart(null);
    setSheetSnap("half");
    setIsSheetMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsSheetVisible(true));
    });
  };

  const closeMovementSheet = () => {
    if (!isSheetMounted) return;
    setSheetDragOffset(0);
    setSheetDragStart(null);
    setIsSheetVisible(false);
    clearSheetTimeout();
    sheetAnimationTimeout.current = setTimeout(() => {
      setIsSheetMounted(false);
      setActiveMovement(null);
      sheetAnimationTimeout.current = null;
    }, sheetAnimationDuration);
  };

  function handleSheetTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!isSheetVisible) return;
    const touch = event.touches[0];
    setSheetDragStart(touch?.clientY ?? null);
  }

  function handleSheetTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (sheetDragStart === null || !isSheetVisible) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = currentY - sheetDragStart;
    event.preventDefault();

    if (sheetSnap === "half" && delta < -sheetExpandThreshold) {
      setSheetSnap("full");
      setSheetDragOffset(0);
      setSheetDragStart(currentY);
      return;
    }

    if (delta > sheetCloseThreshold + (sheetSnap === "full" ? 30 : 0)) {
      setSheetDragStart(null);
      closeMovementSheet();
      return;
    }

    setSheetDragOffset(delta);
  }

  function handleSheetTouchEnd() {
    if (!isSheetVisible) return;
    const threshold = sheetSnap === "half" ? sheetCloseThreshold : sheetCloseThreshold + 30;
    if (sheetSnap === "half" && sheetDragOffset < -sheetExpandThreshold) {
      setSheetSnap("full");
    } else if (sheetDragOffset > threshold) {
      closeMovementSheet();
    }
    setSheetDragOffset(0);
    setSheetDragStart(null);
  }

  const totalMovements = workoutSession.sessions.reduce(
    (acc, session) => acc + session.movements.length,
    0
  );

  return (
    <div
      className="select-none relative z-0 mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 pb-24 overflow-hidden overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehavior: "none" }}
    >
      <div
        className={`flex grow flex-col ${isSwiping ? "" : "transition-transform duration-200"}`}
        style={{ transform: `translateX(${-Math.min(swipeOffset, 80)}px)` }}
      >
        <header className="flex flex-col gap-1 px-5 pb-4 pt-10">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">FitNote</h1>
            <p className="text-sm text-slate-500">
              Catat gerakan dan set lewat halaman form khusus. Geser ke kiri untuk membuka builder.
            </p>
            <p className="text-xs text-slate-400">
              {workoutSession.sessions.length} sesi · {totalMovements} gerakan
            </p>
          </div>
        </header>
        

        <div className="flex flex-1 flex-col gap-4 px-4">
          {workoutSession.sessions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
              Catatan masih kosong. Tap tombol tambah atau swipe ke kiri untuk memulai.
            </div>
          )}

          {workoutSession.sessions
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((session) => {
              const isExpanded = expandedSessions.has(session.id);
              const sessionLabel = formatDate(session.createdAt);
              const totalSets = session.movements.reduce(
                (acc, movement) => acc + movement.sets.length,
                0
              );
              return (
                <Card key={session.id} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{sessionLabel}</CardTitle>
                        <CardDescription>
                          {session.movements.length} gerakan · {totalSets} set
                        </CardDescription>
                      </div>

                    </div>
                  </CardHeader>
                  <div className="relative px-4 pb-4">
                    <div
                      className={`space-y-3 overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[600px] opacity-100" : "max-h-[140px] opacity-80"
                        }`}
                    >
                      {session.movements.map((movement) => {
                        const totalReps = movement.sets.reduce((acc, set) => acc + set.reps, 0);
                        const totalRest = movement.sets.reduce((acc, set) => acc + set.rest, 0);
                        const consistentWeight = movement.sets.every(
                          (set) => set.weight === movement.sets[0]?.weight
                        );
                        const minWeight = movement.sets.reduce(
                          (min, set) => Math.min(min, set.weight),
                          movement.sets[0]?.weight ?? 0
                        );
                        const maxWeight = movement.sets.reduce(
                          (max, set) => Math.max(max, set.weight),
                          movement.sets[0]?.weight ?? 0
                        );
                        const showLevelUp = movement.sets.length >= 4 && consistentWeight;

                        const weightRangeLabel = consistentWeight
                          ? `${minWeight}kg`
                          : `${minWeight}-${maxWeight}kg`;

                        const summaryItems = [
                          { label: "Set", value: movement.sets.length, icon: LayersIcon },
                          { label: "Reps", value: totalReps, icon: Repeat2Icon },
                          { label: "Beban", value: weightRangeLabel, icon: ScaleIcon },
                          { label: "Rest", value: `${totalRest} dtk`, icon: TimerIcon },
                        ];

                        const handleMovementClick = () => openMovementSheet(movement, sessionLabel);

                        return (
                          <div
                            key={movement.id}
                            className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-transform duration-150 active:scale-95"
                            role="button"
                            tabIndex={0}
                            onClick={handleMovementClick}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleMovementClick();
                              }
                            }}
                          >
                            <p className="text-sm font-medium">{movement.name}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                              {summaryItems.map(({ label, value, icon: Icon }) => (
                                <div
                                  key={label}
                                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2"
                                >
                                  <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <Icon className="size-4" />
                                  </div>
                                  <div className="leading-tight">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      {label}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700">{value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {showLevelUp && (
                              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-700">
                                  ↑
                                </span>
                                Level Up
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!isExpanded && (
                      <div className="pointer-events-none absolute inset-x-4 bottom-12 h-32 bg-gradient-to-t from-white to-transparent" />
                    )}
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-600"
                        onClick={() => toggleSession(session.id)}
                      >
                        {isExpanded ? "Tutup ringkasan" : "Lihat detail"}{" "}
                        <ChevronDown
                          className={`ml-1 size-4 transition-transform ${isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                        />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

        </div>
      </div>

      <div className="fixed bottom-5 right-0 justify-end pb-6 pr-6">
          <div className="pointer-events-auto">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-slate-900 text-white shadow-[0_20px_40px_rgba(15,23,42,0.25)]"
              onClick={openBuilder}
            >
              <PlusIcon className="size-6" />
            </Button>
          </div>
        </div>

      {isSheetMounted && activeMovement && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isSheetVisible ? "opacity-100" : "opacity-0"}`}
          onClick={closeMovementSheet}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full rounded-t-3xl bg-white px-5 pb-8 pt-1 shadow-2xl transition-all duration-300"
            style={{
              transform: `translateY(calc(${isSheetVisible ? "0%" : "100%"} + ${sheetDragOffset}px))`,
              height: sheetSnap === "full" ? "85vh" : "55vh",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 bg-white pb-3"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="mx-auto mb-3 mt-2 h-1.5 w-12 rounded-full bg-slate-200" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {activeMovement.sessionLabel}
              </p>
              <p className="text-lg font-semibold text-slate-900">{activeMovement.movement.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                Ketuk area ini atau tombol bawah untuk menutup.
              </p>
            </div>
            <div
              className="overflow-y-auto pb-4 transition-all duration-300"
              style={{ maxHeight: sheetSnap === "full" ? "65vh" : "35vh" }}
            >
              <div className="space-y-3">
                {activeMovement.movement.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Set {index + 1}
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{set.weight}kg</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{set.reps} reps</p>
                      <p>{set.rest} dtk istirahat</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="outline" className="mt-2 w-full" onClick={closeMovementSheet}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileWorkoutHome;
