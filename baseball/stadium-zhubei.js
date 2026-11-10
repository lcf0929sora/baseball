/*
 * 竹北球場（id: zhubei）——建在「國立臺灣大學竹北校區足球場」的位置（地圖紅框），旁邊是遠東百貨竹北店（大遠百）。
 * 介面規格請參考 stadium-otsu.js（或 stadium-night.js）開頭的「球場外掛開發指南」。
 *
 *  真實位置與比例（依你給的衛星圖）
 *   · 比例尺：用圖中的標準足球場（105 × 68 m，圖上約 245 × 165 px）換算，約 0.425 m／px；紅框約 178 × 152 m。
 *   · 旋轉：本壘板放在紅框西南角，三壘線平行紅框左邊（也就是平行東邊的莊敬北路），一壘線平行紅框下緣（平行南邊的莊敬一路／光明六路）；
 *     中外野因此朝向東北東（方位約 67°，正好是棒球場常用的「東北東」朝向），打者面向的是紅框裡的東北角，東南方向（右手邊）隔著馬路就是百貨公司。
 *   · 球場、道路、百貨公司都是用地圖像素座標換算（px2uv／px2g），看台、後牆、塔樓全部收在紅框裡（≈ 距邊 4~12 m）。
 *  遠東百貨竹北店（依三張照片）
 *   · 外牆是大面積、沒有窗的「卵石馬賽克」石材（灰米色、小石塊拼貼），一樓是深色玻璃帷幕＋褐色柱列＋木格柵雨庇；
 *     上層一層層退縮的露台，露台邊是褐色木條欄杆、後面是帶狀玻璃，牆上有鐵鏽色（耐候鋼）的百葉；西側立面中央有藍色大字「遠東百貨」。
 *   · 三個「鼓形」量體（地圖上的三個圓形屋頂）：最大的在南端，下面包著一圈弧形石牆，鼓身分兩層、貼淺褐木紋色的板材、有小窗，
 *     每層都有環繞陽台（木條欄杆）；屋頂是深灰藍的分格金屬大圓頂，屋簷大幅外伸。北邊兩個較小的鼓坐在退縮的露台上，兩鼓之間有玻璃採光罩。
 *  球場風格（和百貨公司協調）
 *   · 看台後牆（也就是球場外牆）和百貨公司同一種卵石石材，頂端有褐色木條欄杆帶；本壘後方看台有深灰藍的屋頂雨棚；
 *     中外野記分板兩側各有一座小「鼓形塔」（淺褐木紋板材＋環繞陽台＋深灰藍分格大屋簷圓頂），呼應百貨公司；記分板是深石板色底、古銅框、暖白字。
 *  其他
 *   · 道路：莊敬北路（紅框東側）、莊敬一路與光明六路（紅框南側）；周圍是樹林。其餘建築（住宅大樓、其他圓形建築、運動場等）這一版先「不」生成。
 *  本檔「不」設定天空／霧／光源——那些由主程式的天氣系統決定。
 * 閱讀順序：①共用工具 ②貼圖 ③地圖座標 ④地面與外野牆 ⑤看台、雨棚與鼓形塔 ⑥界外牆與休息區 ⑦記分板
 *           ⑧道路與草地 ⑨遠東百貨竹北店 ⑩樹林 ⑪登錄規則
 */
