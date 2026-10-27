import { CHAPTERS } from './glossary.js'

export const ENTRIES = CHAPTERS.flatMap((chapter) => chapter.entries)
export const BY_ID = Object.fromEntries(ENTRIES.map((entry) => [entry.id, entry]))

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

/**
 * Mengubah teks berformat ringan menjadi HTML:
 *   `kode` -> <code>,  **tebal** -> <strong>,  *miring* -> <em>,  [[id]] / [[id|label]] -> tombol istilah
 * Isi kode diamankan lebih dulu agar tanda * atau [[ di dalam kode tidak ikut diproses.
 */
export function format(text) {
  const codes = []
  let html = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code)
    return `\u0000${codes.length - 1}\u0000`
  })
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>')
  html = html.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
    const name = label ?? escapeHtml(BY_ID[id]?.term ?? id)
    return `<button type="button" class="term" data-term="${id}">${name}</button>`
  })
  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`)
}
