"use client";

import * as React from "react";

type ToastVariant = "default" | "success" | "error";

type ToastOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastOptions & {
  id: string;
  open: boolean;
};

type State = {
  toasts: ToastItem[];
};

type Action =
  | { type: "ADD"; toast: ToastItem }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string };

const TOAST_LIMIT = 3;
const TOAST_DURATION = 2000;
const TOAST_REMOVE_DELAY = 200;

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "DISMISS":
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.id ? { ...toast, open: false } : toast
        ),
      };
    case "REMOVE":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    default:
      return state;
  }
};

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function scheduleRemoval(id: string) {
  if (timeouts.has(id)) return;
  const timeout = setTimeout(() => {
    timeouts.delete(id);
    dispatch({ type: "REMOVE", id });
  }, TOAST_REMOVE_DELAY);
  timeouts.set(id, timeout);
}

function toast(options: ToastOptions) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const duration = options.duration ?? TOAST_DURATION;
  const toastItem: ToastItem = {
    ...options,
    variant: options.variant ?? "default",
    open: true,
    id,
  };

  dispatch({ type: "ADD", toast: toastItem });

  const dismissTimeout = setTimeout(() => {
    dispatch({ type: "DISMISS", id });
    scheduleRemoval(id);
  }, duration);
  timeouts.set(`${id}-dismiss`, dismissTimeout);

  return {
    id,
    dismiss: () => {
      clearTimeout(dismissTimeout);
      dispatch({ type: "DISMISS", id });
      scheduleRemoval(id);
    },
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id: string) => {
      dispatch({ type: "DISMISS", id });
      scheduleRemoval(id);
    },
  };
}

export { useToast, toast };
export type { ToastVariant, ToastOptions };
