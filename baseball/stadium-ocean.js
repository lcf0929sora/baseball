/*
 * 海洋球場（id: ocean）— 仿紅襪隊芬威球場(Fenway Park)規格，深藍主色，左外野緊貼海岸線。
 * 介面規格請參考 stadium-night.js 開頭的「球場外掛開發指南」。
 *
 *  場地
 *   · 內野全草地（網格狀割草紋），只有三個壘包周圍、本壘板區與投手丘是紅土。外野草地與內野草地同一張貼圖、同樣 10 m 對齊，所以紋路連續。
 *  外野牆（仿芬威，單位 m；角度 0°＝中外野，左負右正）
 *   · 左外野線 94.5 m(310 呎)，緊接著一面高 11.3 m(37 呎)的深藍「海之怪物」高牆，一路斜斜往中外野延伸到 115.5 m(379 呎)；牆上掛記分板。
 *   · 中外野 118.9 m(390 呎)，右中外野的「三角深處」128 m(420 呎)，再收回右中 115.5 m(379 呎)，右外野線 92.5 m(303 呎)。
 *   · 其餘牆段高 5.2 m(17 呎)。★ 規則面只能設一個 fenceH，所以全場「球越過牆線」的門檻統一是 5.2 m；
 *     高牆本體(11.3 m)有實體碰撞，球要飛越高牆頂才會過線，兩者沒有衝突。
 *  看台
 *   · 左外野沒有觀眾席：高牆後面就是海岸線。本壘後方與左右界外線有看台；中外野到右外野線有一圈看台，轉角用扇形看台接起來。
 *  球場外（以深藍為主）
 *   · 左外野高牆後是 52 m 寬的廣場，再來是「濱海公路」（雙向四線道，路燈、車燈、棕櫚樹），接著是步道、沙灘、海岸線。
 *   · 海岸線外是大海：由淺青綠漸層到深藍，浪紋、白色浪花；海上有貨輪、油輪、渡輪、帆船、漁船、浮標與燈塔。
 *   · 球場獨佔一個大街廓（旋轉成與海岸平行），四周是馬路；街廓外是整片內陸街區與亮燈的大樓，靠海一側的大樓較矮。
 *  啦啦隊專區：一壘／三壘側觀眾席前方各有一座懸挑的大平台（18×7 m，各 15 個站位，球員尺寸），站位座標見 BaseballStadiums.ocean.cheerSlots。
 *  球落入海中：海面不是碰撞物件；球落到海岸線外就下沉、濺起水花並消失（見「球落入海中」一節）。
 *  本檔「不」設定天空／霧／光源。
 */
