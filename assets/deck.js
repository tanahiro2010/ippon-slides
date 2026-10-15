// スライドのナビゲーション。ippon が HTML に埋め込む。
//   → / Space / PageDown / クリック右側     次へ
//   ← / PageUp / クリック左側              前へ
//   Home / End                              最初 / 最後
//   f                                       フルスクリーン
//   o / Esc                                 一覧
;(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('#deck .slide'))
  if (!slides.length) return

  var idx = 0
  var progress = document.getElementById('progress')
  var counter = document.getElementById('counter')
  var timerEl = document.getElementById('timer')

  function clamp(n) {
    return Math.max(0, Math.min(slides.length - 1, n))
  }

  // ---------- タイマー（表紙から進んだら開始、表紙に戻ったらリセット） ----------

  var startedAt = null
  var ticking = null
  function fmt(ms) {
    var s = Math.floor(ms / 1000)
    var m = Math.floor(s / 60)
    s = s % 60
    return m + ':' + (s < 10 ? '0' : '') + s
  }
  function syncTimer() {
    if (idx === 0) {
      startedAt = null
      clearInterval(ticking)
      ticking = null
      timerEl.textContent = ''
      return
    }
    if (startedAt === null) startedAt = Date.now()
    if (!ticking) {
      ticking = setInterval(function () {
        timerEl.textContent = fmt(Date.now() - startedAt)
      }, 500)
    }
    timerEl.textContent = fmt(Date.now() - startedAt)
  }

  // ---------- 描画 ----------

  function render() {
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === idx)
    })
    slides[idx].scrollTop = 0
    counter.textContent = idx + 1 + ' / ' + slides.length
    progress.style.width = ((idx + 1) / slides.length) * 100 + '%'
    syncTimer()
  }
  function go(n) {
    n = clamp(n)
    if (n === idx) return
    idx = n
    render()
    history.replaceState(null, '', '#' + (idx + 1))
  }
  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10)
    if (n) go(n - 1)
  })

  // ---------- 一覧 ----------

  var overview = document.getElementById('overview')
  var ovItems = null
  var ovOpen = false
  var THUMB = 240

  function buildOverview() {
    ovItems = slides.map(function (s, i) {
      var item = document.createElement('div')
      item.className = 'ov-item'
      var frame = document.createElement('div')
      frame.className = 'ov-frame'
      var scale = document.createElement('div')
      scale.className = 'ov-scale'
      var clone = s.cloneNode(true)
      clone.classList.remove('active')
      scale.appendChild(clone)
      frame.appendChild(scale)
      var num = document.createElement('div')
      num.className = 'ov-num'
      num.textContent = i + 1
      item.appendChild(frame)
      item.appendChild(num)
      item.addEventListener('click', function () {
        idx = i
        closeOverview()
        render()
        history.replaceState(null, '', '#' + (idx + 1))
      })
      overview.appendChild(item)
      return { item: item, frame: frame, scale: scale }
    })
  }
  function layoutOverview() {
    var w = window.innerWidth
    var h = window.innerHeight
    var k = THUMB / w
    ovItems.forEach(function (t) {
      t.frame.style.width = THUMB + 'px'
      t.frame.style.height = h * k + 'px'
      t.scale.style.width = w + 'px'
      t.scale.style.height = h + 'px'
      t.scale.style.transform = 'scale(' + k + ')'
    })
  }
  function openOverview() {
    if (!ovItems) buildOverview()
    layoutOverview()
    ovItems.forEach(function (t, i) {
      t.item.classList.toggle('current', i === idx)
    })
    ovOpen = true
    document.body.classList.add('overview')
    ovItems[idx].item.scrollIntoView({ block: 'center' })
  }
  function closeOverview() {
    ovOpen = false
    document.body.classList.remove('overview')
  }
  window.addEventListener('resize', function () {
    if (ovOpen) layoutOverview()
  })

  // ---------- 入力 ----------

  document.addEventListener('keydown', function (e) {
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
      case 'Escape':
        if (!document.fullscreenElement) openOverview()
        break
    }
  })

  // 画面の右 3 割で次へ、左 3 割で前へ（リンクと文字選択は邪魔しない）
  var deck = document.getElementById('deck')
  deck.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return
    if (String(window.getSelection() || '')) return
    var x = e.clientX / window.innerWidth
    if (x > 0.7) go(idx + 1)
    else if (x < 0.3) go(idx - 1)
  })

  // 横スワイプ
  var tx = null
  var ty = null
  deck.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length !== 1) return (tx = null)
      tx = e.touches[0].clientX
      ty = e.touches[0].clientY
    },
    { passive: true }
  )
  deck.addEventListener(
    'touchend',
    function (e) {
      if (tx === null) return
      var t = e.changedTouches[0]
      var dx = t.clientX - tx
      var dy = t.clientY - ty
      tx = null
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? idx + 1 : idx - 1)
    },
    { passive: true }
  )

  var start = parseInt(location.hash.slice(1), 10)
  if (start) idx = clamp(start - 1)
  render()
})()
