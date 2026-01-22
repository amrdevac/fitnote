"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SwipeNavigation from "@/components/SwipeNavigation";
import MobileWorkoutHome from "@/components/workouts/MobileWorkoutHome";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";

export default function Home() {
  const router = useRouter();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const hasBuilderHistoryRef = useRef(false);

  const openBuilder = () => {
    setIsBuilderOpen(true);
  };

  const closeBuilder = () => {
    if (typeof window !== "undefined" && hasBuilderHistoryRef.current) {
      hasBuilderHistoryRef.current = false;
      window.history.back();
    }
    setIsBuilderOpen(false);
  };

  useEffect(() => {
    router.prefetch("/builder");
    router.prefetch("/timers");
  }, [router]);

  useEffect(() => {
    if (!isBuilderOpen || typeof window === "undefined") return;
    if (!hasBuilderHistoryRef.current) {
      window.history.pushState({ builderOpen: true }, "", window.location.href);
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

  return (
    <SwipeNavigation
      rightRoute="/timers"
      onSwipeLeft={openBuilder}
      className="bg-slate-50"
    >
      <main>
        <MobileWorkoutHome onOpenBuilder={openBuilder} />
      </main>
      {isBuilderOpen && (
        <WorkoutBuilder embedded onClose={closeBuilder} />
      )}
    </SwipeNavigation>
  );
}
