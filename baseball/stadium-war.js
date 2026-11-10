/*
 * 戰爭球場（id: war）— 被轟炸過的廢墟球場：沒有觀眾，只剩殘破的看台；場地沒有草，只有冒煙的焦土；場外是被炸毀、仍在冒煙的城市。
 * 介面規格請參考 stadium-otsu.js（或 stadium-night.js）開頭的「球場外掛開發指南」。
 *
 *  場地
 *   · 外野與內野都沒有草：外野是焦黑的土地（灰燼、燒焦的草根、龜裂、裂縫裡有微弱的餘燼），內野是灰黑色的焦土；
 *     場上散布彈坑（只是貼在地上的貼圖，不影響跑壘）與碎石，幾個彈坑／裂縫在冒煙。
 *  外野牆（三段直線，與乙子園同規格；fenceAt／fenceR 與牆吻合）
 *   · 兩翼 98 m、中外野 101 m；牆面是被煙燻黑、滿是彈孔與裂痕的混凝土，牆腳堆著碎石、鋼筋從裂口戳出來。
 *  看台
 *   · 沒有觀眾。看台的位置與階數和乙子園相同，但被炸得殘破：有些區塊整段垮成瓦礫堆、有些只剩下面幾階、有些階板歪斜下陷，
 *     鋼筋外露，座椅只剩零星燒焦的幾張；後牆也缺角。看台仍有碰撞（垮掉的地方用瓦礫堆當體積）。
 *  球員休息區、記分板
 *   · 休息區的棚頂塌了一半、長椅燒黑；記分板歪掛在斷了一根的立柱上，面板裂開、只有琥珀色的 LED 還亮著（仍能顯示比賽狀態）。
 *  球場外
 *   · 被轟炸後的城市：街道上有彈坑、燒毀的汽車與碎石；街廓裡是半倒的大樓、只剩外殼的建築和瓦礫堆；
 *     到處有黑煙柱和火光（粒子特效），遠處也有幾道大煙柱。
 *  空襲（每隔隨機分鐘）
 *   · 球場上空會隨機發生兩種事件之一（80% 無人機、20% 導彈）：(1) 一小群（6~10 架）「沙西德」型三角翼自殺無人機飛過，球場四周看台上的機槍陣地對空掃射（曳光彈），
 *     打爆其中一部分（空中爆炸、殘骸冒煙墜落、落地爆炸）；(2) 幾枚巡航導彈拖著火焰和長長的煙跡飛過，有些最後俯衝落進城裡爆炸。
 *     第一次大約在載入後 25~60 秒，之後每隔 1~4 分鐘隨機發生。為了從打擊／守備視角看得到，飛行器的尺寸比實物放大。
 *  本檔「不」設定天空／霧／光源——那些由主程式的天氣系統決定。沒有觀眾，所以不提供 cheerSlots。
 * 閱讀順序：①共用工具 ②貼圖 ③地面與外野牆 ④殘破看台 ⑤界外牆與休息區 ⑥記分板 ⑦場地彈坑與碎石 ⑧外圍廢墟城市
 *           ⑨煙與火 ⑩機槍陣地與空襲事件 ⑪登錄規則
 */
