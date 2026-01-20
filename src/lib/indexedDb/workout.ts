'use client';

import { MovementOption, WorkoutSession } from "@/types/workout";
import { STORE_NAMES, runStoreRequest, runStoreTransaction } from "./base";

const workoutsDb = {
  async getSessions(): Promise<WorkoutSession[]> {
    const rows = await runStoreRequest<WorkoutSession[]>(
      STORE_NAMES.sessions,
      "readonly",
      (store) => store.getAll()
    );
    return (rows ?? []).map((session) => ({ ...session }));
  },

  async saveSession(session: WorkoutSession) {
    await runStoreRequest(STORE_NAMES.sessions, "readwrite", (store) => store.put(session));
  },

  async replaceSessions(sessions: WorkoutSession[]) {
    await runStoreTransaction(STORE_NAMES.sessions, "readwrite", (store) => {
      store.clear();
      sessions.forEach((session) => store.put(session));
    });
  },

  async getMovementOptions(): Promise<MovementOption[]> {
    const rows = await runStoreRequest<MovementOption[]>(
      STORE_NAMES.movements,
      "readonly",
      (store) => store.getAll()
    );
    return (rows ?? []).map((option) => ({ ...option }));
  },

  async saveMovementOption(option: MovementOption) {
    await runStoreRequest(STORE_NAMES.movements, "readwrite", (store) => store.put(option));
  },

  async replaceMovementLibrary(options: MovementOption[]) {
    await runStoreTransaction(STORE_NAMES.movements, "readwrite", (store) => {
      store.clear();
      options.forEach((option) => store.put(option));
    });
  },
};

export default workoutsDb;
