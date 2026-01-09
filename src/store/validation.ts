import { create } from "zustand";

export type ValidationErrors = Record<string, string[]>;

interface ValidationState {
  errors: ValidationErrors;
  setError: (field: string, messages: string[]) => void;
  clearError: (field: string) => void;
  reset: () => void;
}

export const useValidationStore = create<ValidationState>((set) => ({
  errors: {},
  setError: (field, messages) =>
    set((state) => ({ errors: { ...state.errors, [field]: messages } })),
  clearError: (field) =>
    set((state) => {
      const newErrors = { ...state.errors };
      delete newErrors[field];
      return { errors: newErrors };
    }),
  reset: () => set({ errors: {} }),
}));
