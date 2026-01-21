"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ChangeEvent as ReactChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  ChevronDown,
  LayersIcon,
  Repeat2Icon,
  ScaleIcon,
  TimerIcon,
  CheckIcon,
  CalendarDays,
  LayoutGrid,
  BarChart3,
  User2,
  TrendingUp,
  XIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import type { WorkoutMovement } from "@/types/workout";
import { getDefaultSessionTitle } from "@/lib/sessionTitle";

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
const setCardColors = ["#E5EEFF", "#FFE7EE", "#E8FBEF", "#FFF6DA", "#F1EAFF"];

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
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const sheetAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionTriggeredRef = useRef(false);
  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scrollTargetSession, setScrollTargetSession] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

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
    return () => {
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
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

  const openTimers = () => {
    router.push("/timers");
  };

  const toggleSession = (sessionId: string) => {
    let willExpand = false;
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
        willExpand = true;
      }
      return next;
    });
    if (willExpand) {
      setScrollTargetSession(sessionId);
    }
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

    const clamped = Math.max(Math.min(deltaX, 80), -80);
    setSwipeOffset(clamped);
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
      setSwipeOffset(120);
      setTimeout(() => {
        openBuilder();
      }, 100);
      return;
    } else if (delta < -80) {
      setSwipeOffset(-120);
      setTimeout(() => {
        openTimers();
      }, 100);
      return;
    }
    setSwipeOffset(0);
    swipeStartX.current = null;
    swipeStartY.current = null;
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

  const clearSelectionTimer = () => {
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
    selectionTriggeredRef.current = false;
  };

  const enterSelectionMode = (sessionId: string) => {
    setIsSelectionMode(true);
    setSelectedSessions(new Set([sessionId]));
  };

  const tryStartSelection = (sessionId: string) => {
    if (isSelectionMode) return;
    clearSelectionTimer();
    selectionTimerRef.current = setTimeout(() => {
      selectionTriggeredRef.current = true;
      selectionTimerRef.current = null;
      enterSelectionMode(sessionId);
    }, 350);
  };

  const handleCardPointerDown = (sessionId: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    tryStartSelection(sessionId);
  };

  const handleCardPointerUp = () => {
    if (selectionTimerRef.current) {
      clearSelectionTimer();
      return;
    }
    if (selectionTriggeredRef.current) {
      selectionTriggeredRef.current = false;
    }
  };

  const handleCardPointerLeave = () => {
    if (selectionTimerRef.current) {
      clearSelectionTimer();
      selectionTriggeredRef.current = false;
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedSessions(new Set());
    selectionTriggeredRef.current = false;
  };

  const handleArchiveSelected = async () => {
    if (!selectedSessions.size || isArchiving) return;
    setIsArchiving(true);
    try {
      await workoutSession.archiveSessions([...selectedSessions]);
      exitSelectionMode();
    } finally {
      setIsArchiving(false);
    }
  };

  const visibleSessions = useMemo(
    () => workoutSession.sessions.filter((session) => !session.archivedAt),
    [workoutSession.sessions]
  );

  const totalMovements = visibleSessions.reduce((acc, session) => acc + session.movements.length, 0);

  const clampedSwipeOffset = Math.max(Math.min(swipeOffset, 80), -80);

  useEffect(() => {
    setSelectedSessions((prev) => {
      const next = new Set(
        [...prev].filter((id) => visibleSessions.some((session) => session.id === id))
      );
      if (next.size === prev.size) {
        return prev;
      }
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, [visibleSessions]);

  const containerStyle: CSSProperties = {
    overscrollBehavior: "none",
    paddingTop: isSelectionMode ? "3.5rem" : undefined,
    background: "linear-gradient(180deg, #F1FBF6 0%, #FFFFFF 40%)",
  };

  const sheetLevelUpEligible =
    !!activeMovement &&
    activeMovement.movement.sets.length >= 4 &&
    activeMovement.movement.sets.every(
      (set) => set.weight === activeMovement.movement.sets[0]?.weight
    );

  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (!scrollTargetSession) return;
    const targetId = scrollTargetSession;
    scrollTimeoutRef.current = setTimeout(() => {
      const node = sessionRefs.current[targetId];
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      scrollTimeoutRef.current = null;
      setScrollTargetSession(null);
    }, 220);
  }, [scrollTargetSession]);

  useEffect(() => {
    if (editingSessionId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
      return;
    }
    if (!editingSessionId) {
      titleInputRef.current = null;
    }
  }, [editingSessionId]);

  const startEditingTitle = (sessionId: string, currentTitle: string) => {
    if (isSelectionMode) return;
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleTitleChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setEditingTitle(event.target.value);
  };

  const finishEditingTitleState = () => {
    setEditingSessionId(null);
    setEditingTitle("");
    setIsRenamingTitle(false);
  };

  const commitEditingTitle = async () => {
    if (!editingSessionId || isRenamingTitle) return;
    setIsRenamingTitle(true);
    const result = await workoutSession.renameSession(editingSessionId, editingTitle);
    if (result.success) {
      finishEditingTitleState();
    } else {
      setIsRenamingTitle(false);
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }
  };

  const handleTitleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitEditingTitle();
    }
  };

  const handleTitleBlur = () => {
    void commitEditingTitle();
  };

  return (
    <div
      className="select-none relative z-0 mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50  overflow-hidden overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={containerStyle}
    >
      {isSelectionMode && (
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-slate-900 px-5 py-3 text-white shadow-lg">
          <div>
            <p className="text-sm font-semibold">{selectedSessions.size} dipilih</p>
            <p className="text-[11px] text-slate-200">Tap kartu lain untuk tambah/batal</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-800"
              onClick={exitSelectionMode}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-white text-slate-900 hover:bg-slate-100"
              onClick={handleArchiveSelected}
              disabled={isArchiving || selectedSessions.size === 0}
            >
              Arsip
            </Button>
          </div>
        </div>
      )}
      <div
        className={`flex grow flex-col ${isSwiping ? "" : "transition-transform duration-200"}`}
        style={{ transform: `translateX(${-clampedSwipeOffset}px)` }}
      >
        <header className="px-5 pb-6 pt-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Consistency is key
              </p>
              <h1 className="mt-1 text-4xl font-semibold text-slate-900">Activity</h1>
              <p className="mt-2 text-sm text-slate-500">
                {visibleSessions.length} sesi · {totalMovements} gerakan
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-lg shadow-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              <CalendarDays className="size-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 px-4 overflow-y-auto min-h-0 pb-12">
          {visibleSessions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
              Catatan masih kosong. Tap tombol tambah atau swipe ke kiri untuk memulai.
            </div>
          )}

          {visibleSessions
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((session) => {
              const isExpanded = expandedSessions.has(session.id);
              const isSelected = selectedSessions.has(session.id);
              const sessionLabel = formatDate(session.createdAt);
              const sessionTitle = session.title ?? getDefaultSessionTitle(session.createdAt);
              const isEditingTitle = editingSessionId === session.id;
              const totalSets = session.movements.reduce(
                (acc, movement) => acc + movement.sets.length,
                0
              );
              const accentPalette = ["#fb7185", "#38bdf8", "#a78bfa", "#34d399"];
              const accentColor = accentPalette[session.movements.length % accentPalette.length];
              const totalRestSeconds = session.movements.reduce(
                (restAcc, movement) =>
                  restAcc + movement.sets.reduce((setAcc, set) => setAcc + set.rest, 0),
                0
              );
              const estimatedDuration = Math.max(
                1,
                Math.round(totalRestSeconds / 60) + session.movements.length * 2
              );
              return (
                <Card
                  key={session.id}
                  ref={(node) => {
                    sessionRefs.current[session.id] = node;
                  }}
                  className={`relative scroll-mt-24 rounded-[32px] border-0 bg-white/95 shadow-[0_30px_60px_rgba(15,23,42,0.12)] transition ${isSelected ? "ring-2 ring-slate-900/20" : ""
                    }`}
                  onPointerDown={(event) => handleCardPointerDown(session.id, event)}
                  onPointerUp={handleCardPointerUp}
                  onPointerLeave={handleCardPointerLeave}
                  onPointerCancel={handleCardPointerLeave}
                  onClick={(event) => {
                    if (!isSelectionMode) return;
                    event.stopPropagation();
                    toggleSessionSelection(session.id);
                  }}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  {isSelectionMode && (
                    <div
                      className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border text-white ${isSelected
                        ? "border-slate-900 bg-slate-900"
                        : "border-slate-200 bg-white text-slate-400"
                        }`}
                    >
                      {isSelected && <CheckIcon className="size-4" />}
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between ">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-500">
                          <span className="size-3 rounded-full bg-emerald-400" />
                          Active
                        </div>
                      </div>
                      <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        {session.movements.length} gerakan
                      </div>
                    </div>
                    <div>
                      {isEditingTitle ? (
                        <input
                          ref={(node) => {
                            if (isEditingTitle) {
                              titleInputRef.current = node;
                            }
                          }}
                          type="text"
                          value={editingTitle}
                          onChange={handleTitleChange}
                          onBlur={handleTitleBlur}
                          onKeyDown={handleTitleKeyDown}
                          disabled={isRenamingTitle}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-2xl font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                      ) : (
                        <CardTitle
                          className="mt-2 text-2xl font-semibold"
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            startEditingTitle(session.id, sessionTitle);
                          }}
                        >
                          {sessionTitle}
                        </CardTitle>
                      )}
                      <p className="text-sm text-slate-400">
                        {sessionLabel} · {estimatedDuration} mnt
                      </p>
                    </div>
                  </CardHeader>
                  <div className="relative px-5 pb-6 ">
                    <div
                      className={`space-y-4 transition-all p-1   duration-300 ${isExpanded
                        ? "max-h-[420px] overflow-y-auto pr-1 opacity-100"
                        : "max-h-[220px] overflow-hidden opacity-90"
                        }`}
                    >
                      {session.movements.map((movement, movementIndex) => {
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
                          { label: "Sets", value: movement.sets.length, icon: LayersIcon },
                          { label: "Reps", value: totalReps, icon: Repeat2Icon },
                          { label: "Weight", value: weightRangeLabel, icon: ScaleIcon },
                          { label: "Rest", value: `${totalRest}s`, icon: TimerIcon },
                        ];

                        const handleMovementClick = (
                          event?: ReactMouseEvent<HTMLDivElement>
                        ) => {
                          if (isSelectionMode) {
                            event?.stopPropagation();
                            toggleSessionSelection(session.id);
                            return;
                          }
                          openMovementSheet(movement, sessionLabel);
                        };

                        return (
                          <div
                            key={movement.id}
                            className="cursor-pointer rounded-3xl bg-white/90 p-3  shadow-[0_5px_10px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            role="button"
                            tabIndex={0}
                            onClick={(event) => handleMovementClick(event)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                if (isSelectionMode) {
                                  toggleSessionSelection(session.id);
                                } else {
                                  handleMovementClick();
                                }
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span
                                  className="inline-flex h-10 w-1 rounded-full"
                                  style={{
                                    backgroundColor:
                                      movementIndex === 0 ? "#fb923c" : accentColor,
                                  }}
                                />
                                <p className="text-lg font-semibold text-slate-900">
                                  {movement.name}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
                              {summaryItems.map(({ label, value, icon: Icon }) => (
                                <div
                                  key={label}
                                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                                >
                                  <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-inner">
                                    <Icon className="size-4" />
                                  </div>
                                  <div className="leading-tight">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                      {label}
                                    </p>
                                    <p className="text-base font-semibold text-slate-800">
                                      {value}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {showLevelUp && (
                              <div className="mt-5 rounded-[22px] bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 p-[1px]">
                                <div className="rounded-[22px] bg-gradient-to-r from-indigo-500/80 to-sky-500/80 px-4 py-3 text-xs text-white">
                                  <p className="text-[9px] uppercase tracking-wide text-white/80">
                                    Level up suggestion
                                  </p>
                                  <p className="mt-1 text-sm font-semibold">
                                    Tambah +2.5kg di set berikutnya
                                  </p>
                                  <p className="mt-3 text-[11px] text-white/70">
                                    Konsistensi bikin progres naik.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!isExpanded && (
                      <div className="pointer-events-none absolute inset-x-5 bottom-12 h-24 bg-gradient-to-t from-white to-transparent" />
                    )}
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-600"
                        onClick={(event) => {
                          if (isSelectionMode) {
                            event.preventDefault();
                            toggleSessionSelection(session.id);
                            return;
                          }
                          toggleSession(session.id);
                        }}
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

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-6 pb-8 pt-4">
        <div className="pointer-events-auto absolute right-5 bottom-5">
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-indigo-600 text-white shadow-[0_30px_60px_rgba(79,70,229,0.35)]"
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
            className="relative z-10 flex w-full flex-col rounded-t-[40px] bg-white px-6 pb-10 pt-3 shadow-[0_-20px_60px_rgba(15,23,42,0.25)] transition-all duration-300"
            style={{
              transform: `translateY(calc(${isSheetVisible ? "0%" : "100%"} + ${sheetDragOffset}px))`,
              height: sheetSnap === "full" ? "85vh" : "60vh",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10  pb-5"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="mx-auto mb-4 mt-2 h-1.5 w-16 rounded-full bg-slate-200" />
              <p className=" text-xl font-semibold text-slate-900">
                {activeMovement.movement.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ketuk area ini atau tombol bawah untuk menutup.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 transition-all duration-300">
              <div className="space-y-4">
                {activeMovement.movement.sets.map((set, index) => {
                  const cardColor = setCardColors[index % setCardColors.length];
                  return (
                    <div
                      key={set.id}
                      className="flex items-center justify-between rounded-[28px] border border-white/60 px-5 py-4 shadow-[0_8px_5px_rgba(15,23,42,0.08)]"
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
            </div>
            {sheetLevelUpEligible && (
              <div className="mt-4 rounded-[28px] bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 p-[1px] shadow-[0_20px_40px_rgba(59,130,246,0.3)]">
                <div className="flex items-center gap-3 rounded-[28px] bg-gradient-to-r from-indigo-500/90 to-sky-400/90 px-4 py-3 text-white">
                  <div className="rounded-2xl bg-white/15 p-2">
                    <TrendingUp className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-white/80">
                      Level up suggestion
                    </p>
                    <p className="text-xs font-semibold">Try adding +2.5kg next session</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={closeMovementSheet}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_6px_19px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileWorkoutHome;
