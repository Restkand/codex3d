# Krekit

Wadah belajar fundamental pembuatan game, dari cara engine menggambar satu frame sampai bisnis studio indie.

Krekit menjelaskan dasar-dasar pembuatan game dalam bahasa Indonesia: materinya disusun sebagai jalur belajar, setiap klaim ada sumbernya, dan komunitas bisa ikut mengoreksi. Visi lengkapnya ada di halaman [Tentang](src/content/docs/tentang.mdx).

> Krekit adalah nama situs sekaligus nama maskotnya: telur yang mengintip dari celah cangkang. Namanya dari bunyi "krek" saat cangkang retak, dan terbaca seperti *crack it*.

## Isi

- **Jalur Belajar**: tujuh jalur, yaitu Fondasi Engine, Lanskap Engine, Desain Game, Produksi, Bisnis Studio Indie, Industri & Karier, serta Seni & Gaya Visual. Pelajaran berisi model mental, pseudocode, contoh per engine, demo interaktif, kuis, dan latihan.
- **Kamus**: 120 istilah teknis dengan analogi, demo, contoh per engine, dan tautan antar-konsep.
- **Lab 3D**: scene WebGL (Three.js + GSAP) yang dibedah baris demi baris di Bab Tambahan Web & Three.js.

## Menjalankan di komputer sendiri

Butuh [Node.js](https://nodejs.org/) 22 atau lebih baru.

```sh
npm install
npm run dev      # server pengembangan
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build
npm run check:links  # cek tautan internal di dist/ (jalankan setelah build)
npm run test:smoke   # uji asap Playwright: beranda, pelajaran, Kamus di desktop & HP
```

## Struktur proyek

```
src/
  content/docs/      # Seluruh konten (Markdown/MDX): belajar/, kamus/, kontribusi/, tentang, progres
  content.config.ts  # Skema frontmatter konten
  components/        # Komponen konten: Aside, EngineTabs, Demo, Quiz, LinkCard, diagram
  layouts/           # LearnLayout: bilah atas, navigasi samping, Krekit pendamping
  pages/             # Rute halaman: beranda, belajar/, kamus/, lab, halaman umum
  site/              # Beranda, maskot Krekit, gaya & skrip halaman konten
  experiment/        # Lab 3D (Three.js, GSAP, shader GLSL)
  lib/               # Daftar jalur & bab, progres belajar, demo kanvas, utilitas
  site.config.mjs    # Nama situs, URL repo, base path (ubah di sini saat rebrand)
astro.config.mjs     # Konfigurasi Astro: MDX, blok kode (Expressive Code), plugin tautan
```

Dibangun dengan [Astro](https://astro.build/), [Expressive Code](https://expressive-code.com/), [Three.js](https://threejs.org/), dan [GSAP](https://gsap.com/).

## Berkontribusi

Programmer maupun bukan bisa ikut berkontribusi lewat koreksi, artikel, studi kasus, ulasan praktisi, atau terjemahan. Mulai dari [CONTRIBUTING.md](CONTRIBUTING.md).

## Lisensi

- **Konten** (`src/content/`): [CC BY-NC-SA 4.0](LICENSE-CONTENT.md). Terbuka untuk komunitas; pemakaian komersial lewat [kemitraan resmi](src/content/docs/kemitraan.mdx).
- **Kode**, termasuk potongan kode di dalam pelajaran: [MIT](LICENSE)
- **Nama, logo, dan maskot Krekit**: [kebijakan merek](TRADEMARK.md)
- **Kontributor**: [Perjanjian Lisensi Kontributor](CLA.md)

Penjelasan dan tanya-jawab lisensi ada di halaman [Lisensi](src/content/docs/lisensi.mdx).
