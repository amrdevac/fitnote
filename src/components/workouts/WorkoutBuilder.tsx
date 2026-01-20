"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, MoreVerticalIcon, PlusIcon, Settings2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/ui/use-toast";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import preferencesDb, { defaultPreferences } from "@/lib/indexedDb/preferences";

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

const WorkoutBuilder = () => {
  const router = useRouter();
  const workoutSession = useWorkoutSession();
  const toastApi = useToast();

  const [panelState, setPanelState] = useState<"enter" | "active" | "exit">("enter");
  useEffect(() => {
    const id = requestAnimationFrame(() => setPanelState("active"));
    return () => cancelAnimationFrame(id);
  }, []);

  const closePanel = () => {
    if (panelState === "exit") return;
    setPanelState("exit");
    setTimeout(() => router.back(), 250);
  };

  const swipeStartX = useRef<number | null>(null);
  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  }
  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (swipeStartX.current === null) return;
    const delta = swipeStartX.current - (event.changedTouches[0]?.clientX ?? 0);
    if (delta < -60) {
      closePanel();
    }
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

  function showError(message?: string) {
    if (!message) return;
    toastApi.toast({
      title: "Form belum lengkap",
      description: message,
      variant: "destructive",
    });
  }

  function showSuccess(message: string) {
    toastApi.toast({ title: message });
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
      className="fixed inset-0 z-50 flex bg-slate-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex h-full w-full flex-col bg-white transition-transform duration-300 ${panelClasses}`}
      >
        <header className="flex items-center justify-between px-6 py-4">

          <Button variant="ghost" size="icon" onClick={closePanel} className="text-slate-600">
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div className="flex items-center  gap-3">
            <div>
              <p className=" uppercase tracking-wide text-slate-400">Pengelolaan Aktivitas</p>
            </div>
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="text-slate-500">
                  <Settings2Icon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-3xl border-none bg-white px-6 pb-8 pt-6 text-slate-900"
              >
                <SheetHeader className="mb-4 px-0">
                  <SheetTitle>Pengaturan FitNote</SheetTitle>
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
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-40 pt-2">
          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  ref={movementInputRef}
                  placeholder="Ketik nama gerakan..."
                  value={movementQuery || selectedMovementName || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMovementQuery(value);
                    setSelectedMovementName(null);
                    workoutSession.setCurrentMovementId("");
                  }}
                  className="h-11 flex-1 rounded-lg border-slate-200 bg-white text-base font-medium text-slate-900"
                />
                {selectedMovementName && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-slate-500"
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
              {movementQuery && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {!hasExactMovement && trimmedMovementQuery && (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50"
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
                      className="w-full border-b border-slate-100 px-4 py-2 text-left text-sm last:border-0 hover:bg-slate-50"
                      onClick={() => handleSelectMovement(movement.id)}
                    >
                      <span className="block font-medium text-slate-900">{movement.name}</span>
                      <span className="text-xs text-slate-500">{movement.description}</span>
                    </button>
                  ))}
                </div>
              )}
              {!movementQuery && (
                <p className="text-xs text-slate-400">Mulai ketik untuk mencari gerakan favorit kamu.</p>
              )}
            </div>
          </div>

          <div className={`grid gap-3 ${showAddButton ? "grid-cols-4" : "grid-cols-3"}`}>
            <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 text-center">
              <Label htmlFor="input-weight" className="text-xs text-slate-500">
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
                className="h-9 rounded-lg bg-slate-50 text-center text-base font-semibold text-slate-900"
              />
            </div>
            <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 text-center">
              <Label htmlFor="input-reps" className="text-xs text-slate-500">
                reps
              </Label>
              <Input
                id="input-reps"
                inputMode="numeric"
                maxLength={1}
                ref={repsInputRef}
                value={workoutSession.inputs.reps}
                onChange={(event) => handleAutoAdvance("reps", event.target.value)}
                onKeyDown={(event) => handleFieldKeyDown("reps", event)}
                className="h-9 rounded-lg bg-slate-50 text-center text-base font-semibold text-slate-900"
              />
            </div>
            <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 text-center">
              <Label htmlFor="input-rest" className="text-xs text-slate-500">
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
                className="h-9 rounded-lg bg-slate-50 text-center text-base font-semibold text-slate-900"
              />
            </div>
            {showAddButton && (
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-12 w-full rounded-2xl bg-slate-900 text-white"
                  onClick={handleAddSet}
                  ref={addSetButtonRef}
                >
                  <PlusIcon className="size-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Set yang siap disimpan</p>
              <div className="relative" ref={setMenuRef}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-slate-500"
                  onClick={() => setSetMenuOpen((prev) => !prev)}
                >
                  <MoreVerticalIcon className="size-5" />
                </Button>
                {setMenuOpen && (
                  <div className="z-20 absolute right-0 top-9 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
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
            <div className="space-y-2">
              {workoutSession.currentSets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  <span>
                    {set.weight}kg · {set.reps} reps · {set.rest} detik
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-slate-500"
                    onClick={() => workoutSession.removeSet(set.id)}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
              {workoutSession.currentSets.length === 0 && (
                <p className="text-xs text-slate-400">Belum ada set yang siap.</p>
              )}
            </div>
          </div>

          {workoutSession.stagedMovements.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Gerakan di sesi ini</p>

              </div>
              <div className="space-y-3">
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
                  const suggestion =
                    movement.sets.length >= 4 && consistentWeight ? "Level Up" : null;

                  return (
                    <div key={movement.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{movement.name}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-slate-500"
                          onClick={() => workoutSession.removeMovement(movement.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Total set: {movement.sets.length}</span>
                          <span>Total reps: {totalReps}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Rentang beban: {minWeight}kg
                            {consistentWeight ? "" : ` – ${maxWeight}kg`}
                          </span>
                          <span>Total rest: {totalRest} detik</span>
                        </div>
                      </div>
                      {suggestion && (
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-700">
                            ↑
                          </span>
                          {suggestion}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-6 pb-6 pt-4 shadow-[0_-8px_30px_rgba(15,23,42,0.05)]">
          <Button className="h-12 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white" onClick={handleSaveSession}>
            Simpan Sesi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutBuilder;
