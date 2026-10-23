/* ════════════════════════════════════════════════════════════════════
   baseball/face.js — 眼睛＋鬍子外掛（獨立檔；讀不到就維持原版黑眼、無鬍子）
   ────────────────────────────────────────────────────────────────────
   規格（face-map.json 的 players[球員id]，或 teams.json 球員的 "face" 欄位）：
     { "eyes":  { "style":"anime",    "color":"#3a7bd5", "size":0.5 },
       "beard": { "style":"goatee",   "color":"#2b1d14", "length":0.5 },
       "cheeks":{ "style":"blush",    "color":"#ff8fa0", "size":0.5 } }
     eyes.style   round anime happy …（沒寫＝保留原版眼睛）；"default"/"none" 也是原版
     eyes.color   主色（虹膜或線條色）；beard.color 鬍色。"#rrggbb" 或色名（見 PALETTE）
     cheeks.style none（拿掉腮紅）blush（腮紅，已貼合臉頰）eyeblack（防反光黑線）；沒寫＝保留原版腮紅
     eyes.size    0~1 眼睛大小；beard.length 0~1 鬍子長度／寬度；cheeks.size 0~1 腮紅／黑線大小
     beard.style  mustache goatee full …（"none"＝無鬍）；只寫字串也行："beard":"full"

   【新增造型指南】（只需改本檔，不必動 baseball.html）
   1. 眼睛：在 EYES 加一項  名稱:{zh, dc:預設主色, build:(s,k)=>[{c,g},…]}
        s＝左右眼符號（-1/+1，兩眼各呼叫一次；不對稱細節用 s 鏡射），k＝大小倍率。
        回傳「圖層」陣列：c＝顏色（'main'＝使用者指定的主色；'#rrggbb'；前面加 '!' 表示自發光，
        例如高光 '!#ffffff'），g＝幾何。後面的圖層請用較大的 off（離臉皮的距離）疊在上面，
        每層至少差 0.004，避免閃爍。顏色前綴可疊加：'!'＝自發光、'~'＝半透明(0.75)，例如 '~main'。
   2. 鬍子：在 BEARDS 加一項  名稱:{zh, build:(len)=>[{c:'main',g},…]}
      腮紅／臉頰彩繪：在 CHEEKS 加一項  名稱:{zh, dc, build:(s,k)=>[{c,g},…]}（和眼睛一樣左右各呼叫一次；
      cheeks 的 'none' 代表「拿掉原版腮紅」，所以 build 回傳空陣列也算有效設定）
   3. 座標：頭節點局部座標，臉朝 +z，y 向上，頭半徑 0.35。眼睛中心約 x=±0.126、y=-0.02。
        臉頰（腮紅）中心約 x=±0.231、y=-0.125；臉頰彩繪請放在 |x|=0.08~0.28、y=-0.18~-0.07；下巴最低 y≈-0.2825。
        帽緣（帽簷）在 y≈0.05 以上 → 眼睛最高不要超過 y=0.045。
        頭盔護耳在 θ>70° 的側面 → 鬍子只畫在 |θ|≤66°（正面往兩側 66° 內）。θ：0＝正前方。
   4. 基本件（回傳 {p,i}）：
        patch(cx,cy,rx,ry,off)   貼在臉皮上的橢圓貼片（眼白、虹膜、瞳孔、高光）
        strip(點[[x,y],…],寬,off) 貼在臉皮上的帶狀線（笑眼弧線、眉）
        tube(3D控制點,半徑函式(t),邊數)  立體圓管（八字鬍）
        lower({tm,top,bot,t})     下半臉鬍殼：tm＝左右半角、top(θ)/bot(θ)＝上下緣 y、t＝厚度
        cone(底心,方向,半徑,高度)  尖鬚（山羊鬚尖端）
        surfZ(x,y)＝臉皮在 (x,y) 的 z；prof(y)＝剖面半徑與法線
   5. 驗證：與本檔同資料夾執行  node test-face.js   → 出現 FAIL 就修；全過會印 failures 0
   ════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const PI = Math.PI, TAU = PI * 2;
const H = { R: 0.35, CY: 0.055, LO: -0.02, K: 0.75 };                 // 與 chibi() 頭型一致
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rad = d => d * PI / 180;
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function skinR(y) {                                                     // 頭皮半徑（隨高度）
  if (y >= H.CY) return Math.sqrt(Math.max(0, H.R * H.R - (y - H.CY) ** 2));
  if (y >= H.LO) return H.R;
  const d = (H.LO - y) / (H.R * H.K); return d >= 1 ? 0 : H.R * Math.sqrt(1 - d * d);
}
function prof(y) {                                                      // 半徑＋外法線(水平分量 nr、垂直分量 ny)
  const r = skinR(y);
  if (y >= H.CY) { const d = y - H.CY; return { r, nr: r / H.R, ny: d / H.R }; }
  if (y >= H.LO) return { r, nr: 1, ny: 0 };
  const b = H.R * H.K; let a = r / (H.R * H.R), c = (y - H.LO) / (b * b); const l = Math.hypot(a, c) || 1;
  return { r, nr: a / l, ny: c / l };
}
const surfZ = (x, y) => Math.sqrt(Math.max(0, skinR(y) ** 2 - x * x));

function merge(parts) {
  const p = [], i = [];
  parts.forEach(g => { const o = p.length / 3; g.p.forEach(v => p.push(v)); g.i.forEach(v => i.push(v + o)); });
  return { p, i };
}
function patch(cx, cy, rx, ry, off) {                                   // 貼在臉上的橢圓
  const NR = 4, NS = 18, P = [cx, cy, surfZ(cx, cy) + off], I = [];
  for (let r = 1; r <= NR; r++) for (let s = 0; s < NS; s++) {
    const a = s / NS * TAU, x = cx + rx * r / NR * Math.cos(a), y = cy + ry * r / NR * Math.sin(a); P.push(x, y, surfZ(x, y) + off);
  }
  for (let s = 0; s < NS; s++) I.push(0, 1 + s, 1 + (s + 1) % NS);
  for (let r = 1; r < NR; r++) for (let s = 0; s < NS; s++) {
    const a = 1 + (r - 1) * NS + s, b = 1 + (r - 1) * NS + (s + 1) % NS, c = a + NS, d = b + NS; I.push(a, c, b, b, c, d);
  }
  return { p: P, i: I };
}
function strip(pts, w, off) {                                           // 貼在臉上的帶狀線
  const P = [], I = [], n = pts.length;
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    const hw = (typeof w === 'function' ? w(i / (n - 1)) : w) / 2;
    [-1, 1].forEach(s => { const x = q[0] + (-ty / l) * hw * s, y = q[1] + (tx / l) * hw * s; P.push(x, y, surfZ(x, y) + off); });
  });
  for (let i = 0; i < n - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  return { p: P, i: I };
}
function spline(pts, per) {
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let s = 0; s < per; s++) { const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  out.push(pts[n - 1].slice()); return out;
}
function tube(ctrl, rad_, sides) {
  const path = spline(ctrl, 6), n = path.length, S = sides || 6, P = [], I = [];
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)], t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    const ref = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], s = norm(cross(t, ref)), u = cross(t, s), r = rad_(i / (n - 1));
    for (let k = 0; k < S; k++) { const an = k / S * TAU, c = Math.cos(an), sn = Math.sin(an);
      P.push(path[i][0] + (s[0] * c + u[0] * sn) * r, path[i][1] + (s[1] * c + u[1] * sn) * r, path[i][2] + (s[2] * c + u[2] * sn) * r); }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < S; k++) { const a = i * S + k, b = i * S + (k + 1) % S, c = a + S, d = b + S; I.push(a, c, b, b, c, d); }
  const e = P.length / 3; P.push(path[n - 1][0], path[n - 1][1], path[n - 1][2]);
  for (let k = 0; k < S; k++) I.push((n - 1) * S + k, e, (n - 1) * S + (k + 1) % S);
  return { p: P, i: I };
}
function cone(b, d, r, h) {
  d = norm(d); const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], s = norm(cross(d, ref)), u = cross(d, s), S = 6, P = [], I = [];
  for (let k = 0; k < S; k++) { const a = k / S * TAU, c = Math.cos(a), sn = Math.sin(a); P.push(b[0] + (s[0] * c + u[0] * sn) * r, b[1] + (s[1] * c + u[1] * sn) * r, b[2] + (s[2] * c + u[2] * sn) * r); }
  P.push(b[0] + d[0] * h, b[1] + d[1] * h, b[2] + d[2] * h);
  for (let k = 0; k < S; k++) I.push(k, S, (k + 1) % S);
  return { p: P, i: I };
}
function lower(o) {                                                     // 下半臉鬍殼：θ∈[-tm,tm]，y 由 top(θ) 到 bot(θ)
  const NT = 16, NU = 8, P = [], I = [];
  for (let j = 0; j <= NT; j++) {
    const th = -o.tm + 2 * o.tm * j / NT, top = o.top(th), bot = o.bot(th);
    for (let k = 0; k <= NU; k++) {
      const y = lerp(top, bot, k / NU), pr = prof(y);
      const edge = Math.min(sstep(0, 0.15, j / NT), sstep(0, 0.15, 1 - j / NT), sstep(0, 0.12, k / NU), sstep(0, 0.12, 1 - k / NU));
      const t = 0.012 + (o.t - 0.012) * edge, r = pr.r + t * pr.nr;
      P.push(r * Math.sin(th), y + t * pr.ny, r * Math.cos(th));
    }
  }
  for (let j = 0; j < NT; j++) for (let k = 0; k < NU; k++) { const a = j * (NU + 1) + k, b = (j + 1) * (NU + 1) + k; I.push(a, a + 1, b, b, a + 1, b + 1); }
  return { p: P, i: I };
}

/* ════════════════ 眼睛 ════════════════ */
const EYES = {
  round: { zh: '圓眼（接近原版）', dc: '#15151d', build: (s, k) => {
    const cx = s * 0.126, cy = -0.02;
    return [{ c: 'main', g: patch(cx, cy, 0.052 * k, 0.056 * k, 0.004) },
            { c: '!#ffffff', g: patch(cx + 0.018 * k, cy + 0.025 * k, 0.013 * k, 0.013 * k, 0.009) }];
  } },
  anime: { zh: '大眼（眼白＋虹膜）', dc: '#3a7bd5', build: (s, k) => {
    const cx = s * 0.126, cy = -0.045;
    return [{ c: '#f6f6f6', g: patch(cx, cy, 0.060 * k, 0.074 * k, 0.004) },
            { c: 'main',    g: patch(cx, cy - 0.004 * k, 0.044 * k, 0.062 * k, 0.008) },
            { c: '#15151d', g: patch(cx, cy - 0.004 * k, 0.020 * k, 0.036 * k, 0.012) },
            { c: '!#ffffff', g: patch(cx + 0.020 * k, cy + 0.030 * k, 0.014 * k, 0.014 * k, 0.016) },
            { c: '!#ffffff', g: patch(cx - 0.015 * k, cy - 0.025 * k, 0.007 * k, 0.007 * k, 0.016) }];
  } },
  happy: { zh: '笑眼（^ ^）', dc: '#15151d', build: (s, k) => {
    const cx = s * 0.126, pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10 * 2 - 1; pts.push([cx + u * 0.05 * k, -0.035 + 0.03 * k * (1 - u * u)]); }
    return [{ c: 'main', g: strip(pts, t => 0.016 * k * (0.5 + Math.sin(t * PI)), 0.006) }];
  } }
};

