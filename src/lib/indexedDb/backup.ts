"use client";

import { MovementOption, WorkoutSession } from "@/types/workout";
import { ExerciseTimer } from "@/types/timer";
import { Service } from "@/data/services";
import preferencesDb, { defaultPreferences, FitnotePreferences } from "./preferences";
import timersDb from "./timers";
import workoutsDb from "./workout";
import { STORE_NAMES, runStoreRequest, runStoreTransaction } from "./base";

export type FitnoteBackup = {
  version: 1;
  exportedAt: string;
  data: {
    sessions: WorkoutSession[];
    movements: MovementOption[];
    preferences: FitnotePreferences | null;
    timers: ExerciseTimer[];
    services: Service.Type[];
  };
};

const normalizeArray = <T>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value as T[];
};

const normalizePreferences = (value: unknown): FitnotePreferences | null => {
  if (!value || typeof value !== "object") return null;
  return { ...defaultPreferences, ...(value as FitnotePreferences) };
};

export const exportFitnoteBackup = async (): Promise<FitnoteBackup> => {
  const [sessions, movements, preferences, timers, services] = await Promise.all([
    workoutsDb.getSessions(),
    workoutsDb.getMovementOptions(),
    preferencesDb.get().catch(() => defaultPreferences),
    timersDb.getTimers(),
    runStoreRequest<Service.Type[]>(
      STORE_NAMES.services,
      "readonly",
      (store) => store.getAll()
    ),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      sessions,
      movements,
      preferences,
      timers,
      services: services ?? [],
    },
  };
};

export const importFitnoteBackup = async (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Format backup tidak valid.");
  }

  const backup = payload as { data?: unknown };
  if (!backup.data || typeof backup.data !== "object") {
    throw new Error("Format backup tidak valid.");
  }

  const data = backup.data as Record<string, unknown>;
  const sessions = normalizeArray<WorkoutSession>(data.sessions);
  const movements = normalizeArray<MovementOption>(data.movements);
  const timers = normalizeArray<ExerciseTimer>(data.timers);
  const services = normalizeArray<Service.Type>(data.services);
  const preferences = normalizePreferences(data.preferences);

  await Promise.all([
    workoutsDb.replaceSessions(sessions),
    workoutsDb.replaceMovementLibrary(movements),
    timersDb.replaceTimers(timers),
    preferencesDb.save(preferences ?? defaultPreferences),
    runStoreTransaction(STORE_NAMES.services, "readwrite", (store) => {
      store.clear();
      services.forEach((service) => store.put(service));
    }),
  ]);
};