(function(){
'use strict';
function build(ctx){
const {BABYLON,scene,MB,M,C,put,texMat,lpt,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const SQ=Math.SQRT1_2,TAU=Math.PI*2;

// ═════════ ① 共用工具 ═════════
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const V3=(x,y,z)=>new BABYLON.Vector3(x,y,z);
const tile=(S,x,y,m,fn)=>{if(x>m&&x<S-m&&y>m&&y<S-m)return fn(0,0);for(const dx of[-S,0,S])for(const dy of[-S,0,S])fn(dx,dy);};
const newTex=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const fillNoise=(g,S,rnd,r,gr,b,amp)=>{const img=g.createImageData(S,S),d=img.data;for(let i=0;i<S*S;i++){const k=1-amp+rnd()*2*amp;d[i*4]=r*k;d[i*4+1]=gr*k;d[i*4+2]=b*k;d[i*4+3]=255;}g.putImageData(img,0,0);};
const hexRGB=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const mulC=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
const unlit=(hex)=>{const m=M('#000000',{em:hex||'#ffffff'});m.disableLighting=true;m.backFaceCulling=false;return m;};   // 不受光：顏色＝自發光色×頂點色

// 兩點之間的一段牆（一個長方盒；碰撞準、只佔一個碰撞物件）。ext＝兩端各多延伸的長度
function wallSeg(ax,az,bx,bz,h,th,mat,fence,outfield,capMat,ext){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2;
  const b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th}),cx,h/2,cz,mat);b.rotation.y=ang;
  if(fence)registerFenceCollider(b,!!outfield);
  if(capMat){const c=put(MB.CreateBox('xxCap',{width:len+0.1,height:0.2,depth:th+0.24}),cx,h+0.1,cz,capMat);c.rotation.y=ang;if(fence)registerFenceCollider(c,!!outfield);}
  return b;
}
// 看不見、只供球碰撞的方盒
function ghostBox(cx,cy,cz,w,h,d,ang,kind){const b=put(MB.CreateBox('xxHit',{width:w,height:h,depth:d}),cx,cy,cz,null);b.rotation.y=ang;b.isVisible=false;registerBallSolid(b,kind);return b;}

// 把成千上百個方盒／錐體合併成「一個 mesh」（頂點色＋平面法線，可選 UV）：看台、廢墟、碎石都用它，避免上千個 draw call。
// box 的旋轉順序與 mesh.rotation 相同（Babylon：先 z、再 x、最後 y）。uP/vP＝UV 以「世界座標」每 uP／vP 公尺重複一次（只給沒有旋轉的盒子用）。
function newBatch(withUV){
  const P=[],N=[],K=[],I=[],T=withUV?[]:null;
  const vtx=(p,n,c,t)=>{P.push(p[0],p[1],p[2]);N.push(n[0],n[1],n[2]);K.push(c[0],c[1],c[2],1);if(T)T.push(t?t[0]:0,t?t[1]:0);};
  const tri=(a,b,c,n,col)=>{const i=P.length/3;vtx(a,n,col);vtx(b,n,col);vtx(c,n,col);I.push(i,i+1,i+2);};
  const quad=(a,b,c,d,n,col,ta,tb,tc,td)=>{const i=P.length/3;vtx(a,n,col,ta);vtx(b,n,col,tb);vtx(c,n,col,tc);vtx(d,n,col,td);I.push(i,i+1,i+2,i,i+2,i+3);};
  const rot=(x,y,z,ry,rx,rz)=>{if(rz){const c=Math.cos(rz),s=Math.sin(rz),nx=x*c-y*s,ny=x*s+y*c;x=nx;y=ny;}
    if(rx){const c=Math.cos(rx),s=Math.sin(rx),ny=y*c-z*s,nz=y*s+z*c;y=ny;z=nz;}
    if(ry){const c=Math.cos(ry),s=Math.sin(ry),nx=x*c+z*s,nz=-x*s+z*c;x=nx;z=nz;}return [x,y,z];};
  function box(cx,cy,cz,w,h,d,ry,col,o){o=o||{};const X=w/2,Y=h/2,Z=d/2,rx=o.rx||0,rz=o.rz||0,uP=o.uP,vP=o.vP;ry=ry||0;
    const W=(x,y,z)=>{const r=rot(x,y,z,ry,rx,rz);return [cx+r[0],cy+r[1],cz+r[2]];},R=(x,y,z)=>rot(x,y,z,ry,rx,rz);
    const tv=(p)=>uP?[0,0]:null;   // 佔位
    const uvW=(p,axis)=>uP?[(axis==='x'?p[0]:p[2])/uP,p[1]/vP]:null;   // 世界座標 UV
    const a=W(-X,Y,-Z),b=W(X,Y,-Z),c=W(X,Y,Z),d2=W(-X,Y,Z);
    quad(a,b,c,d2,R(0,1,0),col);
    if(o.bottom)quad(W(-X,-Y,-Z),W(-X,-Y,Z),W(X,-Y,Z),W(X,-Y,-Z),R(0,-1,0),col);   // 底面幾乎看不到，預設省略
    let q;
    q=[W(X,-Y,-Z),W(X,-Y,Z),W(X,Y,Z),W(X,Y,-Z)];quad(q[0],q[1],q[2],q[3],R(1,0,0),col,uvW(q[0],'z'),uvW(q[1],'z'),uvW(q[2],'z'),uvW(q[3],'z'));
    q=[W(-X,-Y,Z),W(-X,-Y,-Z),W(-X,Y,-Z),W(-X,Y,Z)];quad(q[0],q[1],q[2],q[3],R(-1,0,0),col,uvW(q[0],'z'),uvW(q[1],'z'),uvW(q[2],'z'),uvW(q[3],'z'));
    q=[W(-X,-Y,Z),W(-X,Y,Z),W(X,Y,Z),W(X,-Y,Z)];quad(q[0],q[1],q[2],q[3],R(0,0,1),col,uvW(q[0],'x'),uvW(q[1],'x'),uvW(q[2],'x'),uvW(q[3],'x'));
    q=[W(X,-Y,-Z),W(X,Y,-Z),W(-X,Y,-Z),W(-X,-Y,-Z)];quad(q[0],q[1],q[2],q[3],R(0,0,-1),col,uvW(q[0],'x'),uvW(q[1],'x'),uvW(q[2],'x'),uvW(q[3],'x'));}
  // 錐體（只有側面）：底在 y0、半徑 r、高 h；dir=1 尖端朝上、-1 朝下
  function cone(cx,y0,cz,r,h,sides,col,dir,ph){dir=dir||1;ph=ph||0;const ap=[cx,y0+dir*h,cz],k=r/h,nl=Math.hypot(1,k);
    for(let i=0;i<sides;i++){const a0=ph+i/sides*TAU,a1=ph+(i+1)/sides*TAU,am=(a0+a1)/2;
      tri(ap,[cx+r*Math.cos(a0),y0,cz+r*Math.sin(a0)],[cx+r*Math.cos(a1),y0,cz+r*Math.sin(a1)],[Math.cos(am)/nl,dir*k/nl,Math.sin(am)/nl],col);}}
  function toMesh(name,mat){if(!P.length)return null;const m=new BABYLON.Mesh(name,scene),vd=new BABYLON.VertexData();
    vd.positions=P;vd.normals=N;vd.colors=K;vd.indices=I;if(T)vd.uvs=T;vd.applyToMesh(m);m.material=mat;m.isPickable=false;return m;}
  return {tri,quad,box,cone,toMesh,count:()=>P.length/3};
}
const vcMat=M('#ffffff',{em:'#4a4a4a'});vcMat.backFaceCulling=false;vcMat.specularColor=C(0,0,0);   // 吃頂點色的共用材質（有一點自發光，夜裡也看得到輪廓）

// 瓦礫堆：隨機旋轉的混凝土塊、磚塊與外露鋼筋。r＝半徑、hMax＝最高高度
function rubble(b,cx,cz,r,hMax,rnd,y0,tone,lite){y0=y0||0;tone=tone||1;
  const n=lite?Math.max(3,Math.round(r*1.2+hMax*0.8)):Math.max(4,Math.round(r*r*0.9+hMax*3));   // lite＝城市用的輕量版（遠處看不出細節）
  for(let i=0;i<n;i++){const a=rnd()*TAU,d=Math.sqrt(rnd())*r,hh=hMax*(1-d/r)*(0.4+rnd()*0.7),s=0.35+rnd()*Math.min(1.5,0.5+r*0.15);
    const k=(0.28+rnd()*0.3)*tone,col=rnd()<0.2?[0.42*tone,0.22*tone,0.16*tone]:[k*1.02,k,k*0.94];
    b.box(cx+Math.cos(a)*d,y0+hh*0.5+s*0.2,cz+Math.sin(a)*d,s*(0.8+rnd()),s*(0.5+rnd()*0.7),s*(0.8+rnd()),rnd()*TAU,col,{rx:(rnd()-0.5)*1.1,rz:(rnd()-0.5)*1.1});}
  for(let i=0;i<(lite?1:Math.round(2+r*0.7));i++){const a=rnd()*TAU,d=rnd()*r*0.8,hh=0.8+rnd()*1.8;   // 鋼筋
    b.box(cx+Math.cos(a)*d,y0+hh*0.5+hMax*0.3,cz+Math.sin(a)*d,0.05,hh,0.05,0,[0.28,0.14,0.08],{rx:(rnd()-0.5)*0.8,rz:(rnd()-0.5)*0.8});}
}

// ═════════ ② 貼圖：焦土、灰燼、混凝土牆、彈坑、煙 ═════════
// 焦土（外野）：深褐近黑的底、煤灰斑、燒焦的草根、龜裂＋裂縫裡微弱的餘燼。1024px 貼圖鋪 32 m。
function scorchedGroundTex(){
  const S=1024,t=newTex('xxScorch',S,S),g=t.getContext(),rnd=rng(11);
  fillNoise(g,S,rnd,44,37,32,0.22);
  for(let n=0;n<260;n++){const x=rnd()*S,y=rnd()*S,r=22+rnd()*90,k=rnd();
    const col=k<0.45?'rgba(8,6,5,0.20)':k<0.8?'rgba(120,114,104,0.12)':'rgba(70,50,36,0.12)';   // 煤灰斑、灰燼、紅褐焦土
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=col;g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  const blade=['rgba(14,12,10,0.55)','rgba(40,34,26,0.55)','rgba(58,52,34,0.45)','rgba(24,28,16,0.5)'];   // 燒焦的草根
  for(let n=0;n<9000;n++){const x=rnd()*S,y=rnd()*S,len=3+rnd()*6,a=-1.57+(rnd()-0.5)*1.5;
    tile(S,x,y,10,(dx,dy)=>{g.strokeStyle=blade[(rnd()*blade.length)|0];g.lineWidth=0.7+rnd()*0.8;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*len,y+dy+Math.sin(a)*len);g.stroke();});}
  for(let n=0;n<46;n++){let x=rnd()*S,y=rnd()*S,a=rnd()*TAU;const glow=rnd()<0.3,pts=[[x,y]];   // 龜裂（30% 裂縫裡有餘燼）
    for(let k=0;k<9;k++){a+=(rnd()-0.5)*1.1;x+=Math.cos(a)*(14+rnd()*22);y+=Math.sin(a)*(14+rnd()*22);pts.push([x,y]);}
    tile(S,pts[0][0],pts[0][1],260,(dx,dy)=>{g.strokeStyle='rgba(6,5,4,0.8)';g.lineWidth=2.2;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]+dx,p[1]+dy):g.moveTo(p[0]+dx,p[1]+dy));g.stroke();
      if(glow){g.strokeStyle='rgba(255,106,28,0.45)';g.lineWidth=0.9;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]+dx,p[1]+dy):g.moveTo(p[0]+dx,p[1]+dy));g.stroke();}});}
  for(let n=0;n<700;n++){const x=rnd()*S,y=rnd()*S;tile(S,x,y,5,(dx,dy)=>{g.fillStyle=n%3?'rgba(120,112,100,0.55)':'rgba(10,8,7,0.7)';g.fillRect(x+dx,y+dy,1+rnd()*3,1+rnd()*2);});}   // 碎石、焦渣
  t.update();return t;
}
// 內野焦土：比外野更灰更碎（被炮火翻過），512px 鋪 10 m。
function scorchedDirtTex(){
  const S=512,t=newTex('xxScorchDirt',S,S),g=t.getContext(),rnd=rng(23);
  fillNoise(g,S,rnd,52,46,41,0.2);
  for(let n=0;n<120;n++){const x=rnd()*S,y=rnd()*S,r=12+rnd()*46,k=rnd();
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=k<0.5?'rgba(6,5,4,0.22)':'rgba(150,144,134,0.10)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  for(let n=0;n<700;n++){const x=rnd()*S,y=rnd()*S,rx=1.5+rnd()*4,ry=rx*(0.6+rnd()*0.5),rot=rnd()*3.14;
    tile(S,x,y,8,(dx,dy)=>{g.fillStyle='rgba(14,11,9,0.55)';g.beginPath();g.ellipse(x+dx,y+dy,rx,ry,rot,0,TAU);g.fill();g.fillStyle='rgba(120,112,100,0.30)';g.beginPath();g.ellipse(x+dx-0.7,y+dy-0.7,rx*0.5,ry*0.5,rot,0,TAU);g.fill();});}
  for(let n=0;n<26;n++){let x=rnd()*S,y=rnd()*S,a=rnd()*TAU;const glow=rnd()<0.25,pts=[[x,y]];
    for(let k=0;k<6;k++){a+=(rnd()-0.5)*1.2;x+=Math.cos(a)*(10+rnd()*16);y+=Math.sin(a)*(10+rnd()*16);pts.push([x,y]);}
    tile(S,pts[0][0],pts[0][1],130,(dx,dy)=>{g.strokeStyle='rgba(5,4,3,0.8)';g.lineWidth=1.8;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]+dx,p[1]+dy):g.moveTo(p[0]+dx,p[1]+dy));g.stroke();
      if(glow){g.strokeStyle='rgba(255,100,26,0.5)';g.lineWidth=0.8;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]+dx,p[1]+dy):g.moveTo(p[0]+dx,p[1]+dy));g.stroke();}});}
  for(let n=0;n<360;n++){const x=rnd()*S,y=rnd()*S;tile(S,x,y,4,(dx,dy)=>{g.fillStyle=n%2?'rgba(150,140,126,0.7)':'rgba(24,20,17,0.8)';g.fillRect(x+dx,y+dy,1+rnd()*2,1+rnd()*1.5);});}
  t.update();return t;
}
// 牆面：被煙燻黑、滿是彈孔與裂痕的混凝土（外野牆、界外牆共用）；len＝這段牆的長度(m)，用 uScale 讓細節大小一致
function ruinWallMat(len,seed){
  const t=newTex('xxRuinWall',1024,128),g=t.getContext(),rnd=rng(seed||5);
  fillNoise(g,128,rnd,104,99,92,0.14);
  const img=g.getImageData(0,0,128,128);for(let i=0;i<8;i++)g.putImageData(img,i*128,0);   // 先填一格噪點再橫向複製（避免 fillNoise 只吃方形）
  for(let n=0;n<70;n++){const x=rnd()*1024,w=6+rnd()*26;const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(6,5,4,0.7)');gr.addColorStop(1,'rgba(6,5,4,0.05)');g.fillStyle=gr;g.fillRect(x,0,w,40+rnd()*88);}   // 煙燻的垂直汙痕
  for(let n=0;n<5;n++){const x=rnd()*1000,y=30+rnd()*60,w=40+rnd()*50,h=24+rnd()*24;g.fillStyle='#7c3f2c';g.fillRect(x,y,w,h);g.strokeStyle='rgba(30,20,16,0.7)';g.lineWidth=1;for(let yy=y;yy<y+h;yy+=6){g.beginPath();g.moveTo(x,yy);g.lineTo(x+w,yy);g.stroke();}}   // 外露的磚牆
  for(let n=0;n<16;n++){const x=rnd()*1024,y=10+rnd()*108,r=2+rnd()*3.5;g.fillStyle='rgba(8,6,5,0.9)';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.strokeStyle='rgba(180,174,164,0.5)';g.lineWidth=1;g.beginPath();g.arc(x,y,r+1.8,0,TAU);g.stroke();for(let k=0;k<5;k++){const a=rnd()*TAU;g.strokeStyle='rgba(10,8,6,0.6)';g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*(8+rnd()*12),y+Math.sin(a)*(8+rnd()*12));g.stroke();}}   // 彈孔
  for(let n=0;n<22;n++){let x=rnd()*1024,y=rnd()*128;g.strokeStyle='rgba(8,6,5,0.75)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){x+=(rnd()-0.5)*24;y+=6+rnd()*14;g.lineTo(x,y);}g.stroke();}   // 裂痕
  g.fillStyle='rgba(205,200,188,0.35)';g.fillRect(0,18,1024,4);                                   // 殘留的白漆線
  t.uScale=Math.max(1,len/8);t.update();return texMat(t,0.95);
}
// 彈坑貼圖（透明底）：焦黑的中心、灰燼的外環、放射狀的煤煙痕
function craterTex(seed){
  const S=256,t=newTex('xxCrater',S,S),g=t.getContext(),rnd=rng(seed||3);
  const gr=g.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(8,7,6,0.96)');gr.addColorStop(0.32,'rgba(16,14,12,0.9)');gr.addColorStop(0.55,'rgba(52,47,42,0.66)');gr.addColorStop(0.8,'rgba(92,86,78,0.26)');gr.addColorStop(1,'rgba(92,86,78,0)');
  g.fillStyle=gr;g.fillRect(0,0,S,S);
  for(let n=0;n<46;n++){const a=rnd()*TAU,r0=30+rnd()*20,r1=60+rnd()*66;g.strokeStyle='rgba(8,6,5,'+(0.15+rnd()*0.3)+')';g.lineWidth=1+rnd()*2.5;g.beginPath();g.moveTo(128+Math.cos(a)*r0,128+Math.sin(a)*r0);g.lineTo(128+Math.cos(a)*r1,128+Math.sin(a)*r1);g.stroke();}
  g.strokeStyle='rgba(130,122,110,0.32)';g.lineWidth=5;g.beginPath();g.arc(128,128,66,0,TAU);g.stroke();
  for(let n=0;n<60;n++){const a=rnd()*TAU,r=60+rnd()*58;g.fillStyle=n%2?'rgba(120,112,100,0.6)':'rgba(10,8,7,0.7)';g.fillRect(128+Math.cos(a)*r,128+Math.sin(a)*r,2+rnd()*3,2+rnd()*2);}
  t.hasAlpha=true;t.update();return t;
}
function decalMat(tex){const m=M('#000000');m.emissiveTexture=tex;m.opacityTexture=tex;m.disableLighting=true;m.backFaceCulling=false;return m;}
// 粒子用的柔邊圓點
const puffTex=(()=>{const t=newTex('xxPuff',128,128),g=t.getContext(),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,0.95)');gr.addColorStop(0.35,'rgba(255,255,255,0.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);t.hasAlpha=true;t.update();return t;})();
// 城市建築立面：每格 12 m 寬 × 10.8 m 高（4 扇窗 × 3 層）；窗洞全是黑的、有些窗在燒（橘色）、窗邊有煤煙，頂點色再染成不同的牆色
function facadeTex(){
  const S=256,t=newTex('xxRuinFacade',S,S),g=t.getContext(),rnd=rng(61);
  fillNoise(g,S,rnd,214,208,198,0.08);
  for(let n=0;n<30;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*34;g.fillStyle='rgba(30,26,22,0.10)';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
  for(let fy=0;fy<3;fy++)for(let fx=0;fx<4;fx++){const x=fx*64+12,y=fy*85.3+16,w=40,h=52,k=rnd();
    g.fillStyle=k<0.12?'#d8641c':k<0.2?'#5a2a12':'#0b0a09';g.fillRect(x,y,w,h);                      // 黑洞、燒著的窗、半燒的窗
    if(k<0.12){const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#ffd24a');gr.addColorStop(1,'#d8421c');g.fillStyle=gr;g.fillRect(x+3,y+10,w-6,h-12);}
    const sg=g.createLinearGradient(0,y-4,0,y-40);sg.addColorStop(0,'rgba(6,5,4,0.7)');sg.addColorStop(1,'rgba(6,5,4,0)');g.fillStyle=sg;g.fillRect(x-3,y-40,w+6,40);   // 窗上緣的煤煙
    g.strokeStyle='rgba(60,54,48,0.9)';g.lineWidth=2;g.strokeRect(x,y,w,h);}
  for(let n=0;n<10;n++){let x=rnd()*S,y=rnd()*S;g.strokeStyle='rgba(20,16,12,0.5)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-0.5)*18;y+=8+rnd()*14;g.lineTo(x,y);}g.stroke();}
  t.update();return t;
}
function roadTex(){
  const S=256,t=newTex('xxRuinRoad',S,S),g=t.getContext(),rnd=rng(91);
  fillNoise(g,S,rnd,42,41,42,0.16);
  g.fillStyle='rgba(206,200,180,0.65)';for(let y=0;y<S;y+=64)g.fillRect(S/2-3,y,6,30);                      // 殘留的中線
  for(let n=0;n<14;n++){let x=rnd()*S,y=rnd()*S;g.strokeStyle='rgba(5,5,5,0.8)';g.lineWidth=1.6;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){x+=(rnd()-0.5)*40;y+=(rnd()-0.5)*40;g.lineTo(x,y);}g.stroke();}
  for(let n=0;n<500;n++){const x=rnd()*S,y=rnd()*S;g.fillStyle=n%2?'rgba(130,124,112,0.55)':'rgba(8,8,8,0.6)';g.fillRect(x,y,1+rnd()*3,1+rnd()*2);}
  t.update();return t;
}

// ═════════ ③ 地面與外野牆（三段直線，與乙子園同規格）═════════
const groundTex=scorchedGroundTex(),dirtTex=scorchedDirtTex();
ctx.makeGround(texMat(groundTex,1));                                   // 外野：焦黑的土地，沒有草
// infield:false＝隱藏共用的內野草皮菱形，整個內野（半徑 27 m 的圓）都是焦土。需要主程式 ctx.apiVersion>=2；舊版就改把菱形貼上焦土貼圖。
const dirtMats={dirt:texMat(dirtTex,1),home:texMat(dirtTex,0.9),mound:texMat(dirtTex,1.1)};
if((ctx.apiVersion||1)>=2)dirtMats.infield=false;
else{const t2=dirtTex.clone();t2.uScale=t2.vScale=ctx.GRASS_TILE/ctx.DIRT_TILE;dirtMats.infield=texMat(t2,1);}
ctx.setFieldMats(dirtMats);

const POLE=98,POLE_X=POLE*SQ;
const OF=[[-POLE_X,POLE_X],[-34,101],[34,101],[POLE_X,POLE_X]];        // 左極柱 → 左中間角 → 右中間角 → 右極柱
const WALL_H=4.0,FENCE_TOP=WALL_H+0.2;
function fenceAt(deg){
  const a=Math.max(-45,Math.min(45,deg))*Math.PI/180,dx=Math.sin(a),dz=Math.cos(a);
  for(let i=0;i<3;i++){const A=OF[i],B=OF[i+1],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
    const t=(A[0]*ez-A[1]*ex)/den,u=(A[0]*dz-A[1]*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)return t;}
  return POLE;
}
const capMat=M('#4a4742');
const RB=newBatch();                                                   // 牆腳瓦礫、鋼筋、碎石等小東西
const rrw=rng(2024);
for(let i=0;i<3;i++){const A=OF[i],B=OF[i+1],len=Math.hypot(B[0]-A[0],B[1]-A[1]);
  wallSeg(A[0],A[1],B[0],B[1],WALL_H,0.6,ruinWallMat(len,31+i),true,true,capMat,0.7);
  const ux=(B[0]-A[0])/len,uz=(B[1]-A[1])/len;let nx=uz,nz=-ux;if(nx*(A[0]+B[0])/2+nz*(A[1]+B[1])/2<0){nx=-nx;nz=-nz;}
  for(let s=3;s<len-2;s+=5+rrw()*7){const x=A[0]+ux*s,z=A[1]+uz*s;                            // 牆腳瓦礫（牆外側大一點、牆內側只有一點點）
    rubble(RB,x+nx*(1.4+rrw()*1.6),z+nz*(1.4+rrw()*1.6),1.0+rrw()*1.6,0.8+rrw()*1.2,rrw);
    if(rrw()<0.5)rubble(RB,x-nx*0.9,z-nz*0.9,0.5+rrw()*0.5,0.3,rrw);}
  for(let s=2;s<len-1;s+=3+rrw()*5){const x=A[0]+ux*s,z=A[1]+uz*s,hh=0.8+rrw()*1.4;                // 牆頂戳出來的鋼筋
    RB.box(x,WALL_H+0.2+hh*0.5,z,0.05,hh,0.05,0,[0.3,0.15,0.09],{rx:(rrw()-0.5)*0.6,rz:(rrw()-0.5)*0.6});}}
const poleMat=M('#5a4a20',{em:'#2a2208'});
[-1,1].forEach(s=>put(MB.CreateCylinder('xxPole',{diameter:0.28,height:18,tessellation:10},scene),s*POLE_X,9,POLE_X,poleMat));   // 界外極柱（外觀，褪色）

// ═════════ ④ 殘破的看台（沒有觀眾）═════════
// 和乙子園一樣用階梯式看台，但每一個 2.4 m 寬的區塊各有不同的毀損：完整(45%)、下陷歪斜(17%)、上半幾階被炸掉(25%)、整段垮成瓦礫(13%)。
// 完整的階板上只剩零星燒焦的座椅；斷口有外露鋼筋；後牆也缺角。碰撞跟乙子園一樣用「每階一個方盒」＋後牆一個方盒（垮掉的地方堆瓦礫當體積）。
const STEP=1.1,ROW=0.8,SB=newBatch();
function ruinedStand(ax,az,bx,bz,tiers,gap,top0,ext,seed){
  const dx=bx-ax,dz=bz-az,L0=Math.hypot(dx,dz),ux=dx/L0,uz=dz/L0;
  let nx=uz,nz=-ux;if(nx*(ax+bx)/2+nz*(az+bz)/2<0){nx=-nx;nz=-nz;}
  const e=ext||0,s0=-e,L=L0+2*e,ang=Math.atan2(-dz,dx),mx=(ax+bx)/2,mz=(az+bz)/2,rnd=rng(seed),NC=Math.ceil(L/2.4),cw=L/NC;
  const Pt=(s,off)=>[ax+ux*s+nx*off,az+uz*s+nz*off];
  const seatCols=[[0.36,0.12,0.11],[0.12,0.16,0.28],[0.2,0.2,0.2],[0.42,0.4,0.36],[0.4,0.22,0.08]];
  for(let c=0;c<NC;c++){
    const sc=s0+(c+0.5)*cw,r=rnd(),kind=r<0.13?'collapse':r<0.38?'broken':r<0.55?'sag':'ok',soot=0.32+rnd()*0.38;
    const kmax=kind==='collapse'?0:kind==='broken'?1+Math.floor(rnd()*(tiers-1)):tiers;
    for(let k=0;k<kmax;k++){
      const off=gap+k*STEP+STEP/2,top=top0+k*ROW,hh=k?ROW:top0,p=Pt(sc,off),tone=soot*(0.8+rnd()*0.4);
      const sag=kind==='sag'||rnd()<0.06,rx=sag?(rnd()-0.5)*0.36:0,dy=sag?-rnd()*0.35:0;
      SB.box(p[0],top-hh/2+dy,p[1],cw+0.04,hh,STEP,ang,[tone*0.82,tone*0.8,tone*0.76],{rx});
      for(let q=0;q<4;q++)if(rnd()<0.22){const sp=Pt(sc-cw/2+(q+0.5)*cw/4,off-STEP/2+0.45),col=seatCols[(rnd()*seatCols.length)|0],tl=rnd()<0.3?(rnd()-0.5)*1.2:0;
        SB.box(sp[0],top+dy+0.2,sp[1],0.42,0.4,0.4,ang,mulC(col,0.5+rnd()*0.5),{rz:tl});SB.box(sp[0]-nx*0.2,top+dy+0.45,sp[1]-nz*0.2,0.42,0.5,0.07,ang,mulC(col,0.4+rnd()*0.4),{rx:tl*0.5});}}
    if(kind==='broken'){                                  // 斷口：外露鋼筋＋掉下來的碎塊
      const top=top0+(kmax-1)*ROW,p0=Pt(sc,gap+kmax*STEP);
      for(let q=0;q<3;q++){const pp=Pt(sc-cw/2+rnd()*cw,gap+kmax*STEP+rnd()*0.4),hh=0.7+rnd()*1.5;SB.box(pp[0],top+hh/2,pp[1],0.05,hh,0.05,0,[0.3,0.15,0.09],{rx:(rnd()-0.5)*0.7,rz:(rnd()-0.5)*0.7});}
      const pc=Pt(sc,gap+(kmax+tiers)*STEP/2);rubble(SB,pc[0],pc[1],Math.max(1.2,(tiers-kmax)*STEP*0.55),(tiers-kmax)*ROW*0.9,rnd,top,0.9);}
    if(kind==='collapse'){const pc=Pt(sc,gap+tiers*STEP/2);rubble(SB,pc[0],pc[1],tiers*STEP*0.55,(top0+tiers*ROW)*0.55,rnd,0,0.85);}
  }
  for(let k=0;k<tiers;k++){const off=gap+k*STEP+STEP/2,top=top0+k*ROW;ghostBox(mx+nx*off,top/2,mz+nz*off,L,top,STEP+0.1,ang,'spectator');}   // 每階一個碰撞方盒
  // 後牆：每 4 m 一塊，約三成缺角（只剩一半高、頂端參差）
  const backOff=gap+tiers*STEP+0.3,bh=top0+tiers*ROW+1.6,NW=Math.ceil(L/4),ww=L/NW;
  for(let c=0;c<NW;c++){const sc=s0+(c+0.5)*ww,p=Pt(sc,backOff),broken=rnd()<0.32,h=broken?bh*(0.3+rnd()*0.4):bh,tone=0.3+rnd()*0.25;
    SB.box(p[0],h/2,p[1],ww+0.04,h,0.6,ang,[tone,tone*0.98,tone*0.94]);
    if(broken){for(let q=0;q<4;q++){const pp=Pt(sc-ww/2+rnd()*ww,backOff),hh=0.5+rnd()*1.4;SB.box(pp[0],h+hh/2-0.2,pp[1],0.05,hh,0.05,0,[0.3,0.15,0.09],{rx:(rnd()-0.5)*0.7,rz:(rnd()-0.5)*0.7});}
      const pr=Pt(sc,backOff+1.2);rubble(SB,pr[0],pr[1],1.5,1.1,rnd);}}
  const bw=put(MB.CreateBox('xxHitBack',{width:L,height:bh,depth:0.6}),mx+nx*backOff,bh/2,mz+nz*backOff,null);bw.rotation.y=ang;bw.isVisible=false;registerBallSolid(bw,'spectator');
}
for(let i=0;i<3;i++)ruinedStand(OF[i][0],OF[i][1],OF[i+1][0],OF[i+1][1],5,1.8,4.6,1.2,100+i);   // 外野看台
// 破壞：看台之外，再在外野看台的後面丟一個倒塌的燈塔（只有外觀）
const LT=newBatch();
function lightTower(x,z,kind,rnd){
  const col=[0.22,0.22,0.24],rust=[0.3,0.16,0.1];
  if(kind==='stand'){const lean=(rnd()-0.5)*0.1,dz=38*Math.sin(lean);LT.box(x,19,z+dz/2,0.9,38,0.9,0,col,{rx:lean});LT.box(x,38.8,z+dz,7,3.6,0.7,0,[0.12,0.12,0.13],{rx:lean});
    for(let i=0;i<3;i++)for(let j=0;j<5;j++)if(rnd()<0.7)LT.box(x-3+j*1.5,38.8+(i-1)*1.1,z+dz-0.45,0.9,0.7,0.1,0,[0.75,0.7,0.5]);}
  else if(kind==='broken'){LT.box(x,10,z,0.9,20,0.9,0,col);LT.box(x+5,17.5,z+3,0.9,16,0.9,0,col,{rx:0.9,rz:-1.0});LT.box(x+10,8,z+8,7,3.6,0.7,0.6,[0.12,0.12,0.13],{rx:0.3,rz:0.5});}
  else{LT.box(x,0.5,z,0.9,38,0.9,0.3,col,{rx:Math.PI/2-0.05});LT.box(x+Math.sin(0.3)*-19.5,1.2,z+Math.cos(0.3)*-19.5,7,0.7,3.6,0.3,[0.12,0.12,0.13]);rubble(LT,x,z-19,2.5,0.9,rnd);}
  rubble(LT,x,z,2.2,0.8,rnd);for(let i=0;i<3;i++)LT.box(x+(i-1)*1.3,0.4,z+(rnd()-0.5)*2,0.2,1.2,0.2,0,rust,{rx:(rnd()-0.5)*0.6});
}
{const rl=rng(909);lightTower(-90,58,'stand',rl);lightTower(92,60,'broken',rl);lightTower(-62,-40,'fallen',rl);lightTower(66,-38,'stand',rl);}

// ═════════ ⑤ 界外牆、擋球牆、休息區（棚頂塌了、長椅燒黑）═════════
const FOUL_OFF=19,homeBackZ=-20,sides=[-1,1],foulMat=ruinWallMat(60,71);
wallSeg(-12,homeBackZ,12,homeBackZ,3.4,0.6,foulMat,true,false,capMat,0.6);
sides.forEach((s,si)=>{
  const a=lpt(s,0,FOUL_OFF),b=lpt(s,POLE,FOUL_OFF),pole=lpt(s,POLE,0);
  wallSeg(s*12,homeBackZ,a.x,a.z,3.0,0.6,foulMat,true,false,capMat,0.6);
  wallSeg(a.x,a.z,b.x,b.z,2.8,0.6,foulMat,true,false,capMat,0.6);
  wallSeg(pole.x,pole.z,b.x,b.z,2.8,0.6,foulMat,true,false,capMat,0.6);
  const sa=lpt(s,8,FOUL_OFF),sb=lpt(s,70,FOUL_OFF);ruinedStand(sa.x,sa.z,sb.x,sb.z,5,1.4,3.6,0,200+si);   // 界外側看台
});
ruinedStand(-12,homeBackZ,12,homeBackZ,6,1.4,4.0,2,300);                                       // 本壘後方看台

const DUG_R=19,DUG_FRONT=12.5,benchMat=M('#2a231e'),roofMat=M('#3b3d3c'),slabMat=M('#4a4743'),lowWall=M('#4b4a46');
sides.forEach((s,si)=>{
  const dirX=s*SQ,dirZ=SQ,ang=Math.atan2(-dirZ,dirX),c=lpt(s,DUG_R,(DUG_FRONT+FOUL_OFF)/2);
  const floor=put(MB.CreateBox('xxDugFloor',{width:14,height:0.06,depth:FOUL_OFF-DUG_FRONT}),c.x,0.04,c.z,slabMat);floor.rotation.y=ang;
  ghostBox(c.x,2.7,c.z,14.6,0.18,FOUL_OFF-DUG_FRONT+0.8,ang,undefined);                          // 棚頂的碰撞（維持原位）
  const r1=lpt(s,DUG_R-3.6,(DUG_FRONT+FOUL_OFF)/2),r2=lpt(s,DUG_R+3.7,(DUG_FRONT+FOUL_OFF)/2);
  const roofA=put(MB.CreateBox('xxDugRoofA',{width:7.4,height:0.18,depth:FOUL_OFF-DUG_FRONT+0.8}),r1.x,2.7-si*0.1,r1.z,roofMat);roofA.rotation.y=ang;roofA.rotation.z=(si?-1:1)*0.06;   // 塌了一半的棚頂
  const roofB=put(MB.CreateBox('xxDugRoofB',{width:6.2,height:0.18,depth:FOUL_OFF-DUG_FRONT+0.8}),r2.x,2.0+si*0.3,r2.z,roofMat);roofB.rotation.y=ang;roofB.rotation.x=(si?1:-1)*0.34;
  const bn=lpt(s,DUG_R,FOUL_OFF-1.2),bench=put(MB.CreateBox('xxDugBench',{width:11,height:0.5,depth:0.7}),bn.x,0.3,bn.z,benchMat);bench.rotation.y=ang;   // 燒黑的長椅
  const f0=lpt(s,DUG_R-7,DUG_FRONT),f1=lpt(s,DUG_R-1.3,DUG_FRONT),f2=lpt(s,DUG_R+1.3,DUG_FRONT),f3=lpt(s,DUG_R+7,DUG_FRONT);
  wallSeg(f0.x,f0.z,f1.x,f1.z,1.1,0.4,lowWall,true,false,capMat,0);wallSeg(f2.x,f2.z,f3.x,f3.z,1.1,0.4,lowWall,true,false,capMat,0);
  const rd=rng(55+si);rubble(RB,c.x,c.z,2.4,0.7,rd);                                              // 棚裡掉下來的碎塊
});

// ═════════ ⑥ 記分板：歪掛在斷了一根的立柱上；面板裂開，只剩琥珀色 LED 還亮著 ═════════
const BOARD_W=36,BOARD_H=12,BOARD_Y=6+BOARD_H/2+0.6,BOARD_Z=101.9,TILT=0.06;
const boardTex=sbTexInit();
const faceMat=M('#000000');faceMat.emissiveTexture=boardTex;faceMat.disableLighting=true;faceMat.backFaceCulling=false;
const face=put(MB.CreatePlane('xxBoardFace',{width:BOARD_W,height:BOARD_H,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),0,BOARD_Y,BOARD_Z-0.32,faceMat);face.rotation.z=TILT;
const frame=put(MB.CreateBox('xxBoardFrame',{width:BOARD_W+1.2,height:BOARD_H+1.2,depth:0.6}),0,BOARD_Y,BOARD_Z,M('#1b1a18'));frame.rotation.z=TILT;registerBallSolid(frame,'scoreboard');
const post1=put(MB.CreateBox('xxBoardPost',{width:1.0,height:BOARD_Y,depth:1.0}),-13.5,BOARD_Y/2,BOARD_Z+0.2,M('#2c2d30'));registerBallSolid(post1,'scoreboard');
const post2=put(MB.CreateBox('xxBoardPost2',{width:1.0,height:6.5,depth:1.0}),13.5,3.2,BOARD_Z+0.2,M('#2c2d30'));post2.rotation.z=-0.12;   // 斷掉的那根（只剩下半截）
rubble(RB,13,BOARD_Z+2,2.6,1.2,rrw);rubble(RB,18,BOARD_Z+1,1.8,0.9,rrw);
function drawBoard(g,s,W,H){
  const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',NUM='"Arial Narrow","Helvetica Neue",Arial,sans-serif',AMB='#ffb347',DIM='#6a4a22';
  g.fillStyle='#14110e';g.fillRect(0,0,W,H);
  g.fillStyle='rgba(60,50,40,0.25)';for(let x=0;x<W;x+=14)g.fillRect(x,0,3,H);
  g.strokeStyle='#4a4136';g.lineWidth=9;g.strokeRect(10,10,W-20,H-20);
  const NX=34,NW=300,IX=NX+NW,IW=88,RX=IX+9*IW+20,RW=100,HY=34,HH=66,R1=HY+HH+8,RH=104,R2=R1+RH+6;
  const plate=(x,y,w,h,txt,size,col)=>{g.fillStyle='#070605';g.fillRect(x+4,y+4,w-8,h-8);g.strokeStyle='#5a5148';g.lineWidth=2;g.strokeRect(x+4,y+4,w-8,h-8);
    g.fillStyle=col||AMB;g.font='bold '+size+'px '+NUM;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,x+w/2,y+h/2+2);};
  g.strokeStyle='#5a5148';g.lineWidth=3;
  for(let i=0;i<=9;i++){g.beginPath();g.moveTo(IX+i*IW,HY);g.lineTo(IX+i*IW,R2+RH);g.stroke();}
  for(let i=0;i<=3;i++){g.beginPath();g.moveTo(RX+i*RW,HY);g.lineTo(RX+i*RW,R2+RH);g.stroke();}
  [HY,R1,R2,R2+RH].forEach(y=>{g.beginPath();g.moveTo(NX,y);g.lineTo(RX+3*RW,y);g.stroke();});
  g.font='bold 44px '+NUM;g.textAlign='center';g.textBaseline='middle';
  for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn;g.fillStyle=cur?'#ffe28a':AMB;g.fillText(String(n),IX+i*IW+IW/2,HY+HH/2+2);}
  g.fillStyle=AMB;['R','H','E'].forEach((t,i)=>g.fillText(t,RX+i*RW+RW/2,HY+HH/2+2));
  g.textAlign='left';g.font='bold 22px '+FONT;g.fillText('球隊',NX+16,HY+HH/2+2);
  [['me',R1,'#d8323a'],['cpu',R2,'#2f6fe0']].forEach(([key,y,col])=>{
    g.fillStyle=col;g.fillRect(NX+6,y+14,14,RH-28);
    let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);
    g.fillStyle=AMB;g.font='bold '+(nm.length>4?44:54)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillText(nm,NX+32,y+RH/2+2);
    for(let i=0;i<9;i++){const n=s.first+i;if(!s.played(key,n))continue;const v=(s.lineScore[key]||[])[n-1];plate(IX+i*IW,y,IW,RH,v==null?'0':String(v),60,s.current(key,n)?'#ffe28a':null);}
    plate(RX,y,RW,RH,String(s.score[key]),64);plate(RX+RW,y,RW,RH,String(s.hits[key]),60);plate(RX+2*RW,y,RW,RH,String(s.errors[key]),60);});
  const by=R2+RH+66;g.textBaseline='middle';
  [['B',s.balls,3,'#53e08a'],['S',s.strikes,2,'#ffd84a'],['O',s.outs,2,'#ff4a3a']].forEach(([lab,n,max,col],r)=>{
    const x0=NX+16+r*210;g.fillStyle=AMB;g.font='bold 46px '+NUM;g.textAlign='left';g.fillText(lab,x0,by);
    for(let i=0;i<max;i++){g.beginPath();g.arc(x0+66+i*50,by,19,0,TAU);g.fillStyle=i<n?col:'#1a1410';g.fill();g.strokeStyle='#5a5148';g.lineWidth=3;g.stroke();}});
  const dx0=NX+16+3*210+40;[[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22;g.save();g.translate(cx,cy);g.rotate(Math.PI/4);
    g.fillStyle=s.bases[i]?'#ffd84a':'#1a1410';g.fillRect(-12,-12,24,24);g.strokeStyle='#5a5148';g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
  g.textAlign='right';g.fillStyle=AMB;g.font='bold 34px '+FONT;
  g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+s.batter),W-44,by);
  // 破損：燻黑、裂痕、幾格壞掉的面板（固定的亂數種子，每次重畫都一樣）
  const rc=rng(404);
  for(let n=0;n<9;n++){const x=rc()*W,w=30+rc()*120;const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(0,0,0,0.32)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x,0,w,H*(0.4+rc()*0.6));}
  g.strokeStyle='rgba(0,0,0,0.85)';g.lineWidth=3;
  for(let n=0;n<7;n++){let x=rc()*W,y=rc()*H;g.beginPath();g.moveTo(x,y);for(let k=0;k<7;k++){x+=(rc()-0.5)*90;y+=(rc()-0.5)*70;g.lineTo(x,y);}g.stroke();}
}
ctx.setScoreboardRenderer(drawBoard);

