import * as THREE from 'three'
import gsap from 'gsap'
import { createHologram } from '../experiment/world/hologram.js'

/**
 * Krekit: telur retak dengan dua mata menyala yang mengintip dari celah retakan, maskot sekaligus nama situs.
 * Namanya dari bunyi "krek" saat cangkang retak, dan dibaca juga sebagai "crack it" (berhasil memecahkan sesuatu).
 * Karakternya energik dan penasaran: menemani pengunjung sepanjang halaman tanpa mengganggu.
 * Dibangun dari geometri dasar Three.js + shader hologram milik eksperimen (aura).
 *
 * Hierarki (prinsip "satu properti, satu pengendali", Pelajaran 2):
 *   root        -> posisi & skala di layar (landing.js, dihitung dari "panggung" HTML)
 *   wobble      -> goyang seperti mainan weeble saat berhenti (pivot di dasar telur)
 *   hop         -> lompat + squash & stretch (pivot di dasar telur)
 *     shards    -> pecahan cangkang yang mengorbit (tidak ikut menggelinding)
 *     rollPivot -> rotasi menggelinding (pivot di pusat telur)
 *       turn    -> menoleh ke kursor
 *         jaw   -> tutup membuka-menutup saat bicara (seperti rahang)
 *           lid -> tutup (cangkang atas): terangkat saat senang, menyapa, melompat
 *         cangkang bawah, inti gelap, mata, aura
 */

const R = 0.72 // jari-jari telur
const H = 0.95 // setengah tinggi telur
// Pita celah tempat mata berada (relatif pusat telur). Bentuk tepi retaknya: crackEdge() di bawah.
const CRACK_LOW = 0.0
const CRACK_HIGH = 0.42
const TAU = Math.PI * 2

/** Bentuk telur: lebih lebar di bawah. t = 0 (dasar) .. PI (puncak) */
const eggRadius = (t) => Math.sin(t) * R * (1 + 0.12 * Math.cos(t))
const eggY = (t) => -Math.cos(t) * H
const tAtY = (y) => Math.acos(THREE.MathUtils.clamp(-y / H, -1, 1))
const radiusAtY = (y) => eggRadius(tAtY(y))

/**
 * Garis retak di sekeliling telur, sebagai fungsi sudut φ (0 = depan/wajah).
 * Bentuknya patahan tak beraturan: puncak dan lekukan dengan tinggi acak, diselingi patahan kecil,
 * dan lebih landai di depan agar mata tetap terlihat. Tutup memakai garis yang SAMA ditambah
 * celah tetap (CRACK_GAP), sehingga puncak cangkang bawah pas dengan lekukan tutup,
 * seperti tutup telur pecah yang diangkat lurus ke atas.
 */
const CRACK_BASE = -0.07
const CRACK_GAP = 0.41

function crackEdge(seed) {
  const rand = seededRandom(seed)
  const knots = []
  const COUNT = 15
  for (let i = 0; i < COUNT; i++) {
    const angle = ((i + (rand() - 0.5) * 0.6) / COUNT) * TAU
    const peak = i % 2 === 0
    knots.push({ angle, value: peak ? 0.55 + rand() * 0.45 : rand() * 0.3 })
    // Patahan kecil di antara puncak dan lekukan, agar sisinya tidak lurus seperti gigi gergaji
    const midAngle = ((i + 0.35 + rand() * 0.3) / COUNT) * TAU
    knots.push({ angle: midAngle, value: (peak ? 0.45 : 0.35) + (rand() - 0.5) * 0.3 })
  }
  knots.sort((a, b) => a.angle - b.angle)
  // Sambungkan ujung ke awal agar garis menutup penuh 360°
  const ring = [{ angle: knots.at(-1).angle - TAU, value: knots.at(-1).value }, ...knots, { angle: knots[0].angle + TAU, value: knots[0].value }]

  const shape = (phi) => {
    const p = ((phi % TAU) + TAU) % TAU
    for (let i = 1; i < ring.length; i++) {
      if (p <= ring[i].angle) {
        const a = ring[i - 1]
        const b = ring[i]
        return a.value + ((b.value - a.value) * (p - a.angle)) / (b.angle - a.angle)
      }
    }
    return ring[0].value
  }
  // Amplitudo: 0,15 di depan (tetap di bawah/atas mata), naik sampai 0,22 di samping dan belakang
  const amplitude = (phi) => {
    const fromFront = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi)))
    return 0.15 + 0.07 * THREE.MathUtils.smoothstep(fromFront, 0.35, 1.1)
  }
  return {
    y: (phi) => CRACK_BASE + amplitude(phi) * shape(phi),
    angles: knots.map((k) => ((k.angle % TAU) + TAU) % TAU),
  }
}

