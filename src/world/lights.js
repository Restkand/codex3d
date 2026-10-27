import * as THREE from 'three'

/**
 * Dua jenis cahaya klasik:
 * - AmbientLight: menerangi semua sisi secara merata (tanpa arah, tanpa bayangan).
 *   Mencegah sisi gelap objek menjadi hitam pekat.
 * - DirectionalLight: sinar sejajar seperti matahari. Memberi kontras terang/gelap
 *   dan mampu menghasilkan bayangan.
 */
export function createLights(scene) {
  const ambient = new THREE.AmbientLight('#ffffff', 0.4)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight('#ffffff', 2.5)
  directional.position.set(3, 4, 2)
  directional.castShadow = true

  // Shadow map = tekstur kedalaman yang dirender dari sudut pandang cahaya.
  // Makin besar makin tajam, tapi makin mahal untuk GPU.
  directional.shadow.mapSize.set(1024, 1024)
  // Kamera bayangan (ortografis) cukup mencakup area di sekitar objek
  const shadowCam = directional.shadow.camera
  shadowCam.near = 0.5
  shadowCam.far = 15
  shadowCam.left = shadowCam.bottom = -4
  shadowCam.right = shadowCam.top = 4
  // Normal bias mengurangi artefak garis-garis ("shadow acne") di permukaan
  directional.shadow.normalBias = 0.03
  scene.add(directional)

  return { ambient, directional }
}
