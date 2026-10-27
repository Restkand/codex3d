import gsap from 'gsap'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { MAX_PIXEL_RATIO } from './core/setup.js'
import glitchVertex from './shaders/glitch/vertex.glsl?raw'
import glitchFragment from './shaders/glitch/fragment.glsl?raw'

/**
 * Post-processing: scene dirender ke tekstur (render target), lalu tekstur itu
 * dilewatkan ke serangkaian "pass", seperti filter yang ditumpuk:
 *
 *   RenderPass  -> menggambar scene ke tekstur
 *   GlitchPass  -> shader kita sendiri: slice glitch + RGB shift
 *   OutputPass  -> tone mapping + konversi warna ke sRGB untuk layar (selalu terakhir)
 *
 * Setiap pass = satu kali menggambar ulang SELURUH layar. Itu mahal, apalagi di layar
 * resolusi tinggi. Karena itu composer hanya dipakai saat glitch sedang aktif
 * (lihat isActive() dan render loop di main.js). Di luar itu scene dirender langsung.
 */
export function createPost({ renderer, scene, camera }) {
  const composer = new EffectComposer(renderer)

  composer.addPass(new RenderPass(scene, camera))

  const glitchPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uRgbShift: { value: 0 },
    },
    vertexShader: glitchVertex,
    fragmentShader: glitchFragment,
  })
  composer.addPass(glitchPass)

  composer.addPass(new OutputPass())

  function resize() {
    composer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    composer.setSize(window.innerWidth, window.innerHeight)
  }
  resize()
  window.addEventListener('resize', resize)

  // ShaderPass MENYALIN objek uniforms yang kita berikan, jadi yang dianimasikan
  // harus glitchPass.uniforms, bukan objek literal di atas.
  const glitch = glitchPass.uniforms

  /** Ledakan glitch singkat: langsung kuat, lalu mereda */
  function burst(strength = 0.6, duration = 0.5) {
    gsap.fromTo(glitch.uStrength, { value: strength }, { value: 0, duration, ease: 'power2.out', overwrite: true })
  }

  /** true jika ada efek yang terlihat -> composer perlu dipakai frame ini */
  function isActive() {
    return glitch.uStrength.value > 0.001 || glitch.uRgbShift.value > 0
  }

  return { composer, glitch, burst, isActive }
}
