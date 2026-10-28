// VERTEX SHADER: dijalankan GPU sekali untuk SETIAP titik (vertex) geometri, paralel.
// Tugas utamanya: menentukan posisi akhir titik di layar (gl_Position).
//
// Variabel bawaan dari Three.js (tidak perlu dideklarasikan):
//   attribute vec3 position, normal; attribute vec2 uv;
//   uniform mat4 modelMatrix, viewMatrix, projectionMatrix; uniform vec3 cameraPosition;

uniform float uTime;
uniform float uMorph;    // 0 = bola, 1 = kubus
uniform float uTwist;    // besar puntiran (radian per satuan tinggi)
uniform float uWaveAmp;  // tinggi gelombang
uniform float uWaveFreq; // kerapatan gelombang
uniform float uPulse;    // tambahan gelombang sesaat saat objek diklik
uniform float uSphereRadius;

// varying = data yang dikirim dari vertex shader ke fragment shader
// (nilainya diinterpolasi GPU untuk tiap piksel di antara titik-titik)
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vHeight;
varying float vWave;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  // 1. MORPH. Geometrinya adalah BoxGeometry yang dipecah menjadi banyak segmen.
  //    normalize(position) * r memproyeksikan setiap titik kubus ke permukaan bola.
  //    mix(a, b, t) = a + (b - a) * t -> interpolasi linear (lerp) di GPU.
  vec3 spherePos = normalize(position) * uSphereRadius;
  vec3 pos = mix(spherePos, position, uMorph);
  vec3 objNormal = normalize(mix(normalize(position), normal, uMorph));

  // 2. TWIST. Putar bidang XZ dengan sudut yang bergantung pada ketinggian Y.
  //    Bagian atas dan bawah berputar berlawanan arah -> bentuk terpuntir.
  float angle = pos.y * uTwist;
  pos.xz = rotate2d(angle) * pos.xz;
  objNormal.xz = rotate2d(angle) * objNormal.xz;

  // 3. WAVE. Dua gelombang sinus dikalikan -> pola riak yang bergerak terhadap waktu.
  //    Titik didorong keluar searah radial (dari pusat). Arah radial dipakai, bukan normal,
  //    karena titik di sudut kubus memiliki beberapa normal berbeda -> permukaan bisa retak.
  float wave = sin(pos.y * uWaveFreq + uTime * 2.0) * sin(pos.x * uWaveFreq * 0.7 + uTime * 1.3);
  pos += normalize(pos) * wave * (uWaveAmp + uPulse);

  // Ruang objek -> ruang dunia -> ruang kamera -> ruang layar (clip space)
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPos;

  vNormal = normalize(mat3(modelMatrix) * objNormal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vHeight = pos.y;
  vWave = wave;
}
