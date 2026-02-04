import { create } from "zustand";
import type { ExerciseTimer } from "@/types/timer";
import { useTimerSettings } from "@/store/timerSettings";

type PlayerStatus = "idle" | "running" | "paused" | "finished";

type PlayerStep = {
  id: string;
  type: "work" | "rest" | "setRest" | "leadIn";
  label: string;
  duration: number;
  segmentIndex: number;
  lapIndex: number;
};

type TabataPlayerStore = {
  currentTimerId: string | null;
  currentTimerName: string | null;
  queue: PlayerStep[];
  currentIndex: number;
  remainingSeconds: number;
  status: PlayerStatus;
  loadTimer: (timer: ExerciseTimer) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  adjustSeconds: (delta: number) => void;
  tick: () => void;
};

const buildQueue = (timer: ExerciseTimer): PlayerStep[] => {
  const steps: PlayerStep[] = [];
  const leadInSeconds = useTimerSettings.getState().leadInSeconds;
  if (leadInSeconds > 0) {
    steps.push({
      id: `${timer.id}-lead-in`,
      type: "leadIn",
      label: "Aba-aba",
      duration: leadInSeconds,
      segmentIndex: -1,
      lapIndex: 0,
    });
  }
  const workoutLoops = Math.max(1, timer.workoutLaps ?? 1);
  for (let workoutIndex = 0; workoutIndex < workoutLoops; workoutIndex += 1) {
    timer.segments.forEach((segment, segmentIndex) => {
      for (let lapIndex = 0; lapIndex < segment.laps; lapIndex += 1) {
        if (segment.exerciseSeconds > 0) {
          steps.push({
            id: `${segment.id}-work-${workoutIndex}-${lapIndex}`,
            type: "work",
            label: "Gerak",
            duration: segment.exerciseSeconds,
            segmentIndex,
            lapIndex,
          });
        }
        if (segment.restSeconds > 0) {
          steps.push({
            id: `${segment.id}-rest-${workoutIndex}-${lapIndex}`,
            type: "rest",
            label: "Rest",
            duration: segment.restSeconds,
            segmentIndex,
            lapIndex,
          });
        }
      }

      if (segmentIndex < timer.segments.length - 1 && segment.setRestSeconds > 0) {
        steps.push({
          id: `${segment.id}-set-rest-${workoutIndex}`,
          type: "setRest",
          label: "Rest per set",
          duration: segment.setRestSeconds,
          segmentIndex,
          lapIndex: segment.laps,
        });
      }
    });
  }
  return steps;
};

export const useTabataPlayerStore = create<TabataPlayerStore>((set, get) => ({
  currentTimerId: null,
  currentTimerName: null,
  queue: [],
  currentIndex: 0,
  remainingSeconds: 0,
  status: "idle",
  loadTimer: (timer) => {
    const queue = buildQueue(timer);
    set({
      currentTimerId: timer.id,
      currentTimerName: timer.name,
      queue,
      currentIndex: 0,
      remainingSeconds: queue[0]?.duration ?? 0,
      status: queue.length ? "paused" : "idle",
    });
  },
  play: () => {
    const { queue, status, currentIndex } = get();
    if (!queue.length) return;
    if (status === "finished") {
      set({
        currentIndex: 0,
        remainingSeconds: queue[0]?.duration ?? 0,
        status: "running",
      });
      return;
    }
    if (status === "idle") {
      set({
        currentIndex,
        remainingSeconds: queue[currentIndex]?.duration ?? 0,
        status: "running",
      });
      return;
    }
    if (status === "paused") {
      set({ status: "running" });
    }
  },
  pause: () => set({ status: "paused" }),
  reset: () => {
    const { queue } = get();
    set({
      currentIndex: 0,
      remainingSeconds: queue[0]?.duration ?? 0,
      status: queue.length ? "paused" : "idle",
    });
  },
  stop: () => {
    set({
      currentTimerId: null,
      currentTimerName: null,
      queue: [],
      currentIndex: 0,
      remainingSeconds: 0,
      status: "idle",
    });
  },
  next: () => {
    const { queue, currentIndex } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      set({ status: "finished", remainingSeconds: 0 });
      return;
    }
    set({ currentIndex: nextIndex, remainingSeconds: queue[nextIndex].duration });
  },
  prev: () => {
    const { queue, currentIndex } = get();
    if (!queue.length) return;
    const prevIndex = Math.max(0, currentIndex - 1);
    set({ currentIndex: prevIndex, remainingSeconds: queue[prevIndex].duration });
  },
  adjustSeconds: (delta) => {
    set((state) => ({
      remainingSeconds: Math.max(1, state.remainingSeconds + delta),
    }));
  },
  tick: () => {
    const { status, remainingSeconds, queue, currentIndex } = get();
    if (status !== "running" || !queue.length) return;
    if (remainingSeconds > 1) {
      set({ remainingSeconds: remainingSeconds - 1 });
      return;
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      set({ status: "finished", remainingSeconds: 0 });
      return;
    }
    set({ currentIndex: nextIndex, remainingSeconds: queue[nextIndex].duration });
  },
}));
