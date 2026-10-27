/**
 * Progres belajar (istilah yang dipahami + pelajaran yang selesai), disimpan di localStorage.
 * localStorage bisa diblokir (mode privat, pengaturan browser), jadi selalu dibungkus try/catch:
 * jika gagal, progres tetap berjalan selama halaman terbuka.
 */
const KEYS = { terms: 'codex3d-progress', lessons: 'codex3d-lessons' }

function load(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key)) ?? [])
  } catch {
    return new Set()
  }
}

function save(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // diabaikan: progres hanya berlaku selama halaman terbuka
  }
}

export const learnedTerms = load(KEYS.terms)
export const doneLessons = load(KEYS.lessons)

const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

/** Daftarkan fungsi yang dipanggil setiap kali progres berubah */
export function onProgress(fn) {
  listeners.add(fn)
}

export function setTermLearned(id, learned) {
  learned ? learnedTerms.add(id) : learnedTerms.delete(id)
  save(KEYS.terms, learnedTerms)
  notify()
}

export function setLessonDone(id, done) {
  done ? doneLessons.add(id) : doneLessons.delete(id)
  save(KEYS.lessons, doneLessons)
  notify()
}

export function resetProgress() {
  learnedTerms.clear()
  doneLessons.clear()
  save(KEYS.terms, learnedTerms)
  save(KEYS.lessons, doneLessons)
  notify()
}
