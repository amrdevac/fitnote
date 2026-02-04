'use client';

import SwipeNavigation from "@/components/SwipeNavigation";
import ExerciseTimerList from "@/components/timers/ExerciseTimerList";
import TabataPlayerBar from "@/components/timers/TabataPlayerBar";

const TimerPage = () => {
  return (
    <SwipeNavigation rightRoute="/" className="min-h-dvh bg-slate-50">
      <main>
        <ExerciseTimerList />
      </main>
      <TabataPlayerBar />
    </SwipeNavigation>
  );
};

export default TimerPage;