(function(){
'use strict';
function build(ctx){
const {BABYLON,scene,MB,M,put,texMat,lpt,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const SQ=Math.SQRT1_2,TAU=Math.PI*2,D2R=Math.PI/180,V4=(a,b,c,d)=>new BABYLON.Vector4(a,b,c,d);

// ═════════ ① 共用工具 ═════════
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const tile=(S,x,y,m,fn)=>{if(x>m&&x<S-m&&y>m&&y<S-m)return fn(0,0);for(const dx of[-S,0,S])for(const dy of[-S,0,S])fn(dx,dy);};
const newTex=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const hex2rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const dim=(h,k)=>'#'+hex2rgb(h).map(v=>Math.round(v*k).toString(16).padStart(2,'0')).join('');
const candy=(h,k)=>M(h,{em:dim(h,k==null?0.55:k)});          // 本色＋一點自發光，任何天氣下顏色都紮實
const merge=(arr,mat,name)=>{if(!arr.length)return null;const m=BABYLON.Mesh.MergeMeshes(arr,true,true);if(m){m.name=name;if(mat)m.material=mat;m.isPickable=false;}return m;};
const speck=(g,S,r,n,a1,a2)=>{for(let q=0;q<n;q++){g.fillStyle=q%2?a1:a2;const s=1+r()*2;g.fillRect(r()*S,r()*S,s,s);}};
const nrm2=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return [dx/l,dz/l];};

// ═════════ ② 場地：網格草皮、紅土 ═════════
// 草皮：2.5 m 的棋盤格割草紋（10 m 一個重複，4×4 格），格線與草葉細節。外野(ground)與內野共用同一張，所以接縫無痕。
function grassGridTex(){
  const S=1024,C=S/4,t=newTex('xxGrass',S,S),g=t.getContext(),rnd=rng(11);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){g.fillStyle=(i+j)%2?'#2a7c48':'#3b9159';g.fillRect(i*C,j*C,C,C);}
  for(let n=0;n<12000;n++){g.fillStyle=n%2?'rgba(210,255,200,0.05)':'rgba(0,40,30,0.07)';const s=1+rnd()*2.5;g.fillRect(rnd()*S,rnd()*S,s,s);}
  for(let n=0;n<5000;n++){const x=rnd()*S,y=rnd()*S,l=4+rnd()*7,a=-1.57+(rnd()-0.5)*1.2,hi=rnd()<0.5;
    tile(S,x,y,12,(dx,dy)=>{g.strokeStyle=hi?'rgba(190,240,170,0.22)':'rgba(0,40,25,0.22)';g.lineWidth=1;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke();});}
  g.strokeStyle='rgba(5,45,32,0.34)';g.lineWidth=3;g.beginPath();for(let k=0;k<=4;k++){g.moveTo(k*C,0);g.lineTo(k*C,S);g.moveTo(0,k*C);g.lineTo(S,k*C);}g.stroke();   // 格線
  t.update();return t;
}
function clayTex(){   // 紅土
  const S=512,t=newTex('xxClay',S,S),g=t.getContext(),rnd=rng(21),img=g.createImageData(S,S),d=img.data;
  for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.2;d[i]=176*k;d[i+1]=92*k;d[i+2]=58*k;d[i+3]=255;}
  g.putImageData(img,0,0);
  for(let n=0;n<150;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*60,q=rnd();tile(S,x,y,r,(dx,dy)=>{g.fillStyle=q<0.4?'rgba(110,50,28,0.12)':q<0.8?'rgba(225,150,105,0.10)':'rgba(150,80,50,0.08)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  for(let n=0;n<60;n++){const x=rnd()*S,y=rnd()*S,l=60+rnd()*150,a=0.35+(rnd()-0.5)*0.25;tile(S,x,y,l,(dx,dy)=>{g.strokeStyle=n%2?'rgba(235,170,130,0.10)':'rgba(90,40,20,0.11)';g.lineWidth=1+rnd()*2;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke();});}
  for(let n=0;n<900;n++){const x=rnd()*S,y=rnd()*S,r=0.8+rnd()*1.8;tile(S,x,y,6,(dx,dy)=>{g.fillStyle=n%2?'rgba(232,180,140,0.55)':'rgba(80,38,22,0.5)';g.beginPath();g.ellipse(x+dx,y+dy,r*1.3,r,0,0,TAU);g.fill();});}
  t.update();return t;
}
const grassTex=grassGridTex(),clayT=clayTex(),grassMat=texMat(grassTex,1),clayMat=texMat(clayT,1);
ctx.makeGround(grassMat,10);                        // 外野草地：10 m 一個重複，與內野(DIRT_TILE=10)的格線對齊
ctx.setFieldMats({infield:(ctx.apiVersion>=2)?false:texMat(grassTex,1),dirt:texMat(grassTex,1),home:texMat(clayT,0.96),mound:texMat(clayT,1.05)});   // 內野土區圓盤整個換成草皮；本壘區與投手丘維持紅土
[[19.4,19.4],[0,38.8],[-19.4,19.4]].forEach(([x,z])=>{   // 一、二、三壘周圍的紅土圓
  const d=MB.CreateDisc('xxClayPad',{radius:3.4,tessellation:40},scene);d.rotation.x=Math.PI/2;d.isPickable=false;put(d,x,0.045,z,clayMat);
});

// ═════════ ③ 外野牆幾何（仿芬威）與全壘打規則 ═════════
const FOUL_OFF=15,WALL_H=5.2,MONSTER_H=11.3;
const polar=(deg,r)=>[r*Math.sin(deg*D2R),r*Math.cos(deg*D2R)];
const LFP=lpt(-1,94.5,0);
const FW=[[LFP.x,LFP.z],polar(-7.5,115.5),polar(0,118.9),polar(10,128),polar(24,115.5),[92.5*SQ,92.5*SQ]];   // 左線桿、高牆右端、中外野、三角深處、右中外野、右線桿
const dM=nrm2(FW[0],FW[1]),tL=FOUL_OFF/((dM[0]+dM[1])*SQ);
const JL=[FW[0][0]-dM[0]*tL,FW[0][1]-dM[1]*tL];                          // 高牆往界外延伸到左界外牆的接點
const dR=nrm2(FW[4],FW[5]),tR=FOUL_OFF/((dR[0]-dR[1])*SQ);
const JR=[FW[5][0]+dR[0]*tR,FW[5][1]+dR[1]*tR];                          // 右外野牆延伸到右界外牆的接點
function fenceAt(deg){
  const a=Math.max(-45,Math.min(45,deg))*D2R,dx=Math.sin(a),dz=Math.cos(a);
  for(let i=0;i<FW.length-1;i++){const A=FW[i],B=FW[i+1],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
    const t=(A[0]*ez-A[1]*ex)/den,u=(A[0]*dz-A[1]*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)return t;}
  return 118.9;
}

// 牆面貼圖：深藍鋼板，直向肋條＋鉚釘（6 m 一個重複）
function panelTex(base,rib,name){
  const S=256,t=newTex(name,S,S),g=t.getContext(),r=rng(3);
  g.fillStyle=base;g.fillRect(0,0,S,S);speck(g,S,r,3000,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');
  for(let i=0;i<8;i++){g.fillStyle=rib;g.fillRect(i*32+2,0,5,S);g.fillStyle='rgba(0,0,0,0.30)';g.fillRect(i*32+7,0,2,S);}
  g.fillStyle='rgba(0,0,0,0.30)';g.fillRect(0,0,S,3);g.fillRect(0,S/2,S,3);
  g.fillStyle='rgba(200,225,255,0.5)';for(let i=0;i<8;i++)for(const y of[10,S/2+10]){g.beginPath();g.arc(i*32+16,y,1.6,0,TAU);g.fill();}
  t.update();return t;
}
const monsterMat=texMat(panelTex('#0a2766','#1646a0','xxMonster'),1),wallMat=texMat(panelTex('#102f78','#1a4fb0','xxWallTex'),1),capMat=candy('#e8f1ff',0.7);
function wallBox(ax,az,bx,bz,h,th,mat,fence,outfield,cap,ext,tileM){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2,T=tileM||6;
  const fu=V4(0,0,len/T,h/T),b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th,faceUV:[fu,fu,V4(0,0,1,1),V4(0,0,1,1),V4(0,0,1,1),V4(0,0,1,1)]},scene),cx,h/2,cz,mat);b.rotation.y=ang;
  if(fence)registerFenceCollider(b,!!outfield);
  if(cap){const c=put(MB.CreateBox('xxCap',{width:len+0.1,height:0.3,depth:th+0.3}),cx,h+0.15,cz,capMat);c.rotation.y=ang;}
  return b;
}
wallBox(JL[0],JL[1],FW[1][0],FW[1][1],MONSTER_H,1.2,monsterMat,true,true,true,0.8);          // 高牆（海之怪物）
for(let i=1;i<4;i++)wallBox(FW[i][0],FW[i][1],FW[i+1][0],FW[i+1][1],WALL_H,0.7,wallMat,true,true,true,0.8);   // 中外野～右中外野
wallBox(FW[4][0],FW[4][1],JR[0],JR[1],WALL_H,0.7,wallMat,true,true,true,0.8);                 // 右外野（含越過右線桿的一段）
// 界外線桿：黃色
{const pm=candy('#ffd23a',0.8);
 [[FW[0][0]+dM[1]*0.9,FW[0][1]-dM[0]*0.9,24],[FW[5][0]-0.5,FW[5][1]-0.5,18]].forEach(([x,z,h])=>{put(MB.CreateCylinder('xxPole',{diameter:0.4,height:h,tessellation:10},scene),x,h/2,z,pm);});}

// ═════════ ④ 觀眾席（深藍座椅＋觀眾）═════════
const STEP=1.1,ROW=0.8,CROWD_N=14,CROWD_TW=CROWD_N*0.5333;
function crowdTextures(){
  const W=CROWD_N*64,rnd=rng(5),shirts=['#ffffff','#9ed0ff','#1e4fbf','#ff5a6a','#ffd66b','#274fa8','#6fa8ff','#e8f1ff','#ffffff','#3f7fe0'],
    skins=['#f6d4b4','#f1c7a0','#e0ad82','#c98f63'],hairs=['#2c231d','#4a3626','#10100f','#e8c35a','#7a4a2a'];
  const front=newTex('xxCrowdF',W,96),gf=front.getContext(),top=newTex('xxCrowdT',W,132),gt=top.getContext();
  gf.fillStyle='#0a1a45';gf.fillRect(0,0,W,96);gt.fillStyle='#10265c';gt.fillRect(0,0,W,132);
  for(let i=0;i<CROWD_N;i++){const cx=i*64+32+(rnd()-0.5)*8,sh=shirts[(rnd()*shirts.length)|0],sk=skins[(rnd()*skins.length)|0],hr=hairs[(rnd()*hairs.length)|0];
    gf.fillStyle=sh;gf.beginPath();gf.ellipse(cx,84,26,34,0,0,TAU);gf.fill();
    gf.fillStyle=sk;gf.beginPath();gf.arc(cx,34,13,0,TAU);gf.fill();
    gf.fillStyle=hr;gf.beginPath();gf.arc(cx,29,13.5,Math.PI,TAU);gf.fill();
    if(rnd()<0.3){gf.fillStyle='#1646a0';gf.beginPath();gf.arc(cx,26,14,Math.PI,TAU);gf.fill();gf.fillRect(cx-16,25,32,4);}   // 球帽
    gt.fillStyle=sh;gt.beginPath();gt.ellipse(cx,66,26,15,0,0,TAU);gt.fill();gt.fillStyle=hr;gt.beginPath();gt.arc(cx,66,12,0,TAU);gt.fill();}
  front.update();top.update();return {front,top};
}
const crowd=crowdTextures();
const cf=M('#000000');cf.emissiveTexture=crowd.front;cf.disableLighting=true;cf.backFaceCulling=false;
const ct=M('#000000');ct.emissiveTexture=crowd.top;ct.disableLighting=true;ct.backFaceCulling=false;
const crowdMat=new BABYLON.MultiMaterial('xxCrowd',scene);crowdMat.subMaterials=[cf,ct];
const concrete=candy('#12296a',0.5),glowStrip=M('#8fc4ff',{em:'#8fc4ff'});
function crowdMesh(name,pos,uv,idxR,idxT){
  const m=new BABYLON.Mesh(name,scene),vd=new BABYLON.VertexData(),nor=[];
  vd.positions=pos;vd.indices=idxR.concat(idxT);vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,vd.indices,nor);vd.normals=nor;vd.applyToMesh(m);
  m.material=crowdMat;m.isPickable=false;m.subMeshes=[];const nv=pos.length/3;
  new BABYLON.SubMesh(0,0,nv,0,idxR.length,m);new BABYLON.SubMesh(1,0,nv,idxR.length,idxT.length,m);return m;
}
function ghostBox(cx,cy,cz,w,h,d,ang,kind){const b=put(MB.CreateBox('xxHit',{width:w,height:h,depth:d}),cx,cy,cz,null);b.rotation.y=ang;b.isVisible=false;registerBallSolid(b,kind);return b;}
// 直線看台：a→b 為牆的位置，out 為朝外單位向量，第 k 階的前緣離牆 gap+k·STEP；兩端各延伸 ext
function stand(ax,az,bx,bz,out,tiers,gap,top0,ext,caps){
  const dx=bx-ax,dz=bz-az,L0=Math.hypot(dx,dz),ux=dx/L0,uz=dz/L0,nx=out[0],nz=out[1];
  const s0=-(ext||0),s1=L0+(ext||0),L=s1-s0,u1=L/CROWD_TW,pos=[],uv=[],idxR=[],idxT=[],vBase=top0-ROW;
  const P=(s,off,y)=>pos.push(ax+ux*s+nx*off,y,az+uz*s+nz*off),quad=arr=>{const n=pos.length/3-4;arr.push(n,n+1,n+2,n,n+2,n+3);};
  for(let k=0;k<tiers;k++){const off=gap+k*STEP,top=top0+k*ROW,bot=k?top-ROW:0;
    P(s0,off,bot);P(s1,off,bot);P(s1,off,top);P(s0,off,top);uv.push(0,(bot-vBase)/ROW,u1,(bot-vBase)/ROW,u1,(top-vBase)/ROW,0,(top-vBase)/ROW);quad(idxR);
    P(s0,off,top);P(s1,off,top);P(s1,off+STEP,top);P(s0,off+STEP,top);uv.push(0,0,u1,0,u1,1,0,1);quad(idxT);}
  crowdMesh('xxStand',pos,uv,idxR,idxT);
  const ang=Math.atan2(-dz,dx),mx=(ax+bx)/2,mz=(az+bz)/2,half=Math.ceil(tiers/2);
  [[0,half],[half,tiers]].forEach(([a,b])=>{if(b<=a)return;const o0=gap+a*STEP,o1=gap+b*STEP,topH=top0+(b-1)*ROW,oc=(o0+o1)/2;
    ghostBox(mx+nx*oc,topH/2,mz+nz*oc,L,topH,o1-o0+0.1,ang,'spectator');});
  const backOff=gap+tiers*STEP+0.3,bh=top0+tiers*ROW+1.6,bw=put(MB.CreateBox('xxStandBack',{width:L,height:bh,depth:0.6}),mx+nx*backOff,bh/2,mz+nz*backOff,concrete);
  bw.rotation.y=ang;registerBallSolid(bw,'spectator');
  const gl=put(MB.CreateBox('xxStandGlow',{width:L,height:0.22,depth:0.3}),mx+nx*(backOff-0.3),bh,mz+nz*(backOff-0.3),glowStrip);gl.rotation.y=ang;
  // 端牆：看台的開口端用一面實心牆封起來（caps：[起點端, 終點端]）
  if(caps){const d0=gap-0.1,d1=backOff+0.3,eh=top0+(tiers-1)*ROW+0.5;
    [[caps[0],s0],[caps[1],s1]].forEach(([on,s])=>{if(!on)return;const oc=(d0+d1)/2,x=ax+ux*s+nx*oc,z=az+uz*s+nz*oc;
      const e=put(MB.CreateBox('xxStandEnd',{width:0.4,height:eh,depth:d1-d0}),x,eh/2,z,concrete);e.rotation.y=ang;registerBallSolid(e,'spectator');});}
}
// 轉角扇形看台：以牆的轉角 F 為圓心，朝外方向從 thA 掃到 thB（方向角＝atan2(x,z)）；階高從 topA 漸變到 topB，兩端都與直線看台無縫
function fan(F,thA,thB,tiers,gap,topA,topB){
  const NS=12,pos=[],uv=[],idxR=[],idxT=[],Pt=(a,r,y)=>pos.push(F[0]+r*Math.sin(a),y,F[1]+r*Math.cos(a)),hT=(k,j)=>topA+(topB-topA)*j/NS+ROW*k,vB=(topA-ROW);
  for(let k=0;k<tiers;k++){const ra=gap+k*STEP,rb=ra+STEP,rt=(ra+rb)/2;
    for(let j=0;j<NS;j++){
      const a0=thA+(thB-thA)*j/NS,a1=thA+(thB-thA)*(j+1)/NS,u0=Math.abs(a0-thA),u1=Math.abs(a1-thA),t0=hT(k,j),t1=hT(k,j+1),b0=k?t0-ROW:0,b1=k?t1-ROW:0;let n=pos.length/3;
      Pt(a0,ra,b0);Pt(a1,ra,b1);Pt(a1,ra,t1);Pt(a0,ra,t0);uv.push(u0*ra/CROWD_TW,(b0-vB)/ROW,u1*ra/CROWD_TW,(b1-vB)/ROW,u1*ra/CROWD_TW,(t1-vB)/ROW,u0*ra/CROWD_TW,(t0-vB)/ROW);idxR.push(n,n+1,n+2,n,n+2,n+3);
      n=pos.length/3;Pt(a0,ra,t0);Pt(a1,ra,t1);Pt(a1,rb,t1);Pt(a0,rb,t0);uv.push(u0*rt/CROWD_TW,0,u1*rt/CROWD_TW,0,u1*rt/CROWD_TW,1,u0*rt/CROWD_TW,1);idxT.push(n,n+1,n+2,n,n+2,n+3);}}
  crowdMesh('xxFan',pos,uv,idxR,idxT);
  const half=Math.ceil(tiers/2),NSC=2;   // 碰撞：2 個扇區 × 前低後高 2 層
  [[0,half],[half,tiers]].forEach(([a,b])=>{if(b<=a)return;const r0=gap+a*STEP,r1=gap+b*STEP,rm=(r0+r1)/2;
    for(let m=0;m<NSC;m++){const aa=thA+(thB-thA)*m/NSC,ab=thA+(thB-thA)*(m+1)/NSC,am=(aa+ab)/2,top=hT(b-1,(m+1)*NS/NSC)+0.1,w=2*(r1)*Math.sin(Math.abs(ab-aa)/2)+0.4;
      ghostBox(F[0]+rm*Math.sin(am),top/2,F[1]+rm*Math.cos(am),w,top,r1-r0+0.2,am,'spectator');}});
  const Rb=gap+tiers*STEP+0.3,NB=6;
  for(let j=0;j<NB;j++){const am=thA+(thB-thA)*(j+0.5)/NB,bh=topA+(topB-topA)*(j+0.5)/NB+tiers*ROW+1.6,w=2*Rb*Math.sin(Math.abs(thB-thA)/NB/2)+0.5,x=F[0]+Rb*Math.sin(am),z=F[1]+Rb*Math.cos(am);
    const wl=put(MB.CreateBox('xxFanBack',{width:w,height:bh,depth:0.7}),x,bh/2,z,concrete);wl.rotation.y=am;registerBallSolid(wl,'spectator');
    const gl=put(MB.CreateBox('xxFanGlow',{width:w,height:0.22,depth:0.3}),x-Math.sin(am)*0.2,bh,z-Math.cos(am)*0.2,glowStrip);gl.rotation.y=am;}
}
const T=10,GAP=1.6,OTOP=WALL_H+0.9;       // 外野看台：10 階、牆後 1.6 m、第一階高 6.1 m
const outN=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return [-dz/l,dx/l];};   // 往牆外（+z 側）的法線
const EDGE=[[FW[1],FW[2]],[FW[2],FW[3]],[FW[3],FW[4]],[FW[4],JR]],EN=EDGE.map(([a,b])=>outN(a,b));
EDGE.forEach(([a,b],i)=>stand(a[0],a[1],b[0],b[1],EN[i],T,GAP,OTOP,0,[i===0,false]));   // 只有最左端（高牆旁）需要端牆
const th=n=>Math.atan2(n[0],n[1]);
fan(FW[3],th(EN[1]),th(EN[2]),T,GAP,OTOP,OTOP);          // 三角深處的外凸轉角
fan(FW[4],th(EN[2]),th(EN[3]),T,GAP,OTOP,OTOP);
const SIDE_TOP=3.6,SIDE_N=T,SIDE_OUT=[SQ,-SQ];
fan(JR,th(EN[3]),Math.atan2(SIDE_OUT[0],SIDE_OUT[1]),T,GAP,OTOP,SIDE_TOP);   // 右外野 → 右界外看台

