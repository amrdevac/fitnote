'use client';

import SwipeNavigation from "@/components/SwipeNavigation";
import ExerciseTimerList from "@/components/timers/ExerciseTimerList";

const TimerPage = () => {
  return (
    <SwipeNavigation rightRoute="/" className="min-h-dvh bg-slate-50">
      <main>
        <ExerciseTimerList />
      </main>
    </SwipeNavigation>
  );
};

export default TimerPage;
