import { Metadata } from "next";
import LandingPage from "@/components/contents/LandingPageContent";
import ExampleServiceShowcase from "@/components/examples/ExampleServiceShowcase";

export const metadata: Metadata = {
  title: "Next.js Boiler Home",
  description: "Boilerplate landing page plus hook + API contoh.",
};

export default function Home() {
  return (
    <main className="flex flex-col gap-16 pb-16">
      <LandingPage />
      <ExampleServiceShowcase />
    </main>
  );
}
