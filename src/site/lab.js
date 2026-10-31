import * as THREE from 'three'
import gsap from 'gsap'
import { createKrekit } from './krekit.js'

/**
 * Lab Krekit (Bedah Krekit): panggung 3D + lima percobaan.
 *   segitiga -> Krekit dibangun per lapisan: wireframe, permukaan tanpa cahaya, cahaya, detail
 *   shading  -> toon / standar (PBR) / tanpa cahaya, dan garis tepi
 *   delta    -> frame rate dibatasi, putaran dengan atau tanpa delta time
 *   easing   -> lompatan dengan easing pilihan, squash and stretch
 *   shader   -> uniform shader aura diubah lewat slider
 *
 * Hierarki panggung (satu properti, satu pengendali):
 *   stage -> lompatan percobaan easing (posisi y dan skala)
 *     spin -> putaran percobaan delta time (rotasi y)
 *       krekit.root -> semua gerak bawaan Krekit (lompat saat diketuk, bernapas, melirik)
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const TAU = Math.PI * 2
const SPIN_SPEED = 2.1 // radian per detik; tanpa delta: 2,1 / 60 per frame (sama cepat hanya di 60 FPS)

const stageEl = document.querySelector('[data-stage]')
const canvas = document.querySelector('[data-lab-canvas]')
const readout = document.querySelector('[data-readout]')
const hint = document.querySelector('[data-hint]')

const HINTS = {
  segitiga: 'Ketuk Krekit untuk lanjut ke lapisan berikutnya',
  easing: 'Ketuk Krekit untuk melompat dengan easing pilihanmu',
}
const DEFAULT_HINT = 'Ketuk Krekit untuk melompat'

const state = {
  exp: 'segitiga',
  layer: 1, // percobaan segitiga, 1..4
  fps: 0, // 0 = ikuti refresh rate layar
  useDelta: true,
  ease: 'halus',
  squash: true,
}

// ---------- Tab percobaan (pola tab WAI-ARIA: panah kiri/kanan berpindah tab) ----------

const tabs = [...document.querySelectorAll('[data-tab]')]
const panels = [...document.querySelectorAll('[data-exp]')]
let lab = null // diisi setelah WebGL siap; tanpa WebGL, tab dan teks tetap berfungsi

function selectTab(id, focus = false) {
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === id
    tab.setAttribute('aria-selected', String(active))
    tab.tabIndex = active ? 0 : -1
    if (active && focus) tab.focus()
  })
  panels.forEach((panel) => (panel.hidden = panel.dataset.exp !== id))
  const previous = state.exp
  state.exp = id
  if (!reduceMotion) {
    hint.textContent = HINTS[id] ?? DEFAULT_HINT
    hint.hidden = false
  }
  lab?.enter(id, previous)
}

// Tombol "Berikutnya" / sebelumnya di akhir setiap percobaan: pindah lalu kembali ke deretan tab
const desktop = window.matchMedia('(min-width: 900px)')
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-go]')
  if (!button) return
  selectTab(button.dataset.go)
  const behavior = reduceMotion ? 'auto' : 'smooth'
  const tabsEl = document.getElementById('lab-tabs')
  if (desktop.matches) document.querySelector('.labpanel').scrollTo({ top: tabsEl.offsetTop - 16, behavior })
  else tabsEl.scrollIntoView({ block: 'start', behavior })
})

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.tab))
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    selectTab(tabs[(i + step + tabs.length) % tabs.length].dataset.tab, true)
  })
})

// ---------- Kontrol: sakelar, pilihan, slider ----------

function onToggle(name, handler) {
  const button = document.querySelector(`[data-toggle="${name}"]`)
  button?.addEventListener('click', () => {
    const value = button.getAttribute('aria-pressed') !== 'true'
    button.setAttribute('aria-pressed', String(value))
    handler(value)
  })
}

function onChoice(name, handler) {
  const group = document.querySelector(`[data-choice="${name}"]`)
  group?.addEventListener('click', (event) => {
    const option = event.target.closest('[role="radio"]')
    if (!option) return
    group.querySelectorAll('[role="radio"]').forEach((o) => o.setAttribute('aria-checked', String(o === option)))
    handler(option.dataset.value)
  })
}

// Kurva easing di panel: titik-titik dari fungsi ease GSAP, digambar sebagai garis SVG
const CURVES = { linear: 'none', halus: 'power2.out', memantul: 'bounce.out', elastis: 'elastic.out(1, 0.35)' }
const curvePath = document.querySelector('[data-curve]')
function drawCurve(name) {
  if (!curvePath) return
  const ease = gsap.parseEase(CURVES[name])
  const points = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60
    return `${(10 + t * 100).toFixed(1)} ${(70 - ease(t) * 50).toFixed(1)}`
  })
  curvePath.setAttribute('d', `M${points.join('L')}`)
}
drawCurve(state.ease)

// ---------- Panggung 3D ----------

function webglAvailable() {
  try {
    const test = document.createElement('canvas')
    return !!(test.getContext('webgl2') || test.getContext('webgl'))
  } catch {
    return false
  }
}

function initStage() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  scene.add(new THREE.AmbientLight('#ffffff', 0.5))
  const sun = new THREE.DirectionalLight('#ffffff', 2.2)
  sun.position.set(3, 4, 3)
  scene.add(sun)

  const krekit = createKrekit(scene, { reduceMotion })
  const stage = new THREE.Group()
  const spin = new THREE.Group()
  stage.add(spin)
  spin.add(krekit.root)
  scene.add(stage)
  krekit.appear()

  const LOOK_Y = 1.5
  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Jarak kamera dipilih agar Krekit beserta lompatannya muat, baik di layar lebar maupun tegak
    const distance = Math.max(7.4, 4.8 / camera.aspect)
    camera.position.set(0, LOOK_Y + 0.3, distance)
    camera.lookAt(0, LOOK_Y, 0)
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(canvas)
  resize()

  // ---------- Interaksi: ketuk untuk lompat, lirik mengikuti kursor ----------

  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect()
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    if (!raycaster.intersectObjects(krekit.hitMeshes, false).length) return
    if (state.exp === 'easing') hop()
    else if (state.exp === 'segitiga' && state.layer < 4) setLayer(state.layer + 1)
    else krekit.jump({ tap: true })
    hint.hidden = true
  })

  window.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)
    const y = -(event.clientY - (rect.top + rect.height * 0.45)) / (window.innerHeight / 2)
    krekit.lookAt(THREE.MathUtils.clamp(x * 1.5, -1, 1), THREE.MathUtils.clamp(y, -1, 1))
  })

  // ---------- Percobaan ----------

  // Jumlah segitiga badan Krekit dihitung sekali dari geometrinya (cangkang, inti, mata, pecahan),
  // tanpa garis tepi dan aura. Wireframe digambar sebagai garis, jadi renderer.info tidak bisa dipakai.
  let bodyTriangles = 0
  krekit.root.traverse((object) => {
    if (!object.isMesh) return
    const m = object.material
    if (m.type === 'ShaderMaterial' || m.side === THREE.BackSide || m.transparent) return
    const geometry = object.geometry
    const triangles = (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3
    bodyTriangles += triangles * (object.isInstancedMesh ? object.count : 1)
  })

  /** Percobaan segitiga: mulai dari tampilan lengkap, lalu lepas lapisan yang belum sampai */
  const layerGroup = document.querySelector('[data-choice="layer"]')
  const layers = JSON.parse(layerGroup?.dataset.layers || '[]')
  const layerCaption = document.querySelector('[data-layer-caption]')
  const layerNext = document.querySelector('[data-action="layer-next"]')
  function applyLayer(n) {
    krekit.setWireframe(false)
    krekit.setShading('toon')
    krekit.setOutline(true)
    krekit.aura.mesh.visible = true
    if (n >= 4) return
    krekit.setOutline(false)
    krekit.aura.mesh.visible = false
    if (n === 2) krekit.setShading('unlit')
    if (n === 1) krekit.setWireframe(true)
  }
  function setLayer(n) {
    state.layer = n
    applyLayer(n)
    resetChoice('layer', String(n))
    if (layerCaption) layerCaption.textContent = layers[n - 1]?.caption ?? ''
    if (layerNext) layerNext.textContent = n < 4 ? `Lanjut: ${layers[n].label} →` : 'Ulangi dari segitiga'
    if (reduceMotion) return
    // Denyut kecil setiap ganti lapisan; di lapisan terakhir Krekit melompat lalu tersenyum
    gsap.fromTo(stage.scale, { x: 1.06, y: 1.06, z: 1.06 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' })
    if (n === 4) {
      krekit.jump()
      gsap.delayedCall(1.1, krekit.smile)
    }
  }
  onChoice('layer', (value) => setLayer(Number(value)))
  layerNext?.addEventListener('click', () => setLayer(state.layer < 4 ? state.layer + 1 : 1))
  applyLayer(state.layer)

  onChoice('shading', (mode) => krekit.setShading(mode))
  onToggle('outline', (value) => krekit.setOutline(value))
  onChoice('fps', (value) => (state.fps = Number(value)))
  onToggle('delta', (value) => (state.useDelta = value))
  onChoice('ease', (value) => {
    state.ease = value
    drawCurve(value)
    hop()
  })
  onToggle('squash', (value) => (state.squash = value))
  document.querySelector('[data-action="hop"]')?.addEventListener('click', hop)

  const uniforms = krekit.aura.uniforms
  document.querySelectorAll('[data-uniform]').forEach((input) => {
    input.addEventListener('input', () => (uniforms[input.dataset.uniform].value = Number(input.value)))
  })
  onChoice('color', (hex) => krekit.setColors(hex, hex))

  /** Lompatan percobaan easing, di grup stage (terpisah dari lompatan bawaan Krekit) */
  const EASES = {
    linear: { up: 'none', down: 'none', settle: 'none' },
    halus: { up: 'power2.out', down: 'power2.in', settle: 'power2.out' },
    memantul: { up: 'power2.out', down: 'bounce.out', settle: 'power2.out' },
    elastis: { up: 'back.out(1.8)', down: 'power2.in', settle: 'elastic.out(1, 0.35)' },
  }
  function hop() {
    if (reduceMotion || gsap.isTweening(stage.position)) return
    const ease = EASES[state.ease]
    const squash = state.squash
    const size = (x, y) => ({ x, y, z: x })
    const tl = gsap.timeline()
    if (squash) tl.to(stage.scale, { ...size(1.18, 0.8), duration: 0.1, ease: 'power2.out' })
    tl.to(stage.position, { y: 0.9, duration: 0.45, ease: ease.up })
    if (squash) tl.fromTo(stage.scale, size(0.88, 1.16), { ...size(1, 1), duration: 0.45, ease: 'power1.out' }, '<')
    // Bounce sudah memantul sendiri, jadi butuh waktu jatuh lebih panjang
    tl.to(stage.position, { y: 0, duration: state.ease === 'memantul' ? 0.75 : 0.4, ease: ease.down })
    if (squash) {
      tl.to(stage.scale, { ...size(0.92, 1.1), duration: 0.3, ease: 'power1.in' }, '<')
      tl.to(stage.scale, { ...size(1.22, 0.76), duration: 0.08 })
      tl.to(stage.scale, { ...size(1, 1), duration: state.ease === 'elastis' ? 0.8 : 0.3, ease: ease.settle })
    }
  }

  /** Dipanggil saat pindah tab: kembalikan efek percobaan sebelumnya agar tidak saling bertumpuk */
  function enter(id, previous) {
    if (previous === 'segitiga' && id !== 'segitiga') applyLayer(4)
    if (id === 'segitiga' && previous !== 'segitiga') applyLayer(state.layer)
    if (previous === 'shading' && id !== 'shading') {
      krekit.setShading('toon')
      krekit.setOutline(true)
      resetChoice('shading', 'toon')
      resetControl('outline', true)
    }
    if (previous === 'delta' && id !== 'delta') {
      state.fps = 0
      state.useDelta = true
      resetChoice('fps', '0')
      resetControl('delta', true)
      // Kembali menghadap depan lewat putaran terdekat
      gsap.to(spin.rotation, { y: Math.ceil(spin.rotation.y / TAU) * TAU, duration: 0.6, ease: 'power2.out' })
    }
  }

  // ---------- Render loop ----------

  let visible = true
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(stageEl)

  let lastRender = 0
  let elapsed = 0
  let frames = 0
  let windowStart = 0
  let windowSpin = 0
  let fps = 0
  let degPerSecond = 0

  function tick(timestamp) {
    requestAnimationFrame(tick)
    if (!visible || document.hidden) {
      lastRender = timestamp
      return
    }
    const now = timestamp / 1000
    // Batas frame rate: lewati frame sampai jatahnya tiba (toleransi 2 ms untuk jitter rAF)
    if (state.fps && now - lastRender / 1000 < 1 / state.fps - 0.002) return
    const delta = Math.min(now - lastRender / 1000, 0.25)
    lastRender = timestamp
    elapsed += delta

    if (state.exp === 'delta') {
      const step = state.useDelta ? delta * SPIN_SPEED : SPIN_SPEED / 60
      spin.rotation.y += step
      windowSpin += step
    }

    krekit.update(delta, elapsed, 0)
    renderer.render(scene, camera)

    frames++
    if (now - windowStart >= 0.5) {
      fps = Math.round(frames / (now - windowStart))
      degPerSecond = Math.round(THREE.MathUtils.radToDeg(windowSpin / (now - windowStart)))
      frames = 0
      windowSpin = 0
      windowStart = now
    }
    updateReadout()
  }

  let lastText = ''
  function updateReadout() {
    let text = ''
    if (state.exp === 'segitiga') text = `Badan Krekit: ${bodyTriangles.toLocaleString('id-ID')} segitiga`
    else if (state.exp === 'delta') text = `${fps} frame/detik · putaran ${degPerSecond}°/detik`
    else if (state.exp === 'shader') text = `uniform uTime = ${uniforms.uTime.value.toFixed(1)} detik`
    if (text !== lastText) readout.textContent = lastText = text
  }

  requestAnimationFrame(tick)
  return { enter }

  function resetControl(name, value) {
    document.querySelector(`[data-toggle="${name}"]`)?.setAttribute('aria-pressed', String(value))
  }
  function resetChoice(name, value) {
    document.querySelectorAll(`[data-choice="${name}"] [role="radio"]`).forEach((o) => o.setAttribute('aria-checked', String(o.dataset.value === value)))
  }
}

if (webglAvailable()) {
  lab = initStage()
  hint.textContent = reduceMotion ? 'Gerakan dikurangi sesuai pengaturan perangkatmu' : HINTS.segitiga
} else {
  canvas.hidden = true
  hint.hidden = true
  document.querySelector('[data-fallback]').hidden = false
}
