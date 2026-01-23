"use client";

import { useMemo } from "react";
import SwipeNavigation from "@/components/SwipeNavigation";
import { Button } from "@/ui/button";
import useWorkoutSession from "@/hooks/useWorkoutSession";
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

const ArchivePage = () => {
  const workoutSession = useWorkoutSession();
  const archivedSessions = useMemo(
    () => workoutSession.sessions.filter((session) => session.archivedAt),
    [workoutSession.sessions]
  );
  const totalMovements = archivedSessions.reduce(
    (acc, session) => acc + session.movements.length,
    0
  );

  return (
    <SwipeNavigation leftRoute="/" className="min-h-dvh bg-slate-50">
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-12 pt-10 text-slate-900">
        <header className="pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Archive Activity
          </p>
          <h1 className="mt-1 text-4xl font-semibold text-slate-900">Archive Activity</h1>
          <p className="mt-2 text-sm text-slate-500">
            {archivedSessions.length} sesi · {totalMovements} gerakan
          </p>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {archivedSessions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
              Belum ada sesi diarsipkan.
            </div>
          )}
          {archivedSessions
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((session) => {
              const totalSets = session.movements.reduce(
                (acc, movement) => acc + movement.sets.length,
                0
              );
              const sessionLabel = formatDate(session.createdAt);
              const sessionTitle = session.title ?? getDefaultSessionTitle(session.createdAt);
              return (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{sessionLabel}</p>
                    <p className="text-lg font-semibold text-slate-900">{sessionTitle}</p>
                    <p className="text-sm text-slate-500">
                      {session.movements.length} gerakan · {totalSets} set
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="self-start"
                    onClick={() => workoutSession.restoreSessions([session.id])}
                  >
                    Kembalikan
                  </Button>
                </div>
              );
            })}
        </div>

        {archivedSessions.length > 0 && (
          <div className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                workoutSession.restoreSessions(archivedSessions.map((session) => session.id))
              }
            >
              Kembalikan semua sesi
            </Button>
          </div>
        )}
      </main>
    </SwipeNavigation>
  );
};

export default ArchivePage;
