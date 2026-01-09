"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "ui/label";
import { Input } from "ui/input";
import { User2, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("remember_username");
    if (saved) setUsername(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const resp = await axios.post("/api/auth/check-credentials", { username, password });
      const token = resp?.data?.data?.token as string | undefined;
      if (!token) throw new Error("No token returned");
      const res = await signIn("credentials", { token, redirect: false });
      if (res && !res.error) {
        if (remember) localStorage.setItem("remember_username", username);
        router.push("/dashboard");
      } else {
        setErrorMsg("Failed to establish session");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Login failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] md:min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left hero */}
      <div className="relative hidden md:block overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-fuchsia-500 to-orange-400" />
        <Image
          src="https://picsum.photos/1200/1200?blur=2"
          alt="Background"
          fill
          className="object-cover mix-blend-overlay opacity-60"
          priority
        />
        <div className="relative z-10 h-full w-full px-10 lg:px-16 flex items-center">
          <div className="text-white space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold">Welcome to website</h1>
            <p className="max-w-xl text-white/90 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 lg:px-20 py-16 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-xs tracking-widest text-indigo-600 font-semibold">USER LOGIN</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-indigo-600"
                />
                Remember
              </label>
              <Link href="#" className="text-slate-500 hover:text-slate-800">
                Forgot password?
              </Link>
            </div>

            {errorMsg && (
              <div className="text-sm text-red-600" role="alert">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>

            {/* Social logins */}
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-500">or</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button type="button" variant="outline" onClick={() => signIn("google")}>Google</Button>
              <Button type="button" variant="outline" onClick={() => signIn("github")}>GitHub</Button>
              <Button type="button" variant="outline" onClick={() => signIn("facebook")}>Facebook</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
