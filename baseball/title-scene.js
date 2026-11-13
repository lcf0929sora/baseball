/* 開場畫面（單場／聯賽選單背景）：夜間球場＋外野上空煙火的靜態 canvas 畫面。
 * 由 index.html 以 <script src="./baseball/title-scene.js"> 載入；沒有這個檔案時選單照常運作，只是沒有背景畫面。
 * 依賴 index.html 的 #titleCv（canvas）、#start、#modeSelect；只在選單顯示與視窗大小改變時重畫一次，沒有動畫迴圈。 */
(function(){
const cv=document.getElementById('titleCv');if(!cv||!cv.getContext)return;
const ctx=cv.getContext('2d'),start=document.getElementById('start'),ms=document.getElementById('modeSelect');
let W=0,H=0,stars=[],crowd=[],sparks=[],rockets=[],flash=[],t0=performance.now(),seed=7;
const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const LOOP=6.4,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,u)=>a+(b-a)*u,ease=u=>u*u*(3-2*u);
function build(){
  stars=[];for(let i=0;i<110;i++)stars.push({x:rnd(),y:rnd()*0.5,r:rnd()*1.1+0.3,p:rnd()*6.28,s:rnd()*2+0.8});
  crowd=[];for(let i=0;i<520;i++){const x=rnd(),row=rnd();crowd.push({x,row,c:['#ffd9a0','#9fd0ff','#fff','#ff9c9c','#b9ffcf'][Math.floor(rnd()*5)],p:rnd()*6.28,s:rnd()*3+1});}
}
function resize(){
  const w=cv.offsetWidth,h=cv.offsetHeight;if(!w||!h)return;
  const r=cv.getBoundingClientRect(),k=clamp((r.width/w)*(window.devicePixelRatio||1),1,2);
  W=w;H=h;cv.width=Math.round(w*k);cv.height=Math.round(h*k);ctx.setTransform(k,0,0,k,0,0);
}
build();
// 透視：z＝離本壘的距離（m），x＝左右（m，右為正）
function proj(x,z,hy,y0,sc0){const r=Math.pow(Math.max(0.0001,1-z/150),2.2);return {x:W/2+x*sc0*r,y:hy+(y0-hy)*r,r:r};}
function tower(x,y,s,t,ph){
  const fl=0.9+0.1*Math.sin(t*9+ph);
  ctx.fillStyle='#0b1222';ctx.fillRect(x-s*0.035,y,s*0.07,H*0.5);
  const pw=s*0.46,ph2=s*0.3;ctx.fillStyle='#0d1830';ctx.fillRect(x-pw/2,y-ph2,pw,ph2);
  for(let r=0;r<4;r++)for(let c=0;c<6;c++){ctx.fillStyle='rgba(255,246,220,'+(0.85*fl)+')';ctx.beginPath();ctx.arc(x-pw/2+pw*(c+0.5)/6,y-ph2+ph2*(r+0.5)/4,s*0.016,0,6.283);ctx.fill();}
  ctx.globalCompositeOperation='lighter';
  let g=ctx.createRadialGradient(x,y-ph2/2,0,x,y-ph2/2,s*1.1);g.addColorStop(0,'rgba(255,240,200,'+(0.55*fl)+')');g.addColorStop(0.25,'rgba(255,220,150,'+(0.16*fl)+')');g.addColorStop(1,'rgba(255,200,120,0)');
  ctx.fillStyle=g;ctx.fillRect(x-s*1.2,y-s*1.4,s*2.4,s*2.4);
  // 光束
  const dir=x<W/2?1:-1,bx=x+dir*s*2.2,g2=ctx.createLinearGradient(x,y,bx,H*0.9);g2.addColorStop(0,'rgba(255,235,190,'+(0.16*fl)+')');g2.addColorStop(1,'rgba(255,235,190,0)');
  ctx.fillStyle=g2;ctx.beginPath();ctx.moveTo(x-pw*0.4,y-ph2/2);ctx.lineTo(x+pw*0.4,y-ph2/2);ctx.lineTo(bx+s*1.4,H*0.95);ctx.lineTo(bx-s*1.4,H*0.95);ctx.closePath();ctx.fill();
  ctx.globalCompositeOperation='source-over';
}
function burst(x,y,n,col,sp,o){o=o||{};for(let i=0;i<n;i++){const a=o.ring?i/n*6.283:rnd()*6.283,v=(o.ring?1:(0.25+rnd()*0.9))*sp;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:0,T:(o.T||1.2)*(0.8+rnd()*0.4),c:col,r:1+rnd()*1.4,g:o.g||60,d:o.d||0.975,trail:o.trail,p:rnd()*6.28});}}
// 靜態畫面：只在顯示、改變視窗大小時畫一次（不跑動畫迴圈，省資源）
function frame(){
  if(start.hidden||ms.hidden)return;
  resize();if(!W)return;
  seed=7;sparks=[];
  const t=3.7,dt=0.0001;
  const hy=H*0.5,y0=H*0.92,sc0=W*0.0155;
  // 天空
  let g=ctx.createLinearGradient(0,0,0,hy);g.addColorStop(0,'#01030a');g.addColorStop(0.55,'#0a1a3c');g.addColorStop(1,'#254878');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,hy+2);
  for(const s of stars){ctx.fillStyle='rgba(255,255,255,'+(0.35+0.4*Math.sin(t*s.s+s.p))+')';ctx.fillRect(s.x*W,s.y*H,s.r,s.r);}
  // 看台（弧形）
  const stT=hy-H*0.2;ctx.fillStyle='#070d1c';ctx.beginPath();ctx.moveTo(0,hy);ctx.lineTo(0,stT+H*0.08);ctx.quadraticCurveTo(W/2,stT-H*0.07,W,stT+H*0.08);ctx.lineTo(W,hy);ctx.closePath();ctx.fill();
  for(const c of crowd){const x=c.x*W,top=stT+H*0.08-(4*(c.x-0.5)*(c.x-0.5)-1)*H*0.075*-1;const yy=lerp(top-H*0.0,hy-H*0.025,c.row);ctx.fillStyle=c.c;ctx.globalAlpha=0.25+0.55*Math.max(0,Math.sin(t*c.s+c.p));ctx.fillRect(x,yy,1.8,1.8);}
  ctx.globalAlpha=1;
  // 外野牆
  ctx.fillStyle='#0b3a22';ctx.fillRect(0,hy-H*0.03,W,H*0.03);ctx.fillStyle='#f1c40f';ctx.fillRect(0,hy-H*0.03,W,2);
  // 燈塔
  tower(W*0.1,H*0.22,W*0.16,t,0);tower(W*0.9,H*0.22,W*0.16,t,2);tower(W*0.3,H*0.3,W*0.1,t,4);tower(W*0.7,H*0.3,W*0.1,t,1);
  // 草地
  g=ctx.createLinearGradient(0,hy,0,H);g.addColorStop(0,'#0e4a2a');g.addColorStop(0.5,'#1a6a3a');g.addColorStop(1,'#0c3a22');ctx.fillStyle=g;ctx.fillRect(0,hy,W,H-hy);
  for(let i=0;i<16;i++){if(i%2)continue;const a=proj(0,150*(1-Math.pow(i/16,1/2.2)),hy,y0,sc0),b=proj(0,150*(1-Math.pow((i+1)/16,1/2.2)),hy,y0,sc0);ctx.fillStyle='rgba(255,255,255,0.045)';ctx.fillRect(0,Math.min(a.y,b.y),W,Math.abs(a.y-b.y));}
  // 界外線
  ctx.strokeStyle='rgba(255,255,255,0.75)';ctx.lineWidth=2;
  for(const sd of [-1,1]){const a=proj(0,0,hy,y0,sc0),b=proj(sd*135,135,hy,y0,sc0);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  // 內野土
  const dp=(x,z)=>proj(x,z,hy,y0,sc0);
  const dirt=[dp(0,-4),dp(-24,19.4),dp(0,45),dp(24,19.4)];
  g=ctx.createLinearGradient(0,dirt[2].y,0,dirt[0].y);g.addColorStop(0,'#8a4f2e');g.addColorStop(1,'#b36a3e');ctx.fillStyle=g;ctx.beginPath();dirt.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
  const ing=[dp(0,7),dp(-13,19.4),dp(0,33),dp(13,19.4)];ctx.fillStyle='#1f7a42';ctx.beginPath();ing.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;const h0=dp(0,0),b1=dp(19.4,19.4),b2=dp(0,38.8),b3=dp(-19.4,19.4);
  ctx.beginPath();ctx.moveTo(h0.x,h0.y);ctx.lineTo(b1.x,b1.y);ctx.lineTo(b2.x,b2.y);ctx.lineTo(b3.x,b3.y);ctx.closePath();ctx.stroke();
  for(const b of [b1,b2,b3]){const s=3+b.r*9;ctx.fillStyle='#fff';ctx.save();ctx.translate(b.x,b.y);ctx.rotate(0.785);ctx.fillRect(-s/2,-s/2,s,s);ctx.restore();}
  const mo=dp(0,18.44);ctx.fillStyle='#a05d37';ctx.beginPath();ctx.ellipse(mo.x,mo.y,mo.r*34,mo.r*10,0,0,6.283);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(mo.x-mo.r*5,mo.y-1,mo.r*10,2);
  // 本壘與打擊區
  const hp=h0,hs=hp.r*13;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(hp.x-hs*0.5,hp.y);ctx.lineTo(hp.x+hs*0.5,hp.y);ctx.lineTo(hp.x+hs*0.5,hp.y+hs*0.35);ctx.lineTo(hp.x,hp.y+hs*0.75);ctx.lineTo(hp.x-hs*0.5,hp.y+hs*0.35);ctx.closePath();ctx.fill();
  for(const sd of [-1,1]){ctx.strokeRect(hp.x+sd*hs*1.9-hs*0.55,hp.y-hs*0.75,hs*1.1,hs*2.1);}
  // 球場光暈
  ctx.globalCompositeOperation='lighter';g=ctx.createRadialGradient(W/2,H*0.7,0,W/2,H*0.7,W*0.6);g.addColorStop(0,'rgba(255,230,170,0.10)');g.addColorStop(1,'rgba(255,230,170,0)');ctx.fillStyle=g;ctx.fillRect(0,hy,W,H-hy);ctx.globalCompositeOperation='source-over';
  // ===== 靜態煙火：預先算好幾朵、各停在不同的綻放階段 =====
  ctx.globalCompositeOperation='lighter';
  const cols=['255,205,90','120,200,255','255,120,150','170,255,170','255,160,60','210,150,255'];
  const spots=[[0.08,0.2,0],[0.2,0.1,1],[0.34,0.26,3],[0.5,0.08,2],[0.64,0.24,0],[0.78,0.12,1],[0.9,0.22,3],[0.14,0.3,2],[0.88,0.07,0]];
  spots.forEach((q,k)=>{const x=W*q[0],y=H*q[1],c=cols[k%cols.length],sp=H*(0.3+rnd()*0.12),ty=q[2];const n0=sparks.length;
    if(ty===0)burst(x,y,80,c,sp,{T:1.3,g:60,d:0.975});else if(ty===1){burst(x,y,64,c,sp*1.05,{T:1.2,g:50,d:0.972,ring:1});burst(x,y,26,'255,255,255',sp*0.45,{T:1,g:50,d:0.97,ring:1});}
    else if(ty===2)burst(x,y,70,'255,210,110',sp*0.9,{T:2.3,g:95,d:0.985,trail:1});else{burst(x,y,50,c,sp,{T:1.3,g:60,d:0.975});burst(x,y,34,'255,255,255',sp*0.5,{T:1.1,g:60,d:0.975});}
    const age=0.18+((k*0.37)%0.5);for(let i=n0;i<sparks.length;i++){const s2=sparks[i];for(let a2=0;a2<age;a2+=1/60){s2.vy+=s2.g/60;const dd=s2.d;s2.vx*=dd;s2.vy*=dd;s2.x+=s2.vx/60;s2.y+=s2.vy/60;}s2.l=age;}
    g=ctx.createRadialGradient(x,y,0,x,y,H*0.4);g.addColorStop(0,'rgba('+c+',0.14)');g.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=g;ctx.fillRect(x-H*0.4,y-H*0.4,H*0.8,H*0.8);});
  for(const s2 of sparks){const k=Math.max(0,1-s2.l/s2.T);ctx.fillStyle='rgba('+s2.c+','+(k*0.9)+')';ctx.beginPath();ctx.arc(s2.x,s2.y,s2.r*(0.5+k),0,6.283);ctx.fill();
    if(s2.trail){ctx.strokeStyle='rgba('+s2.c+','+(k*0.5)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s2.x,s2.y);ctx.lineTo(s2.x-s2.vx*0.06,s2.y-s2.vy*0.06);ctx.stroke();}}
  ctx.globalCompositeOperation='source-over';
  // 暈影＋標題區壓暗，確保文字好讀
  g=ctx.createRadialGradient(W/2,H*0.42,H*0.1,W/2,H*0.5,Math.max(W,H)*0.75);g.addColorStop(0,'rgba(2,5,12,0.35)');g.addColorStop(1,'rgba(2,5,12,0.72)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
window.addEventListener('resize',frame);
new MutationObserver(frame).observe(ms,{attributes:true,attributeFilter:['hidden']});
new MutationObserver(frame).observe(start,{attributes:true,attributeFilter:['hidden']});
frame();
})();
