/**
 * Penjelasan lanjutan untuk entri Codex ("Pelajari lebih dalam").
 * Kunci = id entri di glossary.js. Setiap item array = satu paragraf.
 * Format teks sama dengan lessons.js: `kode`, **tebal**, [[id]] / [[id|label]].
 */
export const DEEP = {
  renderer: [
    'Apa yang sebenarnya terjadi saat `renderer.render(scene, camera)` dipanggil? Secara garis besar: (1) matriks dunia setiap objek dihitung ulang dari hierarkinya, (2) objek di luar pandangan kamera dibuang (frustum culling), (3) objek dikelompokkan: yang **opak** diurutkan dari dekat ke jauh agar piksel yang tertutup bisa dilewati, yang **transparan** dari jauh ke dekat agar pencampurannya benar, (4) jika ada lampu dengan bayangan, shadow map dirender lebih dulu, (5) untuk setiap objek, state WebGL disiapkan dan satu [[draw-call]] dikirim.',
    'Saat sebuah material dipakai **pertama kali**, shadernya harus dikompilasi. Proses ini bisa memakan puluhan milidetik, sehingga frame pertama atau saat objek baru muncul sering tersendat. `renderer.compile(scene, camera)` bisa dipanggil di awal untuk mengompilasi semuanya sebelum animasi dimulai.',
  ],
  raf: [
    'Callback requestAnimationFrame dijalankan sekali per refresh layar, **sebelum** browser menghitung style, layout, dan paint. Karena itu perubahan DOM dan render WebGL di dalamnya muncul di frame yang sama.',
    'Browser bebas menahan atau memperlambat rAF: berhenti total di tab yang tersembunyi, dibatasi di iframe yang tidak terlihat, dan sering dibatasi ke 30 FPS dalam mode hemat daya. Jangan pernah mengandalkan "rAF pasti dipanggil 60× per detik". Selalu gunakan waktu sebenarnya ([[delta-time]]).',
  ],
  'delta-time': [
    'Dua pola waktu yang perlu dibedakan. **Berbasis elapsed**: nilai = f(waktu total), misalnya `y = sin(elapsed)`. Hasilnya selalu sama untuk waktu yang sama, cocok untuk gerakan berulang. **Berbasis delta**: nilai += kecepatan × delta. Nilainya menumpuk, cocok untuk kecepatan yang bisa berubah atau dikendalikan input.',
    'Smoothing seperti `x += (target − x) × 0.1` per frame tidak adil antar frame rate. Versi yang tidak bergantung frame rate: `x += (target − x) × (1 − Math.exp(−k × delta))`, dengan k = seberapa cepat mengejar (misalnya 10).',
    'Praktik umum lainnya: batasi delta maksimum (misalnya `Math.min(delta, 0.1)`). Satu frame yang sangat lambat (karena shader dikompilasi, atau tab baru dibuka) tidak akan membuat objek melompat jauh.',
  ],
  camera: [
    '`fov` adalah sudut pandang **vertikal**. Sudut horizontal dihitung otomatis dari fov dan aspect. Akibatnya, jika jendela dilebarkan, Anda melihat lebih banyak ke samping, tetapi tinggi pandangan tetap.',
    '**Zoom vs dolly:** mengecilkan fov (zoom) memperbesar objek tanpa mengubah perspektif, sehingga bentuknya tampak lebih "datar" seperti lensa tele. Memindahkan kamera mendekat (dolly) mengubah perspektif, sehingga objek dekat membesar jauh lebih cepat daripada objek jauh. Intro proyek ini memakai dolly (`camera.position.z`).',
    'Alternatifnya adalah `OrthographicCamera`: tanpa perspektif, sehingga objek jauh dan dekat sama besar. Dipakai untuk game isometrik, diagram teknis, dan "kamera" cahaya bayangan di [[shadow-map]].',
  ],
  'pixel-ratio': [
    'Elemen `<canvas>` punya dua ukuran: atribut `width/height` (resolusi gambar, jumlah piksel yang dirender) dan ukuran CSS (seberapa besar ditampilkan). `renderer.setSize(w, h)` mengatur ukuran CSS = w × h dan resolusi = w × h × pixelRatio.',
    'Teknik lanjutan: **adaptive resolution**. Pantau FPS; jika turun di bawah target selama beberapa detik, turunkan pixel ratio sedikit demi sedikit. Jika stabil, naikkan lagi. Banyak situs dan game web memakai teknik ini agar tetap lancar di perangkat lemah.',
  ],
  hierarchy: [
    'Setiap objek punya dua matriks: `matrix` (transform lokal dari position/rotation/scale) dan `matrixWorld` (= matrixWorld induk × matrix sendiri). Renderer memanggil `scene.updateMatrixWorld()` di setiap render, yang menghitung berantai dari akar ke daun. Karena itu mengubah induk otomatis memengaruhi seluruh keturunannya.',
    '`induk.add(anak)` mempertahankan transform **lokal** anak, sehingga posisi anak di dunia bisa berubah karena kini relatif ke induk baru. `induk.attach(anak)` mempertahankan posisi **dunia** anak, dengan transform lokalnya dihitung ulang. Gunakan attach untuk efek seperti "mengambil" objek tanpa membuatnya melompat.',
  ],
  'local-world': [
    'Konversi titik: `obj.localToWorld(v)` dan `obj.worldToLocal(v)` mengubah koordinat dari satu ruang ke ruang lain, termasuk efek posisi, rotasi, dan skala semua induknya.',
    'Bedakan **posisi** dan **arah**. Posisi terpengaruh translasi, sedangkan arah (misalnya "depan" objek) hanya terpengaruh rotasi. Untuk arah dunia, gunakan `obj.getWorldDirection(v)`.',
  ],
  radian: [
    'Kenapa radian? Karena pada lingkaran berjari-jari r, panjang busur = r × sudut (dalam radian). Rumus turunan sin/cos, kecepatan sudut, dan hampir semua matematika rotasi menjadi sederhana dalam radian.',
    '`object.rotation` adalah **Euler**: tiga putaran berurutan (bawaan X lalu Y lalu Z). Euler mudah dibaca, tetapi punya masalah "gimbal lock", yaitu pada sudut tertentu dua sumbu berimpit sehingga satu derajat kebebasan hilang. Untuk rotasi bebas (kamera terbang, interpolasi antar orientasi), Three.js menyediakan `quaternion`, representasi 4 angka tanpa gimbal lock.',
  ],
  normal: [
    'Normal disimpan **per titik** sebagai attribute `normal`. Geometri bawaan Three.js sudah menyertakannya. Untuk geometri buatan sendiri, panggil `geometry.computeVertexNormals()`. Tanpa normal, MeshStandardMaterial tampak hitam atau aneh.',
    'Satu titik di sudut kubus sebenarnya disimpan **tiga kali** (satu untuk setiap sisi), masing-masing dengan normal berbeda. Itulah cara mendapatkan tepi tajam. Titik yang dipakai bersama dengan satu normal rata-rata menghasilkan tampilan halus. Hal ini juga menjelaskan kenapa hologram proyek ini mendorong titik **searah radial**, bukan searah normal: titik sudut yang sama dengan normal berbeda akan terdorong ke arah berbeda, sehingga permukaannya retak.',
  ],
  metalness: [
    'Model PBR membagi pantulan menjadi dua: **diffuse** (cahaya masuk ke material lalu tersebar keluar, membawa warna material) dan **specular** (cahaya langsung memantul dari permukaan). Non-logam: sebagian besar diffuse dan sedikit specular tak berwarna. Logam: diffuse hampir nol, specular berwarna.',
    'Karena logam hanya memantul, ia butuh sesuatu untuk dipantulkan. Solusi standarnya adalah environment map: gambar 360° (HDRI) yang dipasang di `scene.environment`, sehingga semua material PBR memantulkannya. HDRI gratis tersedia di Poly Haven.',
  ],
  'shadow-map': [
    'Kualitas bayangan ditentukan oleh **kepadatan** piksel shadow map per unit dunia: mapSize ÷ lebar area kamera bayangan. 1024 piksel untuk area 8 unit = 128 piksel per unit. Area yang sama dengan 512 piksel menghasilkan tepi lebih kasar; area 40 unit dengan 1024 piksel juga.',
    'Setiap jenis lampu punya biaya bayangan berbeda. DirectionalLight dan SpotLight: satu render tambahan. **PointLight: enam render tambahan** (satu ke setiap arah kubus), sehingga sangat mahal. Di proyek yang mengutamakan performa, batasi jumlah lampu yang memberi bayangan, idealnya satu.',
    'Untuk objek dan lampu yang tidak bergerak, bayangan bisa "dipanggang" ke tekstur (baking) di Blender, lalu shadow map dimatikan. Hasilnya lebih cantik dan biaya per frame-nya nol.',
  ],
  'tone-mapping': [
    '`renderer.toneMappingExposure` (bawaan 1) mengatur "bukaan" seperti kamera: naikkan untuk scene yang lebih terang secara keseluruhan.',
    'Operator berbeda menghasilkan karakter berbeda: `ACESFilmicToneMapping` (kontras sinematik, warna sangat terang bergeser ke putih), `AgXToneMapping` (lebih netral, warna jenuh lebih terjaga), `NeutralToneMapping` (mempertahankan warna dasar, cocok untuk menampilkan produk). Coba ganti di setup.js baris 34 dan bandingkan.',
  ],
}
