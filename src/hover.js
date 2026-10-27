import * as THREE from 'three'
import gsap from 'gsap'

/**
 * Raycaster = "menembakkan sinar" dari kamera melewati titik di layar,
 * lalu mencari objek 3D mana saja yang tertembus sinar itu.
 *
 * Koordinat kursor harus dalam NDC (Normalized Device Coordinates): -1..1
 * dengan (0,0) di tengah layar dan Y ke atas, sama seperti di interaction.js.
 */
export function createHover({ camera, mesh, material, onClick }) {
  const raycaster = new THREE.Raycaster()
  // Mulai jauh di luar layar supaya tidak dianggap hover sebelum mouse bergerak
  const pointer = new THREE.Vector2(10, 10)
  let isHovered = false

  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
  })
  // Kursor keluar jendela / jari diangkat -> anggap tidak hover
  document.addEventListener('pointerleave', () => pointer.set(10, 10))

  // Listener di kanvas, bukan window, agar klik pada panel lil-gui tidak ikut terhitung
  document.querySelector('canvas.webgl').addEventListener('click', () => {
    if (isHovered) onClick?.()
  })

  function onEnter() {
    document.body.style.cursor = 'pointer'
    gsap.to(mesh.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    gsap.to(material, { emissiveIntensity: 0.6, duration: 0.3 })
  }

  function onLeave() {
    document.body.style.cursor = ''
    gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' })
    gsap.to(material, { emissiveIntensity: 0, duration: 0.5 })
  }

  /**
   * Dipanggil setiap frame dari render loop, bukan dari event mousemove.
   * Alasannya: objek bisa bergerak (berputar, mengambang, ikut scroll) ke bawah kursor
   * walaupun mouse diam. Kita hanya memicu animasi saat status hover BERUBAH,
   * bukan setiap frame.
   */
  function update() {
    raycaster.setFromCamera(pointer, camera)
    // intersectObject mengembalikan array titik tabrakan, terurut dari yang terdekat.
    // false = jangan periksa anak-anaknya (cangkang hologram adalah anak mesh ini)
    const hit = raycaster.intersectObject(mesh, false).length > 0

    if (hit && !isHovered) onEnter()
    if (!hit && isHovered) onLeave()
    isHovered = hit
  }

  return { update }
}
