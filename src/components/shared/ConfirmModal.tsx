import React from "react";
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <div
          className="absolute inset-0 bg-slate-900/80 backdrop-blur"
          onClick={handleClose}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/20 bg-white p-6 text-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={handleClose}
              aria-label="Tutup konfirmasi"
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="pt-4">{body}</div>
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} fullscreen={fullscreen}>
      {body}
    </Modal>
  );
};

export default ConfirmModal;