/* ════════════════ 臉頰（腮紅／防反光黑線）════════════════ */
const CHEEKS = {
  none: { zh: '沒有（拿掉原版腮紅）', dc: '#000000', build: () => [] },
  blush: { zh: '腮紅（貼合臉頰）', dc: '#ff8fa0', build: (s, k) => [{ c: '~main', g: patch(s * 0.231, -0.125, 0.042 * k, 0.034 * k, 0.0025) }] },
  eyeblack: { zh: '防反光黑線', dc: '#15151d', build: (s, k) => {            // 眼睛正下方的直線（不微彎），粗細固定
    const pts = []; for (let i = 0; i <= 8; i++) pts.push([s * (0.09 + 0.12 * i / 8), -0.108]);
    return [{ c: 'main', g: strip(pts, 0.036 * k, 0.006) }];
  } }
};

/* ════════════════ 鬍子 ════════════════ */
const topFn = th => { const a = Math.abs(th); return lerp(-0.19, -0.09, sstep(rad(50), rad(66), a)); };
const mustacheParts = len => {
  const w = lerp(0.75, 1.15, len), th = 0.8 + 0.4 * len, out = [];
  [-1, 1].forEach(s => out.push({ c: 'main', g: tube(
    [[0.004, -0.118], [0.05, -0.122], [0.10, -0.136], [0.145 * w, -0.16]].map(q => [q[0] * s, q[1], surfZ(q[0] * s, q[1]) + 0.01]),
    t => lerp(0.024, 0.011, t) * th, 6) }));
  return out;
};
const tuft = (len, y) => len < 0.2 ? [] : [{ c: 'main', g: cone([0, y, surfZ(0, y) + 0.02], [0, -1, 0.35], 0.045, lerp(0.02, 0.15, len)) }];
const BEARDS = {
  mustache: { zh: '八字鬍', build: len => mustacheParts(len) },
  goatee: { zh: '山羊鬍', build: len => [{ c: 'main', g: lower({ tm: rad(26), top: () => -0.172, bot: () => -0.29, t: 0.022 + 0.02 * len }) }, ...tuft(len, -0.27)] },
  full: { zh: '落腮鬍', build: len => [{ c: 'main', g: lower({ tm: rad(66), top: topFn, bot: () => -0.29, t: 0.022 + 0.025 * len }) }, ...mustacheParts(len), ...tuft(len, -0.27)] }
};

