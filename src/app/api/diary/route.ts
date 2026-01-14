import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso/queryBuilder";
import { client } from "@/lib/turso/client";
import {
  DiaryEntryRecord,
  DiaryMode,
  mapDiaryRecord,
  MentionReference,
} from "@/types/diary";
import { encodeMentions } from "@/lib/mentions";

const COOKIE_NAME = "diary_session_mode";
const TABLE = "diary_entries";
const MAX_LENGTH = 1000;

function readSessionMode(request: NextRequest): DiaryMode | null {
  const value = request.cookies.get(COOKIE_NAME)?.value;
  if (value === "real" || value === "decoy") {
    return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const mode = readSessionMode(request);
  if (!mode) {
    return NextResponse.json(
      { error: "Pin diperlukan." },
      { status: 401 }
    );
  }

  const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "10");
  const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? "0");
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 10;
  const safeCursor = Number.isFinite(cursor) && cursor > 0 ? cursor : 0;

  const args: (string | number)[] = [mode === "decoy" ? 1 : 0];
  let sql = `SELECT * FROM ${TABLE} WHERE is_decoy = ?`;
  if (search) {
    sql += ` AND LOWER(content) LIKE ?`;
    args.push(`%${search}%`);
  }
  if (safeCursor) {
    sql += ` AND id < ?`;
    args.push(safeCursor);
  }
  sql += ` ORDER BY id DESC LIMIT ?`;
  args.push(safeLimit + 1);

  const raw = await client.execute({ sql, args });
  const entries = raw.rows as unknown as DiaryEntryRecord[];

  const mapped = entries.map(mapDiaryRecord);
  const filtered = search
    ? mapped.filter((entry) => entry.content.toLowerCase().includes(search))
    : mapped;

  const hasMore = filtered.length > safeLimit;
  const pagedEntries = hasMore ? filtered.slice(0, safeLimit) : filtered;
  const nextCursor = hasMore ? pagedEntries[pagedEntries.length - 1]?.id : null;

  return NextResponse.json({
    entries: pagedEntries,
    mode,
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
  const mode = readSessionMode(request);
  if (!mode) {
    return NextResponse.json(
      { error: "Pin diperlukan." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const content =
    typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: "Tulisan tidak boleh kosong." },
      { status: 400 }
    );
  }
  if (content.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Tulisan terlalu panjang (maks ${MAX_LENGTH} karakter).` },
      { status: 400 }
    );
  }

  const requestedMode = body?.targetMode as DiaryMode | undefined;
  const target =
    requestedMode === "real" || requestedMode === "decoy"
      ? requestedMode
      : mode;

  if (mode === "decoy" && target === "real") {
    return NextResponse.json(
      { error: "Decoy pin tidak bisa menulis diary asli." },
      { status: 403 }
    );
  }

  const mentionsInput: MentionReference[] = Array.isArray(body?.mentions)
    ? body.mentions
        .map((mention: any) => ({
          id: Number(mention?.id),
          preview:
            typeof mention?.preview === "string"
              ? mention.preview.slice(0, 200)
              : "",
          createdAt:
            typeof mention?.createdAt === "string"
              ? mention.createdAt
              : new Date().toISOString(),
        }))
        .filter((mention) => Number.isFinite(mention.id) && mention.preview)
    : [];

  const storedContent = encodeMentions(content, mentionsInput);

  const inserted = await client.execute({
    sql: `INSERT INTO ${TABLE} (content, is_decoy) VALUES (?, ?) RETURNING *`,
    args: [storedContent, target === "decoy" ? 1 : 0],
  });
  const record = inserted.rows[0] as unknown as DiaryEntryRecord | undefined;
  if (!record) {
    return NextResponse.json({ error: "Gagal menyimpan catatan." }, { status: 500 });
  }

  return NextResponse.json({ success: true, entry: mapDiaryRecord(record) });
}

export async function DELETE(request: NextRequest) {
  const mode = readSessionMode(request);
  if (!mode) {
    return NextResponse.json({ error: "Pin diperlukan." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entryId =
    typeof body?.id === "number" ? body.id : Number(body?.id ?? NaN);
  if (!Number.isFinite(entryId)) {
    return NextResponse.json({ error: "ID entry tidak valid." }, { status: 400 });
  }

  const entry = await turso<DiaryEntryRecord>(TABLE).where("id", entryId).find();
  if (!entry) {
    return NextResponse.json({ error: "Entry tidak ditemukan." }, { status: 404 });
  }

  const isDecoy = entry.is_decoy === 1;
  if (isDecoy !== (mode === "decoy")) {
    return NextResponse.json({ error: "Tidak boleh menghapus entry mode lain." }, { status: 403 });
  }

  await turso<DiaryEntryRecord>(TABLE).where("id", entryId).delete();
  return NextResponse.json({ success: true });
}
