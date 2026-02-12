import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
  lastUpdatedAt: number | null;
  currentStepExtraSeconds: number;
  lastRestCompletedSeconds: number | null;
  lastRestCompletedAt: number | null;
  restSyncEnabled: boolean;
  loadTimer: (timer: ExerciseTimer) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  adjustSeconds: (delta: number) => void;
  tick: () => void;
  setRestSyncEnabled: (enabled: boolean) => void;
};

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  key: () => null,
  length: 0,
  clear: () => {},
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

const advanceQueueBySeconds = (
  queue: PlayerStep[],
  startIndex: number,
  startRemaining: number,
  elapsedSeconds: number,
) => {
  if (!queue.length || elapsedSeconds <= 0) {
    return { currentIndex: startIndex, remainingSeconds: startRemaining, status: "running" as PlayerStatus };
  }
  let currentIndex = Math.min(startIndex, queue.length - 1);
  let remainingSeconds = Math.max(0, startRemaining);
  let secondsLeft = elapsedSeconds;

  while (secondsLeft > 0) {
    if (remainingSeconds > 1) {
      const dec = Math.min(remainingSeconds - 1, secondsLeft);
      remainingSeconds -= dec;
      secondsLeft -= dec;
      if (secondsLeft <= 0) break;
    }

    secondsLeft -= 1;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      return { currentIndex, remainingSeconds: 0, status: "finished" as PlayerStatus };
    }
    currentIndex = nextIndex;
    remainingSeconds = queue[currentIndex]?.duration ?? 0;
  }

  return { currentIndex, remainingSeconds, status: "running" as PlayerStatus };
};

export const useTabataPlayerStore = create<TabataPlayerStore>()(
  persist(
    (set, get) => ({
      currentTimerId: null,
      currentTimerName: null,
      queue: [],
      currentIndex: 0,
      remainingSeconds: 0,
      status: "idle",
      lastUpdatedAt: null,
      currentStepExtraSeconds: 0,
      lastRestCompletedSeconds: null,
      lastRestCompletedAt: null,
      restSyncEnabled: false,
      loadTimer: (timer) => {
        const queue = buildQueue(timer);
        set({
          currentTimerId: timer.id,
          currentTimerName: timer.name,
          queue,
          currentIndex: 0,
          remainingSeconds: queue[0]?.duration ?? 0,
          status: queue.length ? "paused" : "idle",
          lastUpdatedAt: Date.now(),
          currentStepExtraSeconds: 0,
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
            lastUpdatedAt: Date.now(),
          });
          return;
        }
        if (status === "idle") {
          set({
            currentIndex,
            remainingSeconds: queue[currentIndex]?.duration ?? 0,
            status: "running",
            lastUpdatedAt: Date.now(),
          });
          return;
        }
        if (status === "paused") {
          set({ status: "running", lastUpdatedAt: Date.now() });
        }
      },
      pause: () => set({ status: "paused", lastUpdatedAt: Date.now() }),
      reset: () => {
        const { queue } = get();
        set({
          currentIndex: 0,
          remainingSeconds: queue[0]?.duration ?? 0,
          status: queue.length ? "paused" : "idle",
          lastUpdatedAt: Date.now(),
          currentStepExtraSeconds: 0,
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
          lastUpdatedAt: Date.now(),
          currentStepExtraSeconds: 0,
        });
      },
      next: () => {
        const { queue, currentIndex } = get();
        const nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          set({ status: "finished", remainingSeconds: 0, lastUpdatedAt: Date.now() });
          return;
        }
        set({
          currentIndex: nextIndex,
          remainingSeconds: queue[nextIndex].duration,
          lastUpdatedAt: Date.now(),
          currentStepExtraSeconds: 0,
        });
      },
      prev: () => {
        const { queue, currentIndex } = get();
        if (!queue.length) return;
        const prevIndex = Math.max(0, currentIndex - 1);
        set({
          currentIndex: prevIndex,
          remainingSeconds: queue[prevIndex].duration,
          lastUpdatedAt: Date.now(),
          currentStepExtraSeconds: 0,
        });
      },
      adjustSeconds: (delta) => {
        set((state) => {
          const nextRemaining = Math.max(1, state.remainingSeconds + delta);
          const appliedDelta = nextRemaining - state.remainingSeconds;
          return {
            remainingSeconds: nextRemaining,
            currentStepExtraSeconds: state.currentStepExtraSeconds + appliedDelta,
            lastUpdatedAt: Date.now(),
          };
        });
      },
      tick: () => {
        const { status, remainingSeconds, queue, currentIndex, currentStepExtraSeconds } = get();
        if (status !== "running" || !queue.length) return;
        if (remainingSeconds > 1) {
          set({ remainingSeconds: remainingSeconds - 1, lastUpdatedAt: Date.now() });
          return;
        }
        const currentStep = queue[currentIndex];
        const nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          set({ status: "finished", remainingSeconds: 0, lastUpdatedAt: Date.now() });
          return;
        }
        set({
          currentIndex: nextIndex,
          remainingSeconds: queue[nextIndex].duration,
          lastUpdatedAt: Date.now(),
          currentStepExtraSeconds: 0,
          lastRestCompletedSeconds:
            currentStep?.type === "rest" || currentStep?.type === "setRest"
              ? currentStep.duration + currentStepExtraSeconds
              : null,
          lastRestCompletedAt:
            currentStep?.type === "rest" || currentStep?.type === "setRest"
              ? Date.now()
              : null,
        });
      },
      setRestSyncEnabled: (enabled) => set({ restSyncEnabled: enabled }),
    }),
    {
      name: "fitnote:tabata-player",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      partialize: (state) => ({
        currentTimerId: state.currentTimerId,
        currentTimerName: state.currentTimerName,
        queue: state.queue,
        currentIndex: state.currentIndex,
        remainingSeconds: state.remainingSeconds,
        status: state.status,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.queue.length) {
          state.status = "idle";
          state.lastUpdatedAt = null;
          return;
        }
        const now = Date.now();
        if (state.status === "running" && state.lastUpdatedAt) {
          const elapsedSeconds = Math.floor((now - state.lastUpdatedAt) / 1000);
          if (elapsedSeconds > 0) {
            const advanced = advanceQueueBySeconds(
              state.queue,
              state.currentIndex,
              state.remainingSeconds,
              elapsedSeconds,
            );
            state.currentIndex = advanced.currentIndex;
            state.remainingSeconds = advanced.remainingSeconds;
            state.status = advanced.status;
          }
        }
        state.lastUpdatedAt = now;
      },
    },
  ),
);
