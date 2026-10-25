/*
 * 夢幻球場（id: dream）
 * 介面規格請參考 stadium-otsu.js 開頭的「球場外掛開發指南」；本檔只使用該指南中列出的 ctx 功能。
 *
 *  風格重點
 *   · 草地：繽紛的粉色草皮（柔和斜紋＋閃亮星芒、愛心、彩色糖粒）；內野草皮是更濃的覆盆子粉，內野土區像撒了彩色糖針的餅乾。
 *   · 外野牆：圓弧形（12 段），牆面輪流是粉／薄荷／薰衣草紫／奶油黃／天空藍，貼有波浪花邊、圓點、愛心、星星，
 *     牆頂有一排白色棉花糖小圓球。牆距 102 m（約 335 呎，符合規則）、牆高 4 m。
 *   · 外野看台（6 區、4 階）外側：高高矮矮、前後兩排的巨大棒棒糖（漩渦糖面＋糖果紋棒身＋蝴蝶結），
 *     腳邊散落軟糖，天上飄著棉花糖雲。
 *   · 記分板：夢幻電子記分板——紫色漸層底、LED 點陣格線、霓虹發光數字、粉色邊框＋閃爍彩燈泡，立在中外野看台後方。
 *   · 本檔「不」設定天空／霧／光源——那些由主程式的天氣系統決定。
 */
