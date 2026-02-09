"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MobileWorkoutHome from "@/components/workouts/MobileWorkoutHome";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";
import ExerciseTimerList from "@/components/timers/ExerciseTimerList";
import BottomNav from "@/components/shared/BottomNav";

export default function Home() {
  const router = useRouter();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const hasBuilderHistoryRef = useRef(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const hasTimerHistoryRef = useRef(false);

  const openBuilder = () => {
    setIsTimerOpen(false);
    setIsBuilderOpen(true);
  };

  const openTimer = () => {
    setIsBuilderOpen(false);
    setIsTimerOpen(true);
  };

  const closeBuilder = () => {
    if (typeof window !== "undefined" && hasBuilderHistoryRef.current) {
      hasBuilderHistoryRef.current = false;
      window.history.back();
    }
    setIsBuilderOpen(false);
  };

  const closeTimer = () => {
    if (typeof window !== "undefined" && hasTimerHistoryRef.current) {
      hasTimerHistoryRef.current = false;
      window.history.back();
    }
    setIsTimerOpen(false);
  };

  useEffect(() => {
    router.prefetch("/builder");
    router.prefetch("/timers");
  }, [router]);

  useEffect(() => {
    if (!isBuilderOpen || typeof window === "undefined") return;
    if (!hasBuilderHistoryRef.current) {
      window.history.pushState({ builderOpen: true }, "", "/builder");
      hasBuilderHistoryRef.current = true;
    }
    const handlePopState = () => {
      if (!hasBuilderHistoryRef.current) return;
      hasBuilderHistoryRef.current = false;
      setIsBuilderOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isBuilderOpen]);

  useEffect(() => {
    if (!isTimerOpen || typeof window === "undefined") return;
    if (!hasTimerHistoryRef.current) {
      window.history.pushState({ timerOpen: true }, "", "/timers");
      hasTimerHistoryRef.current = true;
    }
    const handlePopState = () => {
      if (!hasTimerHistoryRef.current) return;
      hasTimerHistoryRef.current = false;
      setIsTimerOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isTimerOpen]);

  const showBottomNav = !isTimerOpen && !isBuilderOpen;

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <main>
        <MobileWorkoutHome onOpenBuilder={openBuilder} />
      </main>

      {isTimerOpen && <ExerciseTimerList embedded onClose={closeTimer} />}
      {isBuilderOpen && <WorkoutBuilder embedded onClose={closeBuilder} />}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
