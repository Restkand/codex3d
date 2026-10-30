/**
 * Nama jalur belajar dan bab Kamus di SATU tempat.
 * Dipakai oleh sidebar (astro.config.mjs), label di atas judul halaman, dan halaman depan.
 * Kunci = nama folder di src/content/docs/.
 */
export const TRACKS = [
  { id: 'fondasi-engine', title: 'Fondasi Engine', blurb: 'Cara engine membangun dunia game: game loop, ruang, material dan cahaya, shader, bayangan, animasi, sampai profiling. Contoh untuk Unity, Unreal, dan Godot.', krekit: 'Ini satu-satunya jalur yang sudah ada pelajarannya. Cocok untuk mulai.' },
  { id: 'lanskap-engine', title: 'Lanskap Engine', blurb: 'Unity, Unreal, Godot, dan lainnya: arsitektur, lisensi, dan kapan memilih yang mana.', krekit: 'Kalau kamu pernah pindah engine, pengalamanmu dibutuhkan di sini.' },
  { id: 'desain-game', title: 'Desain Game', blurb: 'Core loop, game feel, level design, dan playtesting.', krekit: 'Bagian game feel nanti nyambung ke easing dan delta time di Fondasi Engine.' },
  { id: 'produksi', title: 'Produksi', blurb: 'Scoping, vertical slice, milestone, peran tim, dan alat kerja.', krekit: 'Banyak game berhenti di tahap ini karena cakupannya terlalu besar untuk waktu dan timnya.' },
  { id: 'bisnis-indie', title: 'Bisnis Studio Indie', blurb: 'Pendanaan, hitungan pendapatan, marketing, legal, dan platform.', krekit: 'Nanti semua angka di jalur ini wajib ada sumbernya.' },
  { id: 'industri-karier', title: 'Industri & Karier', blurb: 'Peta peran, ekosistem lokal, portofolio, dan studi kasus.', krekit: 'Rencananya banyak diisi cerita orang yang bekerja di studio.' },
  { id: 'seni-visual', title: 'Seni & Gaya Visual', blurb: 'Pixel art, 2D, 2.5D, dan 3D: cara aset visual dibuat dan bagaimana engine menampilkannya.', krekit: 'Setiap gaya visual punya aturan sendiri saat masuk ke engine, dari ukuran piksel sampai jumlah poligon.' },
]

/**
 * Bab Tambahan: materi yang menerapkan konsep jalur utama pada teknologi tertentu.
 * Ditampilkan setelah jalur utama. Untuk menambah bab baru, cukup tambahkan entri di sini
 * dan buat folder src/content/docs/belajar/<id>/ berisi index.mdx.
 */
export const EXTRA_TRACKS = [
  { id: 'web-threejs', title: 'Web & Three.js', blurb: 'Konsep Fondasi Engine diterapkan di browser dengan WebGL, Three.js, dan GSAP, dibedah dari scene Lab situs ini.', krekit: 'Ini bab tambahan. Konsepnya sama dengan Fondasi Engine, tapi semuanya berjalan di browser.' },
  { id: 'perangkat-keras', title: 'Perangkat Keras Game', blurb: 'CPU, GPU, memori, layar, serta perbedaan PC, konsol, dan HP, dari sudut pandang pembuat game.', krekit: 'Ini bab tambahan. Di sini kamu akan tahu kenapa game yang sama terasa berbeda di setiap perangkat.' },
]

/** Semua jalur (utama + tambahan), untuk halaman yang tidak membedakan keduanya */
export const ALL_TRACKS = [...TRACKS, ...EXTRA_TRACKS]

/** Bab Kamus. `extra: true` = bab tambahan (khusus teknologi tertentu), ditampilkan terpisah di akhir */
export const KAMUS_CHAPTERS = [
  { id: 'dasar', title: 'Dasar Pipa Grafis', blurb: 'Scene, kamera, renderer, frame, delta time, V-Sync.' },
  { id: 'ruang', title: 'Ruang & Matematika', blurb: 'Koordinat, vektor, quaternion, hierarki, lerp, presisi float.' },
  { id: 'geometri', title: 'Geometri & Material', blurb: 'Vertex, normal map, UV, tekstur, PBR, blending, depth buffer.' },
  { id: 'cahaya', title: 'Cahaya, Bayangan & Warna', blurb: 'Jenis cahaya, bayangan, global illumination, tone mapping.' },
  { id: 'shader', title: 'Shader', blurb: 'Vertex & fragment shader, uniform, fresnel, shader variant, toon.' },
  { id: 'post', title: 'Post-processing', blurb: 'Render target, bloom, HDR, anti-aliasing.' },
  { id: 'animasi', title: 'Animasi', blurb: 'Tween, easing, timeline, kerangka tulang, state machine, IK.' },
  { id: 'fisika', title: 'Physics', blurb: 'Rigidbody, collider, trigger, fixed timestep, character controller.' },
  { id: 'interaksi', title: 'Interaksi', blurb: 'Raycast, input action, dead zone, dan reaksi atas input pemain.' },
  { id: 'performa', title: 'Performa', blurb: 'Profiler, draw call, instancing, fill rate, culling, memori.' },
  { id: 'web', title: 'Web & Three.js', blurb: 'Istilah khusus browser, Three.js, GSAP, dan perkakas web.', extra: true },
]

const trackTitle = (id) => ALL_TRACKS.find((t) => t.id === id)?.title
const chapterTitle = (id) => KAMUS_CHAPTERS.find((c) => c.id === id)?.title

/** Label kecil di atas judul halaman, mis. "Pelajaran 01 · Fondasi Engine" atau "Kamus · Shader & GLSL" */
export function eyebrowFor(entryId, kind) {
  const [section, group, page] = entryId.split('/')
  if (section === 'belajar') {
    if (kind === 'lesson') {
      const num = page?.match(/^(\d+)/)?.[1]
      return `Pelajaran ${num ?? ''} · ${trackTitle(group) ?? ''}`
    }
    return group ? `Jalur Belajar · ${trackTitle(group) ?? group}` : 'Jalur Belajar'
  }
  if (section === 'kamus') return group ? `Kamus · ${chapterTitle(group) ?? group}` : 'Kamus'
  if (section === 'kontribusi') return 'Kontribusi'
  return null
}
