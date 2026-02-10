"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ChangeEvent as ReactChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/ui/button";
import useWorkoutSession from "@/hooks/useWorkoutSession";
import type { WorkoutMovement } from "@/types/workout";
import { exportFitnoteBackup, importFitnoteBackup } from "@/lib/indexedDb/backup";
import { useToast } from "@/ui/use-toast";
import SelectionModeBar from "@/components/workouts/SelectionModeBar";
import MobileWorkoutSessionsSection from "@/components/workouts/MobileWorkoutSessionsSection";
import { useMobileWorkoutHomeStore } from "@/store/mobileWorkoutHome";

type ActiveMovement = {
  movement: WorkoutMovement;
  sessionLabel: string;
};

const sheetAnimationDuration = 220;
const sheetCloseThreshold = 70;
const sheetExpandThreshold = 25;
const setCardColors = ["#E5EEFF", "#FFE7EE", "#E8FBEF", "#FFF6DA", "#F1EAFF"];

type MobileWorkoutHomeProps = {
  onOpenBuilder?: () => void;
};

const MobileWorkoutHome = ({ onOpenBuilder }: MobileWorkoutHomeProps) => {
  const workoutSession = useWorkoutSession();
  const router = useRouter();
  const [activeMovement, setActiveMovement] = useState<ActiveMovement | null>(null);
  const [sheetDragStart, setSheetDragStart] = useState<number | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetMounted, setIsSheetMounted] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<"half" | "full">("half");
  const [isArchiving, setIsArchiving] = useState(false);
  const sheetAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const setSessions = useMobileWorkoutHomeStore((state) => state.setSessions);
  const setRenameSession = useMobileWorkoutHomeStore((state) => state.setRenameSession);
  const isSelectionMode = useMobileWorkoutHomeStore((state) => state.isSelectionMode);
  const selectedSessions = useMobileWorkoutHomeStore((state) => state.selectedSessions);
  const exitSelectionMode = useMobileWorkoutHomeStore((state) => state.exitSelectionMode);
  const scrollTargetSession = useMobileWorkoutHomeStore((state) => state.scrollTargetSession);
  const clearScrollTarget = useMobileWorkoutHomeStore((state) => state.clearScrollTarget);
  const clearSelectionTimer = useMobileWorkoutHomeStore((state) => state.clearSelectionTimer);

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
      clearSelectionTimer();
    };
  }, [clearSelectionTimer]);

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
    style.touchAction = "pan-y";
    return () => {
      style.overflow = previousOverflow;
      style.touchAction = previousTouchAction;
    };
  }, [isSheetMounted]);

  const openBuilder = () => {
    if (onOpenBuilder) {
      onOpenBuilder();
      return;
    }
    router.push("/builder");
  };

  const handleExportBackup = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const payload = await exportFitnoteBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitnote-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Backup tersimpan", variant: "success" });
    } catch (error) {
      console.error("Failed to export backup", error);
      toast({
        title: "Gagal export",
        description: "Coba lagi beberapa saat.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (isImporting) return;
    const confirmed = window.confirm(
      "Import akan menimpa data lokal kamu. Lanjutkan?"
    );
    if (!confirmed) return;
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ReactChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importFitnoteBackup(payload);
      window.dispatchEvent(new Event("fitnote:sessions-updated"));
      toast({ title: "Import berhasil", variant: "success" });
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Failed to import backup", error);
      toast({
        title: "Gagal import",
        description: "Pastikan file JSON sesuai format backup FitNote.",
        variant: "error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    setSessions(workoutSession.sessions);
    setRenameSession(workoutSession.renameSession);
  }, [setSessions, setRenameSession, workoutSession.sessions, workoutSession.renameSession]);
  
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
      clearScrollTarget();
    }, 220);
  }, [clearScrollTarget, scrollTargetSession]);

  return (
    <div
      className="select-none relative z-0 mx-auto flex h-dvh w-full max-w-md flex-col bg-slate-50 overflow-y-auto overscroll-none pb-22"
      style={containerStyle}
    >
      {isSelectionMode && (
        <SelectionModeBar
          selectedCount={selectedSessions.size}
          isArchiving={isArchiving}
          onCancel={exitSelectionMode}
          onArchive={handleArchiveSelected}
        />
      )}
      <MobileWorkoutSessionsSection
        onOpenArchive={() => router.push("/archive")}
        onOpenReport={() => router.push("/reports")}
        onExportBackup={handleExportBackup}
        onImportClick={handleImportClick}
        onImportFile={handleImportFile}
        isExporting={isExporting}
        isImporting={isImporting}
        fileInputRef={fileInputRef}
        sessionRefs={sessionRefs}
        onOpenMovementSheet={openMovementSheet}
      />

      

      {isSheetMounted && activeMovement && typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/40 transition-opacity duration-300 ${isSheetVisible ? "opacity-100" : "opacity-0"}`}
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
          </div>,
          document.body
        )}
    </div>
  );
}

export default MobileWorkoutHome;
