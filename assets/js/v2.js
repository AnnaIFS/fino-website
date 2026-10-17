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
  var HAIR = 0.95, LINE = 1.15, KEY = 1.4, EDGE = 1.65;
  /* One opacity scale for every drawing. Before this each generator
     picked its own faint value, so the same kind of supporting line was
     at .16 in one drawing and .30 in another and the set looked unevenly
     washed out. GHOST is structure you should barely notice, SOFT is
     secondary structure, MID is a supporting subject, and the subject
     itself is left at full. */
  var GHOST = 0.3, SOFT = 0.56, MID = 0.8;

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



  /* One or more systems of a sun with parts going round it. `places` is a
     list of [angle, turn] pairs: where each system sits on the shared orbit
     and how far its own parts are rotated, so four people are four people
     and not four prints of one. */
  function orbitField(svg, W, H, scale, places, spread, shared) {
    var CX = W / 2, CY = H / 2 + 0, CORAL = 'var(--inner)';
    var G = gauge(W, 500);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var RINGS = [[68, [[-52, 8]]], [124, [[128, 10], [-24, 6.5]]], [180, [[36, 12], [196, 7]]]];
    var spin = [92, 148, 214], rings = [];

    if (shared) {
      svg.appendChild(el('circle', { cx: CX, cy: CY, r: shared, fill: 'none', stroke: CORAL,
        'stroke-width': G.w(KEY), opacity: MID }));
    }

    places.forEach(function (pl, k) {
      var a = pl[0] * Math.PI / 180;
      var ox = CX + (spread ? Math.cos(a) * spread : 0);
      var oy = CY + (spread ? Math.sin(a) * spread : 0);
      RINGS.forEach(function (ring, ri) {
        var r = ring[0] * scale;
        svg.appendChild(el('circle', { cx: ox, cy: oy, r: r.toFixed(1), fill: 'none',
          stroke: CORAL, 'stroke-width': G.w(LINE), opacity: SOFT }));
        var g = el('g', { 'class': 'ob-ring' });
        g.style.setProperty('--ox', ox.toFixed(1) + 'px');
        g.style.setProperty('--oy', oy.toFixed(1) + 'px');
        g.style.animationDuration = (spin[ri] * (ri % 2 ? 1 : -1) > 0 ? spin[ri] : spin[ri]) + 's';
        g.style.animationDirection = ri % 2 ? 'reverse' : 'normal';
        ring[1].forEach(function (pt) {
          var th = (pt[0] + pl[1]) * Math.PI / 180;
          g.appendChild(el('circle', { cx: (ox + Math.cos(th) * r).toFixed(1),
            cy: (oy + Math.sin(th) * r).toFixed(1), r: (pt[1] * scale).toFixed(1),
            fill: 'var(--ground)', stroke: CORAL, 'stroke-width': G.w(KEY) }));
        });
        rings.push(svg.appendChild(g));
      });
      svg.appendChild(el('circle', { cx: ox, cy: oy, r: (13 * scale).toFixed(1),
        fill: 'var(--ground)', stroke: CORAL, 'stroke-width': G.w(EDGE) }));
      svg.appendChild(el('circle', { cx: ox, cy: oy, r: (5.4 * scale).toFixed(1), fill: CORAL }));
    });
    if (shared) {
      svg.appendChild(el('circle', { cx: CX, cy: CY, r: 7, fill: 'var(--ground)',
        stroke: CORAL, 'stroke-width': G.w(KEY) }));
      svg.appendChild(el('circle', { cx: CX, cy: CY, r: 3, fill: CORAL }));
    }
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
      var arms = [], WT = [LINE, LINE, KEY, KEY], OP = [0.74, 0.85, 0.94, 1];
      for (i = 0; i < 4; i++) {
        chevron(APEX[i], REACH[i], null, WT[i], OP[i], 'mk-arm').forEach(function (n) {
          arms.push({ i: i, n: n, len: Math.SQRT2 * REACH[i] * S });
        });
      }

      /* the axis the four meetings sit on, coral running into amber.
         user space, because a horizontal line has no height to scale a
         gradient against */
      var ax1 = X(APEX[0]) - G.u(26), ax2 = X(TIP) + G.u(14), axLen = ax2 - ax1;
      var defs = el('defs', {}), lg = el('linearGradient', { id: 'mk-ax',
        gradientUnits: 'userSpaceOnUse', x1: ax1, y1: CY, x2: ax2, y2: CY });
      lg.appendChild(el('stop', { offset: '0', 'stop-color': 'var(--inner)' }));
      lg.appendChild(el('stop', { offset: '.55', 'stop-color': 'var(--outer-line)' }));
      lg.appendChild(el('stop', { offset: '1', 'stop-color': 'var(--outer-line)' }));
      defs.appendChild(lg); svg.appendChild(defs);
      var axis = line(ax1, CY, ax2, CY, 'url(#mk-ax)', EDGE, 1, 'mk-axis');

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
          fill: b[2], opacity: 0.09, 'class': 'mt-body' }));
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
      var crossings = [];
      for (i = -Math.ceil(H / P) - 1; i * P < W + H; i++) {
        for (j = -Math.ceil(H / P) - 1; j * P < W + H; j++) {
          var cx = (i * P + j * P + H) / 2, cy = (j * P - i * P + H) / 2 + 0;
          cx = (i * P + (j * P + H)) / 2; cy = ((j * P + H) - i * P) / 2;
          if (cy < TOP + 3 || cy > BOT - 3 || cx < -6 || cx > W + 6) continue;
          if ((i + j) % 2) continue;
          crossings.push({ n: svg.appendChild(el('line', { x1: (cx - 7).toFixed(1), y1: (cy - 7).toFixed(1),
            x2: (cx + 7).toFixed(1), y2: (cy + 7).toFixed(1), stroke: AMBER,
            'stroke-width': G.w(LINE), opacity: 0.9, 'class': 'mt-weave' })), x: cx });
        }
      }

      /* the edges of the band, and the axis running through it */
      var rungs = [
        svg.appendChild(el('line', { x1: 0, y1: TOP, x2: W, y2: TOP, stroke: AMBER,
          'stroke-width': G.w(HAIR), opacity: SOFT, 'class': 'mt-rung' })),
        svg.appendChild(el('line', { x1: 0, y1: BOT, x2: W, y2: BOT, stroke: CORAL,
          'stroke-width': G.w(HAIR), opacity: SOFT, 'class': 'mt-rung' }))
      ];
      var axis = svg.appendChild(el('line', { x1: 0, y1: CY, x2: W, y2: CY,
        stroke: 'url(#mt-ax)', 'stroke-width': G.w(KEY), opacity: 0.95, 'class': 'mt-axis' }));

      /* the band is the one part of this drawing that never settles. a light
         runs the axis and the crossings brighten in a wave behind it, so the
         middle keeps moving after everything else has been drawn */
      var runner = svg.appendChild(el('line', { x1: 0, y1: CY, x2: W, y2: CY,
        stroke: 'url(#mt-ax)', 'stroke-width': G.w(KEY) * 1.6, 'stroke-linecap': 'round',
        'class': 'mt-run' }));

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

      crossings.forEach(function (c) {
        c.n.style.animationDelay = (c.x / W * 2.4).toFixed(2) + 's';
      });
      runner.style.strokeDasharray = (W * 0.075).toFixed(0) + ' ' + (W * 0.925).toFixed(0);

      function play() {
        lines.forEach(function (o) { o.n.style.strokeDashoffset = '0'; });
        Array.prototype.forEach.call(weave, function (n) { n.style.opacity = ''; });
        Array.prototype.forEach.call(body, function (n) { n.style.opacity = ''; });
        rungs.forEach(function (n) { n.style.opacity = ''; });
        axis.style.strokeDashoffset = '0';
        lab.style.opacity = '';
        setTimeout(function () {
          Array.prototype.forEach.call(weave, function (n) { n.style.transition = ''; });
          svg.setAttribute('class', ((svg.getAttribute('class') || '') + ' mt-live').trim());
        }, 1900);
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
    /* PARTS, AND THE SELF UNDERNEATH.

       Literally underneath. Self is the axis, the same line the whole site
       meets on, running the full width. The parts stand on it: four chevrons
       of the site's own shape, each one an amber line and a coral line meeting
       at a point, at four different sizes and four different weights, because
       some of them are loud and some are barely there.

       Each part's coral arm lands exactly on the axis. That is not decoration,
       it is the geometry: a part's reach is the height it stands at. Nothing
       floats and nothing is outside. */
    /* THE HOURS.

       Seven rows on the mark's pitch, each one a week of exactly the same
       length, because the week never gets longer. The solid amber is what the
       operational work is taking. It gives back a step each week, so the tips
       walk left and land on a 45 degree line, which is the mark's own arm.

       Behind each tip, in the room that has opened up, marks travel back
       toward the start of the week and keep travelling. Lower rows have
       further to travel, so the giving-back visibly grows.

       Two earlier versions failed for opposite reasons. A chart alone showed
       a result but not the thing happening. Flowing marks alone had motion
       but no quantity, so it said nothing. It needs both. */
    hours: function (svg) {
      var W = 600, H = 420, i;
      var G = gauge(W, 500);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var AMBER = 'var(--outer-line)', X0 = 56, X1 = 544, N = 7, PITCH = 46, Y0 = 84;

      for (i = 0; i < N; i++) {
        var y = Y0 + i * PITCH, end = X1 - i * PITCH, key = i === N - 1;

        // the week, always the same length. what is not solid is what came back.
        svg.appendChild(el('line', { x1: X0, y1: y, x2: X1, y2: y, stroke: AMBER,
          'stroke-width': G.w(HAIR), opacity: GHOST, 'class': 'hr-week' }));

        // what the work is taking
        svg.appendChild(el('line', { x1: X0, y1: y, x2: end, y2: y, stroke: AMBER,
          'stroke-width': G.w(key ? KEY : LINE), 'stroke-linecap': 'round',
          opacity: (0.92 - i * 0.03).toFixed(2), 'class': 'hr-bar' }));

        // where it now ends
        svg.appendChild(el('line', { x1: end, y1: y - 6, x2: end, y2: y + 6, stroke: AMBER,
          'stroke-width': G.w(LINE), opacity: 0.85, 'class': 'hr-cap' }));

        // and the hours travelling back into the room that opened
        var f = el('path', { d: 'M 8 -8 L 0 0 L 8 8', fill: 'none', stroke: AMBER,
          'stroke-width': G.w(key ? KEY : LINE), 'stroke-linecap': 'round',
          'stroke-linejoin': 'round', 'class': 'hr-flow',
          transform: 'translate(' + X1 + ' ' + y + ')' });
        // the hours travel the whole week back to the start of it, not just
        // to where the work now ends. the point is that the time comes back
        // to you, and a short hop was too small a gesture to read as that.
        f.style.setProperty('--d', X1 - X0);
        f.style.animationDuration = (3.4 + i * 0.22).toFixed(2) + 's';
        f.style.animationDelay = (i * 0.26).toFixed(2) + 's';
        svg.appendChild(f);
      }

      svg.appendChild(label(X0, Y0 - 34, 'THE WEEK', 'start', 'var(--dim)', G.t(10)));
      svg.appendChild(label(X1, Y0 + (N - 1) * PITCH + 34, 'HOURS BACK', 'end', 'var(--dim)', G.t(10)));
    },

    /* THE ORDER. Self-led AI Integration.

       The page argues three things in one order: the people, the work, and
       only then the tools. So the drawing is three registers stacked in that
       order, and the arrow at the bottom is the only thing pointing forward,
       because it cannot move until the two above it are sorted. */

    /* THE WEEK, HELD. Operations for law firms.

       A week. Not a product and not a diagram, which is why five attempts at
       abstract geometry here meant nothing to her: on this page the picture
       has to be a thing.

       What it has to say is what the firm gets, which is not more capacity.
       It is work laid out evenly, room left around it, and a weekend that is
       actually empty. Everything sits on the same line inside its day, because
       order is what peace of mind looks like drawn. Coral is the handful of
       dates that cannot move. A soft column of light walks the days, so the
       week is being worked rather than filed. */
    desk: function (svg) {
      var W = 600, H = 430, r, c, k;
      var G = gauge(W, 500);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var AMBER = 'var(--outer-line)', CORAL = 'var(--inner)';
      var X0 = 40, Y0 = 66, COLS = 7, ROWS = 5, CW = 74, CH = 66;
      var GW = COLS * CW, GH = ROWS * CH;

      // even, unhurried, and the weekend is left alone
      var LOAD = [[1,2,1,2,1,0,0],[2,1,2,1,2,0,0],[1,2,1,2,1,1,0],
                  [2,1,2,1,2,0,0],[1,1,2,1,1,0,0]];
      var FIXED = [[0,3],[2,1],[3,4],[4,2]];
      function fixedAt(r2, c2) {
        for (var i = 0; i < FIXED.length; i++) if (FIXED[i][0] === r2 && FIXED[i][1] === c2) return true;
        return false;
      }

      var defs = el('defs', {});
      var lg = el('linearGradient', { id: 'lf-col', gradientUnits: 'objectBoundingBox', x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(el('stop', { offset: '0', 'stop-color': AMBER, 'stop-opacity': 0.24 }));
      lg.appendChild(el('stop', { offset: '1', 'stop-color': AMBER, 'stop-opacity': 0.05 }));
      defs.appendChild(lg); svg.appendChild(defs);

      var col = el('rect', { x: X0, y: Y0, width: CW, height: GH, fill: 'url(#lf-col)', 'class': 'lf-col' });
      col.style.setProperty('--cw', CW);
      svg.appendChild(col);

      for (r = 0; r <= ROWS; r++)
        svg.appendChild(el('line', { x1: X0, y1: Y0 + r * CH, x2: X0 + GW, y2: Y0 + r * CH,
          stroke: AMBER, 'stroke-width': G.w(r === 0 ? LINE : HAIR), opacity: r === 0 ? SOFT : GHOST }));
      for (c = 0; c <= COLS; c++)
        svg.appendChild(el('line', { x1: X0 + c * CW, y1: Y0, x2: X0 + c * CW, y2: Y0 + GH,
          stroke: AMBER, 'stroke-width': G.w(HAIR), opacity: c === 0 || c === COLS ? SOFT : GHOST }));

      'M T W T F S S'.split(' ').forEach(function (d, i) {
        svg.appendChild(label(X0 + i * CW + CW / 2, Y0 - 16, d, 'middle', 'var(--dim)', G.t(10)));
      });

      // the work. same place in every day, same length, nothing crowded.
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
        for (k = 0; k < LOAD[r][c]; k++) {
          var key = fixedAt(r, c) && k === 0;
          var x = X0 + c * CW + 13, y = Y0 + r * CH + 24 + k * 15;
          svg.appendChild(el('line', { x1: x, y1: y, x2: x + (key ? 44 : 34), y2: y,
            stroke: key ? CORAL : AMBER, 'stroke-width': G.w(key ? KEY : LINE),
            'stroke-linecap': 'round', opacity: key ? 1 : MID }));
        }
      }
    },


    /* A NICE WEBSITE. FINO Studio.

       The page is about making someone a good looking site, so the drawing
       is a good looking page: a nav, a heading, a picture, two columns of
       text and a footer, all landing exactly on a six column grid that you
       can see underneath them. Precision is the argument, because sitting
       on a real grid is the difference between a site that was designed and
       one that was filled in. */
    voice: function (svg) {
      var W = 600, H = 420, i;
      var G = gauge(W, 500);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var AMBER = 'var(--outer-line)', INK = 'var(--ink)';
      var PX = 128, PY = 46, PW = 344, PH = 330;
      var COLS = 6, GUT = 10, PAD = 20;
      var CW = (PW - PAD * 2 - GUT * (COLS - 1)) / COLS;

      function col(ci, span) {
        span = span || 1;
        return [PX + PAD + ci * (CW + GUT), span * CW + (span - 1) * GUT];
      }
      function bar(x, y, w, h, op) {
        svg.appendChild(el('rect', { x: x.toFixed(1), y: y.toFixed(1),
          width: w.toFixed(1), height: h, fill: AMBER, opacity: op }));
      }
      function box(x, y, w, h, op, sw) {
        svg.appendChild(el('rect', { x: x.toFixed(1), y: y.toFixed(1),
          width: w.toFixed(1), height: h, fill: 'none', stroke: AMBER,
          'stroke-width': G.w(sw), opacity: op }));
      }
      function rule(x1, y, x2, op, sw, c) {
        svg.appendChild(el('line', { x1: x1.toFixed(1), y1: y, x2: x2.toFixed(1), y2: y,
          stroke: c || AMBER, 'stroke-width': G.w(sw || LINE), opacity: op }));
      }

      // the grid it is built on, visible but quiet
      for (i = 0; i < COLS; i++) {
        var g = col(i);
        svg.appendChild(el('rect', { x: g[0].toFixed(1), y: PY + 12, width: g[1].toFixed(1),
          height: PH - 24, fill: INK, opacity: 0.035 }));
      }
      box(PX, PY, PW, PH, 1, EDGE);

      // nav
      rule(col(0)[0], PY + 40, col(5)[0] + col(5)[1], SOFT);
      bar(col(0)[0], PY + 22, 34, 10, MID);
      [3, 4, 5].forEach(function (ci) {
        var g = col(ci);
        bar(g[0] + g[1] - 26, PY + 24, 26, 6, SOFT);
      });

      // the heading, four columns wide
      var h = col(0, 4);
      bar(h[0], PY + 66, h[1], 17, 1);
      bar(h[0], PY + 91, h[1] * 0.62, 17, 1);

      // the picture
      var pic = col(0, 6);
      bar(pic[0], PY + 126, pic[1], 86, 0.14);
      box(pic[0], PY + 126, pic[1], 86, SOFT, KEY);

      // two columns of text, exactly on the grid
      [[0, [1, 1, 1, 0.72]], [3, [1, 1, 0.86, 0.55]]].forEach(function (c) {
        var t = col(c[0], 3), y = PY + 226;
        c[1].forEach(function (f) {
          bar(t[0], y, t[1] * f, 7, f === 1 ? MID : SOFT);
          y += 14;
        });
      });

      rule(col(0)[0], PY + PH - 44, col(5)[0] + col(5)[1], SOFT);
      bar(col(0)[0], PY + PH - 34, 46, 6, SOFT);

      // registration ticks: the grid is measured, which is the point
      for (i = 0; i < COLS; i++) {
        var t = col(i);
        svg.appendChild(el('line', { x1: t[0].toFixed(1), y1: PY - 14, x2: t[0].toFixed(1),
          y2: PY - 6, stroke: INK, 'stroke-width': G.w(HAIR), opacity: SOFT }));
        svg.appendChild(el('line', { x1: (t[0] + t[1]).toFixed(1), y1: PY - 14,
          x2: (t[0] + t[1]).toFixed(1), y2: PY - 6, stroke: INK,
          'stroke-width': G.w(HAIR), opacity: SOFT }));
      }
      rule(col(0)[0], PY - 10, col(5)[0] + col(5)[1], GHOST, HAIR, INK);
    },

    /* THE PIECE THAT IS MISSING. Fractional operations.

       You already run most of it. Seven blocks are in place, one slot is
       empty, and the piece that fills it is on its way in. Nothing is torn
       down and nothing is replaced, which is the actual offer. No words:
       the gap is the only empty thing in the frame, so the eye goes there. */
    blocks: function (svg) {
      var W = 590, H = 420, r, c;
      var G = gauge(W, 500);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var AMBER = 'var(--outer-line)';
      var BW = 108, BH = 64, GP = 16, COLS = 4, ROWS = 2;
      var X0 = (W - (COLS * BW + (COLS - 1) * GP)) / 2, Y0 = 194;
      var SLOT = [2, 0], LIFT = 112;
      var cx = function (i) { return X0 + i * (BW + GP); };
      var cy = function (j) { return Y0 + j * (BH + GP); };

      function block(x, y, w, op, cls) {
        var g = el('g', cls ? { 'class': cls } : {});
        g.appendChild(el('rect', { x: x, y: y, width: BW, height: BH, fill: 'none',
          stroke: AMBER, 'stroke-width': G.w(w), opacity: op }));
        g.appendChild(el('line', { x1: x + 11, y1: y + BH / 2, x2: x + BW - 11, y2: y + BH / 2,
          stroke: AMBER, 'stroke-width': G.w(HAIR), opacity: op * SOFT }));
        return svg.appendChild(g);
      }

      var made = [];
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
        if (c === SLOT[0] && r === SLOT[1]) continue;
        made.push(block(cx(c), cy(r), KEY, 1 - r * 0.08, 'bk-on'));
      }
      // the slot, the only empty thing here
      svg.appendChild(el('rect', { x: cx(SLOT[0]), y: cy(SLOT[1]), width: BW, height: BH,
        fill: 'none', stroke: 'var(--rule-strong)', 'stroke-width': G.w(LINE),
        'stroke-dasharray': '5 5' }));
      // the track it travels, and the piece travelling it
      svg.appendChild(el('line', { x1: cx(SLOT[0]) + BW / 2, y1: cy(SLOT[1]) - LIFT + BH,
        x2: cx(SLOT[0]) + BW / 2, y2: cy(SLOT[1]) - 6, stroke: 'var(--rule-strong)',
        'stroke-width': G.w(HAIR), 'stroke-dasharray': '4 6' }));
      svg.appendChild(el('path', { d: 'M -8 -10 L 0 0 L 8 -10', fill: 'none', stroke: AMBER,
        'stroke-width': G.w(KEY), 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        transform: 'translate(' + (cx(SLOT[0]) + BW / 2) + ' ' + (cy(SLOT[1]) - 8) + ')' }));
      var inb = block(cx(SLOT[0]), cy(SLOT[1]) - LIFT, EDGE, 1, 'bk-in');
      inb.style.setProperty('--drop', LIFT - BH - 14);

      if (reduce) return;
      made.forEach(function (n, i) {
        n.style.opacity = '0';
        n.style.transition = 'opacity .5s ease ' + (0.1 + i * 0.07).toFixed(2) + 's';
      });
      requestAnimationFrame(function () {
        setTimeout(function () { made.forEach(function (n) { n.style.opacity = ''; }); }, 120);
      });
    },

    /* A SELF, AND THE PARTS THAT GO ROUND IT. Coaching.

       Planets round a sun, which is a diagram nobody has to be taught. Three
       orbits, five parts at their own sizes and their own distances, and the
       Self at the centre. No joining lines and no words: the arrangement is
       the whole statement. The orbits turn, very slowly, because the parts
       are moving whether or not anyone is watching them. */
    orbit: function (svg) {
      orbitField(svg, 480, 420, 1.09, [[0, 1]]);
    },

    /* THE SAME, FOUR TIMES OVER, SHARING ONE ORBIT. Self-leadership circles.

       Everyone arrives with their own system intact and nothing about it is
       changed. What the eight weeks adds is the one wide orbit they all now
       turn inside, which is the shared language. */
    orbits: function (svg) {
      orbitField(svg, 480, 420, 0.42,
        [[-90, 0], [0, 74], [90, 143], [180, 216]], 120, 198);
    },

    /* THE BRIDGE. About.

       Two of these, one each side of the headline, which is the only thing
       between them. Amber arrives from the left and coral from the right,
       each stopping at the edge of the words. The page's own H1 is the
       middle of the system, so nothing is drawn twice and the words stay
       real text. */
    bridge: function (svg) {
      var W = 240, H = 300, CY = 150, R = 118;
      var G = gauge(W, 240);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var right = svg.getAttribute('data-side') === 'right';
      var col = right ? 'var(--inner)' : 'var(--outer-line)';
      var apex = right ? 18 : W - 18, dir = right ? 1 : -1;

      var arms = [-1, 1].map(function (up) {
        return svg.appendChild(el('line', { x1: apex, y1: CY,
          x2: apex + dir * R, y2: CY + up * R, stroke: col,
          'stroke-width': G.w(EDGE * 1.7), 'stroke-linecap': 'round', 'class': 'br-arm' }));
      });
      // the short run toward the words, so the two sides read as one span
      var tail = svg.appendChild(el('line', { x1: apex, y1: CY,
        x2: right ? 0 : W, y2: CY, stroke: col,
        'stroke-width': G.w(EDGE * 1.7), 'stroke-linecap': 'butt', 'class': 'br-tail' }));

      if (reduce) return;
      arms.concat([tail]).forEach(function (n, i) {
        n.style.opacity = '0';
        n.style.transition = 'opacity .6s ease ' + (0.14 + i * 0.12).toFixed(2) + 's';
      });
      requestAnimationFrame(function () {
        setTimeout(function () {
          arms.concat([tail]).forEach(function (n) { n.style.opacity = ''; });
        }, 120);
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




  /* ---------- scroll reveals ----------
     the section ticks ride along with this, so if the observer is missing or
     throws, everything it would have revealed is shown outright rather than
     left at opacity zero */
  /* the section itself, the card grids, the step lists and the two column
     lists are observed too: the headline mask, the family sweep, the step
     rail and the staggered arrivals all hang off their .in */
  var REVEAL = '.rv, section > .page, main.lf section, section, .cards, .steps, .tick, .s-head';
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll(REVEAL).forEach(function (n) { io.observe(n); });
  } else {
    document.querySelectorAll(REVEAL).forEach(function (n) { n.classList.add('in'); });
  }


  /* ---------- the progress rail ----------
     where you are in the page, drawn as the logo's own gradient unrolled:
     gold through orange to red, left to right. */
  (function () {
    if (reduce) return;
    var rail = document.createElement('div');
    rail.id = 'fino-rail';
    document.body.appendChild(rail);
    var queued = 0;
    function draw() {
      queued = 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || 0;
      var p = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
      rail.style.width = (p * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', function () {
      if (!queued) queued = requestAnimationFrame(draw);
    }, { passive: true });
    window.addEventListener('resize', draw, { passive: true });
    draw();
  })();

  /* ---------- a card lights from where the cursor is ----------
     one listener for the whole page, two custom properties, no layout read
     beyond the card's own box. nothing runs for a pointer that cannot hover. */
  (function () {
    if (reduce) return;
    if (window.matchMedia && window.matchMedia('(hover:none)').matches) return;
    document.addEventListener('mousemove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.card') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  })();

  /* mark where you already are, in the menu and in the nav */
  (function () {
    if (typeof location === 'undefined' || !location.pathname) return;
    var here = location.pathname.replace(/index\.html$/, '');
    document.querySelectorAll('.mob a[href], .nav-drop-menu a[href]').forEach(function (a) {
      var p = a.pathname ? a.pathname.replace(/index\.html$/, '') : '';
      if (p && p === here) a.setAttribute('aria-current', 'page');
    });
  })();

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
      var main = document.querySelector('main'), foot = document.querySelector('footer');
    [main, foot].forEach(function (n) { if (n) { if (open) { n.setAttribute('inert',''); } else { n.removeAttribute('inert'); } } });
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
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

  /* a rotated phone reflows an open answer taller than the height we stored,
     and overflow hidden would cut it off mid sentence */
  window.addEventListener('resize', function () {
    document.querySelectorAll('.acc-head[aria-expanded="true"]').forEach(function (b) {
      var body = document.getElementById(b.getAttribute('aria-controls'));
      if (body) body.style.maxHeight = body.scrollHeight + 'px';
    });
  });
})();
