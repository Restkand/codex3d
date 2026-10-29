/**
 * Pos 3 "Satu frame lewat pipa": kubus kecil yang berubah mengikuti 10 tahap pipa grafis,
 * dari data di CPU sampai gambar di layar. Kanvas 2D, digambar ulang HANYA saat tahap atau
 * sudutnya berubah (tanpa loop requestAnimationFrame), jadi ringan.
 *
 * Kubus diproyeksikan sendiri dengan rumus sederhana: putar, beri perspektif, buang sisi
 * yang membelakangi kamera (lihat Kamus: Vertex Shader, Rasterization, Depth Buffer).
 */

const W = 360
const H = 200
const CX = 200
const CY = 104
const COLORS = {
  line: 'rgba(242,242,245,0.28)',
  text: 'rgba(242,242,245,0.75)',
  dim: 'rgba(242,242,245,0.4)',
  cyan: '#00e5ff',
  accent: '#ffcc33',
  magenta: '#ff2bd6',
  grey: '#5a5a66',
}
// Warna dasar tiap sisi kubus (sebelum diberi cahaya)
const FACE_COLORS = ['#e8735a', '#f2b84b', '#5cc1a8', '#8b7ae6', '#6fb3e8', '#e88fb4']

const VERTS = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
]
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
// Urutan titik searah jarum jam dilihat dari luar, beserta normal setiap sisi
const FACES = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1] },
  { idx: [1, 0, 3, 2], n: [0, 0, -1] },
  { idx: [5, 1, 2, 6], n: [1, 0, 0] },
  { idx: [0, 4, 7, 3], n: [-1, 0, 0] },
  { idx: [7, 6, 2, 3], n: [0, 1, 0] },
  { idx: [0, 1, 5, 4], n: [0, -1, 0] },
]
const LIGHT = normalize([0.5, 0.8, 0.6])

function normalize([x, y, z]) {
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l]
}

/** Putar sumbu Y (sudut a) lalu sumbu X (kemiringan tetap), seperti transform objek */
function rotate([x, y, z], a, tilt = 0.45) {
  const x1 = x * Math.cos(a) + z * Math.sin(a)
  const z1 = -x * Math.sin(a) + z * Math.cos(a)
  const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt)
  const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt)
  return [x1, y2, z2]
}

/** Proyeksi perspektif ke piksel kanvas. Kamera di z = +5 menatap ke −Z */
function project([x, y, z], cx, cy, size) {
  const f = 5 / (5 - z)
  return [cx + x * size * f, cy - y * size * f, z]
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * amount)
  const g = Math.round(((n >> 8) & 255) * amount)
  const b = Math.round((n & 255) * amount)
  return `rgb(${r},${g},${b})`
}

