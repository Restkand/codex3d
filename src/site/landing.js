import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createSetup } from '../experiment/core/setup.js'
import { createLights } from '../experiment/world/lights.js'
import { createPost } from '../experiment/post.js'
import { createKrekit } from './krekit.js'
import { createDunia } from './dunia.js'
import { loadProgress, RANKS } from '../lib/progress.js'

/**
 * Halaman depan bersama Krekit.
 *
 * Cara Krekit ditempatkan: setiap section punya "panggung" [data-krekit-spot] di layout HTML.
 * Setiap frame, titik bawah-tengah panggung aktif (piksel layar) diubah menjadi koordinat dunia 3D,
 * lalu Krekit mengejarnya dengan halus. Hasilnya Krekit ikut bergulir bersama halaman,
 * menggelinding ke panggung berikutnya, dan tidak pernah menutupi teks.
 *
 * Bagian teks (animasi masuk, penghitung, tilt kartu) berjalan terpisah dari 3D,
 * sehingga halaman tetap utuh walaupun WebGL tidak tersedia.
 */
gsap.registerPlugin(ScrollTrigger)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Layout bertumpuk (panggung Krekit di atas teks): HP dan tablet tegak. Sama dengan media query di landing.css
const STACKED = '(max-width: 767px), (max-width: 1024px) and (orientation: portrait)'
// Kebalikan STACKED: desktop, laptop, dan tablet mendatar
const WIDE = '(min-width: 768px) and (orientation: landscape), (min-width: 1025px)'
// Layar sentuh tanpa kursor: kalimat Krekit memakai 'ketuk', bukan 'arahkan kursor'
const touchOnly = window.matchMedia('(hover: none)').matches
const sections = [...document.querySelectorAll('main > [data-section]')]
// Teks ajakan untuk layar sentuh: HTML hanya berisi versi kursor, agar tidak terbaca dua kali
if (touchOnly) document.querySelectorAll('[data-touch-text]').forEach((el) => (el.textContent = el.dataset.touchText))

// ---------- Animasi teks & kartu ----------

gsap.fromTo(
  '.hero__text > *',
  { autoAlpha: 0, y: reduceMotion ? 0 : 30 },
  { autoAlpha: 1, y: 0, duration: reduceMotion ? 0.01 : 0.9, stagger: reduceMotion ? 0 : 0.1, ease: 'power3.out', delay: 0.2 },
)

// ---------- Judul Pos 0: baris wireframe "menangkap sinyal", lalu ter-render ----------
// Huruf diacak lalu tersusun dari kiri ke kanan, seperti layar yang baru menyala, ditutup getar glitch.
const heroTitle = document.querySelector('[data-hero-title]')
const heroWire = document.querySelector('[data-hero-wire]')

/** Getar glitch singkat pada baris kuning (CSS .is-glitching) */
function glitchHeroWire() {
  if (reduceMotion || !heroWire) return
  heroWire.classList.remove('is-glitching')
  void heroWire.offsetWidth // mulai ulang animasi CSS
  heroWire.classList.add('is-glitching')
}

/** Baris kuning terisi penuh (ter-render) atau kembali wireframe, dengan glitch saat berubah */
const heroTextBox = document.querySelector('.hero__text')
const heroButtons = [...document.querySelectorAll('.hero .btn')]
function setHeroRendered(rendered) {
  if (!heroTitle || heroTitle.classList.contains('is-rendered') === rendered) return
  heroTitle.classList.toggle('is-rendered', rendered)
  // Tombol hero ikut ter-render bersama judul (lihat landing.css: "Tombol Pos 0")
  heroTextBox?.classList.toggle('is-rendered', rendered)
  glitchHeroWire()
  if (reduceMotion) return
  heroButtons.forEach((button) => {
    button.classList.remove('is-glitching')
    void button.offsetWidth // mulai ulang animasi CSS
    button.classList.add('is-glitching')
  })
}

if (heroWire && !reduceMotion) {
  const text = heroWire.textContent
  // Huruf acak diambil dari kalimat itu sendiri: lebarnya mirip, jadi jumlah baris tidak berubah saat diacak
  const GLYPHS = text.replace(/[^a-z]/gi, '')
  const state = { revealed: 0 }
  // Kunci tinggi baris setelah font siap, agar teks di bawahnya tidak bergeser selama animasi
  document.fonts?.ready.then(() => {
    heroWire.style.minHeight = `${heroWire.offsetHeight}px`
  })
  const scramble = () => {
    const shown = Math.floor(state.revealed)
    heroWire.textContent = [...text]
      .map((char, i) => (i < shown || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join('')
  }
  scramble()
  gsap.to(state, {
    revealed: text.length,
    duration: 1.1,
    delay: 0.45,
    ease: 'power1.inOut',
    onUpdate: scramble,
    onComplete: () => {
      heroWire.textContent = text
      heroWire.style.minHeight = ''
      glitchHeroWire()
    },
  })
}

document.querySelectorAll('.reveal').forEach((section) => {
  gsap.fromTo(
    section.querySelectorAll('[data-reveal]'),
    { autoAlpha: 0, y: reduceMotion ? 0 : 40 },
    {
      autoAlpha: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.8,
      stagger: reduceMotion ? 0 : 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' },
    },
  )
})

document.querySelectorAll('[data-count]').forEach((el) => {
  const state = { value: 0 }
  gsap.to(state, {
    value: Number(el.dataset.count),
    duration: reduceMotion ? 0 : 1.6,
    ease: 'power2.out',
    onUpdate: () => (el.textContent = Math.round(state.value)),
    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
  })
})

if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    gsap.set(card, { transformPerspective: 800 })
    const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' })
    const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' })
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      rotY((x - 0.5) * 12)
      rotX(-(y - 0.5) * 12)
      card.style.setProperty('--mx', `${x * 100}%`)
      card.style.setProperty('--my', `${y * 100}%`)
    })
    card.addEventListener('pointerleave', () => {
      rotX(0)
      rotY(0)
    })
  })
}

const topnav = document.querySelector('[data-topnav]')
const updateNav = () => topnav.classList.toggle('is-scrolled', window.scrollY > 40)
window.addEventListener('scroll', updateNav, { passive: true })
updateNav()

// ---------- Animasi Pos 1 sampai 4 ----------
// Berjalan tanpa WebGL. Scene 3D (jika ada) ikut bereaksi lewat sceneHooks yang diisi initScene().
const sceneHooks = {}

// Pos 1 · Jalur produksi: ban berjalan membawa barang melewati stasiun Engine -> Desain -> Produksi -> Bisnis -> Pemain.
// Barangnya diam di tengah, stasiunnya yang lewat. Stasiun aktif = stasiun yang paling dekat ke tengah ban.
// Desktop: section di-pin dan scroll halaman menggeser ban. HP: ban digeser dengan jari (scroll-snap).
const belt = document.querySelector('[data-belt]')
const beltTrack = belt?.querySelector('[data-belt-track]')
const beltStations = belt ? [...belt.querySelectorAll('[data-station]')] : []
let beltStation = -1
let beltPin = null
// Tebal ban dalam piksel, sama dengan --band di landing.css: Krekit berdiri tepat di atasnya
const BELT_BAND = 22
function updateBelt() {
  const max = beltTrack.scrollWidth - beltTrack.clientWidth
  const index = max > 0 ? Math.round((beltTrack.scrollLeft / max) * (beltStations.length - 1)) : 0
  if (index === beltStation) return
  beltStation = index
  const station = beltStations[index]
  belt.dataset.stage = station.dataset.station
  beltStations.forEach((s, i) => {
    s.classList.toggle('is-here', i === index)
    s.classList.toggle('is-passed', i < index)
  })
  document.querySelector('[data-belt-step]').textContent = `${String(index + 1).padStart(2, '0')} / ${String(beltStations.length).padStart(2, '0')}`
  document.querySelector('[data-belt-text]').textContent = station.dataset.caption
  sceneHooks.station?.(index, beltStations.length)
}
if (belt) {
  beltTrack.addEventListener('scroll', updateBelt, { passive: true })
  updateBelt()
  if (!reduceMotion) {
    gsap.matchMedia().add(WIDE, () => {
      belt.classList.add('is-driven')
      // Menyusul halus, agar ban tidak tersentak mengikuti setiap langkah roda mouse
      const slide = gsap.quickTo(beltTrack, 'scrollLeft', { duration: 0.5, ease: 'power2.out' })
      beltPin = ScrollTrigger.create({
        trigger: '#kenapa',
        start: 'top top',
        end: '+=160%',
        pin: true,
        onUpdate: (self) => slide(self.progress * (beltTrack.scrollWidth - beltTrack.clientWidth)),
      })
      return () => {
        belt.classList.remove('is-driven')
        beltPin = null
      }
    })
  }
  // Mengetuk gerbang stasiun: ban bergeser ke stasiun itu
  belt.querySelectorAll('[data-station-go]').forEach((gate) => {
    gate.addEventListener('click', () => {
      const i = Number(gate.dataset.stationGo)
      const share = i / (beltStations.length - 1)
      if (beltPin) window.scrollTo({ top: beltPin.start + share * (beltPin.end - beltPin.start), behavior: 'smooth' })
      else beltTrack.scrollTo({ left: share * (beltTrack.scrollWidth - beltTrack.clientWidth), behavior: reduceMotion ? 'auto' : 'smooth' })
    })
  })
}

