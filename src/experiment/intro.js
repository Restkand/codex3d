import gsap from 'gsap'

/**
 * Timeline = daftar tween yang diputar berurutan pada satu garis waktu.
 * Parameter posisi (argumen ketiga) mengatur kapan tween dimulai:
 *   '<'      -> bersamaan dengan awal tween sebelumnya
 *   '-=0.6'  -> 0.6 detik sebelum tween sebelumnya selesai (overlap)
 *   tanpa    -> setelah tween sebelumnya selesai
 */
export function createIntro({ introGroup, camera }) {
  const textEls = document.querySelectorAll('.hero > *')
  const finalCamZ = camera.position.z

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl
    // 1. Objek muncul dari skala 0 dengan pantulan elastis
    .fromTo(
      introGroup.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 1.8, ease: 'elastic.out(1, 0.4)' },
    )
    // 2. Kamera mundur dari jauh menuju posisi akhir, bersamaan dengan langkah 1
    .fromTo(camera.position, { z: finalCamZ + 6 }, { z: finalCamZ, duration: 2 }, '<')
    // 3. Teks hero masuk satu per satu (stagger) sebelum langkah 2 selesai
    .fromTo(
      textEls,
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 },
      '-=1.2',
    )

  return tl
}
