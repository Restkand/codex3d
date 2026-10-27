import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Proyek ini punya dua halaman. Saat dev, Vite melayani keduanya otomatis;
// saat build, setiap halaman harus didaftarkan sebagai input.
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        guide: resolve(import.meta.dirname, 'guide.html'),
      },
    },
  },
})