// ═════════ ⑤ 本壘後方、界外牆、界外看台、休息區 ═════════
const homeBackZ=-20,foulMat=candy('#0f2c78',0.5),foulMat2=candy('#0a2158',0.5);
wallBox(-12,homeBackZ,12,homeBackZ,3.4,0.6,foulMat2,true,false,true,0.6);
const sides=[-1,1];
sides.forEach(s=>{
  const a=lpt(s,0,FOUL_OFF),j=s<0?JL:JR;
  wallBox(s*12,homeBackZ,a.x,a.z,3.0,0.6,foulMat2,true,false,true,0.6);
  wallBox(a.x,a.z,j[0],j[1],2.8,0.6,foulMat,true,false,true,0.6);
  const sa=lpt(s,8,FOUL_OFF),sb=s<0?{x:JL[0],z:JL[1]}:{x:JR[0],z:JR[1]};
  stand(sa.x,sa.z,sb.x,sb.z,[s<0?-SQ:SQ,-SQ],SIDE_N,1.4,SIDE_TOP,0,s<0?[true,true]:[true,false]);   // 界外看台：左(往 -,-)兩端封牆；右(往 +,-)靠本壘端封牆，另一端接扇形
});
stand(-12,homeBackZ,12,homeBackZ,[0,-1],5,1.4,4.0,2,[true,true]);
// 球員休息區：深藍棚子（凹在界外牆前）
const DUG_R=19,DUG_FRONT=8.6,benchMat=candy('#9fb7e6',0.4),roofMat=candy('#0f3a8a',0.6),slab=candy('#1a2c5e',0.4);
sides.forEach(s=>{
  const ang=Math.atan2(-SQ,s*SQ),c=lpt(s,DUG_R,(DUG_FRONT+FOUL_OFF)/2),dep=FOUL_OFF-DUG_FRONT;
  const floor=put(MB.CreateBox('xxDugFloor',{width:14,height:0.06,depth:dep}),c.x,0.04,c.z,slab);floor.rotation.y=ang;
  const roof=put(MB.CreateBox('xxDugRoof',{width:14.6,height:0.18,depth:dep+0.8}),c.x,2.7,c.z,roofMat);roof.rotation.y=ang;registerBallSolid(roof);
  const bn=lpt(s,DUG_R,FOUL_OFF-1.2),bench=put(MB.CreateBox('xxDugBench',{width:11,height:0.5,depth:0.7}),bn.x,0.3,bn.z,benchMat);bench.rotation.y=ang;
  const f0=lpt(s,DUG_R-7,DUG_FRONT),f1=lpt(s,DUG_R-1.3,DUG_FRONT),f2=lpt(s,DUG_R+1.3,DUG_FRONT),f3=lpt(s,DUG_R+7,DUG_FRONT);
  wallBox(f0.x,f0.z,f1.x,f1.z,1.1,0.4,foulMat,true,false,true,0);wallBox(f2.x,f2.z,f3.x,f3.z,1.1,0.4,foulMat,true,false,true,0);
});
ctx.setDugouts({
  E:s=>lpt(s,DUG_R,DUG_FRONT-1.4),
  T:s=>lpt(s,DUG_R,FOUL_OFF-3.0),
  gate:(s,j,inside)=>lpt(s,DUG_R+j,inside?DUG_FRONT+2.2:DUG_FRONT-1.4),
  seat:(s,i)=>{const p=lpt(s,DUG_R-5+(i%9)*1.25,i%3===0?FOUL_OFF-1.2:(i%3===1?FOUL_OFF-2.8:FOUL_OFF-4.0));
    return {x:p.x,y:i%3===0?0.55:0,z:p.z,ry:s===-1?Math.PI/4:-Math.PI/4,scale:i%3===0?[0.82,0.72,0.82]:null};}
});

