import GUI from 'lil-gui'

/**
 * lil-gui membaca dan menulis properti objek JavaScript secara langsung.
 * gui.add(objek, 'namaProperti', min, max, step) -> slider yang mengubah nilai itu.
 * Karena render loop menggambar ulang tiap frame, perubahan langsung terlihat.
 */
export function createDebug({ lights, objects, params, intro, hologram, post, perf }) {
  const gui = new GUI({ title: 'Debug (H)' })
  const { ambient, directional } = lights
  const { introGroup, material } = objects

  // Hanya-baca: listen() menyegarkan tampilan, disable() mencegah nilainya diedit
  const s = perf.stats
  const perfFolder = gui.addFolder('Performance')
  perfFolder.add(s, 'fps').decimals(0).name('FPS').listen().disable()
  perfFolder.add(s, 'frameMs').decimals(1).name('frame time (ms)').listen().disable()
  perfFolder.add(s, 'cpuMs').decimals(2).name('CPU time (ms)').listen().disable()
  perfFolder.add(s, 'drawCalls').name('draw calls').listen().disable()
  perfFolder.add(s, 'triangles').name('triangles').listen().disable()
  perfFolder.add(s, 'geometries').name('geometries').listen().disable()
  perfFolder.add(s, 'textures').name('textures').listen().disable()
  perfFolder.add(s, 'programs').name('shader programs').listen().disable()
  perfFolder.add(s, 'renderPath').name('render path').listen().disable()
  perfFolder.add(s, 'pixelRatio').decimals(2).name('pixel ratio').listen().disable()

  const lightsFolder = gui.addFolder('Lights').close()
  lightsFolder.add(ambient, 'intensity', 0, 3, 0.01).name('ambient')
  lightsFolder.add(directional, 'intensity', 0, 10, 0.01).name('directional')
  lightsFolder.addColor(directional, 'color').name('directional color')
  lightsFolder.add(directional.position, 'x', -10, 10, 0.1).name('dir x')
  lightsFolder.add(directional.position, 'y', -10, 10, 0.1).name('dir y')
  lightsFolder.add(directional.position, 'z', -10, 10, 0.1).name('dir z')

  const materialFolder = gui.addFolder('Material').close()
  // addColor bekerja langsung dengan THREE.Color
  materialFolder.addColor(material, 'color')
  materialFolder.add(material, 'roughness', 0, 1, 0.01)
  materialFolder.add(material, 'metalness', 0, 1, 0.01)
  materialFolder.add(material, 'wireframe')
  // flatShading butuh kompilasi ulang shader, jadi material ditandai needsUpdate
  materialFolder.add(material, 'flatShading').onChange(() => (material.needsUpdate = true))

  const objectFolder = gui.addFolder('Object').close()
  // introGroup dipakai untuk posisi karena tiltGroup & mesh sudah dikendalikan sistem lain
  objectFolder.add(introGroup.position, 'x', -3, 3, 0.01).name('pos x')
  objectFolder.add(introGroup.position, 'y', -1, 2, 0.01).name('pos y')
  objectFolder.add(introGroup.position, 'z', -3, 3, 0.01).name('pos z')
  objectFolder.add(params, 'rotationSpeed', 0, 3, 0.01).name('rotation speed')
  objectFolder.add(params, 'floatAmplitude', 0, 0.5, 0.01).name('float amplitude')

  // Uniform shader diakses lewat .value. listen() membuat slider ikut bergerak
  // saat nilainya diubah GSAP (misalnya saat transisi antar-section).
  const u = hologram.uniforms
  const holoFolder = gui.addFolder('Hologram shader')
  holoFolder.add(u.uMorph, 'value', 0, 1, 0.01).name('morph (bola→kubus)').listen()
  holoFolder.add(u.uTwist, 'value', -4, 4, 0.01).name('twist').listen()
  holoFolder.add(u.uWaveAmp, 'value', 0, 0.4, 0.001).name('wave amplitude')
  holoFolder.add(u.uWaveFreq, 'value', 0, 15, 0.1).name('wave frequency')
  holoFolder.add(u.uOpacity, 'value', 0, 2, 0.01).name('opacity')
  holoFolder.addColor(u.uColorA, 'value').name('color A').listen()
  holoFolder.addColor(u.uColorB, 'value').name('color B').listen()
  holoFolder.add(hologram.mesh, 'visible')

  const postFolder = gui.addFolder('Post-processing')
  // rgb shift > 0 membuat composer aktif terus (lebih berat) -> cocok untuk membandingkan FPS
  postFolder.add(post.glitch.uRgbShift, 'value', 0, 0.05, 0.001).name('rgb shift (selalu aktif)')
  postFolder.add(post.glitch.uStrength, 'value', 0, 1, 0.01).name('glitch').listen()
  postFolder.add({ burst: () => post.burst() }, 'burst').name('Glitch burst')

  gui.add({ replay: () => intro.restart() }, 'replay').name('Replay intro')

  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'h') gui.show(gui._hidden)
  })

  return gui
}