// ═════════ ⑦ 場地：彈坑（貼在地上的貼圖）與碎石 ═════════
const craterMats=[decalMat(craterTex(3)),decalMat(craterTex(8)),decalMat(craterTex(13))];
const baseSpots=[[0,0,9],[19.4,19.4,9],[0,38.8,9],[-19.4,19.4,9],[0,18.44,8]];     // 壘包、本壘、投手丘附近不放彈坑
const craters=[];
{const rc=rng(8080);
 for(let tries=0;craters.length<24&&tries<900;tries++){
   const x=(rc()*2-1)*88,z=-12+rc()*106,deg=Math.atan2(x,z)*180/Math.PI,d=5+Math.pow(rc(),1.8)*17;
   if(Math.abs(deg)>=46||Math.hypot(x,z)>fenceAt(deg)-d/2-3)continue;
   if(baseSpots.some(b=>Math.hypot(x-b[0],z-b[1])<b[2]+d/2))continue;
   if(craters.some(c=>Math.hypot(x-c.x,z-c.z)<(c.d+d)/2*0.9))continue;
   craters.push({x,z,d});
   const m=put(MB.CreateGround('xxCrater',{width:d,height:d},scene),x,0.04+craters.length*0.001,z,craterMats[(rc()*3)|0]);m.rotation.y=rc()*TAU;}
}
// 捕手後方（本壘後方、擋球牆前）的幾個彈坑：場上彈坑的煙全部改到這裡冒（在打擊視角攝影機 z=-6.8 的後面，不會擋到視線）
const homeVents=[[-13,-12.5,5.5],[14,-13.5,6],[-5,-17.5,4.5],[6,-17.5,4.5],[-27,-16,7],[28,-17,7]];
homeVents.forEach((v,i)=>{put(MB.CreateGround('xxCrater',{width:v[2],height:v[2]},scene),v[0],0.045+i*0.001,v[1],craterMats[i%3]).rotation.y=i*1.7;});
const FB=newBatch();   // 場上的碎石、焦黑的座椅殘骸、扭曲的鐵片（只有外觀、都很矮）
{const rc=rng(9191);
 for(const c of craters){const n=4+Math.round(c.d*0.8);for(let i=0;i<n;i++){const a=rc()*TAU,r=c.d*0.3+rc()*c.d*0.35,s=0.2+rc()*0.5,k=0.12+rc()*0.22;
   FB.box(c.x+Math.cos(a)*r,s*0.3,c.z+Math.sin(a)*r,s*(0.8+rc()),s*0.6,s*(0.8+rc()),rc()*TAU,[k,k*0.98,k*0.94],{rx:(rc()-0.5)*0.8,rz:(rc()-0.5)*0.8});}}
 for(let i=0;i<150;i++){const x=(rc()*2-1)*92,z=-14+rc()*112,deg=Math.atan2(x,z)*180/Math.PI;
   if(Math.abs(deg)>=45||Math.hypot(x,z)>fenceAt(deg)-3||baseSpots.some(b=>Math.hypot(x-b[0],z-b[1])<b[2]))continue;
   const s=0.12+rc()*0.34,k=0.1+rc()*0.25,kind=rc();
   if(kind<0.2)FB.box(x,0.05,z,0.9+rc()*0.8,0.04,0.6+rc()*0.5,rc()*TAU,[0.22,0.14,0.1],{rx:(rc()-0.5)*0.4,rz:(rc()-0.5)*0.4});   // 扭曲的鐵片
   else FB.box(x,s*0.3,z,s*(1+rc()),s*0.6,s*(1+rc()),rc()*TAU,[k,k*0.96,k*0.9],{rx:(rc()-0.5)*0.8,rz:(rc()-0.5)*0.8});}
}

