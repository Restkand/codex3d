import * as THREE from 'three'
import { seededRandom } from './krekit.js'

/**
 * Pos 0 "Dunia belum di-render": level greybox di ruang hitam.
 * Objek yang belum dilewati Krekit hanya berupa wireframe; saat Krekit mendekat, objek terisi
 * abu-abu polos, lalu berwarna dengan pencahayaan toon dan garis tepi gelap.
 * Pengunjung melihat sendiri tahapan sebuah game "dibuat": blockout -> material -> cahaya.
 *
 * Ringan (lihat Kamus: GPU Instancing, Shader):
 *   5 InstancedMesh (ubin jalan, balok, prisma, pilar, koin) + 1 grid = ±6 draw call.
 *   Ketiga tahap render dikerjakan SATU shader dengan nilai `reveal` per objek (0..1),
 *   tanpa mesh terpisah untuk wireframe. Garis wireframe dari koordinat barycentric.
 *
 * Posisi dihitung dari layout halaman oleh landing.js, jadi kamera tetap diam. Dua tata letak:
 *   layout()         desktop: jalan dari spawn pad ke kiri, ter-render saat Krekit menggelinding (scroll)
 *   layoutDiorama()  HP/tablet tegak: diorama kecil di sekeliling Krekit, ter-render per tingkat
 *                    lewat setLevel() saat Krekit diketuk
 */

const PALETTE = ['#e8735a', '#f2b84b', '#5cc1a8', '#8b7ae6', '#6fb3e8', '#e88fb4']
const TILE_COLORS = ['#c9d3e8', '#b9c5dd', '#d4dcec']

/**
 * Siapkan geometri untuk garis wireframe di shader: tidak berindeks + atribut `bary`.
 * Hanya tepi bentuk yang sebenarnya yang digambar: sisi yang dipakai bersama dua segitiga
 * SEBIDANG (diagonal sisi persegi, jari-jari tutup silinder) dikecualikan, seperti wireframe di editor.
 */
function wireReady(source) {
  const geo = source.index ? source.toNonIndexed() : source
  const pos = geo.attributes.position
  const triCount = pos.count / 3
  const verts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const normals = []
  const key = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
  const edges = new Map()
  for (let t = 0; t < triCount; t++) {
    verts.forEach((v, k) => v.fromBufferAttribute(pos, t * 3 + k))
    normals.push(new THREE.Triangle(...verts).getNormal(new THREE.Vector3()))
    const keys = verts.map(key)
    // Sisi di depan titik k menghubungkan dua titik lainnya
    for (let k = 0; k < 3; k++) {
      const pair = [keys[(k + 1) % 3], keys[(k + 2) % 3]].sort().join('|')
      if (!edges.has(pair)) edges.set(pair, [])
      edges.get(pair).push({ t, k })
    }
  }
  const inner = new Uint8Array(triCount * 3)
  for (const list of edges.values()) {
    if (list.length === 2 && normals[list[0].t].dot(normals[list[1].t]) > 0.999) {
      for (const { t, k } of list) inner[t * 3 + k] = 1
    }
  }
  const bary = new Float32Array(pos.count * 3)
  for (let t = 0; t < triCount; t++) {
    for (let v = 0; v < 3; v++) {
      // Komponen k = jarak ke sisi di depan titik k; +1 agar sisi dalam tidak pernah dianggap tepi
      for (let k = 0; k < 3; k++) bary[(t * 3 + v) * 3 + k] = (v === k ? 1 : 0) + inner[t * 3 + k]
    }
  }
  geo.setAttribute('bary', new THREE.BufferAttribute(bary, 3))
  return geo
}

