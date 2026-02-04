"use client";

import SwipeNavigation from "@/components/SwipeNavigation";
import ExerciseTimerForm from "@/components/timers/ExerciseTimerForm";

const NewTimerPage = () => {
  return (
    <SwipeNavigation rightRoute="/timers" className="min-h-dvh bg-slate-50">
      <main>
        <ExerciseTimerForm />
      </main>
    </SwipeNavigation>
  );
};

export default NewTimerPage;