// ═════════ ⑧ 外圍：被轟炸後的城市 ═════════
// 範圍：以球場為中心約 650 m。街道是軸向的格子（每 110 m 一條、寬 14 m），球場附近(|x|<130, -65<z<150)是大廣場，沒有街廓。
// 街廓裡每個 42×42 m 的地塊隨機變成：瓦礫堆(20%)／彈坑空地(14%)／參差斷頂的大樓(約 26%)／一半垮掉的大樓(約 20%)／燒空的低樓層外殼(約 20%)。
const cityGround=groundTex.clone();cityGround.uScale=cityGround.vScale=3800/32;
put(MB.CreateGround('xxCityGround',{width:3800,height:3800},scene),0,-0.05,300,texMat(cityGround,0.9));
const facT=facadeTex(),facMat=(()=>{const m=M('#000000');m.emissiveTexture=facT;m.disableLighting=true;m.backFaceCulling=false;return m;})();
const rdT=roadTex(),roadMat=(()=>{const m=M('#000000');m.emissiveTexture=rdT;m.disableLighting=true;m.backFaceCulling=false;return m;})();
const CX0=0,CZ0=45,R_CITY=580,PITCH=110,RW=14,CLEAR={x0:-130,x1:130,z0:-65,z1:150};
const xs=[],zs=[];for(let i=-7;i<=7;i++)xs.push(i*PITCH);for(let j=-6;j<=8;j++)zs.push(-55+j*PITCH);   // 街道中心線：x=0,±110,… ；z=-55,55,165,…
const inStadium=(x,z,m)=>x>-82-m&&x<82+m&&z>-32-m&&z<116+m;   // 球場本體（看台外緣）的範圍
const inClear=(x,z,m)=>x>CLEAR.x0-(m||0)&&x<CLEAR.x1+(m||0)&&z>CLEAR.z0-(m||0)&&z<CLEAR.z1+(m||0);
const RDB=newBatch(true);
const rquad=(x0,z0,x1,z1)=>{if(x1-x0<1||z1-z0<1)return;RDB.quad([x0,0.02,z0],[x1,0.02,z0],[x1,0.02,z1],[x0,0.02,z1],[0,1,0],[0.95,0.95,0.95],[x0/16,z0/16],[x1/16,z0/16],[x1/16,z1/16],[x0/16,z1/16]);};
{const R=R_CITY+40;
 for(const x of xs){const a=x-RW/2,b=x+RW/2;if(Math.abs(x-CX0)>R)continue;
   if(x+RW/2>CLEAR.x0&&x-RW/2<CLEAR.x1){rquad(a,CZ0-R,b,CLEAR.z0);rquad(a,CLEAR.z1,b,CZ0+R);}else rquad(a,CZ0-R,b,CZ0+R);}
 for(const z of zs){const a=z-RW/2,b=z+RW/2;if(Math.abs(z-CZ0)>R)continue;
   if(z+RW/2>CLEAR.z0&&z-RW/2<CLEAR.z1){rquad(CX0-R,a,CLEAR.x0,b);rquad(CLEAR.x1,a,CX0+R,b);}else rquad(CX0-R,a,CX0+R,b);}}
