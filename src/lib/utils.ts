import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseToArray = (raw: string): string[] => {
  if (!raw || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
    }
    return [typeof parsed === "string" ? parsed : JSON.stringify(parsed)];
  } catch {
    return [raw];
  }
};
