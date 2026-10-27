import { LESSONS, UPCOMING, LESSON_XP } from './lessons.js'
import { escapeHtml, format } from './format.js'
import { doneLessons, setLessonDone } from './progress.js'
import { mountDemos } from './codex.js'

const pad2 = (n) => String(n).padStart(2, '0')

// ---------- Blok konten ----------

function renderCode(block) {
  const lines = block.code.split('\n')
  const end = block.start + lines.length - 1
  const body = lines
    .map((line, i) => `<span class="code__line"><span class="code__ln">${block.start + i}</span>${escapeHtml(line) || ' '}</span>`)
    .join('')
  const notes = (block.notes ?? [])
    .map((note) => `<li><span class="code__ref">L${escapeHtml(note.lines)}</span><span>${format(note.text)}</span></li>`)
    .join('')
  return `
    <figure class="code">
      <figcaption class="code__file"><code>${escapeHtml(block.file)}</code><span>baris ${block.start}–${end}</span></figcaption>
      <pre class="code__pre"><code>${body}</code></pre>
      ${notes ? `<ol class="code__notes">${notes}</ol>` : ''}
    </figure>`
}

function renderBlock(block, sectionId) {
  switch (block.type) {
    case 'h':
      return `<h2 class="lesson__h" id="${sectionId}">${escapeHtml(block.text)}</h2>`
    case 'p':
      return `<p>${format(block.text)}</p>`
    case 'mental':
      return `<aside class="callout callout--mental"><span class="callout__label">Model mental</span><p class="callout__title">${escapeHtml(block.title)}</p><p>${format(block.text)}</p></aside>`
    case 'tip':
      return `<aside class="callout callout--tip"><span class="callout__label">Tips</span><p>${format(block.text)}</p></aside>`
    case 'warn':
      return `<aside class="callout callout--warn"><span class="callout__label">Perhatian</span><p>${format(block.text)}</p></aside>`
    case 'list':
      return `<ul class="lesson__list">${block.items.map((item) => `<li>${format(item)}</li>`).join('')}</ul>`
    case 'steps':
      return `<ol class="lesson__steps">${block.items.map((item) => `<li>${format(item)}</li>`).join('')}</ol>`
    case 'table':
      return `
        <div class="lesson__table-wrap"><table class="lesson__table">
          <thead><tr>${block.head.map((h) => `<th>${format(h)}</th>`).join('')}</tr></thead>
          <tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${format(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`
    case 'code':
      return renderCode(block)
    case 'demo':
      return `<div class="demo demo--lesson" data-demo="${block.name}"><span class="tag tag--demo">Demo</span>${block.caption ? `<p class="demo__caption">${format(block.caption)}</p>` : ''}</div>`
    case 'html':
      return `<div class="diagram">${block.html}</div>`
    default:
      return ''
  }
}

function renderMistakes(mistakes) {
  return mistakes
    .map(
      (m) => `
    <div class="mistake">
      <p class="mistake__title">${escapeHtml(m.title)}</p>
      <div class="mistake__cols">
        <div class="mistake__col mistake__col--wrong"><span class="mistake__tag">✗ Keliru</span><pre><code>${escapeHtml(m.wrong)}</code></pre></div>
        <div class="mistake__col mistake__col--right"><span class="mistake__tag">✓ Benar</span><pre><code>${escapeHtml(m.right)}</code></pre></div>
      </div>
      <p class="mistake__why">${format(m.why)}</p>
    </div>`,
    )
    .join('')
}

