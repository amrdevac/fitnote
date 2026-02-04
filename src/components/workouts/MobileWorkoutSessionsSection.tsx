"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent as ReactChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  RefObject,
} from "react";
import {
  CalendarDays,
  CheckIcon,
  ChevronDown,
  Download,
  LayersIcon,
  MoreVerticalIcon,
  Repeat2Icon,
  ScaleIcon,
  TimerIcon,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import type { WorkoutMovement } from "@/types/workout";
import { getDefaultSessionTitle } from "@/lib/sessionTitle";
import { useMobileWorkoutHomeStore } from "@/store/mobileWorkoutHome";

const accentPalette = ["#fb7185", "#38bdf8", "#a78bfa", "#34d399"];

type MobileWorkoutSessionsSectionProps = {
  onOpenArchive: () => void;
  onExportBackup: () => void;
  onImportClick: () => void;
  onImportFile: (event: ReactChangeEvent<HTMLInputElement>) => void;
  isExporting: boolean;
  isImporting: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  sessionRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onOpenMovementSheet: (movement: WorkoutMovement, sessionLabel: string) => void;
};

const MobileWorkoutSessionsSection = ({
  onOpenArchive,
  onExportBackup,
  onImportClick,
  onImportFile,
  isExporting,
  isImporting,
  fileInputRef,
  sessionRefs,
  onOpenMovementSheet,
}: MobileWorkoutSessionsSectionProps) => {
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleSessions = useMobileWorkoutHomeStore((state) => state.visibleSessions);
  const totalMovements = useMobileWorkoutHomeStore((state) => state.totalMovements);
  const expandedSessions = useMobileWorkoutHomeStore((state) => state.expandedSessions);
  const selectedSessions = useMobileWorkoutHomeStore((state) => state.selectedSessions);
  const isSelectionMode = useMobileWorkoutHomeStore((state) => state.isSelectionMode);
  const editingSessionId = useMobileWorkoutHomeStore((state) => state.editingSessionId);
  const editingTitle = useMobileWorkoutHomeStore((state) => state.editingTitle);
  const isRenamingTitle = useMobileWorkoutHomeStore((state) => state.isRenamingTitle);
  const startEditingTitle = useMobileWorkoutHomeStore((state) => state.startEditingTitle);
  const setEditingTitle = useMobileWorkoutHomeStore((state) => state.setEditingTitle);
  const commitEditingTitle = useMobileWorkoutHomeStore((state) => state.commitEditingTitle);
  const handleCardPointerDown = useMobileWorkoutHomeStore((state) => state.handleCardPointerDown);
  const handleCardPointerUp = useMobileWorkoutHomeStore((state) => state.handleCardPointerUp);
  const handleCardPointerLeave = useMobileWorkoutHomeStore((state) => state.handleCardPointerLeave);
  const toggleSessionSelection = useMobileWorkoutHomeStore((state) => state.toggleSessionSelection);
  const toggleSession = useMobileWorkoutHomeStore((state) => state.toggleSession);

  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
    return (dateIso: string) => formatter.format(new Date(dateIso));
  }, []);

  useEffect(() => {
    if (editingSessionId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingSessionId]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleTitleBlur = async () => {
    const success = await commitEditingTitle();
    if (!success && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  };

  const handleTitleKeyDown = async (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const success = await commitEditingTitle();
    if (!success && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  };

  const handleTitleChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setEditingTitle(event.target.value);
  };

  return (
    <div className="flex grow flex-col">
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
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-lg shadow-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
              aria-label="Menu"
            >
              <MoreVerticalIcon className="size-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-14 z-20 w-52 rounded-2xl border border-slate-100 bg-white p-2 text-sm shadow-xl">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenArchive();
                  }}
                >
                  <CalendarDays className="size-4" />
                  Arsip
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => {
                    setMenuOpen(false);
                    onExportBackup();
                  }}
                  disabled={isExporting}
                >
                  <Download className="size-4" />
                  Export backup
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => {
                    setMenuOpen(false);
                    onImportClick();
                  }}
                  disabled={isImporting}
                >
                  <Upload className="size-4" />
                  Import backup
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImportFile}
      />

      <div
        className="flex flex-col gap-5 px-4 pb-12"
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      >
        {visibleSessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
            Catatan masih kosong. Tap tombol tambah untuk memulai.
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
                className={`relative scroll-mt-24 rounded-[32px] border-0 bg-white/95 shadow-[0_30px_60px_rgba(15,23,42,0.12)] transition ${isSelected ? "ring-2 ring-slate-900/20" : ""}`}
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
                    className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border text-white ${isSelected ? "border-slate-900 bg-slate-900" : "border-slate-200 bg-white text-slate-400"}`}
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
                        className="mt-2 text-2xl font-semibold text-slate-800"
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
                    className={`space-y-4 transition-all p-1   duration-300 ${isExpanded ? "max-h-[420px] overflow-y-auto pr-1 opacity-100" : "max-h-[220px] overflow-hidden opacity-90"}`}
                  >
                    {session.movements.map((movement, movementIndex) => {
                      const totalReps = movement.sets.reduce(
                        (acc, set) => acc + set.reps,
                        0
                      );
                      const totalRest = movement.sets.reduce(
                        (acc, set) => acc + set.rest,
                        0
                      );
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

                      const handleMovementClick = (event?: ReactMouseEvent<HTMLDivElement>) => {
                        if (isSelectionMode) {
                          event?.stopPropagation();
                          toggleSessionSelection(session.id);
                          return;
                        }
                        onOpenMovementSheet(movement, sessionLabel);
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
                                  backgroundColor: movementIndex === 0 ? "#fb923c" : accentColor,
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
                        className={`ml-1 size-4 transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                      />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default MobileWorkoutSessionsSection;