(function(){
'use strict';
function build(ctx){
const {BABYLON,scene,MB,M,C,put,texMat,lpt,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const SQ=Math.SQRT1_2,TAU=Math.PI*2;

// ═════════ ① 共用工具 ═════════
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const tile=(S,x,y,m,fn)=>{if(x>m&&x<S-m&&y>m&&y<S-m)return fn(0,0);for(const dx of[-S,0,S])for(const dy of[-S,0,S])fn(dx,dy);};
const newTex=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const fillNoise=(g,S,rnd,r,gr,b,amp)=>{const img=g.createImageData(S,S),d=img.data;for(let i=0;i<S*S;i++){const k=1-amp+rnd()*2*amp;d[i*4]=r*k;d[i*4+1]=gr*k;d[i*4+2]=b*k;d[i*4+3]=255;}g.putImageData(img,0,0);};
const hexRGB=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const V4=(a,b,c,d)=>new BABYLON.Vector4(a,b,c,d);
const unlitTex=(t)=>{const m=M('#000000');m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=false;return m;};   // 不受光的貼圖材質（顏色＝貼圖×頂點色）

// 兩點之間的一段牆：以「一個長方盒」表示。ext＝兩端各多延伸的長度；fence=true 時人和球都會撞到；outfield=true 表示是全壘打牆本體。
function wallSeg(ax,az,bx,bz,h,th,mat,fence,outfield,capMat,ext){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2;
  const b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th}),cx,h/2,cz,mat);b.rotation.y=ang;
  if(fence)registerFenceCollider(b,!!outfield);
  if(capMat){const c=put(MB.CreateBox('xxCap',{width:len+0.1,height:0.2,depth:th+0.24}),cx,h+0.1,cz,capMat);c.rotation.y=ang;if(fence)registerFenceCollider(c,!!outfield);}
  return b;
}
function ghostBox(cx,cy,cz,w,h,d,ang,kind){const b=put(MB.CreateBox('xxHit',{width:w,height:h,depth:d}),cx,cy,cz,null);b.rotation.y=ang;b.isVisible=false;registerBallSolid(b,kind);return b;}

// 把很多方盒／錐體合併成「一個 mesh」（頂點色＋平面法線，可選 UV）。box 的旋轉順序與 mesh.rotation 相同。
// uP/vP＝UV 以「世界座標」每 uP／vP 公尺重複一次（只給沒有繞 y 旋轉的盒子用）；sh＝各面亮度（不受光的材質靠它做出立體感）。
function newBatch(withUV){
  const P=[],N=[],K=[],I=[],T=withUV?[]:null;
  const vtx=(p,n,c,t)=>{P.push(p[0],p[1],p[2]);N.push(n[0],n[1],n[2]);K.push(c[0],c[1],c[2],1);if(T)T.push(t?t[0]:0,t?t[1]:0);};
  const tri=(a,b,c,n,col)=>{const i=P.length/3;vtx(a,n,col);vtx(b,n,col);vtx(c,n,col);I.push(i,i+1,i+2);};
  const quad=(a,b,c,d,n,col,ta,tb,tc,td)=>{const i=P.length/3;vtx(a,n,col,ta);vtx(b,n,col,tb);vtx(c,n,col,tc);vtx(d,n,col,td);I.push(i,i+1,i+2,i,i+2,i+3);};
  const rot=(x,y,z,ry,rx,rz)=>{if(rz){const c=Math.cos(rz),s=Math.sin(rz),nx=x*c-y*s,ny=x*s+y*c;x=nx;y=ny;}
    if(rx){const c=Math.cos(rx),s=Math.sin(rx),ny=y*c-z*s,nz=y*s+z*c;y=ny;z=nz;}
    if(ry){const c=Math.cos(ry),s=Math.sin(ry),nx=x*c+z*s,nz=-x*s+z*c;x=nx;z=nz;}return [x,y,z];};
  function box(cx,cy,cz,w,h,d,ry,col,o){o=o||{};const X=w/2,Y=h/2,Z=d/2,rx=o.rx||0,rz=o.rz||0,uP=o.uP,vP=o.vP,sh=o.sh||[1,0.84,0.84,0.95,0.9];ry=ry||0;   // sh＝[上, +x, -x, +z, -z]
    const W=(x,y,z)=>{const r=rot(x,y,z,ry,rx,rz);return [cx+r[0],cy+r[1],cz+r[2]];},R=(x,y,z)=>rot(x,y,z,ry,rx,rz);
    const ur=o.uvRot||0,uc=Math.cos(ur),us=Math.sin(ur),uvW=(p,axis)=>uP?[(axis==='x'?(p[0]*uc-p[2]*us):(p[0]*us+p[2]*uc))/uP,p[1]/vP]:null,cl=k=>[col[0]*k,col[1]*k,col[2]*k];
    quad(W(-X,Y,-Z),W(X,Y,-Z),W(X,Y,Z),W(-X,Y,Z),R(0,1,0),cl(sh[0]));
    if(o.bottom)quad(W(-X,-Y,-Z),W(-X,-Y,Z),W(X,-Y,Z),W(X,-Y,-Z),R(0,-1,0),cl(0.6));
    let q;
    q=[W(X,-Y,-Z),W(X,-Y,Z),W(X,Y,Z),W(X,Y,-Z)];quad(q[0],q[1],q[2],q[3],R(1,0,0),cl(sh[1]),uvW(q[0],'z'),uvW(q[1],'z'),uvW(q[2],'z'),uvW(q[3],'z'));
    q=[W(-X,-Y,Z),W(-X,-Y,-Z),W(-X,Y,-Z),W(-X,Y,Z)];quad(q[0],q[1],q[2],q[3],R(-1,0,0),cl(sh[2]),uvW(q[0],'z'),uvW(q[1],'z'),uvW(q[2],'z'),uvW(q[3],'z'));
    q=[W(-X,-Y,Z),W(-X,Y,Z),W(X,Y,Z),W(X,-Y,Z)];quad(q[0],q[1],q[2],q[3],R(0,0,1),cl(sh[3]),uvW(q[0],'x'),uvW(q[1],'x'),uvW(q[2],'x'),uvW(q[3],'x'));
    q=[W(X,-Y,-Z),W(X,Y,-Z),W(-X,Y,-Z),W(-X,-Y,-Z)];quad(q[0],q[1],q[2],q[3],R(0,0,-1),cl(sh[4]),uvW(q[0],'x'),uvW(q[1],'x'),uvW(q[2],'x'),uvW(q[3],'x'));}
  function cone(cx,y0,cz,r,h,sides,col,dir,ph){dir=dir||1;ph=ph||0;const ap=[cx,y0+dir*h,cz],k=r/h,nl=Math.hypot(1,k);
    for(let i=0;i<sides;i++){const a0=ph+i/sides*TAU,a1=ph+(i+1)/sides*TAU,am=(a0+a1)/2;
      tri(ap,[cx+r*Math.cos(a0),y0,cz+r*Math.sin(a0)],[cx+r*Math.cos(a1),y0,cz+r*Math.sin(a1)],[Math.cos(am)/nl,dir*k/nl,Math.sin(am)/nl],col);}}
  function toMesh(name,mat){if(!P.length)return null;const m=new BABYLON.Mesh(name,scene),vd=new BABYLON.VertexData();
    vd.positions=P;vd.normals=N;vd.colors=K;vd.indices=I;if(T)vd.uvs=T;vd.applyToMesh(m);m.material=mat;m.isPickable=false;return m;}
  return {tri,quad,box,cone,toMesh,count:()=>P.length/3};
}
const vcMat=M('#ffffff',{em:'#505050'});vcMat.backFaceCulling=false;vcMat.specularColor=C(0,0,0);   // 吃頂點色的共用材質

// ═════════ ② 貼圖 ═════════
// 草地：深淺不均的大色塊＋密集草葉（沒有斜紋），1024px 鋪 32 m。
function grassTexture(){
  const S=1024,t=newTex('xxGrass',S,S),g=t.getContext(),rnd=rng(11);
  fillNoise(g,S,rnd,70,140,62,0.10);
  for(let n=0;n<320;n++){const x=rnd()*S,y=rnd()*S,r=25+rnd()*95,k=rnd();const col=k<0.4?'rgba(24,84,34,0.07)':k<0.75?'rgba(150,200,90,0.06)':'rgba(176,170,66,0.05)';
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=col;g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  const blade=['rgba(28,92,36,0.55)','rgba(52,128,52,0.55)','rgba(92,164,70,0.5)','rgba(126,176,74,0.45)','rgba(20,70,30,0.5)'];
  for(let n=0;n<26000;n++){const x=rnd()*S,y=rnd()*S,len=5+rnd()*9,a=-1.57+(rnd()-0.5)*1.3;
    tile(S,x,y,14,(dx,dy)=>{g.strokeStyle=blade[(rnd()*blade.length)|0];g.lineWidth=0.8+rnd()*1.0;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*len,y+dy+Math.sin(a)*len);g.stroke();});}
  t.update();return t;
}
// 內野紅土（一般棒球場的褐紅色），512px 鋪 10 m。
function dirtTexture(){
  const S=512,t=newTex('xxDirt',S,S),g=t.getContext(),rnd=rng(23);
  fillNoise(g,S,rnd,150,100,70,0.12);
  for(let n=0;n<140;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*50,dark=rnd()<0.5;
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=dark?'rgba(80,46,30,0.10)':'rgba(220,170,130,0.07)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  for(let n=0;n<700;n++){const x=rnd()*S,y=rnd()*S,rx=1.5+rnd()*4,ry=rx*(0.6+rnd()*0.5),rot=rnd()*3.14;
    tile(S,x,y,8,(dx,dy)=>{g.fillStyle='rgba(90,52,34,0.40)';g.beginPath();g.ellipse(x+dx,y+dy,rx,ry,rot,0,TAU);g.fill();g.fillStyle='rgba(200,150,110,0.30)';g.beginPath();g.ellipse(x+dx-0.8,y+dy-0.8,rx*0.55,ry*0.5,rot,0,TAU);g.fill();});}
  for(let n=0;n<380;n++){const x=rnd()*S,y=rnd()*S;tile(S,x,y,4,(dx,dy)=>{g.fillStyle=n%2?'rgba(190,170,150,0.7)':'rgba(120,96,80,0.7)';g.fillRect(x+dx,y+dy,1+rnd()*2,1+rnd()*1.5);});}
  g.lineWidth=1;for(let n=0;n<70;n++){const y=rnd()*S,a=(rnd()-0.5)*0.12;g.strokeStyle='rgba(70,40,26,0.10)';g.beginPath();g.moveTo(0,y);g.lineTo(S,y+a*S);g.stroke();}
  t.update();return t;
}
// 外野牆：深綠灰的軟墊，每 2 m 一片接縫，頂端米色壓條。len＝牆長(m)。
function padMat(len){
  const t=newTex('xxPad',1024,128),g=t.getContext(),rnd=rng(37+(len|0));
  g.fillStyle='#2b4a43';g.fillRect(0,0,1024,128);
  for(let n=0;n<3000;n++){g.fillStyle=n%2?'rgba(255,255,255,0.025)':'rgba(0,0,0,0.04)';g.fillRect(rnd()*1024,rnd()*128,2,2);}
  g.strokeStyle='rgba(0,0,0,0.38)';g.lineWidth=3;for(let x=0;x<=1024;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,128);g.stroke();}
  g.strokeStyle='rgba(255,255,255,0.07)';g.lineWidth=2;for(let x=4;x<=1024;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,128);g.stroke();}
  g.fillStyle='#d9c79c';g.fillRect(0,0,1024,10);g.fillStyle='#8c7550';g.fillRect(0,10,1024,4);       // 頂端米色／古銅色壓條
  t.uScale=Math.max(1,len/8);t.update();return texMat(t,1);
}
// 觀眾（與乙子園相同）：front＝座位前面的立面（一排人），top＝座位平面（俯視看到頭頂與肩膀）。
const CROWD_PEOPLE=14,CROWD_TW=CROWD_PEOPLE*0.5333,CROWD_ROW=0.8,CROWD_STEP=1.1;
function crowdTextures(){
  const W=CROWD_PEOPLE*64,rnd=rng(5),shirts=['#c8d4e6','#e9ecef','#e57b5d','#4f7fb0','#6fa06a','#d8b24a','#8a6bb3','#d9d1c0','#3b4a63','#c24b57'],
    skins=['#f1c7a0','#e0ad82','#c98f63','#f6d4b4'],hairs=['#1e1a17','#2c231d','#4a3626','#8a8a8a','#10100f'];
  const front=newTex('xxCrowdF',W,96),gf=front.getContext(),top=newTex('xxCrowdT',W,132),gt=top.getContext();
  gf.fillStyle='#2b2f37';gf.fillRect(0,0,W,96);gt.fillStyle='#39414d';gt.fillRect(0,0,W,132);
  for(let i=0;i<CROWD_PEOPLE;i++){const cx=i*64+32+(rnd()-0.5)*8,sh=shirts[(rnd()*shirts.length)|0],sk=skins[(rnd()*skins.length)|0],hr=hairs[(rnd()*hairs.length)|0];
    gf.fillStyle=sh;gf.beginPath();gf.ellipse(cx,84,26,34,0,0,TAU);gf.fill();gf.fillStyle=sk;gf.beginPath();gf.arc(cx,34,13,0,TAU);gf.fill();gf.fillStyle=hr;gf.beginPath();gf.arc(cx,29,13.5,3.14,TAU);gf.fill();
    gt.fillStyle=sh;gt.beginPath();gt.ellipse(cx,66,26,15,0,0,TAU);gt.fill();gt.fillStyle=hr;gt.beginPath();gt.arc(cx,66,12,0,TAU);gt.fill();}
  front.update();top.update();return {front,top};
}
// 卵石馬賽克石材（百貨公司的外牆；球場外牆也用）：灰、米、淺褐、粉褐的小石塊一排排拼貼，深色縫隙。256 px ＝ 4 m。
function pebbleTex(){
  const S=256,t=newTex('xxPebble',S,S),g=t.getContext(),rnd=rng(21),pal=['#cdc3b1','#b9ae9d','#a49889','#d8ceba','#a89886','#928779','#c2b39b','#ab917c','#b7a79c','#8e8274'];
  g.fillStyle='#71675c';g.fillRect(0,0,S,S);
  const rows=16,rh=S/rows;
  for(let r=0;r<rows;r++){let x=-rnd()*10;const y=r*rh;
    while(x<S){let w=7+rnd()*17;if(x+w>S-5&&x+w<S+3)w=S-x;const col=pal[(rnd()*pal.length)|0],k=0.9+rnd()*0.2;
      const [R,G,B]=[parseInt(col.slice(1,3),16)*k,parseInt(col.slice(3,5),16)*k,parseInt(col.slice(5,7),16)*k].map(v=>Math.min(255,v|0));
      g.fillStyle='rgb('+R+','+G+','+B+')';const x0=x+1,y0=y+1+rnd()*0.8,ww=w-2,hh=rh-2-rnd()*1.2,rr=2;
      g.beginPath();g.moveTo(x0+rr,y0);g.arcTo(x0+ww,y0,x0+ww,y0+hh,rr);g.arcTo(x0+ww,y0+hh,x0,y0+hh,rr);g.arcTo(x0,y0+hh,x0,y0,rr);g.arcTo(x0,y0,x0+ww,y0,rr);g.closePath();g.fill();
      if(x+w>S)for(const dx of[-S]){g.beginPath();g.rect(x0+dx,y0,ww,hh);g.fill();}                                  // 超出右緣的部分接回左邊（無縫）
      g.fillStyle='rgba(255,255,255,0.10)';g.fillRect(x0+1,y0+1,ww-2,1.5);x+=w;}}
  t.update();return t;
}
// 淺褐木紋色板材（鼓形量體）：一格＝8 m 寬 × 4 m 高（64 px/m）；橫向木紋條、每格一扇小窗（藍色窗框）
function woodPanelTex(){
  const W=512,H=256,t=newTex('xxWoodPanel',W,H),g=t.getContext(),rnd=rng(33),pal=['#d6ac80','#cc9f72','#e0b88e','#bf9065','#d9b28a'];
  g.fillStyle='#d3a97d';g.fillRect(0,0,W,H);
  for(let y=0;y<H;){const h=4+rnd()*14;g.fillStyle=pal[(rnd()*pal.length)|0];g.globalAlpha=0.55;g.fillRect(0,y,W,h);y+=h;}g.globalAlpha=1;
  for(let n=0;n<420;n++){g.strokeStyle='rgba('+(120+rnd()*40|0)+',80,50,0.25)';g.lineWidth=1;const y=rnd()*H,x=rnd()*W;g.beginPath();g.moveTo(x,y);g.lineTo(x+30+rnd()*120,y+(rnd()-0.5)*2);g.stroke();}
  g.strokeStyle='rgba(90,60,40,0.30)';g.lineWidth=2;for(let x=0;x<W;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
  g.fillStyle='#2b6ea8';g.fillRect(196,70,100,124);g.fillStyle='#16243a';g.fillRect(203,77,86,110);g.fillStyle='rgba(120,170,210,0.35)';g.fillRect(203,77,86,40);   // 小窗：藍色窗框＋深色玻璃
  g.fillStyle='#2b6ea8';g.fillRect(244,77,4,110);g.fillRect(203,128,86,4);
  t.update();return t;
}
// 褐色木條欄杆（陽台、露台邊緣）：垂直木條，64×64 px ＝ 1 m
function slatTex(){
  const S=64,t=newTex('xxSlat',S,S),g=t.getContext();g.fillStyle='#4e3523';g.fillRect(0,0,S,S);
  for(let x=0;x<S;x+=8){g.fillStyle=(x/8)%2?'#7e573a':'#6a4630';g.fillRect(x+1,0,6,S);g.fillStyle='rgba(255,255,255,0.08)';g.fillRect(x+1,0,1,S);}
  g.fillStyle='#3a271a';g.fillRect(0,0,S,5);g.fillRect(0,S-5,S,5);t.update();return t;
}
// 深灰藍的分格金屬屋頂（像太陽能板的格狀）：128 px ＝ 2 m
function roofSegTex(){
  const S=128,t=newTex('xxRoofSeg',S,S),g=t.getContext(),rnd=rng(9);g.fillStyle='#3a4757';g.fillRect(0,0,S,S);
  for(let n=0;n<900;n++){g.fillStyle=n%2?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.06)';g.fillRect(rnd()*S,rnd()*S,2,2);}
  g.strokeStyle='#5d6f85';g.lineWidth=3;g.strokeRect(1.5,1.5,S-3,S-3);g.strokeStyle='rgba(120,140,165,0.5)';g.lineWidth=1;g.beginPath();g.moveTo(S/2,0);g.lineTo(S/2,S);g.moveTo(0,S/2);g.lineTo(S,S/2);g.stroke();
  t.update();return t;
}
// 粉灰色磚鋪面（廣場）：256 px ＝ 4 m，每塊約 0.6 × 0.3 m
function brickTex(){
  const S=256,t=newTex('xxBrick',S,S),g=t.getContext(),rnd=rng(61);g.fillStyle='#8a7d74';g.fillRect(0,0,S,S);
  const pal=['#b9a89d','#a99a8f','#c8b9ad','#b09f93','#bfaea2'];
  for(let r=0;r<16;r++){for(let c=0;c<8;c++){const x=c*32+(r%2?16:0)-(r%2?16:0)*0,y=r*16;g.fillStyle=pal[(rnd()*pal.length)|0];
      const xx=(c*32+(r%2?16:0));g.fillRect(xx+1,y+1,30,14);if(xx+32>S)g.fillRect(xx-S+1,y+1,30,14);}}
  t.update();return t;
}
// 深色玻璃入口：窗格＋古銅色框
function glassTex(){const W=256,H=256,t=newTex('xxGlass',W,H),g=t.getContext();
  const gl=g.createLinearGradient(0,0,0,H);gl.addColorStop(0,'#566f82');gl.addColorStop(1,'#1b2530');g.fillStyle=gl;g.fillRect(0,0,W,H);
  g.strokeStyle='#4b3b2c';g.lineWidth=6;for(let x=0;x<=W;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=0;y<=H;y+=85){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  g.fillStyle='rgba(255,255,255,0.10)';g.beginPath();g.moveTo(0,H);g.lineTo(90,0);g.lineTo(130,0);g.lineTo(40,H);g.closePath();g.fill();t.update();return t;}
function roadTexture(lanes,twoWay){   // 車道貼圖：u 橫跨路面、v 沿行進方向（12 m 一個週期）；twoWay＝中央雙黃線，兩側各 lanes/2 條車道
  const S=256,t=newTex('xxRoad'+lanes+(twoWay?'t':'o'),S,S),g=t.getContext(),rnd=rng(91+lanes);fillNoise(g,S,rnd,64,66,69,0.10);
  for(let n=0;n<800;n++){g.fillStyle=n%2?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.07)';g.fillRect(rnd()*S,rnd()*S,1+rnd()*2,1+rnd()*2);}
  g.fillStyle='#e8e4d4';g.fillRect(6,0,5,S);g.fillRect(S-11,0,5,S);
  for(let i=1;i<lanes;i++){const x=S*i/lanes;if(twoWay&&i===lanes/2){g.fillStyle='#e8b923';g.fillRect(x-6,0,4,S);g.fillRect(x+2,0,4,S);}else{g.fillStyle='#e8e4d4';g.fillRect(x-2.5,0,5,S*0.45);}}
  t.update();return t;}
function plazaTexture(){   // 米色石板廣場，4 m 一格
  const S=512,t=newTex('xxPlaza',S,S),g=t.getContext(),rnd=rng(44);g.fillStyle='#cfc2a4';g.fillRect(0,0,S,S);
  for(let n=0;n<6000;n++){g.fillStyle=n%2?'rgba(255,255,255,0.10)':'rgba(80,60,40,0.08)';g.fillRect(rnd()*S,rnd()*S,1+rnd()*2,1+rnd()*2);}
  g.strokeStyle='rgba(110,90,60,0.55)';g.lineWidth=2;for(let i=0;i<=S;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,S);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(S,i);g.stroke();}
  t.update();return t;}
function signTexture(w,h){   // 藍色大字「遠東百貨」＋紅藍白圓形標誌；透明底（用 decalMat 貼在牆上）
  const t=newTex('xxSign',w,h),g=t.getContext();g.clearRect(0,0,w,h);
  const cx=h*0.5,cy=h*0.5,r=h*0.34;g.fillStyle='#ffffff';g.beginPath();g.arc(cx,cy,r,0,TAU);g.fill();
  g.fillStyle='#1f46a0';g.beginPath();g.arc(cx,cy,r,3.5,5.9);g.lineTo(cx,cy);g.fill();g.fillStyle='#d11d2a';g.beginPath();g.arc(cx,cy,r,0.3,3.4);g.lineTo(cx,cy);g.fill();
  g.fillStyle='#ffffff';g.beginPath();g.arc(cx,cy,r*0.34,0,TAU);g.fill();
  g.fillStyle='#1f46a0';g.textAlign='left';g.textBaseline='middle';g.font='bold '+Math.round(h*0.62)+'px "Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif';g.fillText('遠東百貨',h*1.0,h*0.52);
  t.hasAlpha=true;t.update();return t;}

const decalMat=tex=>{const m=M('#000000');m.emissiveTexture=tex;m.opacityTexture=tex;m.disableLighting=true;m.backFaceCulling=false;return m;};

// ═════════ ③ 地圖座標：像素 → 道路對齊座標 (dU,dV) → 球場座標 (x,z) ═════════
// 比例尺 0.425 m/px（標準足球場 105×68 m ≈ 245×165 px）。以紅框西南角 P4=(293,462) 為原點，兩個「道路對齊軸」：
//   U 軸＝方位 22.1°（平行紅框左邊、平行東邊的莊敬北路），V 軸＝方位 112.1°（平行紅框下緣、平行南邊的莊敬一路／光明六路）。
// 本壘板在 (HAU,HAV)＝(38,44) m：三壘線沿 U 軸、一壘線沿 V 軸（兩條界外線各自平行一條馬路），中外野沿 U+V 的對角線（方位 ≈67°，東北東）。
// 因此球場座標（+z＝中外野、+x＝右手邊）和 (dU,dV)（以本壘板為原點）的關係是：x＝(dV−dU)/√2，z＝(dU+dV)/√2。
const MAPS={s:0.425,u0:293,v0:462,al:22.1*Math.PI/180,HAU:38,HAV:44};
const uv2g=(dU,dV)=>[SQ*(dV-dU),SQ*(dU+dV)];
const g2uv=(x,z)=>[SQ*(z-x),SQ*(x+z)];
const px2uv=(u,v)=>{const e=(u-MAPS.u0)*MAPS.s,n=-(v-MAPS.v0)*MAPS.s,a=MAPS.al;return [e*Math.sin(a)+n*Math.cos(a)-MAPS.HAU,e*Math.cos(a)-n*Math.sin(a)-MAPS.HAV];};
const px2g=(u,v)=>{const a=px2uv(u,v);return uv2g(a[0],a[1]);};
const TILT=7.6/178;   // 紅框下緣（和南邊的路）相對 V 軸的傾斜：每向東 1 m，往北抬高 0.0427 m
const BUILD_ROT=-Math.PI/4;   // 盒子的 x 軸沿 V 軸、z 軸沿 U 軸時的 rotation.y

// ═════════ ④ 地面與外野牆（三段直線，與乙子園同規格）═════════
const grassTex=grassTexture(),dirtTex=dirtTexture();
ctx.makeGround(texMat(grassTex,1));
ctx.setFieldMats({dirt:texMat(dirtTex,1),home:texMat(dirtTex,0.94),mound:texMat(dirtTex,1.08)});   // 內野草皮菱形維持主程式的預設，只換紅土
const POLE=98,POLE_X=POLE*SQ;
const OF=[[-POLE_X,POLE_X],[-34,101],[34,101],[POLE_X,POLE_X]];
const WALL_H=4.0,FENCE_TOP=WALL_H+0.2;
function fenceAt(deg){
  const a=Math.max(-45,Math.min(45,deg))*Math.PI/180,dx=Math.sin(a),dz=Math.cos(a);
  for(let i=0;i<3;i++){const A=OF[i],B=OF[i+1],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
    const t=(A[0]*ez-A[1]*ex)/den,u=(A[0]*dz-A[1]*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)return t;}
  return POLE;
}
const capMat=M('#d9c79c');
for(let i=0;i<3;i++){const A=OF[i],B=OF[i+1];wallSeg(A[0],A[1],B[0],B[1],WALL_H,0.6,padMat(Math.hypot(B[0]-A[0],B[1]-A[1])),true,true,capMat,0.7);}
const poleMat=M('#ffd21f',{em:'#6b5300'});
[-1,1].forEach(s=>put(MB.CreateCylinder('xxPole',{diameter:0.28,height:18,tessellation:10},scene),s*POLE_X,9,POLE_X,poleMat));

// ═════════ ⑤ 看台、雨棚與鼓形塔 ═════════
// 看台與乙子園相同（階梯式、貼觀眾貼圖、每階一個碰撞方盒），只是後牆（球場外牆）改成橫向石材帶＋帶狀窗，與百貨公司的立面同一套。
const crowd=crowdTextures();
const cf=M('#000000');cf.emissiveTexture=crowd.front;cf.disableLighting=true;cf.backFaceCulling=false;
const ct=M('#000000');ct.emissiveTexture=crowd.top;ct.disableLighting=true;ct.backFaceCulling=false;
const crowdMat=new BABYLON.MultiMaterial('xxCrowd',scene);crowdMat.subMaterials=[cf,ct];
const pebbleT=pebbleTex(),stoneMat=unlitTex(pebbleT),slatMat=unlitTex(slatTex());
function stand(ax,az,bx,bz,tiers,gap,top0,ext){
  const dx=bx-ax,dz=bz-az,L0=Math.hypot(dx,dz),ux=dx/L0,uz=dz/L0;
  let nx=uz,nz=-ux;if(nx*(ax+bx)/2+nz*(az+bz)/2<0){nx=-nx;nz=-nz;}
  const s0=-(ext||0),s1=L0+(ext||0),L=s1-s0,u1=L/CROWD_TW,pos=[],uv=[],idxR=[],idxT=[];
  const P=(s,off,y)=>pos.push(ax+ux*s+nx*off,y,az+uz*s+nz*off);
  const quad=arr=>{const n=pos.length/3-4;arr.push(n,n+1,n+2,n,n+2,n+3);};
  const vBase=top0-CROWD_ROW;
  for(let k=0;k<tiers;k++){const off=gap+k*CROWD_STEP,top=top0+k*CROWD_ROW,bot=k?top-CROWD_ROW:0;
    P(s0,off,bot);P(s1,off,bot);P(s1,off,top);P(s0,off,top);
    uv.push(0,(bot-vBase)/CROWD_ROW,u1,(bot-vBase)/CROWD_ROW,u1,(top-vBase)/CROWD_ROW,0,(top-vBase)/CROWD_ROW);quad(idxR);
    P(s0,off,top);P(s1,off,top);P(s1,off+CROWD_STEP,top);P(s0,off+CROWD_STEP,top);
    uv.push(0,0,u1,0,u1,1,0,1);quad(idxT);}
  const m=new BABYLON.Mesh('xxStand',scene),vd=new BABYLON.VertexData(),nor=[];
  vd.positions=pos;vd.indices=idxR.concat(idxT);vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,vd.indices,nor);vd.normals=nor;vd.applyToMesh(m);
  m.material=crowdMat;m.isPickable=false;m.subMeshes=[];
  const nv=pos.length/3;new BABYLON.SubMesh(0,0,nv,0,idxR.length,m);new BABYLON.SubMesh(1,0,nv,idxR.length,idxT.length,m);
  const ang=Math.atan2(-dz,dx),mx=(ax+bx)/2,mz=(az+bz)/2;
  for(let k=0;k<tiers;k++){const off=gap+k*CROWD_STEP+CROWD_STEP/2,top=top0+k*CROWD_ROW;ghostBox(mx+nx*off,top/2,mz+nz*off,L,top,CROWD_STEP+0.1,ang,'spectator');}
  const backOff=gap+tiers*CROWD_STEP+0.3,bh=top0+tiers*CROWD_ROW+1.6,f=V4(0,0,L/4,bh/4);   // 後牆：UV 以公尺換算（卵石石材 4 m 一格）
  const bw=put(MB.CreateBox('xxStandBack',{width:L,height:bh,depth:0.6,faceUV:[f,f,V4(0,0,0.05,0.05),V4(0,0,0.05,0.05),V4(0,0,0.05,0.05),V4(0,0,0.05,0.05)]}),mx+nx*backOff,bh/2,mz+nz*backOff,stoneMat);
  bw.rotation.y=ang;registerBallSolid(bw,'spectator');
  const cap=put(MB.CreateBox('xxStandCap',{width:L+0.2,height:0.35,depth:0.9}),mx+nx*backOff,bh+0.17,mz+nz*backOff,M('#4e3523'));cap.rotation.y=ang;   // 女兒牆壓頂（深褐木色）
  const fs=V4(0,0,L/1.0,1.2/1.0),rail=put(MB.CreateBox('xxStandRail',{width:L,height:1.2,depth:0.25,faceUV:[fs,fs,V4(0,0,0.1,0.1),V4(0,0,0.1,0.1),V4(0,0,0.1,0.1),V4(0,0,0.1,0.1)]}),mx+nx*(backOff-0.38),bh-1.0,mz+nz*(backOff-0.38),slatMat);rail.rotation.y=ang;   // 牆面外側的褐色木條欄杆帶（同百貨公司的陽台欄杆）
}
for(let i=0;i<3;i++)stand(OF[i][0],OF[i][1],OF[i+1][0],OF[i+1][1],5,1.8,4.6,1.2);

