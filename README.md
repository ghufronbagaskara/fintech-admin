# Qigo Admin

Admin dashboard buat monitoring & kelola merchant, transaksi, harga emas, dan audit log fintech Qigo. React + TypeScript + Vite, data dari Supabase.

## Setup

```bash
npm install
cp .env.example .env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev
```

## Migrasi database

Jalankan `sql/001_admin_dashboard.sql` di Supabase SQL Editor sebelum pakai fitur audit log dan suspend merchant.

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run lint` — oxlint
- `npm run preview` — preview hasil build
