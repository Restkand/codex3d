# Krekit

Wadah belajar gratis tentang dunia developer game, dari teori di dalam engine sampai bisnis studio indie. Materinya disusun sebagai jalur belajar, setiap klaim ada sumbernya, dan komunitas bisa ikut mengoreksi. Dari gamer, untuk gamer.

> Krekit adalah nama situs sekaligus nama maskotnya: telur yang mengintip dari celah cangkang. Namanya dari bunyi "krek" saat cangkang retak, dan terbaca seperti *crack it*.

## Isi

- **Jalur Belajar**: enam jalur, yaitu Fondasi Engine, Lanskap Engine, Desain Game, Produksi, Bisnis Studio Indie, serta Industri & Karier. Pelajaran berisi model mental, bedah kode baris demi baris, demo interaktif, kuis, dan latihan.
- **Kamus**: 120 istilah teknis dengan analogi, demo, contoh per engine, dan tautan antar-konsep.
- **Eksperimen 3D**: scene WebGL (Three.js + GSAP) yang menjadi bahan bedah kode di Jalur Fondasi Engine.

## Menjalankan di komputer sendiri

Butuh [Node.js](https://nodejs.org/) 22 atau lebih baru.

```sh
npm install
npm run dev      # server pengembangan
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build
```

## Struktur proyek

```
src/
  content/docs/      # SEMUA konten (Markdown/MDX): belajar/, kamus/, kontribusi/, tentang, progres
  content.config.ts  # Skema frontmatter konten
  components/        # Komponen konten: Aside, EngineTabs, Demo, Quiz, LinkCard, diagram
  layouts/           # LearnLayout: bilah atas, navigasi samping, Krekit pendamping
  pages/             # Rute halaman: beranda, belajar/, kamus/, lab, halaman umum
  site/              # Beranda, maskot Krekit, gaya & skrip halaman konten
  experiment/        # Lab 3D (Three.js, GSAP, shader GLSL)
  lib/               # Daftar jalur & bab, progres belajar, demo kanvas, utilitas
  site.config.mjs    # Nama situs, URL repo, base path (ubah di sini saat rebrand)
astro.config.mjs     # Konfigurasi Astro: MDX, blok kode (Expressive Code), plugin tautan
docs/                # Catatan internal, mis. daftar verifikasi tertunda
```

Dibangun dengan [Astro](https://astro.build/), [Expressive Code](https://expressive-code.com/), [Three.js](https://threejs.org/), dan [GSAP](https://gsap.com/).

## Berkontribusi

Kontribusi dari programmer maupun non-programmer sangat diterima: koreksi, artikel, studi kasus, ulasan praktisi, terjemahan. Mulai dari [CONTRIBUTING.md](CONTRIBUTING.md).

## Lisensi

- **Kode**: [MIT](LICENSE)
- **Konten** (`src/content/`): lisensi sedang disiapkan, semua hak dilindungi. Lihat [LICENSE-CONTENT.md](LICENSE-CONTENT.md).
