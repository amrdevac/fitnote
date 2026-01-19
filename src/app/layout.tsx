import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";

import "aos/dist/aos.css";

import ProgressBarProviders from "@/components/providers/ProgressBar";
import { ToastProvider } from "@/ui/use-toast";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: { default: "Next.js Boiler", template: "%s | Next.js Boiler" },
  description: "Starter project with a couple of ready-to-use examples.",
  metadataBase: new URL("https://example.com"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: { images: ["/logo.png"] },
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
            </ProgressBarProviders>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