/**
 * Cangkang telur sebagai permukaan putar, dengan batas bawah/atas (parameter t) yang boleh
 * berbeda di setiap sudut. Dipakai untuk membuat tepi retak yang menyatu dengan cangkang.
 * Kolom ditambah tepat di titik patahan agar sudut retakan tetap tajam.
 */
function shellGeometry(tFrom, tTo, extraAngles, segments = 96, steps = 18) {
  const columns = [...new Set([...Array.from({ length: segments + 1 }, (_, i) => (i / segments) * TAU), ...extraAngles])].sort((a, b) => a - b)
  const positions = []
  const normals = []
  const uvs = []
  const indices = []
  columns.forEach((phi) => {
    const sin = Math.sin(phi)
    const cos = Math.cos(phi)
    const t0 = tFrom(phi)
    const t1 = tTo(phi)
    for (let j = 0; j <= steps; j++) {
      const t = t0 + ((t1 - t0) * j) / steps
      const r = Math.max(eggRadius(t), 1e-4)
      positions.push(sin * r, eggY(t), cos * r)
      // Normal dari turunan profil telur: (dy/dt, -dr/dt) tegak lurus garis profil
      const dr = R * (Math.cos(t) * (1 + 0.12 * Math.cos(t)) - 0.12 * Math.sin(t) ** 2)
      const dy = H * Math.sin(t)
      const len = Math.hypot(dr, dy) || 1
      normals.push((sin * dy) / len, -dr / len, (cos * dy) / len)
      uvs.push(phi / TAU, j / steps)
    }
  })
  const rows = steps + 1
  for (let i = 0; i < columns.length - 1; i++) {
    for (let j = 0; j < steps; j++) {
      const a = i * rows + j
      const b = a + rows
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

function toonGradient() {
  const data = new Uint8Array([95, 175, 255])
  const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

/** Angka acak dengan seed tetap: bentuk retakan Krekit selalu sama setiap halaman dimuat */
export function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Tekstur retakan rambut: garis bercabang yang merambat dari bibir cangkang.
 * Digambar sekali ke canvas lalu dipakai sebagai "map" (dikalikan dengan warna cangkang).
 * Pada LatheGeometry, u = keliling (u = 0 tepat di depan/wajah), v = sepanjang profil.
 * fromTop: true = retakan mulai dari tepi atas gambar (v = 1), false = dari tepi bawah.
 */
function crackTexture(seed, fromTop) {
  const W = 1024
  const HT = 256
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = HT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, HT)
  ctx.strokeStyle = '#3a2f45'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const rand = seededRandom(seed)
  const dir = fromTop ? 1 : -1

  // Satu cabang retakan: ruas-ruas pendek dengan belokan acak, makin jauh makin tipis
  function branch(x, y, angle, width, length) {
    while (length > 0 && width > 1.2) {
      const step = 10 + rand() * 16
      angle += (rand() - 0.5) * 1.1
      // Tetap condong menjauhi bibir cangkang agar tidak berbalik arah
      angle = THREE.MathUtils.clamp(angle, -1.25, 1.25)
      const nx = x + Math.sin(angle) * step
      const ny = y + Math.cos(angle) * step * dir
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(nx, ny)
      ctx.stroke()
      if (rand() < 0.22) branch(nx, ny, angle + (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.5), width * 0.6, length * 0.45)
      x = nx
      y = ny
      width *= 0.9
      length -= step
    }
  }

  // Area wajah (u dekat 0 / 1) dibiarkan bersih agar mata & pipi tetap terbaca
  const count = 9
  for (let i = 0; i < count; i++) {
    const x = W * (0.14 + (0.72 * (i + rand() * 0.8)) / count)
    branch(x, fromTop ? 0 : HT, (rand() - 0.5) * 0.8, 6 + rand() * 3, 80 + rand() * 120)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Bayangan bundar lembut (lebih murah dari shadow map) */
function blobShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

const OUTLINE = new THREE.MeshBasicMaterial({ color: '#0b0b10', side: THREE.BackSide })

/** Semua mesh Krekit beserta material aslinya. solid = bagian badan yang digambar sebagai wireframe */
function collectMeshes(root) {
  const list = []
  root.traverse((mesh) => {
    if (!mesh.isMesh) return
    const m = mesh.material
    const solid = m.type !== 'ShaderMaterial' && m.side !== THREE.BackSide && !m.transparent && m.toneMapped !== false
    list.push({ mesh, material: m, solid })
  })
  return list
}

export function createKrekit(scene, { reduceMotion = false, onSettle } = {}) {
  const gradientMap = toonGradient()
  const mat = {
    // Cangkang bawah & atas memakai tekstur retakan masing-masing (retakan merambat dari bibir)
    shellLower: new THREE.MeshToonMaterial({ color: '#fff3df', gradientMap, side: THREE.DoubleSide, map: crackTexture(7, true) }),
    shellUpper: new THREE.MeshToonMaterial({ color: '#fff3df', gradientMap, side: THREE.DoubleSide, map: crackTexture(19, false) }),
    // Bagian dalam gelap agar celah retakan terbaca jelas dan mata yang menyala menonjol
    core: new THREE.MeshBasicMaterial({ color: '#1a1426' }),
    eye: new THREE.MeshBasicMaterial({ color: '#7ff0ff' }),
    crack: new THREE.MeshBasicMaterial({ color: '#2a2433' }),
    shard: new THREE.MeshToonMaterial({ color: '#fff3df', gradientMap }),
    cheek: new THREE.MeshBasicMaterial({ color: '#ff8fc8', transparent: true, opacity: 0.45, depthWrite: false }),
  }

  // ---------- Hierarki ----------
  const root = new THREE.Group()
  const wobble = new THREE.Group()
  const hop = new THREE.Group()
  const rollPivot = new THREE.Group()
  const turn = new THREE.Group()
  root.add(wobble)
  wobble.add(hop)
  hop.add(rollPivot)
  rollPivot.position.y = H
  rollPivot.add(turn)
  scene.add(root)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 24),
    new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.01
  shadow.scale.set(1, 0.55, 1)
  root.add(shadow)

  // ---------- Cangkang bawah: tepi atasnya mengikuti garis retak ----------
  const edge = crackEdge(5)
  const lowerGeo = shellGeometry(() => 0, (phi) => tAtY(edge.y(phi)), edge.angles)
  const lower = new THREE.Mesh(lowerGeo, mat.shellLower)
  const lowerHull = new THREE.Mesh(lowerGeo, OUTLINE)
  lowerHull.scale.setScalar(1.035)
  turn.add(lower, lowerHull)

  // ---------- Tutup (cangkang atas), bisa terangkat saat senang ----------
  // jaw dan lid dipisah: gerakan bicara tidak bentrok dengan animasi senang/sapa/lompat pada lid
  const jaw = new THREE.Group()
  turn.add(jaw)
  const lid = new THREE.Group()
  jaw.add(lid)
  // Tepi bawah tutup = garis retak yang sama + celah tetap, jadi pas dengan cangkang bawah
  const upperGeo = shellGeometry((phi) => tAtY(edge.y(phi) + CRACK_GAP), () => Math.PI, edge.angles)
  const upper = new THREE.Mesh(upperGeo, mat.shellUpper)
  const upperHull = new THREE.Mesh(upperGeo, OUTLINE)
  upperHull.scale.setScalar(1.035)
  lid.add(upper, upperHull)

  // ---------- Inti gelap (terlihat lewat celah retakan) ----------
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.93, 32, 20), mat.core)
  core.scale.y = (H / R) * 0.93
  turn.add(core)

  // ---------- Mata menyala ----------
  // "eyeOrbit" berputar mengelilingi sumbu telur: menggeser mata saat melirik ke samping
  const EYE_Y = (CRACK_LOW + CRACK_HIGH) / 2
  const eyeOrbit = new THREE.Group()
  turn.add(eyeOrbit)
  const eyes = new THREE.Group()
  eyes.position.y = EYE_Y
  eyeOrbit.add(eyes)
  const eyeGeo = new THREE.CapsuleGeometry(0.065, 0.08, 4, 12)
  // Kilau putih kecil di kiri atas mata: membuat tatapan terasa hidup. Ikut menyipit bersama matanya.
  const glintGeo = new THREE.CircleGeometry(0.02, 12)
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })
  const eyeZ = R * 0.93 * Math.sqrt(1 - (EYE_Y / (H * 0.93)) ** 2)
  const eyeList = [-0.19, 0.19].map((x) => {
    const eye = new THREE.Group()
    eye.add(new THREE.Mesh(eyeGeo, mat.eye))
    const glint = new THREE.Mesh(glintGeo, glintMat)
    glint.position.set(-0.024, 0.05, 0.064)
    eye.add(glint)
    eye.position.set(x, 0, Math.sqrt(eyeZ ** 2 - x ** 2) + 0.01)
    eye.rotation.y = Math.asin(x / eyeZ)
    eyes.add(eye)
    return eye
  })
  const eyeScales = eyeList.map((e) => e.scale)

  // ---------- Pipi merona di cangkang (lebih terang saat senang) ----------
  const cheekGeo = new THREE.CircleGeometry(0.075, 20)
  ;[-0.36, 0.36].forEach((x) => {
    const y = -0.1
    const r = radiusAtY(y)
    const angle = Math.asin(x / r)
    const cheek = new THREE.Mesh(cheekGeo, mat.cheek)
    cheek.position.set(Math.sin(angle) * (r + 0.006), y, Math.cos(angle) * (r + 0.006))
    cheek.rotation.y = angle
    cheek.scale.y = 0.65
    turn.add(cheek)
  })

  // ---------- Retakan tambahan (bertambah sesuai tahap belajar pengunjung) ----------
  const cracks = []
  const crackSeg = new THREE.BoxGeometry(0.11, 0.016, 0.02)
  const CRACK_SPOTS = [
    // Semua di atas 0,6: tepi bawah tutup bisa naik sampai ±0,56 di sisi samping
    [1.4, 0.62], [-1.5, 0.7], [2.3, 0.66], [-2.4, 0.63], [3.0, 0.68],
    [-0.95, 0.75], [1.95, 0.8], [0.6, 0.8], [-0.6, 0.85], [2.8, 0.64],
  ]
  CRACK_SPOTS.forEach(([angle, y]) => {
    const r = radiusAtY(y) + 0.006
    const crack = new THREE.Group()
    crack.position.set(Math.sin(angle) * r, y, Math.cos(angle) * r)
    crack.lookAt(crack.position.x * 2, y, crack.position.z * 2)
    // Dua ruas membentuk huruf "V" kecil = retakan
    ;[-1, 1].forEach((side) => {
      const seg = new THREE.Mesh(crackSeg, mat.crack)
      seg.position.x = side * 0.045
      seg.rotation.z = side * 0.6
      crack.add(seg)
    })
    crack.visible = false
    lid.add(crack)
    cracks.push(crack)
  })

  // ---------- Aura hologram (shader yang sama dengan eksperimen 3D) ----------
  const aura = createHologram(turn)
  aura.mesh.scale.set(0.72, 0.88, 0.72)
  aura.uniforms.uWaveAmp.value = 0.03
  aura.uniforms.uWaveFreq.value = 6
  aura.uniforms.uOpacity.value = 0.1

  // ---------- Pecahan cangkang mengorbit (InstancedMesh: satu draw call) ----------
  const SHARDS = 7
  const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.075), mat.shard, SHARDS)
  shards.position.y = H
  hop.add(shards)
  const shardData = Array.from({ length: SHARDS }, (_, i) => ({
    angle: (i / SHARDS) * TAU,
    radius: 1.05 + (i % 3) * 0.12,
    height: -0.3 + (i % 4) * 0.25,
    speed: 0.25 + (i % 3) * 0.08,
    spin: 0.6 + i * 0.15,
  }))
  const dummy = new THREE.Object3D()
  function placeShards(elapsed) {
    shardData.forEach((s, i) => {
      const a = s.angle + elapsed * s.speed
      dummy.position.set(Math.cos(a) * s.radius, s.height + Math.sin(elapsed * 1.3 + i) * 0.06, Math.sin(a) * s.radius * 0.6)
      dummy.rotation.set(elapsed * s.spin, elapsed * s.spin * 0.7, 0)
      dummy.scale.set(1, 0.4, 1) // pipih seperti keping cangkang
      dummy.updateMatrix()
      shards.setMatrixAt(i, dummy.matrix)
    })
    shards.instanceMatrix.needsUpdate = true
  }
  placeShards(0)

  // ---------- Tanda ekspresi di atas kepala ----------
  // Sprite dari kanvas 2D: selalu menghadap kamera, murah (tanpa geometri teks)
  function glyphTexture(draw) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    draw(canvas.getContext('2d'))
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }
  const glyphMaterial = (map) => new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, toneMapped: false })
  const question = new THREE.Sprite(
    glyphMaterial(
      glyphTexture((g) => {
        g.font = 'bold 54px ui-monospace, Consolas, monospace'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.lineWidth = 8
        g.strokeStyle = '#07070b'
        g.strokeText('?', 32, 34)
        g.fillStyle = '#d9fbff'
        g.fillText('?', 32, 34)
      }),
    ),
  )
  question.position.set(0.62, H * 2 + 0.2, 0)
  question.scale.setScalar(0)
  question.renderOrder = 10
  hop.add(question)

  const starTexture = glyphTexture((g) => {
    g.beginPath()
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? 9 : 28
      const a = (i / 8) * TAU - Math.PI / 2
      g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r)
    }
    g.closePath()
    // Tepi gelap agar tetap terlihat di atas aura yang terang
    g.lineWidth = 6
    g.strokeStyle = '#07070b'
    g.stroke()
    g.fillStyle = '#fff3b0'
    g.fill()
  })
  const stars = new THREE.Group()
  stars.position.y = H * 2 + 0.05
  stars.visible = false
  for (let i = 0; i < 3; i++) {
    const star = new THREE.Sprite(glyphMaterial(starTexture))
    const a = (i / 3) * TAU
    star.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55)
    star.scale.setScalar(0.34)
    star.renderOrder = 10
    stars.add(star)
  }
  hop.add(stars)

  // ---------- Melirik ----------
  const look = { duration: 0.6, ease: 'power3.out' }
  const turnY = gsap.quickTo(turn.rotation, 'y', look)
  const eyesX = gsap.quickTo(eyes.position, 'x', look)
  const eyesY = gsap.quickTo(eyes.position, 'y', look)
  function lookAt(x, y) {
    turnY(x * 0.55)
    eyesX(x * 0.035)
    eyesY(EYE_Y + y * 0.025)
  }

  // ---------- Mata: kedip, menyipit senang, melirik, penasaran, kaget, bicara ----------
  let eyesClosed = false
  let happy = false
  // Ekspresi sekali jalan (lompat, penasaran) sedang berlangsung: kedip & ekspresi lain menunggu
  let expressing = false
  const setEyeOpen = (amount, duration = 0.12) => gsap.to(eyeScales, { y: amount, duration, overwrite: 'auto' })
  const canExpress = () => !eyesClosed && !happy && !expressing

  function scheduleBlink() {
    gsap.delayedCall(2 + Math.random() * 3, () => {
      if (canExpress()) {
        // Sesekali kedip dua kali, seperti orang yang baru sadar sesuatu
        const twice = Math.random() < 0.25
        gsap.to(eyeScales, { y: 0.1, duration: 0.07, yoyo: true, repeat: twice ? 3 : 1, repeatDelay: twice ? 0.06 : 0 })
      }
      scheduleBlink()
    })
  }

  /** Penasaran: satu mata membesar, yang lain menyipit, kepala sedikit miring */
  function scheduleCurious() {
    gsap.delayedCall(11 + Math.random() * 9, () => {
      if (canExpress()) {
        expressing = true
        const side = Math.random() < 0.5 ? 0 : 1
        const [big, small] = side ? [eyeScales[1], eyeScales[0]] : [eyeScales[0], eyeScales[1]]
        gsap
          .timeline({ onComplete: () => (expressing = false) })
          .to(big, { x: 1.2, y: 1.25, duration: 0.25, ease: 'back.out(3)' })
          .to(small, { y: 0.55, duration: 0.25 }, '<')
          .to(turn.rotation, { z: side ? -0.1 : 0.1, duration: 0.35, ease: 'power2.out' }, '<')
          .to([big, small], { x: 1, y: 1, duration: 0.35, ease: 'power2.inOut' }, '+=0.9')
          .to(turn.rotation, { z: 0, duration: 0.45, ease: 'back.out(2)' }, '<')
      }
      scheduleCurious()
    })
  }

  /** Sesekali melirik ke samping lalu kembali, seperti sedang melihat-lihat */
  function scheduleGlance() {
    gsap.delayedCall(7 + Math.random() * 5, () => {
      if (!eyesClosed && !happy) {
        const side = Math.random() < 0.5 ? -1 : 1
        gsap
          .timeline()
          .to(eyeOrbit.rotation, { y: side * 0.45, duration: 0.25, ease: 'power2.out' })
          .to(eyeOrbit.rotation, { y: -side * 0.3, duration: 0.3, ease: 'power2.inOut' }, '+=0.5')
          .to(eyeOrbit.rotation, { y: 0, duration: 0.3, ease: 'back.out(2)' }, '+=0.35')
      }
      scheduleGlance()
    })
  }
  if (!reduceMotion) {
    scheduleBlink()
    scheduleGlance()
    scheduleCurious()
  }

  /**
   * Bicara selama teks gelembung diketik, tanpa mulut: tutup (cangkang atas) membuka-menutup
   * seperti rahang dengan ritme tidak seragam (seperti suku kata), cangkang bawah ikut memampat
   * sedikit setiap kali tutup terbuka, dan mata berdenyut pelan.
   */
  let talkTimeline
  function talk(seconds) {
    if (reduceMotion || seconds <= 0) return
    talkTimeline?.kill()
    talkTimeline = gsap.timeline({
      onComplete: () => {
        gsap.to(jaw.position, { y: 0, duration: 0.15 })
        gsap.to(turn.scale, { x: 1, y: 1, z: 1, duration: 0.15 })
      },
    })
    let t = 0
    while (t < seconds) {
      const open = 0.35 + Math.random() * 0.65
      const beat = 0.09 + Math.random() * 0.08
      talkTimeline
        .to(jaw.position, { y: 0.075 * open, duration: beat, ease: 'power1.out' }, t)
        .to(jaw.rotation, { x: -0.1 * open, duration: beat, ease: 'power1.out' }, t)
        .to(turn.scale, { x: 1 + 0.025 * open, y: 1 - 0.035 * open, z: 1 + 0.025 * open, duration: beat, ease: 'power1.out' }, t)
        .to(jaw.position, { y: 0, duration: beat, ease: 'power1.in' }, t + beat)
        .to(turn.scale, { x: 1, y: 1, z: 1, duration: beat, ease: 'power1.in' }, t + beat)
        .to(jaw.rotation, { x: 0, duration: beat, ease: 'power1.in' }, t + beat)
      // Sesekali jeda singkat, seperti antar kata
      t += beat * 2 + (Math.random() < 0.2 ? 0.12 : 0.02)
    }
    talkTimeline.fromTo(eyes.scale, { x: 1, y: 1 }, { x: 1.05, y: 1.08, duration: 0.2, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.round(seconds / 0.4)) * 2 - 1 }, 0)
  }

  // ---------- Ekspresi: tersenyum, bingung, pusing ----------
  const canMood = () => !reduceMotion && !eyesClosed && !expressing

  /** Tersenyum: mata menyipit senang, pipi merona, lompatan kecil */
  function smile() {
    if (!canMood() || happy) return
    expressing = true
    setHappy(true)
    gsap
      .timeline({ onComplete: () => (expressing = false) })
      .to(hop.position, { y: 0.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 })
      .call(() => setHappy(false), null, 1.8)
  }

  /** Bingung: kepala miring kiri-kanan, mata tidak simetris, tanda tanya muncul */
  function confused() {
    if (!canMood()) return
    expressing = true
    gsap
      .timeline({ onComplete: () => (expressing = false) })
      .to(question.scale, { x: 0.55, y: 0.55, duration: 0.35, ease: 'back.out(3)' })
      .to(eyeScales[0], { x: 1.15, y: 1.2, duration: 0.25 }, '<')
      .to(eyeScales[1], { y: 0.55, duration: 0.25 }, '<')
      .to(turn.rotation, { z: 0.14, duration: 0.4, ease: 'sine.inOut' }, '<')
      .to(turn.rotation, { z: -0.12, duration: 0.6, ease: 'sine.inOut' })
      .to(eyeScales[0], { y: 0.55, x: 1, duration: 0.3 }, '<')
      .to(eyeScales[1], { x: 1.15, y: 1.2, duration: 0.3 }, '<')
      .to(turn.rotation, { z: 0.08, duration: 0.6, ease: 'sine.inOut' })
      .to(question.scale, { x: 0, y: 0, duration: 0.25, ease: 'back.in(2)' }, '+=0.3')
      .to(eyeScales, { x: 1, y: 1, duration: 0.3 }, '<')
      .to(turn.rotation, { z: 0, duration: 0.4, ease: 'back.out(2)' }, '<')
  }

  /** Pusing: mata berputar, badan oleng, bintang kecil mengorbit kepala */
  function dizzy() {
    if (!canMood()) return
    expressing = true
    stars.visible = true
    gsap
      .timeline({
        onComplete: () => {
          expressing = false
          stars.visible = false
          eyes.rotation.z = 0
        },
      })
      .fromTo(stars.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'back.out(2)' })
      .to(stars.rotation, { y: TAU * 3, duration: 2.4, ease: 'none' }, 0)
      .to(eyes.rotation, { z: -TAU * 2, duration: 1.8, ease: 'power1.inOut' }, 0)
      .to(eyeScales, { y: 0.7, duration: 0.2 }, 0)
      .to(wobble.rotation, { z: 0.12, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 0)
      .to(stars.scale, { x: 0, y: 0, z: 0, duration: 0.25 }, 2.2)
      .to(eyeScales, { y: 1, duration: 0.3, ease: 'back.out(2)' }, 2.1)
      .set(wobble.rotation, { z: 0 })
  }

  /** Sesekali, tanpa pemicu: kebanyakan tersenyum, kadang bingung, jarang pusing */
  function scheduleMood() {
    gsap.delayedCall(16 + Math.random() * 12, () => {
      const r = Math.random()
      if (r < 0.5) smile()
      else if (r < 0.82) confused()
      else dizzy()
      scheduleMood()
    })
  }
  if (!reduceMotion) scheduleMood()

  function setHappy(value) {
    if (happy === value || eyesClosed) return
    happy = value
    setEyeOpen(value ? 0.4 : 1, 0.2)
    gsap.to(mat.cheek, { opacity: value ? 0.85 : 0.45, duration: 0.25 })
    // Tutup terangkat sedikit seperti mengintip senang
    gsap.to(lid.position, { y: value ? 0.06 : 0, duration: 0.3, ease: 'back.out(2)' })
    gsap.to(lid.rotation, { x: value ? -0.12 : 0, duration: 0.3, ease: 'back.out(2)' })
  }

  // ---------- Menggelinding ----------
  // Menggelinding tanpa tergelincir: sudut putar = jarak tempuh / jari-jari
  const state = { roll: 0 }
  let rolling = false
  let stillTime = 0
  let distance = 0
  let settleTween

  function update(delta, elapsed, velocityX = 0) {
    aura.uniforms.uTime.value = elapsed
    if (reduceMotion) return

    placeShards(elapsed)
    // Bernapas
    rollPivot.scale.set(1 + Math.sin(elapsed * 2) * 0.012, 1 - Math.sin(elapsed * 2) * 0.012, 1)

    if (Math.abs(velocityX) > 0.25) {
      if (!rolling) {
        rolling = true
        distance = 0
        settleTween?.kill()
        eyesClosed = true
        setEyeOpen(0.08)
        gsap.to(lid.position, { y: 0, duration: 0.15 })
      }
      stillTime = 0
      state.roll -= (velocityX * delta) / R
      distance += Math.abs(velocityX * delta)
    } else if (rolling) {
      stillTime += delta
      if (stillTime > 0.12) {
        rolling = false
        // Berhenti tegak: bulatkan ke putaran penuh terdekat, lalu goyang seperti weeble
        const upright = Math.round(state.roll / TAU) * TAU
        const direction = Math.sign(upright - state.roll) || 1
        settleTween = gsap.to(state, { roll: upright, duration: 0.5, ease: 'back.out(2.5)' })
        gsap.fromTo(wobble.rotation, { z: 0.18 * direction }, { z: 0, duration: 1.1, ease: 'elastic.out(1.2, 0.3)' })
        gsap.delayedCall(0.4, () => {
          eyesClosed = false
          setEyeOpen(happy ? 0.4 : 1, 0.2)
        })
        onSettle?.(distance)
      }
    }
    rollPivot.rotation.z = state.roll
  }

  // ---------- Lompat (klik) & sapaan ----------
  // Diketuk berkali-kali dalam waktu singkat: setelah mendarat, Krekit pusing
  let recentJumps = []
  /** tap = lompatan karena pengunjung mengetuk Krekit; hanya ini yang dihitung untuk efek pusing */
  function jump({ tap = false } = {}) {
    if (reduceMotion) return
    // Ketukan dihitung walau Krekit masih di udara
    const now = performance.now()
    if (tap) recentJumps = recentJumps.filter((time) => now - time < 4000).concat(now)
    if (recentJumps.length >= 3) {
      recentJumps = []
      // Tunggu sampai mendarat dan ekspresi lompat selesai
      const tryDizzy = () => (canMood() ? dizzy() : gsap.delayedCall(0.3, tryDizzy))
      gsap.delayedCall(1.6, tryDizzy)
    }
    if (gsap.isTweening(hop.position)) return
    // Mata: melebar kaget saat melompat, terpejam erat saat mendarat, lalu memantul terbuka
    if (!eyesClosed) {
      expressing = true
      gsap
        .timeline({ onComplete: () => (expressing = false) })
        .to(eyeScales, { x: 1.15, y: 1.35, duration: 0.14, ease: 'power2.out', overwrite: 'auto' })
        .to(eyeScales, { x: 1.2, y: 0.08, duration: 0.1, ease: 'power2.in' }, 0.62)
        .to(eyeScales, { x: 1, y: happy ? 0.4 : 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' }, '+=0.12')
    }
    gsap
      .timeline()
      .to(hop.scale, { x: 1.18, y: 0.8, z: 1.18, duration: 0.12, ease: 'power2.out' })
      .to(hop.scale, { x: 0.9, y: 1.14, z: 0.9, duration: 0.14 })
      .to(hop.position, { y: 0.9, duration: 0.32, ease: 'power2.out' }, '<')
      .to(hop.rotation, { y: `+=${TAU}`, duration: 0.6, ease: 'power2.inOut' }, '<')
      .to(lid.position, { y: 0.14, duration: 0.2, yoyo: true, repeat: 1 }, '<')
      .to(hop.scale, { x: 1, y: 1, z: 1, duration: 0.2 }, '<0.1')
      .to(hop.position, { y: 0, duration: 0.28, ease: 'power2.in' }, '>-0.05')
      .to(hop.scale, { x: 1.2, y: 0.78, z: 1.2, duration: 0.08 })
      .to(hop.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
  }

  /** Sapaan: tutup diangkat dua kali seperti melambaikan "topi" */
  function greet() {
    if (reduceMotion) return
    gsap
      .timeline()
      .to(lid.position, { y: 0.12, duration: 0.18, ease: 'power2.out' })
      .to(lid.rotation, { z: 0.25, duration: 0.18 }, '<')
      .to(lid.rotation, { z: -0.2, duration: 0.2, yoyo: true, repeat: 2 })
      .to(lid.position, { y: 0, duration: 0.25, ease: 'back.out(2)' })
      .to(lid.rotation, { z: 0, duration: 0.25 }, '<')
  }

  function appear() {
    if (reduceMotion) return
    gsap.fromTo(hop.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)', delay: 0.3 })
    gsap.delayedCall(1.2, greet)
  }

  /** Warna mata & aura per section */
  function setColors(glow, auraColor) {
    const tween = (color, hex) => {
      const c = new THREE.Color(hex)
      gsap.to(color, { r: c.r, g: c.g, b: c.b, duration: 0.8 })
    }
    tween(mat.eye.color, glow)
    tween(aura.uniforms.uColorA.value, auraColor)
    tween(aura.uniforms.uColorB.value, auraColor)
  }

  /**
   * Tahap pertumbuhan 0..5 (dari rank pengunjung): retakan bertambah & aura makin terang.
   * Tahap 5 = cangkang edisi emas. (Menetas: direncanakan sebagai desain komunitas.)
   */
  function setStage(stage) {
    cracks.forEach((crack, i) => (crack.visible = i < stage * 2))
    aura.uniforms.uOpacity.value = 0.1 + stage * 0.06
    if (stage >= 5) {
      ;[mat.shellLower, mat.shellUpper, mat.shard].forEach((m) => m.color.set('#ffd76a'))
    }
  }

  /**
   * Wireframe: Krekit tampil sebagai garis-garis mesh saja, seperti model yang belum di-render (Pos 1, stasiun Engine).
   * Material asli disimpan lalu dikembalikan. Garis tepi, aura, bayangan, dan pipi disembunyikan selama wireframe.
   */
  const WIRE = new THREE.MeshBasicMaterial({ color: '#7ff0ff', wireframe: true, transparent: true, opacity: 0.75 })
  let wireframe = false
  let meshes
  function setWireframe(value) {
    if (value === wireframe) return
    wireframe = value
    meshes ??= collectMeshes(root)
    for (const { mesh, material, solid } of meshes) {
      if (value) {
        // Diingat agar yang memang tersembunyi (mis. retakan di atas tahap saat ini) tetap tersembunyi
        mesh.userData.shown = mesh.visible
        mesh.material = solid ? WIRE : material
        mesh.visible &&= solid
      } else {
        mesh.material = material
        mesh.visible = mesh.userData.shown
      }
    }
  }

  const topLocal = new THREE.Vector3(0, H * 2 + 0.25, 0)
  return {
    root,
    height: H * 2,
    hitMeshes: [lower, upper, core],
    isRolling: () => rolling,
    lookAt,
    setHappy,
    jump,
    talk,
    smile,
    confused,
    dizzy,
    greet,
    appear,
    setColors,
    setStage,
    setWireframe,
    update,
    topWorld: (target) => hop.localToWorld(target.copy(topLocal)),
  }
}