// 鼓形量體（百貨公司和球場塔樓共用）：兩層圓柱（淺褐木紋板材＋小窗），每層下緣有環繞陽台（褐色木條欄杆），
// 屋簷大幅外伸的深灰藍分格圓頂（中央微微隆起）。r＝下層半徑、tiers＝[下層高,上層高]、roofH＝圓頂高。
const woodT=woodPanelTex(),woodMat=unlitTex(woodT),roofSegT=roofSegTex(),roofSegMat=unlitTex(roofSegT),roofSlate=M('#4c5560'),bronze=M('#8c7550'),darkBronze=M('#4b3b2c');
function drum(cx,cz,r,y0,tiers,roofH){
  let y=y0;const rs=[r,r*0.93];
  tiers.forEach((h,i)=>{const rr=rs[i],circ=TAU*rr,f=[V4(0,0,1,1),V4(0,0,circ/8,h/4),V4(0,0,1,1)];
    put(MB.CreateCylinder('xxDrum',{diameter:rr*2,height:h,tessellation:56,faceUV:f}),cx,y+h/2,cz,woodMat);
    const rb=rr+1.2,rf=[V4(0,0,1,1),V4(0,0,TAU*rb/1.0,1.1/1.0),V4(0,0,1,1)];
    put(MB.CreateCylinder('xxDrumDeck',{diameter:rb*2+0.6,height:0.35,tessellation:56}),cx,y+0.18,cz,darkBronze);                                  // 陽台地板
    put(MB.CreateCylinder('xxDrumRail',{diameter:rb*2,height:1.1,tessellation:56,faceUV:rf}),cx,y+0.35+0.55,cz,slatMat);                           // 木條欄杆
    y+=h;});
  const rt=rs[1],ov=rt+3.2,cf=TAU*ov;                                                                                                        // 屋簷外伸 3.2 m
  put(MB.CreateCylinder('xxDrumEave',{diameter:rt*2+0.8,height:0.7,tessellation:56}),cx,y+0.35,cz,darkBronze);
  put(MB.CreateCylinder('xxDrumRoof',{diameterTop:rt*0.5,diameterBottom:ov*2,height:roofH,tessellation:56,faceUV:[V4(0,0,1,1),V4(0,0,cf/2,Math.hypot(ov,roofH)/2),V4(0,0,1,1)]}),cx,y+0.7+roofH/2,cz,roofSegMat);
  put(MB.CreateCylinder('xxDrumLantern',{diameter:rt*0.5+0.2,height:0.9,tessellation:28}),cx,y+0.7+roofH+0.4,cz,roofSlate);
}
[-1,1].forEach(s=>{drum(s*37.7,110.3,6.6,0,[8,7.5],2.6);ghostBox(s*37.7,8,110.3,14,16,14,0,'spectator');});