// ═════════ ⑤-2 啦啦隊專區：一壘／三壘兩側、觀眾席前方的延伸大平台 ═════════
// 平台是「懸挑的舞台」：台面高 4.5 m（剛好與第二階看台等高，兩端可直接走進看台），前緣挑出到離界外線 11.5 m（在界外牆上方，
// 下方 4.2 m 淨空，不影響野手接界外球）；後緣接上第三階看台。長 18 m × 深 7.1 m，台面上畫了 15 個站位圈（前排 8、後排 7，間距 2 m），
// 人物尺寸以球員為準（身高約 1.8 m）：前排站位離護欄 1.7 m、護欄高 1.1 m，所以站在台上的人看得到場內。
// ★ 這裡只建「平台」，人物不在球場檔裡。站位資料放在 window.BaseballStadiums.ocean.cheerSlots（每筆 {side,row,x,y,z,ry}，
//   y＝台面高度、ry＝面向場內的弧度，與休息區 seat() 的 ry 同一個約定），之後要放啦啦隊員（自己造的人偶或主程式的人物）直接讀它。
const cheerSlots=[],cheerZones=[];
{
  const CH={r0:32,r1:50,oF:11.5,oB:18.6,top:4.5,th:0.3},L=CH.r1-CH.r0,WD=CH.oB-CH.oF,RC=(CH.r0+CH.r1)/2,OC=(CH.oF+CH.oB)/2;
  const ROWS=[[13.2,[-7,-5,-3,-1,1,3,5,7]],[16.9,[-6,-4,-2,0,2,4,6]]];
  const star5=(g,cx,cy,R,fill)=>{g.fillStyle=fill;g.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?R*0.42:R;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.fill();};
  const floorT=(()=>{const W=1024,H=Math.round(W*WD/L),t=newTex('xxCheerFloorTex',W,H),g=t.getContext();
    const bg=g.createLinearGradient(0,0,W,0);bg.addColorStop(0,'#0b2a70');bg.addColorStop(0.5,'#12409a');bg.addColorStop(1,'#0b2a70');g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,255,255,0.08)';for(let i=-H;i<W;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i+32,0);g.lineTo(i+32+H,H);g.lineTo(i+H,H);g.closePath();g.fill();}
    g.strokeStyle='#e8f1ff';g.lineWidth=8;g.strokeRect(14,14,W-28,H-28);g.lineWidth=3;g.strokeRect(30,30,W-60,H-60);
    star5(g,W/2,H/2,H*0.17,'rgba(255,255,255,0.9)');
    g.strokeStyle='#ffd23a';g.lineWidth=5;g.fillStyle='rgba(255,210,58,0.22)';
    ROWS.forEach(([o,drs])=>drs.forEach(dr=>{const x=(0.5+dr/L)*W,y=(o-CH.oF)/WD*H;g.beginPath();g.arc(x,y,H*0.075,0,TAU);g.fill();g.stroke();g.fillStyle='#ffd23a';g.beginPath();g.arc(x,y,4,0,TAU);g.fill();g.fillStyle='rgba(255,210,58,0.22)';}));
    t.update();return t;})();
  const bannerT=(()=>{const W=1536,H=128,t=newTex('xxCheerBannerTex',W,H),g=t.getContext();
    g.fillStyle='#0a2260';g.fillRect(0,0,W,H);g.fillStyle='#e8f1ff';g.fillRect(0,0,W,8);g.fillRect(0,H-8,W,8);
    [70,W/2,W-70].forEach(x=>star5(g,x,H/2,26,'#ffd23a'));
    g.font='bold 60px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffffff';[0.27,0.73].forEach(f=>g.fillText('OCEAN CHEERS',W*f,H/2+3));
    t.update();return t;})();
  const flagT=(()=>{const W=256,H=160,t=newTex('xxCheerFlagTex',W,H),g=t.getContext();g.fillStyle='#0d2f7d';g.fillRect(0,0,W,H);g.fillStyle='#e8f1ff';g.fillRect(0,0,W,10);g.fillRect(0,H-10,W,10);
    g.beginPath();g.moveTo(0,H*0.62);for(let x=0;x<=W;x+=8)g.lineTo(x,H*0.62+Math.sin(x/22)*7);g.lineTo(W,H);g.lineTo(0,H);g.closePath();g.fillStyle='#1f6fd6';g.fill();star5(g,W/2,H*0.36,34,'#ffd23a');t.update();return t;})();
  const floorMat=texMat(floorT,1),bannerMat=texMat(bannerT,1),flagMat=texMat(flagT,1),deckMat=candy('#0d2a68',0.5),railMat=candy('#e8f1ff',0.7),ledMat=M('#7fd0ff',{em:'#7fd0ff'}),lampMat=M('#ffffff',{em:'#ffffff'});
  sides.forEach(s=>{
    const ang=-s*Math.PI/4,P=(r,o)=>lpt(s,r,o),c=P(RC,OC);   // 台座的 +x 沿界外線、+z 朝場內
    const slab=put(MB.CreateBox('xxCheerSlab',{width:L,height:CH.th,depth:WD}),c.x,CH.top-CH.th/2,c.z,deckMat);slab.rotation.y=ang;registerBallSolid(slab,'spectator');
    const floor=put(MB.CreateGround('xxCheerFloor',{width:L,height:WD},scene),c.x,CH.top+0.012,c.z,floorMat);floor.rotation.y=ang;floor.isPickable=false;
    const sk=P(RC,15.65);put(MB.CreateBox('xxCheerSkirt',{width:L+0.6,height:4.2,depth:0.3}),sk.x,2.1,sk.z,concrete).rotation.y=ang;   // 台座後方的裙牆（擋住看台前緣的觀眾）
    const f=P(RC,CH.oF-0.12);put(MB.CreateBox('xxCheerFascia',{width:L+0.2,height:1.3,depth:0.25}),f.x,CH.top-0.55,f.z,deckMat).rotation.y=ang;     // 前緣底板
    // 橫幅文字用「平面」貼（不用長方盒的面：盒子朝場內那一面的貼圖會整張轉 180°）；平面的正面是 -z，所以轉 ang+π 讓正面朝向場內
    const bp=P(RC,CH.oF-0.27);put(MB.CreatePlane('xxCheerBanner',{width:L+0.1,height:1.2,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),bp.x,CH.top-0.55,bp.z,bannerMat).rotation.y=ang+Math.PI;
    const led=P(RC,CH.oF-0.13);put(MB.CreateBox('xxCheerLed',{width:L+0.2,height:0.07,depth:0.28}),led.x,CH.top-1.25,led.z,ledMat).rotation.y=ang;      // 燈帶
    for(let i=0;i<5;i++){const p=P(RC+(i-2)*(L/4.6),13.7),b=put(MB.CreateBox('xxCheerBrace',{width:0.3,height:0.3,depth:3.9}),p.x,3.45,p.z,deckMat);b.rotation.set(-0.395,ang,0);}   // 懸挑的斜撐
    const rails=[],rb=(w,h,d,r,o,y)=>{const p=P(r,o),m=MB.CreateBox('xxCheerRail',{width:w,height:h,depth:d},scene);m.position.set(p.x,y,p.z);m.rotation.y=ang;rails.push(m);};
    rb(L,0.07,0.07,RC,CH.oF+0.12,CH.top+1.1);rb(L,0.05,0.05,RC,CH.oF+0.12,CH.top+0.55);                                   // 前緣欄杆（高 1.1 m）
    for(let r=CH.r0;r<=CH.r1+0.01;r+=2)rb(0.07,1.1,0.07,r,CH.oF+0.12,CH.top+0.55);
    for(const r of [CH.r0+0.12,CH.r1-0.12]){rb(0.07,0.07,4.6,r,(CH.oF+0.12+16.2)/2,CH.top+1.1);rb(0.05,0.05,4.6,r,(CH.oF+0.12+16.2)/2,CH.top+0.55);for(const o of[CH.oF+0.12,13.5,15.4,16.2])rb(0.07,1.1,0.07,r,o,CH.top+0.55);}   // 兩端欄杆
    merge(rails,railMat,'xxCheerRails');
    for(const r of [CH.r0+1.0,CH.r1-1.0]){   // 兩支旗桿（附投光燈）與旗幟
      const pp=P(r,17.7);put(MB.CreateCylinder('xxCheerPole',{diameter:0.14,height:6.2,tessellation:8},scene),pp.x,CH.top+3.1,pp.z,railMat);
      const lp=put(MB.CreateBox('xxCheerLamp',{width:1.4,height:0.7,depth:0.25}),pp.x,CH.top+6.4,pp.z,lampMat);lp.rotation.y=ang;
      const fp=P(r+(r<RC?1.25:-1.25),17.7),fl=put(MB.CreatePlane('xxCheerFlag',{width:2.2,height:1.4,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),fp.x,CH.top+4.9,fp.z,flagMat);fl.rotation.y=ang+Math.PI;}
    // 站位（世界座標、面向場內）
    ROWS.forEach(([o,drs],row)=>drs.forEach(dr=>{const p=P(RC+dr,o);cheerSlots.push({side:s,row,x:p.x,y:CH.top,z:p.z,ry:-s*Math.PI/4});}));
    cheerZones.push({side:s,center:{x:c.x,z:c.z},y:CH.top,length:L,depth:WD,slots:ROWS.reduce((n,[,d])=>n+d.length,0)});
  });
  const reg=(window.BaseballStadiums||{}).ocean;if(reg){reg.cheerSlots=cheerSlots;reg.cheerZones=cheerZones;}
}

// ═════════ ⑥ 記分板：掛在高牆上的深藍「手動」風格大板（36×12 m，與乙子園同級；白框、白底分數格，遠看也清楚）═════════
{
  const BW=36,BH=12,BY=6.2,LM=Math.hypot(FW[1][0]-JL[0],FW[1][1]-JL[1]),sc=LM*0.62,cx=JL[0]+dM[0]*sc,cz=JL[1]+dM[1]*sc,nx=-dM[1],nz=dM[0],yawM=Math.atan2(-dM[1],dM[0]);
  const boardTex=sbTexInit();
  const fm=M('#000000');fm.emissiveTexture=boardTex;fm.disableLighting=true;fm.backFaceCulling=false;
  put(MB.CreatePlane('xxBoardFace',{width:BW,height:BH,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),cx-nx*0.78,BY,cz-nz*0.78,fm).rotation.y=yawM;   // 平面預設朝 -local z＝朝向球場
  put(MB.CreateBox('xxBoardFrame',{width:BW+1.0,height:BH+1.0,depth:1.4}),cx,BY,cz,candy('#e8f1ff',0.7)).rotation.y=yawM;
  const top=BY+BH/2+0.5;ghostBox(cx,(MONSTER_H+top)/2,cz,BW+1.0,top-MONSTER_H,1.4,yawM,'scoreboard');          // 高出牆頂的那一截框架是實體
  function drawBoard(g,s,W,H){
    const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',NUM='"Arial Rounded MT Bold","Arial Narrow",Arial,sans-serif';
    const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0b2a70');bg.addColorStop(1,'#071a4a');g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.strokeStyle='#e8f1ff';g.lineWidth=14;rr(10,10,W-20,H-20,28);g.stroke();g.strokeStyle='rgba(120,180,255,0.6)';g.lineWidth=3;rr(28,28,W-56,H-56,20);g.stroke();
    const NX=46,NW=298,IX=NX+NW,IW=84,RX=IX+9*IW+16,RW=100,HY=40,HH=62,R1=HY+HH+8,RH=104,R2=R1+RH+6;
    const tileBox=(x,y,w,h,fill)=>{g.fillStyle=fill;rr(x+5,y+5,w-10,h-10,10);g.fill();};
    const txt=(t,cx,cy,sz,col)=>{g.font='bold '+sz+'px '+NUM;g.textAlign='center';g.textBaseline='middle';g.fillStyle=col;g.fillText(t,cx,cy+2);};
    for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn,x=IX+i*IW;tileBox(x,HY,IW,HH,cur?'#ffd23a':'#1646a0');txt(String(n),x+IW/2,HY+HH/2,42,cur?'#0b1f4d':'#ffffff');}
    [['R','#ff6b78'],['H','#7fd0ff'],['E','#ffd966']].forEach(([t,c],i)=>{tileBox(RX+i*RW,HY,RW,HH,'#0f2f7d');txt(t,RX+i*RW+RW/2,HY+HH/2,44,c);});
    g.font='bold 24px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle='#bcd8ff';g.fillText('球隊',NX+14,HY+HH/2+2);
    [['me',R1,'#ff6b78'],['cpu',R2,'#7fd0ff']].forEach(([key,y,col])=>{
      tileBox(NX,y,NW,RH,'#0f2f7d');g.fillStyle=col;g.fillRect(NX+12,y+14,10,RH-28);
      let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);g.font='bold '+(nm.length>4?44:54)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle='#ffffff';g.fillText(nm,NX+36,y+RH/2+2);
      for(let i=0;i<9;i++){const n=s.first+i,x=IX+i*IW;tileBox(x,y,IW,RH,'#f4f7ff');if(!s.played(key,n))continue;const v=(s.lineScore[key]||[])[n-1];txt(v==null?'0':String(v),x+IW/2,y+RH/2,62,s.current(key,n)?'#d03a1a':'#0b1f4d');}
      [[s.score[key],66,'#ffd23a','#0b1f4d'],[s.hits[key],60,'#f4f7ff','#0b1f4d'],[s.errors[key],60,'#f4f7ff','#0b1f4d']].forEach(([v,sz,fill,tc],i)=>{tileBox(RX+i*RW,y,RW,RH,fill);txt(String(v),RX+i*RW+RW/2,y+RH/2,sz,tc);});
    });
    const by=R2+RH+66;g.textBaseline='middle';
    [['B',s.balls,3,'#46d37a'],['S',s.strikes,2,'#ffd23a'],['O',s.outs,2,'#ff5a5a']].forEach(([lab,n,max,col],r)=>{
      const x0=NX+16+r*210;g.font='bold 46px '+NUM;g.textAlign='left';g.fillStyle=col;g.fillText(lab,x0,by+2);
      for(let i=0;i<max;i++){const cx=x0+68+i*50,lit=i<n;g.fillStyle=lit?col:'#12306f';rr(cx-18,by-18,36,36,8);g.fill();g.strokeStyle=lit?'#ffffff':'rgba(150,190,255,0.55)';g.lineWidth=3;rr(cx-18,by-18,36,36,8);g.stroke();}});
    const dx0=NX+16+3*210+40;
    [[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22,on=s.bases[i];g.save();g.translate(cx,cy);g.rotate(Math.PI/4);g.fillStyle=on?'#ffd23a':'#12306f';g.fillRect(-12,-12,24,24);g.strokeStyle=on?'#ffffff':'rgba(150,190,255,0.55)';g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
    g.textAlign='right';g.font='bold 34px '+FONT;g.fillStyle='#ffffff';g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+(s.batter==null?'':s.batter)),W-48,by);
    // 海洋裝飾：浪線與球場名
    g.strokeStyle='rgba(120,190,255,0.75)';g.lineWidth=3;for(let k=0;k<2;k++){g.beginPath();for(let x=48;x<=W-48;x+=8){const y=H-62+k*14+Math.sin(x/38+k)*6;x===48?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
    g.textAlign='center';g.font='bold 30px '+FONT;g.fillStyle='#cfe4ff';g.fillText('海洋球場  OCEAN PARK',W/2,H-86);
    g.strokeStyle='#cfe4ff';g.lineWidth=4;g.beginPath();g.arc(86,H-92,9,0,TAU);g.moveTo(86,H-83);g.lineTo(86,H-48);g.moveTo(72,H-72);g.lineTo(100,H-72);g.arc(86,H-60,22,0.2,Math.PI-0.2);g.stroke();   // 船錨
  }
  ctx.setScoreboardRenderer(drawBoard);
}

// ═════════ ⑦ 照明塔 ═════════
{const lampTex=(()=>{const S=256,t=newTex('xxLamps',S,S/2),g=t.getContext();g.fillStyle='#dfe8f5';g.fillRect(0,0,S,S/2);for(let i=0;i<8;i++)for(let j=0;j<4;j++){g.fillStyle='#ffffff';g.beginPath();g.arc(16+i*32,16+j*32,11,0,TAU);g.fill();g.strokeStyle='#8a97b0';g.lineWidth=2;g.stroke();}t.update();return t;})();
 const lm=M('#000000');lm.emissiveTexture=lampTex;lm.disableLighting=true;lm.backFaceCulling=false;const pole=candy('#2b3f78',0.4);
 [[-45,-48],[45,-48],[100,72],[32,152],[-72,4]].forEach(([x,z])=>{
   put(MB.CreateCylinder('xxLightPole',{diameterBottom:1.6,diameterTop:0.9,height:44,tessellation:10},scene),x,22,z,pole);
   const yaw=Math.atan2(-x,40-z),p=put(MB.CreateBox('xxLightPanel',{width:14,height:7,depth:0.8}),x,46,z,lm);p.rotation.y=yaw+Math.PI;p.rotation.x=0.18;});}

// ═════════ ⑧ 球場外：濱海公路、大海、船、都市 ═════════
// 座標系：u＝沿海岸線方向（與高牆平行），w＝垂直於海岸線、往海為正（海岸線 w=0；高牆在 w=-52；濱海公路中心 w=-18）。
const nV=[-dM[1],dM[0]],c0=FW[0][0]*nV[0]+FW[0][1]*nV[1]+52;
const toW=(u,w)=>[u*dM[0]+(w+c0)*nV[0],u*dM[1]+(w+c0)*nV[1]],fromW=(x,z)=>[x*dM[0]+z*dM[1],x*nV[0]+z*nV[1]-c0];
const YAW=Math.atan2(-dM[1],dM[0]);      // 方塊的長邊(x)沿著 u 方向時的 rotation.y
const GY=0.08,SEA_Y=0.12,RW=20,SW=4,CX=0,CZ=40;
const UL=[-646,-550,-454,-358,-262,-166,-70,154,250,346,442,538,634,730,826].sort((a,b)=>a-b);   // 垂直於海岸的道路中心線(u)
const WL=[-690,-594,-498,-402,-306,-210,-18];                                                  // 平行於海岸的道路中心線(w)；-18＝濱海公路
const isCenter=(i,j)=>UL[i]===-70&&UL[i+1]===154&&WL[j]===-210&&WL[j+1]===-18;
const CB={u0:-56,u1:140,w0:-196,w1:-32};   // 球場街廓內緣（人行道以內）

// ── 球場佔地多邊形（看台外緣）：用來挖空廣場鋪面、也用來避開建築
const fo=(s,r,o)=>{const p=lpt(s,r,o);return [p.x,p.z];};
const ROUT=14.8;
const poly=[[0,-29.5],[17,-29.5],fo(1,8,29.5),fo(1,(JR[0]+JR[1])*SQ,29.5)];
{const sweep=(F,a0,a1,r,n)=>{const o=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;o.push([F[0]+r*Math.sin(a),F[1]+r*Math.cos(a)]);}return o;};
 poly.push(...sweep(JR,Math.atan2(SIDE_OUT[0],SIDE_OUT[1]),th(EN[3]),ROUT,6));                  // 右界外→右外野 轉角
 poly.push(...sweep(FW[4],th(EN[3]),th(EN[2]),ROUT,6));poly.push(...sweep(FW[3],th(EN[2]),th(EN[1]),ROUT,6));   // 兩個轉角
 poly.push([FW[2][0]+EN[1][0]*ROUT,FW[2][1]+EN[1][1]*ROUT],[FW[1][0]+EN[0][0]*ROUT,FW[1][1]+EN[0][1]*ROUT]);
 poly.push([FW[1][0]+nV[0]*2.5,FW[1][1]+nV[1]*2.5],[JL[0]+nV[0]*2.5,JL[1]+nV[1]*2.5]);        // 高牆海側
 const lp=(r,o)=>fo(-1,r,o);poly.push(lp(((-JL[0]+JL[1])*SQ),29.5),lp(8,29.5),[-17,-29.5]);}
const castPoly=th2=>{const dx=Math.cos(th2),dz=Math.sin(th2);let best=1e9;
  for(let j=0;j<poly.length;j++){const A=poly[j],B=poly[(j+1)%poly.length],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
    const ax=A[0]-CX,az=A[1]-CZ,t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6&&t<best)best=t;}
  return best;};
