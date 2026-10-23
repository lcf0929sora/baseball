/* ════════════════════════════════════════════════════════════════════
   baseball/hair.js — 球員髮型外掛（獨立檔，主程式讀不到就維持光頭）
   ────────────────────────────────────────────────────────────────────
   髮型規格（hair-map.json 或 teams.json 球員的 "hair" 欄位）：
     { "style":"long", "color":"#2b1d14", "length":0.6, "volume":0.5 }
       style  造型名稱（見下方 STYLES；"bald" 或 "none" ＝光頭）
       color  "#rrggbb" 或色名（black brown darkbrown blonde red gray white blue pink green）
       length 0~1  長度（各造型自行對應：髮尾位置、馬尾/辮子長度、尖刺高度…）
       volume 0~1  蓬度（髮量厚度）
     也可以只寫造型名字串："hair":"mohawk"

   帽子／頭盔安全：
     所有頭髮幾何在「帽緣平面」上方的部分，會先沿平面切開，再把頂點壓回
     帽子／頭盔的圓頂內側（護耳也一樣）。因為圓頂是凸形，壓回去之後
     整片頭髮都在帽內，絕不會穿出外殼；帽緣下方的頭髮則自然露出來
     （後腦、鬢角、馬尾、長髮…）。
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   【新增造型指南】（給人或 LLM 閱讀；只需要改本檔，不必動 baseball.html）
   ────────────────────────────────────────────────────────────────────
   1. 在下方 STYLES 加一項：
        名稱: { zh:'中文名', d:{ l:預設length, v:預設volume }, build:(p, none) => [幾何, 幾何, …] }
      p.l、p.v ＝ 0~1 的長度、蓬度；none ＝ true 表示沒戴帽（可畫完整髮型，例如頭頂的髮髻）。
      build 回傳「幾何陣列」，本檔會自動合併、裁切、壓入帽內，不需自己處理帽子。
      名稱只用小寫英文，之後即可在 hair-map.json 用 "style":"名稱"。

   2. 座標系（頭節點的局部座標，單位與遊戲一致）：
        臉朝 +z，後腦在 -z，y 向上，x 為左右。頭半徑 0.35，頭頂最高 y≈0.405，
        眼睛在 y≈-0.02、z≈0.32，下巴約 y≈-0.28。
        方位角 θ：0＝正前方，π/2＝+x 側，π＝正後方。

   3. 現成的基本件（皆回傳 {p:頂點陣列, i:三角形索引}）：
        shell({hl, t, hang, nu, nt})  頭皮殼：hl(θ)＝各方位的髮線高度（y），
                                      t(θ,y)＝離頭皮厚度，hang(θ)＝0~1 垂下成髮簾；
                                      髮線輔助：hlOf(前,側,後)、keysFn([[角度,值],…])
        tube(控制點, 半徑函式(t), 邊數)  沿曲線的圓管：馬尾、辮子、髒辮、鬢髮
        ball([x,y,z], rx, ry, rz)       橢球：髮髻
        cone(底心, 方向, 半徑, 高度)     尖刺
        onSkin(θ, y, k)                 取頭皮表面上的點；outward(θ, down) 取外向方向
      輔助：lerp、clamp、sstep(平滑階梯)、rad(度→弧度)、bump(固定的偽亂數起伏)。

   4. 設計原則：
      ・球員幾乎都戴帽或頭盔，帽緣平面（約 y=0.06~0.08）以上會被蓋住。要讓造型「看得出來」，
        特色要放在帽緣下方：後腦髮線、鬢角、垂下的髮束、馬尾、辮子、後腦尖刺…。
      ・臉部區域不可有頭髮：z>0.2、|x|<0.26、y 介於 -0.2~0.04（眼睛與臉頰）。
        瀏海最低只能到 y≈0.08。
      ・離頭皮至少留 0.015 以上厚度，避免與頭皮閃爍（z-fighting）；管狀物起點可埋在頭內。
      ・垂在身側的頭髮 |x| 盡量 ≥ 0.34，避免和手臂（x≈±0.09~0.29、y<-0.24）重疊。
      ・頂點數盡量 < 2500／造型（每種 長度×蓬度×裝備 組合會各生成一份幾何）。

   5. 驗證：與本檔同資料夾執行  node test-hair.js
      會對所有造型（含新增的）× 長度 × 蓬度 × 守備帽／打擊盔／捕手盔／無帽 逐一檢查：
      頂點有限且索引合法、帽緣以上全部在圓頂內、護耳範圍內不外露、沒有三角形橫跨帽緣、
      臉部區域沒有頭髮。出現 FAIL 就依訊息修正；全部通過會印出「failures 0」。
   ════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const PI = Math.PI, TAU = PI * 2;

/* ── 與 baseball.html 內 chibi() 的頭部尺寸一致（hd 節點局部座標，臉朝 +z）── */
const H = { R: 0.35, CY: 0.055, LO: -0.02, K: 0.75, TOP: 0.405 };   // 頭頂圓頂、圓柱帶、下半部略扁
const EAR = x => ({ x, y: -0.02, z: -0.04, rx: 0.0576, ry: 0.18, rz: 0.171 });   // 頭盔護耳（橢球）
const GEAR = {                                                       // 帽緣平面高度 cy、圓頂半徑 R
  none:  null,
  cap:   { cy: 0.06, R: 0.37, ears: [] },                            // 守備帽
  bat:   { cy: 0.08, R: 0.41, ears: [EAR(-0.355)] },                 // 打擊頭盔（單邊護耳）
  catch: { cy: 0.08, R: 0.41, ears: [EAR(-0.355), EAR(0.355)] }      // 捕手頭盔（雙護耳）
};
const EPS = 0.008;                                                   // 頭髮離外殼內面的安全距離

