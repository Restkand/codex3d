# Berkontribusi ke Krekit

Terima kasih sudah ingin membantu! Panduan lengkap ada di situs, di bagian **Kontribusi**:

- **Cara berkontribusi**: alur kerja, menjalankan situs lokal, proses tinjauan (`src/content/docs/kontribusi/index.mdx`)
- **Standar konten**: aturan sumber, status, netralitas, gaya bahasa, konten dibantu AI (`src/content/docs/kontribusi/standar-konten.mdx`)
- **Menulis artikel**: template, frontmatter, komponen (`src/content/docs/kontribusi/menulis-artikel.mdx`)

## Ringkasnya

1. **Koreksi kecil**: klik "Edit halaman" di bawah halaman mana pun di situs.
2. **Koreksi fakta / usulan artikel**: buka issue dengan template yang tersedia, sebelum menulis panjang.
3. **Artikel baru**: fork, tulis file `.mdx` di `src/content/docs/`, jalankan `npm run build`, lalu buka pull request.

## Aturan penting

- Setiap angka, kebijakan platform, atau ketentuan lisensi **wajib** punya sumber di field `sources` frontmatter.
- Konten baru masuk dengan `status: draf` sampai ditinjau.
- Sebutkan jika Anda punya hubungan dengan pihak yang dibahas (karyawan, mitra, investor), dan jika memakai alat AI untuk menyusun draf.

Sebelum pull request pertama Anda digabungkan, bot CLA Assistant akan meminta Anda menyetujui [Perjanjian Lisensi Kontributor](https://github.com/Restkand/krekit/blob/main/CLA.md). Hak cipta tetap milik Anda. Kontribusi konten terbit di bawah CC BY-NC-SA 4.0 dan kontribusi kode di bawah MIT. Semua kontributor mengikuti [Kode Etik](CODE_OF_CONDUCT.md).
