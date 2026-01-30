"use client";

import { useToast } from "@/ui/use-toast";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-slate-900 text-white border-slate-800",
  success: "bg-emerald-600 text-white border-emerald-700",
  error: "bg-red-600 text-white border-red-700",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
      <div className="flex w-full max-w-sm flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto w-full rounded-lg border px-4 py-3 text-sm shadow-lg",
              toast.open ? "toast-enter" : "toast-leave",
              variantClasses[toast.variant ?? "default"]
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold">{toast.title}</div>
                {toast.description ? (
                  <div className="mt-1 text-xs text-white/90">{toast.description}</div>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close toast"
                onClick={() => dismiss(toast.id)}
                className="rounded-md px-1 text-white/80 transition hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