/* ── 顏色與規格 ── */
const PALETTE = { black: '#15151d', darkbrown: '#2b1d14', brown: '#5a3a22', auburn: '#7a3b1e', blonde: '#d9b45a', red: '#a8321f', gray: '#9a9a9a', white: '#e8e8e8', blue: '#3a7bd5', green: '#3aa05a', hazel: '#8a6a2a', pink: '#e05a9c' };
function colorOf(c, d) {
  c = String(c == null ? '' : c).trim().toLowerCase();
  if (PALETTE[c]) return PALETTE[c];
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  return d;
}
const q05 = x => Math.round(clamp(x, 0, 1) * 20) / 20;
const num = (v, d) => (v != null && v !== '' && isFinite(+v)) ? +v : d;
function sub(s, table, key, dflt) {                                      // 子規格正規化；null＝不使用
  if (s == null || s === false) return null;
  if (typeof s === 'string') s = { style: s };
  const name = String(s.style || '').toLowerCase();
  if (!table[name]) return null;                                         // none / default / 不認得 → 不使用
  return { style: name, color: colorOf(s.color, dflt(name)), [key]: q05(num(s[key], 0.5)) };
}
function normalize(s) {
  if (!s || typeof s !== 'object') return null;
  const eyes = sub(s.eyes, EYES, 'size', n => EYES[n].dc), beard = sub(s.beard, BEARDS, 'length', () => PALETTE.darkbrown);
  const cheeks = sub(s.cheeks, CHEEKS, 'size', n => CHEEKS[n].dc);
  return (eyes || beard || cheeks) ? { eyes, beard, cheeks } : null;
}
function autoSpec(seed) {                                                // 沒指定的球員：依名字雜湊，固定不變
  let h = 2166136261; const str = String(seed);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const pick = (n, salt) => { let x = (h ^ Math.imul(salt, 0x9E3779B1)) >>> 0; x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0; x ^= x >>> 13; return (x >>> 0) % n; };
  const ey = ['round', 'round', 'anime', 'happy'], bd = ['none', 'none', 'none', 'mustache', 'goatee', 'full'], cl = ['black', 'darkbrown', 'brown', 'blue', 'green'];
  return { eyes: { style: ey[pick(4, 1)], color: ey[pick(4, 1)] === 'anime' ? cl[3 + pick(2, 2)] : 'black', size: pick(11, 3) / 10 },
           beard: { style: bd[pick(6, 4)], color: cl[pick(3, 5)], length: pick(11, 6) / 10 },
           cheeks: { style: ['blush', 'blush', 'eyeblack', 'none'][pick(4, 7)], size: pick(11, 8) / 10 } };
}
/* 純資料（也方便測試）：回傳 {eyes:[{c,g}…], beard:[{c,g}…]}，c 已把 'main' 換成實際顏色 */
function geometry(spec) {
  const s = normalize(spec); if (!s) return null;
  const res = (c, col) => c.includes('main') ? c.replace('main', col) : c;     // 'main'／'~main' → 使用者指定的主色
  const out = { eyes: [], beard: [], cheeks: [] };
  const both = (spec, table, list) => { if (!spec) return; const k = lerp(0.7, 1.1, spec.size);
    [-1, 1].forEach(sg => table[spec.style].build(sg, k).forEach(l => list.push({ c: res(l.c, spec.color), g: l.g }))); };
  both(s.eyes, EYES, out.eyes); both(s.cheeks, CHEEKS, out.cheeks);
  if (s.beard) BEARDS[s.beard.style].build(s.beard.length).forEach(l => out.beard.push({ c: res(l.c, s.beard.color), g: l.g }));
  return out;
}