/** Urutan acak (Fisher–Yates) agar posisi jawaban benar tidak bisa ditebak */
function shuffledIndices(length) {
  const order = [...Array(length).keys()]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

// data-opt tetap menyimpan indeks ASLI opsi, jadi pengecekan jawaban tidak terpengaruh pengacakan
function renderQuiz(quiz) {
  return `
    <div class="quiz" data-quiz>
      ${quiz
        .map(
          (item, qi) => `
        <div class="quiz__q" data-q="${qi}">
          <p class="quiz__text"><span>${qi + 1}.</span> ${format(item.q)}</p>
          <div class="quiz__opts">
            ${shuffledIndices(item.options.length).map((oi) => `<button type="button" class="quiz__opt" data-opt="${oi}">${format(item.options[oi])}</button>`).join('')}
          </div>
          <p class="quiz__explain" hidden></p>
        </div>`,
        )
        .join('')}
      <div class="quiz__foot">
        <p class="quiz__score" data-quiz-score></p>
        <button type="button" class="btn btn--ghost" data-quiz-reset hidden>Ulangi kuis</button>
      </div>
    </div>`
}

// ---------- Halaman ----------

function renderOverview() {
  const cards = LESSONS.map(
    (lesson) => `
    <a class="lesson-card ${doneLessons.has(lesson.id) ? 'is-done' : ''}" href="#/belajar/${lesson.id}">
      <span class="lesson-card__num">Pelajaran ${pad2(lesson.num)}</span>
      <strong class="lesson-card__title">${escapeHtml(lesson.title)}</strong>
      <span class="lesson-card__sub">${escapeHtml(lesson.subtitle)}</span>
      <span class="lesson-card__meta">±${lesson.minutes} menit · ${lesson.quiz.length} soal kuis · +${LESSON_XP} XP${doneLessons.has(lesson.id) ? ' · ✓ selesai' : ''}</span>
    </a>`,
  ).join('')
  const upcoming = UPCOMING.map(
    (lesson) => `
    <div class="lesson-card is-locked" aria-disabled="true">
      <span class="lesson-card__num">Pelajaran ${pad2(lesson.num)} · segera</span>
      <strong class="lesson-card__title">${escapeHtml(lesson.title)}</strong>
      <span class="lesson-card__sub">${escapeHtml(lesson.subtitle)}</span>
    </div>`,
  ).join('')

  return `
    <section class="overview">
      <p class="overview__kicker">Jalur Belajar</p>
      <h1 class="overview__title">Pahami fondasinya, satu pelajaran setiap kali.</h1>
      <p class="overview__intro">Setiap pelajaran membangun konsep secara bertahap, membedah kode proyek Anda sendiri baris demi baris, lalu menutupnya dengan kuis dan latihan. Codex tetap tersedia sebagai kamus.</p>
      <ol class="overview__how">
        <li><b>Baca berurutan.</b> Pelajaran berikutnya memakai konsep dari pelajaran sebelumnya.</li>
        <li><b>Klik istilah bergaris titik-titik</b> untuk membuka penjelasannya di panel samping tanpa meninggalkan pelajaran.</li>
        <li><b>Buka file yang dibedah</b> di VS Code. Nomor baris di pelajaran sama dengan nomor baris di file.</li>
        <li><b>Kerjakan kuis dan latihan.</b> Mengubah kode sendiri lalu melihat akibatnya adalah cara tercepat untuk benar-benar paham.</li>
      </ol>
      <div class="overview__grid">${cards}${upcoming}</div>
    </section>`
}

function renderLesson(lesson) {
  const index = LESSONS.indexOf(lesson)
  const prev = LESSONS[index - 1]
  const next = LESSONS[index + 1]
  let section = 0
  const body = lesson.blocks.map((block) => renderBlock(block, block.type === 'h' ? `s-${lesson.id}-${section++}` : '')).join('')

  return `
    <article class="lesson">
      <header class="lesson__head">
        <p class="lesson__kicker">Pelajaran ${pad2(lesson.num)} · ±${lesson.minutes} menit</p>
        <h1 class="lesson__title">${escapeHtml(lesson.title)}</h1>
        <p class="lesson__subtitle">${escapeHtml(lesson.subtitle)}</p>
        <div class="lesson__goals">
          <p class="lesson__goals-title">Setelah pelajaran ini Anda bisa:</p>
          <ul>${lesson.goals.map((g) => `<li>${format(g)}</li>`).join('')}</ul>
        </div>
      </header>

      ${body}

      <h2 class="lesson__h" id="s-${lesson.id}-mistakes">Kesalahan umum</h2>
      <p>Kesalahan-kesalahan berikut sering terjadi, dan banyak di antaranya <b>tidak memunculkan error</b>. Mengenalinya lebih awal akan menghemat banyak waktu debugging.</p>
      ${renderMistakes(lesson.mistakes)}

      <h2 class="lesson__h" id="s-${lesson.id}-quiz">Cek pemahaman</h2>
      <p>Pilih satu jawaban. Penjelasan muncul setelah Anda menjawab, jadi bacalah juga penjelasan untuk jawaban yang benar.</p>
      ${renderQuiz(lesson.quiz)}

      <h2 class="lesson__h" id="s-${lesson.id}-practice">Latihan</h2>
      <p>Kerjakan langsung di kode proyek. Simpan file, lalu lihat hasilnya di browser (Vite memuat ulang otomatis). Kembalikan kodenya setelah selesai.</p>
      <ol class="lesson__exercises">${lesson.exercises.map((ex) => `<li>${format(ex)}</li>`).join('')}</ol>

      <footer class="lesson__foot">
        <button type="button" class="btn ${doneLessons.has(lesson.id) ? 'btn--done' : 'btn--primary'}" data-complete="${lesson.id}">
          ${doneLessons.has(lesson.id) ? '✓ Pelajaran selesai' : `Tandai selesai · +${LESSON_XP} XP`}
        </button>
        <nav class="lesson__pager">
          ${prev ? `<a href="#/belajar/${prev.id}">← ${escapeHtml(prev.title)}</a>` : '<a href="#/belajar">← Semua pelajaran</a>'}
          ${next ? `<a href="#/belajar/${next.id}">${escapeHtml(next.title)} →</a>` : '<a href="#/belajar">Semua pelajaran →</a>'}
        </nav>
      </footer>
    </article>`
}

/** Daftar isi pelajaran aktif: judul blok h + tiga bagian penutup */
function tocFor(lesson) {
  let section = 0
  const items = lesson.blocks.filter((b) => b.type === 'h').map((b) => ({ id: `s-${lesson.id}-${section++}`, text: b.text }))
  items.push(
    { id: `s-${lesson.id}-mistakes`, text: 'Kesalahan umum' },
    { id: `s-${lesson.id}-quiz`, text: 'Cek pemahaman' },
    { id: `s-${lesson.id}-practice`, text: 'Latihan' },
  )
  return items
}

function renderSidebar(activeId) {
  const available = LESSONS.map((lesson) => {
    const active = lesson.id === activeId
    const toc = active
      ? `<ul class="toc">${tocFor(lesson).map((item) => `<li><button type="button" data-scroll="${item.id}">${escapeHtml(item.text)}</button></li>`).join('')}</ul>`
      : ''
    return `
      <li class="${active ? 'is-active' : ''}">
        <a href="#/belajar/${lesson.id}" class="lesson-nav__link">
          <span class="lesson-nav__num ${doneLessons.has(lesson.id) ? 'is-done' : ''}">${doneLessons.has(lesson.id) ? '✓' : pad2(lesson.num)}</span>
          <span>${escapeHtml(lesson.title)}</span>
        </a>${toc}
      </li>`
  }).join('')
  const locked = UPCOMING.map(
    (lesson) => `<li class="is-locked"><span class="lesson-nav__link"><span class="lesson-nav__num">${pad2(lesson.num)}</span><span>${escapeHtml(lesson.title)}</span></span></li>`,
  ).join('')
  return `<a href="#/belajar" class="lesson-nav__all ${activeId ? '' : 'is-active'}">Semua pelajaran</a><ul class="lesson-nav">${available}${locked}</ul>`
}

// ---------- Inisialisasi ----------

export function initLearn() {
  const main = document.querySelector('[data-learn-main]')
  const sidebar = document.querySelector('[data-learn-nav]')
  let current = null

  function show(id) {
    const lesson = LESSONS.find((l) => l.id === id) ?? null
    current = lesson
    main.innerHTML = lesson ? renderLesson(lesson) : renderOverview()
    sidebar.innerHTML = renderSidebar(lesson?.id)
    mountDemos(main)
    window.scrollTo({ top: 0 })
  }

  function refresh() {
    sidebar.innerHTML = renderSidebar(current?.id)
    if (!current) {
      main.innerHTML = renderOverview()
      return
    }
    const button = main.querySelector('[data-complete]')
    const done = doneLessons.has(current.id)
    button.className = `btn ${done ? 'btn--done' : 'btn--primary'}`
    button.textContent = done ? '✓ Pelajaran selesai' : `Tandai selesai · +${LESSON_XP} XP`
  }

  // Daftar isi: menggulir ke bagian (bukan memakai #hash, karena hash dipakai untuk navigasi halaman)
  sidebar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-scroll]')
    if (!button) return
    document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  main.addEventListener('click', (event) => {
    const complete = event.target.closest('[data-complete]')
    if (complete) {
      setLessonDone(complete.dataset.complete, !doneLessons.has(complete.dataset.complete))
      return
    }

    const option = event.target.closest('[data-opt]')
    if (option && current) {
      const question = option.closest('[data-q]')
      if (question.dataset.answered) return
      const item = current.quiz[Number(question.dataset.q)]
      const chosen = Number(option.dataset.opt)
      const correct = chosen === item.answer
      question.dataset.answered = correct ? 'correct' : 'wrong'
      question.querySelectorAll('[data-opt]').forEach((btn) => {
        const i = Number(btn.dataset.opt)
        btn.disabled = true
        btn.classList.toggle('is-correct', i === item.answer)
        btn.classList.toggle('is-wrong', i === chosen && !correct)
      })
      const explain = question.querySelector('.quiz__explain')
      explain.innerHTML = `<strong>${correct ? 'Benar.' : 'Belum tepat.'}</strong> ${format(item.explain)}`
      explain.hidden = false
      updateScore()
      return
    }

    if (event.target.closest('[data-quiz-reset]')) {
      main.querySelectorAll('[data-q]').forEach((question) => {
        delete question.dataset.answered
        question.querySelectorAll('[data-opt]').forEach((btn) => {
          btn.disabled = false
          btn.classList.remove('is-correct', 'is-wrong')
        })
        question.querySelector('.quiz__explain').hidden = true
      })
      updateScore()
    }
  })

  function updateScore() {
    const questions = [...main.querySelectorAll('[data-q]')]
    const answered = questions.filter((q) => q.dataset.answered)
    const correct = answered.filter((q) => q.dataset.answered === 'correct').length
    const score = main.querySelector('[data-quiz-score]')
    const reset = main.querySelector('[data-quiz-reset]')
    const finished = answered.length === questions.length
    score.textContent = answered.length ? `Skor: ${correct} / ${questions.length}${finished ? (correct === questions.length ? ' · Sempurna!' : ' · Baca ulang penjelasannya, lalu coba lagi.') : ''}` : ''
    reset.hidden = !finished
  }

  return { show, refresh }
}
