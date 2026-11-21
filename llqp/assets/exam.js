/* 备考中心前端（site/exam_kit.py 生成的页面共用）。零依赖；记录只存本机 localStorage。 */
(function () {
  'use strict';
  var root = document.querySelector('.kx');
  if (!root) return;
  var COURSE = root.getAttribute('data-course') || 'course';

  /* 三种阅读模式（中文 / English / 中英）：默认中文，选择记在本机 */
  var LKEY = 'kx:lang';
  function setLang(m) {
    if (['zh', 'en', 'both'].indexOf(m) < 0) m = 'zh';
    document.documentElement.setAttribute('data-kx-lang', m);
    document.querySelectorAll('[data-kx-lang]').forEach(function (b) { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', b.getAttribute('data-kx-lang') === m ? 'true' : 'false'); });
    try { localStorage.setItem(LKEY, m); } catch (e) {}
    if (window.mermaid && window.__kxMermaid) window.__kxMermaid();
    if (typeof paintBadges === 'function') try { paintBadges(); } catch (e) {}
  }
  var lm = null; try { lm = localStorage.getItem(LKEY); } catch (e) {}
  setLang(lm || 'zh');
  document.addEventListener('click', function (e) { var b = e.target.closest('button[data-kx-lang]'); if (b) setLang(b.getAttribute('data-kx-lang')); });
  var KEY = 'kx:' + COURSE;
  var DAY = 864e5, BOXES = [1, 3, 7, 14, 30];

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function db() { var d = load(); d.a = d.a || {}; d.s = d.s || {}; d.m = d.m || []; return d; }

  function record(qid, ch, ok) {
    var d = db(), r = d.a[qid] || { c: ch, h: [] };
    r.c = ch || r.c; r.h.push(ok ? 1 : 0); if (r.h.length > 12) r.h = r.h.slice(-12);
    d.a[qid] = r;
    var base = qid.replace(/v$/, ''), s = d.s[base] || { b: 0 };
    s.b = ok ? Math.min(s.b + 1, BOXES.length - 1) : 0;
    s.due = Date.now() + BOXES[s.b] * DAY; s.c = ch || s.c;
    if (!ok) s.wrong = (s.wrong || 0) + 1;
    d.s[base] = s; save(d);
  }

  window.KX = { record: record };   // 专注卡题目（site/src/focus-academy.js）点选后记进同一份作答记录

  function chapterStats() {
    var d = db(), st = {};
    Object.keys(d.a).forEach(function (q) {
      var r = d.a[q]; if (!r.c) return;
      var x = st[r.c] || (st[r.c] = { n: 0, ok: 0 });
      r.h.slice(-5).forEach(function (v) { x.n++; x.ok += v; });
    });
    return st;
  }
  function level(x) {
    if (!x || x.n < 3) return 'none';
    var p = 100 * x.ok / x.n; return p < 60 ? 'weak' : p < 80 ? 'mid' : 'good';
  }
  var LBL_ZH = { none: '未测', weak: '薄弱', mid: '待巩固', good: '掌握' }, LBL_EN = { none: 'Not tested', weak: 'Weak', mid: 'Building', good: 'Mastered' };
  var LBL = LBL_ZH;
  function paintBadges() {
    var st = chapterStats(), en = document.documentElement.getAttribute('data-kx-lang') === 'en';
    LBL = en ? LBL_EN : LBL_ZH;
    document.querySelectorAll('.kx-mbadge').forEach(function (b) {
      var host = b.closest('[data-ch]'), ch = b.getAttribute('data-ch') || (host && host.getAttribute('data-ch'));
      if (!ch) return; var x = st[ch], l = level(x);
      b.setAttribute('data-m', l);
      b.textContent = LBL[l] + (x && x.n ? (l === 'none' ? (en ? ' (' + x.n + ' answered, colour after 3)' : '（已答 ' + x.n + ' 题，满 3 题出色）') : ' ' + Math.round(100 * x.ok / x.n) + '%' + (en ? ' (' + x.n + ')' : '（' + x.n + ' 题）')) : '');
    });
  }

  /* 题目交互：静态 HTML（考点页）与动态渲染（备考中心）共用 */
  function bindQ(q, onDone) {
    q.addEventListener('click', function (e) {
      var b = e.target.closest('.kx-opt'); if (!b || q.classList.contains('is-done')) return;
      q.classList.add('is-done'); b.classList.add('is-picked');
      var ok = b.getAttribute('data-ok') === '1';
      record(q.getAttribute('data-qid'), q.getAttribute('data-ch'), ok);
      var art = q.closest('.kx-item');
      if (!ok && art) { var v = art.querySelector('.kx-var'); if (v && !v.contains(q)) { v.open = true; } }
      paintBadges();
      if (onDone) onDone(ok);
    });
  }
  document.querySelectorAll('.kx-q').forEach(function (q) { bindQ(q); });

  /* mermaid 导图 */
  function initMermaid() {
    if (!window.mermaid) return;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    try { window.mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict' }); } catch (e) {}
    window.__kxMermaid = function () {   // 只渲看得见的导图：隐藏语言里的导图等切过去再渲（display:none 时量不出尺寸）
      var nodes = Array.prototype.filter.call(document.querySelectorAll('.kx-map pre.mermaid:not([data-processed])'), function (n) { return n.offsetParent !== null; });
      if (nodes.length) try { window.mermaid.run({ nodes: nodes }); } catch (e) {}
    };
    window.__kxMermaid();
  }
  if (document.readyState === 'complete') initMermaid(); else window.addEventListener('load', initMermaid);
  paintBadges();

  /* ── 备考中心 ── */
  var cfgEl = document.getElementById('kx-config');
  if (!cfgEl) return;
  var CFG = JSON.parse(cfgEl.textContent), POOL = null;
  var CH = {}; CFG.chapters.forEach(function (c) { CH[c.ch] = c; });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function getPool(cb) {
    if (POOL) return cb(POOL);
    fetch('pool.json').then(function (r) { return r.json(); }).then(function (p) {
      POOL = p; POOL.byId = {}; p.main.concat(p.variants, p.bank, p.checks || []).forEach(function (q) { POOL.byId[q.id] = q; }); cb(POOL);
    }).catch(function () { alert('题池没有加载成功：请在线打开本页（本机直接双击打开时浏览器会拦截读取）。'); });
  }
  function qHtml(q, n, opts) {
    opts = opts || {};
    var o = q.opts.map(function (x) {
      return '<li><button type="button" class="kx-opt" data-ok="' + (x.ok ? 1 : 0) + '"><span class="kx-k">' + esc(x.k) + '</span><span>' + esc(x.t) + '</span></button>' +
        '<p class="kx-why ' + (x.ok ? 'kx-why--ok' : 'kx-why--no') + '">' + (x.ok ? '✓ ' : '✗ ') + esc(x.w || (x.ok ? (q.note || '') : '')) + '</p></li>';
    }).join('');
    var c = CH[q.ch], sec = CFG.sections[q.sec] || CFG.sections.other;
    return '<article class="kx-item" style="--sec:' + sec.color + '"><header><span class="kx-n">第 ' + n + ' 题</span>' +
      '<span class="kx-badge" style="--c:' + sec.color + '">' + esc(sec.label) + '</span>' + (c ? '<span class="kx-pt">' + esc(c.ch.slice(2)) + ' ' + esc(c.title) + '</span>' : '') +
      '</header><div class="kx-q' + (opts.exam ? ' kx-exam' : '') + '" data-qid="' + esc(q.id) + '" data-ch="' + esc(q.ch || '') + '">' +
      '<p class="kx-stem">' + esc(q.stem) + '</p>' + (q.zh ? '<p class="kx-zh">' + esc(q.zh) + '</p>' : '') + '<ol class="kx-opts">' + o + '</ol></div></article>';
  }
  function runSet(box, list, title, after) {
    box.innerHTML = '<p class="sub">' + esc(title) + '</p>' + list.map(function (q, i) { return qHtml(q, i + 1); }).join('');
    var done = 0, right = 0;
    box.querySelectorAll('.kx-q').forEach(function (q) {
      bindQ(q, function (ok) {
        done++; right += ok ? 1 : 0;
        if (!ok) { // 答错：同考点变式题紧跟着出
          var v = POOL.byId[q.getAttribute('data-qid') + 'v'];
          if (v) { var w = document.createElement('div'); w.innerHTML = '<p class="sub">同一考点换个情境：</p>' + qHtml(v, '变式'); q.closest('.kx-item').appendChild(w); bindQ(w.querySelector('.kx-q')); }
        }
        if (done === list.length && after) after(right, list.length);
      });
    });
  }

  /* ① 诊断：每章 1 题 */
  function diag() {
    getPool(function (p) {
      var by = {}; p.main.forEach(function (q) { (by[q.ch] = by[q.ch] || []).push(q); });
      var list = CFG.chapters.filter(function (c) { return by[c.ch]; }).map(function (c) { return shuffle(by[c.ch])[0]; });
      runSet(document.getElementById('kx-diag'), list, '每题点一个选项即判分。做完看弱项图。', function (r, n) {
        var d = db(); d.m.push({ t: Date.now(), kind: 'diag', r: r, n: n }); save(d); matrix();
        document.getElementById('kx-diag').insertAdjacentHTML('beforeend', '<p class="kx-score">诊断：' + r + ' / ' + n + '</p><p><a href="#matrix">看弱项图 →</a></p>');
      });
    });
  }

  /* ② 模考：按所选配比按板块抽题，交卷统一判 */
  var timer = null;
  function mock() {
    getPool(function (p) {
      var mode = (document.querySelector('input[name="kx-mode"]:checked') || {}).value || 'recommended';
      var w = CFG.modes[mode], all = p.main.concat(p.bank), by = {}, list = [];
      all.forEach(function (q) { (by[q.sec] = by[q.sec] || []).push(q); });
      Object.keys(w).forEach(function (s) {
        var want = w[s], src = shuffle(by[s] || []);
        // 原创主题题优先，其余从题库补齐
        src.sort(function (a, b) { return (a.src === 'kit' ? 0 : 1) - (b.src === 'kit' ? 0 : 1) || Math.random() - .5; });
        list = list.concat(src.slice(0, want));
      });
      var total = Object.keys(w).reduce(function (t, k) { return t + w[k]; }, 0);
      if (list.length < total) { // 某板块题不够时从其余题里补齐到整卷题数
        var have = {}; list.forEach(function (q) { have[q.id] = 1; });
        list = list.concat(shuffle(all.filter(function (q) { return !have[q.id]; })).slice(0, total - list.length));
      }
      list = shuffle(list);
      var box = document.getElementById('kx-mock');
      box.innerHTML = '<p class="sub">共 ' + list.length + ' 题。作答时不显示对错；全部答完或时间到点「交卷」。</p>' +
        list.map(function (q, i) { return qHtml(q, i + 1, { exam: true }); }).join('') +
        '<button class="vv-btn vv-btn--primary" id="kx-submit">交卷</button>';
      box.querySelectorAll('.kx-q').forEach(function (q) {
        q.addEventListener('click', function (e) {
          var b = e.target.closest('.kx-opt'); if (!b || q.classList.contains('is-done')) return;
          q.querySelectorAll('.kx-opt').forEach(function (x) { x.classList.remove('is-picked'); x.style.outline = ''; });
          b.classList.add('is-picked'); b.style.outline = '2px solid var(--kx-p2)';
        });
      });
      var end = Date.now() + ((CFG.modeMinutes && CFG.modeMinutes[mode]) || CFG.minutes) * 60e3, t = document.getElementById('kx-timer'); t.hidden = false;
      clearInterval(timer);
      timer = setInterval(function () {
        var s = Math.max(0, Math.round((end - Date.now()) / 1e3));
        t.textContent = '剩余 ' + Math.floor(s / 60) + ' 分 ' + ('0' + s % 60).slice(-2) + ' 秒';
        if (!s) submit();
      }, 1000);
      document.getElementById('kx-submit').onclick = submit;
      function submit() {
        clearInterval(timer); t.hidden = true;
        var bySec = {}, right = 0;
        box.querySelectorAll('.kx-q').forEach(function (q) {
          if (q.classList.contains('is-done')) return;
          var pick = q.querySelector('.kx-opt.is-picked'), ok = !!pick && pick.getAttribute('data-ok') === '1', it = POOL.byId[q.getAttribute('data-qid')];
          q.classList.add('is-done'); if (pick) pick.style.outline = '';
          record(it.id, it.ch, ok); right += ok ? 1 : 0;
          var s = bySec[it.sec] || (bySec[it.sec] = { n: 0, ok: 0 }); s.n++; s.ok += ok ? 1 : 0;
        });
        var n = list.length, pct = Math.round(100 * right / n), d = db();
        d.m.push({ t: Date.now(), kind: 'mock', mode: mode, r: right, n: n, sec: bySec }); save(d);
        var rows = Object.keys(bySec).map(function (s) { var x = bySec[s], sc = CFG.sections[s] || {}; return '<tr><td><span class="kx-badge" style="--c:' + sc.color + '">' + esc(sc.label) + '</span></td><td class="n">' + x.ok + ' / ' + x.n + '</td><td class="n">' + Math.round(100 * x.ok / x.n) + '%</td></tr>'; }).join('');
        box.insertAdjacentHTML('afterbegin', '<p class="kx-score">' + right + ' / ' + n + '（' + pct + '%）' + (pct >= CFG.pass ? ' · 过了 ' + CFG.pass + '% 线' : ' · 未到 ' + CFG.pass + '% 线') + '</p>' +
          '<p class="sub">本站自设的「准备好了」门槛是稳定 ' + (CFG.gate || 80) + '% 以上。下面每题已亮出解析，错题已进间隔复习。</p><table class="kx-mx"><tr><th>板块</th><th class="n">对 / 题</th><th class="n">正确率</th></tr>' + rows + '</table>');
        paintBadges(); matrix(); box.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /* ③ 弱项矩阵 */
  function matrix() {
    var st = chapterStats(), d = db(), now = Date.now(), due = {};
    Object.keys(d.s).forEach(function (q) { var s = d.s[q]; if (s.c && s.due <= now) due[s.c] = (due[s.c] || 0) + 1; });
    var colors = { none: '#94a3b8', weak: '#dc2626', mid: '#d97706', good: '#16a34a' };
    var rows = CFG.chapters.slice().sort(function (a, b) {
      var la = level(st[a.ch]), lb = level(st[b.ch]), ord = { weak: 0, mid: 1, none: 2, good: 3 };
      return (ord[la] - ord[lb]) || a.priority.localeCompare(b.priority);
    }).map(function (c) {
      var x = st[c.ch], l = level(x), sc = CFG.sections[c.sec], pr = CFG.priority[c.priority];
      return '<tr><td style="border-left:5px solid ' + sc.color + '"><a href="' + c.ch + '.html">' + c.ch.slice(2) + ' ' + esc(c.title) + '</a></td>' +
        '<td><span class="kx-badge" style="--c:' + pr.color + '">' + c.priority + '</span></td>' +
        '<td class="kx-cell" style="background:' + colors[l] + '">' + LBL[l] + (x && x.n ? (l === 'none' ? '（' + x.n + ' 题，满 3 题出色）' : ' ' + Math.round(100 * x.ok / x.n) + '%') : '') + '</td>' +
        '<td class="n">' + (x ? x.n : 0) + '</td><td class="n">' + (due[c.ch] || 0) + '</td></tr>';
    }).join('');
    var mocks = d.m.filter(function (m) { return m.kind === 'mock'; }).slice(-5).map(function (m) { return new Date(m.t).toLocaleDateString() + '：' + m.r + '/' + m.n; }).join(' · ');
    document.getElementById('kx-matrix').innerHTML = '<div class="table-scroll"><table class="kx-mx"><tr><th>章</th><th>优先级</th><th>掌握度（最近作答）</th><th class="n">作答</th><th class="n">今日到期</th></tr>' + rows + '</table></div>' +
      '<p class="sub">最近模考：' + (mocks || '还没有') + '</p>';
  }

  /* ④ 间隔复习：到期的题；错过的题以变式题出现 */
  function srs() {
    getPool(function (p) {
      var d = db(), now = Date.now();
      var ids = Object.keys(d.s).filter(function (q) { return d.s[q].due <= now; }).sort(function (a, b) { return d.s[a].due - d.s[b].due; }).slice(0, 30);
      var list = ids.map(function (id) { var s = d.s[id]; return (s.wrong && p.byId[id + 'v']) ? p.byId[id + 'v'] : p.byId[id]; }).filter(Boolean);
      var box = document.getElementById('kx-srs');
      if (!list.length) { box.innerHTML = '<p>今天没有到期的题。去<a href="index.html">考点页</a>或<a href="#mock">模考</a>做新题。</p>'; return; }
      runSet(box, list, '今天到期 ' + list.length + ' 题。', function (r, n) { box.insertAdjacentHTML('beforeend', '<p class="kx-score">复习：' + r + ' / ' + n + '</p>'); matrix(); });
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-kx]'); if (!b) return;
    var k = b.getAttribute('data-kx');
    if (k === 'diag') diag(); else if (k === 'mock') mock(); else if (k === 'srs') srs();
    else if (k === 'export') { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(load())], { type: 'application/json' })); a.download = KEY.replace(':', '-') + '.json'; a.click(); }
    else if (k === 'reset' && confirm('清空本课的全部作答、复习与模考记录？')) { localStorage.removeItem(KEY); paintBadges(); matrix(); }
  });
  var imp = document.querySelector('[data-kx="import"]');
  if (imp) imp.addEventListener('change', function () {
    var f = imp.files[0]; if (!f) return; f.text().then(function (t) { try { JSON.parse(t); localStorage.setItem(KEY, t); paintBadges(); matrix(); } catch (e) { alert('不是有效的备份文件'); } });
  });
  matrix();
})();
