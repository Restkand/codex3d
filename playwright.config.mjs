// Uji asap (smoke test) halaman utama Krekit di desktop dan HP. Lihat tests/smoke.spec.js.
//   npm run build && npm run test:smoke
// Lokal memakai Chrome yang sudah terpasang (unduhan browser Playwright bisa terblokir proxy);
// di CI memakai Chromium bawaan Playwright (npx playwright install chromium).
import { defineConfig, devices } from '@playwright/test'
import { SITE } from './src/site.config.mjs'

const PORT = 4399
// Alamat beranda mengikuti base path situs (bawaannya root "/"; GitHub Pages memakai /krekit/)
const HOME = `http://localhost:${PORT}${SITE.base.replace(/\/$/, '')}/`
const chrome = process.env.CI ? {} : { channel: 'chrome' }
// WebGL di mesin tanpa GPU (CI, headless) berjalan lewat SwiftShader
const launchOptions = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  // Satu tes dalam satu waktu: WebGL dirender CPU (SwiftShader), dan dua Chrome sekaligus di mesin
  // yang sedang sibuk membuat animasi melambat sampai tes teleport Krekit gagal. Hanya 7 tes, jadi tetap cepat.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: HOME,
    launchOptions,
    ...chrome,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'hp', use: { ...devices['Pixel 7'], ...chrome, launchOptions } },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: HOME,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