// Pos 2 · Pohon skill: akar Fondasi Engine di atas, cabang di bawahnya. Memilih node (sorot di desktop,
// ketuk di HP) menyalakan cabang dari akar ke node itu dan mengisi panel ringkasan.
// Garis cabang dihitung dari offsetLeft/Top (posisi layout), jadi tidak terpengaruh animasi masuk.
const skillTree = document.querySelector('[data-skill-tree]')
const skills = [...document.querySelectorAll('[data-skill]')]
const skillRoot = skills[0]
let skillSelected = skillRoot
const skillById = (id) => skills.find((s) => s.dataset.skill === id)

function layoutSkillEdges() {
  if (!skillTree) return
  const svg = skillTree.querySelector('svg')
  svg.setAttribute('viewBox', `0 0 ${skillTree.offsetWidth} ${skillTree.offsetHeight}`)
  svg.replaceChildren(
    ...skills
      .filter((s) => s.dataset.parent)
      .map((child) => {
        const parent = skillById(child.dataset.parent)
        const x1 = parent.offsetLeft + parent.offsetWidth / 2
        const y1 = parent.offsetTop + parent.offsetHeight
        const x2 = child.offsetLeft + child.offsetWidth / 2
        const y2 = child.offsetTop
        // Siku: turun dari induk, mendatar, lalu turun ke anak
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', `M${x1} ${y1}V${(y1 + y2) / 2}H${x2}V${y2}`)
        path.dataset.to = child.dataset.skill
        return path
      }),
  )
  litSkillPath()
}

/** Nyalakan cabang dari akar sampai node terpilih */
function litSkillPath() {
  const lit = new Set()
  for (let node = skillSelected; node?.dataset.parent; node = skillById(node.dataset.parent)) lit.add(node.dataset.skill)
  skillTree.querySelectorAll('path').forEach((path) => path.classList.toggle('is-lit', lit.has(path.dataset.to)))
}

function selectSkill(node, { say = true } = {}) {
  if (node === skillSelected) return
  skillSelected = node
  skills.forEach((s) => s.classList.toggle('is-selected', s === node))
  litSkillPath()
  const panel = document.querySelector('[data-skill-panel]')
  const { num, title, blurb, status } = node.dataset
  panel.classList.toggle('is-locked', node.classList.contains('is-locked'))
  panel.querySelector('[data-panel-num]').textContent = num
  panel.querySelector('[data-panel-status]').textContent = status
  panel.querySelector('[data-panel-title]').textContent = title
  panel.querySelector('[data-panel-blurb]').textContent = blurb
  panel.querySelector('[data-panel-link]').href = node.href
  panel.querySelector('[data-panel-count]').textContent = `${skills.indexOf(node) + 1} / ${skills.length}`
  sceneHooks.skill?.(node, say ? node.dataset.krekitLine : null)
}

if (skillTree) {
  layoutSkillEdges()
  window.addEventListener('resize', layoutSkillEdges)
  ScrollTrigger.addEventListener('refresh', layoutSkillEdges)
  const panel = document.querySelector('[data-skill-panel]')
  // Desktop: sorot dengan mouse untuk memilih. Kursor keluar dari pohon dan panel: kembali ke akar setelah jeda.
  // Hanya untuk mouse: di sebagian HP, jari yang menyentuh node saat scroll juga memicu pointerenter,
  // sehingga pilihan berubah sendiri. Di layar sentuh node dipilih dengan ketukan atau tombol ‹ › di panel.
  let backToRoot
  const stay = () => backToRoot?.kill()
  const byMouse = (handler) => (event) => event.pointerType === 'mouse' && handler()
  skills.forEach((node) => node.addEventListener('pointerenter', byMouse(() => (stay(), selectSkill(node)))))
  for (const zone of [skillTree, panel]) {
    zone.addEventListener('pointerenter', byMouse(stay))
    zone.addEventListener(
      'pointerleave',
      byMouse(() => {
        stay()
        backToRoot = gsap.delayedCall(0.7, () => selectSkill(skillRoot, { say: false }))
      }),
    )
  }
  panel.querySelectorAll('[data-skill-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = (skills.indexOf(skillSelected) + Number(button.dataset.skillStep) + skills.length) % skills.length
      stay()
      selectSkill(skills[next])
    })
  })
  skills.forEach((node) => {
    node.addEventListener('focus', () => (stay(), selectSkill(node)))
    // Layar sempit: ketukan pertama memilih node; tautannya dibuka lewat tombol di panel
    node.addEventListener('click', (event) => {
      if (!window.matchMedia(STACKED).matches) return
      event.preventDefault()
      selectSkill(node)
    })
  })
}

// Pos 5 · Layar akhir: kredit hanya bergulir saat terlihat (animasi CSS, landing.css). "Main lagi" kembali ke awal.
// Putaran tanpa sambungan butuh daftar kedua; salinan itu dibuat di sini (bukan di HTML) dan ditandai
// aria-hidden + inert, agar pembaca layar dan mesin pencari hanya membaca satu daftar.
const credits = document.querySelector('[data-credits]')
if (credits && !reduceMotion) {
  const list = credits.querySelector('.credits__list')
  const copy = list.cloneNode(true)
  copy.setAttribute('aria-hidden', 'true')
  copy.inert = true
  list.after(copy)
  credits.classList.add('is-looping')
  ScrollTrigger.create({ trigger: credits, start: 'top bottom', end: 'bottom top', toggleClass: 'is-rolling' })
}
document.querySelector('[data-replay]')?.addEventListener('click', () => {
  sceneHooks.replay?.()
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
})

