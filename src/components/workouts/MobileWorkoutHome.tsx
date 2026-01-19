"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, Settings2Icon, Trash2Icon } from "lucide-react";
import { useToast } from "@/ui/use-toast";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import useWorkoutSession from "@/hooks/useWorkoutSession";

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

const MobileWorkoutHome = () => {
  const workoutSession = useWorkoutSession();
  const toastApi = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const [movementQuery, setMovementQuery] = useState("");
  const weightInputRef = useRef<HTMLInputElement>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);
  const restInputRef = useRef<HTMLInputElement>(null);
  const addSetButtonRef = useRef<HTMLButtonElement>(null);
  const movementInputRef = useRef<HTMLInputElement>(null);
  const [selectedMovementName, setSelectedMovementName] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAddButton, setShowAddButton] = useState(true);
  const [focusInputOnOpen, setFocusInputOnOpen] = useState(true);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (swipeStartX.current === null) return;
    const delta = swipeStartX.current - (event.changedTouches[0]?.clientX ?? 0);
    if (delta > 80) {
      setSheetOpen(true);
    } else if (delta < -80) {
      setSheetOpen(false);
    }
    swipeStartX.current = null;
  }

  function showError(message?: string) {
    if (!message) return;
    toastApi.toast({
      title: "Form belum lengkap",
      description: message,
      variant: "destructive",
    });
  }

  function showSuccess(message: string) {
    toastApi.toast({
      title: message,
    });
  }

  function handleAddSet() {
    const result = workoutSession.addSet();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Set tersimpan sementara.");
  }

  function handleSaveMovement() {
    const result = workoutSession.saveMovement();
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess("Gerakan ditambahkan ke sesi.");
  }

  function handleSaveSession() {
    const result = workoutSession.saveSession();
    if (!result.success) {
      showError(result.error);
      return;
    }
    setSheetOpen(false);
    showSuccess("Sesi latihan tersimpan.");
  }

  const totalMovements = useMemo(
    () =>
      workoutSession.sessions.reduce((acc, session) => acc + session.movements.length, 0),
    [workoutSession.sessions]
  );

  const filteredMovements = useMemo(() => {
    if (!movementQuery.trim()) {
      return workoutSession.movementLibrary;
    }
    return workoutSession.movementLibrary.filter((movement) =>
      movement.name.toLowerCase().includes(movementQuery.toLowerCase())
    );
  }, [movementQuery, workoutSession.movementLibrary]);

  useEffect(() => {
    if (sheetOpen && focusInputOnOpen) {
      movementInputRef.current?.focus();
    }
  }, [sheetOpen, focusInputOnOpen]);

  function handleSelectMovement(optionId: string) {
    workoutSession.setCurrentMovementId(optionId);
    const selected = workoutSession.movementLibrary.find((movement) => movement.id === optionId);
    setSelectedMovementName(selected?.name ?? "");
    setMovementQuery("");
    weightInputRef.current?.focus();
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

  function handleInputEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    handleAddSet();
  }

  return (
    <div
      className="relative z-0 mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="flex flex-col gap-1 px-5 pb-4 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">FitNote</h1>
            <p className="text-sm text-slate-500">
              Catat gerakan dan set lewat form khusus di kanan.
            </p>
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
                  <input
                    type="checkbox"
                    checked={showAddButton}
                    onChange={(event) => setShowAddButton(event.target.checked)}
                    className="size-5 accent-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    Fokus otomatis ke input gerakan
                  </span>
                  <input
                    type="checkbox"
                    checked={focusInputOnOpen}
                    onChange={(event) => setFocusInputOnOpen(event.target.checked)}
                    className="size-5 accent-slate-900"
                  />
                </label>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4">
        {workoutSession.sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
            Catatan masih kosong. Mulai dengan tombol tambah di kanan bawah.
          </div>
        )}

        {workoutSession.sessions.map((session) => (
          <Card key={session.id} className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{formatDate(session.createdAt)}</CardTitle>
              <CardDescription>
                {session.movements.length} gerakan ·{" "}
                {session.movements.reduce((acc, movement) => acc + movement.sets.length, 0)} set
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.movements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-700"
                >
                  <p className="text-sm font-medium">{movement.name}</p>
                  <p className="text-xs text-slate-500">
                    {movement.sets
                      .map(
                        (set) =>
                          `${set.weight}kg · ${set.reps} reps · ${set.rest} detik`
                      )
                      .join(" | ")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-0 flex items-end justify-end pb-6 pr-6">
        <div className="pointer-events-auto">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl"
              >
                <PlusIcon className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="h-full w-full max-w-none rounded-none border-none bg-white px-0 pb-0 text-slate-900"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Form catatan sesi latihan</SheetTitle>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-32 pt-6">
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
                          if (!value) {
                            setSelectedMovementName(null);
                            workoutSession.setCurrentMovementId("");
                          }
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
                        {filteredMovements.length === 0 && (
                          <p className="px-3 py-4 text-center text-xs text-slate-400">
                            Gerakan tidak ditemukan.
                          </p>
                        )}
                        {filteredMovements.map((movement) => (
                          <button
                            type="button"
                            key={movement.id}
                            className="w-full border-b border-slate-100 px-4 py-2 text-left text-sm last:border-0 hover:bg-slate-50"
                            onClick={() => handleSelectMovement(movement.id)}
                          >
                            <span className="block font-medium text-slate-900">
                              {movement.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {movement.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!movementQuery && (
                      <p className="text-xs text-slate-400">
                        Mulai ketik untuk mencari gerakan favorit kamu.
                      </p>
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
                      onKeyDown={handleInputEnter}
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
                      onKeyDown={handleInputEnter}
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
                      onKeyDown={handleInputEnter}
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
                    <p className="text-sm font-semibold text-slate-700">
                      Set yang siap disimpan
                    </p>
                    {workoutSession.currentSets.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-slate-500"
                        onClick={() => workoutSession.clearCurrentSets()}
                      >
                        Reset
                      </Button>
                    )}
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
                          hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full rounded-2xl bg-slate-900 text-white"
                    onClick={handleSaveMovement}
                  >
                    Simpan gerakan
                  </Button>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Gerakan pada sesi ini
                  </p>
                  {workoutSession.stagedMovements.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Setiap gerakan yang disimpan akan muncul di sini.
                    </p>
                  )}
                  {workoutSession.stagedMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {movement.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {movement.sets.length} set
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-500"
                        onClick={() => workoutSession.removeMovement(movement.id)}
                      >
                        <Trash2Icon className="size-4" />
                        Hapus
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <SheetFooter className="border-t border-slate-100 bg-white px-6 py-4">
                <div className="flex w-full flex-col gap-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Total sesi tersimpan: {workoutSession.sessions.length} · gerakan: {totalMovements}
                  </p>
                  <Button
                    type="button"
                    className="w-full rounded-2xl bg-slate-900 text-white"
                    onClick={handleSaveSession}
                    disabled={workoutSession.stagedMovements.length === 0}
                  >
                    Simpan sesi latihan
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default MobileWorkoutHome;
