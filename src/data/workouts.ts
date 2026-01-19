import { MovementOption, WorkoutSession } from "@/types/workout";

export const movementOptions: MovementOption[] = [
  {
    id: "lat-pull-down",
    name: "Lat Pull Down",
    description: "Tarikan vertikal fokus punggung.",
  },
  {
    id: "seated-row",
    name: "Seated Row",
    description: "Tarikan horizontal untuk punggung tengah.",
  },
  {
    id: "bench-press",
    name: "Bench Press",
    description: "Fokus dada dan tricep.",
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    description: "Dorongan vertikal bahu.",
  },
  {
    id: "squat",
    name: "Back Squat",
    description: "Compound kaki dan core.",
  },
];

const now = Date.now();

export const seedSessions: WorkoutSession[] = [
  {
    id: "session-seed-1",
    createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
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
    createdAt: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
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
