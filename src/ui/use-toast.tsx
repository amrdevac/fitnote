"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

const ToastContext = React.createContext<{
  toasts: ToastMessage[];
  toast: (t: Omit<ToastMessage, "id">) => void;
}>({ toasts: [], toast: () => {} });

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback(
    (t: Omit<ToastMessage, "id">) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[70] flex flex-col items-end gap-3 p-4 sm:p-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg ring-1 ring-black/5 transition",
              toast.variant === "destructive" && "border-red-200 bg-red-25 text-red-700"
            )}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-slate-500 mt-1">{toast.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => React.useContext(ToastContext);