// 本壘後方看台＋深灰藍屋頂雨棚（懸臂式，只靠後面的古銅色柱子撐）
stand(-12,-20,12,-20,6,1.4,4.0,2);
{const RY=13.4,rz=-25.8;
 put(MB.CreateBox('xxHomeRoof',{width:34,height:0.5,depth:10.6}),0,RY,rz,roofSlate);
 put(MB.CreateBox('xxHomeFascia',{width:34.4,height:1.1,depth:0.5}),0,RY-0.1,-20.8,darkBronze);
 put(MB.CreateBox('xxHomeRoofUnder',{width:34,height:0.1,depth:10.6}),0,RY-0.31,rz,M('#2d3238'));
 for(const x of[-15,-7.5,0,7.5,15])put(MB.CreateBox('xxHomeCol',{width:0.7,height:RY,depth:0.7}),x,RY/2,-29.9,bronze);
 ghostBox(0,RY,rz,34,0.6,10.6,0,undefined);}

// ═════════ ⑥ 界外牆、擋球牆、球員休息區 ═════════
const FOUL_OFF=19,foulMat=M('#2b4a43'),stripe=M('#d9c79c'),homeBackZ=-20;
wallSeg(-12,homeBackZ,12,homeBackZ,3.4,0.6,foulMat,true,false,stripe,0.6);
const sides=[-1,1];
sides.forEach(s=>{
  const a=lpt(s,0,FOUL_OFF),b=lpt(s,POLE,FOUL_OFF),pole=lpt(s,POLE,0);
  wallSeg(s*12,homeBackZ,a.x,a.z,3.0,0.6,foulMat,true,false,stripe,0.6);
  wallSeg(a.x,a.z,b.x,b.z,2.8,0.6,foulMat,true,false,stripe,0.6);
  wallSeg(pole.x,pole.z,b.x,b.z,2.8,0.6,foulMat,true,false,stripe,0.6);
  const sa=lpt(s,8,FOUL_OFF),sb=lpt(s,70,FOUL_OFF);stand(sa.x,sa.z,sb.x,sb.z,5,1.4,3.6,0);
});
const DUG_R=19,DUG_FRONT=12.5,benchMat=M('#9b7a4d'),slab=M('#8d8a82');
sides.forEach(s=>{
  const dirX=s*SQ,dirZ=SQ,ang=Math.atan2(-dirZ,dirX),c=lpt(s,DUG_R,(DUG_FRONT+FOUL_OFF)/2);
  const floor=put(MB.CreateBox('xxDugFloor',{width:14,height:0.06,depth:FOUL_OFF-DUG_FRONT}),c.x,0.04,c.z,slab);floor.rotation.y=ang;
  const roof=put(MB.CreateBox('xxDugRoof',{width:14.6,height:0.18,depth:FOUL_OFF-DUG_FRONT+0.8}),c.x,2.7,c.z,roofSlate);roof.rotation.y=ang;registerBallSolid(roof);
  const bn=lpt(s,DUG_R,FOUL_OFF-1.2),bench=put(MB.CreateBox('xxDugBench',{width:11,height:0.5,depth:0.7}),bn.x,0.3,bn.z,benchMat);bench.rotation.y=ang;
  const f0=lpt(s,DUG_R-7,DUG_FRONT),f1=lpt(s,DUG_R-1.3,DUG_FRONT),f2=lpt(s,DUG_R+1.3,DUG_FRONT),f3=lpt(s,DUG_R+7,DUG_FRONT);
  wallSeg(f0.x,f0.z,f1.x,f1.z,1.1,0.4,foulMat,true,false,stripe,0);wallSeg(f2.x,f2.z,f3.x,f3.z,1.1,0.4,foulMat,true,false,stripe,0);
});

