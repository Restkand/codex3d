// FRAGMENT SHADER: dijalankan sekali untuk SETIAP piksel yang ditutupi geometri.
// Tugasnya: menentukan warna piksel itu (gl_FragColor = vec4(r, g, b, alpha)).

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vHeight;
varying float vWave;

void main() {
  vec3 normal = normalize(vNormal);
  // Material dua sisi: untuk sisi belakang, normal dibalik agar fresnel tetap benar
  if (!gl_FrontFacing) normal *= -1.0;

  // FRESNEL: dot(normal, arahPandang) = 1 saat permukaan menghadap kamera, 0 di tepi siluet.
  // Dibalik (1 - ...) -> tepi terang, tengah transparan. Ini ciri khas efek hologram.
  float fresnel = 1.0 - abs(dot(normal, vViewDir));
  fresnel = pow(fresnel, 2.0);

  // SCANLINES: mod(x, 1.0) menghasilkan gigi gergaji 0..1 yang berulang.
  // Dikurangi waktu -> garis bergerak ke atas. pow() menajamkan garisnya.
  float stripes = mod((vHeight - uTime * 0.3) * 18.0, 1.0);
  stripes = pow(stripes, 3.0);

  float holo = stripes * (0.3 + fresnel) + fresnel * 1.2;

  // Warna bergeser antara dua warna mengikuti puncak/lembah gelombang
  vec3 color = mix(uColorA, uColorB, vWave * 0.5 + 0.5);

  // Nilai > 1.0 sengaja dibiarkan: piksel "terlalu terang" inilah yang ditangkap Bloom
  gl_FragColor = vec4(color * 1.2, holo * uOpacity);
}
