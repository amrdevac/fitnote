# Next.js Boilerplate

A reusable Next.js starter that includes a public landing page and an admin dashboard.

## Features

- **Landing page** at `/` to showcase your product or company.
- **Dashboard** under `/dashboard` for application management.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

- `npm run dev` – start the development server
- `npm run build` – build the application for production
- `npm start` – run the built application
- `npm run lint` – run lint checks
- `npm run db` – run Turso dev server using `database-blue-xylophone.db` (port 8082)

## Diary mode

1. Copy `.env.example` ke `.env` dan set kredensial yang dibutuhkan. Variabel `DIARY_MASTER_PIN` / `DIARY_DECOY_PIN` bersifat opsional sekarang karena PIN bisa diatur langsung dari dashboard; nilai `.env` hanya dipakai sebagai fallback jika tabel PIN belum pernah diinisialisasi.
   - `TURSO_DATABASE_URL=libsql://127.0.0.1:8082` dan `TURSO_AUTH_TOKEN=local` saat memakai dev server.
2. Jalankan database lokal dengan `npm run db` lalu `npm run dev`.
3. Buat tabel jika belum ada (berlaku untuk Turso / SQLite):

```sql
CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  is_decoy INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diary_pin_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  master_pin_hash TEXT NOT NULL,
  decoy_pin_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Cara pakai

- Atur master PIN dan (opsional) decoy PIN lewat dashboard `/dashboard` pada kartu **Master & decoy PIN**. Nilai disimpan aman di database.
- Saat aplikasi dibuka, masukkan PIN asli atau decoy. Tekan `Ctrl + K + L` kapan saja untuk memunculkan kunci lagi.
- Timeline otomatis mengikuti PIN yang dipakai. PIN asli bisa menulis ke diary asli ataupun decoy.
- Panel kanan menyediakan:
  - Tombol untuk mengunci ulang atau refresh timeline.
  - Pengaturan blur saat mengetik serta blur timeline (pilih buka via hover atau manual).
- Composer juga bisa diblur saat mengetik; tekan tombol **Lihat teks** untuk mengintip sementara.

---

This project is based on [Next.js](https://nextjs.org/).
