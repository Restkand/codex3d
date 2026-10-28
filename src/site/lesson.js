import * as THREE from 'three'
import gsap from 'gsap'
import { createKrekit } from './krekit.js'
import { loadProgress } from '../lib/progress.js'

/**
 * Perilaku halaman belajar (LearnLayout). Setiap bagian hanya aktif jika elemennya ada:
 *   1. Bilah progres membaca (halaman pelajaran)
 *   2. Log misi: centang pelajaran yang sudah selesai + bagian yang sudah dibaca
 *   3. Krekit sebagai pendamping kecil yang menemani sepanjang halaman
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- 1. Progres membaca ----------

const progressBar = document.querySelector('[data-read-progress]')
const article = document.querySelector('.lcontent')
// 0..1, juga dibaca Krekit untuk komentar progres
let readRatio = 0
function updateReadProgress() {
  if (!progressBar || !article) return
  const rect = article.getBoundingClientRect()
  const total = rect.height - window.innerHeight * 0.6
  readRatio = gsap.utils.clamp(0, 1, -rect.top / Math.max(total, 1))
  progressBar.style.transform = `scaleX(${readRatio})`
}
window.addEventListener('scroll', updateReadProgress, { passive: true })
updateReadProgress()

// ---------- 2. Log misi ----------

function markQuests() {
  const done = loadProgress()
  document.querySelectorAll('[data-quest]').forEach((item) => {
    const check = item.querySelector('.quests__check')
    if (check) check.hidden = !done.has(item.dataset.quest)
  })
}
markQuests()

// Bagian yang sedang dibaca disorot; bagian yang sudah dilewati diberi tanda
const tocLinks = new Map([...document.querySelectorAll('[data-toc]')].map((a) => [a.dataset.toc, a]))
const headings = [...tocLinks.keys()].map((id) => document.getElementById(id)).filter(Boolean)
// Dipanggil setiap kali bagian yang sedang dibaca berganti (dipakai Krekit, lihat bawah)
let onSectionChange = () => {}
let currentSection = null
function updateToc() {
  const line = window.innerHeight * 0.3
  let currentId = headings[0]?.id
  headings.forEach((h) => {
    if (h.getBoundingClientRect().top < line) currentId = h.id
  })
  if (currentId !== currentSection) {
    currentSection = currentId
    onSectionChange(currentId)
  }
  const currentIndex = headings.findIndex((h) => h.id === currentId)
  headings.forEach((h, i) => {
    const link = tocLinks.get(h.id)
    link.classList.toggle('is-current', i === currentIndex)
    link.classList.toggle('is-read', i < currentIndex)
  })
}
window.addEventListener('scroll', updateToc, { passive: true })
updateToc()

// ---------- 3. Krekit pendamping ----------

/**
 * Kalimat Krekit. Pedoman: menambah info yang tidak tertulis di halaman, atau sudut pandang Krekit sendiri.
 * Kalimat per bagian sebaiknya ditulis di frontmatter pelajaran (field `krekit`, kunci = id judul bagian);
 * yang di bawah ini hanya cadangan untuk bagian yang ada di semua pelajaran.
 */
const SECTION_LINES = {
  'gambaran-besar': 'Bagian ini memberi gambaran dulu. Detailnya menyusul di bawah.',
  'kesalahan-umum': 'Banyak dari kesalahan ini tidak memunculkan error. Itu yang membuatnya sulit dicari.',
  'cek-pemahaman': 'Coba jawab dulu sebelum melihat ke atas lagi. Lebih menempel di kepala.',
  latihan: 'Satu latihan saja sudah cukup untuk hari ini. Ubah kodenya, simpan, lihat hasilnya.',
}
const DEMO_LINES = {
  delta: 'Coba geser ke 240 Hz. Lihat jarum magentanya kebablasan.',
  pixelratio: 'Pixel ratio 2 berarti empat kali lipat piksel, bukan dua.',
  ndc: 'Coba ke pojok kiri atas. Lihat tanda angkanya.',
  sine: 'Naikkan frekuensinya. Gerakan mengambang berubah jadi gemetar.',
  lerp: 'Hampir semua animasi dibangun dari rumus kecil ini.',
  easing: 'Bandingkan "none" dengan "elastic". Bedanya terasa sekali.',
  glslfn: 'Fungsi-fungsi ini muncul di hampir semua shader.',
  fresnel: 'Naikkan power-nya. Cahayanya makin menempel ke tepi.',
  lambert: 'Putar cahayanya ke belakang. Sisi depan langsung gelap.',
}
const ENGINE_NAMES = { unity: 'Unity', unreal: 'Unreal', godot: 'Godot' }
const PROGRESS_LINES = [
  [0.25, 'Seperempat jalan.'],
  [0.5, 'Setengah jalan. Bagian sulit biasanya ada di tengah begini.'],
  [0.8, 'Hampir sampai. Kuis dan latihan ada di bawah.'],
]
const IDLE_LINES = [
  'Bagian ini memang padat. Tidak apa-apa dibaca dua kali.',
  'Ada istilah yang asing? Cari di Kamus, aku tunggu di sini.',
  'Masih di sini. Ambil waktumu.',
]
const QUIZ_RIGHT = ['Benar.', 'Tepat.', 'Iya, itu jawabannya.']
const QUIZ_WRONG = ['Belum tepat. Baca penjelasannya dulu.', 'Hampir. Penjelasannya ada di bawah soal.']
const CLICK_LINES = ['Hup!', 'Aku masih di sini.', 'Pelan-pelan, cangkangku sudah retak.']
const pick = (list) => list[Math.floor(Math.random() * list.length)]

