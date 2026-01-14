import { NextRequest } from "next/server";
import { turso } from "@/lib/turso/queryBuilder";
import bcrypt from "bcryptjs";
import ApiResponse from "@/lib/apiResponse";
import crypto from "crypto";

type DbUser = {
  id?: number | string;
  username: string;
  password: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = body?.username;
    const password = body?.password;
    if (!username || !password) {
      return ApiResponse.error("Username and password are required", 400);
    }

    let user: DbUser | null = null;
    user = await turso<DbUser>("users").where("username", username).find();

    if (!user) {
      return ApiResponse.error("Invalid User", 401);
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return ApiResponse.error("Invalid User", 401);
    }

    // Create a short-lived signed token to prove prior validation
    const secret = process.env.NEXTAUTH_SECRET || "";
    if (!secret) return ApiResponse.error("Server missing secret", 500);

    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: String(user.id ?? user.username),
      username: user.username,
      iat: now,
      exp: now + 120, // valid 2 minutes
    };
    const base64url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
    const headerB64 = base64url(header);
    const payloadB64 = base64url(payload);
    const data = `${headerB64}.${payloadB64}`;
    const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    const token = `${data}.${sig}`;

    return ApiResponse.success({ token, user: { id: payload.sub, username: payload.username } });
  } catch {
    return ApiResponse.error("Invalid request", 400);
  }
}