RDB.toMesh('xxRuinRoads',roadMat);
// 廣場上的彈坑、車子殘骸
const wreckB=newBatch();
{const rc=rng(1357);
 const car=(x,z,ry,flip)=>{const burnt=0.05+rc()*0.14,col=rc()<0.25?[0.3,0.1,0.07]:[burnt,burnt,burnt*0.95];
   wreckB.box(x,0.55,z,4.4,0.8,1.9,ry,col,{rz:flip?Math.PI:0});wreckB.box(x+Math.cos(ry)*-0.2,flip?0.2:1.15,z+Math.sin(ry)*0.2,2.3,0.55,1.7,ry,[0.04,0.04,0.04],{rz:flip?Math.PI:0});};
 for(let i=0;i<46;i++){const onX=rc()<0.5,line=onX?xs[(rc()*xs.length)|0]:zs[(rc()*zs.length)|0],t=(rc()*2-1)*R_CITY,off=(rc()-0.5)*8;
   const x=onX?line+off:CX0+t,z=onX?CZ0+t:line+off;if(inClear(x,z,4)||Math.hypot(x-CX0,z-CZ0)>R_CITY)continue;car(x,z,onX?Math.PI/2+(rc()-0.5)*0.4:(rc()-0.5)*0.4,rc()<0.15);}
 for(let i=0;i<40&&true;i++){const x=CLEAR.x0+rc()*(CLEAR.x1-CLEAR.x0),z=CLEAR.z0+rc()*(CLEAR.z1-CLEAR.z0);if(inStadium(x,z,4))continue;car(x,z,rc()*TAU,rc()<0.2);if(i>14)break;}   // 球場外圍廣場上的殘骸
 for(let i=0;i<30;i++){const x=(rc()*2-1)*R_CITY*0.9,z=CZ0+(rc()*2-1)*R_CITY*0.9;if(inClear(x,z,8)||Math.hypot(x-CX0,z-CZ0)>R_CITY)continue;   // 街道與廣場上的彈坑
   const d=8+rc()*16;put(MB.CreateGround('xxCrater',{width:d,height:d},scene),x,0.05+i*0.001,z,craterMats[(rc()*3)|0]).rotation.y=rc()*TAU;}
 for(let i=0;i<40;i++){const x=CLEAR.x0+rc()*(CLEAR.x1-CLEAR.x0),z=CLEAR.z0+rc()*(CLEAR.z1-CLEAR.z0);if(inStadium(x,z,6))continue;const d=6+rc()*12;   // 球場外圍廣場的彈坑
   put(MB.CreateGround('xxCrater',{width:d,height:d},scene),x,0.05+i*0.001,z,craterMats[(rc()*3)|0]).rotation.y=rc()*TAU;rubble(wreckB,x,z,d*0.4,1.2,rc,0,1,true);}
}
// 街廓裡的建築
const cityTex=new Map(),cityPlain=new Map(),fireSpots=[],smokeSpots=[];
const tints=[[0.86,0.8,0.68],[0.78,0.76,0.72],[0.84,0.68,0.6],[0.9,0.88,0.82],[0.7,0.62,0.55]];
{const rc=rng(24680),FH=3.6,
  bT=k=>{let b=cityTex.get(k);if(!b){b=newBatch(true);cityTex.set(k,b);}return b;},bP=k=>{let b=cityPlain.get(k);if(!b){b=newBatch();cityPlain.set(k,b);}return b;};
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
   const bx0=xs[i]+RW/2,bx1=xs[i+1]-RW/2,bz0=zs[j]+RW/2,bz1=zs[j+1]-RW/2,bcx=(bx0+bx1)/2,bcz=(bz0+bz1)/2;
   if(Math.hypot(bcx-CX0,bcz-CZ0)>R_CITY)continue;
   if(!(bx1<CLEAR.x0-6||bx0>CLEAR.x1+6||bz1<CLEAR.z0-6||bz0>CLEAR.z1+6))continue;
   const key=Math.floor(bcx/220)+','+Math.floor(bcz/220),T=bT(key),P=bP(key),LOT=(bx1-bx0-4)/2;
   for(let a=0;a<2;a++)for(let b=0;b<2;b++){
     const cx=bx0+2+LOT/2+a*(LOT+0),cz=bz0+2+LOT/2+b*(LOT+0),r=rc(),dist=Math.hypot(cx-CX0,cz-CZ0),tint=tints[(rc()*tints.length)|0];
     if(r<0.14){rubble(P,cx,cz,5+rc()*4,1.2,rc,0,1,true);continue;}
     if(r<0.34){rubble(P,cx,cz,LOT*0.38,3+rc()*3,rc,0,1,true);   // 瓦礫堆＋殘牆
       const wh=FH*(1+Math.floor(rc()*3)),wx=cx+(rc()-0.5)*LOT*0.4,wz=cz+(rc()-0.5)*LOT*0.4;T.box(wx,wh/2,wz,8+rc()*8,wh,0.8,0,tint.map(v=>v*0.7),{uP:12,vP:10.8});
       if(rc()<0.4)smokeSpots.push([cx,3,cz,0.8]);continue;}
     const F=2+Math.floor(rc()*(dist>400?5:8)),w=LOT*(0.7+rc()*0.25),d=LOT*(0.7+rc()*0.25),sub=rc(),burn=sub<0.8?1:0.35;
     const cols=3;
     if(sub<0.55){                                   // 參差斷頂
       for(let cx2=0;cx2<cols;cx2++)for(let cz2=0;cz2<cols;cz2++){const fl=Math.max(1,F-Math.floor(Math.pow(rc(),1.4)*F*0.95)+(cx2===0&&cz2===0?F:0)),h=Math.min(F,fl)*FH,x=cx-w/2+(cx2+0.5)*w/cols,z=cz-d/2+(cz2+0.5)*d/cols;
         T.box(x,h/2,z,w/cols+0.02,h,d/cols+0.02,0,mulC(tint,burn*(0.75+rc()*0.25)),{uP:12,vP:10.8});if(dist<380&&rc()<0.4)P.box(x,h+0.3,z,w/cols*0.7,0.5,d/cols*0.7,rc()*0.5,[0.18,0.17,0.16],{rx:(rc()-0.5)*0.5});}
     }else if(sub<0.8){                              // 一半垮掉
       const h1=F*FH,h2=Math.max(1,Math.round(F*0.3))*FH;
       T.box(cx-w/4,h1/2,cz,w/2,h1,d,0,mulC(tint,0.9),{uP:12,vP:10.8});T.box(cx+w/4,h2/2,cz,w/2,h2,d,0,mulC(tint,0.85),{uP:12,vP:10.8});
       rubble(P,cx+w/4,cz,Math.min(w,d)*0.4,h2*0.8,rc,h2,1,true);
     }else{                                          // 燒空的低樓層外殼
       const fl=Math.min(F,3),h=fl*FH;T.box(cx,h/2,cz,w,h,d,0,mulC(tint,0.35),{uP:12,vP:10.8});for(let q=0;q<3;q++)P.box(cx+(rc()-0.5)*w*0.6,h+0.2,cz+(rc()-0.5)*d*0.6,3+rc()*3,0.4,3+rc()*3,rc(),[0.08,0.08,0.08]);}
     if(dist<380&&rc()<0.5){const sl=Math.max(2,F*0.5)*FH;P.box(cx+w/2+2,sl/2,cz,0.5,sl,Math.min(10,d*0.7),0,[0.34,0.33,0.31],{rz:-0.9});}    // 靠在牆邊的斜倒樓板
     if(dist<380)for(let q=0;q<2;q++){const a2=rc()*TAU;rubble(P,cx+Math.cos(a2)*w*0.6,cz+Math.sin(a2)*d*0.6,2+rc()*3,1.2+rc()*1.2,rc,0,1,true);}   // 外圈瓦礫（遠處省略）
     if(rc()<0.34)smokeSpots.push([cx,F*FH*0.8,cz,1]);
     if(rc()<0.16)fireSpots.push([cx,Math.max(2,F*FH*0.55),cz]);
   }}
}
cityTex.forEach((b,k)=>{const m=b.toMesh('xxRuinCity'+k,facMat);if(m)m.freezeWorldMatrix();});
cityPlain.forEach((b,k)=>{const m=b.toMesh('xxRuinRubble'+k,vcMat);if(m)m.freezeWorldMatrix();});
// 把前面累積的小東西做成 mesh：看台、牆腳瓦礫、場上碎石、燈塔、車子殘骸
SB.toMesh('xxRuinStands',vcMat);RB.toMesh('xxRuinBits',vcMat);FB.toMesh('xxFieldDebris',vcMat);LT.toMesh('xxFallenLights',vcMat);wreckB.toMesh('xxWrecks',vcMat);

