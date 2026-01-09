"use client";

import { useEffect, useMemo, useState } from "react";
import { useDiarySession } from "@/components/providers/DiarySessionProvider";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import DiaryPinQuickSettings from "./DiaryPinQuickSettings";

const SHORTCUTS = [
  {
    title: "Buka daftar shortkey",
    description: "Tampilkan modal shortcut ini kapan pun.",
    combo: "Ctrl + Alt + K",
  },
  {
    title: "Lock screen",
    description: "Shortcut panik buat munculin PIN kapan aja.",
    combo: "Ctrl + K + L",
  },
  {
    title: "Fokus ke composer",
    description: "Langsung arahkan kursor ke area tulis.",
    combo: "Ctrl + Alt + I",
  },
  {
    title: "Tahan blur composer",
    description: "Saat composer fokus, tahan kombinasi ini biar teks kelihatan.",
    combo: "Ctrl + Alt + S",
  },
  {
    title: "Kirim cepat",
    description: "Saat fokus di composer, tekan buat langsung posting.",
    combo: "Ctrl + Enter",
  },
  {
    title: "Navigasi timeline",
    description: "Gunakan Arrow untuk pindah antar entri, tahan Shift buat pilih rentang.",
    combo: "Arrow / Shift + Arrow",
  },
  {
    title: "Hapus entri timeline",
    description: "Setelah memilih entri, tekan Delete untuk buka konfirmasi hapus.",
    combo: "Delete",
  },
  {
    title: "Tahan blur timeline",
    description: "Saat fokus di timeline, tahan kombinasi ini buat lihat entri aktif.",
    combo: "Ctrl + Alt + S",
  },
  {
    title: "Mention entri timeline",
    description: "Saat fokus di timeline, tambahkan entri aktif ke composer.",
    combo: "Ctrl + Alt + M",
  },
] as const;

export default function DiaryControlPanel() {
  const { blurSettings, updateBlurSettings } = useDiarySession();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutQuery, setShortcutQuery] = useState("");
  const filteredShortcuts = useMemo(() => {
    const q = shortcutQuery.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.combo.toLowerCase().includes(q)
    );
  }, [shortcutQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  useEffect(() => {
    const handleBlurToggle = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        updateBlurSettings((prev) => ({ ...prev, composeBlur: !prev.composeBlur }));
        return;
      }
      if (key === "t") {
        event.preventDefault();
        updateBlurSettings((prev) => ({ ...prev, feedBlurEnabled: !prev.feedBlurEnabled }));
      }
    };
    window.addEventListener("keydown", handleBlurToggle);
    return () => window.removeEventListener("keydown", handleBlurToggle);
  }, [updateBlurSettings]);

  return (
    <aside className="space-y-6">
      <DiaryPinQuickSettings />
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
              Shortkey
            </p>
            <p className="text-xs text-slate-500">
              Cepetin akses fitur penting lewat kombinasi tombol.
            </p>
          </div>
          <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto rounded-full">
                Lihat daftar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md space-y-4 max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Daftar shortkey</DialogTitle>
                <DialogDescription>
                  Pakai kombinasi ini buat akselerasi workflow kamu.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={shortcutQuery}
                onChange={(event) => setShortcutQuery(event.target.value)}
                placeholder="Cari shortkey..."
                className="rounded-full border-slate-200 bg-white/80 text-sm"
              />
              <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                {filteredShortcuts.length ? (
                  filteredShortcuts.map((shortcut) => (
                    <ShortcutRow key={`${shortcut.combo}-${shortcut.title}`} {...shortcut} />
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-500 py-4">Tidak ada shortkey yang cocok.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
            Blur
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            Kontrol kerahasian
          </h3>
        </div>
        <ToggleRow
          label="Blur saat mengetik"
          description="Sembunyikan teks input sampai kamu mau lihat."
          active={blurSettings.composeBlur}
          onToggle={() =>
            updateBlurSettings((prev) => ({
              ...prev,
              composeBlur: !prev.composeBlur,
            }))
          }
        />
        <ToggleRow
          label="Blur timeline"
          description="Semua posting ditutup blur secara default."
          active={blurSettings.feedBlurEnabled}
          onToggle={() =>
            updateBlurSettings((prev) => ({
              ...prev,
              feedBlurEnabled: !prev.feedBlurEnabled,
            }))
          }
        />
      </section>
    </aside>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, description, active, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition",
          active ? "bg-slate-900" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "inline-block size-5 transform rounded-full bg-white transition",
            active ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

interface ShortcutRowProps {
  title: string;
  description: string;
  combo: string;
}

function ShortcutRow({ title, description, combo }: ShortcutRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <span className="font-mono text-xs uppercase text-slate-600">{combo}</span>
    </div>
  );
}