/* ── 小工具 ── */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rad = d => d * PI / 180;
const angAbs = th => { th = ((th % TAU) + TAU) % TAU; return th > PI ? TAU - th : th; };   // 0=正前方 π=正後方
const bump = (th, y) => Math.sin(th * 6 + y * 17) * Math.sin(th * 4 - y * 11) * 0.5 + 0.5;  // 固定的偽亂數起伏
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/* 依 |θ|（度）分段平滑內插：keysFn([[0,v0],[40,v1],…]) */
function keysFn(k) {
  return th => {
    const a = angAbs(th) * 180 / PI;
    if (a <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (a <= k[i][0]) return lerp(k[i - 1][1], k[i][1], sstep(k[i - 1][0], k[i][0], a));
    return k[k.length - 1][1];
  };
}
const hlOf = (front, side, back) => keysFn([[40, front], [75, side], [110, side], [145, back], [180, back]]);   // 髮線高度
const sideHang = (th, k) => k * sstep(rad(55), rad(100), angAbs(th));        // 兩側／後方垂下（不貼頭骨）

/* ── 幾何基本件：{p:[x,y,z…], i:[三角形索引…]} ── */
function merge(parts) {
  const p = [], i = [];
  parts.forEach(g => { const o = p.length / 3; for (let k = 0; k < g.p.length; k++) p.push(g.p[k]); for (let k = 0; k < g.i.length; k++) i.push(g.i[k] + o); });
  return { p, i };
}

/* 頭型剖面：給高度 y 回傳半徑與外法線；hang(0~1) 把頭下半部的曲面換成「垂下的髮簾」 */
function profileAt(y, hang) {
  if (y >= H.CY) { const d = y - H.CY, r = Math.sqrt(Math.max(0, H.R * H.R - d * d)); return { r, nr: r / H.R, ny: d / H.R }; }
  if (y >= H.LO) return { r: H.R, nr: 1, ny: 0 };
  const b = H.R * H.K, d = (H.LO - y) / b, rs = H.R * Math.sqrt(Math.max(0, 1 - d * d));
  let a = rs / (H.R * H.R), c = (y - H.LO) / (b * b); const l = Math.hypot(a, c) || 1; a /= l; c /= l;
  if (!(hang > 0)) return { r: rs, nr: a, ny: c };
  const k = clamp((H.LO - y) / 0.45, 0, 1), rh = H.R * (1 - 0.28 * k), hl = Math.hypot(1, 0.218);
  let nr = lerp(a, 1 / hl, hang), ny = lerp(c, -0.218 / hl, hang); const nl = Math.hypot(nr, ny) || 1;
  return { r: lerp(rs, rh, hang), nr: nr / nl, ny: ny / nl };
}

/* 頭皮殼：依方位角 θ 取髮線高度 hl(θ)，由頭頂往下鋪到髮線；t(θ,y)＝離頭皮的厚度 */
function shell(o) {
  const NT = o.nt || 40, NU = o.nu || 20, rows = NU + 1, P = [], I = [];
  for (let j = 0; j < NT; j++) {
    const th = j / NT * TAU, yEnd = o.hl(th), hang = o.hang ? o.hang(th) : 0;
    for (let k = 0; k < rows; k++) {
      const e = 1 - Math.cos(k / NU * PI / 2), y = H.TOP - (H.TOP - yEnd) * e;   // 頭頂附近取樣較密
      const pr = profileAt(y, hang), t = o.t(th, y, k / NU);
      const r = pr.r + t * pr.nr, yy = y + t * pr.ny;
      P.push(r * Math.sin(th), yy, r * Math.cos(th));
    }
  }
  for (let j = 0; j < NT; j++) for (let k = 0; k < rows - 1; k++) {
    const a = j * rows + k, b = ((j + 1) % NT) * rows + k;
    I.push(a, a + 1, b, b, a + 1, b + 1);
  }
  return { p: P, i: I };
}

function spline(pts, per) {                                       // Catmull-Rom 平滑曲線
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[n - 1].slice());
  return out;
}
function tube(ctrl, rad_, sides) {                                // 沿曲線的圓管（馬尾、辮子、髒辮）
  const path = spline(ctrl, 7), n = path.length, S = sides || 7, P = [], I = [];
  for (let i = 0; i < n; i++) {
    const t = norm(sub(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)]));
    const ref = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1], s = norm(cross(t, ref)), u = cross(t, s), r = rad_(i / (n - 1));
    for (let k = 0; k < S; k++) { const a = k / S * TAU, c = Math.cos(a), sn = Math.sin(a);
      P.push(path[i][0] + (s[0] * c + u[0] * sn) * r, path[i][1] + (s[1] * c + u[1] * sn) * r, path[i][2] + (s[2] * c + u[2] * sn) * r); }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < S; k++) {
    const a = i * S + k, b = i * S + (k + 1) % S, c = a + S, d = b + S; I.push(a, c, b, b, c, d);
  }
  const e = P.length / 3; P.push(path[n - 1][0], path[n - 1][1], path[n - 1][2]);   // 末端收尖
  for (let k = 0; k < S; k++) I.push((n - 1) * S + k, e, (n - 1) * S + (k + 1) % S);
  return { p: P, i: I };
}
function ball(c, rx, ry, rz) {                                    // 橢球（髮髻）
  const seg = 12, rings = 8, P = [], I = [];
  for (let i = 0; i <= rings; i++) { const v = i / rings * PI, sv = Math.sin(v), cv = Math.cos(v);
    for (let j = 0; j < seg; j++) { const a = j / seg * TAU; P.push(c[0] + rx * sv * Math.sin(a), c[1] + ry * cv, c[2] + rz * sv * Math.cos(a)); } }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg; I.push(a, a + seg, b, b, a + seg, b + seg);
  }
  return { p: P, i: I };
}
function cone(b, d, r, h) {                                       // 尖刺
  d = norm(d); const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], s = norm(cross(d, ref)), u = cross(d, s), S = 6, P = [], I = [];
  for (let k = 0; k < S; k++) { const a = k / S * TAU, c = Math.cos(a), sn = Math.sin(a);
    P.push(b[0] + (s[0] * c + u[0] * sn) * r, b[1] + (s[1] * c + u[1] * sn) * r, b[2] + (s[2] * c + u[2] * sn) * r); }
  P.push(b[0] + d[0] * h, b[1] + d[1] * h, b[2] + d[2] * h);
  for (let k = 0; k < S; k++) I.push(k, S, (k + 1) % S);
  return { p: P, i: I };
}
const onSkin = (th, y, k) => { const r = profileAt(y, 0).r * (k || 1); return [r * Math.sin(th), y, r * Math.cos(th)]; };   // 頭皮上的點
const outward = (th, down) => norm([Math.sin(th), -(down || 0), Math.cos(th)]);

