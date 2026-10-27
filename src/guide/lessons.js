/**
 * Jalur Belajar: pelajaran naratif bertahap.
 *
 * Format teks (berlaku di semua field teks):
 *   `kode`          -> kode inline
 *   **tebal**       -> penekanan
 *   [[id]]          -> link istilah Codex (membuka panel samping), label = nama istilah
 *   [[id|label]]    -> link istilah dengan label sendiri
 *
 * Jenis blok:
 *   h        : judul bagian (muncul di daftar isi)
 *   p        : paragraf
 *   mental   : kotak "Model mental" { title, text }
 *   list     : daftar poin { items }
 *   steps    : daftar bernomor { items }
 *   tip/warn : catatan { text }
 *   table    : tabel { head, rows }
 *   code     : bedah kode { file, start, code, notes: [{ lines, text }] }
 *              start = nomor baris pertama di file asli, agar bisa dicocokkan di editor
 *   demo     : demo interaktif { name, caption }
 *   html     : diagram (HTML/SVG tepercaya, ditulis di file ini)
 */

const budgetDiagram = `
<div class="dg-budget">
  <div class="dg-budget__row">
    <span class="dg-budget__label">Frame lancar</span>
    <div class="dg-budget__bar">
      <span class="seg seg--js" style="width:7.5%">JS</span>
      <span class="seg seg--cmd" style="width:5%">cmd</span>
      <span class="seg seg--gpu" style="width:30%">GPU</span>
      <span class="seg seg--idle" style="width:41%">sisa</span>
    </div>
    <span class="dg-budget__time">8,5 ms</span>
  </div>
  <div class="dg-budget__row">
    <span class="dg-budget__label">Frame terlambat</span>
    <div class="dg-budget__bar">
      <span class="seg seg--js" style="width:15%">JS</span>
      <span class="seg seg--cmd" style="width:10%">cmd</span>
      <span class="seg seg--gpu" style="width:65%">GPU</span>
    </div>
    <span class="dg-budget__time is-bad">18 ms</span>
  </div>
  <div class="dg-budget__scale"><span>0 ms</span><span>16,7 ms</span></div>
  <p class="dg-budget__legend"><b>JS</b> = update di render loop · <b>cmd</b> = <code>renderer.render()</code> menyiapkan perintah · <b>GPU</b> = menggambar</p>
</div>`

const setupLoopDiagram = `
<div class="dg-two">
  <div class="dg-box">
    <p class="dg-box__title">Sekali di awal</p>
    <ol>
      <li>Buat <b>Scene</b></li>
      <li>Buat <b>Camera</b></li>
      <li>Buat <b>Renderer</b> + sambungkan ke &lt;canvas&gt;</li>
      <li>Buat objek &amp; cahaya, <code>scene.add(...)</code></li>
      <li>Pasang resize handler &amp; event</li>
    </ol>
  </div>
  <div class="dg-arrow" aria-hidden="true">→</div>
  <div class="dg-box dg-box--loop">
    <p class="dg-box__title">Setiap frame (loop)</p>
    <ol>
      <li>Hitung waktu (delta)</li>
      <li>Ubah properti objek (update)</li>
      <li><code>renderer.render(scene, camera)</code></li>
      <li>Jadwalkan frame berikutnya</li>
    </ol>
    <span class="dg-box__repeat">↻ 60× per detik</span>
  </div>
</div>`

const axesDiagram = `
<figure class="dg-axes">
  <svg viewBox="0 0 260 200" role="img" aria-label="Sumbu X ke kanan, Y ke atas, Z ke arah penonton">
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
      </marker>
    </defs>
    <line x1="110" y1="110" x2="220" y2="110" stroke="#ff5a5a" stroke-width="3" marker-end="url(#ah)" />
    <line x1="110" y1="110" x2="110" y2="20" stroke="#7cff6b" stroke-width="3" marker-end="url(#ah)" />
    <line x1="110" y1="110" x2="50" y2="170" stroke="#00b3ff" stroke-width="3" marker-end="url(#ah)" />
    <line x1="110" y1="110" x2="160" y2="60" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-dasharray="4 4" />
    <circle cx="110" cy="110" r="4" fill="#f2f2f5" />
    <text x="228" y="114" fill="#ff5a5a" font-size="14" font-weight="700">+X</text>
    <text x="102" y="14" fill="#7cff6b" font-size="14" font-weight="700">+Y</text>
    <text x="24" y="186" fill="#00b3ff" font-size="14" font-weight="700">+Z</text>
    <text x="164" y="56" fill="rgba(242,242,245,0.6)" font-size="11">−Z (arah tatap kamera)</text>
    <text x="118" y="128" fill="rgba(242,242,245,0.7)" font-size="11">(0, 0, 0)</text>
  </svg>
  <figcaption>+Z mengarah keluar layar, ke arah Anda. Kamera bawaan menatap ke −Z.</figcaption>
</figure>`

const treeDiagram = `
<div class="dg-tree">
  <div class="dg-node dg-node--root">Scene</div>
  <ul>
    <li><div class="dg-node">scrollGroup <small>← ScrollTrigger: posisi x, rotasi z</small></div>
      <ul>
        <li><div class="dg-node">introGroup <small>← intro: scale · GUI: posisi</small></div>
          <ul>
            <li><div class="dg-node">tiltGroup <small>← mouse: rotasi x/y</small></div>
              <ul>
                <li><div class="dg-node dg-node--mesh">mesh <small>← render loop: rotasi, posisi y · hover: scale</small></div>
                  <ul><li><div class="dg-node">hologram <small>(ikut semua induknya)</small></div></li></ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </li>
    <li><div class="dg-node dg-node--dim">floor, cahaya, kamera <small>(langsung di Scene)</small></div></li>
  </ul>
</div>`

const meshDiagram = `
<div class="dg-equation">
  <div class="dg-box"><p class="dg-box__title">Geometry</p><p>Di mana permukaan berada<br><small>titik, segitiga, normal, UV</small></p></div>
  <span class="dg-op">+</span>
  <div class="dg-box"><p class="dg-box__title">Material</p><p>Seperti apa permukaannya<br><small>warna, roughness, metalness</small></p></div>
  <span class="dg-op">=</span>
  <div class="dg-box dg-box--loop"><p class="dg-box__title">Mesh</p><p>Objek yang terlihat<br><small>bisa diberi posisi, rotasi, skala</small></p></div>
</div>`

const shadowDiagram = `
<div class="dg-two">
  <div class="dg-box">
    <p class="dg-box__title">Tahap 1 · dari sudut pandang cahaya</p>
    <p>Scene dirender <b>hanya kedalamannya</b>: seberapa jauh permukaan terdekat dari cahaya di setiap titik. Hasilnya disimpan sebagai tekstur: <b>shadow map</b>.</p>
  </div>
  <div class="dg-arrow" aria-hidden="true">→</div>
  <div class="dg-box dg-box--loop">
    <p class="dg-box__title">Tahap 2 · render biasa dari kamera</p>
    <p>Untuk setiap piksel lantai: "jarak saya ke cahaya" dibandingkan dengan isi shadow map. Jika ada permukaan lain yang <b>lebih dekat</b> ke cahaya → piksel ini <b>di dalam bayangan</b>.</p>
  </div>
</div>`