// ═════════ ⑦ 記分板（深石板色底、古銅框、暖白字；位置與規格同乙子園）═════════
const BOARD_W=36,BOARD_H=12,BOARD_Y=6+BOARD_H/2+0.6,BOARD_Z=101.9;
const boardTex=sbTexInit();
const faceMat=M('#000000');faceMat.emissiveTexture=boardTex;faceMat.disableLighting=true;faceMat.backFaceCulling=false;
put(MB.CreatePlane('xxBoardFace',{width:BOARD_W,height:BOARD_H,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),0,BOARD_Y,BOARD_Z-0.32,faceMat);
registerBallSolid(put(MB.CreateBox('xxBoardFrame',{width:BOARD_W+1.2,height:BOARD_H+1.2,depth:0.6}),0,BOARD_Y,BOARD_Z,darkBronze),'scoreboard');
registerBallSolid(put(MB.CreateBox('xxBoardRoof',{width:BOARD_W+2.2,height:0.3,depth:1.6}),0,BOARD_Y+BOARD_H/2+0.9,BOARD_Z-0.3,roofSlate),'scoreboard');
[-13.5,13.5].forEach(x=>registerBallSolid(put(MB.CreateBox('xxBoardPost',{width:1.0,height:BOARD_Y,depth:1.0}),x,BOARD_Y/2,BOARD_Z+0.2,bronze),'scoreboard'));
function drawBoard(g,s,W,H){
  const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',NUM='"Arial Narrow","Helvetica Neue",Arial,sans-serif',INK='#f3ead2',GOLD='#e0c27a',LINE='#c8b48a';
  g.fillStyle='#232d36';g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,0.025)';for(let y=0;y<H;y+=16)g.fillRect(0,y,W,2);                 // 橫向石材紋
  g.strokeStyle=LINE;g.lineWidth=9;g.strokeRect(10,10,W-20,H-20);
  const NX=34,NW=300,IX=NX+NW,IW=88,RX=IX+9*IW+20,RW=100,HY=34,HH=66,R1=HY+HH+8,RH=104,R2=R1+RH+6;
  const plate=(x,y,w,h,txt,size,col)=>{g.fillStyle='#10161b';g.fillRect(x+4,y+4,w-8,h-8);g.strokeStyle=LINE;g.lineWidth=2;g.strokeRect(x+4,y+4,w-8,h-8);
    g.fillStyle=col||INK;g.font='bold '+size+'px '+NUM;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,x+w/2,y+h/2+2);};
  g.strokeStyle=LINE;g.lineWidth=3;
  for(let i=0;i<=9;i++){g.beginPath();g.moveTo(IX+i*IW,HY);g.lineTo(IX+i*IW,R2+RH);g.stroke();}
  for(let i=0;i<=3;i++){g.beginPath();g.moveTo(RX+i*RW,HY);g.lineTo(RX+i*RW,R2+RH);g.stroke();}
  [HY,R1,R2,R2+RH].forEach(y=>{g.beginPath();g.moveTo(NX,y);g.lineTo(RX+3*RW,y);g.stroke();});
  g.fillStyle=INK;g.font='bold 44px '+NUM;g.textAlign='center';g.textBaseline='middle';
  for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn;g.fillStyle=cur?GOLD:INK;g.fillText(String(n),IX+i*IW+IW/2,HY+HH/2+2);}
  g.fillStyle=INK;['R','H','E'].forEach((t,i)=>g.fillText(t,RX+i*RW+RW/2,HY+HH/2+2));
  g.textAlign='left';g.font='bold 22px '+FONT;g.fillText('球隊',NX+16,HY+HH/2+2);
  [['me',R1,'#d8323a'],['cpu',R2,'#2f6fe0']].forEach(([key,y,col])=>{
    g.fillStyle=col;g.fillRect(NX+6,y+14,14,RH-28);
    let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);
    g.fillStyle=INK;g.font='bold '+(nm.length>4?44:54)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillText(nm,NX+32,y+RH/2+2);
    for(let i=0;i<9;i++){const n=s.first+i;if(!s.played(key,n))continue;const v=(s.lineScore[key]||[])[n-1];plate(IX+i*IW,y,IW,RH,v==null?'0':String(v),60,s.current(key,n)?GOLD:null);}
    plate(RX,y,RW,RH,String(s.score[key]),64);plate(RX+RW,y,RW,RH,String(s.hits[key]),60);plate(RX+2*RW,y,RW,RH,String(s.errors[key]),60);});
  const by=R2+RH+66;g.textBaseline='middle';
  [['B',s.balls,3,'#53e08a'],['S',s.strikes,2,'#ffd84a'],['O',s.outs,2,'#ff4a3a']].forEach(([lab,n,max,col],r)=>{
    const x0=NX+16+r*210;g.fillStyle=INK;g.font='bold 46px '+NUM;g.textAlign='left';g.fillText(lab,x0,by);
    for(let i=0;i<max;i++){g.beginPath();g.arc(x0+66+i*50,by,19,0,TAU);g.fillStyle=i<n?col:'#141b21';g.fill();g.strokeStyle=LINE;g.lineWidth=3;g.stroke();}});
  const dx0=NX+16+3*210+40;[[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22;g.save();g.translate(cx,cy);g.rotate(Math.PI/4);
    g.fillStyle=s.bases[i]?GOLD:'#141b21';g.fillRect(-12,-12,24,24);g.strokeStyle=LINE;g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
  g.textAlign='right';g.fillStyle=INK;g.font='bold 34px '+FONT;
  g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+s.batter),W-44,by);
}
ctx.setScoreboardRenderer(drawBoard);

