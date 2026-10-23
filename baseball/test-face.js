// 用法：node test-face.js   （與 face.js 同資料夾）
require('./face.js');
const BF = globalThis.BaseballFace; let bad = 0, tot = 0;
const bounds = (layers, ok, label, tag) => layers.forEach(l => { for (let i = 0; i < l.g.p.length; i += 3) {
  const x = l.g.p[i], y = l.g.p[i + 1], z = l.g.p[i + 2];
  if (![x, y, z].every(isFinite)) { bad++; console.log('FAIL', tag, 'NaN'); return; }
  const m = ok(x, y, z); if (m) { bad++; console.log('FAIL', tag, m, [x, y, z].map(n => n.toFixed(3))); return; } } });
for (const st of BF.eyes) for (const sz of [0, 0.5, 1]) { tot++;
  const g = BF.geometry({ eyes: { style: st, size: sz } });
  g.eyes.forEach(l => { if (l.g.i.some(i => i >= l.g.p.length / 3)) { bad++; console.log('FAIL eyes index', st); } });
  bounds(g.eyes, (x, y, z) => y > 0.045 ? '超過帽簷高度(y>0.045)' : y < -0.15 ? '太低' : Math.abs(x) < 0.03 || Math.abs(x) > 0.27 ? 'x 超出眼睛範圍' : z < 0.2 ? '跑到臉後面' : '', 'eyes', `eyes ${st} size=${sz}`); }
for (const st of BF.cheeks) for (const sz of [0, 0.5, 1]) { tot++;
  const g = BF.geometry({ cheeks: { style: st, size: sz } });
  g.cheeks.forEach(l => { if (l.g.i.some(i => i >= l.g.p.length / 3)) { bad++; console.log('FAIL cheeks index', st); } });
  bounds(g.cheeks, (x, y, z) => Math.abs(x) < 0.08 || Math.abs(x) > 0.28 ? 'x 超出臉頰範圍' : y > -0.07 || y < -0.18 ? 'y 超出臉頰範圍' : z < 0.15 ? '跑到臉後面' : '', 'cheeks', `cheeks ${st} size=${sz}`); }
for (const st of BF.beards) for (const ln of [0, 0.5, 1]) { tot++;
  const g = BF.geometry({ beard: { style: st, length: ln } });
  g.beard.forEach(l => { if (l.g.i.some(i => i >= l.g.p.length / 3)) { bad++; console.log('FAIL beard index', st); } });
  bounds(g.beard, (x, y, z) => {
    const th = Math.abs(Math.atan2(x, z)) * 180 / Math.PI;
    if (y > -0.085) return '太高(蓋到眼睛／臉頰)';
    if (y > -0.2 && th > 68) return '超出 66°（會碰到頭盔護耳）';
    if (Math.abs(x) > 0.18 && Math.abs(x) < 0.28 && y > -0.17 && z > 0.2) return '蓋到臉頰';
    return ''; }, 'beard', `beard ${st} length=${ln}`); }
console.log('cases', tot, 'failures', bad); process.exit(bad ? 1 : 0);