(function(){
'use strict';
function build(ctx){
const {BABYLON,scene,MB,M,put,texMat,lpt,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const SQ=Math.SQRT1_2,TAU=Math.PI*2,V4=(a,b,c,d)=>new BABYLON.Vector4(a,b,c,d);

// ═════════ ① 共用工具 ═════════
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const tile=(S,x,y,m,fn)=>{if(x>m&&x<S-m&&y>m&&y<S-m)return fn(0,0);for(const dx of[-S,0,S])for(const dy of[-S,0,S])fn(dx,dy);};
const newTex=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const fillNoise=(g,S,rnd,r,gr,b,amp)=>{const img=g.createImageData(S,S),d=img.data;for(let i=0;i<S*S;i++){const k=1-amp+rnd()*2*amp;d[i*4]=r*k;d[i*4+1]=gr*k;d[i*4+2]=b*k;d[i*4+3]=255;}g.putImageData(img,0,0);};
const hex2rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const dim=(h,k)=>{const c=hex2rgb(h).map(v=>Math.round(v*k));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');};
// 糖果色材質：本色＋一點點自發光，讓顏色在任何天氣下都鮮豔
const candy=(h,k)=>M(h,{em:dim(h,k==null?0.55:k)});
// 四芒星、愛心（貼圖與記分板共用）
const star4=(g,x,y,r)=>{g.beginPath();g.moveTo(x,y-r);g.quadraticCurveTo(x,y,x+r,y);g.quadraticCurveTo(x,y,x,y+r);g.quadraticCurveTo(x,y,x-r,y);g.quadraticCurveTo(x,y,x,y-r);g.closePath();g.fill();};
const heart=(g,x,y,s)=>{g.beginPath();g.moveTo(x,y+s*0.9);g.bezierCurveTo(x-s*1.6,y-s*0.2,x-s*0.7,y-s*1.2,x,y-s*0.4);g.bezierCurveTo(x+s*0.7,y-s*1.2,x+s*1.6,y-s*0.2,x,y+s*0.9);g.closePath();g.fill();};

const PASTEL=['#ff9ccb','#9de8cf','#c3a8ff','#ffe08a','#9ed8ff'];

// 一段牆＝一個長方盒（旋轉後的長方盒碰撞很準，也只佔一個碰撞物件）
function wallSeg(ax,az,bx,bz,h,th,mat,fence,outfield,capMat,ext){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2;
  const b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th}),cx,h/2,cz,mat);b.rotation.y=ang;
  if(fence)registerFenceCollider(b,!!outfield);
  if(capMat){const c=put(MB.CreateBox('xxCap',{width:len+0.1,height:0.3,depth:th+0.3}),cx,h+0.15,cz,capMat);c.rotation.y=ang;}
  return b;
}
function ghostBox(cx,cy,cz,w,h,d,ang,kind){
  const b=put(MB.CreateBox('xxHit',{width:w,height:h,depth:d}),cx,cy,cz,null);b.rotation.y=ang;b.isVisible=false;registerBallSolid(b,kind);return b;
}
// 把一堆同材質的小 mesh 合成一個（減少繪製數量）
function merge(arr,name){if(!arr.length)return null;const m=BABYLON.Mesh.MergeMeshes(arr,true,true);if(m){m.name=name;m.isPickable=false;}return m;}

// ═════════ ② 貼圖：粉色草地、糖針土區、牆面、觀眾、糖果 ═════════
// 粉色草皮：底色＋柔和的 45° 割草斜紋（無縫）＋色塊＋草葉＋閃亮星芒＋愛心＋彩色糖粒。1024px 貼圖鋪 32 m。
function grassTexture(name,seed,base,band,blades){
  const S=1024,t=newTex(name,S,S),g=t.getContext(),rnd=rng(seed);
  fillNoise(g,S,rnd,base[0],base[1],base[2],0.05);
  const w=S/8;g.fillStyle=band;
  for(let k=0;k<16;k+=2){g.beginPath();g.moveTo(k*w,0);g.lineTo((k+1)*w,0);g.lineTo((k+1)*w-S,S);g.lineTo(k*w-S,S);g.closePath();g.fill();}
  const blobs=['rgba(255,255,255,0.07)','rgba(255,110,175,0.06)','rgba(190,150,255,0.06)','rgba(150,235,215,0.05)'];
  for(let n=0;n<260;n++){const x=rnd()*S,y=rnd()*S,r=25+rnd()*90,col=blobs[(rnd()*blobs.length)|0];
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=col;g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  const bl=['rgba(255,120,175,0.5)','rgba(255,170,205,0.5)','rgba(255,205,225,0.5)','rgba(224,100,160,0.45)','rgba(255,255,255,0.35)'];
  for(let n=0;n<blades;n++){const x=rnd()*S,y=rnd()*S,len=5+rnd()*9,a=-1.57+(rnd()-0.5)*1.3;
    tile(S,x,y,14,(dx,dy)=>{g.strokeStyle=bl[(rnd()*bl.length)|0];g.lineWidth=0.8+rnd()*1.0;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*len,y+dy+Math.sin(a)*len);g.stroke();});}
  const conf=['#ffffff','#7fe3ff','#ffe45e','#9ff0c8','#c3a8ff'];
  for(let n=0;n<240;n++){const x=rnd()*S,y=rnd()*S,col=conf[n%conf.length],r=1.3+rnd()*1.8;
    tile(S,x,y,5,(dx,dy)=>{g.fillStyle=col;g.globalAlpha=0.7;g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();g.globalAlpha=1;});}
  for(let n=0;n<34;n++){const x=rnd()*S,y=rnd()*S,s=3+rnd()*3;
    tile(S,x,y,10,(dx,dy)=>{g.fillStyle=n%2?'rgba(255,255,255,0.40)':'rgba(255,90,160,0.32)';heart(g,x+dx,y+dy,s);});}
  for(let n=0;n<110;n++){const x=rnd()*S,y=rnd()*S,r=3+rnd()*5;
    tile(S,x,y,12,(dx,dy)=>{g.fillStyle='rgba(255,255,255,0.85)';star4(g,x+dx,y+dy,r);});}
  t.update();return t;
}
// 內野土區：奶油蜜桃色的「餅乾土」，撒滿彩色糖針。512px 貼圖鋪 10 m。
function dirtTexture(){
  const S=512,t=newTex('xxDirt',S,S),g=t.getContext(),rnd=rng(23);
  fillNoise(g,S,rnd,248,216,182,0.06);
  for(let n=0;n<120;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*46,lt=rnd()<0.5;
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=lt?'rgba(255,255,255,0.10)':'rgba(236,170,140,0.08)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  for(let n=0;n<420;n++){const x=rnd()*S,y=rnd()*S,rx=1.5+rnd()*3.5;
    tile(S,x,y,8,(dx,dy)=>{g.fillStyle='rgba(214,170,134,0.45)';g.beginPath();g.ellipse(x+dx,y+dy,rx,rx*0.7,rnd()*3.14,0,TAU);g.fill();});}
  const sp=['#ff6fae','#5fd0ff','#ffe45e','#7be8b0','#b794ff','#ffffff','#ff9a5c'];
  for(let n=0;n<300;n++){const x=rnd()*S,y=rnd()*S,rot=rnd()*3.14,len=5+rnd()*3,col=sp[n%sp.length];
    tile(S,x,y,10,(dx,dy)=>{g.save();g.translate(x+dx,y+dy);g.rotate(rot);g.fillStyle=col;g.fillRect(-len/2,-1.1,len,2.2);g.restore();});}
  g.lineWidth=1;for(let n=0;n<50;n++){const y=rnd()*S;g.strokeStyle='rgba(190,140,110,0.10)';g.beginPath();g.moveTo(0,y);g.lineTo(S,y);g.stroke();}
  t.update();return t;
}
// 外野牆：底色＋頂部白色波浪花邊＋圓點／愛心／星星交錯。768×232（約等於 13 m × 4 m 的比例）。
function wallMat(base){
  const W=768,H=232,t=newTex('xxWallTex',W,H),g=t.getContext();
  g.fillStyle=base;g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,0.20)';g.fillRect(0,62,W,H-62-26);              // 中段略亮
  g.fillStyle='rgba(0,0,0,0.10)';g.fillRect(0,H-26,W,26);                       // 底邊略深
  g.fillStyle='#ffffff';g.fillRect(0,0,W,30);
  for(let i=0;i<12;i++){g.beginPath();g.arc(i*64+32,30,32,0,Math.PI);g.fill();}      // 波浪花邊
  g.strokeStyle='rgba(255,255,255,0.8)';g.lineWidth=5;g.beginPath();
  for(let x=0;x<=W;x+=8){const y=H-14+Math.sin(x/64*Math.PI*2)*5;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();   // 底部波紋
  g.fillStyle='rgba(255,255,255,0.80)';
  for(let r=0;r<3;r++)for(let c=0;c<12;c++){const x=c*64+(r%2?64:32)-(r%2?0:0),y=104+r*38,k=(r+c)%3;if(x>W-8)continue;
    if(k===0){g.beginPath();g.arc(x,y,8,0,TAU);g.fill();}else if(k===1)heart(g,x,y,7);else star4(g,x,y,10);}
  t.update();return texMat(t,1);
}
// 觀眾：粉嫩色系的衣服，偶爾戴派對帽；front＝座位立面，top＝座位平面（俯視看到頭頂）。
const CROWD_PEOPLE=14,CROWD_TW=CROWD_PEOPLE*0.5333,CROWD_ROW=0.8,CROWD_STEP=1.1;
function crowdTextures(){
  const W=CROWD_PEOPLE*64,rnd=rng(5),
    shirts=['#ffd1ec','#ffffff','#ff8fcf','#9ed8ff','#9de8cf','#ffe08a','#c3a8ff','#ffb3c1','#7cc8ff','#f7a8ff'],
    skins=['#f6d4b4','#f1c7a0','#e0ad82','#c98f63'],hairs=['#2c231d','#4a3626','#ff8fcf','#8a6bd8','#10100f','#e8c35a'];
  const front=newTex('xxCrowdF',W,96),gf=front.getContext(),top=newTex('xxCrowdT',W,132),gt=top.getContext();
  gf.fillStyle='#5a4a86';gf.fillRect(0,0,W,96);gt.fillStyle='#6b5a9a';gt.fillRect(0,0,W,132);
  for(let i=0;i<CROWD_PEOPLE;i++){const cx=i*64+32+(rnd()-0.5)*8,sh=shirts[(rnd()*shirts.length)|0],sk=skins[(rnd()*skins.length)|0],hr=hairs[(rnd()*hairs.length)|0];
    gf.fillStyle=sh;gf.beginPath();gf.ellipse(cx,84,26,34,0,0,TAU);gf.fill();
    gf.fillStyle=sk;gf.beginPath();gf.arc(cx,34,13,0,TAU);gf.fill();
    gf.fillStyle=hr;gf.beginPath();gf.arc(cx,29,13.5,3.14,TAU);gf.fill();
    if(rnd()<0.35){gf.fillStyle=PASTEL[(rnd()*5)|0];gf.beginPath();gf.moveTo(cx-9,20);gf.lineTo(cx+9,20);gf.lineTo(cx,0);gf.closePath();gf.fill();gf.fillStyle='#fff';gf.beginPath();gf.arc(cx,2,3,0,TAU);gf.fill();}   // 派對帽
    gt.fillStyle=sh;gt.beginPath();gt.ellipse(cx,66,26,15,0,0,TAU);gt.fill();gt.fillStyle=hr;gt.beginPath();gt.arc(cx,66,12,0,TAU);gt.fill();}
  front.update();top.update();return {front,top};
}
// 棒棒糖的漩渦糖面：極座標色帶（顏色、旋臂數、扭轉度），外緣一圈白邊。
function swirlMat(cols,twist){
  const S=256,t=newTex('xxSwirl',S,S),g=t.getContext(),img=g.createImageData(S,S),d=img.data,n=cols.length,rgb=cols.map(hex2rgb),arms=n===2?3:2;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const dx=(x+0.5)/S*2-1,dy=(y+0.5)/S*2-1,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
    let c;if(r>0.9||r<0.07)c=[255,255,255];else{const k=a/TAU*arms*n+r*twist,i=((Math.floor(k)%n)+n)%n;c=rgb[i];if(r>0.8){const f=(r-0.8)/0.1;c=c.map(v=>v+(255-v)*f*0.35);}}
    const o=(y*S+x)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}
  g.putImageData(img,0,0);t.update();return texMat(t,1);
}
// 糖果紋（45° 斜條紋，無縫）：用在棒棒糖的棒身與界外極柱
function stripeMat(c1,c2){
  const S=64,t=newTex('xxStripe',S,S),g=t.getContext(),img=g.createImageData(S,S),d=img.data,a=hex2rgb(c1),b=hex2rgb(c2);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const c=((x+y)%32)<16?a:b,o=(y*S+x)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}
  g.putImageData(img,0,0);t.update();return texMat(t,1);
}

