# Next.js Boiler (Januari)

Starter project berbasis Next.js 16 + React 19 supaya nggak perlu setup ulang tiap bikin eksperimen baru. Basisnya udah dibersihin jadi boiler general dengan contoh kecil buat hook, API Route, dan UI kit shadcn.

## Apa aja isi boilerplate ini?

- **Landing hero siap pakai** (`components/contents/LandingPageContent.tsx`) dengan contoh store Zustand.
- **Contoh modul data** (`components/examples/ExampleServiceShowcase.tsx`) yang nunjukin alur React Query + API Route + toast feedback.
- **HTTP builder ringan** (`lib/httpRequest.ts`) buat akses API internal maupun eksternal tanpa nulis fetch berulang.
- **Provider bawaan**: React Query, Progress bar, Toast, dan theming tailwind.
- **API Route sample** (`app/api/services/route.ts`) lengkap CRUD supaya gampang dijadikan referensi.

## Menjalankan proyek

```bash
npm install
npm run dev
# default port di script: 3321
```

## Environment variable

Salin file `env` jadi `.env.local` lalu sesuaikan:

| Variable | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_POCKETBASE_BASE_URL` | Base URL kalau mau hit PocketBase |
| `IMAGEKIT_PRIVATE_KEY` / `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | Kredensial upload media (opsional) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Required kalau nanti activate NextAuth |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Koneksi SQLite/Turso buat contoh servis CRUD |

Kalau mau pakai Turso dev server lokal, jalankan:

```bash
npm run db
```

## Contoh modul "Service"

Contoh hook + API bisa dilihat di beberapa tempat:

- `src/app/api/services/route.ts` – CRUD sederhana pakai query builder Turso.
- `src/hooks/useService.ts` – React Query hook untuk read + mutation.
- `src/components/examples/ExampleServiceShowcase.tsx` – cara manggil hook + nampilin data + submit form.

Struktur tabel minimal buat contoh ini:

```sql
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL
);
```

Kalau belum mau sambung database, tombol/form di contoh cukup jadi referensi UI aja (akan error toast ketika request gagal).

## Script npm

- `npm run dev` – jalankan Next.js dengan Turbopack.
- `npm run build` – build production.
- `npm start` – preview hasil build.
- `npm run lint` – lint project (butuh konfigurasi ESLint).
- `npm run db` – jalankan Turso dev server lokal (`database-blue-xylophone.db`, port 8082).

Selamat bereksperimen 🔧
