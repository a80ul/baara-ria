/* Tujuan: pembaca PDF 7 halaman. Loader tampil tiap buka, tiap gambar punya status muat dan gagal, zoom bisa keyboard, fokus dikunci di lightbox. */
(function () {
  'use strict';

  /* Loader: sembunyi setelah gambar siap, minimal tampil selama sapuan */
  var loader = document.getElementById('loader');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = Date.now();
  var MIN = 1400;
  document.body.style.overflow = 'hidden';

  function hideLoader() {
    if (!loader || loader.classList.contains('done')) return;
    loader.classList.add('done');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 500);
  }

  function tryHide() {
    var wait = reduced ? 0 : MIN - (Date.now() - t0);
    if (wait <= 0) hideLoader();
    else window.setTimeout(hideLoader, wait);
  }
  window.addEventListener('load', tryHide);
  window.setTimeout(hideLoader, 4500);
  if (document.readyState === 'complete') tryHide();

  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.pagenav a, .sidenav a'));
  var count = document.getElementById('count');
  var sideCount = document.getElementById('sideCount');
  var bar = document.getElementById('progress');
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbErr = document.getElementById('lbErr');
  var lbRetry = document.getElementById('lbRetry');
  var lbX = document.getElementById('lbX');
  var pop = document.getElementById('pop');
  var popBack = document.getElementById('popBack');
  var popCancel = document.getElementById('popCancel');
  var popGo = document.getElementById('popGo');
  var dlOpener = null;
  var current = 0;
  var lastFocus = null;

  var caps = ['Sampul', 'Hal 1: Smoked and Grilled', 'Hal 2: Classic Beef', 'Hal 3: Sup Nusantara', 'Hal 4: Nasi dan Lontong', 'Hal 5: Sambal', 'Hal 6: Minuman'];
  var srcs = pages.map(function (f) { return f.querySelector('img').getAttribute('src'); });

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    bar.style.transform = 'scaleX(' + p + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!pages.length) {
    var doc = document.querySelector('.doc');
    var p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Menu belum tersedia.';
    doc.appendChild(p);
  }

  // status tiap gambar: memuat, siap, gagal + tombol ulangi
  pages.forEach(function (f, i) {
    var img = f.querySelector('img');
    var ph = null;
    function clearPh() { if (ph && ph.parentNode) ph.parentNode.removeChild(ph); ph = null; }
    function clearErr() { var e = f.querySelector('.err'); if (e && e.parentNode) e.parentNode.removeChild(e); }
    function setErr() {
      clearPh();
      clearErr();
      var box = document.createElement('div');
      box.className = 'err';
      var t = document.createElement('p');
      t.textContent = 'Gambar halaman ' + (i + 1) + ' gagal dimuat.';
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Muat ulang';
      b.addEventListener('click', function () {
        clearErr();
        ph = document.createElement('div');
        ph.className = 'ph';
        ph.textContent = 'Memuat gambar...';
        f.insertBefore(ph, img);
        img.src = srcs[i] + (srcs[i].indexOf('?') < 0 ? '?r=' : '&r=') + Date.now();
      });
      box.appendChild(t);
      box.appendChild(b);
      f.insertBefore(box, img);
    }
    if (img.complete) {
      if (img.naturalWidth === 0) setErr();
    } else {
      ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = 'Memuat gambar...';
      f.insertBefore(ph, img);
      img.addEventListener('load', function () { clearPh(); clearErr(); });
      img.addEventListener('error', setErr);
    }
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = pages.indexOf(e.target);
        if (i < 0) return;
        current = i;
        var label = (i + 1) + ' / ' + pages.length;
        if (count) count.textContent = label;
        if (sideCount) sideCount.textContent = label;
        links.forEach(function (a, k) { a.classList.toggle('on', k % pages.length === i); });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    pages.forEach(function (pg) { io.observe(pg); });
  }

  function lbButtons() {
    var all = [lbX, document.getElementById('lbPrev'), document.getElementById('lbNext'), lbRetry];
    return all.filter(function (b) { return b && !b.hidden && b.offsetParent !== null; });
  }

  function open(i, opener) {
    current = (i + pages.length) % pages.length;
    lastFocus = opener || document.activeElement;
    lbErr.hidden = true;
    lbRetry.hidden = true;
    lbImg.alt = 'Perbesaran: ' + caps[current];
    lbImg.src = srcs[current];
    lbCap.textContent = caps[current] + '  |  ' + (current + 1) + ' / ' + pages.length;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbX.focus();
  }
  function close() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  
  function openPop(opener) {
    dlOpener = opener || document.activeElement;
    pop.hidden = false;
    popBack.hidden = false;
    popGo.focus();
  }
  function closePop() {
    pop.hidden = true;
    popBack.hidden = true;
    if (dlOpener && dlOpener.focus) dlOpener.focus();
  }
  document.getElementById('dlSide').addEventListener('click', function () { openPop(this); });
  document.getElementById('dlFoot').addEventListener('click', function () { openPop(this); });
  popCancel.addEventListener('click', closePop);
  popBack.addEventListener('click', closePop);
  popGo.addEventListener('click', function () { window.location.href = 'https://arcivamile.my.id/arsip'; });

  lbImg.addEventListener('load', function () { lbErr.hidden = true; lbRetry.hidden = true; });
  lbImg.addEventListener('error', function () { lbErr.hidden = false; lbRetry.hidden = false; });
  lbRetry.addEventListener('click', function () {
    lbErr.hidden = true;
    lbRetry.hidden = true;
    lbImg.src = srcs[current] + (srcs[current].indexOf('?') < 0 ? '?r=' : '&r=') + Date.now();
  });

  pages.forEach(function (f, i) {
    var img = f.querySelector('img');
    img.addEventListener('click', function () { open(i, img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, img); }
    });
  });
  lbX.addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { open(current - 1, document.activeElement); });
  document.getElementById('lbNext').addEventListener('click', function () { open(current + 1, document.activeElement); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!pop.hidden && e.key === 'Escape') { closePop(); return; }
    if (lb.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { open(current - 1, document.activeElement); return; }
    if (e.key === 'ArrowRight') { open(current + 1, document.activeElement); return; }
    if (e.key === 'Tab') {
      var btns = lbButtons();
      if (!btns.length) return;
      var first = btns[0];
      var last = btns[btns.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
