import DiaryDashboard from "@/components/feature/diary/DiaryDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diary Rahasia",
  description: "Aplikasi diary dengan blur pintar dan PIN asli + decoy.",
};

export default function Home() {
  return <DiaryDashboard />;
}
