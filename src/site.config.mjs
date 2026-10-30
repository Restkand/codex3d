/**
 * Identitas situs di SATU tempat. Saat nama brand final sudah dipilih, cukup ubah file ini.
 *
 * Situs disajikan dari akar domain (base = '/'), baik lokal maupun di Cloudflare Pages.
 * Nilai berikut hanya dibaca saat build (tidak di browser) dan bisa ditimpa lewat variabel lingkungan:
 *   - SITE_URL   alamat lengkap situs, mis. https://krekit.id saat domain sendiri sudah aktif.
 *                Di Cloudflare Pages, bawaannya alamat deployment (CF_PAGES_URL, diisi otomatis).
 *   - BASE_PATH  sub-path situs. Hanya perlu untuk GitHub Pages ('/krekit', diisi deploy.yml).
 */
const env = typeof process === 'undefined' ? {} : process.env

export const SITE = {
  name: 'Krekit',
  tagline: 'Wadah belajar fundamental pembuatan game: dari cara engine menggambar satu frame sampai bisnis studio indie.',
  repo: 'https://github.com/Restkand/krekit',
  site: env.SITE_URL ?? env.CF_PAGES_URL,
  base: env.BASE_PATH ?? '/',
}