// ═════════ ③ 地面與外野牆（圓弧）═════════
const grassTex=grassTexture('xxGrass',11,[248,160,200],'rgba(255,255,255,0.10)',20000);
const infTex=grassTexture('xxInfield',31,[244,128,184],'rgba(255,255,255,0.12)',16000);
const dirtTex=dirtTexture();
ctx.makeGround(texMat(grassTex,1));
ctx.setFieldMats({infield:texMat(infTex,1),dirt:texMat(dirtTex,1),home:texMat(dirtTex,0.96),mound:texMat(dirtTex,1.05)});

const R=102,N=12,WALL_H=4.0,FENCE_TOP=WALL_H+0.3;       // 牆半徑 102 m；圓弧切成 12 段（每段 7.5°）
const OF=[];for(let i=0;i<=N;i++){const a=(-45+i*90/N)*Math.PI/180;OF.push([R*Math.sin(a),R*Math.cos(a)]);}
function fenceAt(deg){                                  // 與實體牆一致：從本壘板往該角度射線，回傳與折線牆的交點距離
  const a=Math.max(-45,Math.min(45,deg))*Math.PI/180,dx=Math.sin(a),dz=Math.cos(a);
  for(let i=0;i<N;i++){const A=OF[i],B=OF[i+1],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
    const t=(A[0]*ez-A[1]*ex)/den,u=(A[0]*dz-A[1]*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)return t;}
  return R;
}
const wallMats=PASTEL.map(wallMat),capMat=M('#ffffff',{em:'#ffd9ee'});
const bumpGroups=PASTEL.map(()=>[]);                    // 牆頂棉花糖小圓球（依顏色分組後合併）
for(let i=0;i<N;i++){
  const A=OF[i],B=OF[i+1],ci=i%5,len=Math.hypot(B[0]-A[0],B[1]-A[1]);
  wallSeg(A[0],A[1],B[0],B[1],WALL_H,0.6,wallMats[ci],true,true,capMat,0.7);
  const nb=Math.round(len/2.2);
  for(let k=0;k<nb;k++){const f=(k+0.5)/nb,b=MB.CreateSphere('xxBump',{diameter:1.15,segments:6},scene);b.position.set(A[0]+(B[0]-A[0])*f,WALL_H+0.5,A[1]+(B[1]-A[1])*f);bumpGroups[ci].push(b);}
}
bumpGroups.forEach((arr,i)=>{const m=merge(arr,'xxBumps');if(m)m.material=candy(PASTEL[i],0.7);});
// 界外極柱：糖果紋＋頂端粉紅球（只是外觀）
const poleMat=stripeMat('#ff5fa8','#ffffff'),poleTop=candy('#ff5fa8',0.8);
[-1,1].forEach(s=>{
  const p=MB.CreateCylinder('xxPole',{diameter:0.34,height:18,tessellation:12,faceUV:[V4(0,0,1,1),V4(0,0,2,8),V4(0,0,1,1)]},scene);put(p,s*R*SQ,9,R*SQ,poleMat);
  put(MB.CreateSphere('xxPoleTop',{diameter:0.9,segments:8},scene),s*R*SQ,18.2,R*SQ,poleTop);
});

