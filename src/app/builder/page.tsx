"use client";

import SwipeNavigation from "@/components/SwipeNavigation";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";

export default function BuilderPage() {
  return (
    <SwipeNavigation leftRoute="/" className="min-h-dvh bg-slate-50">
      <WorkoutBuilder />
    </SwipeNavigation>
  );
}
