import { XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnEsc?: boolean;
  zIndex?: string;
  fullscreen?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnEsc = true,
  zIndex = "z-50",
  fullscreen = false,
}) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 ${fullscreen ? "bg-slate-900/80 backdrop-blur-sm" : "bg-black/30"} ${zIndex} flex justify-center items-center p-4 transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${
          fullscreen
            ? "w-full max-w-xl rounded-3xl border border-white/10 bg-white/95 shadow-2xl"
            : "bg-white rounded-lg shadow-2xl w-full max-w-2xl"
        } max-h-[90vh] flex flex-col transition-transform duration-200 ${isOpen ? "scale-100" : "scale-95"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-between items-center p-4 ${fullscreen ? "border-b border-slate-200" : "border-b border-slate-200"}`}>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
