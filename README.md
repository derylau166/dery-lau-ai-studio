# DERY LAU AI STUDIO

Generator **text-to-image Vite + React** dengan tampilan Neumorphism, katalog model Pollinations otomatis, prompt enhancer, history, seed, aspek rasio lengkap, creative controls, watermark, dan ekspor PNG.

Versi ini menggunakan **server-side API proxy**. Secret key Pollinations disimpan dalam environment server dan tidak pernah dimasukkan ke bundle JavaScript browser.

## Fitur

- Katalog model otomatis dari Pollinations melalui route aman `/api/models`
- Flux, Z-Image, Kontext, GPT Image 2, NanoBanana Pro, Seedream 5, Grok Imagine, Ideogram, Wan Image, Qwen Image, Klein, dan model lain yang tersedia untuk akun
- Style, pencahayaan, color palette, dan komposisi
- Aspek rasio lengkap hingga 9:16, 16:9, 21:9, 1:4, dan 4:1
- Seed number dan random seed
- AI prompt enhancer melalui `/api/enhance`, dengan fallback enhancer lokal
- History prompt di `localStorage` dan Clear History
- Watermark dengan font, posisi 3×3, ukuran, warna, opacity, shadow, serta outline
- Download resolusi penuh dalam format PNG
- Pemeriksaan status key dan balance Pollen dari server
- Responsive Neumorphism UI

## Menjalankan di komputer

Secret key untuk komputer lokal berada di file:

```text
.env.local
```

Nama environment yang dipakai:

```env
POLLINATIONS_API_KEY=sk_your_secret_key
```

Jangan memakai awalan `VITE_` untuk secret key. Variabel berawalan `VITE_` akan ikut dimasukkan ke JavaScript browser.

Jalankan:

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:5173
```

Setelah mengubah `.env.local`, hentikan server dengan `Ctrl + C`, kemudian jalankan kembali `npm run dev`.

## Build produksi

```bash
npm run build
npm run preview
```

Folder hasil build adalah `dist`.

## Cara kerja keamanan

Frontend hanya memanggil route lokal berikut:

```text
GET  /api/status
GET  /api/models
POST /api/enhance
POST /api/generate
```

Route tersebut meneruskan permintaan ke Pollinations dari backend menggunakan `POLLINATIONS_API_KEY`. Secret key tidak disimpan di `localStorage`, tidak tampil di UI, dan tidak terdapat di folder `dist`.

## Deploy ke Vercel

1. Push project ke GitHub. File `.env.local` otomatis diabaikan oleh `.gitignore`.
2. Import repository ke Vercel.
3. Pilih Framework Preset **Vite**.
4. Buka **Settings → Environment Variables**.
5. Tambahkan:

```text
Name: POLLINATIONS_API_KEY
Value: secret key Pollinations milik Anda
```

6. Aktifkan untuk Production, Preview, dan Development sesuai kebutuhan.
7. Klik **Redeploy** setelah menambahkan atau mengubah environment variable.

Vercel hanya menerapkan perubahan environment variable pada deployment baru. Project menyertakan fungsi serverless di folder `api` dan konfigurasi Fluid Compute dengan durasi maksimum 60 detik agar kompatibel dengan paket Hobby. Pada paket Pro, durasi dapat dinaikkan bila model premium memerlukan waktu lebih panjang.

## Troubleshooting

### Status 402

Key valid, tetapi saldo Pollen atau budget key tidak cukup untuk model yang dipilih. Coba model gratis seperti Flux atau Z-Image, atau periksa balance akun Pollinations.

### Environment belum tersedia

Pastikan file `.env.local` ada, penulisan variabel tepat, lalu restart `npm run dev`.

### Vercel tetap gagal setelah key ditambahkan

Pastikan environment variable bernama tepat `POLLINATIONS_API_KEY`, lalu lakukan Redeploy. Deployment lama tidak menerima perubahan environment secara otomatis.

### Function timeout

Coba model yang lebih cepat atau naikkan Function Max Duration pada paket Vercel yang mendukungnya.

## Endpoint Pollinations yang digunakan

```text
GET  https://gen.pollinations.ai/image/models
GET  https://gen.pollinations.ai/image/{prompt}
POST https://gen.pollinations.ai/v1/chat/completions
GET  https://gen.pollinations.ai/account/key
GET  https://gen.pollinations.ai/account/balance
```

Copyright @2026 **DERY LAU AI** Powered by. Pollinations API,  
Developed by. Dery Lau, Thanks to Github & Vercel & ChatGPT.