const companion = document.querySelector('[data-companion]')
const restore = document.querySelector('[data-companion-restore]')
const STORAGE_KEY = 'krekit-companion-hidden'
const readHidden = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
const writeHidden = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // diabaikan: pilihan hanya berlaku selama halaman terbuka
  }
}

function initCompanion() {
  const canvas = companion.querySelector('canvas')
  const bubbleEl = companion.querySelector('[data-companion-bubble]')
  const lines = { ...SECTION_LINES, ...JSON.parse(companion.dataset.lines || '{}') }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 1.25, 6)
  camera.lookAt(0, 1.05, 0)
  scene.add(new THREE.AmbientLight('#ffffff', 0.5))
  const sun = new THREE.DirectionalLight('#ffffff', 2.2)
  sun.position.set(3, 4, 3)
  scene.add(sun)

  const krekit = createKrekit(scene, { reduceMotion })
  let running = false

  /**
   * Kanvas lebih tinggi dari bingkai Krekit: bagian atasnya (--headroom di CSS) adalah ruang kosong
   * untuk lompatan, agar cangkangnya tidak terpotong. setViewOffset memperluas pandangan kamera ke atas
   * tanpa mengubah ukuran dan posisi Krekit.
   */
  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    const headroom = parseFloat(getComputedStyle(companion).getPropertyValue('--headroom')) || 0
    const frame = height - headroom
    renderer.setSize(width, height, false)
    camera.aspect = width / frame
    camera.setViewOffset(width, frame, 0, -headroom, width, height)
    camera.updateProjectionMatrix()
  }

  // ---------- Gelembung bergaya terminal ----------

  let typing
  let hideCall
  let visibleUntil = 0
  const isBusy = () => performance.now() < visibleUntil
  function say(text, hold = 3.5) {
    typing?.kill()
    hideCall?.kill()
    const typeTime = reduceMotion ? 0 : text.length * 0.022
    visibleUntil = performance.now() + (typeTime + hold) * 1000
    bubbleEl.setAttribute('aria-label', text)
    krekit.talk(typeTime)
    const state = { chars: reduceMotion ? text.length : 0 }
    const render = () => (bubbleEl.textContent = text.slice(0, Math.round(state.chars)))
    gsap.to(bubbleEl, { autoAlpha: 1, y: 0, duration: 0.2, overwrite: true })
    render()
    typing = gsap.to(state, { chars: text.length, duration: typeTime, ease: 'none', onUpdate: render })
    hideCall = gsap.delayedCall(typeTime + hold, () => gsap.to(bubbleEl, { autoAlpha: 0, y: 6, duration: 0.3 }))
  }
  gsap.set(bubbleEl, { autoAlpha: 0, y: 6 })

  /**
   * Antrean bicara. Dua jenis kalimat:
   *   react()   : reaksi atas tindakan pengunjung (kuis, demo, tab, klik) -> langsung
   *   ambient() : komentar sekitar (bagian, progres, diam lama) -> tidak memotong gelembung
   *               yang tampil, dan diberi jeda minimal GAP detik dari komentar sekitar sebelumnya.
   *               Hanya satu komentar yang menunggu; komentar baru menggantikannya,
   *               kecuali komentar ringan (minor) yang justru mengalah.
   *               isValid() dicek ulang tepat sebelum bicara (mis. "masih di bagian yang sama?").
   */
  const GAP = 5
  let lastAmbient = -Infinity
  let pending
  const react = (text, hold) => running && say(text, hold)
  /** minor: komentar ringan (mis. progres) yang dilewati jika sudah ada komentar lain menunggu */
  function ambient(text, { hold, isValid = () => true, onSpoken, minor = false } = {}) {
    if (minor && pending?.isActive()) return
    pending?.kill()
    const attempt = () => {
      if (!running || !isValid()) return
      const sinceLast = (performance.now() - lastAmbient) / 1000
      const wait = isBusy() ? 1 : Math.max(0, GAP - sinceLast)
      if (wait > 0) {
        pending = gsap.delayedCall(wait, attempt)
        return
      }
      lastAmbient = performance.now()
      say(text, hold)
      onSpoken?.()
    }
    attempt()
  }

  /** Menggeleng: goyang kiri-kanan (root tidak dipakai sistem lain di halaman ini) */
  function shake() {
    if (reduceMotion) return
    gsap.fromTo(krekit.root.rotation, { z: 0.12 }, { z: 0, duration: 0.8, ease: 'elastic.out(1.4, 0.25)' })
  }

  // ---------- Bagian yang sedang dibaca (setelah diam ±2 detik) ----------

  const DWELL = 2
  const said = new Set()
  let dwellCall
  onSectionChange = (id) => {
    dwellCall?.kill()
    if (!lines[id] || said.has(id)) return
    dwellCall = gsap.delayedCall(DWELL, () =>
      ambient(lines[id], { isValid: () => currentSection === id, onSpoken: () => said.add(id) }),
    )
  }

  // ---------- Progres membaca ----------

  const milestones = new Set()
  window.addEventListener(
    'scroll',
    () => {
      for (const [at, line] of PROGRESS_LINES) {
        if (readRatio >= at && !milestones.has(at)) {
          milestones.add(at)
          ambient(line, { hold: 2.5, minor: true })
        }
      }
    },
    { passive: true },
  )

  // ---------- Diam lama & waktu baca ----------

  let lastActivity = performance.now()
  let idleSpoken = 0
  let lastIdleLine = -Infinity
  let readingSeconds = 0
  let breakSuggested = false
  const touch = () => (lastActivity = performance.now())
  ;['scroll', 'pointermove', 'keydown', 'click'].forEach((type) => window.addEventListener(type, touch, { passive: true }))
  setInterval(() => {
    if (document.hidden || !running) return
    readingSeconds += 5
    const now = performance.now()
    // Diam 45 detik: maksimal 3 kali per halaman, berselang minimal 3 menit
    if (now - lastActivity > 45000 && idleSpoken < IDLE_LINES.length && now - lastIdleLine > 180000) {
      lastIdleLine = now
      ambient(IDLE_LINES[idleSpoken++])
    }
    if (!breakSuggested && readingSeconds >= 20 * 60) {
      breakSuggested = true
      ambient('Sudah sekitar 20 menit. Istirahat sebentar dulu kalau matamu mulai lelah.', { hold: 4.5 })
    }
  }, 5000)

  // ---------- Reaksi atas tindakan ----------

  let streak = 0
  document.addEventListener('krekit:quiz', (event) => {
    const { correct, answered, total, score } = event.detail
    streak = correct ? streak + 1 : 0
    if (correct) {
      krekit.smile()
    } else {
      shake()
      krekit.confused()
    }
    if (answered === total) {
      krekit.jump()
      react(score === total ? `Semua ${total} soal benar.` : `${score} dari ${total} benar. Baca lagi penjelasan soal yang salah.`)
    } else if (streak === 3) {
      krekit.jump()
      react('Tiga benar berturut-turut.', 2.2)
    } else {
      react(pick(correct ? QUIZ_RIGHT : QUIZ_WRONG), 2.2)
    }
  })

  document.addEventListener('krekit:progress', (event) => {
    markQuests()
    // Istilah Kamus = pecahan cangkang; pelajaran = retakan baru
    const isTerm = event.detail.id.startsWith('kamus/')
    if (event.detail.done) {
      krekit.jump()
      if (isTerm) {
        const shards = [...loadProgress()].filter((id) => id.startsWith('kamus/')).length
        react(shards === 1 ? 'Pecahan pertamamu! Simpan baik-baik, nanti jadi banyak.' : `Pecahan ke-${shards} terkumpul. Cangkangku makin ramai.`)
      } else {
        react('Pelajaran ini sudah kamu tandai selesai. Retakanku bertambah satu.')
      }
    } else {
      react(isTerm ? 'Oke, pecahannya kukembalikan dulu.' : 'Oke, kutandai belum selesai.', 2)
    }
  })

  let lastEngine = null
  document.addEventListener('krekit:engine', (event) => {
    const name = ENGINE_NAMES[event.detail.engine]
    if (!name || name === lastEngine) return
    lastEngine = name
    krekit.setHappy(true)
    gsap.delayedCall(1, () => krekit.setHappy(false))
    react(`${name}, ya. Tab di halaman lain juga akan menampilkan ${name}.`, 2.8)
  })

  // Demo: komentar saat pertama kali dicoba
  const triedDemos = new Set()
  const onDemo = (event) => {
    const name = event.target.closest?.('[data-demo]')?.dataset.demo
    if (!name || triedDemos.has(name) || !DEMO_LINES[name]) return
    triedDemos.add(name)
    react(DEMO_LINES[name], 3)
  }
  document.addEventListener('input', onDemo)
  document.addEventListener('pointerdown', onDemo)

  // Tombol salin di blok kode
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('.expressive-code .copy button')) react('Sudah tersalin. Tempel di engine-mu, lalu jalankan.', 2.5)
  })

  // Klik pada Krekit: bergantian antara tips bagian yang sedang dibaca dan kalimat biasa
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  let clicks = 0
  // Didengarkan di pembungkus: ruang lompat di atas kanvas tidak menangkap klik (lihat lesson.css)
  companion.addEventListener('click', (event) => {
    if (event.target.closest('button')) return
    const rect = canvas.getBoundingClientRect()
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    if (!raycaster.intersectObjects(krekit.hitMeshes, false).length) return
    krekit.jump()
    clicks++
    const tip = lines[currentSection]
    if (tip && clicks % 2 === 1) react(tip, 3.5)
    else react(pick(CLICK_LINES), 1.8)
  })

  // Melirik kursor relatif terhadap posisi Krekit di layar
  window.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)
    const y = -(event.clientY - (rect.top + rect.height * 0.4)) / (window.innerHeight / 2)
    krekit.lookAt(gsap.utils.clamp(-1, 1, x * 1.5), gsap.utils.clamp(-1, 1, y))
  })

  // ---------- Sembunyikan / panggil ----------

  const timer = new THREE.Timer()
  timer.connect(document)
  function tick(timestamp) {
    if (!running) return
    timer.update(timestamp)
    krekit.update(timer.getDelta(), timer.getElapsed(), 0)
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }

  function greeting() {
    // Pengunjung yang kembali ke pelajaran yang sudah selesai disapa berbeda
    const id = companion.dataset.lessonId
    if (id && loadProgress().has(id)) return 'Pelajaran ini sudah kamu selesaikan. Mau mengulang, atau langsung ke latihan di bawah?'
    return companion.dataset.greeting || 'Aku tunggu di pojok sini.'
  }

  function show(greet = false) {
    companion.hidden = false
    restore.hidden = true
    resize()
    if (!running) {
      running = true
      requestAnimationFrame(tick)
    }
    if (greet) {
      krekit.appear()
      gsap.delayedCall(reduceMotion ? 0 : 1.3, () => {
        say(greeting())
        lastAmbient = performance.now()
        // Bagian pertama sudah terdeteksi sebelum Krekit siap: jalankan sekali di sini
        onSectionChange(currentSection)
      })
    }
  }
  // Disembunyikan = render loop berhenti total, tidak ada beban GPU
  function hide() {
    running = false
    companion.hidden = true
    restore.hidden = false
  }

  companion.querySelector('[data-companion-toggle]').addEventListener('click', () => {
    writeHidden(true)
    hide()
  })
  restore.addEventListener('click', () => {
    writeHidden(false)
    show(true)
  })
  window.addEventListener('resize', () => running && resize())

  if (readHidden()) hide()
  else show(true)
}

try {
  initCompanion()
} catch (error) {
  // WebGL tidak tersedia: halaman pelajaran tetap utuh, tanpa pendamping
  console.warn('Krekit tidak bisa ditampilkan (WebGL tidak tersedia).', error)
  companion.remove()
  restore.remove()
}
