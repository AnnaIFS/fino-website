/* ============================================================
   FINO v2
   Navigation, scroll reveals, and the generated illustrations.
   Every illustration is drawn here as SVG rather than loaded as
   an image: a few KB, sharp at any size, and it takes its colour
   from the stylesheet.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.className += ' js';

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- shared pieces ---------- */

  /* A stroke is only as thick as the drawing's scale makes it. These
     illustrations render at very different sizes, so each declares the
     width it actually occupies on screen and then asks for weights,
     lengths and type in CSS pixels. Nothing lands on a half pixel. */
  function gauge(vbW, cssW) {
    var k = cssW / vbW;
    return {
      k: k,
      w: function (p) { return +(p / k).toFixed(2); },
      u: function (p) { return +(p / k).toFixed(1); },
      t: function (p) { return Math.round(p / k); }
    };
  }
  var HAIR = 0.75, LINE = 0.9, KEY = 1.1, EDGE = 1.3;

  // the paper the diagrams sit on: a registration field, centred so all
  // four margins match
  function backdrop(g, w, h, step, dotR) {
    step = step || 42; dotR = dotR || 1.2;
    var nx = Math.max(2, Math.floor(w / step)), ny = Math.max(2, Math.floor(h / step));
    var ox = (w - (nx - 1) * step) / 2, oy = (h - (ny - 1) * step) / 2, i, j;
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++)
      g.appendChild(el('circle', { cx: (ox + i * step).toFixed(1), cy: (oy + j * step).toFixed(1), r: dotR, fill: 'var(--grid)' }));
  }

  function label(x, y, text, anchor, colour, size) {
    size = size || 15;
    var t = el('text', { x: x, y: y, 'text-anchor': anchor, fill: colour,
      'font-size': size, 'letter-spacing': (size * 0.09).toFixed(2) });
    t.textContent = text;
    return t;
  }

  function datum(svg, w, h, text, G) {
    var g = el('g', {}), y = h - G.u(20), x = G.u(22);
    g.appendChild(el('line', { x1: x, y1: y, x2: x + G.u(34), y2: y, stroke: 'var(--rule-strong)', 'stroke-width': G.w(LINE) }));
    g.appendChild(label(x + G.u(46), y + G.u(4), text, 'start', 'var(--dim)', G.t(10)));
    svg.appendChild(g);
  }

  /* the inner layer: a contour field. Amplitude is held under half the
     line spacing so the lines never cross, and a sine envelope gives the
     disc a light side instead of pseudo-random dirt. */
  function contour(g, cx, cy, r, lines, colour, G) {
    lines = lines || 20; G = G || gauge(1, 0.7);
    for (var i = 0; i < lines; i++) {
      var base = cy - r + i * ((2 * r) / (lines - 1));
      var d = 'M ' + (cx - r - 18) + ' ' + base.toFixed(1);
      for (var t = 1; t <= 34; t++) {
        var px = (cx - r - 18) + t * ((2 * r + 36) / 34);
        var k = (i * 0.42) + (t * 0.26);
        var py = base + Math.sin(k) * (r * 0.018) + Math.sin(k * 0.47 + i * 0.9) * (r * 0.012) + Math.cos(t * 0.16 + i * 0.31) * (r * 0.008);
        d += ' L ' + px.toFixed(1) + ' ' + py.toFixed(1);
      }
      g.appendChild(el('path', { d: d, fill: 'none', stroke: colour || 'var(--inner)',
        'stroke-width': (i % 4 === 0 ? G.w(KEY) : G.w(LINE)),
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        opacity: (0.28 + 0.42 * Math.sin(Math.PI * i / (lines - 1))).toFixed(2) }));
    }
  }

  /* the outer layer: instrumentation. Golden-angle nodes, so there are no
     spiral arms, and five rings with alternating weight instead of ten
     identical ones that moire. */
  function radial(g, cx, cy, r, colour, G) {
    colour = colour || 'var(--outer-line)'; G = G || gauge(1, 0.7);
    var a, ang;
    for (a = 0; a < 16; a++) {
      ang = a * (Math.PI * 2 / 16);
      g.appendChild(el('line', { x1: cx, y1: cy,
        x2: (cx + Math.cos(ang) * (r + 6)).toFixed(1), y2: (cy + Math.sin(ang) * (r + 6)).toFixed(1),
        stroke: colour, 'stroke-width': (a % 4 === 0 ? G.w(KEY) : G.w(HAIR)),
        opacity: (a % 4 === 0 ? 0.44 : 0.22) }));
    }
    [0.16, 0.28, 0.40, 0.52, 0.64, 0.76, 0.88, 0.97].forEach(function (f, i) {
      g.appendChild(el('circle', { cx: cx, cy: cy, r: (r * f).toFixed(1), fill: 'none', stroke: colour,
        'stroke-width': (i % 2 ? G.w(LINE) : G.w(KEY)), opacity: (i % 2 ? 0.20 : 0.32) }));
    });
  }

  /* one person: a self at the centre with parts around it. Holds from
     r=34 down to r=9 by shedding detail rather than shrinking it. An open
     ring stops reading below about 1.6px of drawn radius. */
  function glyph(g, cx, cy, r, sats, colour, lw) {
    colour = colour || 'var(--inner)';
    lw = lw || Math.max(1, r * 0.05 + 0.7);
    g.appendChild(el('circle', { cx: cx, cy: cy, r: r, fill: 'var(--ground)', stroke: colour, 'stroke-width': lw }));
    if (r < 9) { g.appendChild(el('circle', { cx: cx, cy: cy, r: (r * 0.30).toFixed(2), fill: colour })); return; }
    g.appendChild(el('circle', { cx: cx, cy: cy, r: (r * 0.22).toFixed(2), fill: colour }));
    for (var i = 0; i < sats; i++) {
      var a = i * (Math.PI * 2 / sats) - Math.PI / 2.4;
      var px = cx + Math.cos(a) * r * 0.60, py = cy + Math.sin(a) * r * 0.60;
      if (r < 15) {
        g.appendChild(el('circle', { cx: px.toFixed(1), cy: py.toFixed(1), r: (r * 0.15).toFixed(2), fill: colour, opacity: 0.85 }));
      } else {
        g.appendChild(el('line', { x1: cx, y1: cy, x2: px.toFixed(1), y2: py.toFixed(1), stroke: colour,
          'stroke-width': (lw * 0.55).toFixed(2), opacity: 0.45 }));
        g.appendChild(el('circle', { cx: px.toFixed(1), cy: py.toFixed(1), r: (r * 0.115).toFixed(2),
          fill: 'var(--ground)', stroke: colour, 'stroke-width': (lw * 0.7).toFixed(2) }));
      }
    }
  }

  function bloom(svg, cx, cy, r, colour, strength) {
    var id = 'bl-' + Math.round(cx) + '-' + Math.round(cy) + '-' + (colour === 'var(--outer-line)' ? 'o' : 'i');
    var defs = el('defs', {}), rg = el('radialGradient', { id: id });
    rg.appendChild(el('stop', { offset: '0', 'stop-color': colour, 'stop-opacity': String(strength || 0.14) }));
    rg.appendChild(el('stop', { offset: '1', 'stop-color': colour, 'stop-opacity': '0' }));
    defs.appendChild(rg); svg.appendChild(defs);
    svg.appendChild(el('circle', { cx: cx, cy: cy, r: r, fill: 'url(#' + id + ')', 'class': 'art-bloom' }));
  }

  function drift(node, seconds, px) {
    if (reduce) return;
    node.style.animation = 'artDrift ' + (seconds || 16) + 's ease-in-out infinite alternate';
    node.style.setProperty('--drift', (px || 7) + 'px');
  }
  function turn(node, cx, cy, seconds) {
    if (reduce) return;
    node.style.transformOrigin = cx + 'px ' + cy + 'px';
    node.style.animation = 'artTurn ' + (seconds || 190) + 's linear infinite';
  }


  /* ---------- the illustrations ---------- */

  var ART = {



    /* THE MARK, AT SCALE.

       Measured off the logo rather than invented. The FINO mark is four
       nested chevrons whose apexes sit on one horizontal line at x = 27,
       52.5, 92 and 145.5, arms at exactly 45 degrees, crossed by seven
       rungs on a twenty unit pitch. Every apex is a place where a line
       coming down from above and a line coming up from below arrive at
       the same point. Four of those, marching right, the last one being
       the tip.

       So the drawing is the logo uncropped and drawn fine instead of
       solid: outer amber above the axis, inner coral below, the rungs
       weaving the two into one fabric, and the whole thing resolving to
       a single point. The animation lets each pair arrive in turn. */
    mark: function (svg) {
      var W = 620, H = 560, i;
      var G = gauge(W, 560);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

      var S = 3.3, OX = 63.2, CY = 280;          // logo units to canvas
      var APEX  = [27, 52.5, 92, 145.5];         // where each pair meets
      var REACH = [22.5, 42.5, 62.5, 62.5];      // how far the arms run
      var PITCH = 19.833, ROWS = 3;              // rungs above and below the axis
      var X = function (a) { return +(OX + a * S).toFixed(1); };
      var Y = function (d) { return +(CY + d * S).toFixed(1); };

      var AMBER = 'var(--outer-line)', CORAL = 'var(--inner)';
      var TIP = APEX[APEX.length - 1], EDGE_U = (H / S) / 2 + 12;

      function line(x1, y1, x2, y2, colour, wpx, op, cls) {
        var n = el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: colour,
          'stroke-width': G.w(wpx), 'stroke-linecap': 'round', opacity: op.toFixed(3) });
        if (cls) n.setAttribute('class', cls);
        svg.appendChild(n);
        return n;
      }

      /* one chevron: a line arriving from above and a line arriving from
         below, meeting at a single point on the axis */
      function chevron(apex, reach, colour_less, wpx, op, cls) {
        return [-1, 1].map(function (dir) {
          return line(X(apex - reach), Y(dir * reach), X(apex), Y(0),
                      dir < 0 ? AMBER : CORAL, wpx, op, cls);
        });
      }

      /* THE BODY. Six bands, stepped the way the mark is stepped, filled
         so faintly they are closer to light than to colour. They are what
         stops this reading as a diagram. Strongest against the axis, because
         that is where the two families are already one thing. */
      var RUNG = [-3, -2, -1, 0, 1, 2, 3].map(function (r) { return r * PITCH; });
      function leftAt(d) {
        for (var q = 0; q < 4; q++) if (REACH[q] >= Math.abs(d) - 0.5) return APEX[q];
        return APEX[3];
      }
      for (i = 0; i < 6; i++) {
        var d1 = RUNG[i], d2 = RUNG[i + 1];
        var out = Math.max(Math.abs(d1), Math.abs(d2));
        var lx = leftAt(out), band = 3 - Math.round(out / PITCH);   // 1 outer .. 3 inner
        svg.appendChild(el('polygon', {
          points: [[X(lx - Math.abs(d1)), Y(d1)], [X(TIP - Math.abs(d1)), Y(d1)],
                   [X(TIP - Math.abs(d2)), Y(d2)], [X(lx - Math.abs(d2)), Y(d2)]]
                  .map(function (q) { return q[0] + ',' + q[1]; }).join(' '),
          fill: (d1 + d2) < 0 ? AMBER : CORAL,
          opacity: (0.024 + band * 0.021).toFixed(3), 'class': 'mk-body'
        }));
      }

      /* the arms carry on past where the mark stops. the logo crops them and
         this is what the crop implies: lines that were already travelling */
      for (i = 0; i < 4; i++) {
        [-1, 1].forEach(function (dir) {
          var r = REACH[i], far = (H / S) / 2 + 14;
          line(X(APEX[i] - r), Y(dir * r), X(APEX[i] - far), Y(dir * far),
               dir < 0 ? AMBER : CORAL, HAIR, 0.15, 'mk-soft');
        });
      }

      /* the rungs. drawn under the arms so the arms sit on top */
      var rungs = [], row, dy, from, k;
      for (row = ROWS; row >= -ROWS; row--) {
        if (row === 0) continue;                 // the axis is its own thing
        dy = row * PITCH;
        from = -1;
        for (k = 0; k < 4; k++) if (REACH[k] >= Math.abs(dy) - 0.5) { from = k; break; }
        if (from < 0) continue;
        var a2 = Math.abs(dy);
        rungs.push(line(X(APEX[from] - a2), Y(dy), X(TIP - a2), Y(dy),
                        row < 0 ? AMBER : CORAL, HAIR, 0.62, 'mk-rung'));
      }

      /* THE MARK. Four meetings, each further forward and each more certain
         than the one before it. The fourth is the point. */
      var arms = [], WT = [LINE, LINE, KEY, KEY], OP = [0.62, 0.76, 0.9, 1];
      for (i = 0; i < 4; i++) {
        chevron(APEX[i], REACH[i], null, WT[i], OP[i], 'mk-arm').forEach(function (n) {
          arms.push({ i: i, n: n, len: Math.SQRT2 * REACH[i] * S });
        });
      }

      /* the axis the four meetings sit on, coral running into amber.
         user space, because a horizontal line has no height to scale a
         gradient against */
      var ax1 = X(APEX[0]), ax2 = X(TIP), axLen = ax2 - ax1;
      var defs = el('defs', {}), lg = el('linearGradient', { id: 'mk-ax',
        gradientUnits: 'userSpaceOnUse', x1: ax1, y1: CY, x2: ax2, y2: CY });
      lg.appendChild(el('stop', { offset: '0', 'stop-color': 'var(--inner)' }));
      lg.appendChild(el('stop', { offset: '.55', 'stop-color': 'var(--outer-line)' }));
      lg.appendChild(el('stop', { offset: '1', 'stop-color': 'var(--outer-line)' }));
      defs.appendChild(lg); svg.appendChild(defs);
      var axis = line(ax1, CY, ax2, CY, 'url(#mk-ax)', KEY, 0.95, 'mk-axis');

      /* a slow light travelling that axis once the drawing has settled */
      var sheen = line(ax1, CY, ax2, CY, AMBER, EDGE, 0.9, 'mk-sheen');
      sheen.style.strokeDasharray = '20 ' + (axLen - 20).toFixed(0);

      /* the two families, named once so the drawing explains itself */
      svg.appendChild(label(X(APEX[1] - REACH[1]) - 16, Y(-REACH[1]) + 4,
                            'OUTER', 'end', 'var(--dim)', G.t(10)));
      svg.appendChild(label(X(APEX[1] - REACH[1]) - 16, Y(REACH[1]) + 4,
                            'INNER', 'end', 'var(--dim)', G.t(10)));

      if (reduce) return;

      var far = svg.querySelectorAll('.mk-soft'), body = svg.querySelectorAll('.mk-body'),
          texts = svg.querySelectorAll('text');
      function hold(n, d) { n.style.opacity = '0'; n.style.transition = 'opacity .7s ease ' + d + 's'; }
      // the lines that were already travelling come first, the body last:
      // structure before mass, the way a drawing is actually made
      Array.prototype.forEach.call(far, function (n) { hold(n, 0.15); });
      Array.prototype.forEach.call(body, function (n, k) { hold(n, +(1.45 + k * 0.06).toFixed(2)); });
      Array.prototype.forEach.call(texts, function (n) { hold(n, 2.15); });

      arms.forEach(function (o) {
        o.n.style.strokeDasharray = o.len.toFixed(0);
        o.n.style.strokeDashoffset = o.len.toFixed(0);
        o.n.style.transition = 'stroke-dashoffset .95s cubic-bezier(.22,.72,.24,1) ' +
                               (0.20 + o.i * 0.19).toFixed(2) + 's';
      });
      rungs.forEach(function (n, idx) { hold(n, +(0.85 + idx * 0.055).toFixed(2)); });

      axis.style.strokeDasharray = axLen.toFixed(0);
      axis.style.strokeDashoffset = axLen.toFixed(0);
      axis.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.25,1) 1.30s';

      sheen.style.opacity = '0';
      sheen.style.strokeDashoffset = '0';

      requestAnimationFrame(function () {
        setTimeout(function () {
          Array.prototype.forEach.call(far, function (n) { n.style.opacity = ''; });
          Array.prototype.forEach.call(body, function (n) { n.style.opacity = ''; });
          Array.prototype.forEach.call(texts, function (n) { n.style.opacity = ''; });
          arms.forEach(function (o) { o.n.style.strokeDashoffset = '0'; });
          rungs.forEach(function (n) { n.style.opacity = ''; });
          setTimeout(function () {
            sheen.style.opacity = '';
            sheen.setAttribute('class', 'mk-sheen mk-run');
          }, 2500);
        }, 140);
      });
    },

    /* WHERE THEY MEET.

       The hero shows the two families arriving at points. This is the same
       two families seen closer in, at the one place the page is about: the
       band where they overlap. Above it only outer lines, below it only
       inner ones, and through the middle both, crossing over and under each
       other the way the logo's own lattice does. Change is what happens in
       that band. */
    meet: function (svg) {
      var W = 1200, H = 340, CY = 170, P = 112, i, j;
      var G = gauge(W, 1100);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var AMBER = 'var(--outer-line)', CORAL = 'var(--inner)';
      var TOP = CY - 58, BOT = CY + 58;          // the band where both exist

      /* each family is brightest where it meets the other and thins out
         toward the edge it came from */
      var defs = el('defs', {});
      [['mt-o', AMBER, 0], ['mt-i', CORAL, 1]].forEach(function (g) {
        var lg = el('linearGradient', { id: g[0], gradientUnits: 'userSpaceOnUse',
          x1: 0, y1: g[2] ? H : 0, x2: 0, y2: g[2] ? 0 : H });
        [[0, 0.10], [0.5, 0.95], [0.62, 0.30], [1, 0.06]].forEach(function (st) {
          lg.appendChild(el('stop', { offset: st[0], 'stop-color': g[1], 'stop-opacity': st[1] }));
        });
        defs.appendChild(lg);
      });
      var ax = el('linearGradient', { id: 'mt-ax', gradientUnits: 'userSpaceOnUse',
        x1: 0, y1: 0, x2: W, y2: 0 });
      ax.appendChild(el('stop', { offset: '0', 'stop-color': CORAL }));
      ax.appendChild(el('stop', { offset: '1', 'stop-color': AMBER }));
      defs.appendChild(ax);
      svg.appendChild(defs);

      /* the band itself, split at the axis the way the mark is */
      [[TOP, CY, AMBER], [CY, BOT, CORAL]].forEach(function (b) {
        svg.appendChild(el('rect', { x: 0, y: b[0], width: W, height: b[1] - b[0],
          fill: b[2], opacity: 0.05, 'class': 'mt-body' }));
      });

      /* outer comes down from above and stops at the far side of the band.
         inner comes up from below and stops at the near side. so above the
         band there is only one of them, and through it there are both. */
      var fams = [
        { y0: 0, y1: BOT, dir: 1,  paint: 'url(#mt-o)', cls: 'mt-o' },
        { y0: H, y1: TOP, dir: -1, paint: 'url(#mt-i)', cls: 'mt-i' }
      ], lines = [];
      fams.forEach(function (f) {
        var span = Math.abs(f.y1 - f.y0);
        for (i = -Math.ceil(H / P) - 1; i * P < W + H; i++) {
          var x0 = i * P, x1 = x0 + span;
          if (x1 < -4 || x0 > W + 4) continue;
          lines.push({ n: svg.appendChild(el('line', { x1: x0, y1: f.y0, x2: x1, y2: f.y1,
            stroke: f.paint, 'stroke-width': G.w(LINE), 'class': 'mt-line' })),
            len: Math.SQRT2 * span, x: x0 });
        }
      });

      /* the weave. at every other crossing the outer line is redrawn on top of
         the inner one, so the two read as woven rather than stacked */
      for (i = -Math.ceil(H / P) - 1; i * P < W + H; i++) {
        for (j = -Math.ceil(H / P) - 1; j * P < W + H; j++) {
          var cx = (i * P + j * P + H) / 2, cy = (j * P - i * P + H) / 2 + 0;
          cx = (i * P + (j * P + H)) / 2; cy = ((j * P + H) - i * P) / 2;
          if (cy < TOP + 3 || cy > BOT - 3 || cx < -6 || cx > W + 6) continue;
          if ((i + j) % 2) continue;
          svg.appendChild(el('line', { x1: (cx - 7).toFixed(1), y1: (cy - 7).toFixed(1),
            x2: (cx + 7).toFixed(1), y2: (cy + 7).toFixed(1), stroke: AMBER,
            'stroke-width': G.w(LINE), opacity: 0.9, 'class': 'mt-weave' }));
        }
      }

      /* the edges of the band, and the axis running through it */
      var rungs = [
        svg.appendChild(el('line', { x1: 0, y1: TOP, x2: W, y2: TOP, stroke: AMBER,
          'stroke-width': G.w(HAIR), opacity: 0.45, 'class': 'mt-rung' })),
        svg.appendChild(el('line', { x1: 0, y1: BOT, x2: W, y2: BOT, stroke: CORAL,
          'stroke-width': G.w(HAIR), opacity: 0.45, 'class': 'mt-rung' }))
      ];
      var axis = svg.appendChild(el('line', { x1: 0, y1: CY, x2: W, y2: CY,
        stroke: 'url(#mt-ax)', 'stroke-width': G.w(KEY), opacity: 0.95, 'class': 'mt-axis' }));

      /* the label knocks a hole in the weave so it stays readable */
      var txt = 'THE WORK IS HERE', size = G.t(11), plate = size * (txt.length * 0.78);
      var lab = el('g', { 'class': 'mt-lab' });
      lab.appendChild(el('rect', { x: (W / 2 - plate / 2).toFixed(0), y: (CY - size * 1.5).toFixed(0),
        width: plate.toFixed(0), height: (size * 3).toFixed(0), fill: 'var(--tint)' }));
      lab.appendChild(label(W / 2, CY + size * 0.38, txt, 'middle', 'var(--ink)', size));
      svg.appendChild(lab);

      if (reduce) return;

      var weave = svg.querySelectorAll('.mt-weave'), body = svg.querySelectorAll('.mt-body');
      function fade(n, d, t) { n.style.opacity = '0'; n.style.transition = 'opacity ' + (t || 0.7) + 's ease ' + d + 's'; }
      lines.forEach(function (o) {
        o.n.style.strokeDasharray = o.len.toFixed(0);
        o.n.style.strokeDashoffset = o.len.toFixed(0);
        o.n.style.transition = 'stroke-dashoffset 1.05s cubic-bezier(.24,.74,.24,1) ' +
                               (0.05 + Math.max(0, o.x) / W * 0.55).toFixed(2) + 's';
      });
      Array.prototype.forEach.call(weave, function (n, k) { fade(n, +(0.95 + (k % 24) * 0.012).toFixed(2), 0.5); });
      Array.prototype.forEach.call(body, function (n) { fade(n, 1.15); });
      rungs.forEach(function (n, k) { fade(n, 0.8 + k * 0.08); });
      axis.style.strokeDasharray = W; axis.style.strokeDashoffset = W;
      axis.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.3,.7,.25,1) .55s';
      fade(lab, 1.55);

      function play() {
        lines.forEach(function (o) { o.n.style.strokeDashoffset = '0'; });
        Array.prototype.forEach.call(weave, function (n) { n.style.opacity = ''; });
        Array.prototype.forEach.call(body, function (n) { n.style.opacity = ''; });
        rungs.forEach(function (n) { n.style.opacity = ''; });
        axis.style.strokeDashoffset = '0';
        lab.style.opacity = '';
      }
      // this one sits far enough down the page that it should draw when it is
      // reached, not while nobody is looking at it
      if (window.IntersectionObserver) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { play(); io.unobserve(e.target); } });
        }, { threshold: 0.25 });
        io.observe(svg);
      } else { requestAnimationFrame(function () { setTimeout(play, 140); }); }
    },

    /* THE CIRCLE.

       The mark in polar. On the home page two lines meet at a point; here two
       arcs meet at two, because that is what a circle is. Outer amber over the
       axis, inner coral under it, four rings on the mark's own growing spacing,
       radial rungs where the mark has horizontal ones.

       Every ring is whole. They draw from the axis outward and close on the far
       side, so the coming together happens in the movement and what is left
       standing is four complete circles. */
    ring: function (svg) {
      var W = 560, C = W / 2, i, k;
      var G = gauge(W, 500);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + W);
      var AMBER = 'var(--outer-line)', CORAL = 'var(--inner)';
      var R    = [80, 116, 164, 224];            // gaps of 36, 48, 60, as the mark grows
      var SPAN = [180, 180, 180, 180];           // every ring closes
      var SPOKE = [43, 86, 130];                 // where the mark has its rungs
      var FROM  = [0, 1, 2];                     // and how far in each one starts, as the mark steps
      var WT = [LINE, LINE, KEY, KEY], OP = [0.6, 0.74, 0.88, 1];
      var RAD = Math.PI / 180;

      function pt(r, deg) { return [(C + r * Math.cos(deg * RAD)).toFixed(1),
                                    (C - r * Math.sin(deg * RAD)).toFixed(1)]; }
      function arc(r, from, to, colour, wpx, op, cls) {
        var p0 = pt(r, from), p1 = pt(r, to), big = Math.abs(to - from) > 180 ? 1 : 0;
        var sweep = to > from ? 0 : 1;           // y is down, so the sense flips
        var n = el('path', { d: 'M ' + p0[0] + ' ' + p0[1] + ' A ' + r + ' ' + r +
            ' 0 ' + big + ' ' + sweep + ' ' + p1[0] + ' ' + p1[1],
          fill: 'none', stroke: colour, 'stroke-width': G.w(wpx),
          'stroke-linecap': 'round', opacity: op, 'class': cls });
        svg.appendChild(n);
        return n;
      }

      /* the body, in bands, the same way the mark is banded. faint enough to
         be light rather than colour, strongest against the axis */
      function sector(r1, r2, span, dir, colour, op) {
        var a = span * dir, p1 = pt(r1, 0), p2 = pt(r1, a), p3 = pt(r2, a), p4 = pt(r2, 0);
        var big = span > 180 ? 1 : 0, sw = dir > 0 ? 0 : 1;
        svg.appendChild(el('path', { d:
          'M ' + p1[0] + ' ' + p1[1] + ' A ' + r1 + ' ' + r1 + ' 0 ' + big + ' ' + sw + ' ' + p2[0] + ' ' + p2[1] +
          ' L ' + p3[0] + ' ' + p3[1] + ' A ' + r2 + ' ' + r2 + ' 0 ' + big + ' ' + (1 - sw) + ' ' + p4[0] + ' ' + p4[1] + ' Z',
          fill: colour, opacity: op.toFixed(3), 'class': 'rg-body' }));
      }
      for (i = 0; i < 3; i++) {
        [1, -1].forEach(function (dir) {
          sector(R[i], R[i + 1], 180, dir, dir > 0 ? AMBER : CORAL, 0.072 - i * 0.020);
        });
      }

      /* the rungs, radial. each runs from the innermost ring that has reached
         that far round, out to the ring that closes */
      var rungs = [];
      SPOKE.forEach(function (deg) {
        [1, -1].forEach(function (dir) {
          var from = FROM[SPOKE.indexOf(deg)];
          var p0 = pt(R[from], deg * dir), p1 = pt(R[3], deg * dir);
          rungs.push(svg.appendChild(el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1],
            stroke: dir > 0 ? AMBER : CORAL, 'stroke-width': G.w(HAIR),
            opacity: 0.5, 'class': 'rg-rung' })));
        });
      });

      /* the rings. each is two arcs leaving the axis on the right, one up and
         one down, and each reaches further than the one inside it */
      var arcs = [];
      for (i = 0; i < 4; i++) {
        [1, -1].forEach(function (dir) {
          arcs.push({ i: i, len: 2 * Math.PI * R[i] * (SPAN[i] / 360),
            n: arc(R[i], 0, SPAN[i] * dir, dir > 0 ? AMBER : CORAL, WT[i], OP[i], 'rg-arc') });
        });
      }

      /* no line across the middle. the change from amber to coral marks the
         axis on its own, and a diameter drawn through a circle divides it. */

      if (reduce) return;
      arcs.forEach(function (o) {
        o.n.style.strokeDasharray = o.len.toFixed(0);
        o.n.style.strokeDashoffset = o.len.toFixed(0);
        o.n.style.transition = 'stroke-dashoffset 1.15s cubic-bezier(.26,.72,.24,1) ' +
                               (0.45 + o.i * 0.24).toFixed(2) + 's';
      });
      rungs.forEach(function (n, k) {
        n.style.opacity = '0';
        n.style.transition = 'opacity .65s ease ' + (1.15 + k * 0.06).toFixed(2) + 's';
      });
      requestAnimationFrame(function () {
        setTimeout(function () {
          arcs.forEach(function (o) { o.n.style.strokeDashoffset = '0'; });
          rungs.forEach(function (n) { n.style.opacity = ''; });
        }, 140);
      });
    },

    /* PARTS, AND THE SELF UNDERNEATH.

       Literally underneath. Self is the axis, the same line the whole site
       meets on, running the full width. The parts stand on it: four chevrons
       of the site's own shape, each one an amber line and a coral line meeting
       at a point, at four different sizes and four different weights, because
       some of them are loud and some are barely there.

       Each part's coral arm lands exactly on the axis. That is not decoration,
       it is the geometry: a part's reach is the height it stands at. Nothing
       floats and nothing is outside. */
    parts: function (svg) {
      var W = 600, H = 430, AXIS = 344, i;
      var G = gauge(W, 500);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var AMBER = 'var(--outer-line)', CORAL = 'var(--inner)';
      // apex x and y. reach follows from the height, so every one of them
      // stands on the line rather than near it.
      var PARTS = [
        { x: 132, y: 296, w: HAIR, o: 0.5  },
        { x: 268, y: 240, w: LINE, o: 0.72 },
        { x: 396, y: 178, w: KEY,  o: 1    },
        { x: 548, y: 246, w: LINE, o: 0.82 }
      ];

      /* the ground under the axis, so the line reads as something to stand on */
      svg.appendChild(el('rect', { x: 0, y: AXIS, width: W, height: H - AXIS,
        fill: CORAL, opacity: 0.045, 'class': 'pt-body' }));

      /* rungs on the mark's pitch, holding the four in one structure */
      var rungs = [];
      for (i = 1; i <= 3; i++) {
        var y = AXIS - i * 62;
        rungs.push(svg.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y,
          stroke: AMBER, 'stroke-width': G.w(HAIR), opacity: 0.07, 'class': 'pt-rung' })));
      }

      var arms = [];
      PARTS.forEach(function (p, idx) {
        var r = AXIS - p.y;                      // lands on the axis, exactly
        [-1, 1].forEach(function (dir) {
          arms.push({ idx: idx, len: Math.SQRT2 * r,
            n: svg.appendChild(el('line', {
              x1: (p.x - r).toFixed(1), y1: (p.y + dir * r).toFixed(1),
              x2: p.x, y2: p.y,
              stroke: dir < 0 ? AMBER : CORAL, 'stroke-width': G.w(p.w),
              'stroke-linecap': 'round', opacity: p.o, 'class': 'pt-part' })) });
        });
      });

      /* the axis. coral into amber, the way it runs on every other page */
      var defs = el('defs', {}), lg = el('linearGradient', { id: 'pt-ax',
        gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: W, y2: 0 });
      lg.appendChild(el('stop', { offset: '0', 'stop-color': CORAL }));
      lg.appendChild(el('stop', { offset: '1', 'stop-color': AMBER }));
      defs.appendChild(lg); svg.appendChild(defs);
      var axis = svg.appendChild(el('line', { x1: 0, y1: AXIS, x2: W, y2: AXIS,
        stroke: 'url(#pt-ax)', 'stroke-width': G.w(EDGE), opacity: 0.95, 'class': 'pt-axis' }));

      svg.appendChild(label(6, AXIS + G.t(10) * 2.1, 'SELF', 'start', 'var(--dim)', G.t(10)));

      if (reduce) return;
      var body = svg.querySelectorAll('.pt-body'), rg = svg.querySelectorAll('.pt-rung'),
          texts = svg.querySelectorAll('text');
      function fade(n, d) { n.style.opacity = '0'; n.style.transition = 'opacity .7s ease ' + d + 's'; }
      axis.style.strokeDasharray = W; axis.style.strokeDashoffset = W;
      axis.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.25,1) .12s';
      // the ground first, then what stands on it
      arms.forEach(function (o) {
        o.n.style.strokeDasharray = o.len.toFixed(0);
        o.n.style.strokeDashoffset = o.len.toFixed(0);
        o.n.style.transition = 'stroke-dashoffset .85s cubic-bezier(.24,.74,.24,1) ' +
                               (0.7 + o.idx * 0.19).toFixed(2) + 's';
      });
      Array.prototype.forEach.call(body, function (n) { fade(n, 0.5); });
      Array.prototype.forEach.call(rg, function (n, k) { fade(n, +(1.5 + k * 0.06).toFixed(2)); });
      Array.prototype.forEach.call(texts, function (n) { fade(n, 1.7); });
      requestAnimationFrame(function () {
        setTimeout(function () {
          axis.style.strokeDashoffset = '0';
          arms.forEach(function (o) { o.n.style.strokeDashoffset = '0'; });
          [body, rg, texts].forEach(function (g) {
            Array.prototype.forEach.call(g, function (n) { n.style.opacity = ''; });
          });
        }, 140);
      });
    },

    /* ------------------------------------------------------------
       The three ways of working are one figure in three states.
       Same team, same glyphs. What changes is how much grid is
       under them and how far apart they sit.
       ------------------------------------------------------------ */

  };

  /* ---------- boot ---------- */

  document.querySelectorAll('svg[data-art]').forEach(function (svg) {
    var fn = ART[svg.getAttribute('data-art')];
    if (fn) fn(svg);
  });




  /* ---------- scroll reveals ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(function (n) { io.observe(n); });


  /* ---------- nav dropdowns: clickable, not only hoverable ---------- */
  document.querySelectorAll('.nav-drop').forEach(function (drop, i) {
    var btn = drop.querySelector('.nav-drop-btn');
    var menu = drop.querySelector('.nav-drop-menu');
    if (!btn || !menu) return;
    var id = 'navmenu-' + i;
    menu.id = id;
    btn.setAttribute('aria-controls', id);
    btn.removeAttribute('aria-haspopup');
    function close() { drop.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.nav-drop').forEach(function (d) {
        d.classList.remove('open');
        var b = d.querySelector('.nav-drop-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!open) { drop.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
    drop.addEventListener('focusout', function () {
      setTimeout(function () { if (!drop.contains(document.activeElement)) close(); }, 0);
    });
  });

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.burger'), mob = document.getElementById('mob');
  if (burger && mob) {
    burger.setAttribute('aria-controls', 'mob');
    function setMenu(open) {
      mob.classList.toggle('open', open);
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var f = mob.querySelector('a'); if (f) f.focus(); } else { burger.focus(); }
    }
    burger.addEventListener('click', function () { setMenu(!mob.classList.contains('open')); });
    mob.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mob.classList.contains('open')) setMenu(false);
    });
  }

  /* ---------- founder bios ---------- */
  document.querySelectorAll('.bio-toggle').forEach(function (btn, i) {
    var panel = btn.nextElementSibling;
    if (!panel) return;
    panel.id = panel.id || 'bio-' + i;
    btn.setAttribute('aria-controls', panel.id);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      btn.innerHTML = open ? 'Read more \u2193' : 'Close \u2191';
      panel.classList.toggle('open', !open);
      panel.style.maxHeight = open ? null : panel.scrollHeight + 'px';
    });
    window.addEventListener('resize', function () {
      if (btn.getAttribute('aria-expanded') === 'true') panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });

  /* ---------- accordions ---------- */
  document.querySelectorAll('.acc-head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      var body = document.getElementById(btn.getAttribute('aria-controls'));
      if (body) { body.classList.toggle('open', !open); body.style.maxHeight = open ? null : body.scrollHeight + 'px'; }
    });
  });
})();
