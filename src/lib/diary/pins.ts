import bcrypt from "bcryptjs";
import { client } from "@/lib/turso/client";
import { DiaryMode } from "@/types/diary";
import { configApp } from "@/lib/config/config";
import { isPinFormatValid } from "@/lib/diary/pinRules";
import { DiaryPinStatus } from "@/types/diaryPin";

const TABLE = "diary_pin_settings";
const SINGLETON_ID = 1;
const HASH_ROUNDS = 10;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${TABLE} (
    id INTEGER PRIMARY KEY CHECK (id = ${SINGLETON_ID}),
    master_pin_hash TEXT NOT NULL,
    decoy_pin_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

interface DiaryPinSettingsRow {
  id: number;
  master_pin_hash: string;
  decoy_pin_hash?: string | null;
  created_at: string;
  updated_at: string;
}

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  await client.execute({ sql: CREATE_TABLE_SQL });
  ensured = true;
}

async function readPinRow(): Promise<DiaryPinSettingsRow | null> {
  await ensureTable();
  const res = await client.execute({
    sql: `SELECT id, master_pin_hash, decoy_pin_hash, created_at, updated_at FROM ${TABLE} WHERE id = ? LIMIT 1`,
    args: [SINGLETON_ID],
  });
  const row = res.rows[0];
  if (!row) return null;
  return row as unknown as DiaryPinSettingsRow;
}

function normalizeEnvPin(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  return isPinFormatValid(trimmed) ? trimmed : null;
}

function getEnvPins() {
  return {
    masterPin: normalizeEnvPin(configApp.diary.master_pin),
    decoyPin: normalizeEnvPin(configApp.diary.decoy_pin),
  };
}

export async function getPinStatus(): Promise<DiaryPinStatus> {
  const row = await readPinRow();
  return {
    hasMaster: Boolean(row?.master_pin_hash),
    hasDecoy: Boolean(row?.decoy_pin_hash),
    updatedAt: row?.updated_at ?? null,
    needsSetup: !row?.master_pin_hash,
  };
}

export async function matchDiaryPin(pin: string): Promise<DiaryMode | null> {
  if (!pin) return null;
  const envPins = getEnvPins();
  if (envPins.masterPin && pin === envPins.masterPin) {
    return "real";
  }
  if (envPins.decoyPin && pin === envPins.decoyPin) {
    return "decoy";
  }
  const row = await readPinRow();
  if (row?.master_pin_hash) {
    const ok = await bcrypt.compare(pin, row.master_pin_hash);
    if (ok) return "real";
  }
  if (row?.decoy_pin_hash) {
    const ok = await bcrypt.compare(pin, row.decoy_pin_hash);
    if (ok) return "decoy";
  }
  return null;
}

export async function savePinSettings(params: {
  masterPin?: string;
  decoyPin?: string | null;
}): Promise<DiaryPinStatus> {
  if (params.masterPin === undefined && params.decoyPin === undefined) {
    throw new Error("Tidak ada perubahan PIN.");
  }
  const row = await readPinRow();

  if (params.masterPin && !isPinFormatValid(params.masterPin)) {
    throw new Error("Format master PIN tidak valid.");
  }
  if (
    params.decoyPin &&
    !isPinFormatValid(params.decoyPin)
  ) {
    throw new Error("Format decoy PIN tidak valid.");
  }

  const hashedMaster = params.masterPin
    ? await bcrypt.hash(params.masterPin, HASH_ROUNDS)
    : undefined;
  const hashedDecoy =
    params.decoyPin === undefined
      ? undefined
      : params.decoyPin
      ? await bcrypt.hash(params.decoyPin, HASH_ROUNDS)
      : null;

  if (!row) {
    if (!hashedMaster) {
      throw new Error("Master PIN harus diset pertama kali.");
    }
    await client.execute({
      sql: `INSERT INTO ${TABLE} (id, master_pin_hash, decoy_pin_hash) VALUES (?, ?, ?)`,
      args: [SINGLETON_ID, hashedMaster, hashedDecoy ?? null],
    });
  } else {
    const sets: string[] = [];
    const args: (string | null)[] = [];
    if (hashedMaster) {
      sets.push("master_pin_hash = ?");
      args.push(hashedMaster);
    }
    if (hashedDecoy !== undefined) {
      sets.push("decoy_pin_hash = ?");
      args.push(hashedDecoy);
    }
    if (!sets.length) {
      throw new Error("Tidak ada perubahan PIN.");
    }
    sets.push("updated_at = datetime('now')");
    const sql = `UPDATE ${TABLE} SET ${sets.join(", ")} WHERE id = ?`;
    args.push(SINGLETON_ID);
    await client.execute({ sql, args });
  }

  return getPinStatus();
}
