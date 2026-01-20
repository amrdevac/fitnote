"use client";

import { useEffect } from "react";

const ServiceWorkerProvider = () => {
  useEffect(() => {
    const canRegister = typeof window !== "undefined" && "serviceWorker" in navigator;
    if (!canRegister) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        await registration.update();
        if (process.env.NODE_ENV === "development") {
          console.info("Service worker registered", registration.scope);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("SW registration failed", error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return null;
};

export default ServiceWorkerProvider;
