import { getDefaultSessionTitle } from "@/lib/sessionTitle";
import { MovementOption, WorkoutSession } from "@/types/workout";

export const movementOptions: MovementOption[] = [
  {
    id: "lat-pull-down",
    name: "Lat Pull Down",
    description: "Vertical pull targeting the back.",
  },
  {
    id: "seated-row",
    name: "Seated Row",
    description: "Horizontal pull for mid-back strength.",
  },
  {
    id: "bench-press",
    name: "Bench Press",
    description: "Chest and triceps focus.",
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    description: "Vertical press for shoulders.",
  },
  {
    id: "squat",
    name: "Back Squat",
    description: "Compound lift for legs and core.",
  },
];

export const seedSessions: WorkoutSession[] = [
  {
    id: "session-seed-1",
    createdAt: "2024-06-01T06:00:00.000Z",
    title: getDefaultSessionTitle("2024-06-01T06:00:00.000Z"),
    movements: [
      {
        id: "movement-seed-1",
        name: "Lat Pull Down",
        sets: [
          { id: "set-seed-1", weight: 50, reps: 12, rest: 60 },
          { id: "set-seed-2", weight: 52, reps: 10, rest: 60 },
        ],
      },
      {
        id: "movement-seed-2",
        name: "Seated Row",
        sets: [
          { id: "set-seed-3", weight: 45, reps: 10, rest: 75 },
          { id: "set-seed-4", weight: 45, reps: 8, rest: 75 },
        ],
      },
    ],
  },
  {
    id: "session-seed-2",
    createdAt: "2024-05-31T06:00:00.000Z",
    title: getDefaultSessionTitle("2024-05-31T06:00:00.000Z"),
    movements: [
      {
        id: "movement-seed-3",
        name: "Bench Press",
        sets: [
          { id: "set-seed-5", weight: 60, reps: 8, rest: 90 },
          { id: "set-seed-6", weight: 62, reps: 6, rest: 90 },
        ],
      },
    ],
  },
];
