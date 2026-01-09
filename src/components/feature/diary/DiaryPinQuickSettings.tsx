"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { useToast } from "@/ui/use-toast";
import { DiaryPinStatus } from "@/types/diaryPin";
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from "@/lib/diary/pinRules";
import { Loader2, LockKeyhole, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormState {
  masterPin: string;
  masterPinConfirm: string;
  decoyPin: string;
  decoyPinConfirm: string;
  clearDecoy: boolean;
}

const INITIAL_FORM: FormState = {
  masterPin: "",
  masterPinConfirm: "",
  decoyPin: "",
  decoyPinConfirm: "",
  clearDecoy: false,
};

export default function DiaryPinQuickSettings() {
  const [status, setStatus] = useState<DiaryPinStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await fetch("/api/diary/pin-settings", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || "Gagal memuat status PIN.");
      }
      setStatus(data);
      if (!data.hasDecoy) {
        setForm((prev) => ({ ...prev, clearDecoy: false }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tidak bisa memuat status PIN.";
      setStatusError(message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!open) return;
    fetchStatus();
  }, [open, fetchStatus]);

  const lastUpdatedLabel = useMemo(() => {
    if (!status?.updatedAt) return "Belum pernah diperbarui";
    try {
      return new Date(status.updatedAt).toLocaleString();
    } catch {
      return status.updatedAt;
    }
  }, [status?.updatedAt]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const payload: Record<string, unknown> = {};

    if (form.masterPin) {
      payload.masterPin = form.masterPin;
      payload.masterPinConfirm = form.masterPinConfirm;
    }
    if (form.clearDecoy) {
      payload.clearDecoy = true;
    } else if (form.decoyPin) {
      payload.decoyPin = form.decoyPin;
      payload.decoyPinConfirm = form.decoyPinConfirm;
    }

    if (!Object.keys(payload).length) {
      setFormError("Isi salah satu PIN terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/diary/pin-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || "Gagal menyimpan PIN.");
      }
      setStatus(data.status as DiaryPinStatus);
      setForm(INITIAL_FORM);
      toast({
        title: "PIN diperbarui",
        description: "Konfigurasi PIN berhasil diperbarui.",
      });
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan PIN.";
      setFormError(message);
      toast({
        title: "Gagal menyimpan",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusPills = [
    { label: "Master PIN", active: status?.hasMaster },
    { label: "Decoy PIN", active: status?.hasDecoy },
  ] as const;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Diary PIN</p>
          <h2 className="text-xl font-semibold text-slate-900">Pengaturan cepat</h2>
          <p className="text-xs text-slate-500">Atur master & decoy PIN tanpa pindah halaman.</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="rounded-full">
          <LockKeyhole className="h-4 w-4" />
          Pengaturan PIN
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => fetchStatus()}
          disabled={statusLoading}
          aria-label="Refresh status PIN"
        >
          <RefreshCcw className={cn("h-4 w-4", statusLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {statusPills.map((pill) => (
          <span
            key={pill.label}
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
              pill.active
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-400"
            )}
          >
            {pill.label}
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {statusError
          ? statusError
          : status?.needsSetup
          ? "Belum ada master PIN yang tersimpan. Wajib set minimal sekali."
          : `Terakhir diperbarui: ${lastUpdatedLabel}`}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setForm(INITIAL_FORM);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg space-y-4">
          <DialogHeader>
            <DialogTitle>Pengaturan master & decoy PIN</DialogTitle>
            <DialogDescription>PIN hanya menerima angka {PIN_MIN_LENGTH}-{PIN_MAX_LENGTH} digit.</DialogDescription>
          </DialogHeader>

          {statusError && statusLoading ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{statusError}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="quick-master-pin">Master PIN baru</Label>
                  <Input
                    id="quick-master-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.masterPin}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        masterPin: event.target.value.replace(/\s+/g, ""),
                      }))
                    }
                    minLength={PIN_MIN_LENGTH}
                    maxLength={PIN_MAX_LENGTH}
                    disabled={saving || statusLoading}
                    placeholder="••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-master-pin-confirm">Konfirmasi master PIN</Label>
                  <Input
                    id="quick-master-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.masterPinConfirm}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        masterPinConfirm: event.target.value.replace(/\s+/g, ""),
                      }))
                    }
                    minLength={PIN_MIN_LENGTH}
                    maxLength={PIN_MAX_LENGTH}
                    disabled={saving || statusLoading}
                    placeholder="••••"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="quick-decoy-pin">Decoy PIN</Label>
                  <Input
                    id="quick-decoy-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.decoyPin}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        decoyPin: event.target.value.replace(/\s+/g, ""),
                      }))
                    }
                    minLength={PIN_MIN_LENGTH}
                    maxLength={PIN_MAX_LENGTH}
                    disabled={saving || statusLoading || form.clearDecoy}
                    placeholder="••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-decoy-pin-confirm">Konfirmasi decoy PIN</Label>
                  <Input
                    id="quick-decoy-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.decoyPinConfirm}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        decoyPinConfirm: event.target.value.replace(/\s+/g, ""),
                      }))
                    }
                    minLength={PIN_MIN_LENGTH}
                    maxLength={PIN_MAX_LENGTH}
                    disabled={saving || statusLoading || form.clearDecoy}
                    placeholder="••••"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-slate-900"
                  checked={form.clearDecoy}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      clearDecoy: event.target.checked,
                      decoyPin: event.target.checked ? "" : prev.decoyPin,
                      decoyPinConfirm: event.target.checked ? "" : prev.decoyPinConfirm,
                    }))
                  }
                  disabled={saving || statusLoading || !status?.hasDecoy}
                />
                Hapus decoy PIN sekarang
              </label>

              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={saving || statusLoading}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : status?.needsSetup ? (
                    "Setup PIN"
                  ) : (
                    "Simpan perubahan"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setFormError(null);
                  }}
                  disabled={saving || statusLoading}
                >
                  Reset
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
