import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Transisi antar-"scene": tiap section punya keadaan visualnya sendiri.
 * Saat section aktif berganti, semua nilai dianimasikan ke keadaan baru + glitch singkat.
 *
 * Bedanya dengan scroll.js: di sana animasi di-scrub (terikat langsung ke scroll).
 * Di sini animasi DIPICU sekali saat section berganti, lalu berjalan dengan durasinya sendiri.
 */
const STATES = [
  // Hero: bola cyan-magenta
  { morph: 0, twist: 0, colorA: '#00e5ff', colorB: '#ff2bd6', background: '#0b0b10' },
  // ScrollTrigger: kubus oranye-kuning
  { morph: 1, twist: 0, colorA: '#ffcc33', colorB: '#ff3d1f', background: '#120a06' },
  // Raycaster: kubus terpuntir hijau-cyan
  { morph: 1, twist: 1.6, colorA: '#7cff6b', colorB: '#00b3ff', background: '#05100e' },
]

/** Tween THREE.Color: GSAP menganimasikan komponen r, g, b-nya satu per satu */
function colorTo(color, hex, vars) {
  const target = new THREE.Color(hex)
  return gsap.to(color, { r: target.r, g: target.g, b: target.b, ...vars })
}

export function createTransitions({ scene, hologram, post }) {
  const { uniforms } = hologram
  let current = 0
  let tl

  function goTo(index) {
    if (index === current) return
    current = index
    const state = STATES[index]

    // Hentikan transisi sebelumnya jika user scroll cepat melewati beberapa section
    tl?.kill()
    const vars = { duration: 1.2, ease: 'expo.inOut' }

    tl = gsap
      .timeline()
      .to(uniforms.uMorph, { value: state.morph, ...vars })
      .to(uniforms.uTwist, { value: state.twist, ...vars }, '<')
      .add(colorTo(uniforms.uColorA.value, state.colorA, vars), '<')
      .add(colorTo(uniforms.uColorB.value, state.colorB, vars), '<')
      .add(colorTo(scene.background, state.background, vars), '<')
      .add(colorTo(scene.fog.color, state.background, vars), '<')

    post.burst()
  }

  // Section dianggap aktif selama melewati garis tengah viewport.
  // onToggle terpanggil saat masuk/keluar dari arah mana pun (scroll ke bawah maupun ke atas).
  document.querySelectorAll('main > .section').forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && goTo(index),
    })
  })

  return { goTo }
}
