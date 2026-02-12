"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChartArea, CheckCheckIcon, MoreVerticalIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/ui/use-toast";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import preferencesDb, { defaultPreferences } from "@/lib/indexedDb/preferences";
import { useTabataPlayerStore } from "@/store/tabataPlayer";
import PageHeader from "@/components/shared/PageHeader";
import SettingsSheet from "@/components/shared/SettingsSheet";
import ConfirmModal from "@/components/shared/ConfirmModal";
import SetCardList from "@/components/workouts/SetCardList";
import type { WorkoutMovement, WorkoutSession } from "@/types/workout";
import MovementChart from "@/components/charts/MovementChart";

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-300"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"
          }`}
      />
    </button>
  );
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

type WorkoutBuilderProps = {
  onClose?: () => void;
  embedded?: boolean;
};

type MovementSession = {
  session: WorkoutSession;
  movement: WorkoutMovement;
};

const WorkoutBuilder = ({ onClose, embedded = false }: WorkoutBuilderProps) => {
  const router = useRouter();
  const workoutSession = useWorkoutSession();
  const playerStatus = useTabataPlayerStore((state) => state.status);
  const hasPlayer = useTabataPlayerStore((state) => state.queue.length > 0);
  const isPlayerActive = hasPlayer && playerStatus !== "idle";
  const [mounted, setMounted] = useState(false);
  const [panelState, setPanelState] = useState<"enter" | "active" | "exit">("enter");
  useEffect(() => {
    const id = requestAnimationFrame(() => setPanelState("active"));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    setMounted(true);
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

  const closePanel = () => {
    if (panelState === "exit") return;
    setPanelState("exit");
    setTimeout(() => {
      if (onClose) {
        onClose();
        return;
      }
      router.back();
    }, 250);
  };

  const swipeStartX = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const swipeAnimationRef = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);

  const applySwipeProgress = (progress: number) => {
    if (!embedded) return;
    swipeProgressRef.current = progress;
    if (swipeAnimationRef.current) return;
    swipeAnimationRef.current = window.requestAnimationFrame(() => {
      swipeAnimationRef.current = null;
      const node = panelRef.current;
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
  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!embedded) return;
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  }
  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!embedded || swipeStartX.current === null) return;
    const currentX = event.touches[0]?.clientX ?? 0;
    const deltaX = currentX - swipeStartX.current;
    const progress = Math.max(0, Math.min(1, deltaX / 220));
    applySwipeProgress(progress);
  }
  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!embedded) return;
    if (swipeStartX.current === null) return;
    const delta = swipeStartX.current - (event.changedTouches[0]?.clientX ?? 0);
    if (delta < -60) {
      closePanel();
    }
    applySwipeProgress(0);
    swipeStartX.current = null;
  }

  const [movementQuery, setMovementQuery] = useState("");
  const [selectedMovementName, setSelectedMovementName] = useState<string | null>(null);
  const movementInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);
  const restInputRef = useRef<HTMLInputElement>(null);
  const addSetButtonRef = useRef<HTMLButtonElement>(null);
  const setMenuRef = useRef<HTMLDivElement>(null);
  const [setMenuOpen, setSetMenuOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteMovementId, setConfirmDeleteMovementId] = useState<string | null>(null);
  const [confirmDeleteSetId, setConfirmDeleteSetId] = useState<string | null>(null);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [editingMovementName, setEditingMovementName] = useState<string>("");
  const [showAddButton, setShowAddButton] = useState(defaultPreferences.showAddButton);
  const [focusInputOnOpen, setFocusInputOnOpen] = useState(defaultPreferences.focusInputOnOpen);
  const [focusWeightOnSelect, setFocusWeightOnSelect] = useState(
    defaultPreferences.focusWeightOnSelect
  );
  const [completedSetThreshold, setCompletedSetThreshold] = useState(
    defaultPreferences.completedSetThreshold
  );
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [infoSheetMounted, setInfoSheetMounted] = useState(false);
  const [infoSheetVisible, setInfoSheetVisible] = useState(false);
  const [infoSheetDragOffset, setInfoSheetDragOffset] = useState(0);
  const [infoSheetDragStart, setInfoSheetDragStart] = useState<number | null>(null);
  const [visibleInfoLines, setVisibleInfoLines] = useState({
    weight: true,
    reps: true,
    rest: true,
  });
  const infoCardsScrollerRef = useRef<HTMLDivElement | null>(null);
  const [infoActiveCardIndex, setInfoActiveCardIndex] = useState(0);
  const setCardsScrollerRef = useRef<HTMLDivElement | null>(null);
  const [setCardsActiveIndex, setSetCardsActiveIndex] = useState(0);
  const preferencesLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPreferences() {
      try {
        const stored = await preferencesDb.get();
        if (cancelled) return;
        setShowAddButton(stored.showAddButton);
        setFocusInputOnOpen(stored.focusInputOnOpen);
        setFocusWeightOnSelect(stored.focusWeightOnSelect);
        setCompletedSetThreshold(stored.completedSetThreshold);
      } catch (error) {
        console.error("Failed to load FitNote preferences", error);
      } finally {
        if (!cancelled) {
          preferencesLoadedRef.current = true;
          setPreferencesReady(true);
        }
      }
    }
    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (swipeAnimationRef.current) {
        cancelAnimationFrame(swipeAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoadedRef.current) return;
    preferencesDb
      .save({ showAddButton, focusInputOnOpen, focusWeightOnSelect, completedSetThreshold })
      .catch((error) => console.error("Failed to save FitNote preferences", error));
  }, [showAddButton, focusInputOnOpen, focusWeightOnSelect, completedSetThreshold]);

  useEffect(() => {
    if (!preferencesLoadedRef.current || !focusInputOnOpen || panelState !== "active") {
      return;
    }
    movementInputRef.current?.focus();
  }, [panelState, focusInputOnOpen]);

  useEffect(() => {
    if (movementQuery) return;
    const selected = workoutSession.movementLibrary.find(
      (movement) => movement.id === workoutSession.currentMovementId
    );
    setSelectedMovementName(selected ? selected.name : null);
  }, [workoutSession.currentMovementId, workoutSession.movementLibrary, movementQuery]);

  const trimmedMovementQuery = movementQuery.trim();
  const filteredMovements = useMemo(() => {
    if (!trimmedMovementQuery) {
      return workoutSession.movementLibrary;
    }
    return workoutSession.movementLibrary.filter((movement) =>
      movement.name.toLowerCase().includes(trimmedMovementQuery.toLowerCase())
    );
  }, [trimmedMovementQuery, workoutSession.movementLibrary]);

  const hasExactMovement = useMemo(() => {
    if (!trimmedMovementQuery) return false;
    return workoutSession.movementLibrary.some(
      (movement) => movement.name.toLowerCase() === trimmedMovementQuery.toLowerCase()
    );
  }, [trimmedMovementQuery, workoutSession.movementLibrary]);

  const activeMovementOption = useMemo(
    () =>
      workoutSession.movementLibrary.find(
        (movement) => movement.id === workoutSession.currentMovementId
      ) ?? null,
    [workoutSession.currentMovementId, workoutSession.movementLibrary]
  );

  const movementHistory = useMemo(() => {
    if (!activeMovementOption) return null;
    const normalizedName = activeMovementOption.name.toLowerCase();
    const movementSessions = workoutSession.sessions
      .filter((session) => !session.archivedAt)
      .map((session) => {
        const movement = session.movements.find(
          (item) => item.name.toLowerCase() === normalizedName
        );
        return movement ? { session, movement } : null;
      })
      .filter((entry): entry is MovementSession => Boolean(entry))
      .sort((a, b) => (a.session.createdAt < b.session.createdAt ? 1 : -1));

    if (!movementSessions.length) {
      return {
        sessions: [],
        totalSessions: 0,
        totalSets: 0,
        bestWeight: 0,
        bestReps: 0,
        lastSession: null as null | MovementSession,
        timelinePoints: [] as {
          index: number;
          weight: number;
          reps: number;
          rest: number;
          setIndex: number;
        }[],
      };
    }

    let totalSets = 0;
    let bestWeight = 0;
    let bestReps = 0;
    movementSessions.forEach(({ movement }) => {
      movement.sets.forEach((set) => {
        totalSets += 1;
        if (set.weight > bestWeight) {
          bestWeight = set.weight;
          bestReps = set.reps;
        } else if (set.weight === bestWeight) {
          bestReps = Math.max(bestReps, set.reps);
        }
      });
    });

    const timelinePoints: {
      index: number;
      weight: number;
      reps: number;
      rest: number;
      setIndex: number;
    }[] = [];
    movementSessions
      .slice()
      .reverse()
      .forEach(({ movement }) => {
        movement.sets.forEach((set, setIndex) => {
          timelinePoints.push({
            index: timelinePoints.length + 1,
            weight: set.weight,
            reps: set.reps,
            rest: set.rest,
            setIndex: setIndex + 1,
          });
        });
      });

    return {
      sessions: movementSessions,
      totalSessions: movementSessions.length,
      totalSets,
      bestWeight,
      bestReps,
      lastSession: movementSessions[0],
      timelinePoints,
    };
  }, [activeMovementOption, workoutSession.sessions]);

  const lastSessionLabel = movementHistory?.lastSession
    ? formatSessionLabel(movementHistory.lastSession.session.createdAt)
    : null;

  const { toast } = useToast();

  function showError(message?: string) {
    if (!message) return;
    toast({
      title: "Form is incomplete",
      description: message,
      variant: "error",
    });
  }

  function showSuccess(message: string) {
    toast({ title: message, variant: "success" });
  }

  function handleAddSet() {
    const result = workoutSession.addSet();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Set saved temporarily.");
    weightInputRef.current?.focus();
  }

  function handleSaveMovement() {
    const result = workoutSession.saveMovement();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Movement added to session.");
  }

  async function handleSaveSession() {
    const result = await workoutSession.saveSession();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Workout session saved.");
    closePanel();
  }

  function handleSelectMovement(optionId: string) {
    workoutSession.setCurrentMovementId(optionId);
    const selected = workoutSession.movementLibrary.find((movement) => movement.id === optionId);
    setSelectedMovementName(selected?.name ?? "");
    setMovementQuery("");
    if (focusWeightOnSelect) {
      weightInputRef.current?.focus();
    }
  }

  function handleAddCustomMovement() {
    const result = workoutSession.addCustomMovement(trimmedMovementQuery || movementQuery);
    if (!result.success || !result.data) {
      showError(result.error);
      return;
    }
    handleSelectMovement(result.data.id);
    showSuccess("New movement added.");
  }

  function handleAutoAdvance(field: "weight" | "reps" | "rest", value: string) {
    const normalized = value.replace(/[^\d]/g, "");
    workoutSession.updateInput(field, normalized);
    if (!normalized.length) {
      return;
    }

    if (field === "weight") {
      const numeric = Number(normalized);
      const shouldAdvance =
        normalized.length >= 3 || (normalized.length >= 2 && !Number.isNaN(numeric) && numeric < 100);
      if (shouldAdvance) {
        repsInputRef.current?.focus();
      }
      return;
    }

    const limit = field === "rest" ? 3 : 1;
    if (normalized.length < limit) {
      return;
    }
    if (field === "reps") {
      restInputRef.current?.focus();
      return;
    }
    addSetButtonRef.current?.focus();
  }

  function handleFieldKeyDown(
    field: "weight" | "reps" | "rest",
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddSet();
      return;
    }
    if (event.key === "Backspace" && event.currentTarget.value.length === 0) {
      event.preventDefault();
      if (field === "reps") {
        weightInputRef.current?.focus();
      }
      if (field === "rest") {
        repsInputRef.current?.focus();
      }
    }
  }

  const infoSheetAnimationDuration = 260;
  const infoSheetCloseThreshold = 120;

  const openInfoSheet = () => {
    if (infoSheetMounted) return;
    setInfoSheetDragOffset(0);
    setInfoSheetDragStart(null);
    setInfoSheetMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setInfoSheetVisible(true));
    });
  };

  const closeInfoSheet = () => {
    if (!infoSheetMounted) return;
    setInfoSheetDragOffset(0);
    setInfoSheetDragStart(null);
    setInfoSheetVisible(false);
    setTimeout(() => {
      setInfoSheetMounted(false);
    }, infoSheetAnimationDuration);
  };

  const handleInfoSheetTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!infoSheetVisible) return;
    const touch = event.touches[0];
    setInfoSheetDragStart(touch?.clientY ?? null);
  };

  const handleInfoSheetTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (infoSheetDragStart === null || !infoSheetVisible) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = currentY - infoSheetDragStart;
    if (delta <= 0) return;
    event.preventDefault();
    setInfoSheetDragOffset(delta);
    if (delta > infoSheetCloseThreshold) {
      setInfoSheetDragStart(null);
      closeInfoSheet();
    }
  };

  const handleInfoSheetTouchEnd = () => {
    if (!infoSheetVisible) return;
    if (infoSheetDragOffset > infoSheetCloseThreshold) {
      closeInfoSheet();
      return;
    }
    setInfoSheetDragOffset(0);
    setInfoSheetDragStart(null);
  };

  const panelClasses =
    panelState === "active"
      ? "translate-y-0 opacity-100"
      : panelState === "enter"
        ? "translate-y-6 opacity-0"
        : "translate-y-6 opacity-0";

  useEffect(() => {
    if (!setMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!setMenuRef.current) {
        setSetMenuOpen(false);
        return;
      }
      if (!setMenuRef.current.contains(event.target as Node)) {
        setSetMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setMenuOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!infoSheetMounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [infoSheetMounted]);

  useEffect(() => {
    if (infoSheetMounted && !activeMovementOption) {
      setInfoSheetMounted(false);
      setInfoSheetVisible(false);
    }
  }, [activeMovementOption, infoSheetMounted]);

  useEffect(() => {
    const node = infoCardsScrollerRef.current;
    if (!node) return;
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
      setInfoActiveCardIndex(bestIndex);
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [infoSheetMounted, movementHistory?.timelinePoints.length, movementHistory?.lastSession]);

  useEffect(() => {
    const node = setCardsScrollerRef.current;
    if (!node) return;
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
      setSetCardsActiveIndex(bestIndex);
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [workoutSession.currentSets.length, workoutSession.stagedMovements.length]);

  return (
    <div
      data-swipe-ignore={embedded ? true : undefined}
      className="fixed inset-0 z-50 flex bg-gradient-to-b from-emerald-50 via-white to-white"
      onTouchStart={embedded ? handleTouchStart : undefined}
      onTouchMove={embedded ? handleTouchMove : undefined}
      onTouchEnd={embedded ? handleTouchEnd : undefined}
    >
      <div
        className={`flex h-full w-full flex-col bg-transparent transition-all duration-200 ease-out ${panelClasses}`}
      >
        <div ref={panelRef} className="flex-1 overflow-y-auto">
          <div className="px-6 pb-6 pt-8">
            <PageHeader
              title="New Workout"
              onSettings={() => setSettingsOpen(true)}
            />
            <SettingsSheet
              title="Pengaturan Aktivitas"
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
            >
              <div className="space-y-2">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    Show add-set button
                  </span>
                  <Toggle checked={showAddButton} onChange={setShowAddButton} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    Auto-focus movement input
                  </span>
                  <Toggle checked={focusInputOnOpen} onChange={setFocusInputOnOpen} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    Auto-focus weight after select
                  </span>
                  <Toggle checked={focusWeightOnSelect} onChange={setFocusWeightOnSelect} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    Target set selesai
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={completedSetThreshold}
                    onChange={(event) => {
                      const value = Number.parseInt(event.target.value, 10);
                      setCompletedSetThreshold(Number.isNaN(value) ? 1 : Math.min(99, Math.max(1, value)));
                    }}
                    className="h-9 w-16 rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
            </SettingsSheet>
          </div>

          <div className="flex flex-col   space-y-5 overflow-y-auto px-6  pt-2  pb-4">
            <div className="space-y-2 rounded-lg border border-white/40 bg-white/90  shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                <div className="flex items-center gap-3 pt-5 pl-2 pr-5">
                  <Input
                    ref={movementInputRef}
                    placeholder="Start typing your favorite movement..."
                    value={movementQuery || selectedMovementName || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setMovementQuery(value);
                      setSelectedMovementName(null);
                      workoutSession.setCurrentMovementId("");
                    }}
                    className="h-14 flex-1 rounded-md border-none border-transparent bg-white py-0 text-2xl font-semibold leading-[3.5rem] text-slate-900 placeholder:text-sm placeholder:text-slate-400 shadow-none focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100"
                  />
                  {selectedMovementName && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="rounded-md bg-none text-slate-300"
                      onClick={() => {
                        workoutSession.setCurrentMovementId("");
                        setSelectedMovementName("");
                        setMovementQuery("");
                        movementInputRef.current?.focus();
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
                <div className=" pb-5">
                {movementQuery && (
                  <div className="max-h-44 overflow-y-auto rounded-md border border-slate-100 bg-white shadow-xl">
                    {!hasExactMovement && trimmedMovementQuery && (
                      <button
                        type="button"
                        className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-50"
                        onClick={handleAddCustomMovement}
                      >
                        <span>Tambah “{trimmedMovementQuery}”</span>
                        <PlusIcon className="size-4" />
                      </button>
                    )}
                    {filteredMovements.length === 0 && (
                      <p className="px-3 py-4 text-center text-xs text-slate-400">Movement not found.</p>
                    )}
                    {filteredMovements.map((movement) => (
                      <button
                        type="button"
                        key={movement.id}
                        className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50"
                        onClick={() => handleSelectMovement(movement.id)}
                      >
                        <span className="block font-medium text-slate-900">{movement.name}</span>
                        <span className="text-[9px] text-slate-500">{movement.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!movementQuery && (
                  <div className="flex flex-col  justify-between">
                    <p className="text-[9px] text-slate-400 px-5">Start typing to search your favorite movement.</p>
                    <div>

                      {activeMovementOption && (
                        <button
                          type="button"
                          onClick={openInfoSheet}
                          className="rounded-md border-none p-5 py-1 text-[9px] font-semibold uppercase  text-indigo-500  "
                        >
                          More info
                        </button>
                      )}
                    </div>
                  </div>
                )}
                  
                </div>
              </div>
            </div>

            <div className={`grid gap-4 ${preferencesReady && showAddButton ? "grid-cols-4" : "grid-cols-3"}`}>
              <div className="space-y-3 rounded-lg border border-white/60 bg-white/90  py-4 text-center shadow-[0_15px_35px_rgba(15,23,42,0.08)]">
                <Label htmlFor="input-weight" className="text-[9px] font-semibold uppercase px-3 tracking-wide text-slate-400">
                  kg
                </Label>
                <Input
                  id="input-weight"
                  inputMode="decimal"
                  maxLength={3}
                  ref={weightInputRef}
                  value={workoutSession.inputs.weight}
                  onChange={(event) => handleAutoAdvance("weight", event.target.value)}
                  onKeyDown={(event) => handleFieldKeyDown("weight", event)}
                  className="h-10 rounded-md border-none shadow-none bg-white text-center text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-200"
                  placeholder="--"
                />
              </div>
              <div className="space-y-3 rounded-lg border border-white/60 bg-white/90  py-4 text-center shadow-[0_15px_35px_rgba(15,23,42,0.08)]">
                <Label htmlFor="input-reps" className="text-[9px] font-semibold uppercase px-3 tracking-wide text-slate-400">
                  reps
                </Label>
                <Input
                  id="input-reps"
                  inputMode="numeric"
                  maxLength={2}
                  ref={repsInputRef}
                  value={workoutSession.inputs.reps}
                  onChange={(event) => handleAutoAdvance("reps", event.target.value)}
                  onKeyDown={(event) => handleFieldKeyDown("reps", event)}
                  className="h-10 rounded-md border-none shadow-none bg-white text-center text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus-within:ring-0 focus:ring-emerald-200"
                  placeholder="--"
                />
              </div>
              <div className="space-y-3 rounded-lg border border-white/60 bg-white/90  py-4 text-center shadow-[0_15px_35px_rgba(15,23,42,0.08)]">
                <Label htmlFor="input-rest" className="text-[9px] font-semibold uppercase px-3 tracking-wide text-slate-400">
                  rest
                </Label>
                <Input
                  id="input-rest"
                  inputMode="numeric"
                  maxLength={3}
                  ref={restInputRef}
                  value={workoutSession.inputs.rest}
                  onChange={(event) => handleAutoAdvance("rest", event.target.value)}
                  onKeyDown={(event) => handleFieldKeyDown("rest", event)}
                  className="h-10 rounded-md border-none shadow-none bg-white text-center text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-200"
                  placeholder="--"
                />
              </div>
              {preferencesReady && showAddButton && (
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-full w-full rounded-lg bg-gradient-to-r bg-indigo-600  text-white shadow-[0_20px_40px_rgba(79,70,229,0.35)]"
                    onClick={handleAddSet}
                    ref={addSetButtonRef}
                  >
                    <PlusIcon className="size-6" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <div
                ref={setCardsScrollerRef}
                className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="min-w-full snap-center">
                  <div className="h-full min-h-[400px] rounded-lg border border-white/40 bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Sets</p>
                        <p className="text-[9px] text-slate-400">
                          Review sets before saving. Total: {workoutSession.currentSets.length} sets.
                        </p>
                      </div>
                      {workoutSession.currentSets.length >= completedSetThreshold && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCheckIcon className="size-5" />
                          <span className="text-[9px] font-semibold uppercase tracking-wide">Done</span>
                        </div>
                      )}
                      <div className="relative" ref={setMenuRef}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full bg-slate-50 text-slate-500"
                          onClick={() => setSetMenuOpen((prev) => !prev)}
                        >
                          <MoreVerticalIcon className="size-5" />
                        </Button>
                        {setMenuOpen && (
                          <div className="absolute right-0 top-11 z-20 w-48 rounded-md border border-slate-100 bg-white p-2 text-sm shadow-xl">
                            <button
                              className="w-full rounded-xl px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                setSetMenuOpen(false);
                                handleSaveMovement();
                              }}
                            >
                              Save movement
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <SetCardList
                      sets={workoutSession.currentSets}
                      variant="staged"
                      onDelete={(setId) => setConfirmDeleteSetId(setId)}
                      onEditSet={workoutSession.updateCurrentSet}
                      emptyLabel="No sets yet."
                      maxHeightClassName="max-h-[400px]"
                    />
                  </div>
                </div>

                <div className="min-w-full snap-center">
                  <div className=" h-[400px] overflow-auto rounded-md bg-white p-5 shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Session moves</p>
                        <p className="text-[9px] text-slate-400">Review progress before saving.</p>
                      </div>
                    </div>
                    {workoutSession.stagedMovements.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {workoutSession.stagedMovements
                          .slice()
                          .reverse()
                          .map((movement) => {
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
                            const suggestion = movement.sets.length >= 4 && consistentWeight;

                            return (
                              <div
                                key={movement.id}
                                className="rounded-md border border-slate-100 p-4 text-sm text-slate-700"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div>
                                    {editingMovementId === movement.id ? (
                                      <div className="relative">
                                        <input
                                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
                                          value={editingMovementName}
                                          onChange={(event) => setEditingMovementName(event.target.value)}
                                          onFocus={(event) => event.target.select()}
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                              event.currentTarget.blur();
                                            }
                                            if (event.key === "Escape") {
                                              setEditingMovementId(null);
                                            }
                                          }}
                                          onBlur={() => {
                                            if (editingMovementName.trim().length > 0) {
                                              workoutSession.renameStagedMovement(
                                                movement.id,
                                                editingMovementName.trim()
                                              );
                                            }
                                            setEditingMovementId(null);
                                          }}
                                          autoFocus
                                        />
                                        {editingMovementName.trim().length > 0 && (
                                          <div className="absolute left-0 right-0 top-10 z-20 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                                            {workoutSession.movementLibrary
                                              .filter((option) =>
                                                option.name.toLowerCase().includes(
                                                  editingMovementName.trim().toLowerCase()
                                                )
                                              )
                                              .slice(0, 8)
                                              .map((option) => (
                                                <button
                                                  key={option.id}
                                                  type="button"
                                                  className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                  onMouseDown={(event) => event.preventDefault()}
                                                  onClick={() => {
                                                    setEditingMovementName(option.name);
                                                    workoutSession.renameStagedMovement(movement.id, option.name);
                                                    setEditingMovementId(null);
                                                  }}
                                                >
                                                  {option.name}
                                                </button>
                                              ))}
                                            {workoutSession.movementLibrary.filter((option) =>
                                              option.name
                                                .toLowerCase()
                                                .includes(editingMovementName.trim().toLowerCase())
                                            ).length === 0 && (
                                                <div className="px-3 py-2 text-xs text-slate-400">
                                                  Tidak ada hasil.
                                                </div>
                                              )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p
                                        className="text-xl font-semibold text-slate-900"
                                        onDoubleClick={() => {
                                          setEditingMovementId(movement.id);
                                          setEditingMovementName(movement.name);
                                        }}
                                      >
                                        {movement.name}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    className="text-[9px] font-semibold uppercase tracking-wide text-slate-400"
                                    onClick={() => setConfirmDeleteMovementId(movement.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                      Total Set
                                    </p>
                                    <p className="text-sm text-slate-900">{movement.sets.length}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                      Total Reps
                                    </p>
                                    <p className="text-sm text-slate-900">{totalReps}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                      Weight Range
                                    </p>
                                    <p className="text-sm text-slate-900">
                                      {minWeight}kg{consistentWeight ? "" : ` – ${maxWeight}kg`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                      Total Rest
                                    </p>
                                    <p className="text-sm text-slate-900">{totalRest} sec</p>
                                  </div>
                                </div>
                                {suggestion && (
                                  <div className="mt-3 inline-flex items-center gap-2 py-2 text-xs font-semibold text-indigo-600">
                                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                      ↑
                                    </span>
                                    Level Up: +2.5kg suggestion
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="mt-6 rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-400">
                        No movements yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                {[0, 1].map((index) => (
                  <span
                    key={`sets-dot-${index}`}
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      setCardsActiveIndex === index ? "bg-slate-700" : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
          <div className="mt-auto px-6 pb-8">
            <div className="h-14" />
          </div>

        </div>
      </div>
      {mounted &&
        createPortal(
          <Button
            style={{
              bottom: isPlayerActive
                ? "calc(var(--player-save-bottom, calc(var(--player-offset, 0px) - 14px)) + 45px)"
                : "calc(var(--bottom-nav-height, 0px) + 22px)",
            }}
            className="fixed right-5 z-[0] size-14 rounded-full bg-indigo-600 text-white shadow-[0_30px_60px_rgba(79,70,229,0.35)]"
            onClick={() => setConfirmSaveOpen(true)}
          >
            <SaveIcon className="size-6" />
            <span className="sr-only">Save session</span>
          </Button>,
          document.body
        )}
      {infoSheetMounted && activeMovementOption && movementHistory && typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/40 transition-opacity duration-300 ${infoSheetVisible ? "opacity-100" : "opacity-0"}`}
            onClick={closeInfoSheet}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex w-full flex-col rounded-t-[32px] bg-white px-6 pb-6 pt-3 shadow-[0_-20px_60px_rgba(15,23,42,0.25)] transition-all duration-300"
              style={{
                transform: `translateY(calc(${infoSheetVisible ? "0%" : "100%"} + ${infoSheetDragOffset}px))`,
                height: "78vh",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="sticky top-0 z-10 bg-white pb-4"
                onTouchStart={handleInfoSheetTouchStart}
                onTouchMove={handleInfoSheetTouchMove}
                onTouchEnd={handleInfoSheetTouchEnd}
              >
                <div className="mx-auto mb-3 mt-2 h-1.5 w-16 rounded-full bg-slate-200" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    {activeMovementOption.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-semibold text-indigo-600">
                      {movementHistory.bestWeight || 0}
                      <span className="ml-0.5 text-lg text-slate-400">kg</span>
                    </p>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {movementHistory.bestReps || 0} Reps
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">
                    Total sets {movementHistory.totalSets} • Sessions {movementHistory.totalSessions}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto pb-6">
                <div
                  ref={infoCardsScrollerRef}
                  className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="min-w-[98%] snap-center">
                    {movementHistory.timelinePoints.length > 0 ? (
                      <div className="h-full min-h-[320px] rounded-2xl border border-slate-100 bg-white p-4 ">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          <ChartArea className="size-4" /> Chart
                        </div>
                        <MovementChart
                          points={movementHistory.timelinePoints}
                          visibleLines={visibleInfoLines}
                          onToggleLine={(key) =>
                            setVisibleInfoLines((prev) => ({ ...prev, [key]: !prev[key] }))
                          }
                          showLegend={false}
                          showPointLabels
                        />
                      </div>
                    ) : (
                      <div className="h-full min-h-[320px] rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-400 ">
                        Belum ada data untuk chart.
                      </div>
                    )}
                  </div>

                  <div className="min-w-[98%] snap-center">
                    {movementHistory.lastSession && movementHistory.lastSession.movement.sets.length > 0 ? (
                      <div className="h-full min-h-[320px] rounded-2xl border border-slate-100 bg-white p-4 ">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Last Sets
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {movementHistory.lastSession.movement.sets.length} sets
                          </span>
                        </div>
                        <SetCardList
                          sets={movementHistory.lastSession.movement.sets}
                          variant="history"
                          emptyLabel="Belum ada data."
                          maxHeightClassName="max-h-[250px]"
                        />
                      </div>
                    ) : (
                      <div className="h-full min-h-[320px] rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-400 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                        Belum ada data untuk gerakan ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInfoSheet}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_6px_19px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
      <ConfirmModal
        isOpen={confirmSaveOpen}
        title="Save workout session?"
        message="Make sure the data is correct. The session will be saved to your workout history."
        confirmText="Save"
        cancelText="Batal"
        variant="overlay"
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={async () => {
          await handleSaveSession();
          setConfirmSaveOpen(false);
        }}
      />
      <ConfirmModal
        isOpen={confirmDeleteMovementId !== null}
        title="Delete this movement?"
        message="This movement and all its sets will be deleted."
        confirmText="Delete"
        cancelText="Batal"
        variant="overlay"
        onCancel={() => setConfirmDeleteMovementId(null)}
        onConfirm={() => {
          if (confirmDeleteMovementId) {
            workoutSession.removeMovement(confirmDeleteMovementId);
          }
          setConfirmDeleteMovementId(null);
        }}
      />
      <ConfirmModal
        isOpen={confirmDeleteSetId !== null}
        title="Delete this set?"
        message="This set will be removed from the list."
        confirmText="Delete"
        cancelText="Cancel"
        variant="overlay"
        onCancel={() => setConfirmDeleteSetId(null)}
        onConfirm={() => {
          if (confirmDeleteSetId) {
            workoutSession.removeSet(confirmDeleteSetId);
          }
          setConfirmDeleteSetId(null);
        }}
      />
    </div>
  );
};

export default WorkoutBuilder;