// ═════════ ⑧ 道路與草地（依地圖；全部用道路對齊座標 (dU,dV) 定位）═════════
// 莊敬北路：dV≈145（紅框東緣之外），寬 16 m，兩側各 3 m 人行道；莊敬一路：紅框下緣南側 8.5 m，寬 11 m；
// 光明六路東一段：再往南 30 m，兩個單向車道（各 3 車道）中間 7 m 綠帶。南邊兩條路與紅框下緣一起相對 V 軸傾斜 TILT。
const farT=grassTex.clone();farT.uScale=farT.vScale=3000/32;
put(MB.CreateGround('xxFarGround',{width:3000,height:3000},scene),0,-0.04,200,texMat(farT,0.86));
const WALK=newBatch();
function walk(pts,width,y,col){   // 人行道／綠帶（純色）。pts＝[[dU,dV],…]
  for(let i=0;i<pts.length-1;i++){const a=uv2g(...pts[i]),b=uv2g(...pts[i+1]),dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*width/2,nz=dx/l*width/2;
    WALK.quad([a[0]-nx,y,a[1]-nz],[a[0]+nx,y,a[1]+nz],[b[0]+nx,y,b[1]+nz],[b[0]-nx,y,b[1]-nz],[0,1,0],col);}}
const rd43=unlitTex(roadTexture(4,true)),rd2=unlitTex(roadTexture(2,true)),rd3=unlitTex(roadTexture(3,false));
const B4=newBatch(true),B2=newBatch(true),B3=newBatch(true);
const edgeU=dV=>-36.1+TILT*dV;                       // 紅框下緣（以本壘板為原點）在 V=dV 處的 U 值
const V_E=145;                                        // 莊敬北路中心線的 V 值
{const stripTo=(b,pts,w,vPer,y)=>{   // 沿折線鋪一條路：u 橫跨路面、v 沿長度
   const P=pts.map(p=>uv2g(...p));let len=0;
   for(let i=0;i<P.length;i++){const p=P[i],a=P[Math.max(i-1,0)],c=P[Math.min(i+1,P.length-1)];if(i)len+=Math.hypot(p[0]-a[0],p[1]-a[1]);let tx=c[0]-a[0],tz=c[1]-a[1];const tl=Math.hypot(tx,tz);tx/=tl;tz/=tl;p.nx=-tz;p.nz=tx;p.len=len;}
   for(let i=0;i<P.length-1;i++){const a=P[i],c=P[i+1],h=w/2;
     b.quad([a[0]-a.nx*h,y,a[1]-a.nz*h],[a[0]+a.nx*h,y,a[1]+a.nz*h],[c[0]+c.nx*h,y,c[1]+c.nz*h],[c[0]-c.nx*h,y,c[1]-c.nz*h],[0,1,0],[1,1,1],[0,a.len/vPer],[1,a.len/vPer],[1,c.len/vPer],[0,c.len/vPer]);}};
 const V0=-520,V1=520,sw=[0.8,0.77,0.7];
 const lr=(off,w)=>[[edgeU(V0)-8.5+off,V0],[edgeU(V1)-8.5+off,V1]];                         // 與莊敬一路平行的折線（off＝往北為正）
 stripTo(B2,lr(0,11),11,12,0.03);
 walk(lr(7.2),3,0.05,sw);walk(lr(-7.2),3,0.05,sw);
 const bl=off=>[[edgeU(V0)-38.5+off,V0],[edgeU(V1)-38.5+off,V1]];                           // 光明六路（中央綠帶中心線）
 stripTo(B3,bl(10.5),13.5,12,0.03);stripTo(B3,bl(-10.5),13.5,12,0.03);walk(bl(0),7,0.06,[0.34,0.52,0.3]);
 walk(lr(-17),5,0.05,[0.4,0.55,0.34]);                                                       // 莊敬一路與光明六路之間的綠帶
 const u0=edgeU(V_E)-8.5+5.5+0.5;                                                              // 莊敬北路從莊敬一路北緣開始往北
 stripTo(B4,[[u0,V_E],[500,V_E]],16,12,0.03);
 walk([[u0,V_E-9.5],[500,V_E-9.5]],3,0.05,sw);walk([[u0,V_E+9.5],[500,V_E+9.5]],3,0.05,sw);
}
B4.toMesh('xxRoadN',rd43);B2.toMesh('xxRoadLocal',rd2);B3.toMesh('xxRoadBlvd',rd3);WALK.toMesh('xxWalks',vcMat);

