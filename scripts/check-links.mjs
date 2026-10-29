// Cek tautan internal di hasil build (dist/): setiap href/src yang menunjuk ke situs ini harus ada filenya.
// Dipakai di CI (lihat .github/workflows/ci.yml). Keluar dengan kode 1 jika ada tautan rusak.
//   npm run build && npm run check:links
import fs from 'node:fs'
import path from 'node:path'
import { SITE } from '../src/site.config.mjs'

const dist = process.argv[2] ?? 'dist'
const base = SITE.base.replace(/\/$/, '')

const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else if (p.endsWith('.html')) files.push(p)
  }
}
walk(dist)

/** Tautan ke situs sendiri ada filenya: file langsung, atau folder dengan index.html */
function exists(urlPath) {
  const target = path.join(dist, decodeURIComponent(urlPath.slice(base.length)))
  return (fs.existsSync(target) && fs.statSync(target).isFile()) || fs.existsSync(path.join(target, 'index.html'))
}

const broken = new Set()
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)/g)) {
    const url = match[1]
    // Hanya tautan absolut di dalam situs. Tautan luar (https://...) dan protokol lain dilewati.
    if (!url.startsWith('/') || url.startsWith('//')) continue
    const from = path.relative(dist, file)
    if (!url.startsWith(`${base}/`)) broken.add(`${from} -> ${url} (tanpa base ${base})`)
    else if (!exists(url)) broken.add(`${from} -> ${url}`)
  }
}

console.log(`${files.length} halaman, ${broken.size} tautan rusak`)
for (const line of broken) console.log(`  ${line}`)
process.exit(broken.size ? 1 : 0)