const vertexShader = /* glsl */ `
  attribute vec3 bary;
  attribute float instReveal;
  attribute vec3 instColor;
  varying vec3 vBary;
  varying float vReveal;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vBary = bary;
    vReveal = instReveal;
    vColor = instColor;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uLightDir;
  uniform vec3 uGlowPos;
  uniform float uGlowRadius;
  uniform vec3 uGlowColor;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFade;
  varying vec3 vBary;
  varying float vReveal;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    // Garis tepi: jarak ke sisi segitiga terdekat (barycentric), dibuat setebal ±1,5 piksel
    float edge = min(min(vBary.x, vBary.y), vBary.z);
    float w = fwidth(edge);
    float line = 1.0 - smoothstep(w * 0.4, w * 1.6, edge);

    // Tahap render: 0 = wireframe, ±0,4 = abu-abu polos, 1 = berwarna
    float fill = smoothstep(0.2, 0.5, vReveal);
    float colored = smoothstep(0.55, 0.95, vReveal);

    // Cahaya toon tiga tingkat, seperti Krekit
    float d = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float toon = d > 0.55 ? 1.0 : (d > 0.2 ? 0.78 : 0.58);
    vec3 grey = vec3(0.34, 0.34, 0.4) * toon;
    vec3 base = mix(grey, vColor * toon, colored);

    // Cahaya retakan Krekit menerangi sekitarnya
    float glow = 1.0 - smoothstep(0.0, uGlowRadius, distance(vWorld, uGlowPos));
    base += uGlowColor * glow * 0.3;

    // Garis: cyan saat wireframe, berubah jadi garis tepi gelap saat sudah berwarna
    vec3 wire = vec3(0.42, 0.86, 1.0) * (0.55 + glow * 0.8);
    vec3 lineColor = mix(wire, vec3(0.05, 0.05, 0.08), colored);
    vec3 color = mix(base, lineColor, line);

    // Wireframe yang belum dilewati dibuat redup agar tidak bersaing dengan teks hero
    float alpha = max(fill, line * mix(0.28, 1.0, glow));
    if (alpha < 0.02) discard;
    color = mix(color, uFogColor, smoothstep(uFogNear, uFogFar, vDepth));
    gl_FragColor = vec4(color, alpha * uFade);
    // Warna dihitung di ruang linear; ubah ke ruang warna layar (sRGB) agar sesuai hex aslinya
    #include <colorspace_fragment>
  }
`

