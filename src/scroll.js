import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Plugin GSAP harus didaftarkan sekali sebelum dipakai
gsap.registerPlugin(ScrollTrigger)

/**
 * Dua pola ScrollTrigger yang paling sering dipakai:
 *
 * 1. scrub: timeline tidak berjalan sendiri. Progresnya (0..1) DIIKAT ke posisi scroll.
 *    Scroll ke bawah = timeline maju, scroll ke atas = mundur.
 *    scrub: 1 berarti progres "mengejar" posisi scroll selama ~1 detik -> terasa halus.
 *
 * 2. toggleActions: animasi biasa yang DIPICU saat elemen masuk/keluar viewport.
 *    Format: 'onEnter onLeave onEnterBack onLeaveBack'.
 */
export function createScroll({ scrollGroup }) {
  // Di layar sempit objek tidak digeser jauh agar tidak keluar dari layar.
  // Nilai berupa fungsi + invalidateOnRefresh: dihitung ulang saat jendela di-resize.
  const offsetX = () => (window.innerWidth < 768 ? 0.6 : 1.8)

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: 'main',
      start: 'top top', // saat atas <main> menyentuh atas viewport
      end: 'bottom bottom', // saat bawah <main> menyentuh bawah viewport
      scrub: 1,
      invalidateOnRefresh: true,
      // markers: true, // aktifkan untuk melihat garis start/end saat belajar
    },
    defaults: { ease: 'power2.inOut' },
  })

  tl
    // Section 2: teks di kiri -> objek pindah ke kanan
    .to(scrollGroup.position, { x: () => offsetX() })
    .to(scrollGroup.rotation, { z: -0.3 }, '<')
    // Section 3: teks di kanan -> objek pindah ke kiri
    .to(scrollGroup.position, { x: () => -offsetX() })
    .to(scrollGroup.rotation, { z: 0.3 }, '<')

  // Teks tiap section muncul saat section masuk ke viewport
  document.querySelectorAll('.reveal').forEach((section) => {
    gsap.from(section.children, {
      autoAlpha: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 60%', // saat atas section mencapai 60% tinggi viewport
        toggleActions: 'play none none reverse',
      },
    })
  })
}
