# Panduan Persiapan Produksi (Production Guide) - PKBM Askara

Dokumen ini ditujukan untuk *System Administrator* atau Tim IT yang akan mengelola WebApp PKBM Askara di fase produksi (Live).

## 1. Migrasi Database (Wajib)

Aplikasi ini secara default menggunakan **SQLite** untuk keperluan *development* lokal. Namun, **Vercel** tidak mendukung file database lokal persisten. Anda **wajib** bermigrasi ke layanan database PostgreSQL terkelola (Cloud).

**Rekomendasi Layanan:**
- **Supabase** (Sangat disarankan, Gratis)
- **Vercel Postgres** (Integrasi langsung di Vercel)
- **Neon.tech** (Serverless Postgres)

**Langkah Migrasi:**
1. Buat project baru di Supabase.
2. Dapatkan URI Database (biasanya berawalan `postgresql://postgres:...`).
3. Ubah `provider = "sqlite"` menjadi `provider = "postgresql"` di file `prisma/schema.prisma`.
4. Tambahkan variabel `DATABASE_URL` ke menu **Settings > Environment Variables** di dashboard Vercel Anda.
5. Jalankan perintah migrasi via Vercel CLI atau terminal lokal Anda:
   ```bash
   npx prisma db push
   ```

## 2. Integrasi Sentry (Error Tracking)

Untuk mengetahui secara *real-time* jika ada *bug* atau pengguna yang mengalami *error* blank screen, aplikasi ini siap diintegrasikan dengan **Sentry**.

1. Buat akun di [Sentry.io](https://sentry.io/).
2. Buat project baru (pilih framework **Next.js**).
3. Jalankan perintah otomatis wizard Sentry di terminal lokal Anda:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
4. Sentry akan secara otomatis membuat file konfigurasi dan menyiapkan variabel `.env`.
5. *Commit* dan *Push* perubahan ke GitHub.

## 3. Integrasi Google Analytics

Kode integrasi sudah terpasang di dalam aplikasi (`src/components/Analytics.tsx`).

1. Buat properti baru di [Google Analytics](https://analytics.google.com).
2. Dapatkan **Measurement ID** (berformat `G-XXXXXXXXXX`).
3. Buka Dashboard Vercel Anda.
4. Masuk ke **Settings > Environment Variables**.
5. Tambahkan variabel baru:
   - Key: `NEXT_PUBLIC_GA_ID`
   - Value: `G-XXXXXXXXXX`
6. *Redeploy* aplikasi Anda di Vercel.

## 4. Keamanan & Kepatuhan

- **SSL/HTTPS**: Dikelola secara otomatis oleh Vercel.
- **Security Headers**: XSS Protection, Strict-Transport-Security, dan Frame Options telah diaktifkan secara bawaan di `next.config.ts`.
- **Mitigasi Serangan**: Proteksi SQL Injection (ditangani Prisma ORM) dan CSRF (ditangani Next.js App Router).