export const LESSONS = [
  {
    id: 'frame',
    num: 1,
    title: 'Bagaimana Sebuah Frame Lahir',
    subtitle: 'Scene, kamera, renderer, dan render loop: kerangka yang sama di setiap aplikasi 3D.',
    minutes: 20,
    goals: [
      'Menjelaskan peran Scene, Camera, dan Renderer dengan bahasa sendiri.',
      'Memahami pembagian kerja CPU dan GPU dalam satu frame.',
      'Mengerti kenapa ada batas 16,7 ms dan apa akibatnya jika terlewati.',
      'Membaca dan menjelaskan render loop proyek ini baris demi baris.',
      'Memahami kenapa gerakan harus dikali delta time, dan kenapa resize perlu ditangani.',
    ],
    terms: ['webgl', 'threejs', 'gpu-cpu', 'scene', 'camera', 'renderer', 'frame', 'raf', 'delta-time', 'aspect', 'pixel-ratio', 'frustum', 'fog'],
    blocks: [
      { type: 'h', text: 'Gambaran besar' },
      {
        type: 'mental',
        title: 'Studio foto yang memotret 60 kali per detik',
        text: 'Bayangkan sebuah studio. [[scene|Scene]] adalah panggungnya, berisi properti dan lampu. [[camera|Camera]] menentukan dari mana panggung itu difoto. [[renderer|Renderer]] adalah fotografer yang menekan tombol rana dan mencetak hasilnya ke `<canvas>`. Animasi muncul karena fotografer memotret **berulang kali**, dan sebelum setiap jepretan properti di panggung digeser sedikit.',
      },
      {
        type: 'p',
        text: 'Seluruh aplikasi Three.js, sesederhana atau serumit apa pun, mengikuti pola yang sama: **siapkan sekali**, lalu **ulangi terus**. Jika pola ini sudah dipahami, kode 3D mana pun akan lebih mudah dibaca, karena Anda tahu harus mencari bagian "persiapan" dan bagian "loop".',
      },
      { type: 'html', html: setupLoopDiagram },

      { type: 'h', text: 'Siapa mengerjakan apa: CPU dan GPU' },
      {
        type: 'p',
        text: 'Komputer punya dua prosesor yang bekerja sama ([[gpu-cpu]]). JavaScript Anda berjalan di **CPU**. CPU sebenarnya tidak menggambar piksel. Tugasnya menyiapkan data dan mengirim perintah ke GPU seperti "gambar mesh ini dengan material ini". Setiap perintah itu disebut [[draw-call|draw call]].',
      },
      {
        type: 'p',
        text: '**GPU** menerima perintah itu lalu menjalankan pipa grafis. Setiap titik diposisikan oleh [[vertex-shader]], segitiga diubah menjadi kumpulan piksel ([[pipeline-raster|rasterisasi]]), setiap piksel diwarnai oleh [[fragment-shader]], lalu [[depth-buffer]] memastikan objek yang dekat menutupi objek yang jauh.',
      },
      {
        type: 'steps',
        items: [
          '**CPU · update:** JavaScript mengubah angka-angka, misalnya rotasi, posisi, warna.',
          '**CPU · `renderer.render()`:** Three.js menghitung matriks setiap objek, membuang objek di luar pandangan kamera, mengurutkan objek, lalu mengirim draw call.',
          '**GPU · menggambar:** shader dijalankan untuk ribuan titik dan jutaan piksel secara paralel.',
          '**Browser · menampilkan:** gambar jadi ditampilkan saat layar melakukan refresh berikutnya.',
        ],
      },
      {
        type: 'tip',
        text: 'Anda tidak perlu menulis shader untuk membuat scene biasa. Setiap material Three.js, seperti `MeshStandardMaterial`, sudah berisi shader buatan Three.js. Pelajaran shader nanti hanya "membuka kap mesin" itu.',
      },

      { type: 'h', text: 'Bedah kode: persiapan di setup.js' },
      { type: 'p', text: 'Seluruh persiapan proyek ini ada di satu fungsi. Buka `src/core/setup.js` di editor dan ikuti nomor barisnya.' },
      {
        type: 'code',
        file: 'src/core/setup.js',
        start: 13,
        code: `export function createSetup(canvas) {
  // Scene: "semesta" yang menampung semua objek, cahaya, dan kamera
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b0b10')
  // Fog membuat objek jauh memudar ke warna latar -> kesan kedalaman
  scene.fog = new THREE.Fog('#0b0b10', 8, 20)

  // PerspectiveCamera(fov, aspect, near, far)
  // - fov: sudut pandang vertikal dalam derajat
  // - aspect: rasio lebar/tinggi; jika salah, gambar akan gepeng/melar
  // - near/far: objek di luar rentang ini tidak digambar (clipping)
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0.6, 6)
  scene.add(camera)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  // Bayangan dinyalakan di renderer, lalu per-objek lewat castShadow/receiveShadow
  renderer.shadowMap.enabled = true
  // PCF = tepi bayangan dihaluskan (PCFSoftShadowMap sudah dihapus sejak Three r18x)
  renderer.shadowMap.type = THREE.PCFShadowMap
  // Tone mapping memetakan cahaya HDR ke rentang layar agar highlight tidak "pecah"
  renderer.toneMapping = THREE.ACESFilmicToneMapping`,
        notes: [
          { lines: '15–16', text: 'Scene dibuat dan diberi warna latar. Warna ini yang terlihat di area yang tidak tertutup objek apa pun.' },
          { lines: '18', text: '[[fog|Fog]] `(warna, near, far)`: objek mulai memudar pada jarak 8 unit dari kamera dan hilang total pada jarak 20. Warnanya sengaja sama dengan latar, sehingga ujung lantai "larut" ke latar.' },
          { lines: '24', text: 'Kamera: fov 45°, aspect diambil dari ukuran jendela, near 0,1, far 100. Jangan membuat rentang near–far terlalu ekstrem (mis. 0.0001 sampai 100000), karena presisi depth buffer akan terbagi ke rentang yang sangat lebar dan permukaan yang berdekatan bisa berkedip (z-fighting).' },
          { lines: '25', text: 'Kamera mundur 6 unit ke arah +Z (ke arah Anda) dan naik 0,6. Objek ada di titik 0,0,0, jadi kamera berada di depannya. Koordinat dibahas di Pelajaran 2.' },
          { lines: '26', text: 'Menambahkan kamera ke scene sebenarnya opsional. Ini baru diperlukan jika kamera punya anak (misalnya lampu yang menempel di kamera).' },
          { lines: '28', text: 'Renderer memakai `<canvas>` yang sudah ada di index.html, bukan membuat kanvas baru. `antialias` menghaluskan tepi bergerigi.' },
          { lines: '30–34', text: 'Pengaturan global: bayangan dan [[tone-mapping]]. Diatur sekali di sini dan berlaku untuk semua objek. Keduanya dibahas di Pelajaran 3.' },
        ],
      },

      { type: 'h', text: 'Anggaran 16,7 milidetik' },
      {
        type: 'p',
        text: 'Monitor 60 Hz menyegarkan gambarnya 60 kali per detik, berarti 1000 ÷ 60 ≈ **16,7 ms per frame**. Semua pekerjaan dalam satu frame harus selesai dalam anggaran itu: JavaScript, perintah render, dan kerja GPU. Di monitor 144 Hz anggarannya lebih ketat lagi: ±6,9 ms.',
      },
      { type: 'html', html: budgetDiagram },
      {
        type: 'p',
        text: 'Jika satu frame butuh 18 ms, gambarnya belum siap saat layar refresh, sehingga layar menampilkan gambar lama sekali lagi. Jika itu terjadi terus-menerus, gambar baru hanya muncul setiap refresh **kedua**. Akibatnya FPS tidak turun ke 55, tetapi **langsung jatuh ke sekitar 30**. Angka "tepat 30" yang Anda lihat saat laptop memakai baterai berasal dari mekanisme yang sama: browser sengaja hanya mengambil separuh refresh layar untuk menghemat daya.',
      },
      {
        type: 'list',
        items: [
          '**Waktu CPU habis** karena JavaScript yang berat, atau terlalu banyak objek terpisah (setiap objek minimal satu draw call).',
          '**Waktu GPU habis** karena terlalu banyak piksel ([[pixel-ratio]] tinggi), shader yang berat, atau efek layar penuh (post-processing).',
          'Panel **Performance** di proyek ini membantu membedakan keduanya. Lihat entri [[cpu-gpu-bound]] dan [[perf-monitor]].',
        ],
      },

      { type: 'h', text: 'Render loop' },
      {
        type: 'p',
        text: 'Satu panggilan `renderer.render()` hanya menghasilkan **satu foto diam**. Untuk animasi, fungsi itu harus dipanggil terus, sekali di setiap refresh layar. Alatnya adalah [[raf|requestAnimationFrame]]: "browser, panggil fungsi ini tepat sebelum kamu menggambar frame berikutnya".',
      },
      {
        type: 'code',
        file: 'src/main.js',
        start: 66,
        code: `function tick(timestamp) {
  perf.begin()
  timer.update(timestamp)
  const delta = timer.getDelta()
  const elapsed = timer.getElapsed()

  const { mesh } = objects
  mesh.rotation.y += delta * params.rotationSpeed
  mesh.rotation.x += delta * params.rotationSpeed * 0.4
  // Sinus berosilasi -1..1 -> objek naik-turun seperti mengambang
  mesh.position.y = Math.sin(elapsed * 1.5) * params.floatAmplitude`,
        notes: [
          { lines: '66', text: 'Browser memanggil `tick` dengan `timestamp`, yaitu waktu (milidetik) saat frame ini dimulai.' },
          { lines: '67', text: 'Mulai mengukur waktu CPU frame ini untuk panel Performance.' },
          { lines: '68–70', text: '`THREE.Timer` mengubah timestamp menjadi dua angka berguna: **delta** (detik sejak frame sebelumnya) dan **elapsed** (detik sejak awal).' },
          { lines: '73–74', text: 'Rotasi bertambah sebesar *kecepatan × delta*. Kecepatannya dalam radian per **detik**, bukan per frame. Ini dibahas di bagian berikutnya.' },
          { lines: '76', text: 'Posisi Y ditentukan langsung dari waktu lewat fungsi sinus, sehingga objek naik-turun. Fungsi sinus dibahas di Pelajaran 2.' },
        ],
      },
      {
        type: 'code',
        file: 'src/main.js',
        start: 87,
        code: `  // Render bersyarat: post-processing hanya saat glitch aktif, selebihnya langsung ke layar.
  // Hasil keduanya sama-sama melalui tone mapping + sRGB, jadi warnanya konsisten.
  const usePost = post.isActive()
  if (usePost) post.composer.render(delta)
  else renderer.render(scene, camera)

  perf.end(usePost ? 'composer' : 'direct')
  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)`,
        notes: [
          { lines: '89–91', text: 'Inilah "jepretan" frame ini. Biasanya `renderer.render()` langsung ke layar. Jalur composer hanya dipakai selama efek glitch (dibahas di pelajaran post-processing).' },
          { lines: '94', text: '**Kunci loop:** di akhir frame, `tick` menjadwalkan dirinya sendiri untuk frame berikutnya.' },
          { lines: '97', text: 'Pemicu pertama. Tanpa baris ini, loop tidak pernah dimulai.' },
        ],
      },
      {
        type: 'table',
        head: ['', 'requestAnimationFrame', 'setInterval(fn, 16)'],
        rows: [
          ['Sinkron dengan refresh layar', 'Ya, dipanggil tepat sebelum layar digambar', 'Tidak, waktunya meleset sehingga gerakan patah-patah'],
          ['Saat tab tidak terlihat', 'Berhenti otomatis (hemat baterai)', 'Tetap berjalan'],
          ['Monitor 120/144 Hz', 'Otomatis mengikuti', 'Tetap ±60× per detik'],
        ],
      },

      { type: 'h', text: 'Delta time: kecepatan yang adil di semua monitor' },
      {
        type: 'p',
        text: 'Misalkan objek diputar dengan `rotation.y += 0.01` di setiap frame. Di monitor 60 Hz objek bertambah 0,6 radian per detik, tetapi di monitor 144 Hz bertambah 1,44 radian per detik: **2,4 kali lebih cepat**. Animasinya bergantung pada perangkat penonton.',
      },
      {
        type: 'p',
        text: 'Solusinya [[delta-time]]: kalikan kecepatan dengan lama frame. Frame di monitor 144 Hz lebih pendek, jadi tambahannya per frame lebih kecil, tetapi totalnya per detik sama. Rumus umumnya: `nilaiBaru = nilaiLama + kecepatanPerDetik × delta`.',
      },
      { type: 'demo', name: 'delta', caption: 'Geser refresh rate. Jarum magenta (per-frame) berubah-ubah, jarum cyan (delta) selalu sama.' },
      {
        type: 'tip',
        text: '**Kapan memakai elapsed, kapan delta?** Elapsed cocok untuk gerakan yang sepenuhnya ditentukan waktu, seperti osilasi sinus. Delta cocok untuk nilai yang *menumpuk* dan kecepatannya bisa berubah di tengah jalan. Coba bayangkan rotasi ditulis `rotation.y = elapsed × speed`, lalu speed diubah lewat GUI: objek akan *melompat* ke sudut baru, karena seluruh riwayat waktu dikalikan dengan speed yang baru.',
      },
      {
        type: 'warn',
        text: 'Saat tab disembunyikan, requestAnimationFrame berhenti. Ketika tab dibuka lagi, delta bisa bernilai puluhan detik dan objek seolah "teleport". `timer.connect(document)` (main.js baris 64) memakai Page Visibility API untuk mengabaikan jeda tersebut.',
      },

      { type: 'h', text: 'Resize dan pixel ratio' },
      {
        type: 'code',
        file: 'src/core/setup.js',
        start: 38,
        code: `  function resize() {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Kamera perlu tahu rasio baru, lalu matriks proyeksinya dihitung ulang
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  }

  resize()
  window.addEventListener('resize', resize)`,
        notes: [
          { lines: '43–44', text: 'Kamera menyimpan hasil hitungan proyeksinya (matriks proyeksi) dan **tidak** menghitung ulang otomatis karena jarang berubah. Setiap kali `aspect`, `fov`, `near`, atau `far` diubah, `updateProjectionMatrix()` wajib dipanggil.' },
          { lines: '46', text: 'Mengubah ukuran kanvas. Kanvas punya dua ukuran: **ukuran tampil** (CSS) dan **resolusi gambar** (jumlah piksel yang benar-benar dirender).' },
          { lines: '47', text: 'Resolusi gambar = ukuran tampil × [[pixel-ratio]]. Dibatasi 1,5 agar GPU tidak kewalahan di layar HiDPI.' },
          { lines: '50–51', text: 'Dipanggil sekali di awal, lalu setiap kali jendela berubah ukuran.' },
        ],
      },
      {
        type: 'p',
        text: 'Kenapa pixel ratio sangat berpengaruh? Karena jumlah piksel naik **kuadratik**. Pixel ratio 2 bukan 2× lebih berat, melainkan 4× (lebar 2× dan tinggi 2×). Setiap piksel tambahan berarti fragment shader dijalankan sekali lagi.',
      },
      { type: 'demo', name: 'pixelratio', caption: 'Geser pixel ratio dan perhatikan berapa kali lipat jumlah piksel yang harus digambar.' },
    ],
    mistakes: [
      {
        title: 'Objek tidak bergerak, padahal nilainya berubah',
        wrong: 'renderer.render(scene, camera) // dipanggil sekali\nsetInterval(() => mesh.rotation.y += 0.01, 16)',
        right: 'function tick() {\n  mesh.rotation.y += delta * speed\n  renderer.render(scene, camera)\n  requestAnimationFrame(tick)\n}',
        why: 'Mengubah angka tidak otomatis menggambar ulang. Gambar baru hanya ada jika `render()` dipanggil lagi.',
      },
      {
        title: 'Gambar gepeng setelah jendela diubah ukurannya',
        wrong: 'camera.aspect = innerWidth / innerHeight',
        right: 'camera.aspect = innerWidth / innerHeight\ncamera.updateProjectionMatrix()',
        why: 'Matriks proyeksi masih memakai rasio lama sampai dihitung ulang.',
      },
      {
        title: 'Animasi lebih cepat di monitor gaming',
        wrong: 'mesh.rotation.y += 0.01',
        right: 'mesh.rotation.y += delta * 0.6 // rad per detik',
        why: 'Penambahan per frame bergantung pada berapa banyak frame per detik.',
      },
      {
        title: 'Lancar di laptop, berat di HP',
        wrong: 'renderer.setPixelRatio(window.devicePixelRatio) // HP: 3',
        right: 'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))',
        why: 'Pixel ratio 3 berarti 9× jumlah piksel dibanding pixel ratio 1.',
      },
      {
        title: 'Objek dibuat tetapi tidak muncul (tanpa error)',
        wrong: 'const mesh = new THREE.Mesh(geometry, material)',
        right: 'const mesh = new THREE.Mesh(geometry, material)\nscene.add(mesh)',
        why: 'Renderer hanya menggambar yang ada di dalam scene. Three.js tidak memberi peringatan jika objek lupa ditambahkan.',
      },
    ],
    quiz: [
      {
        q: 'Apa yang terjadi jika baris 94 di main.js (`requestAnimationFrame(tick)` di dalam tick) dihapus?',
        options: ['Tidak ada yang tampil sama sekali', 'Satu frame tampil, lalu gambar membeku', 'Animasi menjadi lebih cepat', 'Muncul error di Console'],
        answer: 1,
        explain: 'Baris 97 tetap memanggil `tick` sekali, sehingga satu frame dirender. Tetapi tidak ada lagi yang menjadwalkan frame berikutnya. Tidak ada error karena kodenya valid.',
      },
      {
        q: 'Kecepatan rotasi 0,6 rad/detik dikalikan delta. Berapa radian objek berputar dalam 2 detik di monitor 144 Hz?',
        options: ['0,6', '1,2', '2,88', '172,8'],
        answer: 1,
        explain: 'Dengan delta, refresh rate tidak berpengaruh: 0,6 × 2 detik = 1,2 radian. Jawaban 2,88 adalah hasil jika memakai +0,01 per frame (144 × 2 × 0,01).',
      },
      {
        q: 'FPS di perangkat Anda tepat 30, sementara panel Performance menunjukkan CPU time hanya 1,5 ms. Apa kesimpulan paling masuk akal?',
        options: ['JavaScript proyek terlalu berat', 'Bukan JavaScript: GPU melewati anggaran, atau browser membatasi frame rate', 'Terlalu banyak event listener', 'Nilai far kamera terlalu besar'],
        answer: 1,
        explain: 'CPU hanya memakai 1,5 dari 16,7 ms, jadi JavaScript bukan penyebabnya. Penyebabnya ada di GPU, atau browser sengaja menahan frame rate (mode hemat daya).',
      },
      {
        q: 'Jendela diperlebar dua kali lipat, tetapi `updateProjectionMatrix()` tidak dipanggil. Apa yang terlihat?',
        options: ['Tidak ada perubahan sama sekali', 'Objek tampak melar ke samping', 'Scene menjadi hitam', 'FPS turun setengah'],
        answer: 1,
        explain: 'Kanvas melebar, tetapi kamera masih memproyeksikan dengan rasio lama, sehingga gambar diregangkan secara horizontal.',
      },
    ],
    exercises: [
      'Di setup.js baris 18, ubah fog menjadi `Fog(..., 4, 8)`. Apa yang terjadi dengan lantai dan objek? Kenapa?',
      'Tambahkan `console.log(1 / delta)` di dalam tick, lalu buka Console. Angka itu adalah FPS sesaat. Bandingkan dengan panel Performance. Hapus kembali setelahnya, karena console.log di setiap frame itu berat.',
      'Ubah `MAX_PIXEL_RATIO` menjadi 0.5. Perhatikan ketajaman gambar dan angka FPS, lalu kembalikan ke 1.5.',
    ],
  },

  {
    id: 'ruang',
    num: 2,
    title: 'Ruang, Posisi, dan Hierarki',
    subtitle: 'Koordinat 3D, transform, radian, hubungan induk-anak, dan matematika gerak.',
    minutes: 25,
    goals: [
      'Membayangkan arah X, Y, Z di Three.js tanpa melihat catatan.',
      'Memakai position, rotation (radian), dan scale dengan benar.',
      'Memahami hierarki induk-anak serta perbedaan local dan world space.',
      'Menjelaskan kenapa proyek ini memakai 4 lapis Group.',
      'Memakai sin, lerp, dan NDC untuk menggerakkan objek dan membaca mouse.',
    ],
    terms: ['coords', 'vector', 'transform', 'radian', 'hierarchy', 'local-world', 'sincos', 'lerp', 'ndc', 'layered-control', 'quickto', 'pointer-events', 'matrices'],
    blocks: [
      { type: 'h', text: 'Gambaran besar' },
      {
        type: 'mental',
        title: 'Alamat di dalam alamat',
        text: '"Meja nomor 4, di lantai 3, gedung B." Meja tidak perlu tahu letak gedung di peta kota, cukup tahu letaknya di lantainya. Jika gedung dipindahkan, meja ikut pindah tanpa alamatnya diubah. Posisi di dunia 3D bekerja persis seperti ini: setiap objek menyimpan posisinya **relatif terhadap induknya**.',
      },

      { type: 'h', text: 'Sistem koordinat' },
      { type: 'html', html: axesDiagram },
      {
        type: 'p',
        text: 'Three.js memakai [[coords|sistem tangan kanan]]: **X ke kanan, Y ke atas, Z ke arah Anda** (keluar dari layar). Kamera bawaan menatap ke arah −Z. Karena itu kamera proyek ini diletakkan di `z = 6`: ia mundur ke arah Anda agar objek di `z = 0` berada di depannya.',
      },
      {
        type: 'tip',
        text: 'Cara mengingat: angkat tangan kanan. Ibu jari ke kanan (X), telunjuk ke atas (Y), lalu jari tengah otomatis menunjuk ke arah Anda (Z).',
      },
      {
        type: 'p',
        text: 'Satuannya bebas, yang penting konsisten. Di proyek ini objek berjari-jari 1, lantai berukuran 30 × 30, dan kamera berjarak 6. Jika semua angka dikali 100, hasil di layar sama, tetapi nilai near/far, fog, dan bayangan juga harus ikut disesuaikan.',
      },

      { type: 'h', text: 'Transform: position, rotation, scale' },
      {
        type: 'p',
        text: 'Setiap objek punya tiga properti [[transform]]. Ketiganya disimpan sebagai tiga angka x, y, z ([[vector|Vector3]]).',
      },
      {
        type: 'table',
        head: ['Properti', 'Arti', 'Contoh', 'Catatan'],
        rows: [
          ['position', 'Di mana', '`mesh.position.set(1, 0, 0)`', 'Relatif terhadap induk'],
          ['rotation', 'Menghadap ke mana', '`mesh.rotation.y = Math.PI / 2`', 'Dalam **radian**, berputar mengelilingi sumbu'],
          ['scale', 'Seberapa besar', '`mesh.scale.setScalar(2)`', '1 = ukuran asli, 0 = tidak terlihat'],
        ],
      },
      {
        type: 'p',
        text: 'Urutan penerapannya selalu: **skala → rotasi → posisi**. Artinya objek membesar dan berputar di sekitar titik pusatnya sendiri, baru kemudian dipindahkan. Itu sebabnya mengubah rotasi tidak menggeser objek dari tempatnya.',
      },

      { type: 'h', text: 'Radian' },
      {
        type: 'p',
        text: 'Three.js dan `Math.sin/cos` memakai [[radian]], bukan derajat. Satu putaran penuh = 2π ≈ 6,283 radian.',
      },
      {
        type: 'table',
        head: ['Derajat', 'Radian', 'Di kode'],
        rows: [
          ['45°', 'π/4 ≈ 0,785', '`Math.PI / 4`'],
          ['90°', 'π/2 ≈ 1,571', '`Math.PI / 2`'],
          ['180°', 'π ≈ 3,142', '`Math.PI`'],
          ['360°', '2π ≈ 6,283', '`Math.PI * 2`'],
          ['28,6°', '0,5', '`maxTilt` di interaction.js'],
        ],
      },
      {
        type: 'p',
        text: 'Contoh di proyek: lantai direbahkan dengan `floor.rotation.x = -Math.PI / 2` (objects.js baris 46). Plane bawaan berdiri tegak menghadap +Z; diputar −90° di sumbu X membuatnya rebah menghadap ke atas. Untuk konversi, pakai `THREE.MathUtils.degToRad(90)`.',
      },

      { type: 'h', text: 'Hierarki: induk dan anak' },
      {
        type: 'p',
        text: 'Dengan `induk.add(anak)`, anak menjadi bagian dari induk ([[hierarchy]]). Semua transform induk otomatis diterapkan ke anak. Inilah struktur objek di proyek Anda:',
      },
      { type: 'html', html: treeDiagram },
      {
        type: 'code',
        file: 'src/world/objects.js',
        start: 14,
        code: `export function createObjects(scene) {
  const scrollGroup = new THREE.Group()
  const introGroup = new THREE.Group()
  const tiltGroup = new THREE.Group()
  scrollGroup.add(introGroup)
  introGroup.add(tiltGroup)
  scene.add(scrollGroup)`,
        notes: [
          { lines: '15–17', text: '`THREE.Group` adalah objek kosong yang tidak terlihat. Gunanya sebagai "engsel" untuk transform.' },
          { lines: '18–20', text: 'Group disusun bertingkat: scroll → intro → tilt. Mesh nanti ditambahkan ke tiltGroup (baris 39).' },
        ],
      },
      {
        type: 'p',
        text: '**Kenapa repot-repot memakai 4 lapis?** Bayangkan ScrollTrigger dan panel GUI sama-sama menulis ke `introGroup.position.x`. Setiap frame, siapa pun yang menulis terakhir akan menimpa yang lain, sehingga objek melompat-lompat dan bug-nya sulit dilacak. Dengan lapisan terpisah, setiap sistem punya propertinya sendiri, dan hierarki **menjumlahkan** efeknya secara alami. Prinsip ini disebut [[layered-control|satu properti, satu pengendali]].',
      },

      { type: 'h', text: 'Local space vs world space' },
      {
        type: 'p',
        text: '`mesh.position` adalah posisi **lokal**, yaitu relatif terhadap induk. Posisi akhir di semesta disebut **world** ([[local-world]]). Contoh perhitungannya:',
      },
      {
        type: 'steps',
        items: [
          'Induk di `x = 2`, anak di `position.x = 1` → anak berada di **world x = 3**.',
          'Induk diberi `scale = 2` → jarak anak ke induk ikut berlipat: anak di **world x = 2 + 1×2 = 4**.',
          'Induk (skala 1) diputar 90° di sumbu Y → "lantai koordinat" anak ikut berputar. Arah +X lokal anak kini menunjuk ke −Z dunia, sehingga anak berada di **world (2, 0, −1)**.',
        ],
      },
      {
        type: 'p',
        text: 'Untuk membaca posisi dunia di kode: `const p = new THREE.Vector3(); mesh.getWorldPosition(p)`. Di balik layar, Three.js menyimpan setiap transform sebagai [[matrices|matriks]] dan mengalikannya berantai dari Scene sampai ke objek.',
      },

      { type: 'h', text: 'Gerak dengan matematika: sinus' },
      {
        type: 'p',
        text: '[[sincos|`Math.sin(t)`]] menghasilkan angka yang berayun mulus antara −1 dan 1 seiring t bertambah. Dikalikan **amplitudo**, hasilnya menentukan seberapa jauh ayunannya. Mengalikan t dengan **frekuensi** menentukan seberapa cepat ayunannya.',
      },
      { type: 'p', text: 'Baris 76 main.js: `mesh.position.y = Math.sin(elapsed * 1.5) * params.floatAmplitude`. Amplitudonya 0,15 unit dan frekuensinya 1,5.' },
      { type: 'demo', name: 'sine', caption: 'Geser "Waktu" untuk melihat posisi y objek pada detik tertentu.' },
      {
        type: 'tip',
        text: 'Sinus dan kosinus dengan t yang sama menghasilkan **lingkaran**: `x = Math.cos(t) * r`, `z = Math.sin(t) * r`. Ini dasar dari orbit, kamera berputar, dan partikel melingkar.',
      },

      { type: 'h', text: 'Lerp dan smoothing' },
      {
        type: 'p',
        text: '[[lerp]] mencari nilai di antara A dan B: `A + (B − A) × t`. Dengan t = 0 hasilnya A, dengan t = 1 hasilnya B. Hampir semua animasi pada dasarnya adalah lerp dengan t yang bergerak dari 0 ke 1.',
      },
      { type: 'demo', name: 'lerp', caption: 'Geser t dari 0 ke 1.' },
      {
        type: 'p',
        text: 'Efek "mengejar dengan halus" (smoothing) adalah lerp yang dilakukan berulang setiap frame menuju target: `current += (target − current) × 0.1`. Setiap frame jaraknya berkurang 10%, jadi gerakannya cepat di awal lalu melambat. Di proyek ini, [[quickto|`gsap.quickTo`]] melakukan hal serupa dengan kurva easing yang lebih bagus.',
      },
      {
        type: 'warn',
        text: 'Smoothing dengan faktor tetap (`× 0.1` per frame) bergantung pada frame rate, masalah yang sama seperti di Pelajaran 1. Versi yang adil: `current += (target − current) × (1 − Math.exp(−kecepatan × delta))`.',
      },

      { type: 'h', text: 'Dari mouse ke dunia 3D: NDC' },
      {
        type: 'p',
        text: 'Event mouse memberi posisi dalam piksel (`clientX`, `clientY`), dengan (0,0) di **pojok kiri atas** dan Y bertambah ke **bawah**. Dunia 3D lebih mudah memakai [[ndc]]: rentang −1..1, (0,0) di **tengah**, dan Y bertambah ke **atas**. Dengan begitu logikanya sama di layar ukuran apa pun.',
      },
      {
        type: 'code',
        file: 'src/interaction.js',
        start: 26,
        code: `  function onMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -((event.clientY / window.innerHeight) * 2 - 1)

    // Kursor di kanan -> objek berputar pada sumbu Y ke arah kursor.
    // Kursor di atas -> objek menunduk ke belakang (rotasi X negatif).
    tiltY(x * maxTilt)
    tiltX(-y * maxTilt)

    camX(x * 0.4)
    camY(baseCamY + y * 0.25)
  }`,
        notes: [
          { lines: '27', text: 'Tiga langkah: `/ innerWidth` → 0..1, `× 2` → 0..2, `− 1` → −1..1.' },
          { lines: '28', text: 'Sama seperti baris 27, lalu dibalik dengan tanda minus karena arah Y di DOM berlawanan dengan 3D.' },
          { lines: '32–33', text: 'NDC (−1..1) dikali `maxTilt` (0,5 rad), jadi rotasi maksimal ±28,6°. Hasilnya dikirim ke quickTo, yang mengejar nilai itu dengan halus.' },
          { lines: '35–36', text: 'Kamera digeser sedikit ke arah yang sama (parallax). Karena kamera selalu `lookAt(0,0,0)`, objek tampak dilihat dari sudut yang sedikit berbeda.' },
        ],
      },
      { type: 'demo', name: 'ndc', caption: 'Gerakkan kursor di dalam kotak dan bandingkan angka piksel dengan NDC.' },
    ],
    mistakes: [
      {
        title: 'Objek berputar ke sudut yang aneh',
        wrong: 'mesh.rotation.y = 90',
        right: 'mesh.rotation.y = Math.PI / 2\n// atau THREE.MathUtils.degToRad(90)',
        why: '90 radian ≈ 5157°, yaitu 14 putaran lebih sedikit, sehingga hasil akhirnya tampak acak.',
      },
      {
        title: 'Mouse ke atas, objek malah ke bawah',
        wrong: 'const y = (clientY / innerHeight) * 2 - 1',
        right: 'const y = -((clientY / innerHeight) * 2 - 1)',
        why: 'Y di DOM bertambah ke bawah, sedangkan Y di 3D bertambah ke atas.',
      },
      {
        title: 'Posisi objek "salah" saat dibaca',
        wrong: 'console.log(mesh.position) // relatif ke induk',
        right: 'mesh.getWorldPosition(target) // posisi di semesta',
        why: 'Jika induknya bergeser (misalnya oleh scroll), `position` anak tidak ikut berubah.',
      },
      {
        title: 'Animasi bergetar atau melompat-lompat',
        wrong: '// render loop: mesh.rotation.y += ...\n// GSAP:        gsap.to(mesh.rotation, { y: 1 })',
        right: '// render loop -> mesh.rotation\n// GSAP        -> tiltGroup.rotation',
        why: 'Dua sistem menulis properti yang sama, sehingga saling menimpa setiap frame.',
      },
    ],
    quiz: [
      {
        q: 'Kamera di (0, 0.6, 6) menatap (0, 0, 0). Sebuah objek diletakkan di z = −3. Bagaimana objek itu terlihat?',
        options: ['Lebih dekat dan lebih besar', 'Lebih jauh dan lebih kecil', 'Di belakang kamera, jadi tidak terlihat', 'Sama saja'],
        answer: 1,
        explain: 'Kamera menatap ke −Z. Jarak objek ke kamera menjadi 9 (dari 6 ke −3), lebih jauh dari objek di z = 0, sehingga tampak lebih kecil.',
      },
      {
        q: '`rotation.y = Math.PI` berarti berputar berapa derajat?',
        options: ['90°', '180°', '360°', '3,14°'],
        answer: 1,
        explain: 'π radian = 180°, yaitu setengah putaran. Objek jadi menghadap ke belakang.',
      },
      {
        q: 'Induk di posisi (0, 1, 0) dengan scale 2. Anak di position (1, 0, 0). Di mana posisi world anak?',
        options: ['(1, 1, 0)', '(2, 1, 0)', '(1, 0, 0)', '(2, 2, 0)'],
        answer: 1,
        explain: 'Posisi lokal anak dikali skala induk menjadi (2, 0, 0), lalu ditambah posisi induk (0, 1, 0), hasilnya (2, 1, 0).',
      },
      {
        q: 'Kursor tepat di tengah layar. Berapa nilai NDC-nya?',
        options: ['(0.5, 0.5)', '(0, 0)', '(1, 1)', 'Tergantung ukuran layar'],
        answer: 1,
        explain: 'NDC berpusat di tengah layar: (0, 0) di tengah, ±1 di tepi, apa pun ukuran layarnya.',
      },
      {
        q: 'Kenapa tiltGroup dipisah dari mesh?',
        options: ['Agar lebih cepat dirender', 'Agar rotasi dari mouse (GSAP) dan rotasi dari render loop tidak saling menimpa', 'Karena Three.js mewajibkan Group', 'Agar bayangan muncul'],
        answer: 1,
        explain: 'Keduanya mengubah rotasi. Dengan lapisan berbeda, keduanya punya properti sendiri, dan hierarki menggabungkan efeknya.',
      },
    ],
    exercises: [
      'Di render loop (main.js), tambahkan `mesh.position.x = Math.cos(elapsed) * 0.5` dan `mesh.position.z = Math.sin(elapsed) * 0.5`. Objek akan bergerak melingkar. Kenapa properti x dan z aman diubah, sementara rotasi `tiltGroup` tidak?',
      'Ubah `maxTilt` di interaction.js menjadi `Math.PI / 2`. Seberapa jauh objek bisa miring sekarang?',
      'Tambahkan `const p = new THREE.Vector3()` di main.js, lalu `console.log(objects.mesh.getWorldPosition(p).x, objects.mesh.position.x)` di tick. Scroll ke section 2. Kenapa angkanya berbeda? (Hapus setelah dicoba.)',
    ],
  },

  {
    id: 'permukaan',
    num: 3,
    title: 'Bentuk, Permukaan, dan Cahaya',
    subtitle: 'Geometri, normal, material PBR, dua jenis cahaya, dan cara kerja bayangan.',
    minutes: 30,
    goals: [
      'Memahami bahwa semua bentuk 3D tersusun dari titik dan segitiga.',
      'Menjelaskan apa itu normal, dan kenapa cahaya membutuhkannya.',
      'Menghitung terang-gelap permukaan dengan dot product (model Lambert).',
      'Memahami roughness, metalness, dan perbedaan jenis material.',
      'Menjelaskan cara kerja shadow map dan empat syarat agar bayangan muncul.',
    ],
    terms: ['mesh', 'geometry', 'vertex', 'triangle', 'segments', 'normal', 'dot', 'flat-shading', 'material', 'pbr', 'roughness', 'metalness', 'emissive', 'ambient-light', 'directional-light', 'shadow-map', 'shadow-acne', 'tone-mapping', 'color-space'],
    blocks: [
      { type: 'h', text: 'Gambaran besar' },
      {
        type: 'mental',
        title: 'Patung kawat, cat, dan lampu studio',
        text: '**Geometri** adalah patung kawat: ia menentukan *di mana* permukaan berada. **Material** adalah catnya: apakah mengilap, doff, atau logam. **Cahaya** adalah lampu studio: ia menentukan *berapa banyak* terang yang sampai ke setiap bagian. Warna akhir sebuah piksel adalah hasil pertemuan ketiganya.',
      },
      { type: 'html', html: meshDiagram },

      { type: 'h', text: 'Geometri: titik dan segitiga' },
      {
        type: 'p',
        text: 'Geometri adalah daftar [[vertex|titik]] beserta aturan bagaimana titik-titik itu membentuk [[triangle|segitiga]]. Kenapa segitiga? Karena tiga titik **selalu** membentuk bidang datar, tidak mungkin terlipat. Ini membuat GPU bisa menggambarnya dengan sangat cepat dan pasti. Bola yang tampak mulus pun sebenarnya kumpulan segitiga datar yang sangat banyak.',
      },
      {
        type: 'p',
        text: 'Objek utama proyek memakai `IcosahedronGeometry(1, 1)`: jari-jari 1 dan detail 1. Icosahedron dasar punya 20 segitiga; detail 1 memecah setiap segitiga menjadi 4, jadi totalnya **80 segitiga**.',
      },
      {
        type: 'p',
        text: 'Ingat angka **triangles = 7.074** di panel Performance? Asalnya bisa dihitung: hologram kubus 6 sisi × 24 × 24 segmen × 2 segitiga = **6.912**, ditambah objek **80**, lantai **2**, ditambah objek digambar sekali lagi untuk bayangan **80**. Totalnya 7.074. Hologram ternyata menyumbang 98% segitiga, sehingga [[segments|jumlah segmen]] sangat berpengaruh.',
      },
      { type: 'tip', text: 'Aktifkan **wireframe** di panel debug (folder Material) untuk melihat segitiga objek utama.' },

      { type: 'h', text: 'Normal: ke mana permukaan menghadap' },
      {
        type: 'p',
        text: 'Setiap titik membawa [[normal]], yaitu panah sepanjang 1 yang tegak lurus permukaan dan menunjuk ke "luar". Normal tidak terlihat, tetapi tanpanya cahaya tidak bisa dihitung, karena renderer harus tahu apakah permukaan **menghadap** cahaya atau **membelakanginya**.',
      },
      {
        type: 'p',
        text: 'Perhitungan paling dasar disebut model Lambert: terang = `max(dot(N, L), 0)` × intensitas cahaya. N adalah normal, L adalah arah menuju cahaya. [[dot|Dot product]] dua panah sepanjang 1 menghasilkan: **1** jika searah (permukaan menghadap langsung ke cahaya, paling terang), **0** jika tegak lurus (cahaya hanya menyerempet), dan **negatif** jika membelakangi. `max(..., 0)` memotong nilai negatif menjadi gelap.',
      },
      { type: 'demo', name: 'lambert', caption: 'Putar arah cahaya dan atur ambient. Inilah inti perhitungan yang dilakukan GPU untuk setiap piksel.' },
      {
        type: 'p',
        text: 'Perhatikan demonya: tanpa ambient, sisi yang membelakangi cahaya **hitam total**. Ambient menambahkan terang yang sama ke semua sisi. Rumus gabungannya: `warna = warnaMaterial × (ambient + directional × max(dot(N, L), 0))`. MeshStandardMaterial melakukan versi yang jauh lebih lengkap, termasuk pantulan mengilap, tetapi intinya tetap ini.',
      },

      { type: 'h', text: 'Flat vs smooth shading' },
      {
        type: 'p',
        text: 'Pada [[flat-shading|flat shading]], setiap segitiga memakai satu normal, sehingga seluruh segitiga punya terang yang sama dan sisi-sisinya terlihat tegas (gaya low-poly, seperti objek proyek ini). Pada smooth shading, normal dihaluskan di antara segitiga yang bersebelahan, sehingga transisi terangnya mulus dan bentuknya tampak bulat walaupun segitiganya sama.',
      },

      { type: 'h', text: 'Material: tiga keluarga utama' },
      {
        type: 'table',
        head: ['Material', 'Bereaksi pada cahaya?', 'Biaya', 'Kapan dipakai'],
        rows: [
          ['MeshBasicMaterial', 'Tidak, warna rata', 'Paling murah', 'UI, objek bercahaya, debug'],
          ['MeshStandardMaterial', 'Ya, model fisika (PBR)', 'Sedang', 'Hampir semua objek realistis'],
          ['ShaderMaterial', 'Terserah Anda', 'Terserah shadernya', 'Efek khusus seperti hologram (pelajaran shader)'],
        ],
      },
      {
        type: 'p',
        text: '[[pbr|PBR]] (Physically Based Rendering) meniru cara cahaya bekerja di dunia nyata, sehingga satu material tampak meyakinkan di kondisi cahaya apa pun. Dua kenop utamanya:',
      },
      {
        type: 'list',
        items: [
          '[[roughness|Roughness]]: jika dilihat sangat dekat, permukaan kasar penuh dengan tonjolan mikroskopis yang menyebarkan pantulan ke banyak arah. Akibatnya highlight menjadi **lebar dan redup** (roughness 1). Permukaan licin memantulkan rapi, sehingga highlight **kecil dan tajam** (roughness 0).',
          '[[metalness|Metalness]]: logam tidak punya warna "dasar". Yang terlihat hanya **pantulan lingkungannya**. Di scene tanpa lingkungan untuk dipantulkan (tanpa HDRI), objek dengan metalness 1 tampak gelap kecuali di titik highlight.',
        ],
      },
      {
        type: 'code',
        file: 'src/world/objects.js',
        start: 22,
        code: `  // Icosahedron detail 1 memberi tampilan "low-poly" bersegi; naikkan detail -> makin bulat
  const geometry = new THREE.IcosahedronGeometry(1, 1)
  // MeshStandardMaterial = material PBR (Physically Based Rendering)
  // roughness 0 = mengilap seperti cermin, 1 = doff
  // metalness 0 = non-logam (plastik/kayu), 1 = logam
  const material = new THREE.MeshStandardMaterial({
    color: '#ffcc33',
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true,
    // Emissive = cahaya yang "dipancarkan" sendiri oleh permukaan, tidak bergantung lampu.
    // Intensitas 0 dulu; dinaikkan saat kursor hover (lihat hover.js)
    emissive: '#ff5a1f',
    emissiveIntensity: 0,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  tiltGroup.add(mesh)`,
        notes: [
          { lines: '23', text: 'Geometri dibuat sekali. Satu geometri boleh dipakai oleh banyak mesh sekaligus.' },
          { lines: '28–31', text: 'Warna kuning, cukup mengilap (0,35), sedikit logam (0,2), dan flat shading untuk gaya bersegi.' },
          { lines: '34–35', text: '[[emissive|Emissive]] adalah warna yang dipancarkan sendiri. Nilainya 0 dulu, lalu dinaikkan GSAP saat hover sehingga objek tampak "menyala".' },
          { lines: '37', text: 'Mesh = geometri + material. Satu baris ini yang membuat objek benar-benar ada.' },
          { lines: '38', text: 'Objek ini **memberi** bayangan. Lantai di baris 48 **menerima** bayangan.' },
        ],
      },

      { type: 'h', text: 'Dua lampu di proyek ini' },
      {
        type: 'code',
        file: 'src/world/lights.js',
        start: 10,
        code: `export function createLights(scene) {
  const ambient = new THREE.AmbientLight('#ffffff', 0.4)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight('#ffffff', 2.5)
  directional.position.set(3, 4, 2)
  directional.castShadow = true`,
        notes: [
          { lines: '11', text: '[[ambient-light|AmbientLight]] putih dengan intensitas 0,4. Ini "lantai minimum" terang agar sisi gelap tidak hitam total.' },
          { lines: '14', text: '[[directional-light|DirectionalLight]] dengan intensitas 2,5 menjadi sumber kontras utama.' },
          { lines: '15', text: 'Posisinya hanya menentukan **arah** sinar: dari (3, 4, 2) menuju target bawaan (0, 0, 0), yaitu dari kanan-atas-depan. Seperti matahari, jaraknya tidak memengaruhi terang. Posisi (30, 40, 20) menghasilkan terang yang sama.' },
          { lines: '16', text: 'Lampu ini mampu menghasilkan bayangan. Ini salah satu dari empat syarat (lihat bagian berikutnya).' },
        ],
      },

      { type: 'h', text: 'Bagaimana bayangan dibuat' },
      { type: 'p', text: 'GPU tidak "tahu" apa itu bayangan. [[shadow-map|Shadow map]] adalah trik dua tahap:' },
      { type: 'html', html: shadowDiagram },
      {
        type: 'p',
        text: 'Ada **empat syarat** dan semuanya wajib. Jika salah satu terlupa, bayangan tidak muncul dan tidak ada pesan error:',
      },
      {
        type: 'steps',
        items: [
          '`renderer.shadowMap.enabled = true` (setup.js baris 30)',
          '`light.castShadow = true` (lights.js baris 16)',
          '`mesh.castShadow = true` pada objek pemberi bayangan (objects.js baris 38)',
          '`floor.receiveShadow = true` pada permukaan penerima (objects.js baris 48)',
        ],
      },
      {
        type: 'code',
        file: 'src/world/lights.js',
        start: 18,
        code: `  // Shadow map = tekstur kedalaman yang dirender dari sudut pandang cahaya.
  // Makin besar makin tajam, tapi makin mahal untuk GPU.
  directional.shadow.mapSize.set(1024, 1024)
  // Kamera bayangan (ortografis) cukup mencakup area di sekitar objek
  const shadowCam = directional.shadow.camera
  shadowCam.near = 0.5
  shadowCam.far = 15
  shadowCam.left = shadowCam.bottom = -4
  shadowCam.right = shadowCam.top = 4
  // Normal bias mengurangi artefak garis-garis ("shadow acne") di permukaan
  directional.shadow.normalBias = 0.03`,
        notes: [
          { lines: '20', text: 'Resolusi shadow map 1024 × 1024. Makin besar, tepi bayangan makin tajam, tetapi memori dan waktu render naik.' },
          { lines: '22–26', text: 'Tahap 1 memakai "kamera" milik cahaya berbentuk kotak (ortografis) selebar 8 × 8 unit. Objek di luar kotak ini tidak menghasilkan bayangan. Jika kotaknya terlalu besar, 1024 piksel tersebar ke area luas dan bayangan jadi buram.' },
          { lines: '28', text: 'Keterbatasan presisi bisa membuat permukaan "membayangi dirinya sendiri" sehingga muncul garis-garis ([[shadow-acne|shadow acne]]). `normalBias` menggeser titik perbandingan sedikit ke luar.' },
        ],
      },
      {
        type: 'p',
        text: 'Biayanya: setiap objek pemberi bayangan digambar **dua kali** per frame. Itu sebabnya panel Performance menunjukkan 4 draw call untuk 3 objek yang terlihat.',
      },

      { type: 'h', text: 'Warna yang benar: tone mapping dan color space' },
      {
        type: 'p',
        text: 'Hasil perhitungan cahaya bisa melebihi 1,0, misalnya 2,5 × warna terang. Layar hanya bisa menampilkan 0..1. Tanpa penanganan, semua nilai di atas 1 dipotong menjadi putih datar. [[tone-mapping|Tone mapping]] (proyek ini memakai ACES Filmic) "melipat" rentang terang itu dengan halus, seperti mata atau kamera yang beradaptasi.',
      },
      {
        type: 'p',
        text: 'Selain itu, perhitungan cahaya dilakukan di ruang warna **linear** (akurat secara fisika), sedangkan warna hex yang Anda tulis dan warna yang ditampilkan layar berada di ruang **sRGB** ([[color-space]]). Three.js mengurus konversinya otomatis: hex → linear → hitung → sRGB.',
      },
    ],
    mistakes: [
      {
        title: 'Objek hitam total',
        wrong: 'new THREE.MeshStandardMaterial({ color: "red" })\n// ...tanpa cahaya di scene',
        right: 'scene.add(new THREE.AmbientLight("#fff", 0.4))\nscene.add(new THREE.DirectionalLight("#fff", 2))',
        why: 'Material PBR menghitung pantulan cahaya. Tanpa cahaya, tidak ada yang dipantulkan.',
      },
      {
        title: 'Bayangan tidak muncul',
        wrong: 'light.castShadow = true\nmesh.castShadow = true',
        right: 'renderer.shadowMap.enabled = true\nlight.castShadow = true\nmesh.castShadow = true\nfloor.receiveShadow = true',
        why: 'Keempat syarat wajib dipenuhi. Tidak ada error jika salah satu terlewat.',
      },
      {
        title: 'Bayangan terpotong lurus',
        wrong: 'shadowCam.left = shadowCam.bottom = -1\nshadowCam.right = shadowCam.top = 1',
        right: 'shadowCam.left = shadowCam.bottom = -4\nshadowCam.right = shadowCam.top = 4',
        why: 'Area kamera bayangan terlalu kecil, sehingga bagian objek di luar kotak tidak tercatat di shadow map.',
      },
      {
        title: 'Metalness 1 membuat objek gelap',
        wrong: 'material.metalness = 1 // tanpa environment',
        right: 'material.metalness = 1\nscene.environment = hdrTexture',
        why: 'Logam hanya memantulkan lingkungan. Jika tidak ada lingkungan, tidak ada yang bisa dipantulkan.',
      },
      {
        title: 'Mengubah flatShading tidak berefek',
        wrong: 'material.flatShading = true',
        right: 'material.flatShading = true\nmaterial.needsUpdate = true',
        why: 'Beberapa opsi mengubah kode shader, dan shader harus dikompilasi ulang (lihat debug.js).',
      },
    ],
    quiz: [
      {
        q: 'Untuk sebuah titik di permukaan, `dot(N, L) = 0`. Apa artinya?',
        options: ['Permukaan menghadap langsung ke cahaya', 'Cahaya hanya menyerempet: permukaan tegak lurus terhadap arah cahaya', 'Permukaan membelakangi cahaya', 'Normal belum dihitung'],
        answer: 1,
        explain: 'Dot = 0 berarti dua panah saling tegak lurus. Cahaya datang sejajar permukaan, sehingga tidak ada cahaya langsung yang diterima.',
      },
      {
        q: 'AmbientLight dihapus dari proyek. Apa yang terjadi pada sisi objek yang membelakangi DirectionalLight?',
        options: ['Tetap sama', 'Menjadi hitam total', 'Menjadi lebih terang', 'Bayangannya hilang'],
        answer: 1,
        explain: 'Sisi itu hanya mendapat cahaya dari ambient. Tanpa ambient, terangnya 0 (kecuali emissive).',
      },
      {
        q: 'Dari mana angka 7.074 triangles di panel Performance?',
        options: ['Hanya dari hologram', '6.912 hologram + 80 objek + 2 lantai + 80 objek di shadow pass', 'Jumlah piksel dibagi 100', 'Batas maksimum WebGL'],
        answer: 1,
        explain: 'Objek pemberi bayangan digambar dua kali: sekali untuk shadow map, sekali untuk gambar utama.',
      },
      {
        q: '`light.castShadow` dan `mesh.castShadow` sudah true, tetapi bayangan di lantai tidak muncul. Apa yang paling mungkin terlupa?',
        options: ['mesh.receiveShadow', 'floor.receiveShadow atau renderer.shadowMap.enabled', 'scene.fog', 'material.flatShading'],
        answer: 1,
        explain: 'Permukaan penerima harus `receiveShadow = true`, dan renderer harus mengaktifkan shadow map.',
      },
      {
        q: 'Kenapa semua bentuk 3D dipecah menjadi segitiga?',
        options: ['Karena segitiga lebih indah', 'Karena tiga titik selalu membentuk bidang datar, sehingga mudah dan cepat diproses GPU', 'Karena WebGL tidak mendukung angka desimal', 'Karena ukuran file lebih kecil'],
        answer: 1,
        explain: 'Empat titik atau lebih bisa tidak sebidang (terlipat). Segitiga selalu datar dan jelas, sehingga cocok untuk rasterisasi yang cepat.',
      },
    ],
    exercises: [
      'Di objects.js, ganti geometri menjadi `new THREE.SphereGeometry(1, 8, 6)`, lalu `(1, 64, 32)`. Bandingkan angka triangles di panel Performance dan tampilannya dengan flat shading.',
      'Ganti material objek menjadi `new THREE.MeshBasicMaterial({ color: "#ffcc33" })`. Apa yang hilang, dan kenapa? (Petunjuk: lihat tabel keluarga material.) Kembalikan setelahnya.',
      'Di lights.js, ubah batas kamera bayangan menjadi ±1, lalu scroll ke section 2 dan 3. Apa yang terjadi dengan bayangan saat objek bergeser?',
    ],
  },
]

/** Pelajaran berikutnya (belum tersedia), ditampilkan sebagai peta jalan */
export const UPCOMING = [
  { num: 4, title: 'Menulis Shader Pertama', subtitle: 'Vertex & fragment shader, uniform, varying, dan GLSL dari nol.' },
  { num: 5, title: 'Shader Lanjut: Morph & Hologram', subtitle: 'Membedah hologram proyek: morph, twist, gelombang, fresnel.' },
  { num: 6, title: 'Post-processing', subtitle: 'Render target, composer, efek glitch, dan biaya layar penuh.' },
  { num: 7, title: 'Animasi dengan GSAP', subtitle: 'Tween, easing, timeline, quickTo, dan ScrollTrigger.' },
  { num: 8, title: 'Interaksi & Performa', subtitle: 'Raycaster, pola state change, dan membaca bottleneck.' },
]

export const LESSON_XP = 50
