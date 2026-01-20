"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ChevronDown } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
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
  const router = useRouter();
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

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

  const totalMovements = workoutSession.sessions.reduce(
    (acc, session) => acc + session.movements.length,
    0
  );

  return (
    <div
      className="select-none relative z-0 mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 pb-24 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
              const totalSets = session.movements.reduce(
                (acc, movement) => acc + movement.sets.length,
                0
              );
              return (
                <Card key={session.id} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{formatDate(session.createdAt)}</CardTitle>
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

                        return (
                          <div
                            key={movement.id}
                            className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-700"
                          >
                            <p className="text-sm font-medium">{movement.name}</p>
                            <div className="mt-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-500">
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
    </div>
  );
}

export default MobileWorkoutHome;
