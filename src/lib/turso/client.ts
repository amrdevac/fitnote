import { Client, createClient } from "@libsql/client";
import { configApp } from "../config/config";

let cachedClient: Client | null = null;

function createTursoClient(): Client {
  if (!configApp.turso.TURSO_DATABASE_URL || !configApp.turso.TURSO_AUTH_TOKEN) {
    throw new Error(
      "Turso client is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env variables."
    );
  }

  if (!cachedClient) {
    cachedClient = createClient({
      url: configApp.turso.TURSO_DATABASE_URL,
      authToken: configApp.turso.TURSO_AUTH_TOKEN,
    });
  }

  return cachedClient;
}

export function getTursoClient(): Client | null {
  if (!configApp.turso.TURSO_DATABASE_URL || !configApp.turso.TURSO_AUTH_TOKEN) {
    return null;
  }
  return createTursoClient();
}

export function ensureTursoClient(): Client {
  return createTursoClient();
}
