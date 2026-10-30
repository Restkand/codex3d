import './style.css'
import gsap from 'gsap'
import * as THREE from 'three'
import { createSetup } from './core/setup.js'
import { createLights } from './world/lights.js'
import { createObjects } from './world/objects.js'
import { createHologram } from './world/hologram.js'
import { createPost } from './post.js'
import { createInteraction } from './interaction.js'
import { createIntro } from './intro.js'
import { createDebug } from './debug.js'
import { createScroll } from './scroll.js'
import { createTransitions } from './transitions.js'
import { createHover } from './hover.js'
import { createPerf } from './perf.js'

const canvas = document.querySelector('canvas.webgl')

const { scene, camera, renderer } = createSetup(canvas)
const lights = createLights(scene)
const objects = createObjects(scene)
// Cangkang hologram menjadi anak mesh -> ikut berputar, mengambang, dan membesar saat hover
const hologram = createHologram(objects.mesh)
const post = createPost({ renderer, scene, camera })

// Parameter yang dibaca render loop dan bisa diubah dari lil-gui
const params = {
  rotationSpeed: 0.6, // radian per detik
  floatAmplitude: 0.15,
}

createInteraction({ tiltGroup: objects.tiltGroup, camera })
const intro = createIntro({ introGroup: objects.introGroup, camera })
createScroll({ scrollGroup: objects.scrollGroup })
createTransitions({ scene, hologram, post })
const hover = createHover({
  camera,
  mesh: objects.mesh,
  material: objects.material,
  // Klik objek: glitch + gelombang hologram melonjak lalu mereda
  onClick: () => {
    post.burst()
    gsap.fromTo(hologram.uniforms.uPulse, { value: 0.2 }, { value: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)', overwrite: true })
  },
})
const perf = createPerf(renderer)
createDebug({ lights, objects, params, intro, hologram, post, perf })

/**
 * Render loop
 *
 * requestAnimationFrame memanggil tick() tepat sebelum browser menggambar frame berikutnya,
 * mengikuti refresh rate monitor (60Hz = 60x/detik, 144Hz = 144x/detik).
 *
 * Karena jumlah frame per detik berbeda-beda, gerakan TIDAK boleh "+0.01 per frame"
 * (monitor 144Hz akan berputar 2,4x lebih cepat). Gerakan harus dikali delta,
 * yaitu waktu sejak frame sebelumnya dalam detik -> kecepatan sama di semua monitor.
 *
 * THREE.Timer adalah pengganti THREE.Clock (deprecated sejak r183). Bedanya:
 * update() dipanggil eksplisit sekali per frame, dan connect(document) membuat
 * delta tidak melonjak saat tab disembunyikan lalu dibuka kembali.
 */
const timer = new THREE.Timer()
timer.connect(document)

function tick(timestamp) {
  perf.begin()
  timer.update(timestamp)
  const delta = timer.getDelta()
  const elapsed = timer.getElapsed()

  const { mesh } = objects
  mesh.rotation.y += delta * params.rotationSpeed
  mesh.rotation.x += delta * params.rotationSpeed * 0.4
  // Sinus berosilasi -1..1 -> objek naik-turun seperti mengambang
  mesh.position.y = Math.sin(elapsed * 1.5) * params.floatAmplitude

  // Shader tidak punya jam sendiri; waktu dikirim dari JS lewat uniform setiap frame
  hologram.uniforms.uTime.value = elapsed
  post.glitch.uTime.value = elapsed

  // Kamera selalu menatap pusat dunia meski posisinya digeser oleh parallax/intro
  camera.lookAt(0, 0, 0)

  hover.update()

  // Render bersyarat: post-processing hanya saat glitch aktif, selebihnya langsung ke layar.
  // Material bawaan melalui tone mapping + sRGB di kedua jalur, jadi warnanya konsisten. Pengecualian:
  // shader hologram (ShaderMaterial tanpa chunk <tonemapping_fragment>/<colorspace_fragment>) hanya
  // dikonversi lewat OutputPass, sehingga warnanya sedikit bergeser selama glitch. Disengaja: memuat
  // kedua chunk itu membuat aura pucat, padahal warna terang di atas 1.0 dibutuhkan bloom.
  const usePost = post.isActive()
  if (usePost) post.composer.render(delta)
  else renderer.render(scene, camera)

  perf.end(usePost ? 'composer' : 'direct')
  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
