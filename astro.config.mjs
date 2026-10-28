import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import expressiveCode from 'astro-expressive-code'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { satteri } from '@astrojs/markdown-satteri'
import { SITE } from './src/site.config.mjs'
import { baseLinksPlugin } from './src/lib/base-links.mjs'

export default defineConfig({
  site: SITE.site,
  base: SITE.base,
  // Bahasa Indonesia dulu. Untuk menambah Inggris nanti: konfigurasi `i18n` Astro
  // + folder src/content/docs/en/, lalu sesuaikan halaman di src/pages/.
  markdown: {
    processor: satteri({ mdastPlugins: [baseLinksPlugin(SITE.base)] }),
  },
  integrations: [
    // Blok kode: harus didaftarkan sebelum mdx() agar ikut memproses blok kode di file MDX
    expressiveCode({
      plugins: [pluginLineNumbers()],
      defaultProps: { showLineNumbers: false },
      themes: ['github-dark-default'],
    }),
    mdx(),
  ],
})
