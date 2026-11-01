// Uji asap: halaman penting terbuka tanpa error, Krekit tiba di pos yang benar saat di-scroll,
// dan setiap pos beranda muat satu layar di desktop. Posisi Krekit dibaca dari penanda
// data-krekit-pos / data-krekit-docked di <html> (ditulis landing.js).
import { test, expect } from '@playwright/test'

/** Kumpulkan error console dan exception halaman selama tes */
function watchErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
  return errors
}

// Beacon Cloudflare Web Analytics diganti skrip kosong: tes tidak boleh tercatat sebagai kunjungan,
// dan dari localhost permintaannya ditolak CORS sehingga muncul sebagai error console
test.beforeEach(async ({ page }) => {
  await page.route('https://static.cloudflareinsights.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }),
  )
})

const POS = ['mulai', 'kenapa', 'jalur', 'kamus', 'prinsip', 'bergabung']
const html = (page) => page.locator('html')

async function scrollToPos(page, id) {
  await page.evaluate((target) => document.getElementById(target).scrollIntoView(), id)
}

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'khusus layar lebar')

  test('beranda: Krekit tampil dan tiba di setiap pos, juga saat scroll naik-turun', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('./')
    await expect(page.locator('canvas.webgl')).toBeVisible()
    await expect(html(page)).toHaveAttribute('data-krekit-pos', '0', { timeout: 15_000 })

    for (const [index, id] of POS.entries()) {
      await scrollToPos(page, id)
      await expect(html(page)).toHaveAttribute('data-krekit-pos', String(index), { timeout: 10_000 })
    }
    // Scroll cepat dengan roda mouse dari paling bawah ke paling atas: pos aktif berganti beberapa kali
    // selagi Krekit masih teleport. Rantai teleport tidak boleh macet, dan Krekit harus tiba di hero.
    // Catatan: tes ini tidak bisa menilai glitch visual sesaat (mis. animasi teleport yang diputar di
    // panggung yang sudah di luar layar); itu tetap diperiksa dengan mata. Batas waktu dibuat longgar
    // karena di CI WebGL dirender CPU, dan GSAP memperlambat animasi saat frame berat.
    await page.mouse.move(683, 384)
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -900)
      await page.waitForTimeout(60)
    }
    await expect(html(page)).toHaveAttribute('data-krekit-pos', '0', { timeout: 15_000 })
    expect(errors).toEqual([])
  })

  test('beranda: setiap pos muat dalam satu layar', async ({ page }) => {
    await page.goto('./')
    const heights = await page.evaluate((ids) => {
      return ids.map((id) => {
        const section = document.getElementById(id)
        const style = getComputedStyle(section)
        const children = [...section.querySelectorAll(':scope > *')].filter((el) => getComputedStyle(el).display !== 'none')
        const top = Math.min(...children.map((el) => el.offsetTop))
        const bottom = Math.max(...children.map((el) => el.offsetTop + el.offsetHeight))
        return { id, height: Math.round(bottom - top + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) }
      })
    }, POS.slice(1, 5))
    const screen = page.viewportSize().height
    for (const { id, height } of heights) expect(height, `tinggi isi #${id}`).toBeLessThanOrEqual(screen)
  })
})

test.describe('hp', () => {
  test.skip(({ isMobile }) => !isMobile, 'khusus HP')

  test('beranda: Krekit berjaga di pojok setelah Pos 0, kembali ke diorama di atas', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('./')
    await expect(page.locator('.render-steps')).toBeVisible()
    await expect(html(page)).toHaveAttribute('data-krekit-docked', 'false', { timeout: 15_000 })

    await scrollToPos(page, 'jalur')
    await expect(html(page)).toHaveAttribute('data-krekit-docked', 'true', { timeout: 10_000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(html(page)).toHaveAttribute('data-krekit-docked', 'false', { timeout: 10_000 })
    await expect(page.locator('.bnav')).toBeVisible()
    expect(errors).toEqual([])
  })
})

test('pelajaran terbuka tanpa error dan demonya tampil', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('./belajar/fondasi-engine/02-ruang/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ruang, Transform, dan Hierarki')
  await expect(page.locator('.demo').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('Kamus: pencarian menemukan istilah', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('./kamus/')
  await page.locator('[data-kamus-search]').fill('shader')
  await expect(page.locator('[data-kamus-results] li').first()).toBeVisible()
  expect(errors).toEqual([])
})