// ═════════ ④ 看台（粉嫩觀眾）═════════
const crowd=crowdTextures();
const cf=M('#000000');cf.emissiveTexture=crowd.front;cf.disableLighting=true;cf.backFaceCulling=false;
const ct=M('#000000');ct.emissiveTexture=crowd.top;ct.disableLighting=true;ct.backFaceCulling=false;
const crowdMat=new BABYLON.MultiMaterial('xxCrowd',scene);crowdMat.subMaterials=[cf,ct];
const concrete=candy('#f1e3f7',0.6);
// 階梯式看台（立面貼一排人、踏面貼俯視人頭）。碰撞方盒每座只用 2 個（前半低、後半高）＋1 面後牆。
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
  const ang=Math.atan2(-dz,dx),mx=(ax+bx)/2,mz=(az+bz)/2,half=Math.ceil(tiers/2);
  [[0,half],[half,tiers]].forEach(([a,b])=>{if(b<=a)return;
    const o0=gap+a*CROWD_STEP,o1=gap+b*CROWD_STEP,topH=top0+(b-1)*CROWD_ROW,oc=(o0+o1)/2;
    ghostBox(mx+nx*oc,topH/2,mz+nz*oc,L,topH,o1-o0+0.1,ang,'spectator');});
  const backOff=gap+tiers*CROWD_STEP+0.3,bh=top0+tiers*CROWD_ROW+1.6;
  const bw=put(MB.CreateBox('xxStandBack',{width:L,height:bh,depth:0.6}),mx+nx*backOff,bh/2,mz+nz*backOff,concrete);bw.rotation.y=ang;registerBallSolid(bw,'spectator');
}
for(let i=0;i<6;i++)stand(OF[2*i][0],OF[2*i][1],OF[2*i+2][0],OF[2*i+2][1],4,1.8,4.6,1.2);   // 外野 6 座，每座跨兩段牆

// ═════════ ⑤ 界外牆、擋球牆、球員休息區 ═════════
const FOUL_OFF=19,homeBackZ=-20;
const foulMat=candy('#ffb3d9',0.5),foulMat2=candy('#c9b3ff',0.5),trim=M('#ffffff',{em:'#ffd9ee'});
wallSeg(-12,homeBackZ,12,homeBackZ,3.4,0.6,foulMat2,true,false,trim,0.6);
const sides=[-1,1];
sides.forEach(s=>{
  const a=lpt(s,0,FOUL_OFF),b=lpt(s,R,FOUL_OFF),pole=lpt(s,R,0);
  wallSeg(s*12,homeBackZ,a.x,a.z,3.0,0.6,foulMat2,true,false,trim,0.6);
  wallSeg(a.x,a.z,b.x,b.z,2.8,0.6,foulMat,true,false,trim,0.6);
  wallSeg(pole.x,pole.z,b.x,b.z,2.8,0.6,foulMat,true,false,trim,0.6);
  const sa=lpt(s,8,FOUL_OFF),sb=lpt(s,70,FOUL_OFF);stand(sa.x,sa.z,sb.x,sb.z,4,1.4,3.6,0);
});
stand(-12,homeBackZ,12,homeBackZ,5,1.4,4.0,2);

