import './guide.css'
import { LEVELS, RANKS } from './glossary.js'
import { LESSONS, LESSON_XP } from './lessons.js'
import { ENTRIES, BY_ID } from './format.js'
import { learnedTerms, doneLessons, onProgress, setTermLearned, resetProgress } from './progress.js'
import { initCodex, renderEntry, mountDemos } from './codex.js'
import { initLearn } from './learn.js'

const TOTAL_XP =
  ENTRIES.reduce((sum, entry) => sum + LEVELS[entry.level].xp, 0) + LESSONS.length * LESSON_XP

const codex = initCodex()
const learn = initLearn()

// ---------- XP & rank di topbar ----------

function updateHeader() {
  const termXp = ENTRIES.filter((e) => learnedTerms.has(e.id)).reduce((sum, e) => sum + LEVELS[e.level].xp, 0)
  const lessonXp = LESSONS.filter((l) => doneLessons.has(l.id)).length * LESSON_XP
  const xp = termXp + lessonXp
  const ratio = xp / TOTAL_XP
  const rank = [...RANKS].reverse().find((r) => ratio >= r.min)
  document.querySelector('[data-rank]').textContent = rank.name
  document.querySelector('[data-xp-fill]').style.width = `${ratio * 100}%`
  document.querySelector('[data-xp-text]').textContent = `${xp} / ${TOTAL_XP} XP`

  // Satu istilah bisa tampil di beberapa tempat (Codex + panel samping); samakan semua checkbox-nya
  document.querySelectorAll('[data-learn]').forEach((box) => {
    box.checked = learnedTerms.has(box.dataset.learn)
    box.closest('.entry')?.classList.toggle('is-learned', box.checked)
  })
}

onProgress(() => {
  updateHeader()
  codex.refresh()
  learn.refresh()
})

// ---------- Navigasi: #/belajar[/id] atau #/codex, #c-bab, #e-istilah ----------

const views = {
  learn: document.querySelector('[data-view="learn"]'),
  codex: document.querySelector('[data-view="codex"]'),
}

function showView(name) {
  Object.entries(views).forEach(([key, el]) => (el.hidden = key !== name))
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    const active = tab.dataset.tab === name
    tab.classList.toggle('is-active', active)
    tab.setAttribute('aria-current', active ? 'page' : 'false')
  })
}

function route() {
  const hash = location.hash
  if (hash.startsWith('#/codex') || hash.startsWith('#c-') || hash.startsWith('#e-')) {
    const wasHidden = views.codex.hidden
    showView('codex')
    if (hash.startsWith('#e-')) requestAnimationFrame(() => codex.jumpTo(hash.slice(3)))
    else if (hash.startsWith('#c-')) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    else if (wasHidden) window.scrollTo({ top: 0 })
    return
  }
  showView('learn')
  const match = hash.match(/^#\/belajar\/([\w-]+)/)
  learn.show(match?.[1] ?? null)
}

window.addEventListener('hashchange', route)

// ---------- Panel samping istilah ----------

const drawer = document.querySelector('[data-drawer]')
const drawerBody = drawer.querySelector('[data-drawer-body]')
const backdrop = document.querySelector('[data-backdrop]')

function openDrawer(id) {
  const entry = BY_ID[id]
  if (!entry) return
  drawerBody.innerHTML = `${renderEntry(entry, { anchor: false })}
    <a class="drawer__codex" href="#e-${id}">Buka di Codex →</a>`
  mountDemos(drawerBody)
  updateHeader()
  drawer.hidden = false
  backdrop.hidden = false
  drawerBody.scrollTop = 0
  drawer.querySelector('[data-drawer-close]').focus({ preventScroll: true })
}

function closeDrawer() {
  drawer.hidden = true
  backdrop.hidden = true
}

backdrop.addEventListener('click', closeDrawer)
drawer.querySelector('[data-drawer-close]').addEventListener('click', closeDrawer)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !drawer.hidden) closeDrawer()
})

// ---------- Event global (delegation) ----------

document.addEventListener('click', (event) => {
  const term = event.target.closest('[data-term]')
  if (term) {
    event.preventDefault()
    openDrawer(term.dataset.term)
    return
  }

  // Link navigasi di dalam panel ("Buka di Codex", "Dibahas di Pelajaran N") menutup panel
  const drawerLink = event.target.closest('[data-drawer] a[href^="#"]')
  if (drawerLink) {
    closeDrawer()
    // Hash yang sama tidak memicu hashchange, jadi navigasi dijalankan manual
    if (drawerLink.getAttribute('href') === location.hash) route()
  }

  if (event.target.closest('[data-reset]')) {
    if (confirm('Hapus semua progres (istilah dipahami & pelajaran selesai)?')) resetProgress()
    return
  }

  // Link "Terkait" & peta pipa grafis di dalam Codex
  const jump = event.target.closest('[data-jump]')
  if (jump) {
    event.preventDefault()
    history.replaceState(null, '', `#e-${jump.dataset.jump}`)
    codex.jumpTo(jump.dataset.jump)
  }
})

document.addEventListener('change', (event) => {
  const id = event.target.dataset?.learn
  if (id) setTermLearned(id, event.target.checked)
})

route()
updateHeader()
codex.refresh()
