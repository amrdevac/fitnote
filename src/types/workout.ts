export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  rest: number;
};

export type WorkoutMovement = {
  id: string;
  name: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  createdAt: string;
  movements: WorkoutMovement[];
  archivedAt?: string;
};

export type MovementOption = {
  id: string;
  name: string;
  description: string;
};