/* ── 帽子／頭盔安全處理 ── */
function clipPlane(G, yc) {            // 沿水平面把跨越平面的三角形切成兩半 → 之後不會有三角形橫跨帽緣
  const np = G.p.slice(), ni = [], cache = new Map(), n0 = G.p.length / 3, E = 1e-9;
  const Y = i => np[i * 3 + 1] - yc, sg = i => { const s = Y(i); return s > E ? 1 : s < -E ? -1 : 0; };
  const mid = (a, b) => {
    const key = a < b ? a + '_' + b : b + '_' + a; let v = cache.get(key); if (v !== undefined) return v;
    const ya = Y(a), yb = Y(b), t = ya / (ya - yb), ia = a * 3, ib = b * 3; v = np.length / 3;
    np.push(np[ia] + (np[ib] - np[ia]) * t, yc, np[ia + 2] + (np[ib + 2] - np[ia + 2]) * t); cache.set(key, v); return v;
  };
  for (let t = 0; t < G.i.length; t += 3) {
    const V = [G.i[t], G.i[t + 1], G.i[t + 2]], s = V.map(sg);
    if (!(s.some(x => x > 0) && s.some(x => x < 0))) { ni.push(V[0], V[1], V[2]); continue; }
    const up = [], lo = [];
    for (let e = 0; e < 3; e++) {
      const p = V[e], q = V[(e + 1) % 3], sp = s[e], sq = s[(e + 1) % 3];
      if (sp >= 0) up.push(p); if (sp <= 0) lo.push(p);
      if (sp * sq < 0) { const m = mid(p, q); up.push(m); lo.push(m); }
    }
    [up, lo].forEach(poly => { for (let k = 1; k < poly.length - 1; k++) ni.push(poly[0], poly[k], poly[k + 1]); });
  }
  return { p: np, i: ni };
}
function clampGear(P, G) {             // 平面以上的頂點壓回圓頂內側；護耳範圍內壓回護耳內側
  const lim = G.R - EPS;
  for (let i = 0; i < P.length; i += 3) {
    let x = P[i], y = P[i + 1], z = P[i + 2];
    if (y >= G.cy - 1e-9) { const dy = y - G.cy, d = Math.hypot(x, dy, z); if (d > lim) { const k = lim / d; x *= k; y = G.cy + dy * k; z *= k; } }
    for (const e of G.ears) {
      if (x * e.x <= 0) continue;
      const t = ((y - e.y) / e.ry) ** 2 + ((z - e.z) / e.rz) ** 2;
      if (t < 1) { const xm = Math.abs(e.x) + e.rx * Math.sqrt(1 - t) - EPS; if (Math.abs(x) > xm) x = Math.sign(x) * xm; }
    }
    P[i] = x; P[i + 1] = y; P[i + 2] = z;
  }
}

