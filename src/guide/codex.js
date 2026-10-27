import { CHAPTERS, PIPELINE, LEVELS } from './glossary.js'
import { DEEP } from './deep.js'
import { LESSONS } from './lessons.js'
import { ENTRIES, escapeHtml, format } from './format.js'
import { learnedTerms } from './progress.js'
import { mountDemo } from './demos.js'

// id istilah -> pelajaran yang membahasnya
const LESSONS_BY_TERM = {}
LESSONS.forEach((lesson) => {
  lesson.terms.forEach((id) => (LESSONS_BY_TERM[id] ??= []).push(lesson))
})

/**
 * HTML satu entri. Dipakai di halaman Codex (anchor: true) dan di panel samping (anchor: false).
 * Di panel samping, link "Terkait" membuka istilah lain di panel yang sama, bukan melompat ke Codex.
 */
export function renderEntry(entry, { anchor = true } = {}) {
  const level = LEVELS[entry.level]
  const linkAttr = anchor ? 'data-jump' : 'data-term'
  const related = (entry.related ?? [])
    .map((id) => ENTRIES.find((e) => e.id === id))
    .filter(Boolean)
    .map((e) => `<a href="#e-${e.id}" ${linkAttr}="${e.id}">${escapeHtml(e.term)}</a>`)
    .join('')
  const lessons = (LESSONS_BY_TERM[entry.id] ?? [])
    .map((l) => `<a href="#/belajar/${l.id}">Pelajaran ${l.num}</a>`)
    .join('')
  const deep = DEEP[entry.id]

  return `
    <article class="entry" ${anchor ? `id="e-${entry.id}"` : ''} data-entry="${entry.id}" data-level="${entry.level}">
      <header class="entry__head">
        <span class="badge badge--${entry.level}">${level.name}</span>
        <h3 class="entry__term">${escapeHtml(entry.term)}</h3>
        ${entry.aka ? `<span class="entry__aka">${escapeHtml(entry.aka)}</span>` : ''}
        <label class="entry__learned">
          <input type="checkbox" data-learn="${entry.id}" ${learnedTerms.has(entry.id) ? 'checked' : ''} />
          <span>Dipahami <small>+${level.xp} XP</small></span>
        </label>
      </header>
      <p class="entry__def">${format(entry.def)}</p>
      ${entry.analogy ? `<p class="entry__analogy"><span class="tag">Analogi</span>${format(entry.analogy)}</p>` : ''}
      ${entry.code ? `<pre class="entry__code"><code>${escapeHtml(entry.code)}</code></pre>` : ''}
      ${deep ? `
        <details class="entry__deep">
          <summary>Pelajari lebih dalam</summary>
          ${deep.map((p) => `<p>${format(p)}</p>`).join('')}
        </details>` : ''}
      ${entry.demo ? `<div class="demo" data-demo="${entry.demo}"><span class="tag tag--demo">Demo</span></div>` : ''}
      ${entry.quest ? `<p class="entry__quest"><span class="tag tag--quest">Quest</span>${format(entry.quest)}</p>` : ''}
      ${entry.file || related || lessons ? `
        <footer class="entry__foot">
          ${lessons ? `<span class="entry__related"><span class="tag tag--lesson">Dibahas di</span>${lessons}</span>` : ''}
          ${entry.file ? `<span class="entry__file"><span class="tag tag--file">File</span><code>${escapeHtml(entry.file)}</code></span>` : ''}
          ${related ? `<span class="entry__related"><span class="tag tag--link">Terkait</span>${related}</span>` : ''}
        </footer>` : ''}
    </article>`
}

export function mountDemos(root) {
  root.querySelectorAll('[data-demo]').forEach((node) => {
    if (node.dataset.mounted) return
    node.dataset.mounted = 'true'
    mountDemo(node.dataset.demo, node)
  })
}

