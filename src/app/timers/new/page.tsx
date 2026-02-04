"use client";

import SwipeNavigation from "@/components/SwipeNavigation";
import ExerciseTimerForm from "@/components/timers/ExerciseTimerForm";
import TabataPlayerBar from "@/components/timers/TabataPlayerBar";

const NewTimerPage = () => {
  return (
    <SwipeNavigation rightRoute="/timers" className="min-h-dvh bg-slate-50">
      <main>
        <ExerciseTimerForm />
      </main>
      <TabataPlayerBar />
    </SwipeNavigation>
  );
};

export default NewTimerPage;