/* ════════════════ 造型 ════════════════
   build(p, none) → 幾何陣列；p.l＝length、p.v＝volume；none＝沒戴帽（可顯示完整髮型）           */
const T = (base, vol, top) => (th, y) => base + vol * top * sstep(-0.05, 0.3, y) + 0.004 * bump(th, y);   // 厚度
const shortCut = (l, v) => shell({ hl: hlOf(0.11, lerp(0.03, -0.06, l), lerp(0.0, -0.13, l)), t: T(0.024, v, 0.035) });

const STYLES = {
  buzz: { zh: '小平頭', d: { l: 0.3, v: 0.2 }, build: p => [shell({ hl: hlOf(0.10, lerp(0.06, 0.0, p.l), lerp(0.04, -0.05, p.l)), t: T(0.016, p.v, 0.012) })] },
  short: { zh: '短髮', d: { l: 0.5, v: 0.5 }, build: p => [shortCut(p.l, p.v)] },
  bob: { zh: '鮑伯頭', d: { l: 0.5, v: 0.5 }, build: p => [shell({
    hl: hlOf(0.085, lerp(-0.08, -0.2, p.l), lerp(-0.1, -0.22, p.l)), hang: th => sideHang(th, 0.85), t: T(0.03, p.v, 0.03) })] },
  long: { zh: '長髮', d: { l: 0.6, v: 0.5 }, build: p => [shell({
    hl: hlOf(0.09, lerp(-0.12, -0.2, p.l), lerp(-0.22, -0.44, p.l)), hang: th => sideHang(th, 1), t: T(0.03, p.v, 0.03) })] },
  mullet: { zh: '鯔魚頭', d: { l: 0.5, v: 0.5 }, build: p => {
    const base = hlOf(0.11, 0.0, -0.06), tailY = lerp(-0.2, -0.45, p.l), tail = th => sstep(rad(125), rad(165), angAbs(th));
    return [shell({ hl: th => lerp(base(th), tailY, tail(th)), hang: tail, t: T(0.026, p.v, 0.03) })];
  } },
  ponytail: { zh: '馬尾', d: { l: 0.5, v: 0.5 }, build: p => {
    const lt = lerp(0.15, 0.45, p.l);
    return [shortCut(0.35, p.v), tube([[0, 0.03, -0.30], [0, 0.04, -0.40], [0, -0.01, -0.49], [0, -0.12, -0.51], [0, -0.12 - lt, -0.46]],
      t => t < 0.1 ? 0.05 : lerp(0.075, 0.025, (t - 0.1) / 0.9), 8)];
  } },
  pigtails: { zh: '雙馬尾', d: { l: 0.5, v: 0.5 }, build: p => {
    const lt = lerp(0.12, 0.38, p.l), out = [shortCut(0.35, p.v)];
    [-1, 1].forEach(s => out.push(tube([[s * 0.27, 0.03, -0.24], [s * 0.37, 0.0, -0.30], [s * 0.43, -0.12, -0.28], [s * 0.43, -0.12 - lt, -0.25]],
      t => lerp(0.06, 0.028, t), 8)));
    return out;
  } },
  bun: { zh: '包包頭', d: { l: 0.3, v: 0.5 }, build: (p, none) => [shortCut(0.3, p.v),
    none ? ball([0, 0.44, -0.02], 0.11 + 0.03 * p.v, 0.10 + 0.03 * p.v, 0.11 + 0.03 * p.v)      // 沒戴帽：頭頂丸子頭
         : ball([0, -0.03, -0.385], 0.09 + 0.03 * p.v, 0.09 + 0.02 * p.v, 0.09 + 0.03 * p.v)] },   // 戴帽：收在帽緣下的低髮髻
  braid: { zh: '單辮', d: { l: 0.6, v: 0.4 }, build: p => [shortCut(0.35, p.v),
    tube([[0, 0.02, -0.31], [0, 0.0, -0.42], [0, -0.1, -0.45], [0, -0.1 - 0.45 * p.l, -0.42]],
      t => (0.042 + 0.012 * Math.sin(t * 34)) * (1 - 0.55 * sstep(0.8, 1, t)), 7)] },
  afro: { zh: '爆炸頭', d: { l: 0.5, v: 0.6 }, build: p => [shell({ nu: 22,
    hl: hlOf(0.10, -0.04, -0.07),
    t: (th, y) => 0.035 + (0.07 + 0.09 * p.v) * sstep(-0.12, 0.2, y) * (1 + 0.25 * bump(th, y)) })] },
  dreads: { zh: '髒辮', d: { l: 0.5, v: 0.3 }, build: p => {
    const out = [shell({ hl: hlOf(0.10, 0.0, -0.03), t: T(0.02, p.v, 0.02) })];
    [95, 120, 145, 170, 190, 215, 240, 265].forEach((a, i) => {
      const th = rad(a), sx = Math.sin(th), cz = Math.cos(th), len = lerp(0.18, 0.42, p.l) * (0.8 + 0.4 * ((i * 37 % 10) / 10));
      out.push(tube([[sx * 0.31, 0.03, cz * 0.31], [sx * 0.385, -0.05, cz * 0.385], [sx * 0.40, -0.05 - len * 0.5, cz * 0.40], [sx * 0.385, -0.05 - len, cz * 0.385]],
        t => lerp(0.03, 0.02, t), 6));
    });
    return out;
  } },
  spiky: { zh: '刺蝟頭', d: { l: 0.5, v: 0.4 }, build: p => {
    const out = [shortCut(0.3, p.v)], h = lerp(0.09, 0.22, p.l);
    for (let i = 0; i < 16; i++) {                                         // 頭頂尖刺（斐波那契分佈）
      const al = rad(8 + 62 * Math.sqrt((i + 0.5) / 16)), be = i * 2.399963;
      const n = [Math.sin(al) * Math.sin(be), Math.cos(al), Math.sin(al) * Math.cos(be)];
      out.push(cone([n[0] * H.R * 0.97, H.CY + n[1] * H.R * 0.97, n[2] * H.R * 0.97], [n[0], n[1] + 0.35, n[2]], 0.05, h));
    }
    [135, 160, 180, 200, 225].forEach((a, i) => {                          // 後腦下緣的小尖刺（戴帽時也看得到）
      const y = -0.04 - 0.03 * (i % 2), th = rad(a);
      out.push(cone(onSkin(th, y, 0.97), outward(th, 0.45), 0.04, 0.5 * h + 0.04));
    });
    return out;
  } },
  mohawk: { zh: '龐克頭', d: { l: 0.5, v: 0.4 }, build: p => {
    const out = [shell({ hl: hlOf(0.10, 0.04, 0.0), t: T(0.014, 0.1, 0.01) })], h = lerp(0.1, 0.22, p.l);
    for (let a = -50; a <= 90; a += 14) {                                  // 沿頭頂正中央往後的冠
      const r_ = rad(a);                                                  // a<0 在前、a>0 在後
      const nz = -Math.sin(r_), c = [0, H.CY + Math.cos(r_) * H.R * 0.97, nz * H.R * 0.97];
      out.push(cone(c, [0, Math.cos(r_) + 0.2, nz], 0.055, h * (0.7 + 0.3 * Math.cos(r_))));
    }
    [0.03, -0.03, -0.09, -0.15].forEach(y => out.push(cone(onSkin(PI, y, 0.97), [0, 0.15, -1], 0.055, h * 0.75)));   // 沿後腦垂下的尾鰭
    return out;
  } }
};
const STYLE_NAMES = Object.keys(STYLES);

