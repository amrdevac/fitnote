import { useCallback, useMemo, useState } from "react";

export type ModalBindings = {
  isOpen: boolean;
  onClose: () => void;
};

export function useModal<T = undefined>(init?: { open?: boolean; data?: T }) {
  const [isOpen, setIsOpen] = useState(init?.open ?? false);
  const [data, setData] = useState<T | undefined>(init?.data);

  const open = useCallback((nextData?: T) => {
    if (typeof nextData !== "undefined") setData(nextData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const reset = useCallback(() => {
    setIsOpen(false);
    setData(init?.data);
  }, [init?.data]);

  const bind: ModalBindings = useMemo(
    () => ({ isOpen, onClose: close }),
    [isOpen, close]
  );

  // tempelin ke tombol: <button {...bindTrigger(item)}>Edit</button>
  const bindTrigger = useCallback(
    (nextData?: T) => ({
      onClick: () => open(nextData),
    }),
    [open]
  );

  return {
    // state
    isOpen,
    data,
    setData,

    // actions
    open,
    close,
    toggle,
    reset,

    // helpers
    bind,
    bindTrigger,
  };
}
