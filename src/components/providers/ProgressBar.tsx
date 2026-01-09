"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { useEffect, useState } from "react";
import AOS from "aos";

const ProgressBarProviders = ({ children }: { children: React.ReactNode }) => {
  const [color, setColor] = useState("#4f46e5"); // default blue

  useEffect(() => {
    AOS.init({ duration: 600, once: true });

    const updateColor = () => {
      const root = document.documentElement;
      const primary = getComputedStyle(root).getPropertyValue("--brand");
      if (primary) setColor(primary.trim());
    };

    updateColor();
  }, []);

  return (
    <ProgressProvider
      height="4px"
      color={color}
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};

export default ProgressBarProviders;