/* ── 顏色 ── */
const PALETTE = { black: '#17130f', darkbrown: '#2b1d14', brown: '#5a3a22', auburn: '#7a3b1e', blonde: '#d9b45a', red: '#a8321f', gray: '#9a9a9a', white: '#e8e8e8', blue: '#2f6fe0', pink: '#e05a9c', green: '#3aa05a' };
const NATURAL = ['#17130f', '#17130f', '#2b1d14', '#2b1d14', '#5a3a22', '#7a3b1e', '#d9b45a'];
function colorOf(c) {
  c = String(c == null ? '' : c).trim().toLowerCase();
  if (PALETTE[c]) return PALETTE[c];
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  return PALETTE.darkbrown;
}
const q05 = x => Math.round(clamp(x, 0, 1) * 20) / 20;                       // 量化成 0.05，讓相近參數共用同一份幾何
const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : (v != null && v !== '' && isFinite(+v)) ? +v : d;

/* 規格正規化：回傳 null＝光頭 */
function normalize(s) {
  if (s == null || s === false) return null;
  if (typeof s === 'string') s = { style: s };
  const name = String(s.style || 'short').toLowerCase();
  if (name === 'bald' || name === 'none') return null;
  const key = STYLES[name] ? name : 'short', d = STYLES[key].d;
  return { style: key, color: colorOf(s.color), length: q05(num(s.length, d.l)), volume: q05(num(s.volume, d.v)) };
}
function autoSpec(seed) {                                                      // 沒指定造型的球員：依名字雜湊決定，同一人永遠相同
  let h = 2166136261; const str = String(seed);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const pick = (n, salt) => { let x = (h ^ Math.imul(salt, 0x9E3779B1)) >>> 0; x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0; x ^= x >>> 13; return (x >>> 0) % n; };
  const common = ['short', 'short', 'short', 'buzz', 'buzz', 'bob', 'ponytail', 'mullet', 'spiky', 'long', 'braid', 'bun', 'pigtails', 'mohawk', 'afro', 'dreads'];
  return { style: common[pick(common.length, 1)], color: NATURAL[pick(NATURAL.length, 2)], length: pick(11, 3) / 10, volume: pick(11, 4) / 10 };
}

