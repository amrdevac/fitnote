# FitNote – Mobile Gym Tracker

Starter project berbasis Next.js 16 + React 19 yang sekarang difokuskan buat eksperimen aplikasi pencatat latihan harian (FitNote). Seluruh UI dioptimasi buat tampilan mobile + gesture swipe kiri untuk membuka form input.

## Apa aja isi proyek ini?

- **UI tracker mobile** (`components/workouts/MobileWorkoutHome.tsx`) – daftar sesi latihan, kartu detail gerakan, floating action button, plus gesture swipe untuk membuka form tambah.
- **Hook state latihan** (`hooks/useWorkoutSession.ts`) – manajemen sesi, gerakan, serta set yang sedang dikomposisi tanpa perlu backend.
- **Seed & library gerakan** (`data/workouts.ts`) – daftar default gerakan dan contoh sesi supaya halaman depan tidak kosong.
- **Utility umum** tetap tersedia: HTTP builder (`lib/httpRequest.ts`), provider global (React Query, Toast, progress bar), dan komponen shadcn.
- **Fitur PWA** – manifest custom, service worker (`public/sw.js`), dan offline page supaya aplikasi bisa di-install dan jalan meski koneksi putus.

## Menjalankan proyek

```bash
npm install
npm run dev
# default port di script: 3321
```

## Environment variable

Belum ada kebutuhan environment khusus. Kalau nanti mau hubungkan ke backend favoritmu, tinggal tambahkan file `.env.local` dan baca via `process.env`.

## Script npm

- `npm run dev` – jalankan Next.js dengan Turbopack.
- `npm run build` – build production.
- `npm start` – preview hasil build.
- `npm run lint` – lint project (butuh konfigurasi ESLint).
- `npm run db` – jalankan Turso dev server lokal (`database-blue-xylophone.db`, port 8082).

Selamat bereksperimen 🔧
