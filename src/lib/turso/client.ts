import { createClient } from "@libsql/client";
import { configApp } from "../config/config";

// Use remote Turso/libsql only (no local SQLite fallback)
export const client = createClient({
  url: configApp.turso.TURSO_DATABASE_URL,
  authToken: configApp.turso.TURSO_AUTH_TOKEN,
});
