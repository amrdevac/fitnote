import React from "react";
import { createPortal } from "react-dom";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  autoFocusConfirm?: boolean;
  fullscreen?: boolean;
  variant?: "default" | "overlay";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  autoFocusConfirm = false,
  fullscreen = false,
  variant = "default",
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onCancel();
    }
  };

  React.useEffect(() => {
    if (!isOpen || variant !== "overlay") return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!loading) {
          onCancel();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, variant, loading, onCancel]);

  const body = (
    <>
      <p className="text-slate-700">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} type="button" disabled={loading}>
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} type="button" disabled={loading} autoFocus={autoFocusConfirm}>
          {loading && <Loader2 className="animate-spin" />}
          {confirmText}
        </Button>
      </div>
    </>
  );

  if (variant === "overlay") {
    if (!isOpen) return null;
    if (typeof document === "undefined") return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
        <div
          className="absolute inset-0 bg-slate-900/70 backdrop-blur"
          onClick={handleClose}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-sm rounded-[28px] border border-violet-100 bg-violet-50/90 px-6 py-5 text-slate-900 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-violet-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
            </div>
            <button
              onClick={handleClose}
              aria-label="Tutup konfirmasi"
              className="rounded-full p-1 text-violet-400 hover:bg-violet-100"
              type="button"
            >
              {/* <X className="h-4 w-4" /> */}
            </button>
          </div>
          <div className="mt-5 flex justify-end gap-5">
            <Button
              variant="ghost"
              onClick={onCancel}
              type="button"
              disabled={loading}
              className="h-auto px-0 text-sm font-semibold uppercase tracking-wide text-violet-500 hover:bg-transparent hover:text-violet-700"
            >
              {cancelText}
            </Button>
            <Button
              variant="ghost"
              onClick={handleConfirm}
              type="button"
              disabled={loading}
              autoFocus={autoFocusConfirm}
              className="h-auto px-0 text-sm font-semibold uppercase tracking-wide text-violet-600 hover:bg-transparent hover:text-violet-800"
            >
              {loading && <Loader2 className="animate-spin" />}
              {confirmText}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} fullscreen={fullscreen}>
      {body}
    </Modal>
  );
};

export default ConfirmModal;