function insidePolygon(px, py, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function createFrameSim(root, steps) {
  const canvas = root.querySelector('canvas')
  const caption = root.querySelector('[data-frame-caption]')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  let stage = 0
  let angle = 0.6

  /** Kubus pada sudut saat ini: titik terproyeksi + sisi yang menghadap kamera (urut jauh ke dekat) */
  function cube(cx = CX, cy = CY, size = 44, a = angle) {
    const pts = VERTS.map((v) => project(rotate(v, a), cx, cy, size))
    const faces = FACES.map((face, i) => {
      const n = rotate(face.n, a)
      const depth = face.idx.reduce((sum, k) => sum + pts[k][2], 0) / 4
      const light = 0.35 + 0.65 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
      return { poly: face.idx.map((k) => pts[k]), visible: n[2] > 0, depth, light, color: FACE_COLORS[i] }
    })
      .filter((f) => f.visible)
      .sort((p, q) => p.depth - q.depth)
    return { pts, faces }
  }

  function wire({ pts }, color = COLORS.line, dash = []) {
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.setLineDash(dash)
    ctx.beginPath()
    for (const [a, b] of EDGES) {
      ctx.moveTo(pts[a][0], pts[a][1])
      ctx.lineTo(pts[b][0], pts[b][1])
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  function solid({ faces }, alpha = 1) {
    ctx.globalAlpha = alpha
    for (const f of faces) {
      ctx.fillStyle = shade(f.color, f.light)
      ctx.beginPath()
      f.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(7,7,11,0.6)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  /** Rasterisasi: kotak piksel kasar, diisi jika pusatnya tertutup sisi kubus */
  function pixels({ faces }, colored) {
    const cell = 9
    for (let y = cell / 2; y < H; y += cell) {
      for (let x = cell / 2; x < W; x += cell) {
        // Sisi terdekat (terakhir di daftar) yang menutupi titik ini menang, seperti depth test
        let hit = null
        for (const f of faces) if (insidePolygon(x, y, f.poly)) hit = f
        if (!hit) continue
        ctx.fillStyle = colored ? shade(hit.color, hit.light) : COLORS.grey
        ctx.fillRect(x - cell / 2 + 0.5, y - cell / 2 + 0.5, cell - 1, cell - 1)
      }
    }
  }

  function label(text, x, y, color = COLORS.text, align = 'left') {
    ctx.fillStyle = color
    ctx.font = '11px ui-monospace, Consolas, monospace'
    ctx.textAlign = align
    ctx.fillText(text, x, y)
  }

  function arrow(x0, y0, x1, y1, color) {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    const a = Math.atan2(y1 - y0, x1 - x0)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4))
    ctx.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4))
    ctx.fill()
  }

  /** Kamera kecil di kiri, dengan dua garis frustum ke arah kubus */
  function camera(spread = 70) {
    ctx.fillStyle = COLORS.cyan
    ctx.fillRect(22, CY - 9, 20, 18)
    ctx.beginPath()
    ctx.moveTo(42, CY)
    ctx.lineTo(50, CY - 8)
    ctx.lineTo(50, CY + 8)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,229,255,0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, CY)
    ctx.lineTo(W - 70, CY - spread)
    ctx.moveTo(50, CY)
    ctx.lineTo(W - 70, CY + spread)
    ctx.stroke()
  }

  const STAGES = [
    // 1 Logika Game: objek masih berupa data di CPU
    () => {
      wire(cube(), COLORS.dim, [4, 4])
      label('// CPU, update()', 16, 26, COLORS.dim)
      label(`posisi  = (0, 0, 0)`, 16, 46)
      label(`rotasi.y = ${Math.round((angle * 180) / Math.PI) % 360}°`, 16, 64)
      arrow(CX + 62, CY + 50, CX + 30, CY + 66, COLORS.accent)
    },
    // 2 Scene + Kamera
    () => {
      camera()
      wire(cube())
      label('kamera', 16, CY + 30, COLORS.cyan)
    },
    // 3 Culling: objek di luar pandangan kamera dibuang
    () => {
      camera(52)
      wire(cube())
      const out = cube(W - 30, 28, 14)
      wire(out, COLORS.magenta, [3, 3])
      ctx.strokeStyle = COLORS.magenta
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(W - 44, 14)
      ctx.lineTo(W - 16, 42)
      ctx.moveTo(W - 16, 14)
      ctx.lineTo(W - 44, 42)
      ctx.stroke()
      label('di luar kamera: dibuang', W - 12, 60, COLORS.magenta, 'right')
    },
    // 4 Draw call: CPU mengirim perintah ke GPU
    () => {
      wire(cube(150))
      ctx.strokeStyle = COLORS.cyan
      ctx.lineWidth = 1.5
      ctx.strokeRect(W - 96, CY - 24, 80, 48)
      label('GPU', W - 56, CY + 4, COLORS.cyan, 'center')
      arrow(210, CY, W - 102, CY, COLORS.accent)
      label('draw(kubus, material)', 212, CY - 10, COLORS.accent)
    },
    // 5 Vertex shader: setiap titik dihitung posisinya di layar
    () => {
      const c = cube()
      wire(c, 'rgba(242,242,245,0.12)')
      for (const [x, y] of c.pts) {
        ctx.fillStyle = COLORS.cyan
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      label('8 titik → posisi layar', 16, 26, COLORS.cyan)
    },
    // 6 Rasterization: segitiga dipecah menjadi piksel
    () => {
      pixels(cube(), false)
      label('segitiga → piksel', 16, 26)
    },
    // 7 Fragment shader: setiap piksel diwarnai
    () => {
      pixels(cube(), true)
      label('warna per piksel', 16, 26, COLORS.accent)
    },
    // 8 Depth & blending: yang lebih dekat menutupi yang lebih jauh
    () => {
      solid(cube(CX - 58, CY - 18, 30, angle + 0.8), 0.9)
      solid(cube(CX + 10, CY + 8, 44))
      label('yang lebih dekat menang', 16, 26)
    },
    // 9 Post-processing: efek pada gambar jadi
    () => {
      ctx.shadowColor = 'rgba(255,204,51,0.9)'
      ctx.shadowBlur = 28
      solid(cube())
      ctx.shadowBlur = 0
      label('bloom', 16, 26, COLORS.accent)
    },
    // 10 Layar: frame dikirim ke monitor
    () => {
      ctx.strokeStyle = COLORS.text
      ctx.lineWidth = 2
      ctx.strokeRect(CX - 110, 16, 220, 150)
      ctx.beginPath()
      ctx.moveTo(CX - 20, 166)
      ctx.lineTo(CX - 28, 186)
      ctx.lineTo(CX + 28, 186)
      ctx.lineTo(CX + 20, 166)
      ctx.stroke()
      solid(cube(CX, 92, 36))
      label('60 FPS', CX + 100, 32, '#7cff6b', 'right')
    },
  ]

  function draw() {
    ctx.clearRect(0, 0, W, H)
    STAGES[stage]()
    const step = steps[stage]
    caption.innerHTML = `<b>${stage + 1}/${steps.length} · ${step.label}</b> ${step.sub}`
  }

  draw()
  return {
    get stage() {
      return stage
    },
    setStage(value) {
      const next = Math.max(0, Math.min(STAGES.length - 1, value))
      if (next === stage) return
      stage = next
      draw()
    },
    setAngle(value) {
      angle = value
      draw()
    },
  }
}
