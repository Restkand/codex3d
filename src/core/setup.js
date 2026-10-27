import * as THREE from 'three'

// Layar HiDPI bisa punya pixel ratio 3+. Jumlah piksel naik kuadratik
// (ratio 2 = 4x piksel), jadi dibatasi agar GPU kelas menengah tetap stabil di 60 FPS.
export const MAX_PIXEL_RATIO = 1.5

/**
 * Fondasi Three.js: tiga elemen wajib + resize handler.
 *
 * Alur pipa grafis sederhananya:
 *   Scene (data dunia) -> Camera (dari mana dunia dilihat) -> Renderer (WebGL menggambar ke <canvas>)
 */
export function createSetup(canvas) {
  // Scene: "semesta" yang menampung semua objek, cahaya, dan kamera
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b0b10')
  // Fog membuat objek jauh memudar ke warna latar -> kesan kedalaman
  scene.fog = new THREE.Fog('#0b0b10', 8, 20)

  // PerspectiveCamera(fov, aspect, near, far)
  // - fov: sudut pandang vertikal dalam derajat
  // - aspect: rasio lebar/tinggi; jika salah, gambar akan gepeng/melar
  // - near/far: objek di luar rentang ini tidak digambar (clipping)
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0.6, 6)
  scene.add(camera)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  // Bayangan dinyalakan di renderer, lalu per-objek lewat castShadow/receiveShadow
  renderer.shadowMap.enabled = true
  // PCF = tepi bayangan dihaluskan (PCFSoftShadowMap sudah dihapus sejak Three r18x)
  renderer.shadowMap.type = THREE.PCFShadowMap
  // Tone mapping memetakan cahaya HDR ke rentang layar agar highlight tidak "pecah"
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const sizes = { width: 0, height: 0 }

  function resize() {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Kamera perlu tahu rasio baru, lalu matriks proyeksinya dihitung ulang
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  }

  resize()
  window.addEventListener('resize', resize)

  return { scene, camera, renderer, sizes }
}