// ═════════ ⑨ 煙與火（粒子系統）═════════
// 粒子系統不在「換球場自動清掉」的範圍內，所以全部記在 PSL，下面的 observer 一看到 anchor 被清掉就自己 dispose。
const anchor=put(MB.CreateBox('xxWarAnchor',{size:0.1},scene),0,-5,0,null);anchor.isVisible=false;
// 偵錯開關（要在切換到這個球場「之前」在瀏覽器主控台設定，例如 window.BaseballWarDebug={noPS:true}）：
//   noPS＝完全不建立粒子系統；noBoom＝不要爆炸的閃光球；noTracer＝不要曳光彈；noGuns＝機槍不開火；noShadowFix＝不做「從陰影清單移除特效物件」的處理。
const DBG=window.BaseballWarDebug||{};
const PSL=[],C4=(r,g,b,a)=>new BABYLON.Color4(r,g,b,a);
const dummyPS=()=>new Proxy({},{get:(t,p)=>p in t?t[p]:(p==='addSizeGradient'||p==='start'||p==='stop'||p==='dispose'?()=>{}:undefined),set:(t,p,v)=>{t[p]=v;return true;}});
function mkPS(name,cap,emitter,additive){if(DBG.noPS)return dummyPS();const ps=new BABYLON.ParticleSystem(name,cap,scene);ps.particleTexture=puffTex;ps.emitter=emitter;ps.updateSpeed=1/60;   // updateSpeed=1/60 → 生命週期／速度都以「秒」計
  ps.blendMode=additive?BABYLON.ParticleSystem.BLENDMODE_ADD:BABYLON.ParticleSystem.BLENDMODE_STANDARD;PSL.push(ps);return ps;}
function smokeColumn(x,y,z,sc,rate,wind){const ps=mkPS('xxSmoke',Math.round(Math.min(260,(rate||12)*11)),V3(x,y,z));
  ps.minEmitBox=V3(-1.2*sc,0,-1.2*sc);ps.maxEmitBox=V3(1.2*sc,0,1.2*sc);
  ps.color1=C4(0.07,0.07,0.07,0.8);ps.color2=C4(0.26,0.23,0.2,0.62);ps.colorDead=C4(0.2,0.2,0.2,0);
  ps.minSize=4*sc;ps.maxSize=8*sc;ps.minLifeTime=6;ps.maxLifeTime=10;ps.emitRate=rate||12;
  ps.direction1=V3(-0.3,1,-0.3);ps.direction2=V3(0.4,1,0.3);ps.minEmitPower=1.2;ps.maxEmitPower=2.8;ps.gravity=wind?V3(wind[0],0.5,wind[1]):V3(0.9,0.5,0.3);   // wind＝[x,z]：煙往哪邊飄
  ps.minAngularSpeed=-0.4;ps.maxAngularSpeed=0.4;if(ps.addSizeGradient){ps.addSizeGradient(0,3*sc,5*sc);ps.addSizeGradient(1,12*sc,22*sc);}   // 有 size gradient 時粒子大小就是這裡的絕對值（minSize/maxSize 不再使用）：從 3~5 m 長到 12~22 m
  ps.start();return ps;}
function fireSpot(x,y,z,sc){const ps=mkPS('xxFire',70,V3(x,y,z),true);
  ps.minEmitBox=V3(-0.7*sc,0,-0.7*sc);ps.maxEmitBox=V3(0.7*sc,0,0.7*sc);
  ps.color1=C4(1,0.66,0.16,1);ps.color2=C4(1,0.3,0.05,1);ps.colorDead=C4(0.25,0.02,0,0);
  ps.minSize=1.6*sc;ps.maxSize=3.4*sc;ps.minLifeTime=0.4;ps.maxLifeTime=0.95;ps.emitRate=42;
  ps.direction1=V3(-0.25,1,-0.25);ps.direction2=V3(0.25,1,0.25);ps.minEmitPower=1.5;ps.maxEmitPower=3.2;ps.gravity=V3(0,1.6,0);
  if(ps.addSizeGradient){ps.addSizeGradient(0,1.6*sc,3.4*sc);ps.addSizeGradient(1,0.4*sc,0.8*sc);}
  ps.start();return ps;}
{const rc=rng(6006);
 // 場上的煙：①捕手後方（打擊視角攝影機的後面）幾處彈坑冒煙，煙往後（−z）和左右兩側飄；
 // ②外野區的彈坑照常冒煙／起火，只有「投手正後方」（打者—投手—中外野那條視線，左右各 6°）不放，煙還會往外側飄、不會飄進這條視線。
 homeVents.forEach((v,i)=>smokeColumn(v[0],0.3,v[1],0.8+v[2]*0.08,10,[Math.sign(v[0]||1)*0.35,-0.55]));
 homeVents.slice(0,2).forEach(v=>fireSpot(v[0],0.3,v[1],0.8));
 const behindPitcher=c=>c.z>18&&Math.abs(Math.atan2(c.x,c.z+6.8)*180/Math.PI)<6;
 const outCr=craters.filter(c=>c.z>25&&!behindPitcher(c));
 outCr.slice(0,7).forEach(c=>smokeColumn(c.x,0.3,c.z,0.7+c.d*0.03,10,[Math.sign(c.x||1)*0.5,0.1]));   // 外野的煙
 outCr.slice(7,11).forEach(c=>fireSpot(c.x,0.3,c.z,0.9));                                              // 外野的小火
 [[-40,0.5,108],[26,0.5,-30],[70,0.5,56],[-72,0.5,50]].forEach(p=>smokeColumn(p[0],p[1],p[2],1.1,12,[Math.sign(p[0])*0.7,-0.2]));   // 看台瓦礫的煙：往外側飄
 const inCone=p=>Math.abs(Math.atan2(p[0],p[2])*180/Math.PI)<8&&p[2]>0;   // 本壘正前方 ±8° 的錐形範圍（投手—中外野—遠方）不放煙
 const near=smokeSpots.filter(p=>Math.hypot(p[0]-CX0,p[2]-CZ0)<520&&!inCone(p));for(let i=near.length-1;i>0;i--){const j=(rc()*(i+1))|0;[near[i],near[j]]=[near[j],near[i]];}
 near.slice(0,14).forEach(p=>smokeColumn(p[0],p[1],p[2],1.5*p[3],14));                                   // 城市裡的黑煙柱
 const nf=fireSpots.filter(p=>Math.hypot(p[0]-CX0,p[2]-CZ0)<520&&!inCone(p));for(let i=nf.length-1;i>0;i--){const j=(rc()*(i+1))|0;[nf[i],nf[j]]=[nf[j],nf[i]];}
 nf.slice(0,9).forEach(p=>fireSpot(p[0],p[1],p[2],2.2));                                                // 大樓裡的火
 for(let i=0;i<5;i++){let a=i/5*TAU+rc()*0.5;if(Math.abs(Math.atan2(Math.cos(a),Math.sin(a))*180/Math.PI)<12)a+=0.5;const d=560+rc()*260;smokeColumn(CX0+Math.cos(a)*d,0,CZ0+Math.sin(a)*d,4.5,18);}   // 遠處的大煙柱
}

// ═════════ ⑩ 機槍陣地與空襲事件 ═════════
// 四周看台上共 6 座機槍陣地（砂包＋三腳架機槍，會自動轉向目標、開火時有槍口火光與曳光彈）。
const NEST=newBatch(),guns=[];
function standPoint(i,s,off){const A=OF[i],B=OF[i+1],L0=Math.hypot(B[0]-A[0],B[1]-A[1]),ux=(B[0]-A[0])/L0,uz=(B[1]-A[1])/L0;let nx=uz,nz=-ux;if(nx*(A[0]+B[0])/2+nz*(A[1]+B[1])/2<0){nx=-nx;nz=-nz;}
  const k=Math.floor((off-1.8)/STEP);return {x:A[0]+ux*s+nx*off,z:A[1]+uz*s+nz*off,y:4.6+k*ROW,ang:Math.atan2(-(B[1]-A[1]),B[0]-A[0])};}
{const metal=M('#2a2c2e'),barrelM=M('#17181a'),flashM=unlit('#ffe9a8'),rn=rng(777);
 [[0,12,5.6],[0,38,5.6],[1,10,5.6],[1,56,5.6],[2,10,5.6],[2,36,5.6]].forEach(([i,s,off],gi)=>{
   const p=standPoint(i,s,off),by=p.y+0.6;
   NEST.box(p.x,by/2,p.z,5.4,by,5.4,p.ang,[0.2,0.2,0.2]);                                                  // 混凝土平台
   for(let q=0;q<12;q++){const a=q/12*TAU,rx=Math.cos(a)*2.5,rz=Math.sin(a)*2.5;if(q>=1&&q<=2)continue;     // 砂包圈（留一個缺口）
     NEST.box(p.x+rx,by+0.2+(q%2)*0.4,p.z+rz,0.95,0.45,0.55,-a,[0.34+rn()*0.06,0.3,0.2]);}
   const piv=new BABYLON.Mesh('xxGunPivot',scene);piv.position.set(p.x,by+1.5,p.z);
   const rec=put(MB.CreateBox('xxGunBody',{width:0.5,height:0.4,depth:1.0},scene),0,0,0.2,metal);rec.parent=piv;
   const bar=put(MB.CreateCylinder('xxGunBarrel',{diameter:0.14,height:2.6,tessellation:6},scene),0,0,1.6,barrelM);bar.rotation.x=Math.PI/2;bar.parent=piv;
   const fl=put(MB.CreateSphere('xxMuzzle',{diameter:1,segments:5},scene),0,0,3.0,flashM);fl.parent=piv;fl.setEnabled(false);
   for(const sx of[-1,1]){const leg=put(MB.CreateCylinder('xxGunLeg',{diameter:0.1,height:1.6,tessellation:5},scene),sx*0.5,-0.7,0.1,metal);leg.parent=piv;leg.rotation.z=sx*0.35;}
   guns.push({piv,fl,x:p.x,y:by+1.5,z:p.z,flash:0,cd:Math.random()*2});});
 NEST.toMesh('xxGunNests',vcMat);}