// 球員休息區：凹在界外牆前的薄荷色小棚子
const DUG_R=19,DUG_FRONT=12.5,benchMat=candy('#fff0c9',0.5),roofMat=candy('#9de8cf',0.6),slab=candy('#e6d7f5',0.5);
sides.forEach(s=>{
  const ang=Math.atan2(-SQ,s*SQ),c=lpt(s,DUG_R,(DUG_FRONT+FOUL_OFF)/2);
  const floor=put(MB.CreateBox('xxDugFloor',{width:14,height:0.06,depth:FOUL_OFF-DUG_FRONT}),c.x,0.04,c.z,slab);floor.rotation.y=ang;
  const roof=put(MB.CreateBox('xxDugRoof',{width:14.6,height:0.18,depth:FOUL_OFF-DUG_FRONT+0.8}),c.x,2.7,c.z,roofMat);roof.rotation.y=ang;registerBallSolid(roof);
  const bn=lpt(s,DUG_R,FOUL_OFF-1.2),bench=put(MB.CreateBox('xxDugBench',{width:11,height:0.5,depth:0.7}),bn.x,0.3,bn.z,benchMat);bench.rotation.y=ang;
  const f0=lpt(s,DUG_R-7,DUG_FRONT),f1=lpt(s,DUG_R-1.3,DUG_FRONT),f2=lpt(s,DUG_R+1.3,DUG_FRONT),f3=lpt(s,DUG_R+7,DUG_FRONT);
  wallSeg(f0.x,f0.z,f1.x,f1.z,1.1,0.4,foulMat,true,false,trim,0);
  wallSeg(f2.x,f2.z,f3.x,f3.z,1.1,0.4,foulMat,true,false,trim,0);
});

// ═════════ ⑥ 外野看台外側的夢幻裝置：棒棒糖、軟糖、棉花糖雲 ═════════
// 都是純外觀（不參與碰撞）；全部放在看台後牆（約 109 m）之外，球不會飛到這裡。
const swirls=[['#ff7eb6','#ffffff'],['#7be0c3','#ffffff'],['#b794ff','#ffd1ec'],['#ffd84d','#ff9a5c'],['#7cc8ff','#ffffff'],['#ff5a7a','#ffffff'],['#ff8fcf','#b794ff','#7cc8ff'],['#ffe27a','#9be8c6','#ff9ccb']]
  .map((c,i)=>swirlMat(c,4+(i%3)*1.5));
const stripes=[stripeMat('#ff5fa8','#ffffff'),stripeMat('#58d6b0','#ffffff')];
const rimMat=M('#ffffff',{em:'#ffe3f2'}),bowMats=['#ff5fa8','#5fd0ff','#ffd84d','#9b7bff'].map(c=>candy(c,0.7));
function lolly(x,z,h,dia,pi,tilt){
  const phi=Math.atan2(x,z),sd=0.8+dia*0.045;
  const stick=MB.CreateCylinder('xxStick',{diameter:sd,height:h,tessellation:14,faceUV:[V4(0,0,1,1),V4(0,0,2,h/2.4),V4(0,0,1,1)]},scene);
  put(stick,x,h/2,z,stripes[pi%2]);
  const cy=h+dia*0.42;
  const disc=MB.CreateCylinder('xxCandy',{diameter:dia,height:1.1,tessellation:48,faceUV:[V4(0,0,1,1),V4(0.5,0.5,0.5,0.5),V4(0,0,1,1)]},scene);
  put(disc,x,cy,z,swirls[pi%swirls.length]);disc.rotation.set(Math.PI/2-tilt,phi,0);
  const rim=MB.CreateTorus('xxRim',{diameter:dia,thickness:1.25,tessellation:48},scene);
  put(rim,x,cy,z,rimMat);rim.rotation.set(Math.PI/2-tilt,phi,0);
  const bm=bowMats[pi%bowMats.length],by=h-dia*0.08-1.3,bx=x-Math.sin(phi)*0.7,bz=z-Math.cos(phi)*0.7,tx=Math.cos(phi),tz=-Math.sin(phi);
  [-1,1].forEach(sg=>{const w=put(MB.CreateSphere('xxBow',{diameter:2.2,segments:8},scene),bx+tx*sg*1.1,by,bz+tz*sg*1.1,bm);w.scaling.set(1.1,0.7,0.5);w.rotation.y=phi;w.rotation.z=sg*0.25;});
  put(MB.CreateSphere('xxBowKnot',{diameter:1.0,segments:8},scene),bx,by,bz,bm);
}
const rl=rng(2026);
function layer(count,a0,a1,r0,r1,h0,h1,d0,d1,skipCenter){
  for(let i=0;i<count;i++){
    const adeg=a0+(a1-a0)*(i+0.5)/count+(rl()-0.5)*3;if(skipCenter&&Math.abs(adeg)<13)continue;
    const a=adeg*Math.PI/180,r=r0+rl()*(r1-r0),hi=i%3===0?1:(i%3===1?0.2:0.62),h=h0+(h1-h0)*(hi*0.8+rl()*0.2),dia=d0+(d1-d0)*(0.3+hi*0.5+rl()*0.2);   // 高矮起落
    lolly(r*Math.sin(a),r*Math.cos(a),h,dia,(i*3+(rl()*3|0))%8,(rl()-0.5)*0.3);
  }
}
layer(15,-62,62,117,122,11,26,7,11,true);     // 前排：較矮、較近（中外野正後方是記分板，所以略過）
layer(13,-66,66,130,138,30,50,12,18,false);   // 後排：又高又大，從記分板後面探出頭
// 腳邊軟糖（半嵌在地裡的扁球）
{const gd=PASTEL.concat(['#ff7a7a']).map(()=>[]),cols=PASTEL.concat(['#ff7a7a']),rg=rng(77);
  for(let i=0;i<70;i++){const a=(rg()*140-70)*Math.PI/180,r=111+rg()*18,D=2.2+rg()*3.6,k=(rg()*cols.length)|0;
    const b=MB.CreateSphere('xxGum',{diameter:D,segments:8},scene);b.position.set(r*Math.sin(a),D*0.22,r*Math.cos(a));b.scaling.y=0.7;gd[k].push(b);}
  gd.forEach((arr,i)=>{const m=merge(arr,'xxGumdrops');if(m)m.material=candy(cols[i],0.65);});}