export function createDunia(scene) {
  const group = new THREE.Group()
  scene.add(group)

  const uniforms = {
    uLightDir: { value: new THREE.Vector3(0.5, 1, 0.7) },
    uGlowPos: { value: new THREE.Vector3() },
    uGlowRadius: { value: 1.6 },
    uGlowColor: { value: new THREE.Color('#7ff0ff') },
    uFogColor: { value: new THREE.Color('#07070b') },
    uFogNear: { value: 8 },
    uFogFar: { value: 18 },
    uFade: { value: 1 },
  }
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true })

  // ---------- Grid lantai ala viewport editor ----------
  const grid = new THREE.GridHelper(40, 80, '#2a2a38', '#1a1a24')
  grid.material.transparent = true
  group.add(grid)

  // ---------- Jenis objek: satu InstancedMesh per bentuk ----------
  const kinds = {
    tile: { geo: new THREE.BoxGeometry(1, 0.12, 1), items: [] },
    block: { geo: new THREE.BoxGeometry(1, 1, 1), items: [] },
    prism: { geo: new THREE.CylinderGeometry(0.6, 0.6, 1, 3), items: [] },
    pillar: { geo: new THREE.CylinderGeometry(0.5, 0.5, 1, 8), items: [] },
    coin: { geo: new THREE.OctahedronGeometry(0.5), items: [] },
  }
  const meshes = []
  // Sedikit tapi tertata: level kecil, bukan tumpukan balok
  const MAX = { tile: 22, block: 12, prism: 4, pillar: 7, coin: 6 }
  for (const [name, kind] of Object.entries(kinds)) {
    const geo = wireReady(kind.geo)
    const count = MAX[name]
    geo.setAttribute('instReveal', new THREE.InstancedBufferAttribute(new Float32Array(count), 1))
    geo.setAttribute('instColor', new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3))
    kind.mesh = new THREE.InstancedMesh(geo, material, count)
    kind.mesh.frustumCulled = false
    group.add(kind.mesh)
    meshes.push(kind.mesh)
  }

  // ---------- Tata letak dari posisi layar ----------
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3())
  const tmp = new THREE.Vector3()
  const side = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const color = new THREE.Color()
  let unit = 1
  let groundY = 0
  // Mode tingkat (diorama): null = mode jalan. Objek berubah bergelombang dari pijakan Krekit keluar
  let level = null
  let levelClock = 0

  /** Tambah satu objek. t = posisi terdekat di jalan (menentukan kapan ia ter-render) */
  function add(name, t, x, y, z, sx, sy, sz, rotY, rotZ, hex, motion = {}) {
    kinds[name].items.push({ t, pos: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(sx, sy, sz), rotY, rotZ, hex, reveal: 0, ...motion })
  }

  /**
   * Titik di samping jalan, jarak dalam unit Krekit. Sebagian besar di sisi JAUH (menjauhi kamera),
   * agar latar depan kosong dan Krekit tidak pernah tertutup objek.
   */
  function besidePath(t, distance, rand, out) {
    curve.getPoint(t, out)
    curve.getTangent(t, side).cross(up).normalize()
    if (side.z > 0) side.negate()
    const near = rand() < 0.2
    return out.addScaledVector(side, (near ? -1.4 : 1) * distance * unit)
  }

  /** Kosongkan objek lalu tambahkan spawn pad di bawah Krekit (sudah ter-render sejak awal) */
  function begin(start, scale) {
    unit = scale
    groundY = start.y
    for (const kind of Object.values(kinds)) kind.items.length = 0
    add('pillar', -1, start.x, groundY + 0.04 * scale, start.z, 1.3 * scale, 0.08 * scale, 1.3 * scale, 0, 0, '#5cc1a8')
  }

  /** Grid, warna instance, dan matriks setelah semua objek ditambahkan */
  function finish(center, scale, eyeY) {
    grid.position.set(center.x, groundY - 0.002 * scale, center.z)
    // Jika lantai di atas ketinggian mata kamera, grid terlihat dari bawah sebagai deretan garis:
    // sembunyikan, objek greybox tetap tampil
    grid.visible = groundY < eyeY - 0.15
    grid.scale.setScalar(scale)
    uniforms.uGlowRadius.value = 1.7 * scale
    for (const kind of Object.values(kinds)) {
      kind.mesh.count = kind.items.length
      const cols = kind.mesh.geometry.attributes.instColor
      kind.items.forEach((item, i) => cols.setXYZ(i, ...color.set(item.hex).toArray()))
      cols.needsUpdate = true
    }
    writeMatrices(0)
  }

  /**
   * start = dasar Krekit di awal (dunia), end = ujung jalan, scale = ukuran 1 unit Krekit di dunia.
   * Jalan berbelok sedikit mendekati kamera agar Krekit terlihat datang.
   */
  function layout(start, end, scale, eyeY = 0) {
    level = null
    begin(start, scale)
    curve.v0.copy(start)
    curve.v2.copy(end).setY(groundY)
    curve.v1.set((start.x + end.x) / 2, groundY, Math.max(start.z, end.z) + 0.9 * scale)
    const rand = seededRandom(31)
    const pick = (list) => list[Math.floor(rand() * list.length)]
    const frontZ = curve.v1.z * 0.8

    // Ubin jalan: sedikit berjarak, sedikit berputar, tingginya tidak persis sama
    const TILES = MAX.tile
    for (let i = 0; i < TILES; i++) {
      const t = 0.06 + (i / (TILES - 1)) * 0.94
      curve.getPoint(t, tmp)
      const size = (0.48 + rand() * 0.14) * scale
      add('tile', t, tmp.x, groundY + (0.02 + rand() * 0.03) * scale, tmp.z, size, scale, size, (rand() - 0.5) * 0.5, 0, pick(TILE_COLORS))
    }

    // Balok greybox: platform rendah, sebagian ditumpuk seperti anak tangga, sebagian melayang pelan
    for (let i = 0; kinds.block.items.length < MAX.block - 1; i++) {
      const t = (i + 0.3 + rand() * 0.4) / 7
      if (t > 1) break
      besidePath(t, 1.0 + rand() * 1.2, rand, tmp)
      tmp.z = Math.min(tmp.z, frontZ)
      const w = (0.28 + rand() * 0.3) * scale
      const h = (0.14 + rand() * 0.4) * scale
      const rot = (rand() - 0.5) * 0.9
      const floating = rand() < 0.3
      const lift = floating ? (0.35 + rand() * 0.4) * scale : 0
      add('block', t, tmp.x, groundY + h / 2 + lift, tmp.z, w, h, w * (0.8 + rand() * 0.5), rot, (rand() - 0.5) * 0.1, pick(PALETTE), floating ? { bob: 0.07 * scale, phase: rand() * 6 } : {})
      if (!floating && rand() < 0.45 && kinds.block.items.length < MAX.block - 1) {
        const w2 = w * (0.5 + rand() * 0.25)
        const h2 = h * (0.5 + rand() * 0.4)
        add('block', t, tmp.x + (rand() - 0.5) * 0.15 * scale, groundY + h + h2 / 2, tmp.z, w2, h2, w2, rot + (rand() - 0.5) * 0.5, 0, pick(PALETTE))
      }
    }

    // Ramp dan pilar: sedikit, sebagai aksen
    for (let i = 0; i < MAX.prism; i++) {
      const t = (i + 0.5 + rand() * 0.3) / MAX.prism
      besidePath(t, 0.9 + rand() * 0.8, rand, tmp)
      tmp.z = Math.min(tmp.z, frontZ)
      const s = (0.22 + rand() * 0.18) * scale
      add('prism', t, tmp.x, groundY + s * 0.5, tmp.z, s, s, s, rand() * 6, Math.PI / 2, pick(PALETTE))
    }
    for (let i = 0; i < MAX.pillar; i++) {
      const t = (i + 0.2 + rand() * 0.6) / MAX.pillar
      besidePath(t, 1.6 + rand() * 1.4, rand, tmp)
      tmp.z = Math.min(tmp.z, frontZ)
      const h = (0.35 + rand() * 0.7) * scale
      const r = (0.1 + rand() * 0.08) * scale
      add('pillar', t, tmp.x, groundY + h / 2, tmp.z, r * 2, h, r * 2, rand() * 6, 0, pick(PALETTE))
    }

    // Koin pickup melayang di atas jalan: berputar, jadi emas saat ter-render
    for (let i = 0; i < MAX.coin; i++) {
      const t = 0.15 + (i / (MAX.coin - 1)) * 0.8
      curve.getPoint(t, tmp)
      const s = 0.22 * scale
      add('coin', t, tmp.x, groundY + 1.25 * scale, tmp.z, s * 0.6, s, s * 0.6, 0, 0, '#ffd34d', { bob: 0.06 * scale, phase: i * 0.9, spin: 1.6 })
    }

    finish(tmp.set((start.x + end.x) / 2, 0, start.z), scale, eyeY)
  }

  /**
   * Diorama untuk layar sempit: pelataran ubin di sekitar spawn pad, bangunan greybox setengah
   * lingkaran DI BELAKANG Krekit (tidak pernah menutupinya), koin melayang di atasnya.
   * center = dasar Krekit, scale = 1 unit Krekit, halfWidth = setengah lebar layar (unit dunia)
   * agar diorama tidak terpotong tepi layar. t objek = jarak dari pusat (0..1), dipakai untuk gelombang.
   */
  function layoutDiorama(center, scale, halfWidth, eyeY = 0) {
    begin(center, scale)
    const rand = seededRandom(17)
    const pick = (list) => list[Math.floor(rand() * list.length)]
    // Lebar diorama 2,9 unit ke tiap sisi; dipersempit jika layarnya lebih sempit
    const squeeze = Math.min(1, (halfWidth * 0.92) / (2.9 * scale))
    const at = (angle, radius, out) =>
      out.set(center.x + Math.cos(angle) * radius * squeeze * scale, groundY, center.z - Math.sin(angle) * radius * 0.75 * scale)
    // Sudut 0 = kanan, PI/2 = belakang, PI = kiri. Kedua ujung sedikit ke depan (-0,25 .. PI+0,25)
    const arc = (i, n) => -0.25 + ((i + 0.5) / n) * (Math.PI + 0.5)
    const tOf = (radius) => (radius - 1) / 1.9

    // Ubin: dua cincin pelataran
    for (let i = 0; i < MAX.tile; i++) {
      const ring = i % 2
      const radius = 1.05 + ring * 0.6 + rand() * 0.1
      at(arc(Math.floor(i / 2), MAX.tile / 2) + ring * 0.12, radius, tmp)
      const size = (0.46 + rand() * 0.12) * scale
      add('tile', tOf(radius), tmp.x, groundY + (0.02 + rand() * 0.03) * scale, tmp.z, size, scale, size, (rand() - 0.5) * 0.5, 0, pick(TILE_COLORS))
    }

    // Balok: bangunan di cincin luar, sebagian ditumpuk, sebagian melayang
    const BLOCKS = 7
    for (let i = 0; i < BLOCKS; i++) {
      const radius = 2.15 + rand() * 0.5
      at(arc(i, BLOCKS) + (rand() - 0.5) * 0.15, radius, tmp)
      const w = (0.3 + rand() * 0.28) * scale
      const h = (0.25 + rand() * 0.6) * scale
      const rot = (rand() - 0.5) * 0.9
      const floating = i % 3 === 1
      const lift = floating ? (0.3 + rand() * 0.3) * scale : 0
      add('block', tOf(radius), tmp.x, groundY + h / 2 + lift, tmp.z, w, h, w * (0.8 + rand() * 0.4), rot, 0, pick(PALETTE), floating ? { bob: 0.07 * scale, phase: rand() * 6 } : {})
      if (!floating && kinds.block.items.length < MAX.block) {
        const w2 = w * 0.6
        const h2 = h * 0.6
        add('block', tOf(radius), tmp.x, groundY + h + h2 / 2, tmp.z, w2, h2, w2, rot + 0.4, 0, pick(PALETTE))
      }
    }

    // Ramp di kedua sisi depan, pilar tinggi di paling belakang
    for (let i = 0; i < MAX.prism; i++) {
      const radius = 1.7 + rand() * 0.3
      at(i < 2 ? -0.15 + i * 0.35 : Math.PI + 0.15 - (i - 2) * 0.35, radius, tmp)
      const sz = (0.22 + rand() * 0.14) * scale
      add('prism', tOf(radius), tmp.x, groundY + sz * 0.5, tmp.z, sz, sz, sz, rand() * 6, Math.PI / 2, pick(PALETTE))
    }
    for (let i = 0; i < MAX.pillar - 1; i++) {
      at(0.35 + (i / (MAX.pillar - 2)) * (Math.PI - 0.7), 2.8, tmp)
      const h = (0.6 + rand() * 0.8) * scale
      const r = (0.1 + rand() * 0.07) * scale
      add('pillar', 1, tmp.x, groundY + h / 2, tmp.z, r * 2, h, r * 2, rand() * 6, 0, pick(PALETTE))
    }

    // Koin melengkung di atas pelataran
    for (let i = 0; i < MAX.coin; i++) {
      const u = i / (MAX.coin - 1)
      at(0.2 + u * (Math.PI - 0.4), 1.5, tmp)
      const sz = 0.2 * scale
      add('coin', 0.45, tmp.x, groundY + (1.05 + Math.sin(u * Math.PI) * 0.35) * scale, tmp.z, sz * 0.6, sz, sz * 0.6, 0, 0, '#ffd34d', { bob: 0.06 * scale, phase: i * 0.9, spin: 1.6 })
    }

    level = 0
    levelClock = 0
    finish(center, scale, eyeY)
    // Pelataran ubin sudah cukup sebagai lantai; grid selebar layar hanya jadi garis di belakang teks
    grid.visible = false
  }

  /**
   * Mode diorama: tingkat render seluruh dunia. 0 = wireframe, 1 = blockout abu-abu, 2 = berwarna.
   * Perubahan menjalar dari pijakan Krekit keluar (lihat update()).
   */
  const LEVEL_REVEAL = [0, 0.42, 1]
  function setLevel(value) {
    level = value
    levelClock = 0
  }

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const p = new THREE.Vector3()
  function writeMatrices(elapsed) {
    for (const kind of Object.values(kinds)) {
      kind.items.forEach((item, i) => {
        p.copy(item.pos)
        if (item.bob) p.y += Math.sin(elapsed * 1.4 + item.phase) * item.bob
        e.set(0, item.rotY + (item.spin ? elapsed * item.spin : 0), item.rotZ)
        m.compose(p, q.setFromEuler(e), item.scale)
        kind.mesh.setMatrixAt(i, m)
      })
      kind.mesh.instanceMatrix.needsUpdate = true
    }
  }

  /** Titik di jalan, t = 0 (spawn) .. 1 (ujung jalan) */
  const pathPoint = (t, out) => curve.getPoint(Math.min(Math.max(t, 0), 1), out)

  /** Titik untuk penanda: di tepi jalan sisi jauh (menjauhi kamera), sedikit di atas tanah */
  function labelPoint(t, out) {
    const u = Math.min(Math.max(t, 0), 1)
    curve.getPoint(u, out)
    curve.getTangent(u, side).cross(up).normalize()
    if (side.z > 0) side.negate()
    return out.addScaledVector(side, 1.0 * unit).setY(groundY + 0.35 * unit)
  }

  /** 0 = dunia tersembunyi, 1 = tampil penuh */
  /** Geser seluruh dunia secara vertikal (unit dunia), mis. agar ikut bergulir bersama hero */
  function setOffset(y) {
    group.position.y = y
  }

  function setFade(value) {
    group.visible = value > 0.001
    uniforms.uFade.value = value
    grid.material.opacity = value
  }

  /**
   * pathT = posisi Krekit di jalan; objek dalam jarak ±0,12 di depannya mulai ter-render.
   * Sekali ter-render tetap ter-render (dunia "jadi" di belakang Krekit).
   */
  function update(delta, elapsed, pathT, krekitPos, fogColor) {
    if (!group.visible) return
    uniforms.uGlowPos.value.copy(krekitPos)
    uniforms.uFogColor.value.copy(fogColor)
    const ease = 1 - Math.exp(-4 * delta)
    levelClock += delta
    for (const kind of Object.values(kinds)) {
      const attr = kind.mesh.geometry.attributes.instReveal
      kind.items.forEach((item, i) => {
        if (level !== null) {
          // Gelombang: objek yang lebih jauh dari Krekit berubah belakangan. Bisa naik maupun turun.
          if (item.t < 0) item.reveal = 1
          else if (levelClock >= item.t * 0.7) item.reveal += (LEVEL_REVEAL[level] - item.reveal) * ease
          attr.setX(i, item.reveal)
          return
        }
        const goal = item.t < 0 ? 1 : THREE.MathUtils.clamp((pathT - item.t + 0.14) / 0.14, 0, 1)
        item.reveal = Math.max(item.reveal, item.reveal + (goal - item.reveal) * ease)
        attr.setX(i, item.reveal)
      })
      attr.needsUpdate = true
    }
    writeMatrices(elapsed)
  }

  /** Kembalikan semua objek ke wireframe (dipakai saat pengunjung kembali ke awal) */
  function reset() {
    for (const kind of Object.values(kinds)) for (const item of kind.items) item.reveal = 0
  }

  return { layout, layoutDiorama, setLevel, setOffset, pathPoint, labelPoint, setFade, update, reset, spawnHeight: 0.08 }
}