// Pos 3 · Tarik kartu istilah: semua istilah Kamus dikocok sekali, lalu ditarik berurutan (tidak ada yang
// keluar dua kali sebelum tumpukan habis). Kartu terbang dari tumpukan ke tempatnya sambil terbalik
// (transform 3D CSS, digerakkan GSAP). Tanpa JavaScript, kartu pertama tampil terbuka.
const draw = document.querySelector('[data-draw]')
if (draw) {
  const deck = JSON.parse(document.getElementById('kamus-deck').textContent)
  const shuffle = () => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
  }
  shuffle()
  const card = draw.querySelector('[data-card]')
  const inner = draw.querySelector('[data-card-inner]')
  const stack = draw.querySelector('[data-draw-stack]')
  const count = draw.querySelector('[data-draw-count]')
  const field = (name) => draw.querySelector(`[data-card-${name}]`)
  // Sebelum kartu pertama ditarik, yang terlihat punggungnya
  gsap.set(inner, { rotationY: 180 })

  function fill(term) {
    field('chapter').textContent = term.chapter
    field('level').dataset.cardLevel = term.level
    field('level-name').textContent = term.levelName
    field('title').textContent = term.title
    field('aka').textContent = term.aka ? `Disebut juga: ${term.aka}` : ''
    field('desc').textContent = term.description
    field('link').href = term.href
  }

  let drawn = 0
  let flight
  function drawCard() {
    if (drawn === deck.length) {
      shuffle()
      drawn = 0
    }
    const term = deck[drawn++]
    count.textContent = drawn === deck.length ? 'Tumpukan habis. Tarik lagi untuk mengocok ulang.' : `${deck.length - drawn} kartu di tumpukan`
    sceneHooks.draw?.(term)
    flight?.progress(1)
    if (reduceMotion) {
      fill(term)
      gsap.set(inner, { rotationY: 0 })
      return
    }
    // Kartu lama disingkirkan, lalu kartu baru terbang dari tumpukan dalam keadaan tertutup dan terbalik
    const from = stack.getBoundingClientRect()
    const to = card.getBoundingClientRect()
    flight = gsap
      .timeline()
      .to(card, { y: -24, autoAlpha: 0, duration: 0.16, ease: 'power1.in' })
      .call(() => fill(term))
      .set(card, {
        x: from.left + from.width / 2 - (to.left + to.width / 2),
        y: from.top + from.height / 2 - (to.top + to.height / 2),
        scale: from.width / to.width,
        rotation: -12,
        autoAlpha: 1,
      })
      .set(inner, { rotationY: 180 })
      .to(card, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.55, ease: 'power3.out' })
      .to(inner, { rotationY: 0, duration: 0.6, ease: 'back.out(1.4)' }, '<0.15')
  }
  draw.querySelector('[data-draw-btn]').addEventListener('click', drawCard)
  stack.addEventListener('click', drawCard)
}

// Pos 4 · Chat tanya-jawab: pengunjung memilih pertanyaan, Krekit "mengetik" lalu membalas dengan aturan
// konten beserta contohnya. Pesan tampil sesuai urutan pertanyaan dipilih (style.order). Setelah ketiganya
// dijawab, muncul penutup dan tombol "Ulangi dari awal". Tanpa JavaScript seluruh percakapan tampil.
const chat = document.querySelector('[data-chat]')
if (chat) {
  chat.classList.add('js-chat')
  const log = chat.querySelector('[data-chat-log]')
  const asks = [...chat.querySelectorAll('[data-chat-ask]')]
  const resetButton = chat.querySelector('[data-chat-reset]')
  const outro = chat.querySelector('[data-chat-outro]')
  const chips = [...document.querySelectorAll('.rule-chips [data-rule]')]
  const answered = new Set()
  let order = 0
  let busy = false

  const place = (node) => {
    node.style.order = ++order
    node.classList.add('is-shown')
    // Desktop: log punya tinggi tetap, jadi gulir ke pesan terbaru. HP: log memanjang mengikuti isi
    // Ditunda satu frame: tunggu pesan baru selesai ditata agar pesan terakhir terlihat utuh
    requestAnimationFrame(() => log.scrollTo({ top: log.scrollHeight }))
  }

  function ask(id) {
    if (busy || answered.has(id)) return
    busy = true
    answered.add(id)
    chat.querySelector(`[data-chat-ask="${id}"]`).hidden = true
    place(log.querySelector(`[data-chat-q="${id}"]`))
    const typing = document.createElement('div')
    typing.className = 'msg msg--krekit msg--typing'
    typing.setAttribute('aria-label', 'Krekit sedang mengetik')
    typing.innerHTML = '<i></i><i></i><i></i>'
    log.append(typing)
    place(typing)
    sceneHooks.chat?.(false)
    gsap.delayedCall(reduceMotion ? 0 : 0.8, () => {
      typing.remove()
      place(log.querySelector(`[data-chat-a="${id}"]`))
      chips.find((chip) => chip.dataset.rule === id)?.classList.add('is-checked')
      busy = false
      if (answered.size < asks.length) return
      place(outro)
      resetButton.hidden = false
      sceneHooks.chat?.(true)
    })
  }

  asks.forEach((button) => button.addEventListener('click', () => ask(button.dataset.chatAsk)))
  resetButton.addEventListener('click', () => {
    answered.clear()
    order = 0
    log.querySelectorAll('.is-shown').forEach((node) => node.classList.remove('is-shown'))
    chips.forEach((chip) => chip.classList.remove('is-checked'))
    asks.forEach((button) => (button.hidden = false))
    resetButton.hidden = true
    log.scrollTop = 0
  })
}

// ---------- Tahap pertumbuhan Krekit dari progres belajar (localStorage, tanpa server) ----------

function growthStage() {
  try {
    const items = JSON.parse(document.getElementById('progress-items').textContent)
    const done = loadProgress()
    const total = items.reduce((sum, i) => sum + i.xp, 0)
    const xp = items.filter((i) => done.has(i.id)).reduce((sum, i) => sum + i.xp, 0)
    const ratio = total ? xp / total : 0
    // Indeks rank tertinggi yang sudah dicapai = tahap 0..5
    return RANKS.reduce((stage, rank, i) => (ratio >= rank.min ? i : stage), 0)
  } catch {
    return 0
  }
}

// ---------- Scene 3D: Krekit ----------

/**
 * Suasana per section: warna mata, warna aura, latar, dan kalimat saat pertama kali dikunjungi.
 * Pedoman kalimat Krekit: singkat, jelas, menjelaskan isi bagian atau apa yang bisa dilakukan.
 * Ramah tanpa berlebihan: tanpa slang, tanpa "Yay", tanpa rentetan tanda seru.
 */
