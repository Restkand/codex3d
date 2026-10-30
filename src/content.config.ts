import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/**
 * Semua halaman konten (pelajaran, istilah di Kamus, artikel, kontribusi) ada di src/content/docs/.
 * Id entri = path file tanpa ekstensi, dan file index.mdx memakai id foldernya:
 *   belajar/fondasi-engine/01-frame.mdx -> "belajar/fondasi-engine/01-frame"
 *   kamus/ruang/index.mdx               -> "kamus/ruang"
 * Halaman di src/pages/ memakai id ini untuk mencari entri dan membentuk alamat.
 * Penjelasan field untuk penulis: halaman "Kontribusi → Menulis artikel".
 */
const generateId = ({ entry }: { entry: string }) =>
  entry
    .replace(/\.mdx?$/, '')
    .replace(/(^|\/)index$/, '')
    .toLowerCase()

const source = z.object({
  title: z.string(),
  url: z.string(),
  publisher: z.string().optional(),
  // Tanggal sumber diakses: angka & kebijakan industri cepat berubah
  accessed: z.coerce.date().optional(),
})

const quizItem = z.object({
  q: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.number().int().nonnegative(),
  explain: z.string(),
})

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs', generateId }),
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      /** Urutan di daftar bab/jalur, dan label pendek opsional */
      sidebar: z.object({ order: z.number().optional(), label: z.string().optional() }).optional(),
      /** lesson = pelajaran (memberi XP), term = istilah di Kamus, article = artikel jalur */
      kind: z.enum(['lesson', 'term', 'article']).optional(),
      /** Level istilah di Kamus: 1 Dasar, 2 Menengah, 3 Lanjut */
      level: z.number().int().min(1).max(3).optional(),
      aka: z.string().optional(),
      minutes: z.number().optional(),
      /** Pelajaran: kenapa materi ini tetap perlu dipahami walau alat makin canggih (kotak di awal pelajaran) */
      fundamental: z.string().optional(),
      /** id istilah di Kamus yang dibahas pelajaran ini (untuk tautan "Dibahas di") */
      terms: z.array(z.string()).optional(),
      quiz: z.array(quizItem).optional(),
      /** Kalimat Krekit per bagian: kunci = id judul bagian (mis. "anggaran-167-milidetik") */
      krekit: z.record(z.string(), z.string()).optional(),
      /** kerangka = baru outline, draf = belum ditinjau praktisi, ditinjau = sudah ditinjau */
      status: z.enum(['kerangka', 'draf', 'ditinjau']).optional(),
      lastReviewed: z.coerce.date().optional(),
      reviewers: z.array(z.string()).optional(),
      sources: z.array(source).optional(),
    }),
  }),
}