/* 純資料：給定規格與裝備，算出已裁切／壓入帽內的最終頂點（也方便在 Node 測試） */
function geometry(spec, gear) {
  const s = normalize(spec); if (!s) return null;
  const G = GEAR[gear === undefined ? 'cap' : gear] || null;
  let g = merge(STYLES[s.style].build({ l: s.length, v: s.volume }, !G));
  if (G) { g = clipPlane(g, G.cy); clampGear(g.p, G); }
  return g;
}

/* ── Babylon 端：模板網格快取＋clone（共用頂點緩衝），材質依顏色快取 ── */
const caches = new WeakMap();
function cacheOf(scene) { let c = caches.get(scene); if (!c) { c = { tpl: new Map(), mat: new Map() }; caches.set(scene, c); } return c; }
function template(B, scene, s, gear) {
  const c = cacheOf(scene), key = [s.style, s.length, s.volume, gear].join('|');
  let m = c.tpl.get(key);
  if (!m) {
    const g = geometry(s, gear), vd = new B.VertexData(), nor = [];
    B.VertexData.ComputeNormals(g.p, g.i, nor);
    vd.positions = g.p; vd.indices = g.i; vd.normals = nor;
    m = new B.Mesh('hairTpl', scene); vd.applyToMesh(m); m.isPickable = false; m.setEnabled(false); c.tpl.set(key, m);
  }
  return m;
}
function material(B, scene, hex) {
  const c = cacheOf(scene); let m = c.mat.get(hex);
  if (!m) {
    m = new B.StandardMaterial('hairMat', scene); m.diffuseColor = B.Color3.FromHexString(hex);
    m.specularColor = new B.Color3(0.08, 0.08, 0.08); m.specularPower = 24; m.backFaceCulling = false; m.twoSidedLighting = true;
    c.mat.set(hex, m);
  }
  return m;
}
/* 把頭髮掛到頭節點 head；opt.gear＝'cap'|'bat'|'catch'|'none'，opt.d＝臉朝向(+1/-1)。回傳 {mesh,spec,dispose()} 或 null(光頭) */
function attach(B, scene, head, spec, opt) {
  const s = normalize(spec); if (!s) return null;
  const gear = (opt && opt.gear) || 'cap', d = (opt && opt.d) || 1;
  const m = template(B, scene, s, gear).clone('hair');
  m.setEnabled(true); m.isVisible = true; m.isPickable = false;
  m.material = material(B, scene, s.color);
  m.parent = head; m.rotation.y = d < 0 ? PI : 0;                             // 造型以「臉朝 +z」設計；臉朝 -z 的人偶轉 180°
  return { mesh: m, spec: s, dispose() { m.dispose(); } };
}

global.BaseballHair = {
  version: 1,
  styles: STYLE_NAMES, zh: Object.fromEntries(STYLE_NAMES.map(k => [k, STYLES[k].zh])), palette: PALETTE,
  normalize, autoSpec, attach, geometry, _gear: GEAR, _eps: EPS
};
})(typeof window !== 'undefined' ? window : globalThis);