const MOODS = [
  // Pos 0 "Dunia belum di-render": ruang hitam, aura cyan
  { glow: '#7ff0ff', aura: '#00e5ff', bg: '#07070b', line: 'Ikuti aku, maka kamu akan memahami bagaimana dunia di belakangku ini terbentuk.' },
  {
    glow: '#ffe08a',
    aura: '#ffcc33',
    bg: '#100c08',
    // Sekaligus komentar stasiun pertama (Engine), karena ban dimulai dari sana
    line: window.matchMedia(STACKED).matches
      ? 'Telur di ban itu aku, waktu masih garis-garis. Geser bannya, aku dibentuk di setiap stasiun.'
      : 'Badanku masih garis-garis, begini rupaku di mata engine. Scroll pelan-pelan, aku dibentuk sepanjang ban ini.',
  },
  { glow: '#9dff8a', aura: '#7cff6b', bg: '#08100d', line: 'Baru Fondasi Engine yang sudah ada pelajarannya. Lima jalur lain masih kerangka.' },
  { glow: '#8ad2ff', aura: '#00b3ff', bg: '#080b14', line: touchOnly ? 'Ketuk Tarik kartu. Aku juga penasaran istilah apa yang keluar.' : 'Tarik satu kartu dari tumpukanku. Aku juga penasaran istilah apa yang keluar.' },
  { glow: '#ffe08a', aura: '#ffcc33', bg: '#0d0b08', line: 'Pilih pertanyaan di obrolan itu. Aku jawab satu per satu.' },
  { glow: '#ffa6f0', aura: '#ff5ce1', bg: '#0b0b10', line: 'Terima kasih sudah ikut sampai akhir. Slot kontributor di kredit itu masih kosong.' },
]
const STAGE_LINES = [
  null,
  'Ada retakan baru di cangkangku. Kamu sudah mulai menandai materi.',
  'Retakannya bertambah lagi sejak kamu terakhir mampir.',
  'Lebih dari separuh materi sudah kamu tandai selesai.',
  'Cangkangku hampir penuh retakan. Sedikit lagi.',
  'Cangkangku jadi emas. Hampir semua materi sudah kamu selesaikan.',
]
// Pos 1: komentar Krekit saat ban berhenti di sebuah stasiun. Dari sudut pandangnya sendiri,
// bukan mengulang keterangan stasiun di bawah ban. Indeks 0 dipakai saat kembali ke Engine.
const STATION_LINES = [
  'Kembali jadi garis-garis lagi. Rasanya ringan sekali.',
  'Sekarang aku punya warna dan wajah. Ini bagian favoritku.',
  'Agak sempit di dalam kotak. Tenang, aku sudah diuji dulu sebelum dikemas.',
  'Ada label rilis di kotakku. Tinggal menunggu ada yang memilihku.',
  'Akhirnya keluar juga. Semoga pemain pertamaku itu kamu.',
]
// Pos 3: reaksi Krekit atas kartu yang ditarik, menurut level istilahnya (1 Dasar, 2 Menengah, 3 Lanjut)
const DRAW_LINES = {
  1: ['Istilah dasar. Bagus untuk mulai.', 'Dasar, tapi muncul hampir di setiap game.'],
  2: ['Level menengah. Lebih mudah kalau dasarnya sudah paham.', 'Aku butuh waktu untuk paham yang ini. Analoginya membantu.'],
  3: ['Level lanjut. Tidak apa-apa kalau belum paham sekarang.', 'Yang ini juga masih membuatku berpikir keras.'],
}
const CLICK_LINES = ['Hup!', 'Pelan-pelan, cangkangku sudah retak.', 'Aku ringan, tapi jangan dilempar.', 'Iya, aku masih di sini.']
// Pos 0 di layar sempit: sapaan pertama, mengajak mencoba tab Wireframe · Blockout · Render di bawah Krekit
const HERO_TOUCH_LINE = 'Coba ketuk tab di bawahku ini, maka kamu akan mengetahui perbedaannya.'
// Pos 0 di layar sempit: dunia di-render per tingkat setiap Krekit diketuk
const LEVEL_LINES = [
  'Dunia ini masih wireframe. Ketuk aku untuk membangunnya.',
  'Sekarang sudah ada bentuknya, masih abu-abu. Ini tahap blockout. Ketuk sekali lagi.',
  'Warna dan cahaya masuk. Game dibuat lapis demi lapis seperti ini.',
]

