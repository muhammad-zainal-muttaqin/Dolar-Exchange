# USD/IDR Exchange Rate Chart

Aplikasi web sederhana untuk menampilkan dan memantau nilai tukar USD ke IDR (Rupiah) dengan grafik interaktif.

## Fitur

- Menampilkan nilai tukar terkini USD ke IDR
- Grafik interaktif dengan berbagai rentang waktu (24 jam, 7 hari, 1 bulan, dll.)
- Mode tampilan yang dapat diubah (USD ke IDR atau IDR ke USD)
- Data diperbarui setiap 30 menit
- Responsif untuk desktop dan perangkat mobile

## Cara Penggunaan

### Pengaturan API Key

Aplikasi ini menggunakan [ExchangeRate-API](https://www.exchangerate-api.com/) untuk mengambil data nilai tukar. Untuk menggunakan aplikasi ini:

1. Daftar akun gratis di [ExchangeRate-API](https://www.exchangerate-api.com/)
2. Dapatkan API key dari dashboard akun Anda
3. Buka file `config.js` dan ganti nilai `API_KEY` dengan API key Anda sendiri

```javascript
const config = {
    API_KEY: 'MASUKKAN_API_KEY_ANDA_DI_SINI',
    API_BASE_URL: 'https://v6.exchangerate-api.com/v6/'
};
```

### Menjalankan Aplikasi

1. Clone repositori ini
2. Buka folder project
3. Atur API key Anda di file `config.js`
4. Buka `index.html` di browser web Anda

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript (Vanilla)
- Chart.js untuk visualisasi grafik
- ExchangeRate-API untuk data nilai tukar

## Keterbatasan

- Versi gratis ExchangeRate-API memiliki batasan jumlah request dan akses ke data historis
- Untuk akses penuh ke data historis, diperlukan paket berbayar (Pro, Business, atau Volume)

## Lisensi

Proyek ini tersedia di bawah [Lisensi MIT](LICENSE).