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

// ---------- Animasi teks & kartu ----------

gsap.fromTo(
  '.hero__text > *',
  { autoAlpha: 0, y: reduceMotion ? 0 : 30 },
  { autoAlpha: 1, y: 0, duration: reduceMotion ? 0.01 : 0.9, stagger: reduceMotion ? 0 : 0.1, ease: 'power3.out', delay: 0.2 },
)

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
  { glow: '#7ff0ff', aura: '#00e5ff', bg: '#07070b', line: 'Ini celahku. Pinjam sebentar, boleh.' },
  { glow: '#ffe08a', aura: '#ffcc33', bg: '#100c08', line: 'Dulu aku juga heran kenapa game bisa patah-patah di laptop tertentu. Jawabannya ada di Pelajaran 1.' },
  { glow: '#9dff8a', aura: '#7cff6b', bg: '#08100d', line: 'Baru Fondasi Engine yang sudah ada pelajarannya. Lima jalur lain masih kerangka.' },
  { glow: '#8ad2ff', aura: '#00b3ff', bg: '#080b14', line: touchOnly ? 'Ketuk salah satu tahap. Aku jelaskan isinya.' : 'Arahkan kursor ke salah satu tahap. Aku jelaskan isinya.' },
  { glow: '#ffe08a', aura: '#ffcc33', bg: '#0d0b08', line: 'Ketemu angka tanpa sumber? Bilang saja lewat GitHub.' },
  { glow: '#ffa6f0', aura: '#ff5ce1', bg: '#0b0b10', line: 'Sampai bawah juga. Kalau ada yang salah di situs ini, kamu bisa ikut memperbaikinya.' },
]
const STAGE_LINES = [
  null,
  'Ada retakan baru di cangkangku. Kamu sudah mulai menandai materi.',
  'Retakannya bertambah lagi sejak kamu terakhir mampir.',
  'Lebih dari separuh materi sudah kamu tandai selesai.',
  'Cangkangku hampir penuh retakan. Sedikit lagi.',
  'Cangkangku jadi emas. Hampir semua materi sudah kamu selesaikan.',
]
const CLICK_LINES = ['Hup!', 'Pelan-pelan, cangkangku sudah retak.', 'Aku ringan, tapi jangan dilempar.', 'Iya, aku masih di sini.']
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
      const heading = sections[activeIndex]?.querySelector('.display')
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

  // ---------- Layar sempit: pindah antara diorama Pos 0 dan bawah layar dengan glitch ----------

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
   */
  function glitchSwap(value) {
    if (reduceMotion) {
      setDocked(value)
      return
    }
    swapping = true
    post.burst(0.85, 0.55)
    gsap
      .timeline({ onComplete: () => (swapping = false) })
      .to(fx, { jitter: 1, duration: 0.08 })
      .to(fx, { sy: 0.05, sx: 1.4, duration: 0.2, ease: 'power3.in' })
      .to(fx, { sx: 0, duration: 0.1, ease: 'power2.in' })
      .call(() => {
        setDocked(value)
        post.burst(0.7, 0.6)
      })
      .to({}, { duration: 0.12 })
      .to(fx, { sx: 1.4, duration: 0.1, ease: 'power2.out' })
      .to(fx, { sx: 1, sy: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' })
      .to(fx, { jitter: 0, duration: 0.3 }, '-=0.35')
  }

  function spotTarget() {
    const rect = spots[activeIndex].getBoundingClientRect()
    screenToWorld(rect.left + rect.width / 2, rect.bottom, target)
    // Tinggi Krekit (plus ruang untuk pecahan & aura) mengikuti tinggi panggung
    return (rect.height * unitsPerPixel(target)) / (krekit.height + 0.6)
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

  /** Desktop: spawn di dasar panggung hero, ujung jalan di kiri bawah. Layar sempit: diorama di tengah panggung. */
  function layoutDunia() {
    poseCamera()
    const rect = spots[0].getBoundingClientRect()
    if (compact) {
      // Krekit ±58% tinggi panggung; sisanya untuk bangunan di belakangnya dan tombol tahap di bawah
      screenToWorld(rect.left + rect.width / 2, rect.bottom - rect.height * 0.14, heroStart)
      heroScale = (rect.height * 0.58 * unitsPerPixel(heroStart)) / (krekit.height + 0.6)
      screenToWorld(0, rect.bottom - rect.height * 0.14, heroEnd)
      dunia.layoutDiorama(heroStart, heroScale, heroStart.x - heroEnd.x, camera.position.y)
      dunia.setLevel(renderLevel)
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
        onUpdate: (self) => (heroProgress = self.progress),
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
    return heroScale
  }

  // Penanda di tepi jalan seperti checkpoint: hanya bagian yang sedang dilewati Krekit yang tampil
  const waypoints = [...document.querySelectorAll('[data-waypoint]')].map((el) => ({ el, t: Number(el.dataset.waypoint) }))
  const waypointPoint = new THREE.Vector3()
  function updateWaypoints(fade) {
    for (const [i, w] of waypoints.entries()) {
      const next = waypoints[i + 1]?.t ?? Infinity
      const on = !compact && activeIndex === 0 && fade > 0.5 && pathT >= w.t - 0.08 && pathT < next - 0.08
      w.el.classList.toggle('is-on', on)
      if (!on) continue
      dunia.labelPoint(w.t, waypointPoint).project(camera)
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
      if (bubble.isBusy() || !bubble.isVisible() || (index === 0 && docked)) {
        dwellCall = gsap.delayedCall(1, trySpeak)
        return
      }
      spoken.add(index)
      // Pos 0 di layar sempit: ajakan mengetuk lebih penting daripada kabar retakan
      if (index === 0 && compact) bubble.say(LEVEL_LINES[renderLevel], 4)
      else bubble.say(index === 0 && STAGE_LINES[stage] ? STAGE_LINES[stage] : mood.line)
      if (index === sections.length - 1) krekit.greet()
    })
  }
  sections.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
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
    krekit.jump()
        if (!reduceMotion && !docked) post.burst(0.4, 0.35)
    bubble.say(CLICK_LINES[Math.floor(Math.random() * CLICK_LINES.length)], 1.8)
  })

  // ---------- Render loop ----------

  const timer = new THREE.Timer()
  timer.connect(document)
  const krekitScreen = new THREE.Vector3()
  const lookPoint = new THREE.Vector2()
  const top = new THREE.Vector3()

  function tick(timestamp) {
    timer.update(timestamp)
    const delta = timer.getDelta()
    const elapsed = timer.getElapsed()

    // Pos 0: ikuti jalan dunia greybox (desktop) atau berdiri di diorama (layar sempit).
    // Section lain: kejar panggung aktif (desktop) atau berjaga di bawah layar (layar sempit).
    // Smoothing tidak bergantung frame rate (lihat Kamus: Delta Time)
    if (!swapping && wantDocked() !== docked) glitchSwap(!docked)
    const onPath = activeIndex === 0 && !docked
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
    const velocityX = (current.x - previousX) / Math.max(delta, 1e-3) / Math.max(currentScale, 1e-3)
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
  document.querySelector('[data-bubble]')?.remove()
  document.querySelector('.render-steps')?.remove()
}