function initScene() {
  const canvas = document.querySelector('canvas.webgl')
  const { scene, camera, renderer } = createSetup(canvas, { alpha: true })
  // Latar scene disimpan: dilepas (transparan) saat Krekit berjaga di atas konten di layar sempit
  const sceneBackground = scene.background
  const { directional } = createLights(scene)
  // Krekit memakai bayangan bundar sederhana, shadow map tidak diperlukan (lebih ringan)
  renderer.shadowMap.enabled = false
  directional.castShadow = false
  // Kamera tetap (tanpa parallax) agar posisi Krekit selalu tepat di panggungnya
  camera.position.set(0, 0, 6)
  camera.lookAt(0, 0, 0)

  const post = createPost({ renderer, scene, camera })
  // Mata Krekit berdenyut selama teks gelembung diketik
  const bubble = createBubble({ onSay: (seconds) => krekit.talk(seconds) })

  let activeIndex = 0
  let travelDirection = 1
  const krekit = createKrekit(scene, {
    reduceMotion,
    onSettle: () => {
      // Mendarat: menabrak judul section sampai bergoyang
      const heading = sections[shownIndex]?.querySelector('.display')
      if (heading && !reduceMotion) gsap.fromTo(heading, { x: travelDirection * 7 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' })
    },
  })
  const stage = growthStage()
  krekit.setStage(stage)
  krekit.appear()

  // ---------- Layar -> dunia 3D ----------

  const ndc = new THREE.Vector3()
  const ray = new THREE.Vector3()
  /** Titik piksel layar -> titik di bidang z = 0 dunia 3D */
  function screenToWorld(px, py, out) {
    ndc.set((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1, 0.5).unproject(camera)
    ray.copy(ndc).sub(camera.position).normalize()
    return out.copy(camera.position).addScaledVector(ray, -camera.position.z / ray.z)
  }
  /** Berapa unit dunia per 1 piksel layar, di sekitar titik dunia `at` */
  const unitsPerPixel = (at) => (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.distanceTo(at)) / window.innerHeight

  /**
   * Layar sempit: kamera sedikit lebih tinggi dan menunduk, agar lantai diorama di panggung hero
   * (bagian atas layar) terlihat dari atas, bukan dari bawah. Desktop: kamera lurus seperti semula.
   */
  let compact = false
  function poseCamera() {
    compact = window.matchMedia(STACKED).matches
    camera.position.set(0, compact ? 2.4 : 0, 6)
    camera.lookAt(0, compact ? 0.4 : 0, 0)
    camera.updateMatrixWorld()
  }

  const spots = sections.map((s) => s.querySelector('[data-krekit-spot]'))
  const target = new THREE.Vector3()
  const current = new THREE.Vector3()
  let currentScale = 0
  let placed = false

  // ---------- Perpindahan Krekit: selalu teleport dengan glitch, tidak pernah melintasi teks ----------
  // activeIndex = pos yang sedang dibaca (warna suasana, kalimat). shownIndex = pos tempat Krekit
  // sedang berdiri; hanya berubah di tengah animasi teleport. Render loop terus menyusulkan
  // shownIndex ke activeIndex, jadi posisi Krekit konsisten walau scroll dimainkan naik-turun.
  // Layar sempit: setelah Pos 0 Krekit berjaga di pojok bawah (docked), teleport hanya saat masuk/keluar.

  let shownIndex = 0
  let docked = false
  let swapping = false
  // Pengali skala & intensitas glitch Krekit selama perpindahan (dianimasikan GSAP, dibaca di render loop)
  const fx = { sx: 1, sy: 1, jitter: 0 }

  /** Berjaga di bawah layar begitu panggung hero naik melewati ±40% layar (Krekit masih terlihat saat menghilang) */
  function wantDocked() {
    if (!compact) return false
    if (activeIndex > 0) return true
    const bottom = spots[0].getBoundingClientRect().bottom
    // Ambang berbeda untuk turun dan naik agar tidak bolak-balik di sekitar batas
    return bottom < window.innerHeight * (docked ? 0.5 : 0.4)
  }

  function setDocked(value) {
    docked = value
    shownIndex = activeIndex
    placed = false
    // Berjaga di bawah layar: kanvas transparan di ATAS konten agar Krekit tidak tertutup teks.
    // Kanvas tidak menangkap sentuhan (pointer-events: none), tautan di bawahnya tetap bisa diketuk.
    canvas.classList.toggle('is-front', value)
    scene.background = value ? null : sceneBackground
    bubble.setDocked(value)
  }

  /**
   * Krekit "putus sinyal" di tempat lama (menyusut jadi garis + glitch layar),
   * lalu "tersambung lagi" di tempat baru. Tidak terbang melintasi teks.
   * skipOut: tempat lama sudah tidak terlihat, jadi langsung muncul di tempat baru
   * (animasi menghilang di luar layar hanya menunda, dan posisi lamanya bisa sudah tidak valid).
   */
  let swapTimeline = null
  function glitchTransition(apply, strength = 0.85, { skipOut = false } = {}) {
    if (reduceMotion) {
      apply()
      return
    }
    swapping = true
    // Kalimat dari pos lama tidak ikut terbawa ke pos baru
    bubble.hide()
    const tl = gsap.timeline({
      onComplete: () => {
        swapping = false
        swapTimeline = null
      },
    })
    swapTimeline = tl
    if (skipOut) {
      gsap.set(fx, { sx: 0, sy: 0.05, jitter: 1 })
      apply()
      post.burst(strength * 0.8, 0.6)
    } else {
      post.burst(strength, 0.55)
      tl.to(fx, { jitter: 1, duration: 0.08 })
        .to(fx, { sy: 0.05, sx: 1.4, duration: 0.2, ease: 'power3.in' })
        .to(fx, { sx: 0, duration: 0.1, ease: 'power2.in' })
        .call(() => {
          apply()
          post.burst(strength * 0.8, 0.6)
        })
    }
    tl.to({}, { duration: 0.12 })
      .to(fx, { sx: 1.4, duration: 0.1, ease: 'power2.out' })
      .to(fx, { sx: 1, sy: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' })
      .to(fx, { jitter: 0, duration: 0.3 }, '-=0.35')
  }

  // Ke pojok bawah saat diorama sudah keluar layar (mis. lompat ke bawah halaman): langsung muncul
  const glitchSwap = (value) => glitchTransition(() => setDocked(value), 0.85, { skipOut: value && !spotVisible(0) })
  /** Panggung pos masih (sebagian) terlihat di layar? */
  function spotVisible(index) {
    const rect = spots[index].getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight
  }

  /** Layar lebar: pindah ke panggung pos yang sedang dibaca */
  function teleport() {
    glitchTransition(
      () => {
        shownIndex = activeIndex
        placed = false
      },
      0.55,
      { skipOut: !spotVisible(shownIndex) },
    )
  }

  /**
   * Teleport yang sedang berjalan menuju pos yang sudah lewat (scroll cepat): batalkan,
   * lalu langsung muncul di pos yang sedang dibaca.
   */
  function retargetIfStale() {
    if (!swapping || compact || shownIndex === activeIndex || spotVisible(shownIndex)) return
    swapTimeline?.kill()
    swapping = false
    teleport()
  }

  // Pijakan khusus di dalam panggung: ban berjalan Pos 1, atau node pohon skill yang terpilih di Pos 2
  const sectionId = () => sections[shownIndex]?.id
  const onBelt = () => belt && !compact && sectionId() === 'kenapa'

  function spotTarget() {
    const rect = spots[shownIndex].getBoundingClientRect()
    if (onBelt()) {
      // Berdiri di tengah ban; tinggi telur 46% tinggi ban, sama dengan kotak .belt__item di landing.css
      const b = belt.getBoundingClientRect()
      screenToWorld(b.left + b.width / 2, b.bottom - BELT_BAND, target)
      return (b.height * 0.46 * unitsPerPixel(target)) / krekit.height
    }
    // Pos 2: berdiri di atas node terpilih (awalnya akar); tingginya tetap mengikuti panggung di atas akar
    const node = sectionId() === 'jalur' ? skillSelected?.getBoundingClientRect() : null
    if (node) screenToWorld(node.left + node.width / 2, node.top, target)
    else screenToWorld(rect.left + rect.width / 2, rect.bottom, target)
    // Tinggi Krekit (plus ruang untuk pecahan & aura) mengikuti tinggi panggung
    return (rect.height * unitsPerPixel(target)) / (krekit.height + 0.6)
  }

  // Ban berjalan Pos 1: Krekit ikut "diproses" di tiap stasiun dan mengomentarinya (STATION_LINES).
  // Engine = wireframe (diatur di render loop), Desain = mendapat warna (melompat kecil),
  // Pemain = keluar dari kotak dan tersenyum. Di HP Krekit berjaga di pojok dan berkomentar dari sana.
  let stationLine
  let stationSaid = 0
  sceneHooks.station = (index, total) => {
    if (sectionId() !== 'kenapa' && !(compact && activeIndex === 1)) return
    stationLine?.kill()
    if (index === 1 && !compact) krekit.jump()
    // Tunggu ban berhenti dulu: jangan bicara selagi stasiun ini hanya dilewati
    stationLine = gsap.delayedCall(0.6, () => {
      if (beltStation !== index || stationSaid === index) return
      stationSaid = index
      if (index === total - 1) {
        if (!compact) krekit.jump()
        gsap.delayedCall(0.6, krekit.smile)
      }
      // Ban sudah digeser: sapaan pembuka Pos 1 tidak perlu diucapkan lagi
      spoken.add(1)
      bubble.say(STATION_LINES[index], 2.6)
    })
  }
  // Pohon skill Pos 2: Krekit melompat lalu menggelinding menyusuri cabang ke node terpilih
  // (spotTarget membaca skillSelected), dan mengomentari jalurnya. Di HP ia berkomentar dari pojok.
  sceneHooks.skill = (node, line) => {
    if (sectionId() !== 'jalur' && !(compact && activeIndex === 2)) return
    if (!compact) krekit.jump()
    if (line) {
      spoken.add(2)
      bubble.say(line, 3)
    }
  }
  // Tarik kartu Pos 3: Krekit melompat di atas tumpukan, lalu bereaksi sesuai level istilahnya
  sceneHooks.draw = (term) => {
    if (sectionId() !== 'kamus' && !(compact && activeIndex === 3)) return
    if (!compact) krekit.jump()
    const lines = DRAW_LINES[term.level] ?? DRAW_LINES[1]
    spoken.add(3)
    bubble.say(lines[Math.floor(Math.random() * lines.length)], 2.8)
    gsap.delayedCall(0.9, term.level === 3 ? krekit.confused : krekit.smile)
  }
  // Layar akhir Pos 5: "Main lagi" membawa pengunjung kembali ke Pos 0
  sceneHooks.replay = () => {
    krekit.jump()
    bubble.say('Sampai jumpa di awal lagi.', 2)
  }
  // Chat Pos 4: Krekit berbicara selama "mengetik" balasan (gelembung tidak dipakai, chat itu sendiri
  // ucapannya), lalu tersenyum setelah ketiga aturan dijawab
  sceneHooks.chat = (done) => {
    if (sectionId() !== 'prinsip' && !(compact && activeIndex === 4)) return
    spoken.add(4)
    if (!done) {
      krekit.talk(0.8)
      return
    }
    if (!compact) krekit.jump()
    gsap.delayedCall(0.5, krekit.smile)
  }

  // ---------- Layar sempit, setelah Pos 0: Krekit kecil di pojok kanan bawah ----------
  // Panggung di atas judul section tidak dipakai di layar sempit (memakan tempat, Krekit menutupi teks).
  // Sama seperti pendamping di halaman pelajaran: Krekit duduk di atas bilah navigasi bawah,
  // gelembungnya jadi strip di sebelah kirinya (lihat createBubble), jadi tidak menutupi tengah bacaan.

  const DOCK_HEIGHT = 88 // tinggi Krekit di layar, piksel
  const DOCK_RIGHT = 48 // jarak tengah Krekit dari tepi kanan layar
  function dockTarget() {
    // Kamera menunduk: sisi depan telur terlihat lebih rendah dari titik pijaknya, jadi pijakan dinaikkan sedikit
    screenToWorld(window.innerWidth - DOCK_RIGHT, window.innerHeight - getBottomNavHeight() - 28, target)
    return (DOCK_HEIGHT * unitsPerPixel(target)) / (krekit.height + 0.6)
  }

  // ---------- Pos 0 "Dunia belum di-render" ----------
  // Desktop: hero di-pin, Krekit keluar dari spawn lalu menggelinding, dunia ter-render di belakangnya.
  // Layar sempit: tanpa pin. Krekit berdiri di tengah diorama; setiap diketuk, dunia naik satu tingkat render.

  const hero = sections[0]
  const dunia = createDunia(scene)
  const heroStart = new THREE.Vector3()
  const heroEnd = new THREE.Vector3()
  const tmpPoint = new THREE.Vector3()
  const glowPoint = new THREE.Vector3()
  let heroScale = 1
  let heroProgress = 0
  let pathT = 0
  let furthestT = 0
  let renderLevel = 0
  // Dunia dan Krekit di Pos 0 dihitung dalam koordinat dunia tetap saat layout. Setelah pin hero selesai
  // (desktop) atau saat hero bergulir (layar sempit), keduanya digeser sejauh hero bergeser di layar,
  // agar ikut bergulir bersama halaman dan tidak tertinggal melayang di atas pos berikutnya.
  let layoutTop = 0
  let layoutUpp = 1
  let heroShift = 0
  const updateHeroShift = () => (heroShift = -(hero.getBoundingClientRect().top - layoutTop) * layoutUpp)

  /** Desktop: spawn di dasar panggung hero, ujung jalan di kiri bawah. Layar sempit: diorama di tengah panggung. */
  function layoutDunia() {
    poseCamera()
    // Selalu diukur seolah halaman di paling atas. Refresh ScrollTrigger juga terjadi saat hero jauh di luar
    // layar (jendela diubah ukurannya, atau bilah alamat HP muncul/hilang saat scroll). Diukur dari posisi
    // itu, skala & posisi dunia meleset (unitsPerPixel memakai jarak ke kamera), sehingga Krekit dan
    // dunianya hilang saat pengunjung kembali ke atas. heroShift tetap menggeser semuanya mengikuti scroll.
    // Desktop: hero di-pin, jadi posisi istirahatnya mengikuti pin-spacer pembungkusnya.
    const anchor = hero.parentElement?.classList.contains('pin-spacer') ? hero.parentElement : hero
    const restTop = anchor.getBoundingClientRect().top + window.scrollY
    const dy = restTop - hero.getBoundingClientRect().top
    const spot = spots[0].getBoundingClientRect()
    const rect = { left: spot.left, width: spot.width, height: spot.height, top: spot.top + dy, bottom: spot.bottom + dy }
    layoutTop = restTop
    if (compact) {
      // Krekit ±58% tinggi panggung; sisanya untuk bangunan di belakangnya dan tombol tahap di bawah
      screenToWorld(rect.left + rect.width / 2, rect.bottom - rect.height * 0.14, heroStart)
      heroScale = (rect.height * 0.58 * unitsPerPixel(heroStart)) / (krekit.height + 0.6)
      screenToWorld(0, rect.bottom - rect.height * 0.14, heroEnd)
      dunia.layoutDiorama(heroStart, heroScale, heroStart.x - heroEnd.x, camera.position.y)
      dunia.setLevel(renderLevel)
      layoutUpp = unitsPerPixel(heroStart)
      return
    }
    screenToWorld(rect.left + rect.width / 2, rect.bottom, heroStart)
    heroScale = (rect.height * unitsPerPixel(heroStart)) / (krekit.height + 0.6)
    screenToWorld(window.innerWidth * 0.2, rect.bottom, heroEnd)
    const endZ = 0.5 * heroScale
    // Titik yang lebih dekat ke kamera harus bergeser ke tengah agar tetap di posisi layar yang sama
    heroEnd.x *= (camera.position.z - endZ) / camera.position.z
    heroEnd.z = endZ
    dunia.layout(heroStart, heroEnd, heroScale, camera.position.y)
    layoutUpp = unitsPerPixel(heroStart)
  }
  layoutDunia()
  ScrollTrigger.addEventListener('refresh', layoutDunia)

  // Pin hero hanya di layar lebar. gsap.matchMedia membatalkannya otomatis saat layar berubah
  // ke mode bertumpuk (mis. tablet diputar), dan membuatnya lagi saat kembali.
  if (!reduceMotion) {
    gsap.matchMedia().add(WIDE, () => {
      // Teks hero memudar setelah Krekit mulai berjalan, agar dunianya terlihat utuh
      const heroText = gsap.timeline({ paused: true })
      heroText.to('.hero__text', { autoAlpha: 0, y: -50, duration: 0.18, ease: 'power1.in' }, 0.24)
      heroText.to({}, { duration: 1 }, 0)
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: true,
        refreshPriority: 1,
        animation: heroText,
        onUpdate: (self) => {
          heroProgress = self.progress
          // Begitu mulai mengikuti Krekit, judul ikut ter-render (sebelum teks hero memudar)
          setHeroRendered(self.progress > 0.06)
        },
      })
      return () => (heroProgress = 0)
    })
    ScrollTrigger.refresh()
  }

  // Tombol tahap render di bawah panggung (layar sempit): alternatif mengetuk Krekit, juga untuk keyboard
  const stepButtons = [...document.querySelectorAll('[data-render-step]')]
  function setRenderLevel(value) {
    renderLevel = value
    dunia.setLevel(value)
    // Baris kuning judul ikut ter-render di tingkat "Render", dan kembali wireframe di tingkat lain
    setHeroRendered(value === LEVEL_LINES.length - 1)
    stepButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.renderStep) === value)))
    spoken.add(0)
    krekit.jump()
    if (!reduceMotion && value > 0) post.burst(0.3, 0.3)
    bubble.say(LEVEL_LINES[value], 3.6)
  }
  stepButtons.forEach((button) => button.addEventListener('click', () => setRenderLevel(Number(button.dataset.renderStep))))

  const smooth01 = (x) => THREE.MathUtils.smoothstep(x, 0, 1)
  /** Posisi Krekit selama Pos 0: diam di spawn pad, melompat turun, lalu menggelinding di jalan */
  function heroTarget(out) {
    const p = heroProgress
    const onPad = tmpPoint.copy(heroStart)
    onPad.y += dunia.spawnHeight * heroScale
    if (compact) {
      // Layar sempit: Krekit tetap di spawn pad, di tengah dioramanya
      pathT = 0
      out.copy(onPad)
    } else if (p < 0.12) {
      pathT = 0
      out.copy(onPad)
    } else if (p < 0.24) {
      const u = (p - 0.12) / 0.12
      pathT = 0.05 * u
      dunia.pathPoint(0.05, out)
      out.lerpVectors(onPad, out, smooth01(u))
      out.y += Math.sin(Math.PI * u) * 1.1 * heroScale
    } else {
      pathT = 0.05 + 0.95 * smooth01((p - 0.24) / 0.7)
      dunia.pathPoint(pathT, out)
    }
    out.y += heroShift
    return heroScale
  }

  // Penanda di tepi jalan seperti checkpoint: hanya bagian yang sedang dilewati Krekit yang tampil
  const waypoints = [...document.querySelectorAll('[data-waypoint]')].map((el) => ({ el, t: Number(el.dataset.waypoint) }))
  const waypointPoint = new THREE.Vector3()
  function updateWaypoints(fade) {
    for (const [i, w] of waypoints.entries()) {
      const next = waypoints[i + 1]?.t ?? Infinity
      const on = !compact && shownIndex === 0 && fade > 0.5 && pathT >= w.t - 0.08 && pathT < next - 0.08
      w.el.classList.toggle('is-on', on)
      if (!on) continue
      dunia.labelPoint(w.t, waypointPoint)
      waypointPoint.y += heroShift
      waypointPoint.project(camera)
      w.el.style.transform = `translate(${((waypointPoint.x + 1) / 2) * window.innerWidth}px, ${((1 - waypointPoint.y) / 2) * window.innerHeight}px) translate(-50%, -100%)`
    }
  }

  /** Dunia tampil penuh selama hero masih memenuhi layar, lalu memudar saat hero bergulir pergi */
  function duniaFade() {
    if (compact) {
      // Hero tidak di-pin: dunia memudar saat panggungnya bergulir keluar dari atas layar
      const rect = spots[0].getBoundingClientRect()
      return THREE.MathUtils.clamp((rect.bottom - rect.height * 0.3) / (rect.height * 0.5), 0, 1)
    }
    const bottom = hero.getBoundingClientRect().bottom
    return THREE.MathUtils.clamp((bottom - window.innerHeight * 0.65) / (window.innerHeight * 0.35), 0, 1)
  }

  // ---------- Section aktif ----------

  // Kalimat section hanya diucapkan setelah pengunjung DIAM beberapa saat di section itu.
  // Scroll cepat melewati section tidak "menghabiskan" kalimatnya: ia muncul saat pengunjung kembali.
  const DWELL = 2 // detik
  const spoken = new Set()
  let dwellCall
  let started = false
  function setActive(index) {
    if (started && index === activeIndex) return
    started = true
    const previous = spots[activeIndex].getBoundingClientRect()
    const next = spots[index].getBoundingClientRect()
    travelDirection = Math.sign(next.left - previous.left) || 1
    activeIndex = index
    const mood = MOODS[index]
    krekit.setColors(mood.glow, mood.aura)
    const bg = new THREE.Color(mood.bg)
    gsap.to([sceneBackground, scene.fog.color], { r: bg.r, g: bg.g, b: bg.b, duration: 1 })
    // Warna halaman ikut berubah: terlihat di balik kanvas saat kanvasnya transparan
    gsap.to(document.documentElement, { '--bg': mood.bg, duration: 1 })

    dwellCall?.kill()
    if (spoken.has(index)) return
    dwellCall = gsap.delayedCall(index === 0 ? 1.4 : DWELL, function trySpeak() {
      if (activeIndex !== index) return
      // Gelembung masih tampil (mis. komentar hover), atau Krekit sedang tidak terlihat:
      // tunggu sebentar, jangan memotong dan jangan "bicara" tanpa terlihat
      // Ajakan mengetuk diorama tidak relevan saat Krekit sedang berjaga di bawah layar
      if (bubble.isBusy() || !bubble.isVisible() || swapping || (!compact && shownIndex !== index) || (index === 0 && docked)) {
        dwellCall = gsap.delayedCall(1, trySpeak)
        return
      }
      spoken.add(index)
      // Pos 0 di layar sempit: ajakan mencoba tab tahap render lebih penting daripada kabar retakan
      if (index === 0 && compact) bubble.say(renderLevel === 0 ? HERO_TOUCH_LINE : LEVEL_LINES[renderLevel], 4)
      else bubble.say(index === 0 && STAGE_LINES[stage] ? STAGE_LINES[stage] : mood.line)
      if (index === sections.length - 1) krekit.greet()
    })
  }
  // Section yang di-pin (Pos 0 dan Pos 1 di desktop) tetap aktif selama pin-nya berjalan.
  // Tanpa ini, akhir pemicu jatuh di tepi bawah aslinya (di tengah pin): saat scroll naik dari bawah,
  // pos berikutnya sudah tidak aktif tapi pos ini belum aktif lagi, jadi Krekit tertinggal di pos bawah.
  const pinLength = (section) => {
    const pin = ScrollTrigger.getAll().find((t) => t.pin === section)
    return pin ? pin.end - pin.start : 0
  }
  sections.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: () => `bottom+=${pinLength(section)} center`,
      onToggle: (self) => self.isActive && setActive(index),
    })
  })
  setActive(0)

  // ---------- Kursor, sorotan teks, dan klik ----------

  const pointer = new THREE.Vector2(10, 10)
  let focusEl = null
  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
  })
  document.addEventListener('pointerleave', () => pointer.set(10, 10))

  // Elemen teks yang disorot: Krekit menoleh ke sana, senang, dan menjelaskan isinya
  document.querySelectorAll('[data-krekit-say]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      focusEl = el
      krekit.setHappy(true)
      bubble.say(el.dataset.krekitSay, 3)
    })
    el.addEventListener('pointerleave', () => {
      if (focusEl === el) focusEl = null
      krekit.setHappy(false)
    })
  })

  // Tombol Bagikan (Pos 5): Krekit berterima kasih setelah situs dibagikan atau tautannya disalin
  document.addEventListener('krekit:share', (event) => {
    krekit.smile()
    bubble.say(event.detail.how === 'discord' ? 'Tautannya sudah kusalin. Tempel di Discord, ya.' : 'Terima kasih sudah membagikan Krekit.', 2.6)
  })

  const raycaster = new THREE.Raycaster()
  const tapPoint = new THREE.Vector2()
  let hovered = false
  // Hit test langsung dari titik klik: di layar sentuh tidak ada pointermove sebelum ketukan.
  // Didengarkan di window karena kanvas bisa berada di depan konten tanpa menangkap sentuhan
  window.addEventListener('click', (event) => {
    if (event.target.closest('a, button, input')) return
    tapPoint.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1))
    raycaster.setFromCamera(tapPoint, camera)
    if (raycaster.intersectObjects(krekit.hitMeshes, false).length === 0) return
    if (compact && activeIndex === 0 && !docked) {
      // Layar sempit, Pos 0: setiap ketukan menaikkan tingkat render; setelah penuh, kembali ke wireframe
      setRenderLevel((renderLevel + 1) % LEVEL_LINES.length)
      return
    }
    krekit.jump({ tap: true })
        if (!reduceMotion && !docked) post.burst(0.4, 0.35)
    bubble.say(CLICK_LINES[Math.floor(Math.random() * CLICK_LINES.length)], 1.8)
  })

  // ---------- Render loop ----------

  const timer = new THREE.Timer()
  timer.connect(document)
  const krekitScreen = new THREE.Vector3()
  const lookPoint = new THREE.Vector2()
  let beltLeft = beltTrack?.scrollLeft ?? 0
  const top = new THREE.Vector3()

  function tick(timestamp) {
    timer.update(timestamp)
    const delta = timer.getDelta()
    const elapsed = timer.getElapsed()

    // Pos 0: ikuti jalan dunia greybox (desktop) atau berdiri di diorama (layar sempit).
    // Section lain: kejar panggung aktif (desktop) atau berjaga di bawah layar (layar sempit).
    // Smoothing tidak bergantung frame rate (lihat Kamus: Delta Time)
    retargetIfStale()
    if (!swapping) {
      if (wantDocked() !== docked) glitchSwap(!docked)
      else if (compact) shownIndex = activeIndex
      else if (shownIndex !== activeIndex) teleport()
    }
    // Penanda untuk uji otomatis (tests/smoke.spec.js): pos tempat Krekit sudah tiba, dan mode pojok di HP.
    // Hanya ditulis saat berubah, jadi tidak membebani render loop.
    const marks = document.documentElement.dataset
    const arrived = swapping ? 'transit' : String(shownIndex)
    if (marks.krekitPos !== arrived) marks.krekitPos = arrived
    if (marks.krekitDocked !== String(docked)) marks.krekitDocked = String(docked)

    updateHeroShift()
    dunia.setOffset(heroShift)
    const onPath = shownIndex === 0 && !docked
    const scale = onPath ? heroTarget(target) : docked ? dockTarget() : spotTarget()
    if (!onPath) target.z = 0
    if (!placed || reduceMotion) {
      current.copy(target)
      currentScale = scale
      placed = true
    }
    const previousX = current.x
    current.x += (target.x - current.x) * (1 - Math.exp(-(onPath ? 9 : docked ? 1.6 : 3.5) * delta))
    current.y += (target.y - current.y) * (1 - Math.exp(-12 * delta))
    current.z += (target.z - current.z) * (1 - Math.exp(-8 * delta))
    currentScale += (scale - currentScale) * (1 - Math.exp(-6 * delta))

    // Kanvas di depan konten: diorama disembunyikan agar tidak tergambar di atas teks hero
    const fade = docked ? 0 : duniaFade()
    dunia.setFade(fade)
    // Pengunjung kembali ke awal setelah berjalan jauh: dunia kembali ke wireframe agar bisa "dibangun" ulang
    if (pathT < 0.02 && furthestT > 0.3) {
      dunia.reset()
      furthestT = 0
    }
    furthestT = Math.max(furthestT, pathT)
    glowPoint.set(current.x, current.y + 0.8 * currentScale, current.z)
    // "Kurangi gerakan": tanpa perjalanan; bagian dunia di dekat Krekit (kanan) tampil jadi,
    // bagian di belakang teks hero (kiri) tetap wireframe redup agar teks tetap terbaca
    dunia.update(delta, elapsed, reduceMotion ? 0.3 : pathT, glowPoint, scene.fog.color)
    updateWaypoints(fade)
    krekit.root.position.copy(current)
    krekit.root.scale.set(currentScale * fx.sx, currentScale * fx.sy, currentScale * fx.sx)
    // Layar sempit: kamera tetap di tengah dan menunduk, jadi Krekit di pojok bawah terlihat dari samping atas.
    // Putar badannya menghadap kamera, seperti pendamping di halaman pelajaran, agar terasa bicara dengan kita.
    // Di diorama hanya menoleh (tanpa condong), agar tetap berdiri tegak di spawn pad.
    if (compact) {
      const dx = camera.position.x - current.x
      const dz = camera.position.z - current.z
      krekit.root.rotation.y = Math.atan2(dx, dz)
      krekit.root.rotation.x = docked ? -Math.atan2(camera.position.y - current.y, Math.hypot(dx, dz)) : 0
    } else krekit.root.rotation.set(0, 0, 0)
    if (swapping) {
      // Glitch: menyusut ke garis di tengah badan (bukan ke kaki), bergeser acak, berkedip
      krekit.root.position.y += (1 - fx.sy) * krekit.height * 0.5 * currentScale
      krekit.root.position.x += (Math.random() - 0.5) * 0.25 * currentScale * fx.jitter
      krekit.root.visible = Math.random() > 0.22 * fx.jitter
    } else krekit.root.visible = true
    post.glitch.uTime.value = elapsed
    // Kecepatan horizontal relatif ukuran Krekit -> berapa cepat ia menggelinding
    let velocityX = (current.x - previousX) / Math.max(delta, 1e-3) / Math.max(currentScale, 1e-3)
    // Di atas ban berjalan Krekit diam di tengah, tapi bannya bergerak: ia menggelinding seperti di atas treadmill.
    // Stasiun Engine: Krekit masih wireframe.
    if (onBelt() && !swapping) velocityX += ((beltTrack.scrollLeft - beltLeft) / Math.max(delta, 1e-3)) * (unitsPerPixel(current) / Math.max(currentScale, 1e-3))
    beltLeft = beltTrack?.scrollLeft ?? 0
    krekit.setWireframe(onBelt() && beltStation === 0)
    krekit.update(delta, elapsed, velocityX)

    // Arah lirikan: ke elemen yang disorot, atau ke kursor; relatif terhadap posisi Krekit di layar
    krekitScreen.copy(current).project(camera)
    if (focusEl) {
      const r = focusEl.getBoundingClientRect()
      lookPoint.set(((r.left + r.width / 2) / window.innerWidth) * 2 - 1, -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1))
    } else {
      lookPoint.copy(pointer)
    }
    const pointerInside = focusEl || Math.abs(pointer.x) <= 1
    if (!krekit.isRolling()) {
      // Tanpa kursor di halaman: menatap lurus ke depan
      if (pointerInside) krekit.lookAt(gsap.utils.clamp(-1, 1, (lookPoint.x - krekitScreen.x) * 1.5), gsap.utils.clamp(-1, 1, lookPoint.y - krekitScreen.y - 0.2))
      else krekit.lookAt(0, 0)
    }

    // Hover pada Krekit (untuk klik)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(krekit.hitMeshes, false).length > 0
    if (hit !== hovered) {
      hovered = hit
      document.body.style.cursor = hit ? 'pointer' : ''
      if (!focusEl) krekit.setHappy(hit)
    }

    if (post.isActive()) post.composer.render(delta)
    else renderer.render(scene, camera)

    bubble.follow(krekit.topWorld(top).project(camera))
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/**
 * Gelembung bicara bergaya terminal: teks muncul huruf demi huruf.
 * Dua lapis: pembungkus [data-bubble] diposisikan setiap frame,
 * kotak di dalamnya dianimasikan GSAP. Satu properti transform, satu pengendali.
 */
