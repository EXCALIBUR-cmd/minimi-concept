const NS = "http://www.w3.org/2000/svg";
const C = {
  cream: "#f8f1e7",
  shade: "#eadccd",
  far: "#ece0d3",
  taupe: "#ab9b8d",
  taupeDark: "#8f7f72",
  taupeLight: "#cbbcae",
  pink: "#f2b6b2",
  nose: "#e98f8b",
  line: "#6a4f40",
  mouth: "#b9524e",
  tongue: "#ef8f8a",
};
const TAU = Math.PI * 2;
const damp = (x, t, l, dt) => x + (t - x) * (1 - Math.exp(-l * dt));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (x, a, b) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function angDist(a, b) {
  let d = ((a - b) % 360 + 540) % 360 - 180;
  return Math.abs(d);
}

function tuftMask(ranges) {
  return (deg) => {
    let m = 0;
    for (const [c, w, h] of ranges) {
      const d = angDist(deg, c);
      if (d < w) m = Math.max(m, h * (1 - (d / w) ** 2));
    }
    return m;
  };
}

function fluffPath(cx, cy, rx, ry, { n = 44, tufts = [], seed = 1, bulge = 0.9, rot = 0 } = {}) {
  const r = rng(seed);
  const mask = tuftMask(tufts);
  const pts = [];
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const P = (a) => {
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [cx + x * cr - y * sr, cy + x * sr + y * cr];
  };
  for (let i = 0; i < n; i++) pts.push((i / n) * TAU);
  let d = "";
  const p0 = P(pts[0]);
  d += `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`;
  let i = 0;
  while (i < n) {
    const span = 3;
    const aMid = (pts[i] + (i + span <= n ? (i + span < n ? pts[i + span] : TAU) : TAU)) / 2;
    const degMid = ((aMid * 180) / Math.PI + (rot * 180) / Math.PI + 360) % 360;
    const h = mask(degMid);
    if (h > 0.5 && i + span <= n) {
      const aEnd = i + span < n ? pts[i + span] : TAU;
      const pe = P(aEnd);
      const pm = P(aMid);
      const nx = pm[0] - cx, ny = pm[1] - cy;
      const len = Math.hypot(nx, ny) || 1;
      const ux = nx / len, uy = ny / len;
      const k = h * (0.85 + 0.4 * r());
      const lean = (r() - 0.35) * 0.9;
      const tx = pm[0] + ux * k - uy * k * lean;
      const ty = pm[1] + uy * k + ux * k * lean;
      const pa = P(pts[i] + (aEnd - pts[i]) * 0.3);
      const pb = P(pts[i] + (aEnd - pts[i]) * 0.72);
      const ps = P(pts[i]);
      const t1x = tx + (ps[0] - tx) * 0.2, t1y = ty + (ps[1] - ty) * 0.2;
      const t2x = tx + (pe[0] - tx) * 0.2, t2y = ty + (pe[1] - ty) * 0.2;
      d += ` Q${(pa[0] + ux * k * 0.4).toFixed(1)} ${(pa[1] + uy * k * 0.4).toFixed(1)} ${t1x.toFixed(1)} ${t1y.toFixed(1)}`;
      d += ` Q${tx.toFixed(1)} ${ty.toFixed(1)} ${t2x.toFixed(1)} ${t2y.toFixed(1)}`;
      d += ` Q${(pb[0] + ux * k * 0.25).toFixed(1)} ${(pb[1] + uy * k * 0.25).toFixed(1)} ${pe[0].toFixed(1)} ${pe[1].toFixed(1)}`;
      i += span;
    } else {
      const a0 = pts[i], a1 = i + 1 < n ? pts[i + 1] : TAU;
      const am = (a0 + a1) / 2;
      const p1 = P(a1), pm = P(am);
      const nx = pm[0] - cx, ny = pm[1] - cy;
      const len = Math.hypot(nx, ny) || 1;
      const bb = bulge * (0.6 + 0.8 * r());
      d += ` Q${(pm[0] + (nx / len) * bb).toFixed(1)} ${(pm[1] + (ny / len) * bb).toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
      i += 1;
    }
  }
  return d + "Z";
}

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

const STROKE = { stroke: C.line, "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" };

export function createCotton2D(svg, opts = {}) {
  const uid = "c" + Math.random().toString(36).slice(2, 7);
  const defs = el("defs", {}, svg);
  const soft = el("filter", { id: uid + "soft", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
  el("feGaussianBlur", { stdDeviation: 2.4 }, soft);
  const softer = el("filter", { id: uid + "softer", x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
  el("feGaussianBlur", { stdDeviation: 4.5 }, softer);
  const root = el("g", {}, svg);
  const flip = el("g", {}, root);
  const shadow = el("ellipse", { cx: 205, cy: 262, rx: 120, ry: 11, fill: "#5a3d2e", opacity: 0.14 }, flip);
  const bob = el("g", {}, flip);

  function leg(pivot, { back = false, near = true, seed = 1 }) {
    const g = el("g", {}, bob);
    const inner = el("g", {}, g);
    const fill = near ? C.cream : C.far;
    const len = 52;
    if (back) {
      el("path", { d: fluffPath(0, 6, 31, 29, { seed, n: 33, tufts: [[150, 35, 6]] }), fill, ...STROKE }, inner);
    }
    const lower = el("g", {}, inner);
    el("path", { d: fluffPath(0, len / 2 - 2, 19, len / 2 + 10, { seed: seed + 2, n: 30, tufts: [[180, 50, 7], [0, 50, 6]] }), fill, ...STROKE }, lower);
    const pawD = fluffPath(6, len + 6, 19, 15, { seed: seed + 7, n: 26, tufts: [[205, 30, 5], [330, 30, 5]] });
    const pcid = uid + "paw" + seed;
    el("clipPath", { id: pcid }, defs).appendChild(el("path", { d: pawD }));
    el("path", { d: pawD, fill }, lower);
    const pawShade = el("g", { "clip-path": `url(#${pcid})` }, lower);
    el("ellipse", { cx: 4, cy: len + 19, rx: 20, ry: 7, fill: C.shade, opacity: 0.9, filter: `url(#${uid}soft)` }, pawShade);
    el("ellipse", { cx: 2, cy: len - 1, rx: 9, ry: 4, fill: "#fffaf3", opacity: 0.8, filter: `url(#${uid}soft)` }, pawShade);
    el("path", { d: pawD, fill: "none", ...STROKE }, lower);
    el("path", { d: `M11 ${len + 20} q2.5 -5 0 -10 M19 ${len + 18} q2 -4 0 -8`, stroke: C.line, "stroke-width": 1.9, "stroke-linecap": "round", fill: "none", opacity: 0.6 }, lower);
    return { g, inner, lower, pivot, back };
  }

  const tailRoot = el("g", {}, bob);
  const legsFar = { bl: leg([152, 204], { back: true, near: false, seed: 11 }), fl: leg([252, 210], { near: false, seed: 21 }) };

  const legsNear = { br: leg([166, 210], { back: true, near: true, seed: 31 }), fr: leg([266, 214], { near: true, seed: 41 }) };
  const bodyG = el("g", {}, bob);
  const bodyPath = fluffPath(210, 186, 82, 56, {
    seed: 5,
    n: 42,
    tufts: [
      [10, 26, 8],
      [42, 22, 9],
      [205, 25, 7],
    ],
  });
  el("clipPath", { id: uid + "body" }, defs).appendChild(el("path", { d: bodyPath }));
  el("path", { d: bodyPath, fill: C.cream, ...STROKE }, bodyG);
  const bodyShadeClip = el("g", { "clip-path": `url(#${uid}body)` }, bodyG);
  const bodyShade = el("g", { filter: `url(#${uid}soft)` }, bodyShadeClip);
  el("ellipse", { cx: 276, cy: 168, rx: 40, ry: 18, fill: C.shade, opacity: 0.9 }, bodyShade);
  el("path", { d: "M262 196 q7 7 14 3 M272 210 q6 6 13 2 M252 212 q6 6 12 2", stroke: C.line, "stroke-width": 1.5, fill: "none", opacity: 0.28, "stroke-linecap": "round" }, bodyShadeClip);
  el("ellipse", { cx: 190, cy: 236, rx: 110, ry: 30, fill: C.shade, opacity: 0.8 }, bodyShade);
  el("path", { d: fluffPath(236, 140, 46, 26, { seed: 9, tufts: [[90, 70, 9], [140, 30, 7]] }), fill: C.taupeLight, opacity: 0.85 }, bodyShade);
  el("path", { d: fluffPath(146, 152, 30, 22, { seed: 13, tufts: [[60, 60, 7]] }), fill: C.taupeLight, opacity: 0.55 }, bodyShade);
  el("path", { d: "M150 170 q10 6 20 0 M175 205 q8 5 16 0 M120 195 q8 6 16 0", stroke: C.line, "stroke-width": 1.8, fill: "none", opacity: 0.35, "stroke-linecap": "round" }, bodyShade);

  const haunch = el("g", { opacity: 0 }, bob);
  el("path", { d: fluffPath(182, 252, 24, 12, { seed: 61, n: 22 }), fill: C.cream, ...STROKE }, haunch);
  el("path", { d: "M177 258 l1 -6 M187 258 l0 -6", stroke: C.line, "stroke-width": 2.2, "stroke-linecap": "round", fill: "none", opacity: 0.65 }, haunch);
  el("path", { d: fluffPath(160, 222, 42, 34, { seed: 51, n: 33, tufts: [[100, 45, 9], [150, 35, 9], [40, 30, 7]] }), fill: C.cream, ...STROKE }, haunch);
  el("path", { d: "M142 214 q14 -10 30 -4", stroke: C.line, "stroke-width": 1.8, fill: "none", opacity: 0.35 }, haunch);
  const sleepTail = el("g", { opacity: 0 }, bob);
  el("path", { d: fluffPath(226, 236, 94, 15, { seed: 71, n: 40, tufts: [[90, 60, 7], [270, 50, 6]] }), fill: C.taupe, ...STROKE }, sleepTail);
  el("path", { d: fluffPath(308, 231, 22, 15, { seed: 73, n: 20, tufts: [[300, 60, 7]] }), fill: C.taupeDark, ...STROKE }, sleepTail);


  const neck = el("g", {}, bob);
  const headG = el("g", {}, neck);
  const HX = 306, HY = 122;
  const earBack = el("g", {}, headG);
  el("path", { d: "M244 104 L248 36 Q252 29 261 34 L298 76 Z", fill: C.taupeDark, ...STROKE }, earBack);
  el("path", { d: "M254 92 L256 50 L286 79 Z", fill: C.pink }, earBack);
  el("path", { d: "M258 86 l6 -14 M264 88 l8 -12 M262 78 l2 -12", stroke: C.cream, "stroke-width": 2.4, "stroke-linecap": "round", fill: "none" }, earBack);
  const earFront = el("g", {}, headG);
  el("path", { d: "M314 74 L353 33 Q361 28 363 37 L358 106 Z", fill: C.taupe, ...STROKE }, earFront);
  el("path", { d: "M324 76 L352 46 L350 96 Z", fill: C.pink }, earFront);
  el("path", { d: "M338 90 l8 -12 M342 96 l9 -8 M346 84 l4 -12", stroke: C.cream, "stroke-width": 2.4, "stroke-linecap": "round", fill: "none" }, earFront);
  const headPath = fluffPath(HX, HY, 70, 56, {
    seed: 3,
    n: 48,
    tufts: [
      [16, 18, 12],
      [55, 16, 5],
      [125, 16, 5],
      [164, 18, 12],
      [205, 16, 7],
      [262, 14, 6],
    ],
  });
  el("clipPath", { id: uid + "head" }, defs).appendChild(el("path", { d: headPath }));
  el("path", { d: headPath, fill: C.cream, ...STROKE }, headG);
  const headPaintClip = el("g", { "clip-path": `url(#${uid}head)` }, headG);
  const headPaint = el("g", { filter: `url(#${uid}soft)` }, headPaintClip);
  el("ellipse", { cx: 306, cy: 170, rx: 70, ry: 22, fill: C.shade, opacity: 0.7 }, headPaint);
  el("path", { d: fluffPath(270, 78, 60, 36, { seed: 23, n: 40, tufts: [[70, 50, 10], [110, 35, 9], [40, 30, 8]] }), fill: C.taupe }, headPaint);
  el("path", { d: fluffPath(240, 120, 16, 26, { seed: 37, n: 24, tufts: [[0, 70, 7]] }), fill: C.taupeLight, opacity: 0.8 }, headPaint);
  el("path", { d: fluffPath(352, 92, 30, 24, { seed: 29, n: 28, tufts: [[120, 50, 9], [80, 30, 7]] }), fill: C.taupe }, headPaint);
  el("path", { d: "M301 122 Q303 100 307 74 Q313 98 317 122 Q309 117 301 122 Z", fill: C.cream }, headPaint);
  el("path", { d: "M302 106 l4 -10 M311 104 l1 -11", stroke: C.taupeLight, "stroke-width": 2, "stroke-linecap": "round", fill: "none" }, headPaint);
  el("path", { d: "M252 110 q8 -5 15 1 M258 96 q7 -4 13 1 M336 104 q6 -5 12 0", stroke: C.line, "stroke-width": 1.6, fill: "none", opacity: 0.3 }, headPaint);
  el("path", { d: "M262 152 l-8 6 M270 158 l-6 8 M352 150 l9 5 M346 157 l6 8", stroke: C.line, "stroke-width": 1.6, "stroke-linecap": "round", fill: "none", opacity: 0.35 }, headPaint);

  const face = el("g", {}, headG);
  const EYES = [[289, 129], [331, 127]];
  const eyesOpen = el("g", { display: "none" }, face);
  for (const [x, y] of EYES) {
    el("ellipse", { cx: x, cy: y, rx: 6.5, ry: 8.5, fill: C.line }, eyesOpen);
    el("circle", { cx: x + 2.2, cy: y - 3.2, r: 2.3, fill: "#fff" }, eyesOpen);
  }
  const eyesHappy = el("g", {}, face);
  for (const [x, y] of EYES) {
    el("path", { d: `M${x - 9} ${y + 3} Q${x} ${y - 9} ${x + 9} ${y + 3}`, stroke: C.line, "stroke-width": 3.8, fill: "none", "stroke-linecap": "round" }, eyesHappy);
  }
  const eyesSleep = el("g", { display: "none" }, face);
  for (const [x, y] of EYES) {
    el("path", { d: `M${x - 9} ${y - 2} Q${x} ${y + 7} ${x + 9} ${y - 2}`, stroke: C.line, "stroke-width": 3.4, fill: "none", "stroke-linecap": "round" }, eyesSleep);
  }
  el("ellipse", { cx: 280, cy: 143, rx: 10, ry: 6, fill: C.pink, opacity: 0.75, filter: `url(#${uid}soft)` }, face);
  el("ellipse", { cx: 341, cy: 141, rx: 10, ry: 6, fill: C.pink, opacity: 0.75, filter: `url(#${uid}soft)` }, face);
  el("path", { d: "M305 137 q5 -2.5 10 0 q-1.5 5 -5 6 q-3.5 -1 -5 -6 Z", fill: C.nose, stroke: C.line, "stroke-width": 1.5, "stroke-linejoin": "round" }, face);
  const mouthClosed = el("path", { d: "M301 148 q4.5 5 9 0 q4.5 5 9 0 M310 143 l0 5", stroke: C.line, "stroke-width": 2.3, fill: "none", "stroke-linecap": "round" }, face);
  const mouthOpen = el("g", { display: "none" }, face);
  el("path", { d: "M295 146 Q310 139 325 146 Q326 177 310 181 Q294 177 295 146 Z", fill: C.mouth, stroke: C.line, "stroke-width": 2.4, "stroke-linejoin": "round" }, mouthOpen);
  el("path", { d: "M300 169 Q310 157 320 169 Q317 179 310 179 Q303 179 300 169 Z", fill: C.tongue }, mouthOpen);
  el("path", { d: "M300 148 l3 5 l2 -5 Z M320 148 l-3 5 l-2 -5 Z", fill: "#fff" }, mouthOpen);
  el("path", { d: "M310 143 l0 3", stroke: C.line, "stroke-width": 2.2, "stroke-linecap": "round" }, mouthOpen);

  const tailGrad = el("linearGradient", { id: uid + "tg", gradientUnits: "userSpaceOnUse" }, defs);
  el("stop", { offset: "0", "stop-color": "#e4d8cb" }, tailGrad);
  el("stop", { offset: "0.3", "stop-color": C.taupeLight }, tailGrad);
  el("stop", { offset: "0.62", "stop-color": C.taupe }, tailGrad);
  el("stop", { offset: "1", "stop-color": C.taupeDark }, tailGrad);
  const tailPath = el("path", { fill: `url(#${uid}tg)`, ...STROKE }, tailRoot);
  const tailClip = el("clipPath", { id: uid + "tc" }, defs);
  const tailClipPath = el("path", {}, tailClip);
  const tailInner = el("g", { "clip-path": `url(#${uid}tc)` }, tailRoot);
  const tailHi = el("path", { fill: "none", stroke: "#e9dccf", "stroke-width": 9, "stroke-linecap": "round", opacity: 0.55, filter: `url(#${uid}softer)` }, tailInner);
  const tailFur = el("path", { fill: "none", stroke: C.line, "stroke-width": 1.5, "stroke-linecap": "round", opacity: 0.28 }, tailRoot);
  const TN = 16;
  const tr2 = rng(77);
  const bumpL = Array.from({ length: TN + 1 }, (_, i) => (i % 2 ? 1 : -0.35) * (0.7 + 0.6 * tr2()));
  const bumpR = Array.from({ length: TN + 1 }, (_, i) => (i % 2 ? -0.35 : 1) * (0.7 + 0.6 * tr2()));
  const tailAngles = new Array(TN).fill(0);
  function drawTail() {
    const SEGL = 9;
    let x = 130, y = 166, a = 0;
    const P = [[x, y]], N = [];
    for (let i = 0; i < TN; i++) {
      a += tailAngles[i];
      x += Math.sin(a) * SEGL;
      y -= Math.cos(a) * SEGL;
      P.push([x, y]);
    }
    for (let i = 0; i <= TN; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(TN, i + 1)];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
      N.push([-dy / l, dx / l]);
    }
    const W = (t) => 7 + 19 * Math.pow(Math.sin(Math.PI * (0.12 + 0.83 * t)), 0.85);
    const L = [], R = [];
    for (let i = 0; i <= TN; i++) {
      const t = i / TN, w = W(t);
      const f = t > 0.08 ? 0.17 : 0;
      L.push([P[i][0] + N[i][0] * w * (1 + f * bumpL[i]), P[i][1] + N[i][1] * w * (1 + f * bumpL[i])]);
      R.push([P[i][0] - N[i][0] * w * (1 + f * bumpR[i]), P[i][1] - N[i][1] * w * (1 + f * bumpR[i])]);
    }
    const smooth = (pts) => {
      let d = "";
      for (let i = 1; i < pts.length - 1; i++) {
        const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
        d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
      }
      return d;
    };
    const tip = P[TN], tdx = tip[0] - P[TN - 1][0], tdy = tip[1] - P[TN - 1][1], tl = Math.hypot(tdx, tdy) || 1;
    const ext = [tip[0] + (tdx / tl) * 14, tip[1] + (tdy / tl) * 14];
    const Rr = R.slice().reverse();
    let d = `M${L[0][0].toFixed(1)} ${L[0][1].toFixed(1)}` + smooth(L);
    d += ` Q${ext[0].toFixed(1)} ${ext[1].toFixed(1)} ${Rr[1][0].toFixed(1)} ${Rr[1][1].toFixed(1)}`;
    d += smooth(Rr.slice(1)) + ` L${R[0][0].toFixed(1)} ${R[0][1].toFixed(1)} Z`;
    tailPath.setAttribute("d", d);
    tailClipPath.setAttribute("d", d);
    let hd = "";
    for (let i = 2; i <= TN - 2; i++) {
      const w = W(i / TN) * 0.35;
      hd += `${i === 2 ? "M" : "L"}${(P[i][0] + N[i][0] * w).toFixed(1)} ${(P[i][1] + N[i][1] * w).toFixed(1)}`;
    }
    tailHi.setAttribute("d", hd);
    let fd = "";
    for (let i = 3; i < TN - 1; i += 2) {
      const w = W(i / TN);
      for (const sgn of [1, -1]) {
        const ax = P[i][0] + N[i][0] * w * 0.45 * sgn, ay = P[i][1] + N[i][1] * w * 0.45 * sgn;
        const bx = P[i + 1][0] + N[i + 1][0] * w * 0.8 * sgn, by = P[i + 1][1] + N[i + 1][1] * w * 0.8 * sgn;
        fd += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
    }
    tailFur.setAttribute("d", fd);
    tailGrad.setAttribute("x1", P[0][0]); tailGrad.setAttribute("y1", P[0][1]);
    tailGrad.setAttribute("x2", tip[0]); tailGrad.setAttribute("y2", tip[1]);
  }

  bob.insertBefore(tailRoot, bob.firstChild);

  const s = {
    state: "idle", speed: 0, targetSpeed: 0, move: 0, phase: 0, dir: 1, flipX: 1, t: 0,
    blinkT: 2, blink: 0, happy: 0, hopT: -1, eatT: 0, earT: 1.5, earTwitch: 0, lookX: 0, lookY: 0,
    w: { sit: 0, sleep: 0, eat: 0 }, x: 0,
    act: null, actT: 0, actDur: 0, nextAct: 5 + Math.random() * 4, tiltDir: 1, earWhich: 0,
  };

  function setState(name) {
    s.state = name;
    s.targetSpeed = name === "walk" ? 0.35 : name === "run" ? 1 : 0;
    if (name === "eat") s.eatT = 0;
  }
  function setSpeed(v) {
    s.targetSpeed = Math.max(0, Math.min(1, v));
    if (s.targetSpeed > 0.02 && !(s.state === "walk" || s.state === "run")) s.state = s.targetSpeed > 0.6 ? "run" : "walk";
    if (s.targetSpeed <= 0.02 && (s.state === "walk" || s.state === "run")) s.state = "idle";
  }
  const setDirection = (d) => (s.dir = d >= 0 ? 1 : -1);
  const lookAt = (nx, ny) => { s.lookX = Math.max(-1, Math.min(1, nx)); s.lookY = Math.max(-1, Math.min(1, ny)); };
  const hop = () => { s.hopT = 0; s.happy = 1.2; };
  const DUR = { tilt: 1.8, stretch: 2.6, yawn: 1.7 };
  const act = (name) => { if (!DUR[name]) return; s.act = name; s.actT = 0; s.actDur = DUR[name]; s.tiltDir = Math.random() < 0.5 ? -1 : 1; };

  const tr = (g, x, y, rot = 0, sx = 1, sy = 1, px = 0, py = 0) =>
    g.setAttribute("transform", `translate(${(x + px).toFixed(2)} ${(y + py).toFixed(2)}) rotate(${((rot * 180) / Math.PI).toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${(-px).toFixed(2)} ${(-py).toFixed(2)})`);

  function update(dt) {
    dt = Math.min(dt, 1 / 20);
    s.t += dt;
    s.speed = damp(s.speed, s.targetSpeed, 4, dt);
    s.move = damp(s.move, s.speed > 0.02 ? 1 : 0, 6, dt);
    const sp = s.speed;
    const runK = ss(sp, 0.45, 0.85);
    for (const k of ["sit", "sleep", "eat"]) s.w[k] = damp(s.w[k], s.state === k ? 1 : 0, 5, dt);
    const still = 1 - s.move;
    const sit = s.w.sit * still, sleep = s.w.sleep * still, eat = s.w.eat * still;
    if (!s.act && s.state === "idle" && still > 0.95) {
      s.nextAct -= dt;
      if (s.nextAct <= 0) {
        const pool = ["tilt", "stretch", "tilt", "yawn"];
        act(pool[Math.floor(Math.random() * pool.length)]);
        s.nextAct = 6 + Math.random() * 6;
      }
    }
    let tiltE = 0, stretchE = 0, yawnE = 0;
    if (s.act) {
      s.actT += dt;
      const D = s.actDur, T = s.actT;
      const e = ss(T, 0, D * 0.28) * (1 - ss(T, D * 0.72, D));
      if (s.act === "tilt") tiltE = e;
      if (s.act === "stretch") stretchE = e * still;
      if (s.act === "yawn") yawnE = e;
      if (T >= D) s.act = null;
    }

    s.flipX = damp(s.flipX, s.dir, 10, dt);
    const fx = Math.abs(s.flipX) < 0.08 ? 0.08 * Math.sign(s.flipX || 1) : s.flipX;
    flip.setAttribute("transform", `translate(205 0) scale(${fx.toFixed(3)} 1) translate(-205 0)`);

    const freq = lerp(1.7, 3.6, sp);
    s.phase += dt * freq * TAU * s.move;
    const p = s.phase;
    const amp = s.move * lerp(0.42, 0.72, sp);

    let hopY = 0;
    if (s.hopT >= 0) {
      s.hopT += dt;
      const h = s.hopT / 0.55;
      if (h >= 1) s.hopT = -1;
      else hopY = Math.sin(h * Math.PI) * 42;
    }
    const breathe = Math.sin(s.t * (sleep > 0.5 ? 1.5 : 2.6)) * (sleep > 0.5 ? 0.035 : 0.015);
    const bobY = -Math.abs(Math.sin(p)) * 7 * s.move * (0.6 + sp) - hopY + sleep * 26 + sit * 16 + stretchE * 12;
    const pitch = Math.sin(p * 2) * 0.05 * s.move * runK + s.move * sp * 0.04 - sit * 0.34 + eat * 0.06 + stretchE * 0.3;
    const squash = 1 + breathe + (s.hopT >= 0 ? -0.04 : 0);
    bob.setAttribute("transform", `translate(0 ${bobY.toFixed(2)}) rotate(${((pitch * 180) / Math.PI).toFixed(2)} 162 222) translate(0 ${(220 * (1 - squash)).toFixed(2)}) scale(1 ${squash.toFixed(3)})`);

    const walkOff = { fl: 0, br: 0.15, fr: Math.PI, bl: Math.PI + 0.15 };
    const runOff = { fl: 0, fr: 0.4, bl: Math.PI, br: Math.PI + 0.4 };
    const all = { ...legsFar, ...legsNear };
    for (const k in all) {
      const L = all[k];
      const off = lerp(walkOff[k], runOff[k], runK);
      const ph = p + off;
      let rot = -Math.sin(ph) * amp;
      const lift = Math.max(0, Math.cos(ph)) * amp;
      let knee = (k[0] === "f" ? -1 : 1) * lift * 0.55;
      let sy = 1, ty = 0, tx = 0;
      if (L.back) {
        rot += sit * 0.34 - stretchE * 0.26;
        sy = Math.max(0.05, 1 - sleep * 0.8 - sit * 0.75);
        ty = -sleep * 4 - sit * 4;
      } else {
        rot += sit * 0.34 + eat * 0.1 - stretchE * 1.25;
        sy = Math.max(0.05, 1 - sleep * 0.8 + sit * 0.28 + stretchE * 0.18);
        tx = 0;
      }
      const [px, py] = L.pivot;
      L.g.setAttribute("transform", `translate(${(px + tx).toFixed(2)} ${(py + ty).toFixed(2)}) rotate(${((rot * 180) / Math.PI).toFixed(2)}) scale(1 ${sy.toFixed(3)})`);
      L.lower.setAttribute("transform", `translate(0 ${L.back ? 20 : 8}) rotate(${((knee * 180) / Math.PI).toFixed(2)}) translate(0 ${L.back ? -20 : -8})`);
    }

    s.eatT += dt;
    const chew = eat * Math.sin(s.eatT * 9);
    const headRot = -pitch * 0.85 - s.lookY * 0.18 * (1 - sleep) + eat * 0.42 + chew * 0.05 + sleep * 0.28 - stretchE * 0.34 - yawnE * 0.24 + Math.sin(s.t * 1.3) * 0.025 * still * (1 - sleep) - Math.sin(p * 2) * 0.03 * s.move;
    const hx = s.lookX * 4 * still * (1 - sleep) - sleep * 10 - eat * 4;
    const hy = sleep * 22 + eat * 10;
    headG.setAttribute("transform", `rotate(${(tiltE * 13 * s.tiltDir).toFixed(2)} 306 128)`);
    neck.setAttribute("transform", `translate(${hx.toFixed(2)} ${hy.toFixed(2)}) rotate(${((headRot * 180) / Math.PI).toFixed(2)} 268 162)`);

    s.earT -= dt;
    if (s.earT <= 0) { s.earTwitch = 1; s.earWhich = Math.random() < 0.5 ? 0 : 1; s.earT = 1.6 + Math.random() * 3.5; }
    s.earTwitch = damp(s.earTwitch, 0, 9, dt);
    const earBackRot = -(s.move * sp * 0.25) - (s.earWhich === 0 ? s.earTwitch * 0.32 : 0) - sleep * 0.15 - yawnE * 0.28 - tiltE * 0.1 * s.tiltDir;
    earBack.setAttribute("transform", `rotate(${((earBackRot * 180) / Math.PI).toFixed(2)} 270 92)`);
    earFront.setAttribute("transform", `rotate(${((-(s.move * sp * 0.22) + (s.earWhich === 1 ? s.earTwitch * 0.3 : 0) - sleep * 0.12 + yawnE * 0.22) * 180 / Math.PI).toFixed(2)} 326 92)`);

    s.blinkT -= dt;
    if (s.blinkT <= 0) { s.blink = 1; s.blinkT = 2.2 + Math.random() * 3.5; }
    s.blink = Math.max(0, s.blink - dt * 7);
    const bs = 1 - Math.sin(Math.min(1, s.blink) * Math.PI) * 0.9;
    s.happy = Math.max(0, s.happy - dt);
    const happyOn = s.happy > 0 || eat > 0.5 || s.move < 0.5;
    const sleepOn = sleep > 0.5;
    eyesOpen.setAttribute("display", happyOn || sleepOn ? "none" : "inline");
    eyesOpen.setAttribute("transform", `translate(0 ${(128 * (1 - bs)).toFixed(2)}) scale(1 ${bs.toFixed(3)})`);
    eyesHappy.setAttribute("display", happyOn && !sleepOn ? "inline" : "none");
    eyesSleep.setAttribute("display", sleepOn ? "inline" : "none");
    const mouthAmt = Math.max(eat > 0.5 ? 0.55 + 0.45 * Math.sin(s.eatT * 9) : s.happy > 0.6 ? 1 : 0, ss(Math.max(stretchE, yawnE), 0.25, 0.9) * 1.1);
    mouthOpen.setAttribute("display", mouthAmt > 0.15 ? "inline" : "none");
    mouthOpen.setAttribute("transform", `translate(0 ${(144 * (1 - Math.max(0.25, mouthAmt))).toFixed(2)}) scale(1 ${Math.max(0.25, mouthAmt).toFixed(3)})`);
    mouthClosed.setAttribute("display", mouthAmt > 0.15 ? "none" : "inline");

    for (let i = 0; i < TN; i++) {
      const t = i / (TN - 1);
      const idle = i === 0 ? -0.5 : -0.02 + Math.pow(t, 1.6) * 0.5;
      const sway = Math.sin(s.t * 2.2 - i * 0.32) * 0.06 * still * (1 - sleep);
      const run = i === 0 ? -1.2 : 0.03 + Math.sin(p * 2 - i * 0.4) * 0.05;
      let r = lerp(idle, run, s.move) + (i > 0 ? sway : 0);
      r = lerp(r, i === 0 ? -1.9 : 0.17, sit * 0.9);
      r = lerp(r, i === 0 ? -2.05 : 0.2, sleep);
      r += i === 0 ? stretchE * 0.5 : stretchE * 0.02;
      tailAngles[i] = r;
    }
    drawTail();

    haunch.setAttribute("opacity", ss(sit, 0.3, 0.8).toFixed(3));
    sleepTail.setAttribute("opacity", ss(sleep, 0.35, 0.8).toFixed(3));
    tailRoot.setAttribute("opacity", (1 - ss(sleep, 0.35, 0.8)).toFixed(3));
    shadow.setAttribute("rx", (120 * (1 - hopY / 120)).toFixed(1));
    shadow.setAttribute("opacity", (0.14 * (1 - hopY / 60)).toFixed(3));
  }

  update(0);
  return { svg, setState, setSpeed, setDirection, lookAt, hop, act, update, get state() { return s.state; } };
}