const NA=216,rho=[];for(let i=0;i<NA;i++)rho.push(castPoly(i*TAU/NA));
const rhoAt=th2=>{th2=((th2%TAU)+TAU)%TAU;const f=th2/TAU*NA,i0=Math.floor(f)%NA,i1=(i0+1)%NA,w=f-Math.floor(f);return rho[i0]*(1-w)+rho[i1]*w;};
const dOut=(x,z)=>{const dx=x-CX,dz=z-CZ;return Math.hypot(dx,dz)-rhoAt(Math.atan2(dz,dx));};

// ── 地面材質貼圖（路面／斑馬線／人行道／街廓鋪面／廣場／沙灘）
function roadTex(){const S=256,kx=S/20,ky=S/24,t=newTex('xxRoad',S,S),g=t.getContext(),r=rng(5),R=(u0,v0,u1,v1,c)=>{g.fillStyle=c;g.fillRect(u0*kx,v0*ky,(u1-u0)*kx,(v1-v0)*ky);};
  R(0,0,20,24,'#1b1e26');speck(g,S,r,5000,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');R(9.78,0,9.93,24,'#d9b43a');R(10.07,0,10.22,24,'#d9b43a');R(1,0,1.15,24,'#d6dae3');R(18.85,0,19,24,'#d6dae3');
  [1.5,13.5].forEach(v=>{R(4.92,v,5.08,v+3,'#d6dae3');R(14.92,v,15.08,v+3,'#d6dae3');});t.update();return t;}
function zebraTex(){const S=128,t=newTex('xxZebra',S,S),g=t.getContext(),r=rng(6);g.fillStyle='#1b1e26';g.fillRect(0,0,S,S);speck(g,S,r,1500,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');g.fillStyle='#cfd3dc';g.fillRect(0,0,S/4,S);g.fillRect(S/2,0,S/4,S);t.update();return t;}
function asphaltTex(){const S=128,t=newTex('xxAsph',S,S),g=t.getContext(),r=rng(7);g.fillStyle='#1b1e26';g.fillRect(0,0,S,S);speck(g,S,r,2500,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');t.update();return t;}
function sidewalkTex(){const W=128,H=256,t=newTex('xxSide',W,H),g=t.getContext(),r=rng(8);g.fillStyle='#4d5361';g.fillRect(0,0,W,H);speck(g,W,r,2500,'rgba(255,255,255,0.05)','rgba(0,0,0,0.10)');g.fillStyle='#9aa1b3';g.fillRect(0,0,W*0.0875,H);
  g.strokeStyle='rgba(0,0,0,0.28)';g.lineWidth=1;g.beginPath();for(let v=0;v<=8;v++){g.moveTo(0,v*H/8);g.lineTo(W,v*H/8);}g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();t.update();return t;}
function paveTex(){const S=512,k=S/16,t=newTex('xxPave',S,S),g=t.getContext(),r=rng(9);g.fillStyle='#232c44';g.fillRect(0,0,S,S);speck(g,S,r,6000,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');
  for(let m=0;m<=16;m+=2){g.strokeStyle=m%4?'rgba(0,0,0,0.12)':'rgba(0,0,0,0.28)';g.lineWidth=m%4?1:2;g.beginPath();g.moveTo(m*k,0);g.lineTo(m*k,S);g.moveTo(0,m*k);g.lineTo(S,m*k);g.stroke();}t.update();return t;}
function plazaTex(){const S=512,k=S/16,t=newTex('xxPlaza',S,S),g=t.getContext(),r=rng(10);g.fillStyle='#2d3d6a';g.fillRect(0,0,S,S);speck(g,S,r,8000,'rgba(255,255,255,0.05)','rgba(0,0,0,0.10)');
  g.strokeStyle='rgba(0,0,0,0.30)';g.lineWidth=2;for(let m=0;m<=16;m+=2){g.beginPath();g.moveTo(m*k,0);g.lineTo(m*k,S);g.moveTo(0,m*k);g.lineTo(S,m*k);g.stroke();}
  g.fillStyle='rgba(140,200,255,0.75)';g.fillRect(7.9*k,0,0.2*k,S);g.fillRect(0,7.9*k,S,0.2*k);g.fillRect(0,0,0.1*k,S);g.fillRect(S-0.1*k,0,0.1*k,S);g.fillRect(0,0,S,0.1*k);g.fillRect(0,S-0.1*k,S,0.1*k);t.update();return t;}
function sandTex(){const S=256,t=newTex('xxSand',S,S),g=t.getContext(),r=rng(12),img=g.createImageData(S,S),d=img.data;for(let i=0;i<S*S*4;i+=4){const k=1+(r()-0.5)*0.14;d[i]=214*k;d[i+1]=194*k;d[i+2]=150*k;d[i+3]=255;}g.putImageData(img,0,0);
  for(let n=0;n<60;n++){const x=r()*S,y=r()*S,rr2=10+r()*30;tile(S,x,y,rr2,(dx,dy)=>{g.fillStyle=n%2?'rgba(255,240,200,0.12)':'rgba(150,120,80,0.10)';g.beginPath();g.arc(x+dx,y+dy,rr2,0,TAU);g.fill();});}t.update();return t;}
const gMat={road:roadTex(),zebra:zebraTex(),asph:asphaltTex(),side:sidewalkTex(),pave:paveTex(),plaza:plazaTex(),sand:sandTex()};
Object.keys(gMat).forEach(k=>{const m=texMat(gMat[k],1);m.backFaceCulling=false;gMat[k]=m;});
const acc={};
const gq=(key,pts,uvf)=>{const a=acc[key]||(acc[key]={pos:[],uv:[],idx:[]}),n=a.pos.length/3;pts.forEach(([x,z])=>{a.pos.push(x,GY,z);const q=uvf(x,z);a.uv.push(q[0],q[1]);});a.idx.push(n,n+1,n+2,n,n+2,n+3);};
// 在 (u,w) 座標裡畫矩形（轉成世界座標），uvf 吃 (u,w)
const rectUW=(key,u0,w0,u1,w1,uvf)=>gq(key,[[u0,w0],[u1,w0],[u1,w1],[u0,w1]].map(([u,w])=>toW(u,w)),(x,z)=>{const q=fromW(x,z);return uvf(q[0],q[1]);});
const UW8=(u,w)=>[u/8,w/8];
for(const U of UL)for(const W of WL)rectUW('asph',U-RW/2,W-RW/2,U+RW/2,W+RW/2,UW8);          // 路口
function roadSeg(vert,C,a,b){   // vert：沿 w 的路(固定 u=C)；否則沿 u 的路(固定 w=C)
  const c0_=C-RW/2,c1_=C+RW/2,piece=(key,p0,p1,uvf)=>vert?rectUW(key,c0_,p0,c1_,p1,uvf):rectUW(key,p0,c0_,p1,c1_,uvf);
  const zeb=p0=>(u,w)=>vert?[(u-c0_)/2.4,(w-p0)/3.6]:[(w-c0_)/2.4,(u-p0)/3.6];
  piece('asph',a,a+0.8,UW8);piece('zebra',a+0.8,a+4.4,zeb(a+0.8));
  piece('road',a+4.4,b-4.4,(u,w)=>vert?[(u-c0_)/RW,(w-(a+4.4))/24]:[(w-c0_)/RW,(u-(a+4.4))/24]);
  piece('zebra',b-4.4,b-0.8,zeb(b-4.4));piece('asph',b-0.8,b,UW8);
}
for(const U of UL)for(let j=0;j<WL.length-1;j++)roadSeg(true,U,WL[j]+RW/2,WL[j+1]-RW/2);       // 垂直於海岸的路（到濱海公路為止）
for(const W of WL)for(let i=0;i<UL.length-1;i++)roadSeg(false,W,UL[i]+RW/2,UL[i+1]-RW/2);     // 平行於海岸的路
// 濱海公路兩端延伸到更遠
{const uA=UL[0]-RW/2,uB=UL[UL.length-1]+RW/2;for(const [a,b] of [[uA-500,uA],[uB,uB+500]])rectUW('road',a,-18-RW/2,b,-18+RW/2,(u,w)=>[(w-(-18-RW/2))/RW,(u-a)/24]);}
// 街廓：人行道（路緣在外側）＋內部鋪面（中央街廓內部改鋪廣場並挖空球場佔地）
for(let i=0;i<UL.length-1;i++)for(let j=0;j<WL.length-1;j++){
  const u0=UL[i]+RW/2,u1=UL[i+1]-RW/2,w0=WL[j]+RW/2,w1=WL[j+1]-RW/2;
  rectUW('side',u0,w0,u1,w0+SW,(u,w)=>[(w-w0)/SW,(u-u0)/8]);rectUW('side',u0,w1-SW,u1,w1,(u,w)=>[(w1-w)/SW,(u-u0)/8]);
  rectUW('side',u0,w0+SW,u0+SW,w1-SW,(u,w)=>[(u-u0)/SW,(w-w0)/8]);rectUW('side',u1-SW,w0+SW,u1,w1-SW,(u,w)=>[(u1-u)/SW,(w-w0)/8]);
  if(!isCenter(i,j))rectUW('pave',u0+SW,w0+SW,u1-SW,w1-SW,(u,w)=>[u/16,w/16]);
}
// 海側：步道（路緣靠公路）＋沙灘
{const uA=UL[0]-500,uB=UL[UL.length-1]+500;rectUW('side',uA,-8,uB,-4,(u,w)=>[(w+8)/4,u/8]);rectUW('sand',uA,-4,uB,0,UW8);}
// 中央街廓的廣場：內緣矩形 與 球場佔地多邊形 之間（以 (CX,CZ) 為中心逐角度切片；多邊形頂點與矩形四角都加進取樣角）
{const ctr=fromW(CX,CZ);
 const castRect=th2=>{const dx=Math.cos(th2),dz=Math.sin(th2),du=dx*dM[0]+dz*dM[1],dw=dx*nV[0]+dz*nV[1];
   const tu=du>1e-12?(CB.u1-ctr[0])/du:du<-1e-12?(CB.u0-ctr[0])/du:1e9,tw=dw>1e-12?(CB.w1-ctr[1])/dw:dw<-1e-12?(CB.w0-ctr[1])/dw:1e9;return Math.min(tu,tw);};
 const angOf=(x,z)=>((Math.atan2(z-CZ,x-CX)%TAU)+TAU)%TAU,raw=[];
 for(let i=0;i<NA;i++)raw.push(i*TAU/NA);poly.forEach(([x,z])=>raw.push(angOf(x,z)));
 [[CB.u0,CB.w0],[CB.u1,CB.w0],[CB.u0,CB.w1],[CB.u1,CB.w1]].forEach(([u,w])=>{const p=toW(u,w);raw.push(angOf(p[0],p[1]));});
 raw.sort((a,b)=>a-b);const A=raw.filter((a,i)=>i===0||a-raw[i-1]>1e-7),PX=(t2,r)=>[CX+r*Math.cos(t2),CZ+r*Math.sin(t2)];
 for(let i=0;i<A.length;i++){const t0=A[i],t1=i===A.length-1?A[0]+TAU:A[i+1];
   gq('plaza',[PX(t0,castPoly(t0)),PX(t0,castRect(t0)),PX(t1,castRect(t1)),PX(t1,castPoly(t1))],(x,z)=>[x/16,z/16]);}}
Object.keys(acc).forEach(key=>{const a=acc[key],m=new BABYLON.Mesh('xxGround_'+key,scene),vd=new BABYLON.VertexData(),nor=[];for(let q=0;q<a.pos.length/3;q++)nor.push(0,1,0);
  vd.positions=a.pos;vd.normals=nor;vd.uvs=a.uv;vd.indices=a.idx;vd.applyToMesh(m);m.material=gMat[key];m.isPickable=false;});

// ── 大海：從海岸線(w=0)往外，淺青綠 → 深藍；貼圖提供浪紋（與頂點色相乘），岸邊白色浪花
let seaMesh=null;
{const S=512,t=newTex('xxSeaTex',S,S),g=t.getContext(),r=rng(77);
 g.fillStyle='#d8e6f6';g.fillRect(0,0,S,S);speck(g,S,r,4000,'rgba(255,255,255,0.10)','rgba(0,40,100,0.08)');
 for(let L=0;L<26;L++){const y0=L*S/26+r()*6,k=2+((r()*3)|0),ph=r()*TAU,amp=3+r()*5;
   for(const [col,off] of [['rgba(255,255,255,0.40)',0],['rgba(0,50,120,0.22)',3]]){g.strokeStyle=col;g.lineWidth=1.6;g.beginPath();for(let x=0;x<=S;x+=4){const y=y0+off+amp*Math.sin(x/S*TAU*k+ph);x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}}
 for(let n=0;n<160;n++){const x=r()*S,y=r()*S;tile(S,x,y,6,(dx,dy)=>{g.fillStyle='rgba(255,255,255,0.7)';g.fillRect(x+dx,y+dy,2+r()*3,1.2);});}
 t.update();
 const sm=M('#000000');sm.emissiveTexture=t;sm.disableLighting=true;sm.backFaceCulling=false;
 const stops=[[0,[1,1,1]],[1.2,[0.80,0.97,0.96]],[4,[0.30,0.80,0.84]],[12,[0.12,0.56,0.76]],[35,[0.06,0.38,0.66]],[90,[0.04,0.25,0.52]],[260,[0.03,0.15,0.38]],[3200,[0.02,0.09,0.27]]];
 const UA=-2200,UB=2200,pos=[],uv=[],col=[],idx=[];
 stops.forEach(([w,c])=>[UA,UB].forEach(u=>{const p=toW(u,w);pos.push(p[0],SEA_Y,p[1]);uv.push(p[0]/64,p[1]/64);col.push(c[0],c[1],c[2],1);}));
 for(let i=0;i<stops.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 const nor=[];for(let q=0;q<pos.length/3;q++)nor.push(0,1,0);
 const sea=new BABYLON.Mesh('xxSea',scene),vd=new BABYLON.VertexData();vd.positions=pos;vd.normals=nor;vd.uvs=uv;vd.colors=col;vd.indices=idx;vd.applyToMesh(sea);sea.material=sm;sea.isPickable=false;seaMesh=sea;}

// ── 船：自訂船殼（五邊形甲板＋收窄的船底）＋艙房、貨櫃、桅桿、帆
const shipG={};   // 材質 → mesh 陣列，最後依材質合併
const sMat={};const sm_=(h,k)=>sMat[h]||(sMat[h]=candy(h,k==null?0.35:k));
const addShip=(hex,mesh,k)=>{(shipG[hex]||(shipG[hex]={mat:sm_(hex,k),arr:[]})).arr.push(mesh);};
function hullMesh(L,W,H,bowL){
  const top=[[-L/2,-W/2],[-L/2,W/2],[L/2-bowL,W/2],[L/2,0],[L/2-bowL,-W/2]],bot=[[-L/2+L*0.04,-W*0.3],[-L/2+L*0.04,W*0.3],[L/2-bowL,W*0.3],[L/2-L*0.01,0],[L/2-bowL,-W*0.3]],pos=[],idx=[];
  top.forEach(([x,z])=>pos.push(x,H,z));bot.forEach(([x,z])=>pos.push(x,0,z));pos.push(-bowL/2*0,H,0,0,0,0);
  const n=5,cT=2*n,cB=2*n+1;
  for(let i=0;i<n;i++){const j=(i+1)%n;idx.push(cT,i,j);idx.push(cB,n+j,n+i);idx.push(i,n+i,n+j,i,n+j,j);}
  const m=new BABYLON.Mesh('xxHull',scene),vd=new BABYLON.VertexData(),nor=[];vd.positions=pos;vd.indices=idx;BABYLON.VertexData.ComputeNormals(pos,idx,nor);vd.normals=nor;vd.uvs=new Array(pos.length/3*2).fill(0);vd.applyToMesh(m);return m;
}
function shipPart(mesh,x,y,z,sx,sy,sz,yaw,lx,ly,lz,hex,k){   // 局部座標(lx,ly,lz)→世界
  const c=Math.cos(yaw),s=Math.sin(yaw);mesh.position.set(sx+lx*c+lz*s,sy+ly,sz-lx*s+lz*c);mesh.rotation.y=yaw+(x||0);addShip(hex,mesh,k);return mesh;
}
function boxPart(sx,sy,sz,yaw,lx,ly,lz,w,h,d,hex,k){const b=MB.CreateBox('xxShipB',{width:w,height:h,depth:d},scene);return shipPart(b,0,0,0,sx,sy,sz,yaw,lx,ly+h/2,lz,hex,k);}
function ship(type,u,w,dir,sc){
  const p=toW(u,w),yaw=YAW+(dir<0?Math.PI:0),X=p[0],Z=p[1];sc=sc||1;
  const part=(lx,ly,lz,wd,h,d,hex,k)=>boxPart(X,0.1,Z,yaw,lx*sc,ly*sc,lz*sc,wd*sc,h*sc,d*sc,hex,k);
  const hull=(L,Wd,H,bow,hex,k)=>{const m=hullMesh(L*sc,Wd*sc,H*sc,bow*sc);shipPart(m,0,0,0,X,0.1,Z,yaw,0,0,0,hex,k);};
  if(type==='cargo'){hull(190,28,14,28,'#0b2457');part(0,14,0,158,1,26,'#c7d3ea',0.3);                       // 船殼＋甲板
    part(-80,15,0,22,26,22,'#f1f5ff',0.5);part(-80,41,0,12,6,16,'#f1f5ff',0.5);part(-86,47,0,3,10,3,'#ff5a5a',0.8);   // 艙房與煙囪
    const cc=['#e8503a','#2b6fd6','#f2b632','#2fa36b','#d8dde8','#8a3fd0'],rr=rng(u*7+w|0);
    for(let b=0;b<9;b++)for(let r2=-2;r2<=2;r2++){const hgt=1+((rr()*4)|0);for(let q=0;q<hgt;q++)part(-52+b*13.5,15+q*5.2,r2*5.3,12.4,5,5,cc[(rr()*cc.length)|0],0.45);}}
  else if(type==='tanker'){hull(230,38,15,34,'#0a1f4d');part(0,15,0,196,1.5,36,'#a53a2e',0.4);part(-96,16.5,0,24,30,30,'#f1f5ff',0.5);part(-96,46,0,14,6,18,'#f1f5ff',0.5);
    for(let i=0;i<7;i++)part(-60+i*26,16.5,0,12,3,3,'#8a96b0',0.3);part(-103,52,0,4,12,4,'#ffd23a',0.8);}
  else if(type==='ferry'){hull(52,12,5,8,'#0d2b66');part(-2,5,0,40,5,10,'#f4f7ff',0.5);part(-2,10,0,30,4,9,'#f4f7ff',0.5);part(-2,14,0,16,4,8,'#cfe0ff',0.5);
    part(-2,6.4,0,40.2,1.2,10.2,'#1d6fd1',0.6);part(-2,11.2,0,30.2,1.1,9.2,'#1d6fd1',0.6);part(-8,18,0,3,6,3,'#ff5a5a',0.8);}
  else if(type==='sail'){hull(11,3.2,1.3,2.2,'#f4f7ff');part(0,1.3,0,5,1.2,2.2,'#d6e4ff',0.4);const mast=MB.CreateCylinder('xxMast',{diameter:0.18,height:13,tessellation:6},scene);shipPart(mast,0,0,0,X,0.1,Z,yaw,0.5*sc,6.8*sc,0,'#b9c6e6',0.4);
    for(const [dx2,hh,col] of [[0.3,11.6,'#ffffff'],[2.4,7.0,'#ffd0c8']]){const tri=new BABYLON.Mesh('xxSail',scene),vd=new BABYLON.VertexData();vd.positions=[0,1.6,0,0,hh,0,-4.4,1.6,0];vd.indices=[0,1,2,0,2,1];vd.normals=[0,0,1,0,0,1,0,0,1];vd.uvs=[0,0,0,1,1,0];vd.applyToMesh(tri);
      shipPart(tri,0,0,0,X,0.1,Z,yaw,dx2*sc,0,0,col,0.7);tri.scaling.set(sc,sc,sc);}}
  else if(type==='fish'){hull(14,4,1.8,3,'#143a82');part(-2,1.8,0,5,2.6,3,'#f4f7ff',0.5);part(-3,4.4,0,1,3,1,'#ffb000',0.9);part(2.5,3.2,0,0.5,0.5,0.5,'#ffffaa',1);}
}
[['cargo',-140,430,1,1],['cargo',520,820,-1,1.1],['tanker',-560,1000,1,1],['tanker',700,1500,-1,1],['ferry',70,170,1,1],['ferry',-300,260,-1,0.9],
 ['sail',-20,60,1,1.2],['sail',140,95,-1,1],['sail',-190,120,1,1],['sail',260,70,1,1.1],['sail',-60,210,-1,0.9],['fish',-110,45,1,1],['fish',210,130,1,1],['fish',330,200,-1,1],['fish',-250,80,1,1]]
 .forEach(([t,u,w,d,s])=>ship(t,u,w,d,s));
Object.values(shipG).forEach(o=>merge(o.arr,o.mat,'xxShips'));
// 浮標與燈塔
{const bm=[],rm=[];[[-80,30],[200,40],[-210,150],[120,260],[360,120]].forEach(([u,w])=>{const p=toW(u,w);const b=MB.CreateCylinder('xxBuoy',{diameterBottom:2.4,diameterTop:1.2,height:2.8,tessellation:10},scene);b.position.set(p[0],1.2,p[1]);bm.push(b);
    const l=MB.CreateSphere('xxBuoyL',{diameter:0.8,segments:6},scene);l.position.set(p[0],3.4,p[1]);rm.push(l);});
  merge(bm,candy('#e8503a',0.6),'xxBuoys');merge(rm,M('#ffee88',{em:'#ffee88'}),'xxBuoyLights');
  // 防波堤＋燈塔（深藍白條紋）
  const pj=toW(-30,26),jetty=put(MB.CreateBox('xxJetty',{width:6,height:1.6,depth:56}),pj[0],0.5,pj[1],candy('#3a4a74',0.4));jetty.rotation.y=YAW+Math.PI/2;
  const lt=toW(-30,52),segs=[];for(let i=0;i<6;i++){const c=MB.CreateCylinder('xxLH',{diameterBottom:7-i*0.45,diameterTop:7-(i+1)*0.45,height:5,tessellation:16},scene);c.position.set(lt[0],1.2+2.5+i*5,lt[1]);(i%2?segs:bm).push(c);}
  merge(segs,candy('#f4f7ff',0.6),'xxLighthouseW');
  const stripeN=[];for(let i=0;i<6;i+=2){const c=MB.CreateCylinder('xxLHs',{diameterBottom:7-i*0.45,diameterTop:7-(i+1)*0.45,height:5,tessellation:16},scene);c.position.set(lt[0],1.2+2.5+i*5,lt[1]);stripeN.push(c);}
  merge(stripeN,candy('#12307a',0.6),'xxLighthouseN');
  put(MB.CreateCylinder('xxLHlamp',{diameter:3.4,height:3,tessellation:12},scene),lt[0],1.2+31.5,lt[1],M('#fff2a0',{em:'#fff2a0'}));
  put(MB.CreateCylinder('xxLHroof',{diameterBottom:4.4,diameterTop:0.4,height:2.4,tessellation:12},scene),lt[0],1.2+34.2,lt[1],candy('#12307a',0.6));}

// ── 棕櫚樹（沿海邊步道）、護欄、路燈、車燈
{const trunk=[],frond=[],rp=rng(808);
 for(let u=-420;u<=620;u+=15){const p=toW(u+rp()*4,-6.2),h=5.5+rp()*2.2,lean=(rp()-0.5)*0.25;
   const tr=MB.CreateCylinder('xxTrunk',{diameterBottom:0.5,diameterTop:0.3,height:h,tessellation:7},scene);tr.position.set(p[0],h/2,p[1]);tr.rotation.z=lean;trunk.push(tr);
   const tx=p[0]-Math.sin(lean)*h*0.5,ty=h-0.1,tz=p[1];
   for(let k=0;k<8;k++){const a=k*TAU/8+rp()*0.3,f=MB.CreateBox('xxFrond',{width:3.6,height:0.06,depth:0.7},scene);f.position.set(tx+Math.cos(a)*1.6,ty+0.2,tz+Math.sin(a)*1.6);f.rotation.y=-a;f.rotation.z=-0.38;frond.push(f);}}
 merge(trunk,candy('#7a5a3a',0.4),'xxPalmTrunks');merge(frond,candy('#2f9a5a',0.5),'xxPalmFronds');
 // 步道護欄（沿海岸一條長欄杆）
 const rl=toW(100,-4.3),rail=put(MB.CreateBox('xxRail',{width:1500,height:0.12,depth:0.12}),rl[0],1.05,rl[1],candy('#e8f1ff',0.7));rail.rotation.y=YAW;
 const rl2=toW(100,-4.3),rail2=put(MB.CreateBox('xxRail2',{width:1500,height:0.1,depth:0.1}),rl2[0],0.5,rl2[1],candy('#9fb7e6',0.5));rail2.rotation.y=YAW;}
{const heads=[],poles=[],carsR=[],carsW=[],carsA=[],lanes=[-7.5,-2.5,2.5,7.5],rn2=rng(4242);
 const near=(x,z)=>dOut(x,z)>6&&Math.hypot(x-CX,z-CZ)<520;
 const seg=(vert,C,a,b)=>{let c=0;for(let s=a+16;s<=b-16;s+=8,c++){
   const P=off=>vert?toW(C+off,s):toW(s,C+off);
   if(c%6===0)[-12,12].forEach(off=>{const p=P(off);if(!near(p[0],p[1]))return;const pl=MB.CreateBox('xxPole2',{width:0.25,height:8,depth:0.25},scene);pl.position.set(p[0],4,p[1]);poles.push(pl);
     const hd=MB.CreateBox('xxLamp',{width:2.2,height:0.3,depth:0.5},scene);hd.position.set(p[0],8.1,p[1]);hd.rotation.y=vert?YAW+Math.PI/2:YAW;heads.push(hd);});
   if(rn2()<0.12){const p=P(lanes[(rn2()*4)|0]);if(!near(p[0],p[1]))continue;const cb=MB.CreateBox('xxCar',{width:1.5,height:0.3,depth:0.25},scene);cb.position.set(p[0],0.7,p[1]);cb.rotation.y=vert?YAW+Math.PI/2:YAW;const q=rn2();(q<0.5?carsR:q<0.9?carsW:carsA).push(cb);}}};
 for(const U of UL)for(let j=0;j<WL.length-1;j++)seg(true,U,WL[j]+RW/2,WL[j+1]-RW/2);
 for(const W of WL)for(let i=0;i<UL.length-1;i++)seg(false,W,UL[i]+RW/2,UL[i+1]-RW/2);
 merge(poles,M('#1a1f2b'),'xxPoles');merge(heads,M('#ffd9a0',{em:'#ffd9a0'}),'xxLamps');
 merge(carsR,M('#ff2a2a',{em:'#ff2a2a'}),'xxCarsR');merge(carsW,M('#fff1d0',{em:'#fff1d0'}),'xxCarsW');merge(carsA,M('#ffb000',{em:'#ffb000'}),'xxCarsA');}


// ── 球落入海中：海面不是碰撞物件（沒有登錄任何碰撞），球一落到海面（海岸線外）就下沉並濺起水花，沉到海面下後被海面遮住、再整個隱藏；
//    下一球（球回到海以外）自動恢復。外掛介面沒有水面物理，所以這裡用「每幀監看球的位置」實作；監看器會在球場被換掉（海 mesh 被 dispose）時自行移除。
{
  const SINK_V=1.1,DEEP=-6,wOf=(x,z)=>x*nV[0]+z*nV[1]-c0;
  let ball=null,st=null,findT=0;const splashes=[];
  const findBall=()=>scene.meshes.find(m=>/^ball$/i.test(m.name))||scene.meshes.find(m=>/^(base)?ball/i.test(m.name)&&!/^xx|shadow/i.test(m.name));
  const splash=(x,z)=>{
    const mat=M('#dff3ff',{em:'#9fd4ff',alpha:0.8}),ring=MB.CreateTorus('xxSplashRing',{diameter:1,thickness:0.14,tessellation:28},scene);ring.position.set(x,SEA_Y+0.04,z);ring.material=mat;ring.isPickable=false;
    const drops=[];for(let i=0;i<9;i++){const d=MB.CreateSphere('xxSplashDrop',{diameter:0.2,segments:4},scene),a=i/9*TAU,sp=1.5+((i*37)%10)/10*1.6;d.material=mat;d.isPickable=false;d.position.set(x,SEA_Y,z);drops.push({m:d,vx:Math.cos(a)*sp,vz:Math.sin(a)*sp,vy:3.2+((i*53)%10)/10*2});}
    splashes.push({t:0,ring,drops,mat});
  };
  const killSplash=sp=>{sp.ring.dispose();sp.drops.forEach(d=>d.m.dispose());sp.mat.dispose();};
  const obs=scene.onBeforeRenderObservable.add(()=>{
    if(!seaMesh||seaMesh.isDisposed()){scene.onBeforeRenderObservable.remove(obs);splashes.splice(0).forEach(killSplash);return;}
    const dt=Math.min(0.05,(scene.getEngine().getDeltaTime()/1000)||0.016);
    for(let i=splashes.length-1;i>=0;i--){const sp=splashes[i];sp.t+=dt;
      if(sp.t>1.0){killSplash(sp);splashes.splice(i,1);continue;}
      const k=1+sp.t*9;sp.ring.scaling.set(k,1,k);sp.mat.alpha=0.8*(1-sp.t);
      sp.drops.forEach(d=>{d.vy-=9.8*dt;d.m.position.x+=d.vx*dt;d.m.position.z+=d.vz*dt;d.m.position.y=Math.max(SEA_Y,d.m.position.y+d.vy*dt);});}
    if(!ball||ball.isDisposed()){if(--findT<=0){ball=findBall();findT=30;}if(!ball)return;}
    const p=ball.position,inSea=wOf(p.x,p.z)>0.5;
    if(!st){if(inSea&&p.y<=0.35&&ball.isVisible&&ball.isEnabled()){st={t:0,hidden:false};splash(p.x,p.z);}return;}
    if(!inSea){if(st.hidden)ball.isVisible=true;st=null;return;}          // 球回到海以外（新的一球）→ 恢復
    st.t+=dt;const y=SEA_Y-0.1-SINK_V*st.t;
    if(y<DEEP){ball.isVisible=false;st.hidden=true;}else ball.position.y=Math.min(p.y,y);
  });
}

// ── 內陸大樓：街廓（人行道以內）依大小切成約 30 m 的地塊；靠海一側較矮、越內陸越高
function winTex(style,seed){
  const S=768,CW=64,CH=128,t=newTex('xxWin'+style,S,S),g=t.getContext(),r=rng(seed),FAC=['#12151f','#0a1224','#1b1620','#070b16','#2a2a32','#202636'][style],pick=a=>a[(r()*a.length)|0];
  g.fillStyle=FAC;g.fillRect(0,0,S,S);
  for(let row=0;row<6;row++)for(let c=0;c<12;c++){const x=c*CW,y=row*CH,lit=r();
    if(style===0){const gr=g.createLinearGradient(0,y+14,0,y+104);if(lit<0.5){gr.addColorStop(0,pick(['#ffd89a','#ffe9c0','#ffc46b','#fff3d6']));gr.addColorStop(1,'#d9a35a');}else{gr.addColorStop(0,'#16213a');gr.addColorStop(1,'#0b1020');}g.fillStyle=gr;g.fillRect(x+8,y+14,48,90);}
    else if(style===1){g.fillStyle='#10264a';g.fillRect(x,y+10,CW,98);if(lit<0.45){g.fillStyle=pick(['#9fd2ff','#e6f4ff','#7fb8f0']);g.globalAlpha=0.55+r()*0.4;g.fillRect(x+3,y+14,CW-6,90);g.globalAlpha=1;}g.fillStyle=FAC;g.fillRect(x+CW-2,y+10,3,98);}
    else if(style===2){g.fillStyle=lit<0.42?(r()<0.1?'#8fb6ff':pick(['#ffb86b','#ffd9a0','#ff9d5c'])):'#120f18';g.fillRect(x+14,y+26,36,64);g.fillStyle='#2a2330';g.fillRect(x+4,y+94,56,8);}
    else if(style===3){const gr=g.createLinearGradient(0,y,0,y+CH-16);if(lit<0.6){gr.addColorStop(0,pick(['#5fe6ff','#8af0ff','#b48bff']));gr.addColorStop(1,'#2a6bd6');}else{gr.addColorStop(0,'#0c1630');gr.addColorStop(1,'#0c1630');}g.fillStyle=gr;g.fillRect(x+16,y,32,CH-16);}
    else if(style===4){g.fillStyle='#3a3a45';g.fillRect(x+2,y,8,CH-14);g.fillStyle=lit<0.35?'#ffd27a':'#101018';g.fillRect(x+22,y+14,20,96);}
    else{g.fillStyle=lit<0.85?pick(['#fff6e0','#eaf4ff','#ffe9b8']):'#1a2236';g.fillRect(x+6,y+10,52,100);}
    g.fillStyle='#05070c';g.fillRect(x,y+CH-14,CW,14);}
  t.update();return t;
}
{const MATS=[0,1,2,3,4,5].map(i=>texMat(winTex(i,100+i*17),0.95)),G=MATS.map(()=>[]),ROOF=V4(0.01,0.002,0.03,0.014),rn=rng(20261026);
 const NEON=['#ff2d95','#19d3ff','#ffb000','#7cff4f','#b86bff'],neonG=NEON.map(()=>[]),spireG=[],beaconG=[];
 const snap=(v,m)=>Math.max(m,Math.round(v/m)*m);
 function box(u,w,wu,wd,h,y0,st){const uw=wu/24,ud=wd/24,vh=h/24,ou=((rn()*12)|0)/12,ov=((rn()*6)|0)/6,p=toW(u,w);
   const b=MB.CreateBox('xxB',{width:wu,height:h,depth:wd,faceUV:[V4(ou,ov,ou+uw,ov+vh),V4(ou,ov,ou+uw,ov+vh),V4(ou,ov,ou+ud,ov+vh),V4(ou,ov,ou+ud,ov+vh),ROOF,ROOF]},scene);
   b.position.set(p[0],y0+h/2,p[1]);b.rotation.y=YAW;G[st].push(b);}
 function cylB(u,w,dia,h,y0,st){const cells=Math.max(6,Math.round(Math.PI*dia/2)),ou=((rn()*12)|0)/12,ov=((rn()*6)|0)/6,p=toW(u,w);
   const b=MB.CreateCylinder('xxC',{diameter:dia,height:h,tessellation:28,faceUV:[V4(0,0,1,1),V4(ou,ov,ou+cells/12,ov+h/24),ROOF]},scene);b.position.set(p[0],y0+h/2,p[1]);G[st].push(b);}
 function crown(u,w,wu,wd,h){const ci=(rn()*NEON.length)|0,p=toW(u,w);
   if(h>=96){const n=MB.CreateBox('xxNeon',{width:wu+0.6,height:1.2,depth:wd+0.6},scene);n.position.set(p[0],h-3,p[1]);n.rotation.y=YAW;neonG[ci].push(n);}
   if(h>=130&&rn()<0.75){const sh=10+rn()*30,sp=MB.CreateCylinder('xxSpire',{diameter:0.7,height:sh,tessellation:6},scene);sp.position.set(p[0],h+sh/2,p[1]);spireG.push(sp);
     const bc=MB.CreateSphere('xxBeacon',{diameter:1.6,segments:6},scene);bc.position.set(p[0],h+sh,p[1]);beaconG.push(bc);}}
 const styleFor=h=>{const a=h<50?[2,4,0,5,2]:h<110?[0,1,5,2,4,1]:[1,3,5,0,1,3];return a[(rn()*a.length)|0];};
 const okRect=(u,w,wu,wd,m)=>{for(const su of[-1,0,1])for(const sw of[-1,0,1]){const p=toW(u+su*wu/2,w+sw*wd/2);if(dOut(p[0],p[1])<m)return false;}return true;};
 for(let i=0;i<UL.length-1;i++)for(let j=0;j<WL.length-1;j++){
   if(isCenter(i,j))continue;
   const u0=UL[i]+RW/2+SW,u1=UL[i+1]-RW/2-SW,w0=WL[j]+RW/2+SW,w1=WL[j+1]-RW/2-SW,iw=u1-u0,ih=w1-w0,nx=Math.max(1,Math.floor(iw/32)),nz=Math.max(1,Math.floor(ih/32)),cw=iw/nx,ch=ih/nz;
   for(let a=0;a<nx;a++)for(let b=0;b<nz;b++){
     const wu=snap(cw-2-rn()*3,2),wd=snap(ch-2-rn()*3,2),u=u0+cw*(a+0.5),w=w0+ch*(b+0.5),p=toW(u,w);
     if(Math.hypot(p[0]-CX,p[1]-CZ)>560||!okRect(u,w,wu+2,wd+2,10))continue;
     const hw=-w,coast=w>-120,base=coast?18+hw*0.1:30+hw*0.08,sp=coast?44+hw*0.25:70+hw*0.3;     // 靠海一側較矮
     const h=snap(base+sp*Math.pow(rn(),1.7),4);
     if(h>=64&&rn()<0.45){const hp=snap(8+rn()*8,4);box(u,w,wu,wd,hp,0,[4,0][(rn()*2)|0]);box(u,w,wu-8,wd-8,h,hp,styleFor(h));crown(u,w,wu-8,wd-8,h+hp);continue;}
     if(h>=80&&rn()<0.16){const dia=Math.min(wu,wd)*0.9;cylB(u,w,dia,h,0,styleFor(h));crown(u,w,dia,dia,h);continue;}
     const st=styleFor(h);box(u,w,wu,wd,h,0,st);
     if(h>=96&&rn()<0.5){const w3=snap(wu*0.62,2),d3=snap(wd*0.62,2),h3=snap(h*0.18,4);box(u,w,w3,d3,h3,h,st);crown(u,w,w3,d3,h+h3);}else crown(u,w,wu,wd,h);
   }}
 G.forEach((arr,i)=>merge(arr,MATS[i],'xxBuildings'+i));neonG.forEach((arr,i)=>merge(arr,M(NEON[i],{em:NEON[i]}),'xxNeon'));
 merge(spireG,M('#2b3040'),'xxSpires');merge(beaconG,M('#ff2a2a',{em:'#ff2a2a'}),'xxBeacons');}

// ═════════ ⑨ 全壘打規則 ═════════
ctx.setRules({fenceR:118.9,fenceH:WALL_H,arcDeg:45,simLimit:175,fenceAt});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).ocean={id:'ocean',name:'海洋球場',build:build};
})();