// 飛行器原型（頂點色、不受光；每種一個原型，其餘用 instance 複製）
const flatMat=(()=>{const m=M('#000000',{em:'#ffffff'});m.disableLighting=true;m.backFaceCulling=false;return m;})();
function buildDrone(){const b=newBatch(),t=0.04,top=hexRGB('#dedcd4'),bot=mulC(top,0.62),fus=hexRGB('#cfd2d4'),dark=hexRGB('#2c2f35'),fin=hexRGB('#b9bbbf'),glow=[1,0.62,0.2];   // 沙西德(Shahed-136)型：三角翼＋細長機身＋後推式引擎＋翼尖小尾翼
  b.tri([0,t,1.0],[1.25,t,-1.4],[-1.25,t,-1.4],[0,1,0],top);b.tri([0,-t,1.0],[-1.25,-t,-1.4],[1.25,-t,-1.4],[0,-1,0],bot);
  b.quad([-1.25,-t,-1.4],[1.25,-t,-1.4],[1.25,t,-1.4],[-1.25,t,-1.4],[0,0,-1],bot);b.quad([0,-t,1.0],[1.25,-t,-1.4],[1.25,t,-1.4],[0,t,1.0],[0.9,0,0.4],top);b.quad([0,-t,1.0],[0,t,1.0],[-1.25,t,-1.4],[-1.25,-t,-1.4],[-0.9,0,0.4],top);
  b.box(0,0.1,0,0.3,0.3,3.2,0,fus);
  const nz=2.3,c=[[-0.15,-0.05],[0.15,-0.05],[0.15,0.25],[-0.15,0.25]];for(let i=0;i<4;i++){const p=c[i],q=c[(i+1)%4];b.tri([p[0],p[1],1.6],[q[0],q[1],1.6],[0,0.1,nz],[0,1,0.5],i%2?fus:mulC(fus,0.8));}   // 彈頭
  b.box(0,0.1,-1.75,0.34,0.34,0.6,0,dark);b.box(0,0.1,-2.1,0.22,0.22,0.14,0,glow);
  for(const sx of[-1,1])b.box(sx*1.2,0.28,-1.25,0.04,0.58,0.55,0,fin);
  const m=b.toMesh('xxShahedProto',flatMat);return m;}
function buildMissile(){const b=newBatch(),body=hexRGB('#e9e8e2'),band=hexRGB('#b02a2a'),nose=hexRGB('#2f3236'),fin=hexRGB('#caccd0');   // 巡航導彈：圓柱彈身、尖頭、四片尾翼、尾部火焰
  const prism=(r,z0,z1,col,n)=>{for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU,am=(a0+a1)/2;b.quad([r*Math.cos(a0),r*Math.sin(a0),z0],[r*Math.cos(a1),r*Math.sin(a1),z0],[r*Math.cos(a1),r*Math.sin(a1),z1],[r*Math.cos(a0),r*Math.sin(a0),z1],[Math.cos(am),Math.sin(am),0],col);}};
  prism(0.3,-2.5,2.0,body,8);prism(0.31,0.4,0.9,band,8);
  for(let i=0;i<8;i++){const a0=i/8*TAU,a1=(i+1)/8*TAU,am=(a0+a1)/2;b.tri([0.3*Math.cos(a0),0.3*Math.sin(a0),2.0],[0.3*Math.cos(a1),0.3*Math.sin(a1),2.0],[0,0,3.4],[Math.cos(am),Math.sin(am),0.3],nose);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;b.box(Math.cos(a)*0.55,Math.sin(a)*0.55,-2.1,0.9*Math.abs(Math.cos(a))+0.05,0.9*Math.abs(Math.sin(a))+0.05,0.8,0,fin);}
  for(let i=0;i<6;i++){const a0=i/6*TAU,a1=(i+1)/6*TAU;b.tri([0.28*Math.cos(a0),0.28*Math.sin(a0),-2.5],[0.28*Math.cos(a1),0.28*Math.sin(a1),-2.5],[0,0,-6.0],[0,0,-1],i%2?[1,0.75,0.25]:[1,0.45,0.12]);}   // 火焰
  return b.toMesh('xxMissileProto',flatMat);}
function buildTracer(){const b=newBatch();b.box(0,0,0,0.14,0.14,5.5,0,[1,0.78,0.3]);b.box(0,0,0,0.3,0.3,1.4,0,[1,0.5,0.15]);return b.toMesh('xxTracerProto',flatMat);}
const POOL=(proto,n,sc)=>{proto.position.set(0,-500,0);proto.scaling.set(sc,sc,sc);const a=[];for(let i=0;i<n;i++){const m=proto.createInstance('xxFly'+i);m.scaling.set(sc,sc,sc);m.setEnabled(false);a.push(m);}return a;};
const droneProto=buildDrone(),missileProto=buildMissile(),tracerProto=buildTracer();
const dronePool=POOL(droneProto,16,2.6),missilePool=POOL(missileProto,6,2.2),tracerPool=POOL(tracerProto,48,1);
tracerProto.scaling.set(1,1,1);

// 爆炸：每個一顆閃光球＋火球粒子＋煙粒子（共 10 組輪流用）
const booms=[];let boomI=0;
for(let i=0;i<5;i++){const mat=M('#000000',{em:'#ffcf8a',alpha:1});mat.disableLighting=true;mat.backFaceCulling=false;
  const fl=MB.CreateSphere('xxBoomFlash',{diameter:1,segments:8},scene);fl.material=mat;fl.isPickable=false;fl.setEnabled(false);
  const pos=V3(0,-200,0),fire=mkPS('xxBoomFire',70,pos,true),smoke=mkPS('xxBoomSmoke',60,pos);
  fire.manualEmitCount=0;fire.emitRate=0;fire.color1=C4(1,0.86,0.4,1);fire.color2=C4(1,0.4,0.1,1);fire.colorDead=C4(0.2,0.03,0,0);fire.minLifeTime=0.5;fire.maxLifeTime=1.3;
  fire.direction1=V3(-1,-0.3,-1);fire.direction2=V3(1,1,1);fire.gravity=V3(0,-2,0);fire.minEmitBox=fire.maxEmitBox=V3(0,0,0);
  smoke.manualEmitCount=0;smoke.emitRate=0;smoke.color1=C4(0.08,0.08,0.08,0.75);smoke.color2=C4(0.3,0.26,0.22,0.6);smoke.colorDead=C4(0.2,0.2,0.2,0);smoke.minLifeTime=3;smoke.maxLifeTime=5.5;
  smoke.direction1=V3(-0.6,0.3,-0.6);smoke.direction2=V3(0.6,1,0.6);smoke.gravity=V3(0.8,1.0,0.3);smoke.minEmitBox=smoke.maxEmitBox=V3(0,0,0);
  fire.start();smoke.start();booms.push({fl,mat,pos,fire,smoke,t:9,dur:1,size:1});}
function spawnBoom(x,y,z,size){const b=booms[boomI=(boomI+1)%booms.length];b.t=0;b.dur=0.4+size*0.012;b.size=size;b.pos.set(x,y,z);
  b.fl.position.set(x,y,z);b.fl.scaling.set(size*0.15,size*0.15,size*0.15);if(!DBG.noBoom)b.fl.setEnabled(true);b.mat.alpha=1;
  b.fire.minSize=size*0.1;b.fire.maxSize=size*0.28;b.fire.minEmitPower=size*0.3;b.fire.maxEmitPower=size*0.9;b.fire.manualEmitCount=Math.round(14+size*1.1);
  b.smoke.minSize=size*0.18;b.smoke.maxSize=size*0.4;b.smoke.minEmitPower=size*0.05;b.smoke.maxEmitPower=size*0.2;b.smoke.manualEmitCount=Math.round(8+size*0.5);}
// 殘骸的尾煙（橘色火星→黑煙）、導彈的白色長煙跡
function trailPS(kind){const ps=mkPS('xxTrail',kind==='missile'?560:100,V3(0,-300,0));ps.minEmitBox=ps.maxEmitBox=V3(0,0,0);ps.emitRate=0;
  if(kind==='missile'){ps.color1=C4(1,0.9,0.7,0.9);ps.color2=C4(0.88,0.88,0.86,0.7);ps.colorDead=C4(0.6,0.6,0.6,0);ps.minSize=3;ps.maxSize=5;ps.minLifeTime=5;ps.maxLifeTime=7;ps.minEmitPower=0.2;ps.maxEmitPower=0.8;ps.direction1=V3(-0.3,0.2,-0.3);ps.direction2=V3(0.3,0.6,0.3);ps.gravity=V3(0.3,0.1,0);
    if(ps.addSizeGradient){ps.addSizeGradient(0,3,4.5);ps.addSizeGradient(1,11,16);}}
  else{ps.color1=C4(1,0.62,0.2,0.95);ps.color2=C4(0.16,0.15,0.14,0.85);ps.colorDead=C4(0.1,0.1,0.1,0);ps.minSize=2.4;ps.maxSize=4.2;ps.minLifeTime=2.2;ps.maxLifeTime=3.8;ps.minEmitPower=0.2;ps.maxEmitPower=1;ps.direction1=V3(-0.3,0.3,-0.3);ps.direction2=V3(0.3,1,0.3);ps.gravity=V3(0.5,0.6,0.2);
    if(ps.addSizeGradient){ps.addSizeGradient(0,2.4,4);ps.addSizeGradient(1,6,10);}}
  ps.start();return ps;}
const wreckTrails=[],missileTrails=[];for(let i=0;i<4;i++)wreckTrails.push(trailPS('wreck'));for(let i=0;i<6;i++)missileTrails.push(trailPS('missile'));
const impactFx=[];for(let i=0;i<3;i++){const pos=V3(0,-300,0),f=mkPS('xxImpactFire',130,pos,true),s=mkPS('xxImpactSmoke',240,pos);
  f.minEmitBox=V3(-4,0,-4);f.maxEmitBox=V3(4,0,4);f.color1=C4(1,0.66,0.16,1);f.color2=C4(1,0.3,0.05,1);f.colorDead=C4(0.25,0.02,0,0);f.minSize=5;f.maxSize=11;f.minLifeTime=0.8;f.maxLifeTime=1.6;f.emitRate=0;f.direction1=V3(-0.3,1,-0.3);f.direction2=V3(0.3,1,0.3);f.minEmitPower=2;f.maxEmitPower=5;f.gravity=V3(0,2,0);
  s.minEmitBox=V3(-4,0,-4);s.maxEmitBox=V3(4,0,4);s.color1=C4(0.06,0.06,0.06,0.85);s.color2=C4(0.26,0.22,0.19,0.65);s.colorDead=C4(0.2,0.2,0.2,0);s.minSize=12;s.maxSize=22;s.minLifeTime=8;s.maxLifeTime=14;s.emitRate=0;s.direction1=V3(-0.3,1,-0.3);s.direction2=V3(0.4,1,0.3);s.minEmitPower=2;s.maxEmitPower=4;s.gravity=V3(1,0.6,0.3);
  if(s.addSizeGradient){s.addSizeGradient(0,10,16);s.addSizeGradient(1,34,56);}
  f.start();s.start();impactFx.push({pos,f,s,t:0,on:false});}

