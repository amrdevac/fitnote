import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";

import "aos/dist/aos.css";

import ProgressBarProviders from "@/components/providers/ProgressBar";
import { ToastProvider } from "@/ui/use-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import ServiceWorkerProvider from "@/components/providers/ServiceWorkerProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://fitnote.app"),
  title: {
    default: "FitNote – Mobile Gym Tracker",
    template: "%s | FitNote",
  },
  description: "Catat sesi latihan harian langsung dari perangkat mobile kamu.",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icon-192.png" },
      { url: "/icon-512.png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
  openGraph: {
    type: "website",
    title: "FitNote – Mobile Gym Tracker",
    description: "Catat sesi latihan harian langsung dari perangkat mobile kamu.",
    url: "https://fitnote.app",
    images: ["/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitNote",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="theme-default">
      <body className="antialiased">
        <QueryProvider>
          <ToastProvider>
            <ProgressBarProviders>
              {children}
              <ServiceWorkerProvider />
            </ProgressBarProviders>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