/* ── Babylon 端 ── */
const caches = new WeakMap();
function cacheOf(sc) { let c = caches.get(sc); if (!c) { c = { tpl: new Map(), mat: new Map() }; caches.set(sc, c); } return c; }
function layers(B, sc, key, list) {                                      // 依顏色把幾何合併成最少的網格
  const c = cacheOf(sc); let t = c.tpl.get(key);
  if (!t) {
    const by = new Map(); list.forEach(l => { if (!by.has(l.c)) by.set(l.c, []); by.get(l.c).push(l.g); });
    t = [...by].map(([col, gs]) => {
      const g = merge(gs), vd = new B.VertexData(), nor = []; B.VertexData.ComputeNormals(g.p, g.i, nor);
      vd.positions = g.p; vd.indices = g.i; vd.normals = nor;
      const m = new B.Mesh('faceTpl', sc); vd.applyToMesh(m); m.isPickable = false; m.setEnabled(false); return { m, col };
    });
    c.tpl.set(key, t);
  }
  return t;
}
function material(B, sc, col) {                                          // col 前綴：'!'＝自發光、'~'＝半透明
  const c = cacheOf(sc); let m = c.mat.get(col);
  if (!m) {
    let hex = col, em = false, al = false; while (hex[0] === '!' || hex[0] === '~') { if (hex[0] === '!') em = true; else al = true; hex = hex.slice(1); }
    m = new B.StandardMaterial('faceMat', sc); m.diffuseColor = B.Color3.FromHexString(hex); m.specularColor = new B.Color3(0.05, 0.05, 0.05);
    if (em) m.emissiveColor = B.Color3.FromHexString(hex);
    if (al) m.alpha = 0.75;
    m.backFaceCulling = false; m.twoSidedLighting = true; c.mat.set(col, m);
  }
  return m;
}
/* 掛到頭節點；有 eyes／cheeks 時會暫時隱藏原版眼睛／腮紅（dispose 時恢復）。回傳 {dispose()} 或 null */
function attach(B, sc, head, spec, opt) {
  const s = normalize(spec); if (!s) return null;
  const d = (opt && opt.d) || 1, g = geometry(s), root = new B.TransformNode('faceRoot', sc);
  root.parent = head; root.rotation.y = d < 0 ? PI : 0;                  // 以「臉朝 +z」設計；朝 -z 的人偶轉 180°
  const add = (kind, key, list) => layers(B, sc, key, list).forEach(t => {
    const m = t.m.clone(kind); m.setEnabled(true); m.isVisible = true; m.isPickable = false;
    m.material = material(B, sc, t.col); m.parent = root;
  });
  if (s.eyes) add('faceEye', 'E|' + JSON.stringify(s.eyes), g.eyes);
  if (s.beard) add('faceBeard', 'B|' + JSON.stringify(s.beard), g.beard);
  if (s.cheeks) add('faceCheek', 'C|' + JSON.stringify(s.cheeks), g.cheeks);
  const hideNames = [].concat(s.eyes ? ['e', 'eh'] : [], s.cheeks ? ['ch'] : []);           // 原版眼睛 e/eh、原版腮紅 ch
  const hidden = hideNames.length ? head.getChildMeshes(true).filter(m => hideNames.includes(m.name)) : [];
  hidden.forEach(m => m.setEnabled(false));
  return { spec: s, dispose() { hidden.forEach(m => { if (!m.isDisposed()) m.setEnabled(true); }); root.dispose(); } };
}

global.BaseballFace = {
  version: 1, eyes: Object.keys(EYES), beards: Object.keys(BEARDS), cheeks: Object.keys(CHEEKS),
  zh: Object.assign({}, ...[EYES, BEARDS, CHEEKS].map(t => Object.fromEntries(Object.keys(t).map(k => [k, t[k].zh])))), palette: PALETTE,
  normalize, autoSpec, attach, geometry
};
})(typeof window !== 'undefined' ? window : globalThis);