// ═════════ ⑨ 遠東百貨竹北店（依三張照片；位置依地圖三個圓形屋頂）═════════
// 以本壘板為原點的 (dU,dV)：大鼓 D1≈(-4,184)、中鼓 D2≈(62,167)、北鼓 D3≈(85,175)。西側長立面（面向莊敬北路）在 dV≈158。
// 由南往北：D1 下面包著一圈弧形石牆（r=26，高 20 m）＋一樓玻璃帷幕；往北是 5 層的長條石牆基座（高 20 m）；
// 基座頂上依序退縮出兩層露台（27 m、34 m）、露台邊是褐色木條欄杆＋後面的帶狀玻璃；兩個小鼓坐在露台上，中間是玻璃採光罩。
const D1=px2uv(820,590),D2=px2uv(843,430),D3=px2uv(880,388);
const SB=newBatch(true),PB=newBatch(),GB=newBatch(true),RB=newBatch(),beige=[1,1,1],BR=BUILD_ROT;
const sbox=(b,cU,cV,y,wV,h,dU,col,o)=>{const p=uv2g(cU,cV);b.box(p[0],y,p[1],wV,h,dU,BR,col,Object.assign({uvRot:BR},o||{}));};   // 以 (dU,dV) 定位的盒子：wV＝沿 V 軸的寬、dU＝沿 U 軸的長
const FV=158,PV1=232,PU0=D1[0],PU1=104,H1=20;
sbox(SB,(PU0+PU1)/2,(FV+PV1)/2,12.5,PV1-FV,15,PU1-PU0,beige,{uP:4,vP:4});                             // 基座：長條石牆（5~20 m，一樓是玻璃）
sbox(SB,(30+PU1)/2,(162+PV1)/2,23.5,PV1-162,7,PU1-30,beige,{uP:4,vP:4});                               // 第一層退縮（20~27 m）
sbox(SB,(50+PU1)/2,(166+PV1)/2,30.5,PV1-166,7,PU1-50,beige,{uP:4,vP:4});                               // 第二層退縮（27~34 m）
// D1 下面的弧形石牆（r=26，從 5 m 到 20 m）＋ 一樓玻璃帷幕（r=24.5，0~5 m）＋ 柱列＋木格柵雨庇
{const c=uv2g(D1[0],D1[1]),pf=V4(0,0,TAU*26/4,15/4),gm=unlitTex(glassTex()),gf=V4(0,0,TAU*24.5/4,1.2);
 put(MB.CreateCylinder('xxStoreBaseWall',{diameter:52,height:15,tessellation:64,faceUV:[V4(0,0,1,1),pf,V4(0,0,1,1)]}),c[0],12.5,c[1],stoneMat);
 put(MB.CreateCylinder('xxStoreGlassRing',{diameter:49,height:5,tessellation:64,faceUV:[V4(0,0,1,1),gf,V4(0,0,1,1)]}),c[0],2.5,c[1],gm);
 put(MB.CreateCylinder('xxStoreCanopy',{diameter:57,height:0.5,tessellation:64}),c[0],5.2,c[1],darkBronze);
 for(let i=0;i<16;i++){const a=i/16*TAU;put(MB.CreateCylinder('xxStoreCol',{diameter:0.7,height:5.2,tessellation:10}),c[0]+Math.cos(a)*27.2,2.6,c[1]+Math.sin(a)*27.2,darkBronze);}}
// 西側立面：一樓玻璃帷幕（內縮 2.5 m）、褐色柱列、木格柵雨庇、鐵鏽色百葉、露台的木條欄杆與帶狀玻璃、露台植栽
{const gm=unlitTex(glassTex()),slatB=newBatch(true),slat=[1,1,1],green=[0.32,0.5,0.26];
 sbox(GB,(PU0+PU1)/2,(FV+2.5+PV1)/2,2.5,PV1-FV-2.5,5,PU1-PU0,[1,1,1],{uP:4,vP:2.5});
 sbox(PB,(PU0+PU1)/2,FV-1.6,5.2,3.8,0.5,PU1-PU0,[0.29,0.2,0.14]);
 for(let u=PU0+4;u<PU1;u+=8)sbox(PB,u,FV-2.6,2.6,0.7,5.2,0.7,[0.29,0.2,0.14]);
 for(const u of[14,44,76])sbox(RB,u,FV-0.7,12.5,1.6,3.4,7,[0.62,0.3,0.16]);                                                 // 鐵鏽色（耐候鋼）百葉
 sbox(GB,(30+PU1)/2,161.7,22.4,0.6,3.6,PU1-30,[1,1,1],{uP:4,vP:2.5});sbox(GB,(50+PU1)/2,165.7,29.4,0.6,3.6,PU1-50,[1,1,1],{uP:4,vP:2.5});   // 露台後面的帶狀玻璃
 sbox(slatB,(PU0+PU1)/2,158.4,H1+0.7,0.35,1.4,PU1-PU0,slat,{uP:1,vP:1.4});sbox(slatB,(30+PU1)/2,162.4,27.7,0.35,1.4,PU1-30,slat,{uP:1,vP:1.4});sbox(slatB,(50+PU1)/2,166.4,34.7,0.35,1.4,PU1-50,slat,{uP:1,vP:1.4});   // 木條欄杆
 sbox(PB,(PU0+PU1)/2,159.8,H1+0.35,1.6,0.7,PU1-PU0,green);sbox(PB,(30+PU1)/2,164.2,27.35,1.8,0.7,PU1-30,green);sbox(PB,(50+PU1)/2,168.2,34.35,1.8,0.7,PU1-50,green);   // 露台植栽
 slatB.toMesh('xxStoreRail',slatMat);GB.toMesh('xxStoreGlass',gm);}
