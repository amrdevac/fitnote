"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVerticalIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/ui/use-toast";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/ui/sheet";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import preferencesDb, { defaultPreferences } from "@/lib/indexedDb/preferences";
import { useTabataPlayerStore } from "@/store/tabataPlayer";
import PageHeader from "@/components/shared/PageHeader";

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

const stagedSetColors = ["#E5EEFF", "#FFEAE3", "#E8FBEF", "#FFF7DA"];

type WorkoutBuilderProps = {
  onClose?: () => void;
  embedded?: boolean;
};

const WorkoutBuilder = ({ onClose, embedded = false }: WorkoutBuilderProps) => {
  const router = useRouter();
  const workoutSession = useWorkoutSession();
  const playerStatus = useTabataPlayerStore((state) => state.status);
  const isPlayerRunning = playerStatus === "running";
  const [panelState, setPanelState] = useState<"enter" | "active" | "exit">("enter");
  useEffect(() => {
    const id = requestAnimationFrame(() => setPanelState("active"));
    return () => cancelAnimationFrame(id);
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
  const [showAddButton, setShowAddButton] = useState(defaultPreferences.showAddButton);
  const [focusInputOnOpen, setFocusInputOnOpen] = useState(defaultPreferences.focusInputOnOpen);
  const preferencesLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPreferences() {
      try {
        const stored = await preferencesDb.get();
        if (cancelled) return;
        setShowAddButton(stored.showAddButton);
        setFocusInputOnOpen(stored.focusInputOnOpen);
      } catch (error) {
        console.error("Failed to load FitNote preferences", error);
      } finally {
        if (!cancelled) {
          preferencesLoadedRef.current = true;
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
      .save({ showAddButton, focusInputOnOpen })
      .catch((error) => console.error("Failed to save FitNote preferences", error));
  }, [showAddButton, focusInputOnOpen]);

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

  const { toast } = useToast();

  function showError(message?: string) {
    if (!message) return;
    toast({
      title: "Form belum lengkap",
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
    showSuccess("Set tersimpan sementara.");
    weightInputRef.current?.focus();
  }

  function handleSaveMovement() {
    const result = workoutSession.saveMovement();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Gerakan ditambahkan ke sesi.");
  }

  async function handleSaveSession() {
    const result = await workoutSession.saveSession();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Sesi latihan tersimpan.");
    closePanel();
  }

  function handleSelectMovement(optionId: string) {
    workoutSession.setCurrentMovementId(optionId);
    const selected = workoutSession.movementLibrary.find((movement) => movement.id === optionId);
    setSelectedMovementName(selected?.name ?? "");
    setMovementQuery("");
    weightInputRef.current?.focus();
  }

  function handleAddCustomMovement() {
    const result = workoutSession.addCustomMovement(trimmedMovementQuery || movementQuery);
    if (!result.success || !result.data) {
      showError(result.error);
      return;
    }
    handleSelectMovement(result.data.id);
    showSuccess("Gerakan baru ditambahkan.");
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

  const panelClasses =
    panelState === "active"
      ? "translate-x-0"
      : panelState === "enter"
        ? "translate-x-full"
        : "translate-x-full";

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

  return (
    <div
      data-swipe-ignore={embedded ? true : undefined}
      className="fixed inset-0 z-50 flex bg-gradient-to-b from-emerald-50 via-white to-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex h-full w-full flex-col bg-transparent transition-transform duration-300 ${panelClasses}`}
      >
        <div ref={panelRef} className="overflow-auto">
          <div className="px-6 pb-6 pt-8">
            <PageHeader
              title="Pengelolaan Aktivitas"
              onBack={closePanel}
              onSettings={() => setSettingsOpen(true)}
              backPosition="left"
            />
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetContent
                side="bottom"
                className="rounded-t-3xl border-none bg-white px-6 pb-8 pt-6 text-slate-900"
              >
                <SheetHeader className="mb-4 px-0">
                  <SheetTitle>Pengaturan Aktivitas</SheetTitle>
                </SheetHeader>
                <div className="space-y-2">
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">
                      Tampilkan tombol tambah set
                    </span>
                    <Toggle checked={showAddButton} onChange={setShowAddButton} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">
                      Fokus otomatis ke input gerakan
                    </span>
                    <Toggle checked={focusInputOnOpen} onChange={setFocusInputOnOpen} />
                  </label>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col   space-y-5 overflow-y-auto px-6 pb-40 pt-2  ">
            <div className="space-y-2 rounded-lg border border-white/40 bg-white/90 p-5 shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                <div className="flex items-center gap-3">
                  <Input
                    ref={movementInputRef}
                    placeholder="Mulai ketik gerakan favoritmu..."
                    value={movementQuery || selectedMovementName || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setMovementQuery(value);
                      setSelectedMovementName(null);
                      workoutSession.setCurrentMovementId("");
                    }}
                    className="h-14 flex-1 rounded-md border-transparent bg-slate-50/80 px-4 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100"
                  />
                  {selectedMovementName && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="rounded-md bg-slate-100 text-slate-500"
                      onClick={() => {
                        workoutSession.setCurrentMovementId("");
                        setSelectedMovementName("");
                        setMovementQuery("");
                        movementInputRef.current?.focus();
                      }}
                    >
                      <Trash2Icon className="size-5" />
                    </Button>
                  )}
                </div>
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
                      <p className="px-3 py-4 text-center text-xs text-slate-400">Gerakan tidak ditemukan.</p>
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
                  <p className="text-[9px] text-slate-400">Mulai ketik untuk mencari gerakan favorit kamu.</p>
                )}
              </div>
            </div>

            <div className={`grid gap-4 ${showAddButton ? "grid-cols-4" : "grid-cols-3"}`}>
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
              {showAddButton && (
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

            <div className="rounded-lg border border-white/40 bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Set yang siap disimpan</p>
                  <p className="text-[9px] text-slate-400">Atur ulang set sebelum simpan.</p>
                </div>
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
                        Simpan gerakan
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {workoutSession.currentSets.map((set, index) => {
                  const color = stagedSetColors[index % stagedSetColors.length];
                  return (
                    <div
                      key={set.id}
                      className="flex items-center justify-between rounded-[24px] px-4 py-3 text-sm font-semibold"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-slate-800">
                        {set.weight}kg · {set.reps} reps · {set.rest} detik
                      </span>
                      <button
                        type="button"
                        className="text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                        onClick={() => workoutSession.removeSet(set.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  );
                })}
                {workoutSession.currentSets.length === 0 && (
                  <p className="rounded-md bg-slate-50 px-4 py-3 text-xs text-slate-400">
                    Belum ada set yang siap.
                  </p>
                )}
              </div>
            </div>

            {workoutSession.stagedMovements.length > 0 && (
              <div className="space-y-4 rounded-[32px]  p-5 shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Gerakan di sesi ini</p>
                    <p className="text-[9px] text-slate-400">Review progres sebelum simpan.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {workoutSession.stagedMovements.map((movement) => {
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
                        className="rounded-[28px] border border-slate-100  p-4 text-sm text-slate-700 shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-xl font-semibold text-slate-900">{movement.name}</p>

                          </div>
                          <button
                            type="button"
                            className="text-[9px] font-semibold uppercase tracking-wide text-slate-400"
                            onClick={() => workoutSession.removeMovement(movement.id)}
                          >
                            Hapus
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3  text-xs font-semibold text-slate-500">
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
                              Rentang Beban
                            </p>
                            <p className="text-sm text-slate-900">
                              {minWeight}kg{consistentWeight ? "" : ` – ${maxWeight}kg`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">
                              Total Rest
                            </p>
                            <p className="text-sm text-slate-900">{totalRest} detik</p>
                          </div>
                        </div>
                        {suggestion && (
                          <div className="mt-3 inline-flex items-center gap-2   py-2 text-xs font-semibold text-indigo-600 ">
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
              </div>
            )}

          </div>
          <div className="mt-auto px-6 pb-8">
            {isPlayerRunning ? (
              <div className="h-14" />
            ) : (
              <Button
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-indigo-600 text-base font-semibold text-white shadow-[0_30px_60px_rgba(79,70,229,0.35)]"
                onClick={handleSaveSession}
              >
                Simpan Sesi
              </Button>
            )}
          </div>

        </div>
      </div>
      {isPlayerRunning && (
        <Button
          className="fixed bottom-[calc(var(--player-offset,0px)+50px)] right-5 z-50 size-14 rounded-full bg-indigo-600 text-white shadow-[0_30px_60px_rgba(79,70,229,0.35)]"
          onClick={handleSaveSession}
        >
          <SaveIcon className="size-6" />
          <span className="sr-only">Simpan Sesi</span>
        </Button>
      )}
    </div>
  );
};

export default WorkoutBuilder;
