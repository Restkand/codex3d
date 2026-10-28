import gsap from 'gsap'

/**
 * Mouse -> koordinat ternormalisasi -> animasi halus.
 *
 * clientX/clientY berupa piksel (0..lebar layar). Kita ubah menjadi rentang -1..1
 * dengan titik 0 di tengah layar, sehingga logikanya sama di layar ukuran apa pun.
 * Sumbu Y dibalik karena di DOM Y bertambah ke bawah, sedangkan di 3D Y bertambah ke atas.
 */
export function createInteraction({ tiltGroup, camera }) {
  // gsap.quickTo membuat SATU fungsi tween yang dipakai ulang.
  // Setiap dipanggil, target baru di-set dan objek "mengejar" nilai itu dengan easing.
  // Ini efek lerp/smoothing tanpa membuat tween baru di setiap event mousemove (hemat memori).
  const tween = { duration: 0.8, ease: 'power3.out' }
  const tiltX = gsap.quickTo(tiltGroup.rotation, 'x', tween)
  const tiltY = gsap.quickTo(tiltGroup.rotation, 'y', tween)

  // Parallax: kamera bergeser sedikit dan lebih lambat -> kesan kedalaman
  const parallax = { duration: 1.6, ease: 'power2.out' }
  const camX = gsap.quickTo(camera.position, 'x', parallax)
  const camY = gsap.quickTo(camera.position, 'y', parallax)

  const baseCamY = camera.position.y
  const maxTilt = 0.5 // radian (~28°)

  function onMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -((event.clientY / window.innerHeight) * 2 - 1)

    // Kursor di kanan -> objek berputar pada sumbu Y ke arah kursor.
    // Kursor di atas -> objek menunduk ke belakang (rotasi X negatif).
    tiltY(x * maxTilt)
    tiltX(-y * maxTilt)

    camX(x * 0.4)
    camY(baseCamY + y * 0.25)
  }

  // pointermove mencakup mouse, pen, dan sentuhan
  window.addEventListener('pointermove', onMove)
}
