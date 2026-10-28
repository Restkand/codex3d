/**
 * Plugin Markdown (Sätteri, parser bawaan Astro 7): menambahkan `base` ke link internal.
 * Penulis cukup menulis [teks](/kamus/dasar/webgl/), dan saat situs di-deploy
 * ke sub-path (mis. /krekit/) link-nya otomatis menjadi /krekit/kamus/dasar/webgl/.
 */
export function baseLinksPlugin(base = '/') {
  const prefix = base.replace(/\/$/, '')
  return {
    name: 'base-links',
    link(node, ctx) {
      const url = node.url
      if (prefix && url.startsWith('/') && !url.startsWith('//') && !url.startsWith(prefix + '/')) {
        ctx.setProperty(node, 'url', prefix + url)
      }
    },
  }
}