// 棉花糖雲（幾顆球疊成一朵，半透明、自帶柔光）
{const rc=rng(909);
  for(let i=0;i<9;i++){const a=((i/8)*130-65+(rc()-0.5)*8)*Math.PI/180,r=170+rc()*70,cx=r*Math.sin(a),cz=r*Math.cos(a),cy=60+rc()*30,parts=[];
    for(let k=0;k<5;k++){const D=14+rc()*10,p=MB.CreateSphere('xxCloudP',{diameter:D,segments:8},scene);p.position.set(cx+(k-2)*9+(rc()-0.5)*4,cy+(rc()-0.5)*5-(k%2?2:0),cz+(rc()-0.5)*6);p.scaling.y=0.65;parts.push(p);}
    const m=merge(parts,'xxCloud');if(m)m.material=M(i%2?'#ffe3f4':'#e3f1ff',{em:i%2?'#ffc7e6':'#bcdcff',alpha:0.88});}}

// ═════════ ⑦ 夢幻電子記分板 ═════════
// 立在中外野看台後方（z≈112.5），下緣離地約 10 m、高過看台。貼圖 1536×512（3:1），板面 42×14 m。
const BW=42,BH=14,BOARD_Y=18,BOARD_Z=112.5;
const boardTex=sbTexInit();
const faceMat=M('#000000');faceMat.emissiveTexture=boardTex;faceMat.disableLighting=true;faceMat.backFaceCulling=false;
put(MB.CreatePlane('xxBoardFace',{width:BW,height:BH,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),0,BOARD_Y,BOARD_Z-0.42,faceMat);
const frame=put(MB.CreateBox('xxBoardFrame',{width:BW+1.2,height:BH+1.2,depth:0.8}),0,BOARD_Y,BOARD_Z,candy('#ff8cc6',0.6));registerBallSolid(frame,'scoreboard');
{ // 邊框彩燈泡（依顏色合併）＋頂端棉花糖雲朵
  const bc=['#ffe45e','#5fd0ff','#ff5fa8','#8dffc0'],groups=bc.map(()=>[]),perim=[];
  for(let x=-BW/2;x<=BW/2+0.01;x+=2.1){perim.push([x,BH/2+0.3],[x,-BH/2-0.3]);}
  for(let y=-BH/2+2.1;y<BH/2-0.5;y+=2.1){perim.push([-BW/2-0.3,y],[BW/2+0.3,y]);}
  perim.forEach((p,i)=>{const b=MB.CreateSphere('xxBulb',{diameter:0.62,segments:6},scene);b.position.set(p[0],BOARD_Y+p[1],BOARD_Z-0.52);groups[i%4].push(b);});
  groups.forEach((arr,i)=>{const m=merge(arr,'xxBulbs');if(m){m.material=M(bc[i],{em:bc[i]});}});
  const clouds=[];for(let x=-BW/2;x<=BW/2;x+=3.6){const c=MB.CreateSphere('xxBoardCloud',{diameter:2.6+((x*7|0)%3)*0.4,segments:8},scene);c.position.set(x,BOARD_Y+BH/2+1.0,BOARD_Z);c.scaling.y=0.8;clouds.push(c);}
  const m=merge(clouds,'xxBoardClouds');if(m)m.material=candy('#ffffff',0.75);
}
[-15,15].forEach(x=>{const p=MB.CreateCylinder('xxBoardPost',{diameter:1.5,height:BOARD_Y,tessellation:14,faceUV:[V4(0,0,1,1),V4(0,0,2,BOARD_Y/2.4),V4(0,0,1,1)]},scene);put(p,x,BOARD_Y/2,BOARD_Z+0.9,stripes[x<0?0:1]);registerBallSolid(p,'scoreboard');});

// LED 點陣遮罩（畫在整張板子最上層，模擬燈珠之間的暗縫）與背景點點
let ledPat=null,dotPat=null;
function patterns(g){
  if(ledPat||typeof document==='undefined')return;
  try{
    const c=document.createElement('canvas');c.width=c.height=6;const x=c.getContext('2d');x.fillStyle='rgba(18,6,48,0.24)';x.fillRect(5,0,1,6);x.fillRect(0,5,6,1);ledPat=g.createPattern(c,'repeat');
    const d=document.createElement('canvas');d.width=d.height=12;const y=d.getContext('2d');y.fillStyle='rgba(255,255,255,0.07)';y.beginPath();y.arc(6,6,2.3,0,TAU);y.fill();dotPat=g.createPattern(d,'repeat');
  }catch(e){ledPat=dotPat=null;}
}
function drawBoard(g,s,W,H){
  const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',NUM='"Arial Rounded MT Bold","Varela Round","Arial Narrow",Arial,sans-serif';
  patterns(g);
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
  const glow=(c,b)=>{g.shadowColor=c;g.shadowBlur=b;},noGlow=()=>{g.shadowBlur=0;g.shadowColor='transparent';};
  // 背景：紫色漸層＋粉／青兩團柔光＋點點
  const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#3d1a7c');bg.addColorStop(0.5,'#250f62');bg.addColorStop(1,'#4c1a80');g.fillStyle=bg;g.fillRect(0,0,W,H);
  let rg=g.createRadialGradient(220,80,10,220,80,420);rg.addColorStop(0,'rgba(255,110,190,0.30)');rg.addColorStop(1,'rgba(255,110,190,0)');g.fillStyle=rg;g.fillRect(0,0,W,H);
  rg=g.createRadialGradient(1340,440,10,1340,440,460);rg.addColorStop(0,'rgba(90,210,255,0.26)');rg.addColorStop(1,'rgba(90,210,255,0)');g.fillStyle=rg;g.fillRect(0,0,W,H);
  if(dotPat){g.fillStyle=dotPat;g.fillRect(0,0,W,H);}
  // 霓虹邊框
  const bd=g.createLinearGradient(0,0,W,0);bd.addColorStop(0,'#ff7ec8');bd.addColorStop(0.5,'#c9b3ff');bd.addColorStop(1,'#6fdcff');
  glow('#ff8fd8',18);g.strokeStyle=bd;g.lineWidth=9;rr(12,12,W-24,H-24,46);g.stroke();noGlow();
  g.strokeStyle='rgba(255,255,255,0.55)';g.lineWidth=2;rr(26,26,W-52,H-52,36);g.stroke();
  // 版面
  const NX=46,NW=298,IX=NX+NW,IW=84,RX=IX+9*IW+16,RW=100,HY=40,HH=62,R1=HY+HH+8,RH=104,R2=R1+RH+6;
  const cell=(x,y,w,h)=>{g.fillStyle='#160a3a';rr(x+5,y+5,w-10,h-10,14);g.fill();g.strokeStyle='rgba(190,160,255,0.55)';g.lineWidth=2;g.stroke();};
  const num=(txt,cx,cy,size,col,gl)=>{g.font='bold '+size+'px '+NUM;g.textAlign='center';g.textBaseline='middle';glow(gl||col,16);g.fillStyle=col;g.fillText(txt,cx,cy+2);noGlow();};
  // 表頭：局數（目前這局是黃色亮塊）＋ R H E
  for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn,x=IX+i*IW;
    if(cur){const gr=g.createLinearGradient(0,HY,0,HY+HH);gr.addColorStop(0,'#fff08a');gr.addColorStop(1,'#ffb830');glow('#ffd23a',18);g.fillStyle=gr;rr(x+5,HY+4,IW-10,HH-8,12);g.fill();noGlow();num(String(n),x+IW/2,HY+HH/2,44,'#3a1a78','rgba(0,0,0,0)');}
    else num(String(n),x+IW/2,HY+HH/2,44,'#e7d9ff','#b794ff');}
  [['R','#ff8fcf'],['H','#7fe3ff'],['E','#d6c4ff']].forEach(([t,c],i)=>num(t,RX+i*RW+RW/2,HY+HH/2,46,c));
  g.textAlign='left';g.textBaseline='middle';g.font='bold 24px '+FONT;glow('#b794ff',10);g.fillStyle='#e7d9ff';g.fillText('✦ 球隊',NX+14,HY+HH/2+2);noGlow();
  // 兩隊兩排
  [['me',R1,'#ff6fae'],['cpu',R2,'#5fd4ff']].forEach(([key,y,col])=>{
    cell(NX,y,NW,RH);
    glow(col,14);g.fillStyle=col;heart(g,NX+34,y+RH/2,15);noGlow();                                   // 隊色愛心
    let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);
    g.font='bold '+(nm.length>4?44:54)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';glow(col,14);g.fillStyle='#ffffff';g.fillText(nm,NX+62,y+RH/2+2);noGlow();
    for(let i=0;i<9;i++){const n=s.first+i,x=IX+i*IW;cell(x,y,IW,RH);if(!s.played(key,n))continue;
      const v=(s.lineScore[key]||[])[n-1],cur=s.current(key,n);num(v==null?'0':String(v),x+IW/2,y+RH/2,60,cur?'#ffe45e':'#ffffff',cur?'#ffb300':col);}
    [[s.score[key],66,col],[s.hits[key],60,'#ffffff'],[s.errors[key],60,'#ffffff']].forEach(([v,sz,c],i)=>{const x=RX+i*RW;cell(x,y,RW,RH);num(String(v),x+RW/2,y+RH/2,sz,c,col);});
  });
  // 下排：B(綠) S(黃) O(粉紅) 燈泡、壘上跑者、打者
  const by=R2+RH+66;g.textBaseline='middle';
  [['B',s.balls,3,'#7dffb8'],['S',s.strikes,2,'#ffe45e'],['O',s.outs,2,'#ff5f9e']].forEach(([lab,n,max,col],r)=>{
    const x0=NX+16+r*210;g.font='bold 46px '+NUM;g.textAlign='left';glow(col,12);g.fillStyle=col;g.fillText(lab,x0,by+2);noGlow();
    for(let i=0;i<max;i++){const cx=x0+68+i*50,lit=i<n;g.beginPath();g.arc(cx,by,19,0,TAU);
      if(lit){glow(col,22);g.fillStyle=col;g.fill();noGlow();g.fillStyle='rgba(255,255,255,0.55)';g.beginPath();g.arc(cx-6,by-6,6,0,TAU);g.fill();}
      else{g.fillStyle='#1c0f45';g.fill();}
      g.strokeStyle=lit?'#ffffff':'rgba(190,160,255,0.6)';g.lineWidth=3;g.beginPath();g.arc(cx,by,19,0,TAU);g.stroke();}});
  const dx0=NX+16+3*210+40;
  [[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22,on=s.bases[i];g.save();g.translate(cx,cy);g.rotate(Math.PI/4);
    if(on){glow('#ff5fb0',20);g.fillStyle='#ff8fcf';}else g.fillStyle='#1c0f45';g.fillRect(-12,-12,24,24);noGlow();
    g.strokeStyle=on?'#ffffff':'rgba(190,160,255,0.6)';g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
  g.textAlign='right';g.font='bold 34px '+FONT;glow('#ff8fd8',12);g.fillStyle='#ffffff';
  g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+(s.batter==null?'':s.batter)),W-48,by);noGlow();
  // 裝飾：頁尾字樣、閃亮星星、兩支小棒棒糖
  g.textAlign='center';g.font='bold 32px '+FONT;glow('#ff8fd8',14);g.fillStyle='#ffd6f0';g.fillText('★  夢幻球場  DREAM STADIUM  ★',W/2,470);noGlow();
  g.fillStyle='rgba(255,255,255,0.9)';[[300,448,11],[1236,448,11],[560,430,7],[980,436,8],[60,60,10],[W-60,60,10],[440,492,6],[1100,490,7]].forEach(([x,y,r])=>{glow('#ffffff',10);star4(g,x,y,r);});noGlow();
  [[116,452,'#ff7eb6'],[W-116,452,'#7cc8ff']].forEach(([x,y,c])=>{
    g.strokeStyle='#ffffff';g.lineWidth=5;g.beginPath();g.moveTo(x,y+20);g.lineTo(x,y+54);g.stroke();
    g.fillStyle=c;g.beginPath();g.arc(x,y,24,0,TAU);g.fill();g.strokeStyle='#ffffff';g.lineWidth=4;g.beginPath();g.arc(x,y,12,0.3,4.8);g.stroke();g.beginPath();g.arc(x,y,24,0,TAU);g.stroke();});
  if(ledPat){g.fillStyle=ledPat;g.fillRect(0,0,W,H);}
}
ctx.setScoreboardRenderer(drawBoard);

