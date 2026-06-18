# ============================================
# PAPAN INFORMASI DIGITAL MASJID
# Setup Guide & Documentation
# ============================================

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Google Apps Script Backend](#setup-backend)
4. [Setup Frontend Admin Panel](#setup-admin)
5. [Setup Digital Board Display](#setup-board)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Papan Informasi Digital Masjid adalah sistem terintegrasi untuk menampilkan informasi penting masjid secara dinamis dan real-time melalui layar digital. Sistem ini terdiri dari:

- **Backend**: Google Apps Script yang menangani API dan database
- **Admin Panel**: Frontend untuk pengelola konten
- **Digital Board**: Tampilan publik untuk layar masjid

---

## 📦 Prerequisites

- Akun Google (Gmail)
- Google Drive
- Browser modern (Chrome, Firefox, Edge)
- Koneksi internet stabil

---

## 🔧 Setup Backend

### Step 1: Create Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru dengan nama "Masjid Digital Database"
3. Copy Spreadsheet ID dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 2: Create Google Drive Folder

1. Buka [Google Drive](https://drive.google.com)
2. Buat folder baru dengan nama "Masjid Digital Media"
3. Copy Folder ID dari URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

### Step 3: Create Apps Script Project

1. Buka [Google Apps Script](https://script.google.com)
2. Klik "New Project"
3. Ganti nama project menjadi "Masjid Digital Backend"
4. Copy semua kode dari `backend/Code.gs` ke file `Code.gs`
5. Copy kode dari `backend/appsscript.json` ke file `appsscript.json`

### Step 4: Configure Properties

1. Di Apps Script, buka **Project Settings** (gear icon)
2. Scroll ke **Script Properties**
3. Tambahkan properties berikut:
   - `SPREADSHEET_ID`: ID spreadsheet dari Step 1
   - `DRIVE_FOLDER_ID`: ID folder dari Step 2

### Step 5: Initialize Database

1. Buka file `Code.gs`
2. Jalankan fungsi `initializeApp()` untuk membuat struktur database
3. Berikan izin yang diminta

### Step 6: Deploy as Web App

1. Klik **Deploy** > **New deployment**
2. Pilih type: **Web app**
3. Description: "Masjid Digital Backend"
4. Execute as: **User accessing the web app**
5. Who has access: **Anyone** (untuk tampilan publik)
6. Klik **Deploy**
7. Copy Web App URL

---

## 🖥️ Setup Admin Panel

### Step 1: Configure API URL

Buka file `frontend-admin/js/api.js` dan update bagian `CONFIG`:

```javascript
const CONFIG = {
    baseUrl: 'YOUR_APPS_SCRIPT_URL', // Paste Web App URL dari Step 6
    timeout: 30000
};
```

### Step 2: Open Admin Panel

1. Buka file `frontend-admin/index.html` di browser
2. Login dengan akun Google yang sudah didaftarkan

### Step 3: Setup User Access

1. Setelah login, buka tab **Pengguna**
2. Tambahkan email pengguna yang diizinkan
3. Tetapkan peran (Super Admin, Masjid Admin, Content Editor, Viewer)

---

## 📺 Setup Digital Board Display

### Step 1: Configure Board

Buka file `frontend-board/js/config.js` dan update:

```javascript
const BOARD_CONFIG = {
    appsScriptUrl: 'YOUR_APPS_SCRIPT_URL',
    masjidId: 'YOUR_MASJID_ID', // Dari database setelah setup admin
    refreshInterval: 5 * 60 * 1000, // 5 menit
    slideshowInterval: 10 * 1000 // 10 detik
};
```

### Step 2: Open Digital Board

1. Buka file `frontend-board/index.html` di browser
2. Atau akses melalui URL yang sudah di-deploy

### Step 3: Display on Screen

Untuk menampilkan di layar masjid:
1. Buka browser di perangkat tampilan (Raspberry Pi, Android TV Box, Smart TV)
2. Akses URL digital board
3. Gunakan **Fullscreen mode** (F11)

---

## ⚙️ Configuration

### Prayer Times Settings

Di Admin Panel > Jadwal Sholat:
- **Metode Perhitungan**: Kemenag RI, MWL, ISNA, dll.
- **Madhab**: Syafi'i atau Hanafi
- **Penyesuaian Waktu**: +/- menit untuk setiap waktu sholat
- **Waktu Iqamah**: Durasi setelah adzan (5-60 menit)

### Display Settings

Di Admin Panel > Pengaturan:
- **Warna Primer**: Warna utama tema (default: #00563F)
- **Warna Sekunder**: Warna aksen (default: #DAA520)
- **Font**: Roboto, Open Sans, Inter, Lato
- **Logo**: Upload logo masjid
- **Footer Text**: Teks yang ditampilkan di bagian bawah

### Content Management

#### Pengumuman
- Buat pengumuman baru dengan judul, isi, dan gambar
- Atur periode tayang (tanggal mulai - berakhir)
- Aktifkan/nonaktifkan pengumuman

#### Kajian & Acara
- Tambah detail kajian rutin atau acara khusus
- Informasi: judul, pembicara, tanggal, waktu, lokasi
- Atur status aktif untuk tampil di papan informasi

#### Media
- Unggah gambar (JPG, PNG) atau video (MP4)
- Atur urutan tampilan dalam slideshow
- Durasi tayang per media

---

## 📖 Usage

### Admin Panel

1. **Dashboard**: Ringkasan jadwal sholat, pengumuman aktif, acara mendatang
2. **Jadwal Sholat**: Konfigurasi perhitungan dan waktu iqamah
3. **Pengumuman**: CRUD pengumuman dengan periode tayang
4. **Kajian & Acara**: Kelola agenda kegiatan masjid
5. **Media**: Unggah dan kelola gambar/video
6. **Pengaturan**: Kustomisasi tampilan papan informasi
7. **Pengguna**: Kelola akses pengguna backend

### Digital Board

- **Header**: Logo, nama masjid, tanggal & waktu
- **Jadwal Sholat**: Daftar waktu sholat dengan highlight waktu aktif
- **Hitung Mundur Iqamah**: Otomatis muncul setelah adzan
- **Slideshow**: Pengumuman, acara, media, quotes Islami
- **Footer**: Pesan atau doa

---

## 🔍 Troubleshooting

### Problem: Tidak bisa login ke Admin Panel

**Solution:**
1. Pastikan email sudah terdaftar di database
2. Cek apakah akun aktif di tab Users
3. Pastikan izin Apps Script sudah diberikan

### Problem: Data tidak muncul di Digital Board

**Solution:**
1. Cek koneksi internet
2. Verifikasi `appsScriptUrl` dan `masjidId` di config
3. Buka browser console (F12) untuk cek error

### Problem: Perhitungan jadwal sholat salah

**Solution:**
1. Pastikan koordinat lokasi benar (latitude/longitude)
2. Pilih metode perhitungan yang sesuai
3. Atur zona waktu dengan benar

### Problem: Media tidak tampil

**Solution:**
1. Pastikan file diunggah ke Google Drive
2. Cek sharing settings file (Anyone with link can view)
3. Verifikasi file ID di database

---

## 📞 Support

Untuk bantuan teknis:
1. Buka browser console (F12) untuk melihat error
2. Cek Google Apps Script Logs di script.google.com
3. Verifikasi data di Google Sheets

---

## 📄 License

Proyek ini dibuat berdasarkan PRD (Product Requirements Document) untuk Papan Informasi Digital Masjid.

---

**Selamat menggunakan Papan Informasi Digital Masjid!** 🕌
