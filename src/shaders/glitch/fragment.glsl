// Post-processing = shader yang memproses GAMBAR hasil render, bukan objek 3D.
// tDiffuse berisi frame yang sudah dirender oleh pass sebelumnya, diisi otomatis oleh ShaderPass.

uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uStrength; // 0 = normal, 1 = glitch penuh (dianimasikan GSAP)
uniform float uRgbShift; // pergeseran warna dasar yang selalu aktif

varying vec2 vUv;

// GLSL tidak punya Math.random(). Trik klasik: fungsi hash pseudo-acak dari koordinat.
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // 1. SLICE GLITCH: layar dibagi menjadi pita-pita horizontal.
  //    floor(uTime * 20.0) berubah 20x per detik -> pola melompat-lompat, bukan halus.
  float band = floor(uv.y * 24.0);
  float tick = floor(uTime * 20.0);
  // step(edge, x) = 0 jika x < edge, selain itu 1. Makin kuat glitch, makin banyak pita aktif.
  // (Catatan: nama "active" tidak bisa dipakai, itu reserved word di GLSL)
  float isSliced = step(1.0 - uStrength * 0.6, random(vec2(band, tick)));
  uv.x += (random(vec2(tick, band)) - 0.5) * 0.2 * uStrength * isSliced;

  // 2. RGB SHIFT (chromatic aberration): kanal merah & biru diambil dari posisi
  //    yang sedikit bergeser ke arah luar dari tengah layar, hijau tetap di tempatnya.
  vec2 dir = uv - 0.5;
  float shift = uRgbShift + uStrength * 0.04;
  vec4 base = texture2D(tDiffuse, uv);
  float r = texture2D(tDiffuse, uv + dir * shift).r;
  float b = texture2D(tDiffuse, uv - dir * shift).b;

  gl_FragColor = vec4(r, base.g, b, base.a);
}
