/*
 * 竹北球場（id: zhubei）——建在「國立臺灣大學竹北校區足球場」的位置（地圖紅框），旁邊是遠東百貨竹北店（遠百）。
 * 介面規格請參考 stadium-otsu.js（或 stadium-night.js）開頭的「球場外掛開發指南」。
 *
 *  真實位置與比例（依你給的衛星圖）
 *   · 比例尺：用圖中的標準足球場（105 × 68 m，圖上約 245 × 165 px）換算，約 0.425 m／px。
 *   · 紅框約 179 × 152 m，球場放在裡面：本壘板靠西南邊（莊敬一路／光明六路那一側），中外野朝北北東（方位 22°，
 *     也就是平行紅框的長邊），所以打者面向的是北邊的樹林。左右外野看台最遠 ±83 m，中外野看台後牆約 z=109 m，都收在紅框裡。
 *   · 地圖座標 → 球場座標的換算寫在 ③（px2g）；百貨公司、道路都是用地圖像素座標換算出來的，不是憑感覺放。
 *  遠東百貨竹北店（依照片）
 *   · 三個圓柱「鼓形」量體（地圖上的三個圓形屋頂）：最大那個直徑約 47 m，背後有一個比較高的小鼓、另一個小鼓；
 *     鼓身是淺褐色石材板＋橫向帶狀窗，每隔兩層有環繞的陽台欄杆；屋頂是低坡度的深灰藍金屬圓錐頂。
 *   · 底下是階梯狀退縮的米色石材基座（橫向石材帶＋帶狀窗），上層退縮的部分是斜向格柵立面；入口是深色玻璃雨庇；
 *     廣場上有一件紅色抽象雕塑；西側立面有「遠東百貨」招牌。
 *  球場風格（和百貨公司協調）
 *   · 同一組顏色：米色石材、淺褐、古銅色、深灰藍屋頂。看台後牆（也就是球場外牆）是橫向石材帶＋帶狀窗；
 *     本壘後方看台有深灰藍的屋頂雨棚；中外野記分板兩側各有一座「鼓形」塔樓（圓柱、環繞陽台、低坡圓錐頂），呼應百貨公司。
 *     記分板是深石板色底、古銅框、暖白字。
 *  其他
 *   · 道路：莊敬北路（紅框東側）、莊敬一路與光明六路（紅框南側）；周圍是茂密的樹林（地圖上的綠地）。
 *   · 其餘建築（東側的住宅大樓、其他圓形建築、運動場等）這一版先「不」生成。
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
    const uvW=(p,axis)=>uP?[(axis==='x'?p[0]:p[2])/uP,p[1]/vP]:null,cl=k=>[col[0]*k,col[1]*k,col[2]*k];
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
// 橫向石材帶＋帶狀窗（百貨公司立面與球場外牆共用）：一格＝8 m 寬 × 4 m 高（＝一層樓，64 px/m），可無縫橫向／縱向重複。
// 由下往上：石材窗台牆(0~1.2 m，橫向石縫)、帶狀玻璃窗(1.2~3.3 m，深色玻璃＋每 1.6 m 一根窗框)、古銅色橫梁(3.3~3.55)、女兒牆(3.55~4)。
// balcony=true：把橫梁換成陽台欄杆（橫欄＋垂直欄杆），用在鼓形量體。
function bandTex(name,wall,line,balcony,seed){
  const W=512,H=256,t=newTex(name,W,H),g=t.getContext(),rnd=rng(seed||7),P=64,Y=m=>H-m*P;
  g.fillStyle=wall;g.fillRect(0,0,W,H);for(let n=0;n<5000;n++){g.fillStyle=n%2?'rgba(255,255,255,0.08)':'rgba(70,50,30,0.07)';g.fillRect(rnd()*W,rnd()*H,1+rnd()*2,1);}
  const courses=(m0,m1,step)=>{g.strokeStyle=line;g.lineWidth=1.5;for(let m=m0;m<=m1+1e-6;m+=step){g.beginPath();g.moveTo(0,Y(m));g.lineTo(W,Y(m));g.stroke();}
    let k=0;for(let m=m0;m<m1-1e-6;m+=step,k++){g.lineWidth=1;for(let x=(k%2?0.5:0);x<8;x+=1.0){g.beginPath();g.moveTo(x*P,Y(m));g.lineTo(x*P,Y(m+step));g.stroke();}}};
  courses(0,1.2,0.4);                                                                                      // 石材窗台牆
  const gl=g.createLinearGradient(0,Y(3.3),0,Y(1.2));gl.addColorStop(0,'#6f8798');gl.addColorStop(0.35,'#2e3d4a');gl.addColorStop(1,'#1c2630');
  g.fillStyle=gl;g.fillRect(0,Y(3.3),W,2.1*P);                                                              // 帶狀玻璃窗
  g.fillStyle='rgba(255,255,255,0.10)';for(let x=0;x<8;x+=1.6){g.beginPath();g.moveTo(x*P+10,Y(1.2));g.lineTo(x*P+60,Y(3.3));g.lineTo(x*P+80,Y(3.3));g.lineTo(x*P+30,Y(1.2));g.closePath();g.fill();}   // 玻璃反光
  g.fillStyle='#4b3b2c';for(let x=0;x<8;x+=1.6)g.fillRect(x*P-2,Y(3.3),4,2.1*P);g.fillRect(0,Y(2.25),W,3);g.fillRect(0,Y(3.3),W,4);g.fillRect(0,Y(1.2)-3,W,4);   // 窗框
  g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(0,Y(3.3)+4,W,8);                                                // 窗上緣的陰影
  if(balcony){g.fillStyle=wall;g.fillRect(0,Y(4),W,0.7*P);g.fillStyle='#4b3b2c';g.fillRect(0,Y(3.62),W,5);g.fillRect(0,Y(3.3),W,6);
    g.fillStyle='rgba(60,45,30,0.9)';for(let x=0;x<8;x+=0.2)g.fillRect(x*P,Y(3.62),2,0.32*P);}                // 陽台欄杆
  else{g.fillStyle='#8c7550';g.fillRect(0,Y(3.55),W,0.25*P);g.fillStyle='rgba(0,0,0,0.18)';g.fillRect(0,Y(3.55)+0.25*P,W,6);courses(3.55,4,0.45);}   // 古銅色橫梁＋女兒牆
  t.update();return t;
}
// 斜向格柵立面（照片左側階梯狀量體上的菱形格網）：米色底、褐色斜線每 0.8 m 一格、橫向分層。
function latticeTex(){
  const W=512,H=256,t=newTex('xxLattice',W,H),g=t.getContext(),rnd=rng(15),P=64,Y=m=>H-m*P;
  g.fillStyle='#d1bf9a';g.fillRect(0,0,W,H);for(let n=0;n<4000;n++){g.fillStyle=n%2?'rgba(255,255,255,0.08)':'rgba(70,50,30,0.07)';g.fillRect(rnd()*W,rnd()*H,1+rnd()*2,1);}
  g.fillStyle='#a8957a';g.fillRect(0,Y(3.2),W,2.4*P);g.fillStyle='rgba(120,150,175,0.16)';g.fillRect(0,Y(3.2),W,2.4*P);       // 格柵後面的玻璃帷幕（偏亮的灰褐色）
  g.strokeStyle='#6a4f35';g.lineWidth=4;
  for(let k=-8;k<18;k++){g.beginPath();g.moveTo(k*0.8*P,Y(3.2));g.lineTo(k*0.8*P+2.4*P,Y(0.8));g.stroke();g.beginPath();g.moveTo(k*0.8*P,Y(0.8));g.lineTo(k*0.8*P+2.4*P,Y(3.2));g.stroke();}
  g.fillStyle='#c8b58a';g.fillRect(0,Y(4),W,0.8*P);g.fillRect(0,Y(0.8),W,0.8*P);g.fillStyle='#a08a62';g.fillRect(0,Y(4),W,0.12*P);g.fillRect(0,Y(0.8)-0.0,W,0.1*P);   // 上下的橫梁（米色）
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
function signTexture(txt,sub,w,h){const t=newTex('xxSign',w,h),g=t.getContext();g.fillStyle='#f3eee0';g.fillRect(0,0,w,h);g.fillStyle='#b01c26';g.fillRect(0,0,w,Math.round(h*0.12));
  g.fillStyle='#b01c26';g.textAlign='center';g.textBaseline='middle';g.font='bold '+Math.round(h*0.46)+'px "Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif';g.fillText(txt,w/2,h*0.52);
  if(sub){g.fillStyle='#6b5a46';g.font='bold '+Math.round(h*0.17)+'px "Noto Sans TC","Microsoft JhengHei",sans-serif';g.fillText(sub,w/2,h*0.86);}t.update();return t;}

// ═════════ ③ 地圖座標：像素 → 球場座標 ═════════
// 比例尺 0.425 m/px（標準足球場 105×68 m ≈ 245×165 px）；球場朝向方位 22°（北北東，平行紅框長邊）。
// px2g(u,v)：圖上 (u,v) 像素 → [x,z]（本壘板為原點，+z＝中外野方向＝北北東，+x＝右手邊＝東南東）。
// 圖上紅框四個角在球場座標約為 (-89,-36)、(89,-29)、(89,123)、(-89,113)：寬 178 m、深 150 m，下面所有東西都在這個框裡面或框外面對照著放。
const MAPS={s:0.425,cu:557,cv:368.75,a:22*Math.PI/180,hlat:-0.08,hlon:-42.78};
const px2g=(u,v)=>{const e=(u-MAPS.cu)*MAPS.s,n=-(v-MAPS.cv)*MAPS.s,a=MAPS.a;return [e*Math.cos(a)-n*Math.sin(a)-MAPS.hlat,e*Math.sin(a)+n*Math.cos(a)-MAPS.hlon];};
const BETA=Math.atan2(px2g(688,603)[1]-px2g(293,462)[1],px2g(688,603)[0]-px2g(293,462)[0]),SLOPE=Math.tan(BETA);   // 南邊道路相對 x 軸的傾斜（約 2°）

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
const stoneT=bandTex('xxStoneBand','#d3c19b','rgba(110,90,60,0.5)',false,3),stoneMat=unlitTex(stoneT);
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
  const backOff=gap+tiers*CROWD_STEP+0.3,bh=top0+tiers*CROWD_ROW+1.6,f=V4(0,0,L/8,bh/4);   // 後牆：UV 以公尺換算（8 m 寬、4 m 一層）
  const bw=put(MB.CreateBox('xxStandBack',{width:L,height:bh,depth:0.6,faceUV:[f,f,V4(0,0,0.05,0.05),V4(0,0,0.05,0.05),V4(0,0,0.05,0.05),V4(0,0,0.05,0.05)]}),mx+nx*backOff,bh/2,mz+nz*backOff,stoneMat);
  bw.rotation.y=ang;registerBallSolid(bw,'spectator');
  const cap=put(MB.CreateBox('xxStandCap',{width:L+0.2,height:0.35,depth:0.9}),mx+nx*backOff,bh+0.17,mz+nz*backOff,M('#8c7550'));cap.rotation.y=ang;   // 女兒牆壓頂（古銅色）
}
for(let i=0;i<3;i++)stand(OF[i][0],OF[i][1],OF[i+1][0],OF[i+1][1],5,1.8,4.6,1.2);

// 鼓形塔：圓柱（淺褐石材帶＋帶狀窗＋陽台欄杆）＋環繞的陽台＋深灰藍低坡圓錐頂，立在中外野記分板兩側。
const roofSlate=M('#4c5560'),bronze=M('#8c7550'),darkBronze=M('#4b3b2c');
const drumT=bandTex('xxDrumBand','#c9aa7e','rgba(100,76,48,0.5)',true,9),drumMat=unlitTex(drumT);
function drum(cx,cz,r,y0,h,coneH,balconyAt){
  const circ=TAU*r,fl=h/4,f=[V4(0,0,1,1),V4(0,0,circ/8,fl),V4(0,0,1,1)];
  const c=put(MB.CreateCylinder('xxDrum',{diameter:r*2,height:h,tessellation:48,faceUV:f}),cx,y0+h/2,cz,drumMat);
  (balconyAt||[]).forEach(y=>put(MB.CreateCylinder('xxDrumRing',{diameter:r*2+2.4,height:0.4,tessellation:48}),cx,y,cz,bronze));      // 環繞陽台板
  put(MB.CreateCylinder('xxDrumEave',{diameterTop:r*2+1.2,diameterBottom:r*2+3.0,height:0.9,tessellation:48}),cx,y0+h+0.3,cz,darkBronze);   // 屋簷
  put(MB.CreateCylinder('xxDrumRoof',{diameterTop:r*0.35,diameterBottom:r*2+2.6,height:coneH,tessellation:48}),cx,y0+h+0.75+coneH/2,cz,roofSlate);
  put(MB.CreateCylinder('xxDrumTip',{diameter:0.5,height:1.6,tessellation:8}),cx,y0+h+0.75+coneH+0.7,cz,bronze);
  return c;
}
[-1,1].forEach(s=>{const c=drum(s*37.7,110.3,7,0,16,3.4,[8]);ghostBox(s*37.7,8,110.3,14,16,14,0,'spectator');});

// 本壘後方看台＋深灰藍屋頂雨棚（懸臂式，只靠後面的古銅色柱子撐）
stand(-12,-20,12,-20,6,1.4,4.0,2);
{const RY=13.4,rz=-25.8;
 put(MB.CreateBox('xxHomeRoof',{width:52,height:0.5,depth:10.6}),0,RY,rz,roofSlate);
 put(MB.CreateBox('xxHomeFascia',{width:52.4,height:1.1,depth:0.5}),0,RY-0.1,-20.8,darkBronze);
 put(MB.CreateBox('xxHomeRoofUnder',{width:52,height:0.1,depth:10.6}),0,RY-0.31,rz,M('#2d3238'));
 for(const x of[-24,-12,0,12,24])put(MB.CreateBox('xxHomeCol',{width:0.7,height:RY,depth:0.7}),x,RY/2,-29.9,bronze);
 ghostBox(0,RY,rz,52,0.6,10.6,0,undefined);}

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

// ═════════ ⑧ 道路與草地（依地圖）═════════
// 莊敬北路（紅框東側，貼著紅框的右邊）、莊敬一路（紅框南邊）、光明六路東一段（再往南，雙向各 3 車道、中央綠帶）。
// 南邊兩條路的方向與紅框下緣平行（相對 x 軸約傾斜 SLOPE）。
const farT=grassTex.clone();farT.uScale=farT.vScale=3000/32;
put(MB.CreateGround('xxFarGround',{width:3000,height:3000},scene),0,-0.04,200,texMat(farT,0.86));
const WALK=newBatch(),zS=x=>SLOPE*x;
function walk(pts,width,y,col){   // 人行道／綠帶（純色）
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*width/2,nz=dx/l*width/2;
    WALK.quad([a[0]-nx,y,a[1]-nz],[a[0]+nx,y,a[1]+nz],[b[0]+nx,y,b[1]+nz],[b[0]-nx,y,b[1]-nz],[0,1,0],col);}}
const rd43=unlitTex(roadTexture(4,true)),rd2=unlitTex(roadTexture(2,true)),rd3=unlitTex(roadTexture(3,false));
const B4=newBatch(true),B2=newBatch(true),B3=newBatch(true);
{const stripTo=(b,pts,w,vPer,y)=>{   // 沿折線鋪一條路：u 橫跨路面、v 沿長度
   let len=0;for(let i=0;i<pts.length;i++){const p=pts[i],a=pts[Math.max(i-1,0)],c=pts[Math.min(i+1,pts.length-1)];if(i)len+=Math.hypot(p[0]-a[0],p[1]-a[1]);let tx=c[0]-a[0],tz=c[1]-a[1];const tl=Math.hypot(tx,tz);tx/=tl;tz/=tl;p.nx=-tz;p.nz=tx;p.len=len;}
   for(let i=0;i<pts.length-1;i++){const a=pts[i],c=pts[i+1],h=w/2;
     b.quad([a[0]-a.nx*h,y,a[1]-a.nz*h],[a[0]+a.nx*h,y,a[1]+a.nz*h],[c[0]+c.nx*h,y,c[1]+c.nz*h],[c[0]-c.nx*h,y,c[1]-c.nz*h],[0,1,0],[1,1,1],[0,a.len/vPer],[1,a.len/vPer],[1,c.len/vPer],[0,c.len/vPer]);}};
 const X0=-700,X1=700;
 // 莊敬北路：x≈99，寬 16 m，從南邊的莊敬一路北緣一路往北；兩側各 3 m 人行道
 const zs0=-40+zS(99)+5.5+0.5;
 stripTo(B4,[[99,zs0],[99,300],[99,700]],16,12,0.03);
 walk([[92.5,-26],[92.5,700]],3,0.05,[0.8,0.77,0.7]);walk([[108.5,-26],[108.5,700]],3,0.05,[0.8,0.77,0.7]);
 // 莊敬一路：雙向各 1 車道，寬 11 m，平行紅框南緣
 stripTo(B2,[[X0,-40+zS(X0)],[X1,-40+zS(X1)]],11,12,0.03);
 walk([[X0,-40+zS(X0)+7.2],[X1,-40+zS(X1)+7.2]],3,0.05,[0.8,0.77,0.7]);walk([[X0,-40+zS(X0)-7.2],[X1,-40+zS(X1)-7.2]],3,0.05,[0.8,0.77,0.7]);
 // 光明六路東一段：兩個單向車道（各 3 車道、寬 13.5 m），中間 7 m 綠帶
 stripTo(B3,[[X0,-70+zS(X0)+10.5],[X1,-70+zS(X1)+10.5]],13.5,12,0.03);
 stripTo(B3,[[X0,-70+zS(X0)-10.5],[X1,-70+zS(X1)-10.5]],13.5,12,0.03);
 walk([[X0,-70+zS(X0)],[X1,-70+zS(X1)]],7,0.06,[0.34,0.52,0.3]);
 walk([[X0,-70+zS(X0)+21],[X1,-70+zS(X1)+21]],5,0.05,[0.4,0.55,0.34]);    // 莊敬一路與光明六路之間的綠帶
}
B4.toMesh('xxRoadN',rd43);B2.toMesh('xxRoadLocal',rd2);B3.toMesh('xxRoadBlvd',rd3);WALK.toMesh('xxWalks',vcMat);

// ═════════ ⑨ 遠東百貨竹北店（依照片；位置依地圖三個圓形屋頂）═════════
// 地圖上三個圓形屋頂換算成球場座標：大鼓 D1≈(139,3.5) 直徑 47 m；中鼓 D2≈(122,70) 直徑 17 m；北鼓 D3≈(130,93) 直徑 23 m。
// 基座（5 層，高 20 m）＋ 上層退縮（再 2 層）＋ 最上層再退縮（再 2 層，斜向格柵）；三個鼓形量體從基座頂長出來，北邊那個最高（照片裡後面那個較高的鼓）。
const D1=px2g(820,590),D2=px2g(843,430),D3=px2g(880,388);
const stoneStore=unlitTex(bandTex('xxStoreStone','#d3c19b','rgba(110,90,60,0.5)',false,3)),latStore=unlitTex(latticeTex());
const SB=newBatch(true),LB=newBatch(true),PB=newBatch(),beige=[1,1,1];
const PX0=116,PX1=198,PZ0=-24,PZ1=104,ROOF1=20;
SB.box((PX0+PX1)/2,ROOF1/2,(PZ0+PZ1)/2,PX1-PX0,ROOF1,PZ1-PZ0,0,beige,{uP:8,vP:4});                                    // 基座（石材帶＋帶狀窗）
LB.box(162,ROOF1+4,41,72,8,114,0,beige,{uP:8,vP:4});                                                                       // 上層退縮：斜向格柵
LB.box(174,ROOF1+12,62,48,8,68,0,beige,{uP:8,vP:4});                                                                       // 再退縮
const cop=[0.42,0.33,0.24];                                                                                                // 古銅色壓頂與屋頂女兒牆
PB.box((PX0+PX1)/2,ROOF1+0.4,PZ0+0.3,PX1-PX0+0.6,0.8,0.6,0,cop);PB.box((PX0+PX1)/2,ROOF1+0.4,PZ1-0.3,PX1-PX0+0.6,0.8,0.6,0,cop);
PB.box(PX0+0.3,ROOF1+0.4,(PZ0+PZ1)/2,0.6,0.8,PZ1-PZ0,0,cop);PB.box(PX1-0.3,ROOF1+0.4,(PZ0+PZ1)/2,0.6,0.8,PZ1-PZ0,0,cop);
for(const [bx,by,bz,bw,bd] of[[162,ROOF1+8.2,41,72.6,114.6],[174,ROOF1+16.2,62,48.6,68.6]]){PB.box(bx,by,bz-bd/2+0.3,bw,0.8,0.6,0,cop);PB.box(bx,by,bz+bd/2-0.3,bw,0.8,0.6,0,cop);PB.box(bx-bw/2+0.3,by,bz,0.6,0.8,bd,0,cop);PB.box(bx+bw/2-0.3,by,bz,0.6,0.8,bd,0,cop);}
SB.toMesh('xxStoreBase',stoneStore);LB.toMesh('xxStoreUpper',latStore);PB.toMesh('xxStoreCoping',vcMat);
drum(D1[0],D1[1],23.5,ROOF1,24,4.6,[ROOF1+6,ROOF1+14]);           // 大鼓（正面那個，直徑 47 m）
drum(D2[0],D2[1],8.5,ROOF1,20,3.4,[ROOF1+8]);                     // 中鼓
drum(D3[0],D3[1],11.5,ROOF1,32,4.2,[ROOF1+8,ROOF1+20]);           // 北鼓（最高）
// 入口：深色玻璃＋古銅色雨庇（西側立面、大鼓南側）
{const gT=glassTex(),gm=unlitTex(gT),ez=D1[1]-4,f=V4(0,0,1.5,1);
 put(MB.CreateBox('xxStoreGlass',{width:7,height:8.5,depth:24,faceUV:[f,f,f,f,f,f]}),PX0-2.5,4.3,ez,gm);
 put(MB.CreateBox('xxStoreAwning',{width:13,height:0.5,depth:28}),PX0-5.5,9,ez,bronze);
 for(const dz of[-13,13])put(MB.CreateCylinder('xxStoreColumn',{diameter:0.7,height:9,tessellation:12}),PX0-11,4.5,ez+dz,bronze);}
// 招牌（西側立面）：遠東百貨
{const sm=unlitTex(signTexture('遠東百貨','FAR EASTERN DEPARTMENT STORES',1024,256)),sp=put(MB.CreatePlane('xxStoreSign',{width:20,height:5},scene),PX0-0.15,ROOF1-5,D3[1]-18,sm);sp.rotation.y=Math.PI/2;}
// 廣場＋紅色抽象雕塑
{const pt=plazaTexture();pt.uScale=40/4;pt.vScale=70/4;const pm=unlitTex(pt);
 put(MB.CreateGround('xxStorePlaza',{width:40,height:70},scene),PX0-14,0.06,D1[1]+5,pm);
 const red=M('#c8202a',{em:'#3a0508'}),sc=[D1[0]-36,D1[1]+24],rr=rng(77);
 for(let i=0;i<8;i++){const h=5+rr()*5,c=put(MB.CreateCylinder('xxSculpt',{diameter:0.35,height:h,tessellation:8},scene),sc[0]+(rr()-0.5)*3,h/2,sc[1]+(rr()-0.5)*3,red);c.rotation.z=(rr()-0.5)*0.9;c.rotation.x=(rr()-0.5)*0.9;}
 put(MB.CreateBox('xxSculptBase',{width:6,height:0.5,depth:6}),sc[0],0.25,sc[1],M('#9b9482'));}

// ═════════ ⑩ 樹林（地圖上的綠地）═════════
// 紅框周圍原本就是茂密的樹林：西邊、北邊、南邊（光明六路對面）種滿闊葉樹；球場本體、道路、百貨公司範圍內不種；
// 東邊其他建築的位置（百貨公司以東、莊敬北路對面的住宅）這一版先留空。
{const rt=rng(31337),TB=new Map(),trunkC=[0.3,0.22,0.15];
 const hash=(ix,iz)=>{let h=Math.imul(ix,374761393)+Math.imul(iz,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296;};
 const vn=(x,z)=>{const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
   const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*ux+(c-a)*uz+(a-b-c+d)*ux*uz;};
 const inStadium=(x,z)=>x>-96&&x<94&&z>-44&&z<130;                                  // 球場（紅框）
 const onRoad=(x,z)=>{const nz=-40+SLOPE*x;return(z>nz-52&&z<nz+8)||(x>86&&x<116&&z>nz);};   // 莊敬一路、光明六路、莊敬北路（含人行道與綠帶）
 const inStore=(x,z)=>x>104&&x<215&&z>-40&&z<120;                                   // 百貨公司與廣場
 const tree=(b,x,z,sc,rnd)=>{const H=(9+rnd()*8)*sc,R=(4.2+rnd()*2.2)*sc,g=0.30+rnd()*0.2,c=[0.14+rnd()*0.1,g,0.12+rnd()*0.08],ph=rnd()*6.28;
   b.cone(x,0,z,0.55*sc,H*0.45,4,trunkC,1,ph);
   b.cone(x,H*0.42,z,R,H*0.32,8,c,1,ph);b.cone(x,H*0.42,z,R,H*0.26,8,[c[0]*0.72,c[1]*0.78,c[2]*0.8],-1,ph);       // 圓冠（上下兩個錐體）
   b.cone(x+(rnd()-0.5)*R*0.4,H*0.7,z+(rnd()-0.5)*R*0.4,R*0.62,H*0.22,7,[c[0]*1.15,c[1]*1.12,c[2]*1.1],1,ph+0.5);};
 for(let gx=-300;gx<340;gx+=10)for(let gz=-260;gz<430;gz+=10){
   const x=gx+(rt()-0.5)*8,z=gz+(rt()-0.5)*8;
   if(inStadium(x,z)||onRoad(x,z)||inStore(x,z))continue;
   if(x>116&&z>-120&&z<430)continue;                                              // 百貨公司以東：其他建築的位置，先留空
   const dens=0.15+0.85*vn(x*0.012+4,z*0.012-2);if(rt()>dens*0.95)continue;
   const key=Math.floor(x/150)+','+Math.floor(z/150);let b=TB.get(key);if(!b){b=newBatch();TB.set(key,b);}
   tree(b,x,z,0.8+rt()*0.55,rt);}
 // 行道樹：莊敬北路西側（紅框東緣）與莊敬一路北側，每 14 m 一棵
 const sb=newBatch();for(let z=-20;z<260;z+=14)tree(sb,88.2,z,0.7,rt);for(let x=-85;x<86;x+=14)tree(sb,x,-40+SLOPE*x+9,0.65,rt);
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