SB.toMesh('xxStoreStone',stoneMat);PB.toMesh('xxStoreTrim',vcMat);RB.toMesh('xxStoreLouver',vcMat);
// 三個鼓（D1 在南端最大；D2、D3 在北端的露台上；D3 較高）
{const a=uv2g(D1[0],D1[1]),b=uv2g(D2[0],D2[1]),c=uv2g(D3[0],D3[1]);
 drum(a[0],a[1],23.5,H1,[9,9],4.4);
 drum(b[0],b[1],8.5,34,[5,4],2.2);
 drum(c[0],c[1],11.5,34,[5,5],2.8);
 // 兩個小鼓之間的玻璃採光罩（四角錐）
 const gp=uv2g(44,192),gl=newBatch();gl.cone(gp[0],27,gp[1],12,6,4,[0.36,0.55,0.6],1,0);gl.toMesh('xxStoreSkylight',vcMat);}
// 西側立面中央的招牌：藍色大字「遠東百貨」＋圓形標誌（透明底，貼在石牆上）
{const sg=uv2g(46,FV-0.2),sp=put(MB.CreatePlane('xxStoreSign',{width:26,height:5.2},scene),sg[0],14,sg[1],decalMat(signTexture(1024,200)));sp.rotation.y=BR+Math.PI/2;}   // 平面預設朝 −z；轉 +90° 後朝 −x，再加建築旋轉 → 朝向 −V（莊敬北路那一側）
// 廣場（粉灰色磚鋪面，貼著長立面與大鼓前）＋ 紅色抽象雕塑
{const bt=brickTex();bt.uScale=60/4;bt.vScale=90/4;const pc=uv2g(40,150),pg=put(MB.CreateGround('xxStorePlaza',{width:12,height:130},scene),pc[0],0.06,pc[1],unlitTex(bt));pg.rotation.y=BR;
 const red=M('#c8202a',{em:'#3a0508'}),sc=uv2g(-22,150),rr=rng(77);
 for(let i=0;i<8;i++){const h=5+rr()*5,c=put(MB.CreateCylinder('xxSculpt',{diameter:0.35,height:h,tessellation:8},scene),sc[0]+(rr()-0.5)*3,h/2,sc[1]+(rr()-0.5)*3,red);c.rotation.z=(rr()-0.5)*0.9;c.rotation.x=(rr()-0.5)*0.9;}
 put(MB.CreateBox('xxSculptBase',{width:6,height:0.5,depth:6}),sc[0],0.25,sc[1],M('#9b9482'));}

// ═════════ ⑩ 樹林（地圖上的綠地）═════════
// 紅框周圍原本就是茂密的樹林：西邊、北邊、南邊（光明六路對面）種滿闊葉樹；球場本體、道路、百貨公司範圍內不種；
// 東邊其他建築的位置（百貨公司以東、莊敬北路對面的住宅）這一版先留空。
{const rt=rng(31337),TB=new Map(),trunkC=[0.3,0.22,0.15];
 const hash=(ix,iz)=>{let h=Math.imul(ix,374761393)+Math.imul(iz,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296;};
 const vn=(x,z)=>{const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
   const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*ux+(c-a)*uz+(a-b-c+d)*ux*uz;};
 const tree=(b,x,z,sc,rnd)=>{const H=(9+rnd()*8)*sc,R=(4.2+rnd()*2.2)*sc,g=0.30+rnd()*0.2,c=[0.14+rnd()*0.1,g,0.12+rnd()*0.08],ph=rnd()*6.28;
   b.cone(x,0,z,0.55*sc,H*0.45,4,trunkC,1,ph);
   b.cone(x,H*0.42,z,R,H*0.32,8,c,1,ph);b.cone(x,H*0.42,z,R,H*0.26,8,[c[0]*0.72,c[1]*0.78,c[2]*0.8],-1,ph);       // 圓冠（上下兩個錐體）
   b.cone(x+(rnd()-0.5)*R*0.4,H*0.7,z+(rnd()-0.5)*R*0.4,R*0.62,H*0.22,7,[c[0]*1.15,c[1]*1.12,c[2]*1.1],1,ph+0.5);};
 // 以道路對齊座標判斷禁區：紅框（球場）、三條馬路、百貨公司，以及百貨公司以東（其他建築）
 const banned=(dU,dV)=>{const du=dU-TILT*dV;                                         // du：把南邊道路拉直之後的 U
   if(dU>-44&&dU<122&&dV>-50&&dV<138)return true;                                   // 紅框（含球場）
   if(du<-34&&du>-100)return true;                                                  // 莊敬一路＋光明六路＋之間的綠帶
   if(dV>128&&dV<162&&dU>-60)return true;                                           // 莊敬北路與人行道
   if(dV>=150&&dV<245&&dU>-40&&dU<115)return true;                                  // 百貨公司與廣場
   if(dV>=162&&du>-110)return true;                                                 // 莊敬北路以東（其他建築的位置，先留空）
   return false;};
 for(let gx=-320;gx<340;gx+=10)for(let gz=-300;gz<420;gz+=10){
   const x=gx+(rt()-0.5)*8,z=gz+(rt()-0.5)*8,a=g2uv(x,z);
   if(banned(a[0],a[1]))continue;
   const dens=0.35+0.65*vn(x*0.012+4,z*0.012-2);if(rt()>dens*0.9)continue;
   const key=Math.floor(x/150)+','+Math.floor(z/150);let b=TB.get(key);if(!b){b=newBatch();TB.set(key,b);}
   tree(b,x,z,0.8+rt()*0.55,rt);}
 // 行道樹：莊敬北路西側（紅框東緣）與莊敬一路北側，每 14 m 一棵
 const sb=newBatch();
 for(let dU=-30;dU<150;dU+=14){const p=uv2g(dU,133.5);tree(sb,p[0],p[1],0.7,rt);}
 for(let dV=-40;dV<130;dV+=14){const p=uv2g(edgeU(dV)-3.5,dV);tree(sb,p[0],p[1],0.65,rt);}
 TB.set('street',sb);
 TB.forEach((b,k)=>{const m=b.toMesh('xxTrees'+k,vcMat);if(m)m.freezeWorldMatrix();});}

// ═════════ ⑪ 休息區位置契約＋全壘打規則 ═════════
ctx.setDugouts({
  E:s=>lpt(s,DUG_R,DUG_FRONT-1.4),
  T:s=>lpt(s,DUG_R,FOUL_OFF-3.2),
  gate:(s,j,inside)=>lpt(s,DUG_R+j,inside?DUG_FRONT+2.4:DUG_FRONT-1.4),
  seat:(s,i)=>{const p=lpt(s,DUG_R-5+(i%9)*1.25,i%3===0?FOUL_OFF-1.2:(i%3===1?FOUL_OFF-3.0:FOUL_OFF-4.2));
    return {x:p.x,y:i%3===0?0.55:0,z:p.z,ry:s===-1?Math.PI/4:-Math.PI/4,scale:i%3===0?[0.82,0.72,0.82]:null};}
});
ctx.setRules({fenceR:101,fenceH:FENCE_TOP,arcDeg:45,simLimit:140,fenceAt});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).zhubei={id:'zhubei',name:'竹北球場（遠百旁）',build:build};
})();
