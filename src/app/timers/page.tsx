'use client';

import SwipeNavigation from "@/components/SwipeNavigation";
import ExerciseTimerManager from "@/components/timers/ExerciseTimerManager";

const TimerPage = () => {
  return (
    <SwipeNavigation rightRoute="/" className="min-h-dvh bg-slate-50">
      <main>
        <ExerciseTimerManager />
      </main>
    </SwipeNavigation>
  );
};

export default TimerPage;
