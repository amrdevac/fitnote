# Coding Style Spec

Dokumen ini jadi referensi buat gaya koding di boilerplate Next.js ini supaya konsisten sama preferensi pemilik. Bagian pertama nyatet standar yang sekarang dipakai. Bagian kedua jelasin adaptasi ala kamu yang wajib diikuti pas nulis kode baru atau ngedit kode lama.

## 1. Standar Umum yang Sudah Ada
- **TypeScript + Next.js 15** dengan React Server Components default dan beberapa komponen client (`"use client"`).
- **Relative alias** pakai prefix `@/` buat import dari `src` (contoh `@/components/...`).
- **State management**: hooks custom + Zustand store (contoh: `useServiceHook`, `useDeleteConfirmStore`) dipakai untuk state kompleks supaya komponen tetap bersih.
- **UI kit**: komponen `ui/*` (Button, Card, Dialog, dsb.) + util `cn` buat compose class.
- **Async** pakai `fetch` native buat call ringan, axios cuma dipakai di builder HTTP internal. Semua API route ada di `src/app/api/*`.
- **CSS**: Tailwind utility penuh. Theme diatur via class `theme-default`, `theme.css`, dsb.

## 2. Preferensi Pemilik (Wajib Ikuti)
- **Tanpa object destructuring** dari return hook / object.
  - ❌ `const { services } = useServiceHook();`
  - ✅ `const serviceHook = useServiceHook(); serviceHook.getServices.refetch();`
- **Akses variabel/prop langsung dari objek**.
  - ❌ `const { toast } = useToast();`
  - ✅ `const toastApi = useToast(); toastApi.toast(...);`
- **Penamaan jelas**: simpan objek utama dalam variabel dengan nama deskriptif (`serviceHook`, `toastApi`, `confirmControls`).
- **Function parameter**: hindari destructuring di signature. Ambil data lewat akses langsung di dalam fungsi.
  - ❌ `function handle({ id, name }: Props) { ... }`
  - ✅ `function handle(props: Props) { const id = props.id; }`
- **Kode contoh / dokumentasi** harus pakai gaya yang sama, supaya referensi konsisten.
- **Komentar seperlunya**: cuma buat blok rumit atau perilaku unik (misal side effect, debouncing). Hindari komentar obvious.
- **Penamaan boolean** pakai kata kerja/keadaan (`isOpen`, `hasSelection`, `shouldBlur`).
- **Shortcut & event handler**: pakai util/helper supaya kode tetap rapi (contoh `createShortcutHandler` di modul keyboard helper), jangan hardcode `handleKeyDown` panjang di tiap komponen.
- **Semua state + request logic** untuk feature besar dikemas via custom hook dengan penamaan `useSomething`. Komponen utama fokus ke UI + efek ringan saja.
  **Penamaan File Hook** harus di awali dengan use , dan harus selalu camelcase

## 3. Checklist Saat Commit
1. Semua hook/object dipanggil tanpa destructuring.
2. Contoh kode / snippet mengikuti gaya yang sama.
3. Tidak ada import/variabel yang dibiarkan tidak terpakai.
4. Tailwind class tetap konsisten (nggak perlu diubah kecuali relevan).
5. Lint jalan (kalau script lint nanti sudah dibenahi).

Kalau ada kebutuhan baru (misal standar penulisan API, struktur folder tambahan), tambahkan sub-bab baru di file ini supaya tim lain bisa ikut.
