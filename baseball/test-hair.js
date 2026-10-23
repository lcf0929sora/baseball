// 用法：node test-hair.js   （與 hair.js 同資料夾）
// 檢查每個造型在各種裝備下，頭髮不會穿出帽子／頭盔，也不會蓋住臉。
require('./hair.js');
const BH = globalThis.BaseballHair, G = BH._gear, EPS = BH._eps;
let bad = 0, tot = 0;
for (const st of BH.styles) for (const l of [0, 0.5, 1]) for (const v of [0, 0.5, 1]) for (const gear of ['cap', 'bat', 'catch', 'none']) {
  const g = BH.geometry({ style: st, length: l, volume: v }, gear); tot++;
  const P = g.p, I = g.i, fail = m => { bad++; console.log('FAIL', st, 'l=' + l, 'v=' + v, gear, m); };
  if (P.some(x => !isFinite(x))) fail('頂點含 NaN');
  if (I.some(i => i < 0 || i >= P.length / 3)) fail('索引超出範圍');
  for (let i = 0; i < P.length; i += 3) {                       // 臉部區域（眼睛與臉頰）不可有頭髮
    const x = P[i], y = P[i + 1], z = P[i + 2];
    if (z > 0.2 && Math.abs(x) < 0.26 && y < 0.04 && y > -0.2) { fail('蓋住臉 ' + [x, y, z].map(n => n.toFixed(2))); break; }
  }
  const E = G[gear]; if (!E) continue;
  for (let i = 0; i < P.length; i += 3) {                       // 帽緣以上必須在圓頂內
    const x = P[i], y = P[i + 1], z = P[i + 2];
    if (y >= E.cy - 1e-9) { const d = Math.hypot(x, y - E.cy, z); if (d > E.R - EPS + 1e-6) { fail('穿出圓頂 d=' + d.toFixed(3)); break; } }
  }
  for (let t = 0; t < I.length; t += 3) {                       // 不可有三角形橫跨帽緣平面
    const ys = [0, 1, 2].map(k => P[I[t + k] * 3 + 1] - E.cy);
    if (ys.some(y => y > 1e-7) && ys.some(y => y < -1e-7)) { fail('三角形橫跨帽緣'); break; }
  }
  for (const e of E.ears) for (let i = 0; i < P.length; i += 3) {   // 護耳範圍內不可外露
    const x = P[i], y = P[i + 1], z = P[i + 2]; if (x * e.x <= 0) continue;
    const t = ((y - e.y) / e.ry) ** 2 + ((z - e.z) / e.rz) ** 2;
    if (t < 1 && Math.abs(x) > Math.abs(e.x) + e.rx * Math.sqrt(1 - t) + 1e-6) { fail('穿出護耳'); break; }
  }
}
console.log('cases', tot, 'failures', bad);
process.exit(bad ? 1 : 0);
