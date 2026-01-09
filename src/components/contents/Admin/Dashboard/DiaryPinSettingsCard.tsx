"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Button } from "@/ui/button";
import { useToast } from "@/ui/use-toast";
import { DiaryPinStatus } from "@/types/diaryPin";
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from "@/lib/diary/pinRules";
import { Loader2, RefreshCcw } from "lucide-react";
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

export default function DiaryPinSettingsCard() {
  const [status, setStatus] = useState<DiaryPinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const { toast } = useToast();

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
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
      return data as DiaryPinStatus;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tidak bisa memuat status PIN.";
      setLoadError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const lastUpdatedLabel = useMemo(() => {
    if (!status?.updatedAt) return "Belum pernah diperbarui";
    try {
      return new Date(status.updatedAt).toLocaleString();
    } catch {
      return status.updatedAt;
    }
  }, [status?.updatedAt]);

  const statusPills = [
    { label: "Master PIN", active: status?.hasMaster },
    { label: "Decoy PIN", active: status?.hasDecoy },
  ] as const;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const payload: Record<string, any> = {};

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
        title: "PIN tersimpan",
        description: "Konfigurasi PIN berhasil diperbarui.",
      });
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

  const disabled = saving || loading;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
            Diary PIN
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Master & decoy PIN
          </h2>
          <p className="text-sm text-slate-500">
            Kelola PIN langsung dari dashboard tanpa menyentuh file .env.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchStatus()}
          disabled={loading}
        >
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {statusPills.map((pill) => (
          <span
            key={pill.label}
            className={cn(
              "rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest",
              pill.active
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-400"
            )}
          >
            {pill.label}
          </span>
        ))}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {status?.needsSetup
          ? "Belum ada master PIN yang tersimpan. Buat master PIN minimal sekali sebelum menggunakan diary."
          : `Terakhir diperbarui: ${lastUpdatedLabel}`}
      </div>

      {loadError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{loadError}</p>
          <Button
            type="button"
            variant="destructive_outline"
            size="sm"
            className="mt-3"
            onClick={() => fetchStatus()}
          >
            Coba lagi
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="master-pin">Master PIN baru</Label>
              <Input
                id="master-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                value={form.masterPin}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, masterPin: event.target.value.replace(/\s+/g, "") }))
                }
                minLength={PIN_MIN_LENGTH}
                maxLength={PIN_MAX_LENGTH}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="master-pin-confirm">Konfirmasi master PIN</Label>
              <Input
                id="master-pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                value={form.masterPinConfirm}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, masterPinConfirm: event.target.value.replace(/\s+/g, "") }))
                }
                minLength={PIN_MIN_LENGTH}
                maxLength={PIN_MAX_LENGTH}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="decoy-pin">Decoy PIN</Label>
              <Input
                id="decoy-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                value={form.decoyPin}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, decoyPin: event.target.value.replace(/\s+/g, "") }))
                }
                minLength={PIN_MIN_LENGTH}
                maxLength={PIN_MAX_LENGTH}
                disabled={disabled || form.clearDecoy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decoy-pin-confirm">Konfirmasi decoy PIN</Label>
              <Input
                id="decoy-pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                value={form.decoyPinConfirm}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, decoyPinConfirm: event.target.value.replace(/\s+/g, "") }))
                }
                minLength={PIN_MIN_LENGTH}
                maxLength={PIN_MAX_LENGTH}
                disabled={disabled || form.clearDecoy}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.clearDecoy}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  clearDecoy: event.target.checked,
                  decoyPin: event.target.checked ? "" : prev.decoyPin,
                  decoyPinConfirm: event.target.checked ? "" : prev.decoyPinConfirm,
                }))
              }
              disabled={disabled || !status?.hasDecoy}
              className="h-4 w-4 accent-slate-900"
            />
            Hapus decoy PIN saat ini
          </label>

          <p className="text-xs text-slate-500">
            PIN hanya menerima angka {PIN_MIN_LENGTH}-{PIN_MAX_LENGTH} digit. Master PIN wajib ada, decoy PIN opsional.
          </p>

          {formError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || loading}>
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
              disabled={disabled}
            >
              Reset
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
