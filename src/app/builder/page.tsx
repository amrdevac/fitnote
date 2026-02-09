"use client";

import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";
import BottomNav from "@/components/shared/BottomNav";

export default function BuilderPage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <WorkoutBuilder />
      <BottomNav />
    </div>
  );
}
