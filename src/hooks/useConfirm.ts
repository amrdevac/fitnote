import { useState } from "react";
import { Confirm } from "types/confirm";

export const useConfirm = () => {
  const [confirm, setConfirm] = useState<Confirm.State>(new Confirm.State());

  const openConfirm = (options: Confirm.Options) =>
    setConfirm({ ...options, isOpen: true });

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, isOpen: false }));

  return { confirm, openConfirm, closeConfirm };
};
