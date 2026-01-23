"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SwipeNavigation from "@/components/SwipeNavigation";
import MobileWorkoutHome from "@/components/workouts/MobileWorkoutHome";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";
import ExerciseTimerManager from "@/components/timers/ExerciseTimerManager";

export default function Home() {
  const router = useRouter();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const hasBuilderHistoryRef = useRef(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const hasTimerHistoryRef = useRef(false);
  const homeRef = useRef<HTMLElement | null>(null);
  const swipeAnimationRef = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);

  const updateHomeProgress = (progress: number) => {
    if (isBuilderOpen || isTimerOpen) return;
    swipeProgressRef.current = progress;
    if (swipeAnimationRef.current) return;
    swipeAnimationRef.current = window.requestAnimationFrame(() => {
      swipeAnimationRef.current = null;
      const node = homeRef.current;
      if (!node) return;
      const clamped = Math.min(1, Math.abs(swipeProgressRef.current));
      const scale = 1 - 0.04 * clamped;
      const opacity = 1 - 0.35 * clamped;
      node.style.transform = `scale(${scale})`;
      node.style.opacity = `${opacity}`;
      node.style.transition =
        swipeProgressRef.current === 0 ? "transform 200ms ease, opacity 200ms ease" : "none";
    });
  };

  const openBuilder = () => {
    setIsTimerOpen(false);
    setIsBuilderOpen(true);
    updateHomeProgress(0);
  };

  const openTimer = () => {
    setIsBuilderOpen(false);
    setIsTimerOpen(true);
    updateHomeProgress(0);
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
    return () => {
      if (swipeAnimationRef.current) {
        cancelAnimationFrame(swipeAnimationRef.current);
      }
    };
  }, []);

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

  return (
    <SwipeNavigation
      onSwipeLeft={openBuilder}
      onSwipeRight={openTimer}
      onSwipeProgress={updateHomeProgress}
      className="bg-slate-50"
    >
      <main ref={homeRef}>
        <MobileWorkoutHome onOpenBuilder={openBuilder} />
      </main>
      {isTimerOpen && (
        <ExerciseTimerManager embedded onClose={closeTimer} />
      )}
      {isBuilderOpen && (
        <WorkoutBuilder embedded onClose={closeBuilder} />
      )}
    </SwipeNavigation>
  );
}
