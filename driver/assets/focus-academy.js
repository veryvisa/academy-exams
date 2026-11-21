/* 专注卡的本站胶水（播放器本体 focus.js 是正本逐字拷贝，别改它）。
   ① html[data-lang] 跟随本站阅读模式：备考页的 exam.js 设 html[data-kx-lang]，讲解页可能没有 exam.js，就读本机记的 kx:lang；默认中文。
   ② 题目卡点选即判分：把对错记进备考中心同一份作答记录（exam.js 暴露的 window.KX.record → 间隔复习＝错题本、弱项矩阵）。
      没有 exam.js 的页不记（那类页也没有题目卡）。localStorage 读写都在 exam.js 里 try/catch。 */
(function () {
  'use strict';
  var H = document.documentElement;
  function sync() {
    var m = H.getAttribute('data-kx-lang');
    if (!m) { try { m = localStorage.getItem('kx:lang'); } catch (e) { m = null; } }
    m = (m === 'en' || m === 'both') ? m : 'zh';
    if (H.getAttribute('data-lang') !== m) H.setAttribute('data-lang', m);
  }
  sync();
  if (window.MutationObserver) new MutationObserver(sync).observe(H, { attributes: true, attributeFilter: ['data-kx-lang'] });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fd-ov .fd-opt');
    if (!b) return;
    var card = b.closest('.fd-card');
    if (!card || card.classList.contains('fd-rev')) return;     // 已亮答案后再点不算第二次作答
    var mk = card.querySelector('.kx-fdq');
    if (!mk || !window.KX || !window.KX.record) return;
    var ok = String(b.getAttribute('data-j')) === mk.getAttribute('data-a');
    try { window.KX.record(mk.getAttribute('data-qid'), mk.getAttribute('data-ch'), ok); } catch (err) { }
  }, true);
})();
