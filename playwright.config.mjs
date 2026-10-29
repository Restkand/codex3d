// Uji asap (smoke test) halaman utama Krekit di desktop dan HP. Lihat tests/smoke.spec.js.
//   npm run build && npm run test:smoke
// Lokal memakai Chrome yang sudah terpasang (unduhan browser Playwright bisa terblokir proxy);
// di CI memakai Chromium bawaan Playwright (npx playwright install chromium).
import { defineConfig, devices } from '@playwright/test'

const PORT = 4399
const chrome = process.env.CI ? {} : { channel: 'chrome' }
// WebGL di mesin tanpa GPU (CI, headless) berjalan lewat SwiftShader
const launchOptions = { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/krekit/`,
    launchOptions,
    ...chrome,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'hp', use: { ...devices['Pixel 7'], ...chrome, launchOptions } },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/krekit/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
