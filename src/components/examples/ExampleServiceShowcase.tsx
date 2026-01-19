"use client";

import { FormEvent, useMemo, useState } from "react";
import useServiceHook from "@/hooks/useService";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { useToast } from "@/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";

const SEED_SERVICES = [
  { title: "Headless CMS API", content: "Contoh entry yang nunjukin cara manggil API internal lewat hook." },
  { title: "Realtime Dashboard", content: "Gunakan React Query + Zustand buat nyimpen data kompleks tanpa repot." },
  { title: "Auth Template", content: "Isi sendiri kredensial NextAuth kamu dan pakai komponen login yang sudah siap." },
];

export default function ExampleServiceShowcase() {
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [seedCount, setSeedCount] = useState(0);

  const serviceHook = useServiceHook();
  const servicesQuery = serviceHook.getServices;
  const services = servicesQuery.data ?? [];
  const toastApi = useToast();

  const listCaption = useMemo(() => {
    if (servicesQuery.isLoading) {
      return "Loading services...";
    }
    if (servicesQuery.error) {
      return "Gagal memuat data. Pastikan route /api/services terhubung ke database kamu.";
    }
    if (!services.length) {
      return "Belum ada data. Kamu bisa tambahkan contoh lewat form di bawah.";
    }
    return `Menampilkan ${services.length} service dari API lokal.`;
  }, [servicesQuery.isLoading, servicesQuery.error, services.length]);

  async function handleSeedClick() {
    const seedIndex = seedCount % SEED_SERVICES.length;
    const template = SEED_SERVICES[seedIndex];
    const payload = {
      title: `${template.title} #${seedCount + 1}`,
      content: template.content,
    };
    try {
      await serviceHook.createService.mutateAsync(payload);
      servicesQuery.refetch();
      setSeedCount((prev) => prev + 1);
      toastApi.toast({
        title: "Sample berhasil ditambahkan",
        description: "Lihat list untuk verifikasi respons API.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toastApi.toast({
        title: "Gagal menambah sample",
        description: message,
        variant: "destructive",
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!titleInput.trim()) {
      toastApi.toast({
        title: "Judul wajib diisi",
        variant: "destructive",
      });
      return;
    }
    try {
      await serviceHook.createService.mutateAsync({
        title: titleInput.trim(),
        content: contentInput.trim(),
      });
      servicesQuery.refetch();
      setTitleInput("");
      setContentInput("");
      toastApi.toast({
        title: "Service tersimpan",
        description: "Hook + API + React Query flow sukses.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toastApi.toast({
        title: "Request gagal",
        description: message,
        variant: "destructive",
      });
    }
  }

  async function handleDelete(serviceId: number) {
    try {
      await serviceHook.deleteService.mutateAsync(serviceId);
      servicesQuery.refetch();
      toastApi.toast({
        title: "Service dihapus",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toastApi.toast({
        title: "Gagal menghapus",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contoh hook</p>
        <h2 className="mt-3 text-3xl font-semibold">Modul Service CRUD</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contoh ini nunjukin gimana cara pakai React Query + API Route buat nyimpen data dari form sederhana.
        </p>
      </div>

      <Card className="border border-dashed">
        <CardHeader>
          <CardTitle>Daftar service</CardTitle>
          <CardDescription>{listCaption}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={handleSeedClick}
              disabled={serviceHook.createService.isPending}
            >
              Tambah contoh otomatis
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => servicesQuery.refetch()}
              disabled={servicesQuery.isFetching}
            >
              Refresh via hook
            </Button>
          </div>
          <div className="grid gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-start justify-between rounded-2xl border bg-card/90 p-4 text-left"
              >
                <div>
                  <p className="font-medium">{service.title}</p>
                  <p className="text-sm text-muted-foreground">{service.content}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => handleDelete(service.id)}
                  disabled={serviceHook.deleteService.isPending}
                >
                  Hapus
                </Button>
              </div>
            ))}
            {!services.length && !servicesQuery.isLoading && (
              <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Belum ada service di database kamu.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form contoh</CardTitle>
          <CardDescription>Gunakan form ini buat ngetes `useServiceHook()`.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="service-title">Judul</Label>
              <Input
                id="service-title"
                placeholder="Misal: Website Company Profile"
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-content">Deskripsi</Label>
              <Textarea
                id="service-content"
                placeholder="Kasih keterangan singkat biar dev lain paham"
                value={contentInput}
                onChange={(event) => setContentInput(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTitleInput("");
                  setContentInput("");
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={serviceHook.createService.isPending}>
                Simpan service
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
