"use client";

import { useMemo, useState } from "react";
import { movementOptions, seedSessions } from "@/data/workouts";
import { WorkoutMovement, WorkoutSession, WorkoutSet } from "@/types/workout";

type WorkoutInputs = {
  weight: string;
  reps: string;
  rest: string;
};

type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

const initialInputs: WorkoutInputs = {
  weight: "",
  reps: "",
  rest: "",
};

const uniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const useWorkoutSession = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>(seedSessions);
  const movementLibrary = useMemo(() => movementOptions, []);
  const [currentMovementId, setCurrentMovementId] = useState<string>(
    movementLibrary[0]?.id ?? ""
  );
  const [inputs, setInputs] = useState<WorkoutInputs>(initialInputs);
  const [currentSets, setCurrentSets] = useState<WorkoutSet[]>([]);
  const [stagedMovements, setStagedMovements] = useState<WorkoutMovement[]>([]);

  function updateInput(field: keyof WorkoutInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function addSet(): ActionResult {
    const weight = Number.parseFloat(inputs.weight);
    const reps = Number.parseInt(inputs.reps, 10);
    const rest = Number.parseInt(inputs.rest, 10);
    if (!inputs.weight || Number.isNaN(weight) || weight <= 0) {
      return { success: false, error: "Isi bobot dengan angka valid." };
    }
    if (!inputs.reps || Number.isNaN(reps) || reps <= 0) {
      return { success: false, error: "Isi jumlah rep dengan angka valid." };
    }
    if (!inputs.rest || Number.isNaN(rest) || rest <= 0) {
      return { success: false, error: "Isi waktu istirahat dengan angka valid." };
    }
    const newSet: WorkoutSet = {
      id: uniqueId(),
      weight,
      reps,
      rest,
    };
    setCurrentSets((prev) => [...prev, newSet]);
    setInputs((prev) => ({ ...prev, weight: "", reps: "", rest: "" }));
    return { success: true };
  }

  function removeSet(id: string) {
    setCurrentSets((prev) => prev.filter((set) => set.id !== id));
  }

  function clearCurrentSets() {
    setCurrentSets([]);
    setInputs(initialInputs);
  }

  function saveMovement(): ActionResult {
    if (!currentMovementId) {
      return { success: false, error: "Pilih gerakan terlebih dahulu." };
    }
    if (!currentSets.length) {
      return { success: false, error: "Tambahkan minimal satu set." };
    }

    const movementName =
      movementLibrary.find((movement) => movement.id === currentMovementId)
        ?.name ?? "Gerakan kustom";

    const newMovement: WorkoutMovement = {
      id: uniqueId(),
      name: movementName,
      sets: currentSets,
    };

    setStagedMovements((prev) => [...prev, newMovement]);
    clearCurrentSets();
    return { success: true };
  }

  function removeMovement(id: string) {
    setStagedMovements((prev) => prev.filter((movement) => movement.id !== id));
  }

  function saveSession(): ActionResult<WorkoutSession> {
    if (!stagedMovements.length) {
      return { success: false, error: "Tambahkan minimal satu gerakan." };
    }
    const newSession: WorkoutSession = {
      id: uniqueId(),
      createdAt: new Date().toISOString(),
      movements: stagedMovements,
    };
    setSessions((prev) => [newSession, ...prev]);
    setStagedMovements([]);
    clearCurrentSets();
    return { success: true, data: newSession };
  }

  function resetBuilder() {
    clearCurrentSets();
    setStagedMovements([]);
  }

  return {
    sessions,
    movementLibrary,
    currentMovementId,
    setCurrentMovementId,
    inputs,
    updateInput,
    currentSets,
    stagedMovements,
    addSet,
    removeSet,
    clearCurrentSets,
    saveMovement,
    removeMovement,
    saveSession,
    resetBuilder,
  };
};

export default useWorkoutSession;