export function initCodex() {
  const chaptersRoot = document.querySelector('[data-chapters]')
  const filters = { query: '', level: 'all', hideLearned: false }

  // ---------- Render ----------

  document.querySelector('[data-nav]').innerHTML = CHAPTERS.map(
    (chapter) => `
    <li><a href="#c-${chapter.id}" data-nav-link="${chapter.id}">
      <span>${escapeHtml(chapter.title)}</span>
      <small data-nav-count="${chapter.id}"></small>
    </a></li>`,
  ).join('')

  document.querySelector('[data-pipeline]').innerHTML = PIPELINE.map(
    (step, index) => `
    <li class="map__step">
      <a href="#e-${step.id}" data-jump="${step.id}">
        <span class="map__index">${index + 1}</span>
        <strong>${escapeHtml(step.label)}</strong>
        <small>${escapeHtml(step.sub)}</small>
      </a>
    </li>`,
  ).join('')

  chaptersRoot.innerHTML = CHAPTERS.map(
    (chapter, index) => `
    <section class="chapter" id="c-${chapter.id}" data-chapter="${chapter.id}">
      <header class="chapter__head">
        <span class="chapter__num">Bab ${String(index + 1).padStart(2, '0')}</span>
        <h2 class="chapter__title">${escapeHtml(chapter.title)}</h2>
        <p class="chapter__intro">${escapeHtml(chapter.intro)}</p>
      </header>
      <div class="chapter__entries">${chapter.entries.map((e) => renderEntry(e)).join('')}</div>
    </section>`,
  ).join('')

  mountDemos(chaptersRoot)

  // ---------- Filter ----------

  function matches(entry) {
    if (filters.level !== 'all' && String(entry.level) !== filters.level) return false
    if (filters.hideLearned && learnedTerms.has(entry.id)) return false
    if (!filters.query) return true
    return `${entry.term} ${entry.aka ?? ''} ${entry.def}`.toLowerCase().includes(filters.query)
  }

  function applyFilters() {
    let visibleTotal = 0
    CHAPTERS.forEach((chapter) => {
      let visible = 0
      chapter.entries.forEach((entry) => {
        const show = matches(entry)
        document.getElementById(`e-${entry.id}`).hidden = !show
        if (show) visible++
      })
      document.getElementById(`c-${chapter.id}`).hidden = visible === 0
      visibleTotal += visible
    })
    document.querySelector('[data-empty]').hidden = visibleTotal > 0
  }

  function resetFilters() {
    Object.assign(filters, { query: '', level: 'all', hideLearned: false })
    document.querySelector('[data-search]').value = ''
    document.querySelector('[data-hide-learned]').checked = false
    document.querySelectorAll('[data-level]').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.level === 'all'))
    applyFilters()
  }

  document.querySelector('[data-search]').addEventListener('input', (event) => {
    filters.query = event.target.value.trim().toLowerCase()
    applyFilters()
  })

  document.querySelector('[data-levels]').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-level]')
    if (!chip) return
    filters.level = chip.dataset.level
    document.querySelectorAll('[data-level]').forEach((c) => c.classList.toggle('is-active', c === chip))
    applyFilters()
  })

  document.querySelector('[data-hide-learned]').addEventListener('change', (event) => {
    filters.hideLearned = event.target.checked
    applyFilters()
  })

  // ---------- Sidebar: bab yang sedang dibaca ----------

  const links = new Map([...document.querySelectorAll('[data-nav-link]')].map((a) => [a.dataset.navLink, a]))
  const observer = new IntersectionObserver(
    (records) => {
      records.forEach((record) => {
        if (!record.isIntersecting) return
        links.forEach((a, id) => a.classList.toggle('is-current', id === record.target.dataset.chapter))
      })
    },
    { rootMargin: '-30% 0px -60% 0px' },
  )
  document.querySelectorAll('[data-chapter]').forEach((section) => observer.observe(section))

  /** Melompat ke entri; jika tersembunyi oleh filter, filter direset dulu */
  function jumpTo(id) {
    const target = document.getElementById(`e-${id}`)
    if (!target) return
    if (target.hidden || target.closest('.chapter').hidden) resetFilters()
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.classList.remove('is-flash')
    void target.offsetWidth // paksa reflow agar animasi CSS bisa diulang
    target.classList.add('is-flash')
  }

  function refresh() {
    CHAPTERS.forEach((chapter) => {
      const done = chapter.entries.filter((entry) => learnedTerms.has(entry.id)).length
      const counter = document.querySelector(`[data-nav-count="${chapter.id}"]`)
      counter.textContent = `${done}/${chapter.entries.length}`
      counter.classList.toggle('is-done', done === chapter.entries.length)
    })
    if (filters.hideLearned) applyFilters()
  }

  return { jumpTo, refresh }
}
