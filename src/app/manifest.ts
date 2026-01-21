import type { MetadataRoute } from "next";

type ManifestWithSplash = MetadataRoute.Manifest & {
  splash_screens?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: "narrow" | "wide";
  }>;
};

export default function manifest(): ManifestWithSplash {
  return {
    name: "FitNote – Mobile Gym Tracker",
    short_name: "FitNote",
    description: "Catat dan pantau gerakan gym harian langsung dari perangkat mobile.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    splash_screens: [
      {
        src: "/splash_screen.png",
        sizes: "402x874",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/splash_screen.png",
        sizes: "402x874",
        type: "image/png",
        form_factor: "wide",
      },
    ],
  };
}
