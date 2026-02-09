'use client';

import ExerciseTimerList from "@/components/timers/ExerciseTimerList";
import BottomNav from "@/components/shared/BottomNav";

const TimerPage = () => {
  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <main>
        <ExerciseTimerList />
      </main>
      <BottomNav />
    </div>
  );
};

export default TimerPage;
