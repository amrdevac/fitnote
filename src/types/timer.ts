export type TimerSegment = {
  id: string;
  exerciseSeconds: number;
  restSeconds: number;
  laps: number;
};

export type ExerciseTimer = {
  id: string;
  name: string;
  createdAt: string;
  segments: TimerSegment[];
};