// ═════════ ⑧ 封閉球員休息室（x=240，遠離球場）═════════
{
  const wall=candy('#f6e6fb',0.5),floorM=candy('#d9c8ee',0.4),lockerCols=['#ff9ccb','#9de8cf','#c3a8ff','#ffe08a','#9ed8ff'].map(c=>candy(c,0.5)),bench=candy('#fff0c9',0.5);
  put(MB.CreateBox('xxLockFloor',{width:34,height:0.2,depth:16}),240,0.1,0,floorM);
  put(MB.CreateBox('xxLockBack',{width:34,height:7,depth:0.4}),240,3.5,8.2,wall);
  [-17,17].forEach(x=>put(MB.CreateBox('xxLockSide',{width:0.4,height:7,depth:16}),240+x,3.5,0,wall));
  put(MB.CreateBox('xxLockCeil',{width:34,height:0.3,depth:16}),240,7,0,wall);
  for(let i=0;i<10;i++){put(MB.CreateBox('xxLocker',{width:2.4,height:4.2,depth:1.2}),224.6+i*3.4,2.1,7.4,lockerCols[i%5]);
    put(MB.CreateBox('xxLockSeat',{width:2.6,height:0.45,depth:0.9}),224.6+i*3.4,0.4,5.8,bench);}
}
ctx.setLocker({camPos:[240,12,-22],camTarget:[240,1,0],seat:p=>({x:230.2+(p.index%9)*2.45,y:0,z:p.team==='RED'?3.6:-4.5,s:1.05})});

// ═════════ ⑨ 休息區位置契約＋全壘打規則 ═════════
ctx.setDugouts({
  E:s=>lpt(s,DUG_R,DUG_FRONT-1.4),
  T:s=>lpt(s,DUG_R,FOUL_OFF-3.2),
  gate:(s,j,inside)=>lpt(s,DUG_R+j,inside?DUG_FRONT+2.4:DUG_FRONT-1.4),
  seat:(s,i)=>{const p=lpt(s,DUG_R-5+(i%9)*1.25,i%3===0?FOUL_OFF-1.2:(i%3===1?FOUL_OFF-3.0:FOUL_OFF-4.2));
    return {x:p.x,y:i%3===0?0.55:0,z:p.z,ry:s===-1?Math.PI/4:-Math.PI/4,scale:i%3===0?[0.82,0.72,0.82]:null};}
});
ctx.setRules({fenceR:R,fenceH:FENCE_TOP,arcDeg:45,simLimit:150,fenceAt});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).dream={id:'dream',name:'夢幻球場',build:build};
})();
