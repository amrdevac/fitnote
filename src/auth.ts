import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import crypto from "crypto";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        token: { label: "Token", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.token) {
          const secret = process.env.NEXTAUTH_SECRET || "";
          try {
            const [h, p, s] = credentials.token.split(".");
            const data = `${h}.${p}`;
            const sig = crypto
              .createHmac("sha256", secret)
              .update(data)
              .digest("base64url");
            if (sig !== s) return null;
            const payload = JSON.parse(Buffer.from(p, "base64url").toString());
            const now = Math.floor(Date.now() / 1000);
            if (typeof payload.exp !== "number" || payload.exp < now)
              return null;
            return { id: payload.sub, name: payload.username } as any;
          } catch {
            return null;
          }
        }
        return null;
      },
    }),
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: { strategy: "jwt", maxAge: 60 * 30 },
};
