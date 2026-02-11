import type { MetadataRoute } from "next";
import { buildAbsoluteUrl, siteOrigin } from "@/lib/config/site";

type ManifestWithSplash = MetadataRoute.Manifest & {
  splash_screens?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: "narrow" | "wide";
  }>;
  screenshots?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: "narrow" | "wide";
  }>;
  shortcuts?: Array<{
    name: string;
    short_name: string;
    description: string;
    url: string;
    icons?: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
  }>;
  related_applications?: Array<{
    platform: string;
    url?: string;
    id?: string;
  }>;
  prefer_related_applications?: boolean;
  display_override?: string[];
  iarc_rating_id?: string;
};

export default function manifest(): ManifestWithSplash {
  const startUrl = buildAbsoluteUrl("/");
  const scope = buildAbsoluteUrl("/");

  return {
    name: "FitNote – Mobile Gym Tracker",
    short_name: "FitNote",
    description: "Log and track your daily gym movements from your mobile device.",
    start_url: startUrl,
    scope,
    display: "standalone",
    orientation: "portrait",
    background_color: "#F1FBF6",
    theme_color: "#F1FBF6",
    display_override: ["standalone"],
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
    iarc_rating_id: "e1a6a4b0-0000-4a1b-b5b5-example000001",
    related_applications: [
      {
        platform: "webapp",
        url: siteOrigin,
      },
    ],
    prefer_related_applications: false,
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
    screenshots: [
      {
        src: "/splash_screen.png",
        sizes: "402x874",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    shortcuts: [
      {
        name: "Log New Session",
        short_name: "Builder",
        description: "Open the builder to log workout sets.",
        url: "/builder",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Manage Timers",
        short_name: "Timers",
        description: "Jump straight to the workout timer settings.",
        url: "/timers",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
