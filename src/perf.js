/**
 * Monitor performa sederhana, tanpa library tambahan.
 *
 * Yang diukur:
 * - FPS & frame time: dihitung dari jumlah frame dalam jendela 0,5 detik (dirata-rata agar angka tidak meloncat-loncat).
 *   Frame time 16,7 ms = 60 FPS. Jika monitor 120/144Hz, FPS bisa lebih dari 60.
 * - CPU time: lama JavaScript kita bekerja per frame (update + perintah render).
 *   Ini BUKAN waktu GPU: GPU bekerja paralel/asinkron, jadi waktunya tidak bisa diukur
 *   dengan performance.now(). Jika FPS turun tapi CPU time kecil -> bottleneck ada di GPU.
 * - renderer.info: statistik dari Three.js.
 *   draw calls = berapa kali CPU menyuruh GPU menggambar (makin sedikit makin baik)
 *   triangles  = jumlah segitiga yang digambar per frame
 *   geometries/textures = jumlah objek yang tersimpan di memori GPU
 *   programs   = jumlah shader yang sudah dikompilasi
 */
export function createPerf(renderer) {
  // Secara bawaan info di-reset di setiap renderer.render(). Saat composer aktif, render()
  // dipanggil beberapa kali per frame (sekali per pass), sehingga angka hanya mencerminkan
  // pass terakhir. Reset manual sekali per frame -> angkanya mencakup seluruh frame.
  renderer.info.autoReset = false

  const stats = {
    fps: 0,
    frameMs: 0,
    cpuMs: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    renderPath: 'direct',
    pixelRatio: renderer.getPixelRatio(),
  }

  const WINDOW_MS = 500
  let windowStart = performance.now()
  let frames = 0
  let cpuTotal = 0
  let cpuStart = 0

  /** Panggil di awal frame */
  function begin() {
    renderer.info.reset()
    cpuStart = performance.now()
  }

  /** Panggil setelah render selesai */
  function end(renderPath) {
    const now = performance.now()
    cpuTotal += now - cpuStart
    frames++

    const { render, memory, programs } = renderer.info
    stats.drawCalls = render.calls
    stats.triangles = render.triangles
    stats.geometries = memory.geometries
    stats.textures = memory.textures
    stats.programs = programs?.length ?? 0
    stats.renderPath = renderPath
    stats.pixelRatio = renderer.getPixelRatio()

    const elapsed = now - windowStart
    if (elapsed >= WINDOW_MS) {
      stats.fps = (frames * 1000) / elapsed
      stats.frameMs = elapsed / frames
      stats.cpuMs = cpuTotal / frames
      windowStart = now
      frames = 0
      cpuTotal = 0
    }
  }

  return { stats, begin, end }
}
