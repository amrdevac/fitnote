import { Metadata } from "next";
import MobileWorkoutHome from "@/components/workouts/MobileWorkoutHome";

export const metadata: Metadata = {
  title: "FitNote – Tracker Harian",
  description: "Catat set latihan lewat UI mobile dengan gesture swipe kiri dan tombol plus.",
};

export default function Home() {
  return (
    <main className="bg-slate-50">
      <MobileWorkoutHome />
    </main>
  );
}
