/* FINO site: the few things that move. A slow fade in, a header that
   firms up on scroll, the mobile menu, and the arrow that draws itself
   where the page talks about the path. */
/* analytics: Umami, no cookies. Paste the fino.website website ID from
   cloud.umami.is below. It only loads on the live domain. */
var UMAMI_ID = 'ace71e04-cfd0-4562-9449-0a93b6d4175a';
if (UMAMI_ID && location.hostname === 'fino.website') {
  var u = document.createElement('script');
  u.defer = true; u.src = 'https://cloud.umami.is/script.js';
  u.setAttribute('data-website-id', UMAMI_ID); u.setAttribute('data-domains', 'fino.website');
  document.head.appendChild(u);
}

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('solid', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var burger = document.querySelector('.burger'), drawer = document.querySelector('.drawer');
  if (burger && drawer) burger.addEventListener('click', function () {
    var open = drawer.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) items.forEach(function (n) { n.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  /* the arrow, in fine lines: amber from above, red from below, meeting
     at one point. Same geometry as the logo. */
  var NS = 'http://www.w3.org/2000/svg';
  var APEX = [27, 52.5, 92, 145.5], REACH = [22.5, 42.5, 62.5, 62.5], PITCH = 19.833, TIP = 145.5;
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
  document.querySelectorAll('svg[data-mark]').forEach(function (svg) {
    var dark = svg.getAttribute('data-mark') === 'dark';
    svg.setAttribute('viewBox', '0 0 620 560');
    var g = el('g', { transform: 'translate(63.2 280) scale(3.3)', fill: 'none', 'stroke-linecap': 'round' }, svg);
    var lines = [];
    for (var row = 3; row >= -3; row--) {
      if (!row) continue;
      var dy = row * PITCH, a = Math.abs(dy), from = 0;
      for (var k = 0; k < 4; k++) if (REACH[k] >= a - .5) { from = k; break; }
      lines.push(el('line', { x1: APEX[from] - a, y1: dy, x2: TIP - a, y2: dy, stroke: row < 0 ? '#FBB527' : '#EE3C23', 'stroke-width': 1, opacity: dark ? .5 : .45, 'vector-effect': 'non-scaling-stroke' }, g));
    }
    lines.push(el('line', { x1: APEX[0] - 10, y1: 0, x2: TIP + 6, y2: 0, stroke: '#F5822A', 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }, g));
    for (var i = 0; i < 4; i++) [-1, 1].forEach(function (d) {
      lines.push(el('line', { x1: APEX[i] - REACH[i], y1: d * REACH[i], x2: APEX[i], y2: 0, stroke: d < 0 ? '#FBB527' : '#EE3C23', 'stroke-width': 1.6 + i * .5, 'vector-effect': 'non-scaling-stroke' }, g));
    });
    el('circle', { cx: TIP, cy: 0, r: 1.5, fill: '#EE3C23' }, g);
    if (reduce) return;
    lines.forEach(function (l, j) {
      var len = Math.hypot(l.getAttribute('x2') - l.getAttribute('x1'), l.getAttribute('y2') - l.getAttribute('y1')) * 3.3 + 2;
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
      l.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1) ' + (j * .05) + 's';
    });
    var io2 = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { lines.forEach(function (l) { l.style.strokeDashoffset = 0; }); io2.disconnect(); }
    }, { threshold: .4 });
    io2.observe(svg);
  });

  /* the path line above the three steps: amber to red, drawn once */
  document.querySelectorAll('.arrow-line svg').forEach(function (svg) {
    var p = svg.querySelector('.run');
    if (!p || reduce) return;
    p.style.strokeDasharray = 100; p.style.strokeDashoffset = 100;
    p.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.7,.2,1)';
    var io3 = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { p.style.strokeDashoffset = 0; io3.disconnect(); } }, { threshold: .5 });
    io3.observe(svg);
  });
})();

/* testimonials: one voice at a time, slow, pauses on hover. On phones and
   touch screens they never move on their own: people swipe or tap the dots,
   because a quote that changes while you read it is a quote you miss. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = window.matchMedia('(max-width: 760px), (hover: none)').matches;
  document.querySelectorAll('[data-testi]').forEach(function (band) {
    var figs = band.querySelectorAll('.testi-stage figure'), dots = band.querySelectorAll('.testi-nav button');
    if (!figs.length) return;
    var i = 0, timer = null;
    function show(n) {
      i = (n + figs.length) % figs.length;
      figs.forEach(function (f, k) { f.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function play() { if (!reduce && !still) { stop(); timer = setInterval(function () { show(i + 1); }, 8000); } }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); play(); }); });
    band.addEventListener('mouseenter', stop);
    band.addEventListener('mouseleave', play);
    var x0 = null, y0 = null;
    band.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    band.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
    }, { passive: true });
    show(0); play();
  });
})();

/* section bar: underline the section being read, keep it in view on phones */
(function () {
  var bar = document.querySelector('.subnav');
  if (!bar || !('IntersectionObserver' in window)) return;
  var row = bar.querySelector('.wrap'), links = [].slice.call(bar.querySelectorAll('a')), byId = {};
  links.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) byId[t.id] = a; });
  function mark(a) {
    links.forEach(function (l) { if (l !== a) l.removeAttribute('aria-current'); });
    if (!a) return;
    a.setAttribute('aria-current', 'true');
    if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) mark(byId[e.target.id]); });
  }, { rootMargin: '-35% 0px -60% 0px' });
  Object.keys(byId).forEach(function (id) { io.observe(document.getElementById(id)); });
  var first = document.getElementById(Object.keys(byId)[0]);
  window.addEventListener('scroll', function () {
    if (first && first.getBoundingClientRect().top > window.innerHeight * .4) mark(null);
  }, { passive: true });
})();

/* scheduler sign-up: send the email, then open the scheduler straight away */
document.querySelectorAll('.magnet-form').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = f.querySelector('button'), next = f.getAttribute('data-next'), gone = false;
    function go() { if (!gone) { gone = true; window.location.href = next; } }
    b.disabled = true; b.textContent = 'Opening the scheduler';
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } }).then(go, go);
    setTimeout(go, 4000);
  });
});
