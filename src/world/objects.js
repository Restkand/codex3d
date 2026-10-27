import * as THREE from 'three'

/**
 * Mesh = Geometry (bentuk/kumpulan titik) + Material (cara permukaan bereaksi terhadap cahaya).
 *
 * Objek dibungkus dalam beberapa lapis Group. Tiap lapis dikendalikan oleh satu sistem saja,
 * sehingga animasi tidak saling menimpa nilai yang sama:
 *   scrollGroup -> posisi x & rotation z, oleh ScrollTrigger (GSAP)
 *   introGroup  -> scale oleh timeline intro, posisi oleh lil-gui
 *   tiltGroup   -> rotation x/y, mengikuti mouse (GSAP quickTo)
 *   mesh        -> rotation & posisi y oleh render loop, scale oleh hover (Raycaster)
 * Transformasi anak selalu relatif terhadap induknya, jadi efeknya tergabung.
 */
export function createObjects(scene) {
  const scrollGroup = new THREE.Group()
  const introGroup = new THREE.Group()
  const tiltGroup = new THREE.Group()
  scrollGroup.add(introGroup)
  introGroup.add(tiltGroup)
  scene.add(scrollGroup)

  // Icosahedron detail 1 memberi tampilan "low-poly" bersegi; naikkan detail -> makin bulat
  const geometry = new THREE.IcosahedronGeometry(1, 1)
  // MeshStandardMaterial = material PBR (Physically Based Rendering)
  // roughness 0 = mengilap seperti cermin, 1 = doff
  // metalness 0 = non-logam (plastik/kayu), 1 = logam
  const material = new THREE.MeshStandardMaterial({
    color: '#ffcc33',
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true,
    // Emissive = cahaya yang "dipancarkan" sendiri oleh permukaan, tidak bergantung lampu.
    // Intensitas 0 dulu; dinaikkan saat kursor hover (lihat hover.js)
    emissive: '#ff5a1f',
    emissiveIntensity: 0,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  tiltGroup.add(mesh)

  // Lantai hanya menerima bayangan; diputar -90° agar rebah di bidang XZ
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: '#1a1a24', roughness: 0.9 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.6
  floor.receiveShadow = true
  scene.add(floor)

  return { scrollGroup, introGroup, tiltGroup, mesh, material, floor }
}
