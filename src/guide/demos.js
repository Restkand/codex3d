import gsap from 'gsap'

/**
 * Demo interaktif kecil untuk Codex. Semuanya digambar ulang HANYA saat input berubah
 * (tidak ada loop requestAnimationFrame yang berjalan terus), sehingga halaman tetap ringan.
 */

const COLORS = {
  grid: 'rgba(255,255,255,0.08)',
  axis: 'rgba(255,255,255,0.25)',
  text: 'rgba(242,242,245,0.7)',
  accent: '#ffcc33',
  cyan: '#00e5ff',
  magenta: '#ff2bd6',
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** Kanvas 2D yang tajam di layar HiDPI: resolusi internal dikali devicePixelRatio */
function makeCanvas(width, height) {
  const canvas = el('canvas', 'demo__canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.aspectRatio = `${width} / ${height}`
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  return { canvas, ctx, width, height }
}

function makeSlider(label, { min, max, step, value }, onInput) {
  const wrap = el('label', 'demo__control')
  const name = el('span', 'demo__label', label)
  const input = el('input')
  Object.assign(input, { type: 'range', min, max, step, value })
  const out = el('output', 'demo__value', String(value))
  input.addEventListener('input', () => {
    out.textContent = input.value
    onInput(parseFloat(input.value))
  })
  wrap.append(name, input, out)
  return wrap
}

function drawGrid({ ctx, width, height }, pad = 20) {
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const x = pad + ((width - pad * 2) * i) / 4
    const y = pad + ((height - pad * 2) * i) / 4
    ctx.beginPath()
    ctx.moveTo(x, pad)
    ctx.lineTo(x, height - pad)
    ctx.moveTo(pad, y)
    ctx.lineTo(width - pad, y)
    ctx.stroke()
  }
}

/** Menggambar fungsi f(x) untuk x 0..1, hasil 0..1 dipetakan ke area grafik */
function plot(c, fn, { color = COLORS.accent, pad = 20, yMin = 0, yMax = 1 } = {}) {
  const { ctx, width, height } = c
  const w = width - pad * 2
  const h = height - pad * 2
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= 200; i++) {
    const x = i / 200
    const y = (fn(x) - yMin) / (yMax - yMin)
    const px = pad + x * w
    const py = pad + (1 - y) * h
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function dot(ctx, x, y, color, r = 5) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

const DEMOS = {
  /** Gerakan per-frame vs berbasis delta di berbagai refresh rate */
  delta(root) {
    const c = makeCanvas(360, 150)
    const info = el('p', 'demo__readout')
    const SPEED = 0.6 // rad/detik, sama seperti rotationSpeed proyek

    function dial(cx, label, angle, color) {
      const { ctx } = c
      const r = 48
      ctx.strokeStyle = COLORS.axis
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, 70, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx, 70)
      // Sudut 0 di atas, berputar searah jarum jam
      ctx.lineTo(cx + Math.sin(angle) * r, 70 - Math.cos(angle) * r)
      ctx.stroke()
      ctx.fillStyle = COLORS.text
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, cx, 138)
    }

    function draw(hz) {
      c.ctx.clearRect(0, 0, c.width, c.height)
      const perFrame = hz * 0.01
      dial(95, '+0.01 per frame', perFrame, COLORS.magenta)
      dial(265, 'delta × 0.6', SPEED, COLORS.cyan)
      info.innerHTML = `Setelah 1 detik di monitor <b>${hz} Hz</b>: per-frame = <b>${perFrame.toFixed(2)} rad</b>, delta = <b>${SPEED.toFixed(2)} rad</b> (selalu sama).`
    }

    root.append(c.canvas, makeSlider('Refresh rate (Hz)', { min: 30, max: 240, step: 1, value: 144 }, draw), info)
    draw(144)
  },

  /** Biaya piksel dari pixel ratio */
  pixelratio(root) {
    const info = el('p', 'demo__readout')
    const bar = el('div', 'demo__bar')
    const fill = el('div', 'demo__bar-fill')
    bar.append(fill)
    const BASE_W = 1920
    const BASE_H = 1080

    function draw(dpr) {
      const w = Math.round(BASE_W * dpr)
      const h = Math.round(BASE_H * dpr)
      const mult = dpr * dpr
      fill.style.width = `${(mult / 9) * 100}%`
      fill.classList.toggle('is-warn', dpr > 1.5)
      info.innerHTML = `Layar 1920×1080 CSS → dirender <b>${w}×${h}</b> = <b>${((w * h) / 1e6).toFixed(1)} juta</b> piksel, yaitu <b>${mult.toFixed(2)}×</b> beban dibanding DPR 1. ${dpr > 1.5 ? 'Melebihi batas proyek (1,5).' : 'Masih dalam batas proyek.'}`
    }

    root.append(makeSlider('Pixel ratio', { min: 1, max: 3, step: 0.25, value: 1.5 }, draw), bar, info)
    draw(1.5)
  },

  /** Konversi koordinat piksel → NDC */
  ndc(root) {
    const pad = el('div', 'demo__pad')
    const cross = el('div', 'demo__cross')
    pad.append(cross)
    const info = el('p', 'demo__readout', 'Gerakkan kursor di dalam kotak.')

    pad.addEventListener('pointermove', (event) => {
      const rect = pad.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      const x = (px / rect.width) * 2 - 1
      const y = -((py / rect.height) * 2 - 1)
      cross.style.transform = `translate(${px}px, ${py}px)`
      info.innerHTML = `piksel: <b>(${px.toFixed(0)}, ${py.toFixed(0)})</b> dari ${rect.width.toFixed(0)}×${rect.height.toFixed(0)} → NDC: <b>(${x.toFixed(2)}, ${y.toFixed(2)})</b>`
    })

    root.append(pad, info)
  },

  /** Gelombang sinus: amplitudo, frekuensi, dan posisi pada waktu t */
  sine(root) {
    const c = makeCanvas(360, 160)
    const state = { amp: 0.6, freq: 1.5, t: 1 }
    const info = el('p', 'demo__readout')
    const T_MAX = 4 // detik yang ditampilkan

    function draw() {
      drawGrid(c)
      const fn = (x) => state.amp * Math.sin(x * T_MAX * state.freq)
      plot(c, fn, { yMin: -1, yMax: 1 })
      const pad = 20
      const x = state.t / T_MAX
      const y = fn(x)
      dot(c.ctx, pad + x * (c.width - pad * 2), pad + (1 - (y + 1) / 2) * (c.height - pad * 2), COLORS.cyan, 6)
      info.innerHTML = `y = ${state.amp} × sin(<b>${state.t.toFixed(2)}</b> × ${state.freq}) = <b>${y.toFixed(3)}</b>. Titik biru = posisi y objek pada detik itu.`
    }

    root.append(
      c.canvas,
      makeSlider('Amplitudo', { min: 0, max: 1, step: 0.05, value: state.amp }, (v) => ((state.amp = v), draw())),
      makeSlider('Frekuensi', { min: 0.5, max: 5, step: 0.1, value: state.freq }, (v) => ((state.freq = v), draw())),
      makeSlider('Waktu (detik)', { min: 0, max: T_MAX, step: 0.01, value: state.t }, (v) => ((state.t = v), draw())),
      info,
    )
    draw()
  },

  /** Lerp antara A dan B */
  lerp(root) {
    const c = makeCanvas(360, 110)
    const info = el('p', 'demo__readout')
    const A = 20
    const B = 80

    function draw(t) {
      const { ctx, width } = c
      ctx.clearRect(0, 0, width, c.height)
      const x0 = 30
      const x1 = width - 30
      ctx.strokeStyle = COLORS.axis
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x0, 55)
      ctx.lineTo(x1, 55)
      ctx.stroke()
      dot(ctx, x0, 55, COLORS.magenta, 7)
      dot(ctx, x1, 55, COLORS.cyan, 7)
      dot(ctx, x0 + (x1 - x0) * t, 55, COLORS.accent, 9)
      ctx.fillStyle = COLORS.text
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`A = ${A}`, x0, 90)
      ctx.fillText(`B = ${B}`, x1, 90)
      info.innerHTML = `lerp(${A}, ${B}, <b>${t.toFixed(2)}</b>) = ${A} + (${B} − ${A}) × ${t.toFixed(2)} = <b>${(A + (B - A) * t).toFixed(1)}</b>`
    }

    root.append(c.canvas, makeSlider('t', { min: 0, max: 1, step: 0.01, value: 0.3 }, draw), info)
    draw(0.3)
  },

  /** Visualisasi kurva easing GSAP + putar animasinya */
  easing(root) {
    const EASES = ['none', 'power1.out', 'power3.out', 'power2.inOut', 'expo.inOut', 'back.out(1.7)', 'elastic.out(1, 0.4)', 'bounce.out']
    const c = makeCanvas(360, 200)
    const select = el('select', 'demo__select')
    EASES.forEach((name) => select.append(new Option(name, name)))
    select.value = 'power3.out'
    const play = el('button', 'demo__button', 'Putar')
    const track = el('div', 'demo__track')
    const block = el('div', 'demo__block')
    track.append(block)
    const PAD = 30
    const Y_MIN = -0.3 // ruang ekstra untuk ease yang melewati 0..1
    const Y_MAX = 1.3

    function draw(progress = null) {
      const ease = gsap.parseEase(select.value)
      drawGrid(c, PAD)
      // Garis target 0 dan 1
      const { ctx, width, height } = c
      const toY = (v) => PAD + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (height - PAD * 2)
      ctx.strokeStyle = COLORS.axis
      ctx.setLineDash([4, 4])
      ;[0, 1].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(PAD, toY(v))
        ctx.lineTo(width - PAD, toY(v))
        ctx.stroke()
      })
      ctx.setLineDash([])
      plot(c, ease, { pad: PAD, yMin: Y_MIN, yMax: Y_MAX })
      ctx.fillStyle = COLORS.text
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('waktu →', width - PAD - 50, height - 10)
      ctx.fillText('nilai ↑', 4, PAD - 10)
      if (progress !== null) {
        dot(ctx, PAD + progress * (width - PAD * 2), toY(ease(progress)), COLORS.cyan, 6)
      }
    }

    play.addEventListener('click', () => {
      const ease = gsap.parseEase(select.value)
      const state = { p: 0 }
      // Waktu berjalan linear; posisi kotak = ease(waktu). Itulah inti easing.
      gsap.to(state, {
        p: 1,
        duration: 1.4,
        ease: 'none',
        overwrite: true,
        onUpdate: () => {
          draw(state.p)
          block.style.left = `calc(${ease(state.p) * 100}% - ${ease(state.p) * 24}px)`
        },
      })
    })
    select.addEventListener('change', () => draw())

    const row = el('div', 'demo__row')
    row.append(select, play)
    root.append(c.canvas, row, track)
    draw()
  },

  /** Grafik fungsi-fungsi GLSL umum */
  glslfn(root) {
    const fract = (x) => x - Math.floor(x)
    const smoothstep = (a, b, x) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
      return t * t * (3 - 2 * t)
    }
    const FNS = {
      'step(0.5, x)': (x) => (x < 0.5 ? 0 : 1),
      'fract(x * 4.0)': (x) => fract(x * 4),
      'pow(fract(x * 4.0), 3.0)': (x) => Math.pow(fract(x * 4), 3),
      'smoothstep(0.2, 0.8, x)': (x) => smoothstep(0.2, 0.8, x),
      'sin(x * 6.2832) * 0.5 + 0.5': (x) => Math.sin(x * Math.PI * 2) * 0.5 + 0.5,
      'mix(0.2, 0.9, x)': (x) => 0.2 + (0.9 - 0.2) * x,
      'pow(1.0 - x, 2.0)  // fresnel': (x) => Math.pow(1 - x, 2),
    }
    const c = makeCanvas(360, 180)
    const select = el('select', 'demo__select')
    Object.keys(FNS).forEach((name) => select.append(new Option(name, name)))
    const info = el('p', 'demo__readout', 'Sumbu X = input 0..1, sumbu Y = output. Di shader, x sering berupa uv, tinggi, atau waktu.')

    function draw() {
      drawGrid(c)
      plot(c, FNS[select.value])
    }
    select.addEventListener('change', draw)
    root.append(c.canvas, select, info)
    draw()
  },

  /** Model cahaya Lambert: ambient + directional × max(dot(N, L), 0) */
  lambert(root) {
    const SIZE = 160
    const canvas = el('canvas', 'demo__canvas demo__canvas--square')
    canvas.width = canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    const image = ctx.createImageData(SIZE, SIZE)
    const info = el('p', 'demo__readout')
    const state = { angle: 40, ambient: 0.15 }
    const BASE = [255, 204, 51] // warna material #ffcc33

    function draw() {
      // Cahaya berputar mengelilingi bola pada bidang horizontal, sedikit dari atas.
      // angle 0 = dari arah kamera, 90 = dari kanan, 180 = dari belakang bola.
      const a = (state.angle * Math.PI) / 180
      let L = [Math.sin(a), 0.5, Math.cos(a)]
      const len = Math.hypot(...L)
      L = L.map((v) => v / len)

      const r = SIZE / 2 - 4
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = (y * SIZE + x) * 4
          const nx = (x - SIZE / 2) / r
          const ny = -(y - SIZE / 2) / r // Y layar ke bawah, Y 3D ke atas
          const d2 = nx * nx + ny * ny
          if (d2 > 1) {
            image.data[i + 3] = 0
            continue
          }
          // Normal bola yang dilihat dari depan: (x, y, sqrt(1 - x² - y²))
          const nz = Math.sqrt(1 - d2)
          const diffuse = Math.max(nx * L[0] + ny * L[1] + nz * L[2], 0)
          const light = Math.min(state.ambient + diffuse, 1)
          image.data[i] = BASE[0] * light
          image.data[i + 1] = BASE[1] * light
          image.data[i + 2] = BASE[2] * light
          image.data[i + 3] = 255
        }
      }
      ctx.putImageData(image, 0, 0)
      const center = Math.max(L[2], 0)
      info.innerHTML = `Arah cahaya L = (${L.map((v) => v.toFixed(2)).join(', ')}). Di titik tengah bola, N = (0, 0, 1) → dot(N, L) = <b>${center.toFixed(2)}</b> → terang = ${state.ambient.toFixed(2)} + ${center.toFixed(2)} = <b>${Math.min(state.ambient + center, 1).toFixed(2)}</b>`
    }

    root.append(
      canvas,
      makeSlider('Arah cahaya (°)', { min: -180, max: 180, step: 1, value: state.angle }, (v) => ((state.angle = v), draw())),
      makeSlider('Ambient', { min: 0, max: 0.6, step: 0.01, value: state.ambient }, (v) => ((state.ambient = v), draw())),
      info,
    )
    draw()
  },

  /** Fresnel pada bola dilihat dari depan */
  fresnel(root) {
    const SIZE = 140
    const canvas = el('canvas', 'demo__canvas demo__canvas--square')
    canvas.width = canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    const image = ctx.createImageData(SIZE, SIZE)
    const info = el('p', 'demo__readout')

    function draw(power) {
      const r = SIZE / 2 - 4
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = (y * SIZE + x) * 4
          const nx = (x - SIZE / 2) / r
          const ny = (y - SIZE / 2) / r
          const d2 = nx * nx + ny * ny
          if (d2 > 1) {
            image.data[i + 3] = 0
            continue
          }
          // Untuk bola yang dilihat dari depan: normal.z = sqrt(1 - x² - y²),
          // arah pandang = (0,0,1) -> dot(normal, view) = normal.z
          const facing = Math.sqrt(1 - d2)
          const f = Math.pow(1 - facing, power)
          image.data[i] = 0
          image.data[i + 1] = 229 * f
          image.data[i + 2] = 255 * f
          image.data[i + 3] = 255
        }
      }
      ctx.putImageData(image, 0, 0)
      info.innerHTML = `fresnel = pow(1.0 − dot(normal, viewDir), <b>${power}</b>). Tengah bola menghadap kamera (dot ≈ 1) → gelap; tepi (dot ≈ 0) → terang.`
    }

    root.append(canvas, makeSlider('Power', { min: 0.5, max: 6, step: 0.1, value: 2 }, draw), info)
    draw(2)
  },
}

export function mountDemo(name, root) {
  DEMOS[name]?.(root)
}
