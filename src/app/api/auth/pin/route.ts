import { matchDiaryPin } from "@/lib/diary/pins";
import { DiaryMode } from "@/types/diary";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "diary_session_mode";

function parseMode(value: string | undefined | null): DiaryMode | null {
  if (value === "real" || value === "decoy") {
    return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const mode = parseMode(request.cookies.get(COOKIE_NAME)?.value);
  return NextResponse.json({ mode });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

  const mode = await matchDiaryPin(pin);
  if (!mode) {
    return NextResponse.json(
      { error: "Pin tidak valid." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ mode });
  response.cookies.set(COOKIE_NAME, mode, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
