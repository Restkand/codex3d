import * as THREE from 'three'
// Akhiran ?raw adalah fitur Vite: isi file diimpor sebagai string biasa
import vertexShader from '../shaders/hologram/vertex.glsl?raw'
import fragmentShader from '../shaders/hologram/fragment.glsl?raw'

/**
 * Cangkang hologram di sekeliling objek utama, digambar dengan shader buatan sendiri.
 *
 * ShaderMaterial = kita menulis sendiri program GPU-nya (vertex + fragment shader).
 * Uniform = "jembatan" dari JavaScript ke shader: nilai yang sama untuk semua titik/piksel
 * dalam satu frame. Mengubah uniforms.uX.value di JS langsung terlihat di frame berikutnya,
 * sehingga GSAP dan lil-gui bisa mengendalikan shader.
 */
export function createHologram(parent) {
  // Box dengan banyak segmen agar bisa dibentuk menjadi bola. 24 segmen per sisi
  // (~3.700 titik) sudah cukup halus; menggandakannya = 4x lebih banyak titik untuk GPU.
  const geometry = new THREE.BoxGeometry(2.3, 2.3, 2.3, 24, 24, 24)

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uTwist: { value: 0 },
    uWaveAmp: { value: 0.06 },
    uWaveFreq: { value: 4 },
    uPulse: { value: 0 },
    uSphereRadius: { value: 1.45 },
    uColorA: { value: new THREE.Color('#00e5ff') },
    uColorB: { value: new THREE.Color('#ff2bd6') },
    uOpacity: { value: 0.35 },
  }

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    // Additive blending: warna ditambahkan ke apa yang ada di belakangnya -> kesan cahaya
    blending: THREE.AdditiveBlending,
    // Tidak menulis ke depth buffer agar sisi depan dan belakang cangkang sama-sama terlihat
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, material)
  parent.add(mesh)

  return { mesh, uniforms }
}
