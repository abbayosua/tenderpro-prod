# Panduan Deploy TenderPro ke Vercel

## Overview

Project ini menggunakan **Next.js 16** dengan **Prisma ORM**. Untuk deploy ke Vercel, kita perlu mengganti database dari SQLite ke PostgreSQL (Supabase).

---

## Kenapa SQLite Tidak Bisa di Vercel?

- Vercel menggunakan **serverless functions** yang bersifat stateless
- File system bersifat **ephemeral** (reset setiap deployment/request)
- SQLite menyimpan data di file lokal yang akan hilang

---

## Step 1: Setup Supabase

### 1.1 Buat Akun & Project

1. Kunjungi: https://supabase.com
2. Sign up atau Login
3. Klik **"New Project"**
4. Isi form:
   - **Name**: `tenderpro`
   - **Database Password**: Buat password kuat (simpan!)
   - **Region**: `Southeast Asia (Singapore)`
5. Klik **"Create new project"**
6. Tunggu ±2 menit sampai project ready

### 1.2 Dapatkan Connection Strings

1. Di dashboard Supabase, pergi ke **Settings** > **Database**
2. Scroll ke bagian **"Connection string"**
3. Pilih tab **"URI"**
4. Copy kedua connection strings:

```
# Connection Pooling (untuk aplikasi - port 6543):
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Direct Connection (untuk migrations - port 5432):
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## Step 2: Update Prisma Schema

Ubah `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

---

## Step 3: Setup Environment Variables

### 3.1 Local Development

Buat file `.env`:

```env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# NextAuth Secret (generate dengan: openssl rand -base64 32)
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.2 Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Step 4: Push ke GitHub

```bash
# Initialize git jika belum
git init

# Add semua file
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Add remote (ganti dengan repo Anda)
git remote add origin https://github.com/USERNAME/tenderpro.git

# Push
git push -u origin main
```

---

## Step 5: Deploy ke Vercel

### 5.1 Buat Akun Vercel

1. Kunjungi: https://vercel.com
2. Sign up dengan GitHub

### 5.2 Import Project

1. Klik **"Add New..."** > **"Project"**
2. Pilih repository `tenderpro`
3. Klik **"Import"**

### 5.3 Configure Project

1. **Framework Preset**: Next.js (otomatis terdeteksi)
2. **Root Directory**: `./` (default)
3. **Build Command**: `next build` (default)
4. **Output Directory**: `.next` (default)

### 5.4 Set Environment Variables

Klik **"Environment Variables"** dan tambahkan:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:5432/postgres` |
| `NEXTAUTH_SECRET` | (hasil dari `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

### 5.5 Deploy

1. Klik **"Deploy"**
2. Tunggu proses build (±3-5 menit)
3. Jika berhasil, klik **"Visit"** untuk melihat website

---

## Step 6: Run Database Migrations

Setelah deploy pertama kali, database masih kosong. Perlu run migrations:

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations locally dengan env dari Vercel
npx prisma db push

# Run seed
bun run prisma/seed.ts
```

### Option B: Via Supabase Dashboard

1. Pergi ke **SQL Editor** di Supabase
2. Copy isi dari `prisma/migrations/*.sql`
3. Execute di SQL Editor

---

## Step 7: Redeploy

Setelah migrations selesai:

1. Pergi ke dashboard Vercel
2. Pilih project `tenderpro`
3. Klik **"Redeploy"**

---

## Troubleshooting

### Error: "Can't reach database server"

- Pastikan connection string benar
- Cek password tidak ada karakter special yang perlu di-escape
- Pastikan IP Vercel tidak di-block (Supabase default allow all)

### Error: "Prisma Client not generated"

- Tambahkan `postinstall` script di `package.json`:
  ```json
  "scripts": {
    "postinstall": "prisma generate"
  }
  ```

### Error: "Authentication failed"

- Cek `NEXTAUTH_SECRET` dan `NEXTAUTH_URL` sudah diset
- `NEXTAUTH_URL` harus sesuai dengan domain Vercel

---

## Demo Accounts (Setelah Seed)

| Role | Email | Password |
|------|-------|----------|
| Contractor | info@ptbangunpermai.co.id | password123 |
| Owner | andriansyah@gmail.com | password123 |

---

## Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database (tanpa migration files)
npx prisma db push

# Run seed
bun run prisma/seed.ts

# Open Prisma Studio
npx prisma studio

# View logs di Vercel
vercel logs
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │   Edge       │     │  Serverless  │     │   Static     │   │
│   │   Network    │────▶│   Functions  │────▶│   Assets     │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│                              │                                   │
│                              │                                   │
│                              ▼                                   │
│   ┌────────────────────────────────────────────────────────┐   │
│   │                    SUPABASE                             │   │
│   │   ┌──────────────┐     ┌──────────────┐                │   │
│   │   │  PostgreSQL  │     │    Auth      │ (optional)     │   │
│   │   │   Database   │     │   Service    │                │   │
│   │   └──────────────┘     └──────────────┘                │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

Setelah berhasil deploy:

1. **Custom Domain**: Tambahkan domain custom di Vercel settings
2. **Analytics**: Enable Vercel Analytics untuk tracking
3. **Monitoring**: Setup error tracking (Sentry, LogRocket, etc.)
4. **Backups**: Setup automated backups di Supabase
5. **CDN**: Configure image optimization di `next.config.js`

---

## Support

Jika ada masalah:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
