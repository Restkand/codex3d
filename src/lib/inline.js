/** Format inline ringan untuk teks di komponen (kuis): `kode` dan **tebal**, dengan HTML di-escape */
export function inline(text) {
  const escaped = String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
  return escaped.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/** URL internal + base path situs (mis. /krekit) */
export function withBase(path) {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}
