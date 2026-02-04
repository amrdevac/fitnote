"use client";

import { useEffect, useState } from "react";
import { ExerciseTimer } from "@/types/timer";
import timersDb from "@/lib/indexedDb/timers";

const uniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type NewSegmentInput = {
  exerciseSeconds: number;
  restSeconds: number;
  setRestSeconds: number;
  laps: number;
};

const useExerciseTimers = () => {
  const [timers, setTimers] = useState<ExerciseTimer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const storedTimers = await timersDb.getTimers();
        if (cancelled) return;
        const normalized = storedTimers.map((timer) => ({
          ...timer,
          leadInSeconds: timer.leadInSeconds ?? 0,
          workoutLaps: timer.workoutLaps ?? 1,
          segments: timer.segments.map((segment) => ({
            ...segment,
            setRestSeconds: segment.setRestSeconds ?? 0,
          })),
        }));
        setTimers(normalized.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      } catch (error) {
        console.error("Failed to load exercise timers", error);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createTimer(
    name: string,
    segments: NewSegmentInput[],
    leadInSeconds = 0,
    workoutLaps = 1
  ) {
    const newTimer: ExerciseTimer = {
      id: uniqueId(),
      name,
      createdAt: new Date().toISOString(),
      leadInSeconds,
      workoutLaps,
      segments: segments.map((segment) => ({
        ...segment,
        id: uniqueId(),
      })),
    };

    setTimers((prev) => [newTimer, ...prev]);
    try {
      await timersDb.saveTimer(newTimer);
    } catch (error) {
      console.error("Failed to save exercise timer", error);
      setTimers((prev) => prev.filter((timer) => timer.id !== newTimer.id));
      throw error;
    }
  }

  async function deleteTimer(id: string) {
    const prev = timers;
    setTimers((current) => current.filter((timer) => timer.id !== id));
    try {
      await timersDb.deleteTimer(id);
    } catch (error) {
      console.error("Failed to delete exercise timer", error);
      setTimers(prev);
    }
  }

  async function updateTimer(updatedTimer: ExerciseTimer) {
    const prev = timers;
    setTimers((current) =>
      current.map((timer) => (timer.id === updatedTimer.id ? updatedTimer : timer))
    );
    try {
      await timersDb.saveTimer(updatedTimer);
    } catch (error) {
      console.error("Failed to update exercise timer", error);
      setTimers(prev);
      throw error;
    }
  }

  return {
    timers,
    isLoaded,
    createTimer,
    updateTimer,
    deleteTimer,
  };
};

export type { NewSegmentInput };
export default useExerciseTimers;
