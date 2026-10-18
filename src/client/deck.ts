// スライドのナビゲーション。ippon が HTML に埋め込む。
//   → / Space / PageDown / クリック右側     次へ
//   ← / PageUp / クリック左側              前へ
//   Home / End                              最初 / 最後
//   f                                       フルスクリーン
//   o / Esc                                 一覧
//   p                                       発表者ビュー（別ウィンドウ）
(() => {
  const slides = Array.from(document.querySelectorAll<HTMLElement>('#deck .slide'))
  if (!slides.length) return

  const $ = (id: string) => document.getElementById(id)!
  const div = (className: string) => {
    const el = document.createElement('div')
    el.className = className
    return el
  }
  function fmt(ms: number): string {
    const total = Math.floor(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return m + ':' + (s < 10 ? '0' : '') + s
  }

  // 別ウィンドウで開いたときは発表者ビューとして動く（本番のナビは動かさない）
  if (window.name === 'ippon-presenter') {
    presenterMode()
    return
  }

  let idx = 0
  const progress = $('progress')
  const counter = $('counter')
  const timerEl = $('timer')

  const clamp = (n: number) => Math.max(0, Math.min(slides.length - 1, n))

  // ---------- タイマー（表紙から進んだら開始、表紙に戻ったらリセット） ----------

  let startedAt: number | null = null
  let ticking: number | undefined
  function syncTimer(): void {
    if (idx === 0) {
      startedAt = null
      clearInterval(ticking)
      ticking = undefined
      timerEl.textContent = ''
      return
    }
    const t0 = (startedAt ??= Date.now())
    ticking ??= window.setInterval(() => {
      timerEl.textContent = fmt(Date.now() - t0)
    }, 500)
    timerEl.textContent = fmt(Date.now() - t0)
  }

  // ---------- 描画 ----------

  function render(): void {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx))
    slides[idx]!.scrollTop = 0
    counter.textContent = idx + 1 + ' / ' + slides.length
    progress.style.width = ((idx + 1) / slides.length) * 100 + '%'
    syncTimer()
    broadcast()
  }
  function go(n: number): void {
    n = clamp(n)
    if (n === idx) return
    idx = n
    render()
    history.replaceState(null, '', '#' + (idx + 1))
  }
  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10)
    if (n) go(n - 1)
  })

  // ---------- 発表者ビュー（別ウィンドウ）との同期 ----------

  let presenterWin: Window | null = null
  function openPresenter(): void {
    if (presenterWin && !presenterWin.closed) {
      presenterWin.focus()
      return
    }
    presenterWin = window.open(location.href, 'ippon-presenter', 'width=1024,height=700')
  }
  function broadcast(): void {
    if (presenterWin && !presenterWin.closed)
      presenterWin.postMessage({ ippon: 'state', idx, total: slides.length, startedAt }, '*')
  }
  window.addEventListener('message', (e) => {
    const m = e.data as { ippon?: string; n?: number } | null
    if (!m || typeof m !== 'object') return
    if (m.ippon === 'hello') broadcast()
    else if (m.ippon === 'go' && typeof m.n === 'number') go(m.n)
  })

  // ---------- 一覧 ----------

  interface Thumb {
    item: HTMLElement
    frame: HTMLElement
    scale: HTMLElement
  }

  const overview = $('overview')
  let ovItems: Thumb[] | null = null
  let ovOpen = false
  const THUMB = 240

  function buildOverview(): Thumb[] {
    return slides.map((s, i) => {
      const item = div('ov-item')
      const frame = div('ov-frame')
      const scale = div('ov-scale')
      const clone = s.cloneNode(true) as HTMLElement
      clone.classList.remove('active')
      scale.appendChild(clone)
      frame.appendChild(scale)
      const num = div('ov-num')
      num.textContent = String(i + 1)
      item.appendChild(frame)
      item.appendChild(num)
      item.addEventListener('click', () => {
        idx = i
        closeOverview()
        render()
        history.replaceState(null, '', '#' + (idx + 1))
      })
      overview.appendChild(item)
      return { item, frame, scale }
    })
  }
  function layoutOverview(items: Thumb[]): void {
    const w = window.innerWidth
    const h = window.innerHeight
    const k = THUMB / w
    for (const t of items) {
      t.frame.style.width = THUMB + 'px'
      t.frame.style.height = h * k + 'px'
      t.scale.style.width = w + 'px'
      t.scale.style.height = h + 'px'
      t.scale.style.transform = 'scale(' + k + ')'
    }
  }
  function openOverview(): void {
    const items = (ovItems ??= buildOverview())
    layoutOverview(items)
    items.forEach((t, i) => t.item.classList.toggle('current', i === idx))
    ovOpen = true
    document.body.classList.add('overview')
    items[idx]!.item.scrollIntoView({ block: 'center' })
  }
  function closeOverview(): void {
    ovOpen = false
    document.body.classList.remove('overview')
  }
  window.addEventListener('resize', () => {
    if (ovOpen && ovItems) layoutOverview(ovItems)
  })

  // ---------- 入力 ----------

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (ovOpen) {
      if (e.key === 'Escape' || e.key === 'o') closeOverview()
      return
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault()
        go(idx + 1)
        break
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault()
        go(idx - 1)
        break
      case 'Home':
        go(0)
        break
      case 'End':
        go(slides.length - 1)
        break
      case 'f':
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen()
        break
      case 'o':
        openOverview()
        break
      case 'p':
        openPresenter()
        break
      case 'Escape':
        if (!document.fullscreenElement) openOverview()
        break
    }
  })

  // 画面の右 3 割で次へ、左 3 割で前へ（リンクと文字選択は邪魔しない）
  const deck = $('deck')
  deck.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a, button')) return
    if (String(window.getSelection() || '')) return
    const x = e.clientX / window.innerWidth
    if (x > 0.7) go(idx + 1)
    else if (x < 0.3) go(idx - 1)
  })

  // 横スワイプ
  let touch: { x: number; y: number } | null = null
  deck.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0]
      touch = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null
    },
    { passive: true }
  )
  deck.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0]
      if (!touch || !t) return
      const dx = t.clientX - touch.x
      const dy = t.clientY - touch.y
      touch = null
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? idx + 1 : idx - 1)
    },
    { passive: true }
  )

  const start = parseInt(location.hash.slice(1), 10)
  if (start) idx = clamp(start - 1)
  render()

  // ---------- 発表者ビュー本体（別ウィンドウで動く） ----------

  function presenterMode(): void {
    document.body.classList.add('presenter')
    const root = $('presenter')

    const left = div('pv-left')
    const right = div('pv-right')
    root.appendChild(left)
    root.appendChild(right)

    const makeSlot = (labelText: string) => {
      const slot = div('pv-slot')
      const label = div('pv-label')
      label.textContent = labelText
      const frame = div('pv-frame')
      const scale = div('pv-scale')
      frame.appendChild(scale)
      slot.appendChild(label)
      slot.appendChild(frame)
      left.appendChild(slot)
      return { label, frame, scale }
    }
    const cur = makeSlot('現在')
    const nxt = makeSlot('次へ')

    const clock = div('pv-clock')
    const elapsedEl = div('pv-elapsed')
    const wallEl = div('pv-wall')
    clock.appendChild(elapsedEl)
    clock.appendChild(wallEl)

    const controls = div('pv-controls')
    const prevBtn = document.createElement('button')
    prevBtn.textContent = '◀'
    const nextBtn = document.createElement('button')
    nextBtn.textContent = '▶'
    controls.appendChild(prevBtn)
    controls.appendChild(nextBtn)

    const notesEl = div('pv-notes')
    right.appendChild(clock)
    right.appendChild(controls)
    right.appendChild(notesEl)

    let curIdx = 0
    let total = slides.length
    let startedAt: number | null = null

    function fitPreview(frame: HTMLElement, scale: HTMLElement): void {
      const w = window.innerWidth
      const h = window.innerHeight
      const fw = frame.clientWidth
      const k = fw / w
      frame.style.height = fw * (h / w) + 'px'
      scale.style.width = w + 'px'
      scale.style.height = h + 'px'
      scale.style.transform = 'scale(' + k + ')'
    }
    function setPreview(frame: HTMLElement, scale: HTMLElement, i: number): void {
      scale.textContent = ''
      const s = slides[i]
      if (s) scale.appendChild(s.cloneNode(true))
      fitPreview(frame, scale)
    }
    function draw(): void {
      cur.label.textContent = '現在  ' + (curIdx + 1) + ' / ' + total
      setPreview(cur.frame, cur.scale, curIdx)
      const hasNext = curIdx + 1 < total
      nxt.label.textContent = hasNext ? '次へ  ' + (curIdx + 2) + ' / ' + total : 'おわり'
      setPreview(nxt.frame, nxt.scale, hasNext ? curIdx + 1 : -1)
      const note = slides[curIdx]?.querySelector('.notes')
      notesEl.innerHTML = note ? note.innerHTML : '<p class="pv-empty">（ノートなし）</p>'
    }
    function tick(): void {
      elapsedEl.textContent = startedAt == null ? '0:00' : fmt(Date.now() - startedAt)
      wallEl.textContent = new Date().toLocaleTimeString()
    }

    const send = (n: number) => {
      if (window.opener) window.opener.postMessage({ ippon: 'go', n }, '*')
    }
    prevBtn.addEventListener('click', () => send(curIdx - 1))
    nextBtn.addEventListener('click', () => send(curIdx + 1))

    window.addEventListener('message', (e) => {
      const m = e.data as { ippon?: string; idx?: number; total?: number; startedAt?: number | null } | null
      if (!m || m.ippon !== 'state') return
      if (typeof m.idx === 'number') curIdx = m.idx
      if (typeof m.total === 'number') total = m.total
      startedAt = m.startedAt ?? null
      draw()
      tick()
    })
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          send(curIdx + 1)
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          send(curIdx - 1)
          break
        case 'Home':
          send(0)
          break
        case 'End':
          send(total - 1)
          break
        case 'p':
        case 'Escape':
          window.close()
          break
      }
    })
    window.addEventListener('resize', () => {
      fitPreview(cur.frame, cur.scale)
      fitPreview(nxt.frame, nxt.scale)
    })
    window.setInterval(tick, 500)

    // 本番ウィンドウに現在の状態を要求する
    if (window.opener) window.opener.postMessage({ ippon: 'hello' }, '*')
    draw()
    tick()
  }
})()
