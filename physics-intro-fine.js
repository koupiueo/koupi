/* physics-intro-fine.js — KOUPI physics intro, fine character grid (no block morph).
 * Usage: KoupiFine.start(canvas, statusEl, onDone)
 * A kijitora (grey tabby) ASCII cat sits above the letters, built from the same particles.
 * Fixed character grid on a <canvas>: columns can never drift. Each banner cell is split into
 * S x S small characters, so the letters are built from fine ASCII density glyphs " .:-=+*#%@"
 * (no block morph). The 3D shadow edges are exact lines on the coarse letter grid.
 */
(function () {
  const ART = [
    "██╗  ██╗ ██████╗ ██╗   ██╗██████╗ ██╗",
    "██║ ██╔╝██╔═══██╗██║   ██║██╔══██╗██║",
    "█████╔╝ ██║   ██║██║   ██║██████╔╝██║",
    "██╔═██╗ ██║   ██║██║   ██║██╔═══╝ ██║",
    "██║  ██╗╚██████╔╝╚██████╔╝██║     ██║",
    "╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝",
  ];
  // which sides each shadow char connects to: [left, right, up, down]
  const EDGES = { "═": [1,1,0,0], "║": [0,0,1,1], "╗": [1,0,0,1], "╝": [1,0,1,0], "╔": [0,1,0,1], "╚": [0,1,1,0] };
  const RAMP = " .:-=+*#%@";
  // ---- kijitora (grey tabby) cat, defined in "cat units": 34 wide x 40 tall (1 unit = 1 cell width) ----
  // classes: 1 fur, 2 stripe, 3 pale fur (muzzle / chest / paws), 4 eye, 5 pupil, 6 nose / inner ear
  const CAT_W = 34, CAT_H = 40;
  const CAT_STYLE = [null,
    { h: 30, s: 6, l: 58, g: "+" },    // fur: grey tabby ground
    { h: 25, s: 7, l: 25, g: "#" },    // stripe: charcoal
    { h: 36, s: 6, l: 82, g: ":" },    // pale grey: muzzle, chest, paws
    { h: 62, s: 38, l: 56, g: "o" },   // eye: amber-green
    { h: 40, s: 10, l: 9, g: "|" },    // slit pupil
    { h: 355, s: 24, l: 62, g: "v" },  // nose / inner ear: muted pink
    null, null,
    { h: 130, s: 80, l: 58, g: "@" },  // 9: the terminal line at the bottom, green
  ];
  // 3x5 pixel font for the terminal line, drawn with the same small characters as everything else
  const FONT = {
    "0": "###|#.#|#.#|#.#|###", "1": ".#.|##.|.#.|.#.|###", "2": "###|..#|###|#..|###", "3": "###|..#|###|..#|###",
    "4": "#.#|#.#|###|..#|..#", "5": "###|#..|###|..#|###", "6": "###|#..|###|#.#|###", "7": "###|..#|.#.|.#.|.#.",
    "8": "###|#.#|###|#.#|###", "9": "###|#.#|###|..#|###", ".": "...|...|...|...|.#.", ">": "#..|.#.|..#|.#.|#..",
    "y": "...|#.#|###|..#|##.", "/": "..#|..#|.#.|#..|#..", "o": "...|###|#.#|#.#|###", "c": "...|###|#..|#..|###",
    "a": "...|.##|#.#|#.#|.##", "t": ".#.|###|.#.|.#.|.##", "l": "##.|.#.|.#.|.#.|###", "v": "...|#.#|#.#|#.#|.#.",
    "e": "...|###|###|#..|###", "r": "...|.##|#..|#..|#..", "!": ".#.|.#.|.#.|...|.#.", "_": "...|...|...|...|###",
  };
  const GLYPH_MAX = 13;
  const ell = (u, v, cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;
  function inTri(u, v, a, b, c) {
    const s1 = (b[0]-a[0])*(v-a[1]) - (b[1]-a[1])*(u-a[0]);
    const s2 = (c[0]-b[0])*(v-b[1]) - (c[1]-b[1])*(u-b[0]);
    const s3 = (a[0]-c[0])*(v-c[1]) - (a[1]-c[1])*(u-c[0]);
    return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
  }
  // realistic sitting cat, front view: modest head, tall ears, long body with front legs, ringed tail
  const HEAD = [16, 11.8, 8.2, 6.9], BODY = [16, 28.5, 9.6, 11.6];
  const TAIL = [];
  const TAIL_R = 1.15;   // long, slim tail
  for (let k = 0; k <= 32; k++) { const a = k / 32; TAIL.push([24.5 + a * 7.5 + Math.sin(a * 3) * 1.6, 38.6 - a * 20 - Math.sin(a * 3.1) * 2]); }
  const EAR_L = { tri: [[7.6, 9], [8.6, 0.2], [14.4, 5.6]], inner: [[9.2, 7.4], [9.4, 2.6], [12.6, 5.8]], pivot: [10.6, 7], dir: -1 };
  const EAR_R = { tri: [[24.4, 9], [23.4, 0.2], [17.6, 5.6]], inner: [[22.8, 7.4], [22.6, 2.6], [19.4, 5.8]], pivot: [21.4, 7], dir: 1 };
  function catClass(u, v) {
    // almond eyes with slit pupils
    for (const ex of [12.5, 19.5]) {
      if (ell(u, v, ex, 11, 2.3, 1.6)) return Math.abs(u - ex) < 0.5 ? 5 : 4;
    }
    if (inTri(u, v, [14.4, 12.6], [17.6, 12.6], [16, 15.6])) return 6;          // nose
    if (Math.abs(u - 16) < 0.4 && v > 15.4 && v < 17) return 2;                // philtrum
    if (ell(u, v, 16, 16.2, 3.6, 2.2)) return 3;                               // muzzle
    for (const E of [EAR_L, EAR_R]) if (inTri(u, v, ...E.tri)) return inTri(u, v, ...E.inner) ? 6 : 1;
    if (ell(u, v, ...HEAD)) {
      if (v < 8.8 && v > 4.4 && [13.4, 16, 18.6].some((x) => Math.abs(u - x) < 0.55)) return 2;   // "M" on the forehead
      if (Math.abs(v - (11 + (Math.abs(u - 16) - 4.6) * 0.45)) < 0.6 && Math.abs(u - 16) > 4.4) return 2;  // line from the eye corner
      if (Math.abs(u - 16) > 5.8 && Math.abs(v - 14.6) < 0.6) return 2;        // cheek stripe
      return 1;
    }
    // front paws
    if (ell(u, v, 12.6, 38.5, 2.4, 1.5) || ell(u, v, 19.4, 38.5, 2.4, 1.5)) return 3;
    if (ell(u, v, ...BODY) && v < 39.5) {
      const side = Math.abs(u - 16);
      if (v > 18.6 && v < 24 && side < 3.4) return 3;                          // pale throat
      if (v > 24 && v < 38 && side > 0.6 && side < 4.6) {                      // front legs, striped
        if (side < 1.1 && v > 27) return 2;                                    // gap between the legs
        return Math.sin(v * 1.5) > 0.7 ? 2 : (side < 3.2 && v < 30 ? 3 : 1);
      }
      if (v < 21 && Math.abs(v - 19.6) < 0.6 && side > 4) return 2;           // necklace stripe
      if (side > 5 && Math.sin(v * 0.95 + side * 0.55) > 0.5) return 2;        // mackerel bands on the flanks
      return 1;
    }
    for (let k = 0; k < TAIL.length; k++) {
      const [x, y] = TAIL[k];
      if ((u - x) ** 2 + (v - y) ** 2 < TAIL_R * TAIL_R * (1.15 - 0.3 * k / 32)) return k > 28 || (k % 5) < 2 ? 2 : 1;
    }
    return 0;
  }
  // which moving part a cat point belongs to: 0 none, 1 left ear, 2 right ear, 3 tail; plus how far along the tail
  function catPart(u, v) {
    if (v < 8 && inTri(u, v, ...EAR_L.tri)) return [1, 0];
    if (v < 8 && inTri(u, v, ...EAR_R.tri)) return [2, 0];
    if (ell(u, v, ...BODY) || ell(u, v, ...HEAD)) return [0, 0];
    let best = 1e9, bk = -1;
    for (let k = 0; k < TAIL.length; k++) { const d = (u - TAIL[k][0]) ** 2 + (v - TAIL[k][1]) ** 2; if (d < best) { best = d; bk = k; } }
    return best < TAIL_R * TAIL_R * 1.15 ? [3, bk / (TAIL.length - 1)] : [0, 0];
  }
  // DejaVu Sans Mono Bold (ASCII subset, free DejaVu/Bitstream Vera licence), embedded so every device
  // draws the same Linux-terminal font
  const TERM_FONT = "data:font/woff;base64,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";
  if (typeof FontFace !== "undefined" && typeof document !== "undefined" && document.fonts) {
    try { const ff = new FontFace("KoupiTerm", `url(${TERM_FONT}) format("woff")`, { weight: "700" }); document.fonts.add(ff); ff.load().catch(() => {}); } catch (e) {}
  }
  const ASP = 2;          // cell height / cell width
  const DT = 1 / 120;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };

  function start(canvas, statusEl, onDone) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    const bw = ART[0].length, bh = ART.length;

    // ---- fixed grid: column count decided once, cell size follows the canvas width ----
    const cssW0 = canvas.clientWidth || 600;
    const cw0 = clamp((cssW0 * 0.72) / bw, 6, 30);
    const ccols = Math.max(bw + 2, Math.floor(cssW0 / cw0));   // coarse grid (banner letters)
    const crows0 = bh + 6;
    // each coarse cell = S x S small characters; S is picked so one small character is ~8.5px wide,
    // big enough that the terminal line below reads as ordinary terminal text, one character per cell
    const S = clamp(Math.round(cw0 / 8.5), 1, 4);
    // cat: small cells per cat unit; never below 0.65 so the cat keeps its detail when cells are big
    const catSc = Math.max(S / 4, 0.65);
    const catRows = Math.ceil((CAT_H / ASP) * catSc / S);     // coarse rows the cat needs
    const crows = crows0 + catRows;
    const P = S >= 4 ? 1 : 2;                                   // particles per small cell
    const cols = ccols * S;
    const ox = Math.floor((ccols - bw) / 2), oy = catRows + 2;
    // ---- prompt line under the banner: "Tap or Click to continue. _" ----
    const PROMPT_TXT = "Tap or Click to continue.", fullLen = PROMPT_TXT.length + 2;
    // plain monospace text, each character m columns wide and m rows tall (m x the small grid characters)
    const m = 1;
    const textTop = (oy + bh) * S + Math.max(2, S);
    const rows = Math.max(crows * S, textTop + m + Math.max(2, S));
    let cw = 0, chh = 0, dpr = 1;
    function layout() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = canvas.clientWidth || cssW0;
      cw = cssW / cols; chh = cw * ASP;
      canvas.dataset.cw = cw.toFixed(3);
      canvas.style.height = rows * chh + "px";
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(rows * chh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (done) draw();
    }

    // ---- targets: 2 particles per small character cell inside "█"; shadow list ----
    const targets = [], shade = [];
    ART.forEach((line, r) => [...line].forEach((c, k) => {
      const gx = ox + k, gy = oy + r;
      if (c === "█") {
        for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
          const fx = gx * S + b, fy = gy * S + a;
          if (P === 1) targets.push([fx + 0.5, (fy + 0.5) * ASP]);
          else targets.push([fx + 0.3, (fy + 0.3) * ASP], [fx + 0.7, (fy + 0.7) * ASP]);
        }
      } else if (c !== " ") shade.push([gx, gy, EDGES[c]]);
    }));
    // cat: one cat unit = 4/S small cells, so the cat keeps the same size relative to the letters
    const catMap = new Uint8Array(cols * rows);
    let catXf = null, catYf = null;
    {
      const sc = catSc;                                   // small cells per cat unit (x)
      const cwC = Math.round(CAT_W * sc), chC = Math.round((CAT_H / ASP) * sc);
      const cx0 = Math.floor((cols - cwC) / 2), cy0 = S;     // one coarse row from the top
      // cat units -> sim units is isotropic: x = cx0 + u*sc, y = cy0*ASP + v*sc
      catXf = (U) => cx0 + U * sc; catYf = (V) => cy0 * ASP + V * sc;
      for (let j = 0; j < chC; j++) for (let i = 0; i < cwC; i++) {
        const u = (i + 0.5) / sc, v = ((j + 0.5) * ASP) / sc;
        const k = catClass(u, v);
        if (!k) continue;
        const fx = cx0 + i, fy = cy0 + j;
        catMap[fy * cols + fx] = k;
        const [pt, ps] = catPart(u, v);
        if (P === 1) targets.push([fx + 0.5, (fy + 0.5) * ASP, k, pt, ps]);
        else targets.push([fx + 0.3, (fy + 0.3) * ASP, k, pt, ps], [fx + 0.7, (fy + 0.7) * ASP, k, pt, ps]);
      }
    }
    const T = targets.length;
    // enough leftovers to draw every glyph of the terminal line at its densest (13 pixels)
    const PER_CH = 2 * P, textNeed = (PROMPT_TXT + "_").replace(/ /g, "").length * PER_CH;
    const N = Math.max(T + textNeed, Math.min(Math.floor(T * 1.6), innerWidth < 500 ? 1600 : 4000));
    const W = cols, H = rows * ASP;
    const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
    const tx = new Float32Array(N).fill(-1), ty = new Float32Array(N), life = new Float32Array(N).fill(1);
    const born = new Float32Array(N), pcls = new Uint8Array(N);
    const ox_ = new Float32Array(N), oy_ = new Float32Array(N);
    // cat flight: each cat particle follows a parabola from the left side of the pool up to its place
    const fly = new Uint8Array(N), fsx = new Float32Array(N), fsy = new Float32Array(N);
    const fcx = new Float32Array(N), fcy = new Float32Array(N), fdl = new Float32Array(N);
    const FLY_T0 = 4.9, FLY_CROUCH = 0.22, FLY_DUR = 1.05, FLY_SPREAD = 0.28;
    const fh = new Float32Array(N);   // jump height per particle
    // idle life after the intro: base targets + which part (ear / tail) each particle belongs to
    const btx = new Float32Array(N), bty = new Float32Array(N), ppart = new Uint8Array(N), pps = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // a steady pour: rows of particles leave a spout, spaced so they never start overlapped
      const SP = Math.max(8, Math.round(W * 0.12)), row = (i / SP) | 0;
      born[i] = row * (1.5 / Math.ceil(N / SP));
      px[i] = W / 2 - SP / 2 + (i % SP) + 0.5 + (Math.random() - 0.5) * 0.2; py[i] = 0.5;
      vx[i] = Math.sin(row * 0.15) * 4; vy[i] = 50;
    }
    const order = [...Array(N).keys()].sort(() => Math.random() - 0.5);
    const trail = new Float32Array(cols * rows), spd = new Float32Array(cols * rows);
    const cnt = new Uint8Array(cols * rows), cellCls = new Uint8Array(cols * rows);
    let t = 0, phase = "pour", done = false, last = performance.now(), fps = 60, acc = 0;
    let ptr = null, wake = 0;
    // leftover particles become stars: they float up out of the pool and drift and twinkle
    const star = new Uint8Array(N), sx = new Float32Array(N), sy = new Float32Array(N), sph = new Float32Array(N);
    let nStars = 0;
    function makeStar(i) {
      star[i] = 1; nStars++; sph[i] = Math.random();
      sx[i] = 1 + Math.random() * (W - 2); sy[i] = 1 + Math.random() * (H - 2);
    }

    // terminal line: each character position owns a few leftover particles that fly into its box;
    // as they land they vanish and the character itself fades in, as plain text
    const lineText = (blink) => PROMPT_TXT + " " + (blink ? "_" : " ");
    const slots = [];        // {x, y, k, ids: [], a}
    {
      const str = lineText(true), x0 = Math.floor((cols - str.length * m) / 2);
      for (let k = 0; k < str.length; k++) if (str[k] !== " ") slots.push({ k, x: x0 + k * m, y: textTop, ids: [], a: 0 });
    }
    const hid = new Uint8Array(N);
    let textOn = false;
    function updateText() {
      if (!textOn) return;
      for (const sl of slots) {
        let n = 0;
        for (const i of sl.ids) {
          if (!hid[i] && Math.hypot(px[i] - tx[i], (py[i] - ty[i]) / ASP) < 0.7) hid[i] = 1;   // landed: becomes the letter
          n += hid[i];
        }
        sl.a = sl.ids.length ? n / sl.ids.length : 1;
      }
    }

    function assign() {
      // cat targets go to the left-most particles (left-most target to left-most particle), so the cat is
      // thrown up from the left; the letters take the rest in random order
      const catT = [], letT = [];
      for (const tg of targets) (tg[2] ? catT : letT).push(tg);
      catT.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
      const byX = order;   // the cat gathers together with the letters, from anywhere in the pool
      const used = new Uint8Array(N);
      catT.forEach((tg, k) => {
        const i = byX[k]; used[i] = 1;
        tx[i] = tg[0]; ty[i] = tg[1]; pcls[i] = tg[2];
        btx[i] = tg[0]; bty[i] = tg[1]; ppart[i] = tg[3] || 0; pps[i] = tg[4] || 0;
        fly[i] = 0;
        fdl[i] = (k / Math.max(1, catT.length)) * FLY_SPREAD + Math.random() * 0.04;
      });
      let k = 0;
      for (const i of order) {
        if (used[i]) continue;
        if (k < letT.length) { tx[i] = letT[k][0]; ty[i] = letT[k][1]; pcls[i] = 0; }
        else {
          const q = k - letT.length;
          const sl = slots[q % Math.max(1, slots.length)];
          if (sl && sl.ids.length < PER_CH) {
            sl.ids.push(i); pcls[i] = 9;
            tx[i] = sl.x + 0.15 * m + Math.random() * 0.7 * m; ty[i] = (sl.y + 0.15 * m + Math.random() * 0.7 * m) * ASP;
          }
          else tx[i] = -2;                               // more than the line needs: fades away
        }
        fly[i] = 0; k++;
      }
      textOn = slots.length > 0;
    }
    function settle() {
      if (phase === "pour" || phase === "fluid") assign();
      for (let i = 0; i < N; i++) {
        fly[i] = 0;
        if (tx[i] >= 0) { px[i] = tx[i]; py[i] = ty[i]; vx[i] = vy[i] = 0; } else if (star[i]) { px[i] = sx[i]; py[i] = sy[i]; vx[i] = vy[i] = 0; } else life[i] = 0;
        born[i] = 0;
      }
      trail.fill(0);
      t = Math.max(t, 8.6); phase = "live"; finish();
    }
    function finish() { if (!done) { done = true; wake = performance.now() + 1500; cleanupSkip(); onDone && onDone(); } }

    // ---- spatial hash repulsion ----
    const HC = Math.ceil(W) + 2, HR = Math.ceil(H) + 2;
    const head = new Int32Array(HC * HR), next = new Int32Array(N);
    let relax = 0.5, coh = 0;
    function repel() {
      head.fill(-1);
      for (let i = 0; i < N; i++) {
        if (t < born[i] || life[i] <= 0 || star[i] || hid[i]) continue;
        const c = clamp(py[i] | 0, 0, HR - 1) * HC + clamp(px[i] | 0, 0, HC - 1);
        next[i] = head[c]; head[c] = i;
      }
      for (let i = 0; i < N; i++) {
        if (t < born[i] || life[i] <= 0 || star[i]) continue;
        const cx = px[i] | 0, cy = py[i] | 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
          const x = cx + b, y = cy + a;
          if (x < 0 || y < 0 || x >= HC || y >= HR) continue;
          for (let j = head[y * HC + x]; j !== -1; j = next[j]) {
            if (j <= i) continue;
            const dx = px[j] - px[i], dy = py[j] - py[i], d2 = dx * dx + dy * dy;
            if (d2 > 1.96 || d2 < 1e-6) continue;
            const d = Math.sqrt(d2);
            let f;
            if (d2 < 0.81) f = (0.9 - d) * relax / d;
            else if (coh) f = -(d - 0.9) * (1.4 - d) * coh / d;   // surface tension: neighbours just apart pull back together
            else continue;
            px[i] -= dx * f; py[i] -= dy * f; px[j] += dx * f; py[j] += dy * f;
          }
        }
      }
    }

    function step() {
      t += DT;
      if (phase === "pour" && t > 1.5) phase = "fluid";
      if (phase === "fluid" && t > 4.8) { phase = "assemble"; assign(); }
      if (phase === "assemble" && t > 8.0) { phase = "live"; finish(); }
      const springs = phase !== "pour" && phase !== "fluid";
      for (let i = 0; i < N; i++) {
        if (t < born[i] || life[i] <= 0) continue;
        ox_[i] = px[i]; oy_[i] = py[i];
        if (fly[i]) {
          // scripted below
        } else if (springs && tx[i] >= 0) {
          // a little softer than before, so the letters gather more slowly
          const kk = 28, dd = 9;   // near-critical: settles with only a hint of overshoot
          vx[i] += ((tx[i] - px[i]) * kk - vx[i] * dd) * DT;
          vy[i] += ((ty[i] - py[i]) * kk - vy[i] * dd) * DT;
        } else if (star[i]) {
          // drift toward a home point with a slow wander, like dust in the night sky
          const ph = sph[i] * 6.283;
          // first a near-instant burst out to its place in the sky, then the slow drift
          const burst = t < 5.45, sk = burst ? 90 : 0.9, sd = burst ? 17 : 1.4;
          const ax = (sx[i] - px[i]) * sk - vx[i] * sd + Math.sin(t * 0.35 + ph * 3) * 1.6;
          const ay = (sy[i] - py[i]) * sk - vy[i] * sd + Math.cos(t * 0.29 + ph * 2) * 1.6;
          vx[i] += ax * DT; vy[i] += ay * DT;
        } else {
          vy[i] += 60 * S * DT;
          if (tx[i] === -2) life[i] -= DT * 0.8;
        }
        if (ptr) {
          const dx = px[i] - ptr.x, dy = py[i] - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 30 * S * S && d2 > 1e-4) { const f = (30 * S * S - d2) * 1.5 / (S * Math.sqrt(d2)); vx[i] += dx * f * DT; vy[i] += dy * f * DT; }
        }
        px[i] += vx[i] * DT; py[i] += vy[i] * DT;
        if (px[i] < 0) { px[i] = 0; vx[i] *= -0.5; } else if (px[i] > W - 0.01) { px[i] = W - 0.01; vx[i] *= -0.5; }
        if (py[i] < 0) { py[i] = 0; vy[i] *= -0.5; } else if (py[i] > H - 0.01) { py[i] = H - 0.01; }
      }
      if (!springs || ptr || phase === "assemble") {
        relax = springs ? 0.5 : 0.3; coh = springs ? 0 : 0.08; repel();
        // position-based fluid: velocity follows what the constraints did (no jitter, no bouncing grains)
        for (let i = 0; i < N; i++) {
          if (t < born[i] || life[i] <= 0) continue;
          if ((springs && tx[i] >= 0) || star[i]) continue;
          px[i] = clamp(px[i], 0, W - 0.01); py[i] = clamp(py[i], 0, H - 0.01);
          let nvx = (px[i] - ox_[i]) / DT, nvy = (py[i] - oy_[i]) / DT;
          const sp = Math.hypot(nvx, nvy), cap = 180;
          if (sp > cap) { nvx *= cap / sp; nvy *= cap / sp; }
          vx[i] = nvx * 0.982; vy[i] = nvy * 0.982;   // viscous enough that the pool settles instead of splashing
          if (py[i] >= H - 0.02) vx[i] *= 0.97;            // floor friction
        }
      }
      // cat particles jump like a cat: a quick crouch, a ballistic arc (x at constant speed, y under
      // gravity, so it bursts off, hangs at the top and drops fast), then a squash on landing
      if (springs) for (let i = 0; i < N; i++) {
        if (!fly[i]) continue;
        const tt = t - FLY_T0 - fdl[i];
        if (tt <= 0) { px[i] = ox_[i]; py[i] = oy_[i]; vx[i] *= 0.9; vy[i] *= 0.9; continue; }
        if (tt < FLY_CROUCH) {
          // crouch: sink and lean back a little, then spring
          const c = Math.sin((tt / FLY_CROUCH) * Math.PI * 0.5);
          px[i] = fsx[i] - c * 0.6 * S; py[i] = Math.min(H - 0.01, fsy[i] + c * 0.9 * S);
          vx[i] = vy[i] = 0; continue;
        }
        if (!fh[i]) {
          // take off from the crouched spot; apex well above the landing spot
          fsx[i] = px[i]; fsy[i] = py[i];
          const apex = Math.max(1.5, ty[i] - H * 0.16);
          fh[i] = Math.max(1, (fsy[i] + ty[i]) / 2 - apex);
        }
        const u = Math.min(1, (tt - FLY_CROUCH) / FLY_DUR);
        const nx = fsx[i] + (tx[i] - fsx[i]) * u;
        const ny = fsy[i] + (ty[i] - fsy[i]) * u - fh[i] * 4 * u * (1 - u);
        vx[i] = (nx - ox_[i]) / DT; vy[i] = (ny - oy_[i]) / DT;
        px[i] = nx; py[i] = ny;
        if (u >= 1) {
          // land: hand over to the spring with a bit of the downward momentum -> small squash and settle
          fly[i] = 0; px[i] = tx[i]; py[i] = ty[i];
          vx[i] = ((tx[i] - fsx[i]) / FLY_DUR) * 0.12;
          vy[i] = ((ty[i] - fsy[i] + 4 * fh[i]) / FLY_DUR) * 0.16;
        }
      }
    }

    // static palette: warm off-white on the dark background, no colour cycling
    // water palette: vivid aqua; fast-moving water foams toward white, deep water leans blue
    const BASE_H = 192, BASE_S = 78;
    function hueAt() { return BASE_H; }

    function draw() {
      const Wpx = cols * cw, Hpx = rows * chh;
      ctx.clearRect(0, 0, Wpx, Hpx);
      cnt.fill(0); spd.fill(0);
      for (let i = 0; i < N; i++) {
        if (t < born[i] || life[i] <= 0) continue;
        if (life[i] < 1 && Math.random() > life[i]) continue;
        if (star[i] || hid[i]) continue;
        const c = Math.min(rows - 1, (py[i] / ASP) | 0) * cols + Math.min(cols - 1, px[i] | 0);
        cnt[c]++;
        if (pcls[i]) cellCls[c] = pcls[i]; else if (cnt[c] === 1) cellCls[c] = 0;
        spd[c] = Math.max(spd[c], Math.abs(vx[i]) + Math.abs(vy[i]));
      }
      const catK = smooth((t - 5.0) / 2.0);          // fades in while the particles are flying to their places
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.max(6, chh * 0.8).toFixed(1)}px "KoupiTerm","DejaVu Sans Mono",ui-monospace,Menlo,Consolas,monospace`;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const c = y * cols + x;
        trail[c] = Math.max(trail[c] * 0.82, cnt[c]);
        const v = trail[c];
        if (v <= 0.15) { cellCls[c] = 0; continue; }
        const foam = Math.min(1, spd[c] / 120);
        let L = 56 + Math.min(1, v / P) * 6 + foam * 26;
        ctx.globalAlpha = cnt[c] ? 1 : 0.5;
        let g = RAMP[clamp(Math.round((v / P) * 9), 1, 9)];
        const cc = cellCls[c];
        if (cc && catK > 0) {
          const st = CAT_STYLE[cc];
          const h = hueAt(x) + (st.h - hueAt(x)) * catK, sa = BASE_S + (st.s - BASE_S) * catK;
          const li = L + (st.l + (L - 62) * 0.5 - L) * catK;
          ctx.fillStyle = `hsl(${h | 0},${sa | 0}%,${li | 0}%)`;
          if (catK > 0.6 && cnt[c] && spd[c] < 4) g = st.g;
        } else ctx.fillStyle = `hsl(${(BASE_H + 14 - Math.min(1, v / P) * 14 - foam * 6) | 0},${(BASE_S - foam * 40) | 0}%,${L | 0}%)`;
        ctx.fillText(g, x * cw + cw / 2, y * chh + chh / 2);
      }
      // the terminal line as plain text, fading in per character as its particles land
      if (textOn) {
        updateText();
        const str = lineText(Math.floor(performance.now() / 530) % 2 === 0);
        ctx.font = `bold ${(m * chh * 0.8).toFixed(1)}px "KoupiTerm","DejaVu Sans Mono",ui-monospace,Menlo,Consolas,monospace`;
        ctx.fillStyle = "hsl(130,80%,58%)";
        for (const sl of slots) {
          const ch = str[sl.k];
          if (ch === " " || sl.a <= 0) continue;
          ctx.globalAlpha = Math.min(1, sl.a * 1.15);
          ctx.fillText(ch, (sl.x + m / 2) * cw, (sl.y + m / 2) * chh);
        }
        ctx.globalAlpha = 1;
      }
      // stars: dim, twinkling, never drawn over the letters or the cat
      if (nStars) {
        for (let i = 0; i < N; i++) {
          if (!star[i]) continue;
          const x = Math.min(cols - 1, px[i] | 0), y = Math.min(rows - 1, (py[i] / ASP) | 0), c = y * cols + x;
          if (trail[c] > 0.15) continue;
          const tw = 0.5 + 0.5 * Math.sin(t * (1.2 + sph[i] * 2.2) + sph[i] * 40);
          ctx.globalAlpha = 0.25 + 0.75 * tw * tw;
          ctx.fillStyle = `hsl(${(195 + sph[i] * 30) | 0},${(40 + tw * 30) | 0}%,${(72 + tw * 22) | 0}%)`;
          ctx.fillText(tw > 0.88 ? "*" : tw > 0.45 ? "+" : ".", x * cw + cw / 2, y * chh + chh / 2);
        }
        ctx.globalAlpha = 1;
      }
      // 3D shadow edges on the coarse letter grid, exact lines
      const shadowA = smooth((t - 6.2) / 1.5);
      if (shadowA > 0) {
        const CW = cw * S, CH = chh * S, gap = CW * 0.15;
        ctx.globalAlpha = shadowA; ctx.lineWidth = Math.max(1, CW * 0.09);
        for (const [gx, gy, e] of shade) {
          const X = gx * CW, Y = gy * CH, cx = X + CW / 2, cy = Y + CH / 2;
          ctx.strokeStyle = `hsl(220,6%,${(30 + shadowA * 12) | 0}%)`;
          ctx.beginPath();
          for (const o of [-gap, gap]) {
            if (e[0] || e[1]) { ctx.moveTo(e[0] ? X : cx - gap, cy + o); ctx.lineTo(e[1] ? X + CW : cx + gap, cy + o); }
            if (e[2] || e[3]) { ctx.moveTo(cx + o, e[2] ? Y : cy - gap); ctx.lineTo(cx + o, e[3] ? Y + CH : cy + gap); }
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      if (statusEl) {
        let alive = 0;
        for (let i = 0; i < N; i++) if (life[i] > 0 && t >= born[i]) alive++;
        statusEl.textContent = `physics.sim — particles: ${alive}  fps: ${Math.round(fps)}  t=${t.toFixed(2)}s` + (done ? "" : "  [any key to skip]");
      }
    }

    // ---- idle: now and then an ear flicks or the tail swishes ----
    const idle = { kind: 0, start: 0, dur: 0, next: 0 };
    function idleTick(now) {
      if (!done || reduced || !catXf) return false;
      if (!idle.next) idle.next = now + 1800 + Math.random() * 1500;
      if (!idle.kind) {
        if (now < idle.next) return false;
        const r = Math.random();
        idle.kind = r < 0.3 ? 1 : r < 0.6 ? 2 : r < 0.72 ? 4 : 3;     // 1/2 one ear, 4 both ears, 3 tail
        idle.dur = idle.kind === 3 ? 1600 : 520; idle.start = now;
      }
      const p = Math.min(1, (now - idle.start) / idle.dur);
      // ear: quick flick out and back, twice, fading; tail: a slow wave travelling to the tip
      const flick = Math.sin(p * Math.PI * 2) * (1 - p) * 0.55;
      for (let i = 0; i < N; i++) {
        const pt = ppart[i];
        if (!pt || tx[i] < 0) continue;
        let ang = 0, pvx = 0, pvy = 0;
        if (pt === 1 || pt === 2) {
          if (!(idle.kind === pt || idle.kind === 4)) continue;
          const E = pt === 1 ? EAR_L : EAR_R;
          ang = E.dir * flick; pvx = catXf(E.pivot[0]); pvy = catYf(E.pivot[1]);
        } else {
          if (idle.kind !== 3) continue;
          const sp = pps[i];
          ang = Math.sin(p * Math.PI * 2 - sp * 2.2) * Math.sin(p * Math.PI) * 0.38 * (0.25 + sp);
          pvx = catXf(TAIL[0][0]); pvy = catYf(TAIL[0][1]);
        }
        const dx = btx[i] - pvx, dy = bty[i] - pvy, c = Math.cos(ang), s_ = Math.sin(ang);
        tx[i] = clamp(pvx + dx * c - dy * s_, 0, W - 0.01); ty[i] = clamp(pvy + dx * s_ + dy * c, 0, H - 0.01);
      }
      if (p >= 1) {
        for (let i = 0; i < N; i++) if (ppart[i] && tx[i] >= 0) { tx[i] = btx[i]; ty[i] = bty[i]; }
        idle.kind = 0; idle.next = now + 2500 + Math.random() * 4500;
        wake = Math.max(wake, now + 700);               // let the spring settle back
      }
      return true;
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fps = fps * 0.9 + (dt > 0 ? 1 / dt : 60) * 0.1;
      const idling = idleTick(now);
      updateText();
      if (!done || ptr || now < wake || idling || (nStars && !reduced) || textOn) {
        acc += dt; let n = 0;
        while (acc >= DT && n < 4) { step(); acc -= DT; n++; }
        if (n === 4) acc = 0;
        draw();
      }
      requestAnimationFrame(loop);
    }

    // ---- input ----
    function onSkip(e) { if (!done) { if (e && e.type === "keydown") e.preventDefault(); settle(); draw(); } }
    function cleanupSkip() { removeEventListener("keydown", onSkip); }
    // key skip disabled (user, 2026-10-16)
    function toSim(e) {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * cols, y: ((e.clientY - r.top) / r.height) * rows * ASP };
    }
    canvas.addEventListener("pointermove", (e) => { if (done) { ptr = toSim(e); wake = performance.now() + 3000; } });
    canvas.addEventListener("pointerleave", () => { ptr = null; wake = performance.now() + 3000; });
    canvas.style.touchAction = "pan-y";
    addEventListener("resize", layout);
    layout();

    if (reduced) { settle(); draw(); return; }
    requestAnimationFrame((n) => { last = n; loop(n); });
  }
  window.KoupiFine = { start };
})();