function createBubble({ onSay } = {}) {
  const wrap = document.querySelector('[data-bubble]')
  const box = wrap.querySelector('[data-bubble-box]')
  const CHAR_DELAY = 0.022 // detik per huruf
  let hideCall
  let typing
  let visibleUntil = 0
  let headVisible = true
  let docked = false
  gsap.set(box, { autoAlpha: 0, transformOrigin: '50% 100%' })
  return {
    /** true selama gelembung masih diketik atau masih ditampilkan */
    isBusy: () => performance.now() < visibleUntil,
    say(text, hold = 3.2) {
      hideCall?.kill()
      typing?.kill()
      visibleUntil = performance.now() + ((reduceMotion ? 0 : text.length * CHAR_DELAY) + hold) * 1000
      // Teks lengkap untuk pembaca layar; tampilan diketik bertahap
      box.setAttribute('aria-label', text)
      onSay?.(reduceMotion ? 0 : text.length * CHAR_DELAY)
      gsap.to(box, { autoAlpha: 1, duration: 0.2, overwrite: true })
      const progress = { chars: reduceMotion ? text.length : 0 }
      const render = () => (box.textContent = text.slice(0, Math.round(progress.chars)))
      render()
      typing = gsap.to(progress, { chars: text.length, duration: reduceMotion ? 0 : text.length * CHAR_DELAY, ease: 'none', onUpdate: render })
      hideCall = gsap.delayedCall((reduceMotion ? 0 : text.length * CHAR_DELAY) + hold, () => gsap.to(box, { autoAlpha: 0, duration: 0.4 }))
    },
    /** Sembunyikan segera (mis. saat Krekit teleport ke pos lain) */
    hide() {
      hideCall?.kill()
      typing?.kill()
      visibleUntil = 0
      gsap.to(box, { autoAlpha: 0, duration: 0.15, overwrite: true })
    },
    /** true jika kepala Krekit sedang terlihat, sehingga gelembungnya boleh tampil */
    isVisible: () => headVisible,
    /** Layar sempit setelah Pos 0: gelembung jadi strip di kiri Krekit, di atas bilah navigasi bawah */
    setDocked(value) {
      docked = value
      wrap.classList.toggle('is-docked', value)
    },
    /** ndc = titik di atas kepala Krekit dalam NDC (-1..1) */
    follow(ndc) {
      if (docked) {
        headVisible = true
        wrap.style.visibility = 'visible'
        wrap.style.transform = `translate(12px, ${window.innerHeight - getBottomNavHeight() - 10}px) translateY(-100%)`
        return
      }
      const headY = ((1 - ndc.y) / 2) * window.innerHeight
      // Kepala Krekit di balik navigasi atas atau di bawah layar (mis. tertutup bilah bawah di HP):
      // sembunyikan gelembung, jangan dipaksa menempel di atas isi section
      headVisible = headY > 56 && headY < window.innerHeight - getBottomNavHeight()
      wrap.style.visibility = headVisible ? 'visible' : 'hidden'
      if (!headVisible) return
      // Tetap di dalam layar: tepi kiri/kanan dan di bawah navigasi atas (±64px)
      const half = box.offsetWidth / 2 + 8
      const x = gsap.utils.clamp(half, window.innerWidth - half, ((ndc.x + 1) / 2) * window.innerWidth)
      const y = Math.max(headY, 72 + box.offsetHeight + 8)
      wrap.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
    },
  }
}

/** Tinggi bilah navigasi bawah (BottomNav) dalam piksel; 0 di layar yang tidak memakainya */
function getBottomNavHeight() {
  return document.querySelector('.bnav')?.offsetHeight ?? 0
}

// WebGL bisa tidak tersedia (perangkat lama, driver diblokir): halaman tetap berfungsi tanpa 3D
try {
  initScene()
} catch (error) {
  console.warn('Krekit tidak bisa ditampilkan (WebGL tidak tersedia). Halaman tetap berfungsi.', error)
  document.querySelector('canvas.webgl')?.remove()
  // Ban berjalan Pos 1 memakai telur 2D sebagai pengganti Krekit (landing.css: .no-3d)
  document.documentElement.classList.add('no-3d')
  document.querySelector('[data-bubble]')?.remove()
  document.querySelector('.render-steps')?.remove()
}
