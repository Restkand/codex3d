/**
 * Progres belajar pengguna: daftar id halaman yang sudah "dipahami"/"selesai".
 * Disimpan di localStorage browser (tanpa server, tanpa akun). Bisa diblokir di mode privat,
 * jadi selalu dibungkus try/catch: jika gagal, progres hanya berlaku selama halaman terbuka.
 */
export const LEVELS = {
  1: { name: 'Dasar', xp: 10 },
  2: { name: 'Menengah', xp: 20 },
  3: { name: 'Lanjut', xp: 30 },
}

export const LESSON_XP = 50

export const RANKS = [
  { min: 0, name: 'Rookie' },
  { min: 0.15, name: 'Apprentice' },
  { min: 0.35, name: 'Pixel Pusher' },
  { min: 0.55, name: 'Scene Builder' },
  { min: 0.75, name: 'Shader Adept' },
  { min: 0.95, name: 'Graphics Engineer' },
]

const KEY = 'krekit-progress-v2'
let memory = null

export function loadProgress() {
  if (memory) return memory
  try {
    memory = new Set(JSON.parse(localStorage.getItem(KEY)) ?? [])
  } catch {
    memory = new Set()
  }
  return memory
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...memory]))
  } catch {
    // diabaikan: progres tetap berlaku selama halaman terbuka
  }
}

export function setDone(id, done) {
  const set = loadProgress()
  done ? set.add(id) : set.delete(id)
  save()
}

export function resetProgress() {
  loadProgress().clear()
  save()
}

export function rankFor(ratio) {
  return [...RANKS].reverse().find((r) => ratio >= r.min)
}
