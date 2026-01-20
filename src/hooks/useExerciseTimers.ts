"use client";

import { useEffect, useState } from "react";
import { ExerciseTimer } from "@/types/timer";
import timersDb from "@/lib/indexedDb/timers";

const uniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type NewSegmentInput = {
  exerciseSeconds: number;
  restSeconds: number;
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
        setTimers(storedTimers.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
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

  async function createTimer(name: string, segments: NewSegmentInput[]) {
    const newTimer: ExerciseTimer = {
      id: uniqueId(),
      name,
      createdAt: new Date().toISOString(),
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

  return {
    timers,
    isLoaded,
    createTimer,
    deleteTimer,
  };
};

export type { NewSegmentInput };
export default useExerciseTimers;
