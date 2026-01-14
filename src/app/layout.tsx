import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";

import "aos/dist/aos.css";

import ProgressBarProviders from "@/components/providers/ProgressBar";
import DiarySessionProvider from "@/components/providers/DiarySessionProvider";
import { ToastProvider } from "@/ui/use-toast";
import QueryProvider from "@/components/providers/QueryProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Private Diary", template: "%s | Private Diary" },
  description:
    "Aplikasi diary pribadi dengan blur pintar, PIN asli, dan PIN decoy.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ToastProvider>
            <ProgressBarProviders>
              <DiarySessionProvider>{children}</DiarySessionProvider>
            </ProgressBarProviders>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
