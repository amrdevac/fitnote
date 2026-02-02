import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./theme.css";

import "aos/dist/aos.css";

import { ThemeProvider } from "next-themes";
import ProgressBarProviders from "@/components/providers/ProgressBar";
import { Toaster } from "@/ui/toaster";
import QueryProvider from "@/components/providers/QueryProvider";
import ServiceWorkerProvider from "@/components/providers/ServiceWorkerProvider";
import { siteOrigin } from "@/lib/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
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
  themeColor: "#F1FBF6",
  other: {
    "navigation-bar-color": "#ffffff",
    "msapplication-navbutton-color": "#ffffff",
  },
  openGraph: {
    type: "website",
    title: "FitNote – Mobile Gym Tracker",
    description: "Catat sesi latihan harian langsung dari perangkat mobile kamu.",
    url: siteOrigin,
    images: ["/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitNote",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="theme-default" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
        >
          <QueryProvider>
            <ProgressBarProviders>
              {children}
              <ServiceWorkerProvider />
              <Toaster />
            </ProgressBarProviders>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
