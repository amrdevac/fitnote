export type TimerSegment = {
  id: string;
  exerciseSeconds: number;
  restSeconds: number;
  setRestSeconds: number;
  laps: number;
};

export type ExerciseTimer = {
  id: string;
  name: string;
  createdAt: string;
  leadInSeconds: number;
  workoutLaps: number;
  segments: TimerSegment[];
};