// 若主程式有陰影（ShadowGenerator），特效物件（無人機、爆炸球、曳光彈、槍口火光）若被加進陰影清單，會在場上投出一大片陰影，
// 把地面和球都壓成黑的。這裡盡力把它們從所有陰影清單移除，並且關掉它們接收陰影。事件開始時、之後每 2 秒各做一次。
const FX_RE=/^(xxFly|xxBoomFlash|xxMuzzle|xxGun|xxShahed|xxMissile|xxTracer)/;
function stripShadows(){if(DBG.noShadowFix)return;try{scene.lights.forEach(l=>{const sg=l.getShadowGenerator&&l.getShadowGenerator();const sm=sg&&sg.getShadowMap&&sg.getShadowMap();
  if(sm&&sm.renderList){for(let i=sm.renderList.length-1;i>=0;i--)if(FX_RE.test(sm.renderList[i].name))sm.renderList.splice(i,1);}});
  scene.meshes.forEach(m=>{if(FX_RE.test(m.name))m.receiveShadows=false;});}catch(e){}}
stripShadows();
// ── 事件排程：第一次在載入後 25~60 秒，之後每隔 60~240 秒（1~4 分鐘）隨機發生；80% 無人機群（6~10 架）、20% 導彈（3~5 枚）
const RND=Math.random,ran=(a,b)=>a+RND()*(b-a),D=V3(0,0,0);
const ST={mode:'wait',wait:ran(25,60),t:0,d:[1,0],p:[0,1],drones:[],missiles:[],sched:[],busy:0};
const VTR=640,R_START=900,R_END=950;
function dirSetup(){const a=RND()*TAU;ST.d=[Math.sin(a),Math.cos(a)];ST.p=[-ST.d[1],ST.d[0]];}
function posOf(o,t){const tt=t,al=o.a0+o.spd*tt,lt=o.lat+(o.sway||0)*Math.sin(0.55*tt+o.ph2);
  return [CX0+ST.d[0]*al+ST.p[0]*lt,o.alt+(o.bob||0)*Math.sin(0.9*tt+o.ph),CZ0+ST.d[1]*al+ST.p[1]*lt];}
function nearestGun(p,maxD){let bi=-1,bd=maxD;guns.forEach((g,i)=>{const d=Math.hypot(p[0]-g.x,p[1]-g.y,p[2]-g.z);if(d<bd){bd=d;bi=i;}});return bi;}
function freeFrom(pool){for(const m of pool)if(!m.isEnabled())return m;return null;}
function fireTracer(gi,target,jit){if(DBG.noGuns)return;const g=guns[gi],m=freeFrom(tracerPool);if(!m&&!DBG.noTracer)return;
  const tx=target[0]+(jit?(RND()-0.5)*jit:0),ty=target[1]+(jit?(RND()-0.5)*jit:0),tz=target[2]+(jit?(RND()-0.5)*jit:0);
  const dx=tx-g.x,dy=ty-g.y,dz=tz-g.z,len=Math.hypot(dx,dy,dz)||1;D.set(tx,ty,tz);g.piv.lookAt(D);g.flash=0.06;g.fl.setEnabled(true);g.fl.scaling.setAll?g.fl.scaling.setAll(0.5+RND()*0.9):g.fl.scaling.set(0.8,0.8,0.8);
  const mx=g.x+dx/len*3.2,my=g.y+dy/len*3.2,mz=g.z+dz/len*3.2;if(DBG.noTracer||!m)return;m.position.set(mx,my,mz);m.lookAt(D);m.setEnabled(true);
  m._v=[dx/len*VTR,dy/len*VTR,dz/len*VTR];m._life=Math.max(0.05,(len-3.2)/VTR);}
function startDrones(){
  if(ST.mode==='run')return;stripShadows();dirSetup();ST.mode='run';ST.kind='drone';ST.t=0;ST.sched.length=0;ST.drones.length=0;
  const N=6+Math.floor(RND()*5),spd=46+RND()*10,lat0=(RND()-0.5)*240,alt0=60+RND()*60;
  for(let i=0;i<N;i++){const m=dronePool[i];m.setEnabled(true);
    const o={m,a0:-R_START-RND()*280,spd:spd+(RND()-0.5)*3,lat:lat0+(RND()-0.5)*190,alt:alt0+(RND()-0.5)*52,sway:7,bob:3.5,ph:RND()*TAU,ph2:RND()*TAU,dead:false,done:false,kill:-1,gun:-1};
    o.tEnd=(R_END-o.a0)/o.spd;
    if(RND()<0.5){for(let t=0;t<o.tEnd;t+=0.5){const p=posOf(o,t);if(nearestGun(p,330)>=0){o.kill=t+RND()*7;break;}}
      if(o.kill>=0&&o.kill<o.tEnd){const p=posOf(o,o.kill);o.gun=nearestGun(p,420);if(o.gun<0)o.kill=-1;
        else for(let j=0;j<3;j++){const arr=o.kill-j*0.09,tg=posOf(o,arr),g=guns[o.gun],dist=Math.hypot(tg[0]-g.x,tg[1]-g.y,tg[2]-g.z);ST.sched.push({t:arr-dist/VTR,gi:o.gun,tg,jit:j?5:0});}}else o.kill=-1;}
    ST.drones.push(o);}
  ST.sched.sort((a,b)=>a.t-b.t);
}
function startMissiles(){
  if(ST.mode==='run')return;stripShadows();dirSetup();ST.mode='run';ST.kind='missile';ST.t=0;ST.sched.length=0;ST.missiles.length=0;
  const N=3+Math.floor(RND()*3),spd=170+RND()*50,lat0=(RND()-0.5)*160,alt0=140+RND()*120;
  for(let i=0;i<N;i++){const m=missilePool[i];m.setEnabled(true);const imp=RND()<0.5;
    ST.missiles.push({m,a0:-R_START-i*45,spd,lat:lat0+(i-N/2)*34+(RND()-0.5)*10,alt:alt0+(RND()-0.5)*30,sway:0,bob:6,ph:RND()*TAU,ph2:0,limp:imp?340+RND()*260:null,done:false,trail:missileTrails[i%missileTrails.length]});
    const tr=missileTrails[i%missileTrails.length];tr.emitter=m;tr.emitRate=70;}
}
function missileY(o,al){if(o.limp==null)return o.alt+o.bob*Math.sin(0.4*al/o.spd+o.ph);const k=clamp((al-(o.limp-150))/150,0,1);return Math.max(0.5,o.alt*(1-k)+0.5);}
function endEvent(){ST.mode='wait';ST.wait=ran(60,240);ST.drones.forEach(o=>o.m.setEnabled(false));ST.missiles.forEach(o=>{o.m.setEnabled(false);o.trail.emitRate=0;});}
let wtI=0;
function stepEvent(dt){
  ST.t+=dt;const t=ST.t;
  // 曳光彈的排程發射
  while(ST.sched.length&&ST.sched[0].t<=t){const s=ST.sched.shift();fireTracer(s.gi,s.tg,s.jit);}
  if(ST.kind==='drone'){
    let alive=0;
    for(const o of ST.drones){if(o.done)continue;alive++;
      if(!o.dead){const p=posOf(o,t),q=posOf(o,t+0.05);if(t>o.tEnd){o.m.setEnabled(false);o.done=true;continue;}
        o.m.position.set(p[0],p[1],p[2]);D.set(q[0],q[1],q[2]);o.m.lookAt(D);
        if(o.kill>=0&&t>=o.kill){o.dead=true;spawnBoom(p[0],p[1],p[2],16+RND()*6);
          const sp=o.spd*(0.35+RND()*0.3);o.w={vx:ST.d[0]*sp+(RND()-0.5)*8,vy:2+RND()*4,vz:ST.d[1]*sp+(RND()-0.5)*8,sx:(RND()-0.5)*5,sz:(RND()-0.5)*7};
          o.tr=wreckTrails[wtI=(wtI+1)%wreckTrails.length];o.tr.emitter=o.m;o.tr.emitRate=70;}}
      else{const w=o.w;w.vy-=9.8*dt;const m=o.m;m.position.set(m.position.x+w.vx*dt,m.position.y+w.vy*dt,m.position.z+w.vz*dt);m.rotation.x+=w.sx*dt;m.rotation.z+=w.sz*dt;
        if(m.position.y<0.5){spawnBoom(m.position.x,0.8,m.position.z,9);m.setEnabled(false);if(o.tr.emitter===m)o.tr.emitRate=0;o.done=true;}}}
    if(!alive&&!ST.sched.length)endEvent();
  }else{
    let alive=0;
    for(const o of ST.missiles){if(o.done)continue;alive++;const al=o.a0+o.spd*t,p=posOf(o,t),y=missileY(o,al),al2=al+o.spd*0.05,y2=missileY(o,al2);
      o.m.position.set(p[0],y,p[2]);D.set(CX0+ST.d[0]*al2+ST.p[0]*o.lat,y2,CZ0+ST.d[1]*al2+ST.p[1]*o.lat);o.m.lookAt(D);
      if(o.limp!=null&&al>=o.limp){o.done=true;o.m.setEnabled(false);o.trail.emitRate=0;spawnBoom(p[0],1,p[2],60);
        const fx=impactFx.find(f=>!f.on)||impactFx[0];fx.on=true;fx.t=0;fx.pos.set(p[0],0.5,p[2]);fx.f.emitter=fx.pos;fx.s.emitter=fx.pos;fx.f.emitRate=50;fx.s.emitRate=18;}
      else if(al>R_END){o.done=true;o.m.setEnabled(false);o.trail.emitRate=0;}}
    if(!alive)endEvent();
  }
}
// 每幀：事件、曳光彈、爆炸、槍口火光、衝擊火場
let shT=0;
const tObs=scene.onBeforeRenderObservable.add(()=>{
  if(anchor.isDisposed()){scene.onBeforeRenderObservable.remove(tObs);PSL.forEach(p=>{try{p.dispose();}catch(e){}});return;}   // 換球場：粒子系統自己清掉
  const dt=clamp(scene.getEngine().getDeltaTime()/1000,0,0.1);if(dt<=0)return;
  shT+=dt;if(shT>2){shT=0;stripShadows();}
  if(ST.mode==='wait'){ST.wait-=dt;if(ST.wait<=0){if(RND()<0.8)startDrones();else startMissiles();}}else stepEvent(dt);
  for(const m of tracerPool){if(!m.isEnabled())continue;m._life-=dt;if(m._life<=0){m.setEnabled(false);continue;}m.position.set(m.position.x+m._v[0]*dt,m.position.y+m._v[1]*dt,m.position.z+m._v[2]*dt);}
  for(const b of booms){if(b.t>=b.dur+0.2)continue;b.t+=dt;const k=b.t/b.dur;if(k>=1){b.fl.setEnabled(false);b.t=b.dur+0.3;continue;}const s=b.size*(0.15+0.45*Math.sqrt(k));b.fl.scaling.set(s,s,s);b.mat.alpha=1-k*k;}
  for(const g of guns){if(g.flash>0){g.flash-=dt;if(g.flash<=0)g.fl.setEnabled(false);}}
  for(const f of impactFx){if(!f.on)continue;f.t+=dt;if(f.t>55){f.on=false;f.f.emitRate=0;f.s.emitRate=0;}else if(f.t>30)f.f.emitRate=Math.max(0,50*(1-(f.t-30)/25));}
});
if(ctx.__warDebug)ctx.__warDebug({startDrones,startMissiles,ST,stepEvent,PSL,guns,booms,tracerPool,dronePool});   // 測試用掛鉤（正式主程式沒有這個欄位）

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
(window.BaseballStadiums=window.BaseballStadiums||{}).war={id:'war',name:'戰爭球場（被炸毀的廢墟）',build:build};
})();
