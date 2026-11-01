/*
 * 羅馬競技場球場（id: colosseum）— 外觀以羅馬競技場(Colosseum)為主體，裡面是棒球場，外面是羅馬城市，馬路是石頭路，並有啦啦隊舞台。
 * 介面規格請參考 stadium-night.js 開頭的「球場外掛開發指南」。
 *
 *  球場本體
 *   · 外野牆半徑 104 m（圓弧），牆面是travertine(石灰華)＋盾牌浮雕帶；內野草地與外野同一張貼圖，土區是競技場沙地色。
 *   · 看台是一圈封閉、等深(12 階)的碗：本壘後方 → 內野側邊(界外牆外側) → 轉角扇形 → 外野弧形看台；觀眾穿托加(白／米／赭／紫紅)。
 *  競技場外觀
 *   · 看台外圍是一圈橢圓形的競技場外牆（長軸 240 m、短軸 188 m、高 40 m）：底層多立克、二層愛奧尼、三層科林斯拱廊，頂層是閣樓層，
 *     拱洞裡有火把暖光；牆頂有投光燈。外牆內側也是拱廊，電子（羅馬數字）記分板掛在中外野正後方的內牆上。
 *  啦啦隊舞台
 *   · 一壘／三壘兩側各一座懸挑的大理石大平台（18×7.3 m，各 15 個站位，球員尺寸）。站位座標在 BaseballStadiums.colosseum.cheerSlots。
 *  球場外（羅馬城市）
 *   · 競技場獨佔一個大街廓，四周是「井」字形的石頭路（不規則玄武岩鋪路石＋石灰華人行道），路完整不被截斷；街廓外是羅馬街區：
 *     赤陶瓦屋頂的集合住宅(insulae)、神殿與廣場；競技場旁的廣場有凱旋門、方尖碑、圖拉真柱、噴泉、雕像與傘松；遠處有輸水道。
 *  本檔「不」設定天空／霧／光源。
 */
(function(){
'use strict';
function build(ctx){
const {BABYLON,scene,MB,M,put,texMat,lpt,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const SQ=Math.SQRT1_2,TAU=Math.PI*2,D2R=Math.PI/180,V4=(a,b,c,d)=>new BABYLON.Vector4(a,b,c,d);

// ═════════ ① 共用工具 ═════════
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const tile=(S,x,y,m,fn)=>{if(x>m&&x<S-m&&y>m&&y<S-m)return fn(0,0);for(const dx of[-S,0,S])for(const dy of[-S,0,S])fn(dx,dy);};
const newTex=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const hex2rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const dim=(h,k)=>'#'+hex2rgb(h).map(v=>Math.round(v*k).toString(16).padStart(2,'0')).join('');
const candy=(h,k)=>M(h,{em:dim(h,k==null?0.55:k)});          // 本色＋一點自發光，任何天氣下顏色都紮實
const tm=(t,k)=>{const m=texMat(t,k==null?1:k);m.backFaceCulling=false;return m;};
const merge=(arr,mat,name)=>{if(!arr.length)return null;const m=BABYLON.Mesh.MergeMeshes(arr,true,true);if(m){m.name=name;if(mat)m.material=mat;m.isPickable=false;}return m;};
const speck=(g,S,r,n,a1,a2)=>{for(let q=0;q<n;q++){g.fillStyle=q%2?a1:a2;const s=1+r()*2;g.fillRect(r()*S,r()*S,s,s);}};
const roman=n=>{let s='';for(const [v,c] of [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=v){s+=c;n-=v;}return s||'0';};
// 平面（plane）的正面是 -z。這個函式回傳讓「正面朝向單位向量 n」的 rotation.y。
// （★ 不用長方盒的面貼有方向性的圖：盒子某些面的貼圖會整張轉 180°，平面不會。）
const faceYaw=(nx,nz)=>Math.atan2(-nx,-nz);

// ═════════ ② 場地貼圖：草皮、競技場沙地 ═════════
function grassTexture(name,seed,base,dark){   // 45° 割草斜紋（無縫），1024px 鋪 32 m
  const S=1024,t=newTex(name,S,S),g=t.getContext(),rnd=rng(seed),img=g.createImageData(S,S),d=img.data;
  for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.12;d[i]=base[0]*k;d[i+1]=base[1]*k;d[i+2]=base[2]*k;d[i+3]=255;}g.putImageData(img,0,0);
  const w=S/8;g.fillStyle=dark;for(let k=0;k<16;k+=2){g.beginPath();g.moveTo(k*w,0);g.lineTo((k+1)*w,0);g.lineTo((k+1)*w-S,S);g.lineTo(k*w-S,S);g.closePath();g.fill();}
  for(let n=0;n<240;n++){const x=rnd()*S,y=rnd()*S,r=25+rnd()*90;tile(S,x,y,r,(dx,dy)=>{g.fillStyle=n%2?'rgba(255,255,200,0.04)':'rgba(0,40,0,0.06)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  const bl=['rgba(30,90,30,0.4)','rgba(110,170,60,0.35)','rgba(20,70,20,0.35)','rgba(150,200,90,0.3)'];
  for(let n=0;n<22000;n++){const x=rnd()*S,y=rnd()*S,l=5+rnd()*9,a=-1.57+(rnd()-0.5)*1.3;tile(S,x,y,14,(dx,dy)=>{g.strokeStyle=bl[(rnd()*4)|0];g.lineWidth=0.8+rnd();g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke();});}
  t.update();return t;
}
function sandTexture(){   // 競技場沙地（arena 一詞本來就是「沙」）：淡赭色
  const S=512,t=newTex('xxSand',S,S),g=t.getContext(),rnd=rng(23),img=g.createImageData(S,S),d=img.data;
  for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.13;d[i]=214*k;d[i+1]=184*k;d[i+2]=132*k;d[i+3]=255;}g.putImageData(img,0,0);
  for(let n=0;n<130;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*50;tile(S,x,y,r,(dx,dy)=>{g.fillStyle=n%2?'rgba(255,235,190,0.10)':'rgba(150,110,60,0.08)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  for(let n=0;n<700;n++){const x=rnd()*S,y=rnd()*S,r=0.8+rnd()*1.8;tile(S,x,y,6,(dx,dy)=>{g.fillStyle=n%2?'rgba(120,85,45,0.5)':'rgba(255,240,200,0.55)';g.beginPath();g.ellipse(x+dx,y+dy,r*1.3,r,rnd()*3,0,TAU);g.fill();});}
  for(let n=0;n<45;n++){const y=rnd()*S;g.strokeStyle='rgba(120,85,45,0.10)';g.lineWidth=1;g.beginPath();g.moveTo(0,y);g.lineTo(S,y);g.stroke();}   // 耙痕
  t.update();return t;
}
const grassT=grassTexture('xxGrass',11,[70,142,66],'rgba(0,45,0,0.10)'),infT=grassTexture('xxInfield',31,[64,134,60],'rgba(0,45,0,0.12)'),sandT=sandTexture();
ctx.makeGround(texMat(grassT,1));
ctx.setFieldMats({infield:texMat(infT,1),dirt:texMat(sandT,1),home:texMat(sandT,0.97),mound:texMat(sandT,1.04)});

// ═════════ ③ 外野牆、界外牆（石灰華＋盾牌浮雕帶）═════════
const R=104,WALL_H=3.4,FOUL_OFF=20,T=12,STEP=1.1,ROW=0.8,GAP=1.6;
const S_W=Math.sqrt(R*R-FOUL_OFF*FOUL_OFF),A_W=Math.atan2(S_W+FOUL_OFF,S_W-FOUL_OFF)/D2R;     // 界外牆與外野牆交會處（約 56°）
const R_O=R+GAP,F_S=FOUL_OFF+GAP,S_C=Math.sqrt(R_O*R_O-F_S*F_S);                              // 轉角點 J：側邊看台前緣 ∩ 外野看台前緣
const JP=s=>lpt(s,S_C,F_S),A_C=Math.atan2(JP(1).x,JP(1).z);                                      // A_C：轉角的方位角(弧度)
function friezeTex(){
  const W=512,H=256,t=newTex('xxFrieze',W,H),g=t.getContext(),r=rng(31);
  g.fillStyle='#d6c49c';g.fillRect(0,0,W,H);speck(g,W,r,4000,'rgba(255,255,255,0.08)','rgba(80,60,30,0.12)');
  g.fillStyle='#bba982';g.fillRect(0,0,W,34);g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(0,0,W,6);g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(0,34,W,5);       // 頂部線腳
  g.fillStyle='#b19f78';g.fillRect(0,H-36,W,36);g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(0,H-36,W,4);                                                 // 底部台座
  g.strokeStyle='rgba(90,70,40,0.35)';g.lineWidth=2;for(let i=0;i<4;i++)for(const dx of[-62,62]){const x=64+i*128+dx;g.beginPath();g.moveTo(x,50);g.lineTo(x,H-50);g.stroke();}   // 凹槽
  for(let i=0;i<4;i++){const cx=64+i*128,cy=(34+H-36)/2;g.fillStyle='#8f2b22';g.beginPath();g.arc(cx,cy,42,0,TAU);g.fill();g.strokeStyle='#e0b94e';g.lineWidth=5;g.stroke();g.fillStyle='#e0b94e';g.beginPath();g.arc(cx,cy,10,0,TAU);g.fill();}   // 盾牌
  t.update();return t;
}
const stoneMat=candy('#cdbb94',0.55),friezeMat=tm(friezeTex(),1),capMat=candy('#e6d7b0',0.6);
function inward(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz);let nx=-dz/l,nz=dx/l;const mx=(ax+bx)/2,mz=(az+bz)/2;if(nx*(0-mx)+nz*(40-mz)<0){nx=-nx;nz=-nz;}return [nx,nz];}   // 朝向場內(0,40)的法線
let wsN=0;
function wallSeg(ax,az,bx,bz,h,th,fence,outfield,ext){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2,n=inward(ax,az,bx,bz);
  const b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th}),cx,h/2,cz,stoneMat);b.rotation.y=ang;if(fence)registerFenceCollider(b,!!outfield);
  put(MB.CreateBox('xxCap',{width:len+0.1,height:0.3,depth:th+0.3}),cx,h+0.15+(wsN++%2)*0.04,cz,capMat).rotation.y=ang;   // 相鄰石帽高度錯開 4 cm，接縫重疊處就不會共面
  const p=put(MB.CreatePlane('xxWallFace',{width:len,height:h-0.05,frontUVs:V4(0,0,len/8,1)},scene),cx+n[0]*(th/2+0.1),(h-0.05)/2,cz+n[1]*(th/2+0.1),friezeMat);p.rotation.y=faceYaw(n[0],n[1]);   // 場內側的浮雕帶（平面）
}
const NSEG=28,OF=[];for(let i=0;i<=NSEG;i++){const a=(-A_W+2*A_W*i/NSEG)*D2R;OF.push([R*Math.sin(a),R*Math.cos(a)]);}
for(let i=0;i<NSEG;i++)wallSeg(OF[i][0],OF[i][1],OF[i+1][0],OF[i+1][1],WALL_H,0.6,true,true,0.7);
function fenceAt(deg){   // 與實體牆一致：從本壘板沿該角度射線打到折線牆
  const a=Math.max(-45,Math.min(45,deg))*D2R,dx=Math.sin(a),dz=Math.cos(a);
  for(let i=0;i<NSEG;i++){const A=OF[i],B=OF[i+1],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;const t=(A[0]*ez-A[1]*ex)/den,u=(A[0]*dz-A[1]*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)return t;}
  return R;
}
const HOME_Z=-20,sides=[-1,1];
wallSeg(-12,HOME_Z,12,HOME_Z,3.4,0.6,true,false,0.6);
sides.forEach(s=>{const a=lpt(s,0,FOUL_OFF),b=lpt(s,S_W,FOUL_OFF);wallSeg(s*12,HOME_Z,a.x,a.z,3.0,0.6,true,false,0.6);wallSeg(a.x,a.z,b.x,b.z,2.8,0.6,true,false,0.6);});
// 界外線桿（只是外觀，鍍金）
{const pm=candy('#e0b94e',0.8);sides.forEach(s=>{const p=lpt(s,R,0);put(MB.CreateCylinder('xxPole',{diameter:0.4,height:18.2,tessellation:10},scene),p.x,9,p.z,pm);});}

// ═════════ ④ 觀眾席：一圈封閉、等深的碗（托加觀眾）═════════
const CROWD_N=14,CROWD_TW=CROWD_N*0.5333;
function crowdTextures(){
  const W=CROWD_N*64,rnd=rng(5),shirts=['#f4ecd8','#ffffff','#c9a14a','#9b2d24','#5a2a6b','#e8d8b0','#b5683a','#f1e2bd','#ffffff','#7a3b2a'],
    skins=['#f6d4b4','#f1c7a0','#e0ad82','#c98f63'],hairs=['#2c231d','#4a3626','#10100f','#6a4a2a','#8a6a3a'];
  const front=newTex('xxCrowdF',W,96),gf=front.getContext(),top=newTex('xxCrowdT',W,132),gt=top.getContext();
  gf.fillStyle='#3a2616';gf.fillRect(0,0,W,96);gt.fillStyle='#4a301c';gt.fillRect(0,0,W,132);
  for(let i=0;i<CROWD_N;i++){const cx=i*64+32+(rnd()-0.5)*8,sh=shirts[(rnd()*shirts.length)|0],sk=skins[(rnd()*skins.length)|0],hr=hairs[(rnd()*hairs.length)|0];
    gf.fillStyle=sh;gf.beginPath();gf.ellipse(cx,84,26,34,0,0,TAU);gf.fill();
    gf.fillStyle=sh==='#ffffff'||sh==='#f4ecd8'?'#9b2d24':'#e8d8b0';gf.fillRect(cx-5,56,10,40);   // 托加的紫紅／淺色條紋
    gf.fillStyle=sk;gf.beginPath();gf.arc(cx,34,13,0,TAU);gf.fill();
    gf.fillStyle=hr;gf.beginPath();gf.arc(cx,29,13.5,Math.PI,TAU);gf.fill();
    if(rnd()<0.18){gf.strokeStyle='#4f8a3a';gf.lineWidth=3;gf.beginPath();gf.arc(cx,26,14,Math.PI*1.05,Math.PI*1.95);gf.stroke();}   // 月桂冠
    gt.fillStyle=sh;gt.beginPath();gt.ellipse(cx,66,26,15,0,0,TAU);gt.fill();gt.fillStyle=hr;gt.beginPath();gt.arc(cx,66,12,0,TAU);gt.fill();}
  front.update();top.update();return {front,top};
}
const crowd=crowdTextures();
const cf=M('#000000');cf.emissiveTexture=crowd.front;cf.disableLighting=true;cf.backFaceCulling=false;
const ct=M('#000000');ct.emissiveTexture=crowd.top;ct.disableLighting=true;ct.backFaceCulling=false;
const crowdMat=new BABYLON.MultiMaterial('xxCrowd',scene);crowdMat.subMaterials=[cf,ct];
const concrete=candy('#c4b28a',0.5),glowStrip=M('#f6dca0',{em:'#f6dca0'});
function crowdMesh(name,pos,uv,idxR,idxT){
  const m=new BABYLON.Mesh(name,scene),vd=new BABYLON.VertexData(),nor=[];
  vd.positions=pos;vd.indices=idxR.concat(idxT);vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,vd.indices,nor);vd.normals=nor;vd.applyToMesh(m);
  m.material=crowdMat;m.isPickable=false;m.subMeshes=[];const nv=pos.length/3;
  new BABYLON.SubMesh(0,0,nv,0,idxR.length,m);new BABYLON.SubMesh(1,0,nv,idxR.length,idxT.length,m);return m;
}
function ghostBox(cx,cy,cz,w,h,d,ang,kind){const b=put(MB.CreateBox('xxHit',{width:w,height:h,depth:d}),cx,cy,cz,null);b.rotation.y=ang;b.isVisible=false;registerBallSolid(b,kind);return b;}
// 直線看台：a→b 為牆的位置，out 為朝外單位向量，第 k 階前緣離牆 gap+k·STEP；兩端各延伸 ext；caps＝[起點端,終點端] 是否用實心端牆封口
function stand(ax,az,bx,bz,out,tiers,gap,top0,ext,caps){
  const dx=bx-ax,dz=bz-az,L0=Math.hypot(dx,dz),ux=dx/L0,uz=dz/L0,nx=out[0],nz=out[1];
  const s0=-(ext||0),s1=L0+(ext||0),L=s1-s0,u1=L/CROWD_TW,pos=[],uv=[],idxR=[],idxT=[],vBase=top0-ROW;
  const P=(s,off,y)=>pos.push(ax+ux*s+nx*off,y,az+uz*s+nz*off),quad=arr=>{const n=pos.length/3-4;arr.push(n,n+1,n+2,n,n+2,n+3);};
  for(let k=0;k<tiers;k++){const off=gap+k*STEP,top=top0+k*ROW,bot=k?top-ROW:0;
    P(s0,off,bot);P(s1,off,bot);P(s1,off,top);P(s0,off,top);uv.push(0,(bot-vBase)/ROW,u1,(bot-vBase)/ROW,u1,(top-vBase)/ROW,0,(top-vBase)/ROW);quad(idxR);
    P(s0,off,top);P(s1,off,top);P(s1,off+STEP,top);P(s0,off+STEP,top);uv.push(0,0,u1,0,u1,1,0,1);quad(idxT);}
  crowdMesh('xxStand',pos,uv,idxR,idxT);
  const ang=Math.atan2(-dz,dx),mx=(ax+bx)/2,mz=(az+bz)/2,half=Math.ceil(tiers/2);
  [[0,half],[half,tiers]].forEach(([a,b])=>{if(b<=a)return;const o0=gap+a*STEP,o1=gap+b*STEP,topH=top0+(b-1)*ROW,oc=(o0+o1)/2;ghostBox(mx+nx*oc,topH/2,mz+nz*oc,L,topH,o1-o0+0.1,ang,'spectator');});
  const backOff=gap+tiers*STEP+0.3,bh=top0+tiers*ROW+1.6,bw=put(MB.CreateBox('xxStandBack',{width:L,height:bh,depth:0.6}),mx+nx*backOff,bh/2,mz+nz*backOff,concrete);
  bw.rotation.y=ang;registerBallSolid(bw,'spectator');
  put(MB.CreateBox('xxStandGlow',{width:L,height:0.22,depth:0.3}),mx+nx*(backOff-0.3),bh,mz+nz*(backOff-0.3),glowStrip).rotation.y=ang;
  if(caps){const d0=gap-0.1,d1=backOff+0.3,eh=top0+(tiers-1)*ROW+0.5;
    [[caps[0],s0],[caps[1],s1]].forEach(([on,s])=>{if(!on)return;const oc=(d0+d1)/2,e=put(MB.CreateBox('xxStandEnd',{width:0.4,height:eh,depth:d1-d0}),ax+ux*s+nx*oc,eh/2,az+uz*s+nz*oc,concrete);e.rotation.y=ang;registerBallSolid(e,'spectator');});}
}
// 扇形／弧形看台：以 F 為圓心，朝外方向從 thA 掃到 thB（方向角＝atan2(x,z)）；第 k 階前緣半徑 gap+k·STEP；階高從 topA 線性漸變到 topB
// opt：NS＝切片數、NSC＝碰撞扇區數、NB＝後牆段數
function fan(F,thA,thB,tiers,gap,topA,topB,opt){
  opt=opt||{};const NS=opt.NS||12,NSC=opt.NSC||2,NB=opt.NB||6,pos=[],uv=[],idxR=[],idxT=[],Pt=(a,r,y)=>pos.push(F[0]+r*Math.sin(a),y,F[1]+r*Math.cos(a)),hT=(k,j)=>topA+(topB-topA)*j/NS+ROW*k,vB=topA-ROW;
  for(let k=0;k<tiers;k++){const ra=gap+k*STEP,rb=ra+STEP,rt=(ra+rb)/2;
    for(let j=0;j<NS;j++){
      const a0=thA+(thB-thA)*j/NS,a1=thA+(thB-thA)*(j+1)/NS,u0=Math.abs(a0-thA),u1=Math.abs(a1-thA),t0=hT(k,j),t1=hT(k,j+1),b0=k?t0-ROW:0,b1=k?t1-ROW:0;let n=pos.length/3;
      Pt(a0,ra,b0);Pt(a1,ra,b1);Pt(a1,ra,t1);Pt(a0,ra,t0);uv.push(u0*ra/CROWD_TW,(b0-vB)/ROW,u1*ra/CROWD_TW,(b1-vB)/ROW,u1*ra/CROWD_TW,(t1-vB)/ROW,u0*ra/CROWD_TW,(t0-vB)/ROW);idxR.push(n,n+1,n+2,n,n+2,n+3);
      n=pos.length/3;Pt(a0,ra,t0);Pt(a1,ra,t1);Pt(a1,rb,t1);Pt(a0,rb,t0);uv.push(u0*rt/CROWD_TW,0,u1*rt/CROWD_TW,0,u1*rt/CROWD_TW,1,u0*rt/CROWD_TW,1);idxT.push(n,n+1,n+2,n,n+2,n+3);}}
  crowdMesh('xxFan',pos,uv,idxR,idxT);
  const half=Math.ceil(tiers/2);
  [[0,half],[half,tiers]].forEach(([a,b])=>{if(b<=a)return;const r0=gap+a*STEP,r1=gap+b*STEP,rm=(r0+r1)/2;
    for(let m=0;m<NSC;m++){const aa=thA+(thB-thA)*m/NSC,ab=thA+(thB-thA)*(m+1)/NSC,am=(aa+ab)/2,top=hT(b-1,(m+1)*NS/NSC)+0.1,w=2*r1*Math.sin(Math.abs(ab-aa)/2)+0.4;
      ghostBox(F[0]+rm*Math.sin(am),top/2,F[1]+rm*Math.cos(am),w,top,r1-r0+0.2,am,'spectator');}});
  const Rb=gap+tiers*STEP+0.3;
  for(let j=0;j<NB;j++){const am=thA+(thB-thA)*(j+0.5)/NB,bh=topA+(topB-topA)*(j+0.5)/NB+tiers*ROW+1.6,w=2*Rb*Math.sin(Math.abs(thB-thA)/NB/2)+0.5,x=F[0]+Rb*Math.sin(am),z=F[1]+Rb*Math.cos(am);
    const wl=put(MB.CreateBox('xxFanBack',{width:w,height:bh,depth:0.7}),x,bh/2,z,concrete);wl.rotation.y=am;registerBallSolid(wl,'spectator');
    put(MB.CreateBox('xxFanGlow',{width:w,height:0.22,depth:0.3}),x-Math.sin(am)*0.2,bh,z-Math.cos(am)*0.2,glowStrip).rotation.y=am;}
}
const SIDE_TOP=3.6,OTOP=4.4;
stand(-12,HOME_Z,12,HOME_Z,[0,-1],6,1.4,4.0,2,[true,true]);                                 // 本壘後方
sides.forEach(s=>{
  const sa=lpt(s,8,FOUL_OFF),sb=lpt(s,S_C,FOUL_OFF),J=JP(s);
  stand(sa.x,sa.z,sb.x,sb.z,[s*SQ,-SQ],T,GAP,SIDE_TOP,0,[true,false]);                     // 內野側邊看台（界外牆外側）
  fan([J.x,J.z],Math.atan2(s*SQ,-SQ),s*A_C,T,0,SIDE_TOP,OTOP);                              // 轉角扇形看台
});
fan([0,0],-A_C,A_C,T,R_O,OTOP,OTOP,{NS:40,NSC:12,NB:20});                                    // 外野弧形看台

// ═════════ ⑤ 球員休息區（石灰華棚子，赤陶屋頂）═════════
const DUG_R=19,DUG_FRONT=12.4,benchMat=candy('#8a5a30',0.4),roofMat=candy('#a8502e',0.6),slab=candy('#b8a67e',0.4);
sides.forEach(s=>{
  const ang=Math.atan2(-SQ,s*SQ),c=lpt(s,DUG_R,(DUG_FRONT+FOUL_OFF)/2),dep=FOUL_OFF-DUG_FRONT;
  put(MB.CreateBox('xxDugFloor',{width:14,height:0.06,depth:dep}),c.x,0.04,c.z,slab).rotation.y=ang;
  const roof=put(MB.CreateBox('xxDugRoof',{width:14.6,height:0.18,depth:dep+0.8}),c.x,2.7,c.z,roofMat);roof.rotation.y=ang;registerBallSolid(roof);
  const bn=lpt(s,DUG_R,FOUL_OFF-1.2);put(MB.CreateBox('xxDugBench',{width:11,height:0.5,depth:0.7}),bn.x,0.4,bn.z,benchMat).rotation.y=ang;
  const f0=lpt(s,DUG_R-7,DUG_FRONT),f1=lpt(s,DUG_R-1.3,DUG_FRONT),f2=lpt(s,DUG_R+1.3,DUG_FRONT),f3=lpt(s,DUG_R+7,DUG_FRONT);
  wallSeg(f0.x,f0.z,f1.x,f1.z,1.1,0.4,true,false,0);wallSeg(f2.x,f2.z,f3.x,f3.z,1.1,0.4,true,false,0);
});
ctx.setDugouts({
  E:s=>lpt(s,DUG_R,DUG_FRONT-1.4),
  T:s=>lpt(s,DUG_R,FOUL_OFF-3.2),
  gate:(s,j,inside)=>lpt(s,DUG_R+j,inside?DUG_FRONT+2.4:DUG_FRONT-1.4),
  seat:(s,i)=>{const p=lpt(s,DUG_R-5+(i%9)*1.25,i%3===0?FOUL_OFF-1.2:(i%3===1?FOUL_OFF-3.0:FOUL_OFF-4.2));
    return {x:p.x,y:i%3===0?0.55:0,z:p.z,ry:s===-1?Math.PI/4:-Math.PI/4,scale:i%3===0?[0.82,0.72,0.82]:null};}
});

// ═════════ ⑥ 競技場外牆：橢圓形、三層拱廊＋閣樓層（高 40 m，80 個開間）═════════
const EC=[0,48],EA=120,EB=94,NBAY=80,HR=40;
const ell=t=>[EA*Math.cos(t),EC[1]+EB*Math.sin(t)];
const RP=[];let PER=0;
{const M_=6000,cum=[0];let prev=ell(0);for(let i=1;i<=M_;i++){const p=ell(i/M_*TAU);cum.push(cum[i-1]+Math.hypot(p[0]-prev[0],p[1]-prev[1]));prev=p;}PER=cum[M_];
 for(let i=0;i<NBAY;i++){const target=PER*i/NBAY;let lo=0,hi=M_;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<target)lo=m;else hi=m;}RP.push(ell(lo/M_*TAU));}}   // 依弧長等分的 80 個頂點
const BAY_W=PER/NBAY;
function facadeTex(){   // 一個開間（寬 BAY_W m × 高 40 m）的立面：三層拱＋閣樓層
  const W=256,H=1024,t=newTex('xxFacade',W,H),g=t.getContext(),r=rng(41),kx=W/BAY_W,ky=H/HR,Y=y=>H-y*ky;
  g.fillStyle='#d3c19a';g.fillRect(0,0,W,H);speck(g,W,r,9000,'rgba(255,255,255,0.07)','rgba(70,50,20,0.10)');
  for(let n=0;n<26;n++){g.fillStyle=n%2?'rgba(120,95,55,0.07)':'rgba(255,245,220,0.07)';g.beginPath();g.ellipse(r()*W,r()*H,20+r()*60,30+r()*100,0,0,TAU);g.fill();}   // 風化色斑
  const TH=10.5,cx=W/2,aw=5.0*kx,rr=aw/2;
  for(let k=0;k<3;k++){const y0=k*TH,yb=Y(y0+0.9),ys=Y(y0+5.6);
    const path=()=>{g.beginPath();g.moveTo(cx-rr,yb);g.lineTo(cx-rr,ys);g.arc(cx,ys,rr,Math.PI,0);g.lineTo(cx+rr,yb);g.closePath();};
    g.save();path();g.lineWidth=0.9*kx;g.strokeStyle='#e9dcb8';g.stroke();g.restore();                                                       // 拱圈
    path();const gr=g.createLinearGradient(0,ys-rr,0,yb);gr.addColorStop(0,'#120a05');gr.addColorStop(0.6,'#24150a');gr.addColorStop(1,'#5a3414');g.fillStyle=gr;g.fill();
    const gl=g.createRadialGradient(cx,yb-1.2*ky,2,cx,yb-1.2*ky,rr*1.4);gl.addColorStop(0,'rgba(255,170,70,0.6)');gl.addColorStop(1,'rgba(255,170,70,0)');g.save();path();g.clip();g.fillStyle=gl;g.fillRect(0,0,W,H);g.restore();   // 火把暖光
    if(k>0){g.fillStyle='rgba(225,215,190,0.75)';g.beginPath();g.ellipse(cx,yb-1.4*ky,0.45*kx,1.2*ky,0,0,TAU);g.fill();g.beginPath();g.arc(cx,yb-2.9*ky,0.32*kx,0,TAU);g.fill();}   // 拱內雕像
    for(const x0 of [0,W-0.9*kx]){const gx=g.createLinearGradient(x0,0,x0+0.9*kx,0);gx.addColorStop(0,'#bda982');gx.addColorStop(0.5,'#efe2c0');gx.addColorStop(1,'#a8946c');g.fillStyle=gx;g.fillRect(x0,Y(y0+9.6),0.9*kx,8.7*ky);   // 半圓柱
      g.fillStyle=k===2?'#d6c58f':'#e3d4ac';g.fillRect(x0-0.1*kx,Y(y0+9.7),1.1*kx,0.55*ky);                                                       // 柱頭（多立克／愛奧尼／科林斯：越上層越華麗）
      if(k>=1){g.fillStyle='#cdbb94';g.beginPath();g.arc(x0+0.05*kx,Y(y0+9.4),0.22*kx,0,TAU);g.arc(x0+0.85*kx,Y(y0+9.4),0.22*kx,0,TAU);g.fill();}}
    g.fillStyle='#bfae86';g.fillRect(0,Y(y0+TH),W,0.9*ky);g.fillStyle='rgba(0,0,0,0.28)';g.fillRect(0,Y(y0+TH)+0.9*ky,W,0.25*ky);g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(0,Y(y0+TH),W,0.18*ky);   // 上楣
  }
  // 閣樓層（31.5 ~ 40 m）：方窗＋壁柱＋頂部大檐口
  g.fillStyle='#c9b88f';g.fillRect(0,Y(40),W,8.5*ky);
  for(const x0 of [0,W-0.8*kx]){g.fillStyle='#e2d3ac';g.fillRect(x0,Y(38.6),0.8*kx,6.6*ky);}
  g.fillStyle='#1a110b';g.fillRect(cx-0.6*kx,Y(36.4),1.2*kx,1.9*ky);g.fillStyle='rgba(255,170,70,0.35)';g.fillRect(cx-0.6*kx,Y(35.2),1.2*kx,0.7*ky);
  g.fillStyle='#b19f78';g.fillRect(0,Y(40),W,1.4*ky);g.fillStyle='rgba(255,255,255,0.4)';g.fillRect(0,Y(40),W,0.25*ky);g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(0,Y(40)+1.4*ky,W,0.35*ky);
  g.fillStyle='#a8946c';g.fillRect(0,Y(0.9),W,0.9*ky);                                                                                            // 底部台座
  t.update();return t;
}
{
  // ★ 防閃爍（深度衝突）原則：任何兩個面之間，要嘛完全不重疊，要嘛至少相距 10 cm 以上。
  //   所以外牆不用「一個開間一個長方盒」（相鄰盒子在接縫處會互相重疊、而且與立面片只差 1 cm），
  //   而是把內芯、三道檐口、頂部大檐口、台座都做成沿橢圓連續的帶狀幾何（接縫斜接，沒有重疊也沒有縫），
  //   立面貼圖片則離內芯 0.4 m，檐口穿過立面片（交線，不是平行重疊）。
  const facade=tm(facadeTex(),1),outerP=[],innerP=[],floods=[],travMat=candy('#c9b88f',0.5),travDark=candy('#b6a37a',0.5);
  travMat.backFaceCulling=false;travDark.backFaceCulling=false;
  const en=[],vn=[],vs=[],elen=[];
  for(let i=0;i<NBAY;i++){const a=RP[i],b=RP[(i+1)%NBAY],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);let nx=dz/l,nz=-dx/l;const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if(nx*(mx-EC[0])+nz*(mz-EC[1])<0){nx=-nx;nz=-nz;}en.push([nx,nz]);elen.push(l);}
  for(let i=0;i<NBAY;i++){const p=en[(i+NBAY-1)%NBAY],c=en[i];let sx=p[0]+c[0],sz=p[1]+c[1];const l=Math.hypot(sx,sz);sx/=l;sz/=l;vn.push([sx,sz]);vs.push(1/(sx*c[0]+sz*c[1]));}   // 頂點的外向斜接法線與斜接長度
  function ringBand(y0,y1,o0,o1,mat,name){   // 沿橢圓的帶：橫截面是 [o0,o1]（離牆中心線的側向距離，正＝朝外）× [y0,y1] 的矩形
    const pos=[],nor=[],uv=[],idx=[],P=(i,o,y)=>[RP[i][0]+vn[i][0]*vs[i]*o,y,RP[i][1]+vn[i][1]*vs[i]*o];
    const quad=(a,b,c,d,n)=>{const k=pos.length/3;[a,b,c,d].forEach(q=>{pos.push(q[0],q[1],q[2]);nor.push(n[0],n[1],n[2]);uv.push(0,0);});idx.push(k,k+1,k+2,k,k+2,k+3);};
    for(let i=0;i<NBAY;i++){const j=(i+1)%NBAY,n=en[i];
      quad(P(i,o1,y0),P(j,o1,y0),P(j,o1,y1),P(i,o1,y1),[n[0],0,n[1]]);quad(P(i,o0,y0),P(i,o0,y1),P(j,o0,y1),P(j,o0,y0),[-n[0],0,-n[1]]);
      quad(P(i,o0,y1),P(i,o1,y1),P(j,o1,y1),P(j,o0,y1),[0,1,0]);quad(P(i,o0,y0),P(j,o0,y0),P(j,o1,y0),P(i,o1,y0),[0,-1,0]);}
    const m=new BABYLON.Mesh(name,scene),vd=new BABYLON.VertexData();vd.positions=pos;vd.normals=nor;vd.uvs=uv;vd.indices=idx;vd.applyToMesh(m);m.material=mat;m.isPickable=false;return m;
  }
  for(let i=0;i<NBAY;i++){
    const a=RP[i],b=RP[(i+1)%NBAY],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,nx=en[i][0],nz=en[i][1],yo=faceYaw(nx,nz),len=elen[i]+0.06;
    const po=MB.CreatePlane('xxFacadeO',{width:len,height:HR},scene);po.position.set(mx+nx*0.5,HR/2,mz+nz*0.5);po.rotation.y=yo;outerP.push(po);            // 外立面（正面朝外）
    const pi=MB.CreatePlane('xxFacadeI',{width:len,height:HR},scene);pi.position.set(mx-nx*0.5,HR/2,mz-nz*0.5);pi.rotation.y=yo+Math.PI;innerP.push(pi);       // 內立面（正面朝內）
    if(i%5===0){const lp=MB.CreateBox('xxRingFlood',{width:2.4,height:1.1,depth:0.3},scene);lp.position.set(mx-nx*1.7,HR+1.2,mz-nz*1.7);lp.rotation.y=yo+Math.PI;floods.push(lp);}
  }
  ringBand(0,HR,-0.1,0.1,travMat,'xxRingCoreBand');                                    // 內芯（比立面片薄、藏在兩片立面之間）
  [10.5,21,31.5].forEach(y=>ringBand(y-0.15,y+0.35,0.2,1.5,travDark,'xxRingLedge'));  // 三道檐口（穿過外立面片）
  ringBand(HR-0.2,HR+0.8,-1.2,1.2,travDark,'xxRingTopBand');                          // 頂部大檐口（蓋住兩片立面片的上緣）
  ringBand(0,1.2,0.2,1.0,travDark,'xxRingPlinthBand');                                 // 台座
  merge(outerP,facade,'xxRingFacadeOuter');merge(innerP,facade,'xxRingFacadeInner');merge(floods,M('#fff2c8',{em:'#fff2c8'}),'xxRingFloods');
  // 碰撞：24 段弦（每段約 3.3 個開間）
  const NC=24;for(let k=0;k<NC;k++){const a=RP[Math.round(k*NBAY/NC)%NBAY],b=RP[Math.round((k+1)*NBAY/NC)%NBAY],dx=b[0]-a[0],dz=b[1]-a[1];
    const bx=put(MB.CreateBox('xxRingHit',{width:Math.hypot(dx,dz)+0.4,height:HR,depth:2.4}),(a[0]+b[0])/2,HR/2,(a[1]+b[1])/2,null);bx.rotation.y=Math.atan2(-dz,dx);bx.isVisible=false;registerBallSolid(bx);}
}
// 看台外緣多邊形（用來挖空看台與外牆之間的廣場鋪面）：本壘後方 → 側邊看台 → 轉角 → 外野弧 → 左側
const fo=(s,r,o)=>{const p=lpt(s,r,o);return [p.x,p.z];};
const standPoly=[[0,-31]],half=[[16,-31],fo(1,8,37),fo(1,S_C,37)];
{const J=JP(1);for(let i=0;i<=6;i++){const a=Math.atan2(SQ,-SQ)+(A_C-Math.atan2(SQ,-SQ))*i/6;half.push([J.x+15.5*Math.sin(a),J.z+15.5*Math.cos(a)]);}}
standPoly.push(...half);for(let i=0;i<=28;i++){const a=A_C-2*A_C*i/28;standPoly.push([121.5*Math.sin(a),121.5*Math.cos(a)]);}
standPoly.push(...half.map(([x,z])=>[-x,z]).reverse());

// ═════════ ⑦ 記分板：掛在中外野正後方的外牆內側（36×12 m）；金框、象牙白分數格、羅馬數字局數 ═════════
{
  const BW=36,BH=12,BY=24,boardTex=sbTexInit();
  const fm=M('#000000');fm.emissiveTexture=boardTex;fm.disableLighting=true;fm.backFaceCulling=false;
  put(MB.CreatePlane('xxBoardFace',{width:BW,height:BH,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),0,BY,139.9,fm);                    // 平面正面 -z ＝ 朝向本壘
  put(MB.CreateBox('xxBoardFrame',{width:BW+1.4,height:BH+1.4,depth:1.6}),0,BY,141.4,candy('#d8b04a',0.7));   // 框的前面 140.6；記分板在框前 0.7 m（139.9），框的後面伸進外牆內
  function drawBoard(g,s,W,H){
    const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',SERIF='"Times New Roman","Noto Serif TC",serif';
    const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#4a1a12');bg.addColorStop(1,'#26100b');g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.strokeStyle='#e0b94e';g.lineWidth=14;rr(10,10,W-20,H-20,18);g.stroke();g.strokeStyle='rgba(240,214,130,0.7)';g.lineWidth=3;rr(28,28,W-56,H-56,12);g.stroke();
    const NX=46,NW=298,IX=NX+NW,IW=84,RX=IX+9*IW+16,RW=100,HY=40,HH=62,R1=HY+HH+8,RH=104,R2=R1+RH+6;
    const tile_=(x,y,w,h,fill)=>{g.fillStyle=fill;rr(x+5,y+5,w-10,h-10,8);g.fill();};
    const txt=(t,cx,cy,sz,col,font)=>{g.font='bold '+sz+'px '+(font||SERIF);g.textAlign='center';g.textBaseline='middle';g.fillStyle=col;g.fillText(t,cx,cy+2);};
    for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn,x=IX+i*IW,rm=roman(n);tile_(x,HY,IW,HH,cur?'#e8c25a':'#8f2b22');txt(rm,x+IW/2,HY+HH/2,rm.length>3?30:rm.length>2?36:42,cur?'#2a1408':'#f0d278');}
    [['R','#ff9a8a'],['H','#f0d278'],['E','#f0d278']].forEach(([t,c],i)=>{tile_(RX+i*RW,HY,RW,HH,'#5a1d16');txt(t,RX+i*RW+RW/2,HY+HH/2,44,c);});
    g.font='bold 24px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle='#e8c25a';g.fillText('球隊',NX+14,HY+HH/2+2);
    [['me',R1,'#ff7a68'],['cpu',R2,'#8fc4ff']].forEach(([key,y,col])=>{
      tile_(NX,y,NW,RH,'#5a1d16');g.fillStyle=col;g.fillRect(NX+12,y+14,10,RH-28);
      let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);g.font='bold '+(nm.length>4?44:54)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle='#f6e7b8';g.fillText(nm,NX+36,y+RH/2+2);
      for(let i=0;i<9;i++){const n=s.first+i,x=IX+i*IW;tile_(x,y,IW,RH,'#f2e6c8');if(!s.played(key,n))continue;const v=(s.lineScore[key]||[])[n-1];txt(v==null?'0':String(v),x+IW/2,y+RH/2,62,s.current(key,n)?'#b3261e':'#2a1408');}
      [[s.score[key],66,'#e8c25a','#2a1408'],[s.hits[key],60,'#f2e6c8','#2a1408'],[s.errors[key],60,'#f2e6c8','#2a1408']].forEach(([v,sz,fill,tc],i)=>{tile_(RX+i*RW,y,RW,RH,fill);txt(String(v),RX+i*RW+RW/2,y+RH/2,sz,tc);});
    });
    const by=R2+RH+66;g.textBaseline='middle';
    [['B',s.balls,3,'#8fd36a'],['S',s.strikes,2,'#f0d278'],['O',s.outs,2,'#ff7a68']].forEach(([lab,n,max,col],r)=>{
      const x0=NX+16+r*210;txt(lab,x0+14,by,46,col);
      for(let i=0;i<max;i++){const cx=x0+78+i*50,lit=i<n;g.beginPath();g.arc(cx,by,19,0,TAU);g.fillStyle=lit?col:'#3a1a12';g.fill();g.strokeStyle=lit?'#fff3d0':'rgba(224,185,78,0.6)';g.lineWidth=3;g.stroke();}});
    const dx0=NX+16+3*210+40;
    [[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22,on=s.bases[i];g.save();g.translate(cx,cy);g.rotate(Math.PI/4);g.fillStyle=on?'#e8c25a':'#3a1a12';g.fillRect(-12,-12,24,24);g.strokeStyle=on?'#fff3d0':'rgba(224,185,78,0.6)';g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
    g.textAlign='right';g.font='bold 34px '+FONT;g.fillStyle='#f6e7b8';g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+(s.batter==null?'':s.batter)),W-48,by);
    // 裝飾：月桂枝與館名
    g.textAlign='center';g.font='bold 34px '+SERIF;g.fillStyle='#e8c25a';g.fillText('COLOSSEUM  PARK',W/2,H-62);
    g.strokeStyle='#8fb05a';g.lineWidth=4;for(const sx of[-1,1])for(let k=0;k<7;k++){const x=W/2+sx*(250+k*22),y=H-62-k*2;g.beginPath();g.ellipse(x,y,12,5,sx*(0.5-k*0.04),0,TAU);g.stroke();}
  }
  ctx.setScoreboardRenderer(drawBoard);
}

// ═════════ ⑧ 啦啦隊舞台：一壘／三壘兩側、觀眾席前方的懸挑大理石大平台 ═════════
// 台面高 4.5 m（與第二階看台等高，兩端可直接走進看台），前緣挑出到離界外線 16.5 m（在界外牆上方，下方 4.2 m 淨空，不影響野手），
// 長 18 m × 深 7.3 m；台面畫了 15 個站位圈（前排 8、後排 7，間距 2 m），人物尺寸以球員為準（約 1.8 m，護欄高 1.1 m）。
// 站位座標在 window.BaseballStadiums.colosseum.cheerSlots：{side,row,x,y,z,ry}（y＝台面高度、ry＝面向場內，與休息區 seat() 同一個約定）。
const cheerSlots=[],cheerZones=[];
{
  const CH={r0:32,r1:50,oF:16.5,oB:23.8,top:4.5,th:0.3},L=CH.r1-CH.r0,WD=CH.oB-CH.oF,RC=(CH.r0+CH.r1)/2,OC=(CH.oF+CH.oB)/2;
  const ROWS=[[18.3,[-7,-5,-3,-1,1,3,5,7]],[22.0,[-6,-4,-2,0,2,4,6]]];
  const star5=(g,cx,cy,Rr,fill)=>{g.fillStyle=fill;g.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?Rr*0.42:Rr;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.fill();};
  const floorT=(()=>{const W=1024,H=Math.round(W*WD/L),t=newTex('xxCheerFloorTex',W,H),g=t.getContext(),r=rng(88);
    g.fillStyle='#e9dfc6';g.fillRect(0,0,W,H);speck(g,W,r,6000,'rgba(255,255,255,0.12)','rgba(120,100,70,0.10)');
    g.strokeStyle='rgba(150,130,100,0.22)';g.lineWidth=2;for(let i=0;i<14;i++){g.beginPath();g.moveTo(r()*W,0);g.bezierCurveTo(r()*W,H*0.3,r()*W,H*0.7,r()*W,H);g.stroke();}   // 大理石紋
    const u=H/12;g.fillStyle='#8f2b22';for(let i=0;i<Math.floor(W/u);i+=2){g.fillRect(i*u+4,4,u,u);g.fillRect(i*u+4,H-u-4,u,u);}                    // 上下邊的回紋帶
    g.fillStyle='#e0b94e';g.fillRect(0,u+8,W,6);g.fillRect(0,H-u-14,W,6);g.strokeStyle='#e0b94e';g.lineWidth=8;g.strokeRect(10,10,W-20,H-20);
    g.strokeStyle='#8f2b22';g.lineWidth=10;g.beginPath();g.arc(W/2,H/2,H*0.15,0,TAU);g.stroke();star5(g,W/2,H/2,H*0.11,'#e0b94e');                       // 中央花環與星
    ROWS.forEach(([o,drs])=>drs.forEach(dr=>{const x=(0.5+dr/L)*W,y=(o-CH.oF)/WD*H;g.fillStyle='rgba(143,43,34,0.18)';g.beginPath();g.arc(x,y,H*0.075,0,TAU);g.fill();g.strokeStyle='#8f2b22';g.lineWidth=5;g.stroke();g.fillStyle='#8f2b22';g.beginPath();g.arc(x,y,4,0,TAU);g.fill();}));
    t.update();return t;})();
  const bannerT=(()=>{const W=1536,H=128,t=newTex('xxCheerBannerTex',W,H),g=t.getContext();
    g.fillStyle='#6e1a14';g.fillRect(0,0,W,H);g.fillStyle='#e0b94e';g.fillRect(0,0,W,8);g.fillRect(0,H-8,W,8);
    [70,W/2,W-70].forEach(x=>star5(g,x,H/2,26,'#f0d278'));
    g.font='bold 60px "Times New Roman",serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f0d278';[0.27,0.73].forEach(f=>g.fillText('COLOSSEUM CHEERS',W*f,H/2+3));
    t.update();return t;})();
  const flagT=(()=>{const W=256,H=160,t=newTex('xxCheerFlagTex',W,H),g=t.getContext();g.fillStyle='#8f1d1a';g.fillRect(0,0,W,H);g.fillStyle='#e0b94e';g.fillRect(0,0,W,10);g.fillRect(0,H-10,W,10);
    g.font='bold 62px "Times New Roman",serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f0d278';g.fillText('SPQR',W/2,H/2);t.update();return t;})();
  const floorMat=tm(floorT,1),bannerMat=tm(bannerT,1),flagMat=tm(flagT,1),deckMat=candy('#d3c5a0',0.5),railMat=candy('#e0b94e',0.7),ledMat=M('#ffd27a',{em:'#ffd27a'}),lampMat=M('#ffffff',{em:'#ffffff'});
  sides.forEach(s=>{
    const ang=-s*Math.PI/4,P=(r,o)=>lpt(s,r,o),c=P(RC,OC);   // 台座的 +x 沿界外線、+z 朝場內
    const slab=put(MB.CreateBox('xxCheerSlab',{width:L,height:CH.th,depth:WD}),c.x,CH.top-CH.th/2,c.z,deckMat);slab.rotation.y=ang;registerBallSolid(slab,'spectator');
    const floor=put(MB.CreateGround('xxCheerFloor',{width:L,height:WD},scene),c.x,CH.top+0.05,c.z,floorMat);floor.rotation.y=ang;floor.isPickable=false;
    const sk=P(RC,20.85);put(MB.CreateBox('xxCheerSkirt',{width:L+0.6,height:4.2,depth:0.3}),sk.x,2.1,sk.z,concrete).rotation.y=ang;
    const f=P(RC,CH.oF-0.12);put(MB.CreateBox('xxCheerFascia',{width:L+0.2,height:1.3,depth:0.25}),f.x,CH.top-0.55,f.z,deckMat).rotation.y=ang;
    const bp=P(RC,CH.oF-0.40);put(MB.CreatePlane('xxCheerBanner',{width:L+0.1,height:1.2,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),bp.x,CH.top-0.55,bp.z,bannerMat).rotation.y=ang+Math.PI;   // 橫幅用平面貼（正面朝場內）
    const led=P(RC,CH.oF-0.13);put(MB.CreateBox('xxCheerLed',{width:L+0.2,height:0.07,depth:0.28}),led.x,CH.top-1.25,led.z,ledMat).rotation.y=ang;
    for(let i=0;i<5;i++){const p=P(RC+(i-2)*(L/4.6),18.7),b=put(MB.CreateBox('xxCheerBrace',{width:0.3,height:0.3,depth:3.9}),p.x,3.45,p.z,deckMat);b.rotation.set(-0.395,ang,0);}   // 懸挑斜撐
    const rails=[],rb=(w,h,d,r,o,y)=>{const p=P(r,o),m=MB.CreateBox('xxCheerRail',{width:w,height:h,depth:d},scene);m.position.set(p.x,y,p.z);m.rotation.y=ang;rails.push(m);};
    const oEnd=21.4,oLen=oEnd-(CH.oF+0.12)-0.1,oMid=(CH.oF+0.12+0.1+oEnd)/2;
    rb(L,0.07,0.07,RC,CH.oF+0.12,CH.top+1.1);rb(L,0.05,0.05,RC,CH.oF+0.12,CH.top+0.55);
    for(let r=CH.r0;r<=CH.r1+0.01;r+=2)rb(0.10,1.1,0.10,r,CH.oF+0.12,CH.top+0.55);
    for(const r of [CH.r0+0.12,CH.r1-0.12]){rb(0.07,0.07,oLen,r,oMid,CH.top+1.1);rb(0.05,0.05,oLen,r,oMid,CH.top+0.55);for(const o of[CH.oF+0.12,18.4,20.3,oEnd])rb(0.10,1.1,0.10,r,o,CH.top+0.55);}
    merge(rails,railMat,'xxCheerRails');
    for(const r of [CH.r0+1.0,CH.r1-1.0]){
      const pp=P(r,22.8);put(MB.CreateCylinder('xxCheerPole',{diameter:0.14,height:6.4,tessellation:8},scene),pp.x,CH.top+3.0,pp.z,railMat);
      put(MB.CreateBox('xxCheerLamp',{width:1.4,height:0.7,depth:0.25}),pp.x,CH.top+6.4,pp.z,lampMat).rotation.y=ang;
      const fp=P(r+(r<RC?1.25:-1.25),22.8);put(MB.CreatePlane('xxCheerFlag',{width:2.2,height:1.4,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),fp.x,CH.top+4.9,fp.z,flagMat).rotation.y=ang+Math.PI;}
    ROWS.forEach(([o,drs],row)=>drs.forEach(dr=>{const p=P(RC+dr,o);cheerSlots.push({side:s,row,x:p.x,y:CH.top,z:p.z,ry:-s*Math.PI/4});}));
    cheerZones.push({side:s,center:{x:c.x,z:c.z},y:CH.top,length:L,depth:WD,slots:ROWS.reduce((n,[,d])=>n+d.length,0)});
  });
  const reg=(window.BaseballStadiums||{}).colosseum;if(reg){reg.cheerSlots=cheerSlots;reg.cheerZones=cheerZones;}
}

// ═════════ ⑨ 球場外：羅馬城市 ═════════
// 競技場獨佔一個大街廓（x∈[-151,151]、z∈[-75,173]），四周是「井」字形石頭路，路完整不被截斷；再往外是羅馬街區。
const GY=0.08,RW=14,SW=3,IXc=148,IZ0=-72,IZ1=170;
const XS=[];[158,238,318,398,478,558].forEach(v=>XS.push(v,-v));XS.sort((a,b)=>a-b);
const ZS=[-82,-162,-242,-322,-402,180,260,340,420,500,580].sort((a,b)=>a-b);
const isCenter=(i,j)=>XS[i]===-158&&XS[i+1]===158&&ZS[j]===-82&&ZS[j+1]===180;

// ── 地面貼圖：石頭路(不規則鋪路石)、石灰華人行道、泥地、廣場石板
function cobbleTex(){   // 14 m 一格：像古羅馬大道的玄武岩鋪路石（交錯的石塊、深色縫）
  const S=512,RH=16,t=newTex('xxCobble',S,S),g=t.getContext(),r=rng(51),pal=['#6e675c','#7b7367','#5f594f','#857d6e','#6a645a','#756e60','#8a8272'];
  g.fillStyle='#262219';g.fillRect(0,0,S,S);
  for(let row=0;row<S/RH;row++){let x=0;const ws=[];let sum=0;while(sum<S-20){const w=20+((r()*16)|0);ws.push(w);sum+=w;}ws.push(S-sum);const off=(r()*S)|0;
    let xx=0;for(const w of ws){const x0=(xx+off)%S;const c=pal[(r()*pal.length)|0],k=0.85+r()*0.3,rgb=hex2rgb(c).map(v=>Math.min(255,Math.round(v*k)));
      const draw=px=>{g.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;g.beginPath();g.roundRect?g.roundRect(px+1,row*RH+1,w-2,RH-2,4):g.rect(px+1,row*RH+1,w-2,RH-2);g.fill();
        g.fillStyle='rgba(255,255,255,0.10)';g.fillRect(px+3,row*RH+2,w-8,2);g.fillStyle='rgba(0,0,0,0.12)';g.fillRect(px+3,row*RH+RH-4,w-8,2);};
      draw(x0);if(x0+w>S)draw(x0-S);xx+=w;}}
  speck(g,S,r,9000,'rgba(255,255,255,0.05)','rgba(0,0,0,0.12)');t.update();return t;
}
function sidewalkTex(){   // 3 m（寬，u；u=0 是路緣）× 6 m（長，v）
  const W=128,H=256,t=newTex('xxSide',W,H),g=t.getContext(),r=rng(52);g.fillStyle='#b9a883';g.fillRect(0,0,W,H);speck(g,W,r,2500,'rgba(255,255,255,0.06)','rgba(70,50,20,0.10)');
  g.fillStyle='#8a7a5a';g.fillRect(0,0,W*0.1,H);g.fillStyle='rgba(255,255,255,0.25)';g.fillRect(W*0.1,0,2,H);
  g.strokeStyle='rgba(60,45,20,0.35)';g.lineWidth=2;g.beginPath();for(let v=0;v<=4;v++){g.moveTo(0,v*H/4);g.lineTo(W,v*H/4);}for(let v=0;v<4;v++){const x=v%2?W*0.55:W*0.7;g.moveTo(x,v*H/4);g.lineTo(x,(v+1)*H/4);}g.stroke();t.update();return t;}
function earthTex(){const S=256,t=newTex('xxEarth',S,S),g=t.getContext(),r=rng(53),img=g.createImageData(S,S),d=img.data;for(let i=0;i<S*S*4;i+=4){const k=1+(r()-0.5)*0.14;d[i]=155*k;d[i+1]=138*k;d[i+2]=105*k;d[i+3]=255;}g.putImageData(img,0,0);
  for(let n=0;n<500;n++){const x=r()*S,y=r()*S,rr2=0.8+r()*2;tile(S,x,y,4,(dx,dy)=>{g.fillStyle=n%2?'rgba(230,215,180,0.5)':'rgba(70,55,30,0.45)';g.beginPath();g.arc(x+dx,y+dy,rr2,0,TAU);g.fill();});}t.update();return t;}
function plazaTex(){   // 16 m 一格：4 m 見方的石灰華大石板，深紅嵌線
  const S=512,k=S/16,t=newTex('xxPlaza',S,S),g=t.getContext(),r=rng(54);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const c=hex2rgb(['#d0bf98','#c8b78f','#d6c6a0','#cbbb94'][(r()*4)|0]);g.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;g.fillRect(i*4*k,j*4*k,4*k,4*k);}
  speck(g,S,r,9000,'rgba(255,255,255,0.07)','rgba(80,60,30,0.10)');
  g.strokeStyle='rgba(60,45,20,0.45)';g.lineWidth=3;g.beginPath();for(let m=0;m<=16;m+=4){g.moveTo(m*k,0);g.lineTo(m*k,S);g.moveTo(0,m*k);g.lineTo(S,m*k);}g.stroke();
  g.strokeStyle='rgba(143,43,34,0.55)';g.lineWidth=5;g.strokeRect(2*k,2*k,12*k,12*k);t.update();return t;}
const gMat={cobble:tm(cobbleTex(),1),side:tm(sidewalkTex(),1),earth:tm(earthTex(),1),plaza:tm(plazaTex(),1)};
const acc={};
const gq=(key,pts,uvf)=>{const a=acc[key]||(acc[key]={pos:[],uv:[],idx:[]}),n=a.pos.length/3;pts.forEach(([x,z])=>{a.pos.push(x,GY,z);const q=uvf(x,z);a.uv.push(q[0],q[1]);});a.idx.push(n,n+1,n+2,n,n+2,n+3);};
const rectQ=(key,x0,z0,x1,z1,uvf)=>gq(key,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],uvf);
const W14=(x,z)=>[x/14,z/14];
for(const X of XS)for(const Z of ZS)rectQ('cobble',X-RW/2,Z-RW/2,X+RW/2,Z+RW/2,W14);   // 路口
function roadSeg(vert,C,a,b){const c0=C-RW/2,c1=C+RW/2;if(vert)rectQ('cobble',c0,a,c1,b,(x,z)=>[(x-c0)/RW,(z-a)/14]);else rectQ('cobble',a,c0,b,c1,(x,z)=>[(z-c0)/RW,(x-a)/14]);}
for(const X of XS)for(let j=0;j<ZS.length-1;j++)roadSeg(true,X,ZS[j]+RW/2,ZS[j+1]-RW/2);
for(const Z of ZS)for(let i=0;i<XS.length-1;i++)roadSeg(false,Z,XS[i]+RW/2,XS[i+1]-RW/2);
for(let i=0;i<XS.length-1;i++)for(let j=0;j<ZS.length-1;j++){   // 街廓：四周人行道（路緣在外）＋內部泥地（中央街廓內部改鋪廣場）
  const x0=XS[i]+RW/2,x1=XS[i+1]-RW/2,z0=ZS[j]+RW/2,z1=ZS[j+1]-RW/2;
  rectQ('side',x0,z0,x1,z0+SW,(x,z)=>[(z-z0)/SW,(x-x0)/6]);rectQ('side',x0,z1-SW,x1,z1,(x,z)=>[(z1-z)/SW,(x-x0)/6]);
  rectQ('side',x0,z0+SW,x0+SW,z1-SW,(x,z)=>[(x-x0)/SW,(z-z0)/6]);rectQ('side',x1-SW,z0+SW,x1,z1-SW,(x,z)=>[(x1-x)/SW,(z-z0)/6]);
  if(!isCenter(i,j))rectQ('earth',x0+SW,z0+SW,x1-SW,z1-SW,(x,z)=>[x/8,z/8]);
}
// 以 EC 為中心逐角度切片的環形鋪面：內緣 rIn(θ)、外緣 rOut(θ)，取樣角包含給定的頂點角
const castPoly=(poly,th)=>{const dx=Math.cos(th),dz=Math.sin(th);let best=1e9;
  for(let j=0;j<poly.length;j++){const A=poly[j],B=poly[(j+1)%poly.length],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
    const ax=A[0]-EC[0],az=A[1]-EC[1],t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6&&t<best)best=t;}return best;};
const ellR=(th,a,b)=>1/Math.sqrt((Math.cos(th)/a)**2+(Math.sin(th)/b)**2);
const castRect=th=>{const dx=Math.cos(th),dz=Math.sin(th),tx=dx>1e-12?(IXc-EC[0])/dx:dx<-1e-12?(-IXc-EC[0])/dx:1e9,tz=dz>1e-12?(IZ1-EC[1])/dz:dz<-1e-12?(IZ0-EC[1])/dz:1e9;return Math.min(tx,tz);};
function annulus(key,rIn,rOut,extraPts){
  const angOf=(x,z)=>((Math.atan2(z-EC[1],x-EC[0])%TAU)+TAU)%TAU,raw=[];for(let i=0;i<360;i++)raw.push(i*TAU/360);(extraPts||[]).forEach(([x,z])=>raw.push(angOf(x,z)));
  raw.sort((a,b)=>a-b);const A=raw.filter((a,i)=>i===0||a-raw[i-1]>1e-7),PX=(t2,r)=>[EC[0]+r*Math.cos(t2),EC[1]+r*Math.sin(t2)];
  for(let i=0;i<A.length;i++){const t0=A[i],t1=i===A.length-1?A[0]+TAU:A[i+1];gq(key,[PX(t0,rIn(t0)),PX(t0,rOut(t0)),PX(t1,rOut(t1)),PX(t1,rIn(t1))],(x,z)=>[x/16,z/16]);}
}
annulus('plaza',th=>ellR(th,EA+2.5,EB+2.5),castRect,[[IXc,IZ0],[-IXc,IZ0],[IXc,IZ1],[-IXc,IZ1]]);   // 中央街廓：競技場外牆與街廓內緣之間的大廣場
annulus('plaza',th=>castPoly(standPoly,th),th=>ellR(th,EA-0.6,EB-0.6),standPoly);                 // 競技場內：看台與外牆之間的環形走道
Object.keys(acc).forEach(key=>{const a=acc[key],m=new BABYLON.Mesh('xxGround_'+key,scene),vd=new BABYLON.VertexData(),nor=[];for(let q=0;q<a.pos.length/3;q++)nor.push(0,1,0);
  vd.positions=a.pos;vd.normals=nor;vd.uvs=a.uv;vd.indices=a.idx;vd.applyToMesh(m);m.material=gMat[key];m.isPickable=false;});

// ── 建築貼圖與小工具
const marbleMat=candy('#e6dcc4',0.6),stoneMat2=candy('#cdbb94',0.55);
function roofTex(){const S=256,t=newTex('xxRoofTile',S,S),g=t.getContext(),r=rng(61);g.fillStyle='#a8492a';g.fillRect(0,0,S,S);
  for(let y=0;y<S;y+=16){for(let x=((y/16)%2)*12;x<S;x+=24){const k=0.85+r()*0.3;g.fillStyle=`rgb(${Math.min(255,Math.round(184*k))},${Math.round(84*k)},${Math.round(48*k)})`;g.beginPath();g.arc(x+12,y+4,12,0,Math.PI);g.fill();g.strokeStyle='rgba(60,20,8,0.45)';g.lineWidth=1.5;g.stroke();}}
  speck(g,S,r,2500,'rgba(255,255,255,0.05)','rgba(0,0,0,0.12)');t.update();return t;}
const tileMat=tm(roofTex(),1);
function insulaTex(style,seed){   // 12 m×12 m：3 層 × 3 開間，每格 4 m；拱形窗（亮燈的窗是暖黃色）
  const S=384,k=S/12,t=newTex('xxInsula'+style,S,S),g=t.getContext(),r=rng(seed),base=['#d9a65f','#b5583a','#e6d8b6'][style];
  g.fillStyle=base;g.fillRect(0,0,S,S);speck(g,S,r,7000,'rgba(255,255,255,0.07)','rgba(60,40,15,0.12)');
  if(style===1){g.strokeStyle='rgba(60,25,10,0.35)';g.lineWidth=1;for(let y=0;y<S;y+=6){g.beginPath();g.moveTo(0,y);g.lineTo(S,y);g.stroke();for(let x=((y/6)%2)*6;x<S;x+=12){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+6);g.stroke();}}}
  for(let f=0;f<3;f++)for(let c=0;c<3;c++){
    const x=c*4*k,y=S-(f+1)*4*k,ww=1.6*k,wx=x+1.2*k,wy=y+0.9*k,wh=2.3*k,lit=r()<0.35;
    g.beginPath();g.moveTo(wx,wy+wh);g.lineTo(wx,wy+ww/2);g.arc(wx+ww/2,wy+ww/2,ww/2,Math.PI,0);g.lineTo(wx+ww,wy+wh);g.closePath();
    g.fillStyle=lit?'#ffcf70':'#1a110c';g.fill();g.strokeStyle=style===2?'#8f2b22':'#6b4a2a';g.lineWidth=3;g.stroke();
    g.fillStyle='#5a3a1f';g.fillRect(wx-0.35*k,wy+0.5*k,0.3*k,wh-0.5*k);g.fillRect(wx+ww+0.05*k,wy+0.5*k,0.3*k,wh-0.5*k);        // 木窗板
    g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(wx-0.2*k,wy+wh,ww+0.4*k,0.18*k);                                                     // 窗台
    if(f===0&&style===1&&c===1){g.fillStyle='#2a160c';g.beginPath();g.moveTo(x+0.8*k,y+4*k);g.lineTo(x+0.8*k,y+1.4*k);g.arc(x+2*k,y+1.4*k,1.2*k,Math.PI,0);g.lineTo(x+3.2*k,y+4*k);g.fill();}   // 拱門
  }
  for(let f=1;f<=3;f++){g.fillStyle='rgba(0,0,0,0.18)';g.fillRect(0,S-f*4*k,S,3);}
  t.update();return t;
}
const wallMats=[0,1,2].map(i=>tm(insulaTex(i,70+i*11),1)),wallG=[[],[],[]],roofG=[];
const snap=(v,m)=>Math.max(m,Math.round(v/m)*m);
function hipRoof(w,d,rh,over,x,y0,z){
  const hw=w/2+over,hd=d/2+over,rl=Math.abs(w-d)/2,alongX=w>=d;
  const E=[[-hw,0,-hd],[hw,0,-hd],[hw,0,hd],[-hw,0,hd]],Rg=rl<0.01?[[0,rh,0]]:(alongX?[[-rl,rh,0],[rl,rh,0]]:[[0,rh,-rl],[0,rh,rl]]);
  const pos=[],idx=[],uv=[];E.concat(Rg).forEach(p=>{pos.push(p[0],p[1],p[2]);uv.push(p[0]/5,p[2]/5+p[1]*0.2);});
  const near=p=>{let bi=0,bd=1e9;Rg.forEach((q,i)=>{const dd=(p[0]-q[0])**2+(p[2]-q[2])**2;if(dd<bd){bd=dd;bi=i;}});return 4+bi;};
  for(let e=0;e<4;e++){const a=e,b=(e+1)%4,pa=near(E[a]),pb=near(E[b]);if(pa===pb)idx.push(a,b,pa);else idx.push(a,b,pb,a,pb,pa);}
  const m=new BABYLON.Mesh('xxRoof',scene),vd=new BABYLON.VertexData(),nor=[];vd.positions=pos;vd.indices=idx;vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,idx,nor);vd.normals=nor;vd.applyToMesh(m);m.position.set(x,y0,z);return m;
}
function prism(w,d,h,x,y,z,rot){   // 屋脊沿 z 的三角柱（神殿屋頂／山牆）
  const pos=[-w/2,0,-d/2,w/2,0,-d/2,w/2,0,d/2,-w/2,0,d/2,0,h,-d/2,0,h,d/2],idx=[0,4,5,0,5,3,1,2,5,1,5,4,0,1,4,3,5,2,0,3,2,0,2,1],uv=[];
  for(let i=0;i<6;i++)uv.push(pos[i*3]/5,pos[i*3+2]/5+pos[i*3+1]*0.2);
  const m=new BABYLON.Mesh('xxPrism',scene),vd=new BABYLON.VertexData(),nor=[];vd.positions=pos;vd.indices=idx;vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,idx,nor);vd.normals=nor;vd.applyToMesh(m);m.position.set(x,y,z);m.rotation.y=rot||0;return m;
}
const rn=rng(20261031),marbleG=[],stoneG=[],bronzeG=[],pineTrunk=[],pineLeaf=[],lampPole=[],lampBowl=[],waterG=[];
function house(x,z,w,d,fl,st){   // 集合住宅：四面平牆（平面貼圖）＋赤陶四坡屋頂
  const h=fl*4,ou=((rn()*3)|0)/3,ov=((rn()*3)|0)/3;
  [[0,-1,w],[1,0,d],[0,1,w],[-1,0,d]].forEach(([nx,nz,len])=>{const half=nx?w/2:d/2,p=MB.CreatePlane('xxWallH',{width:len,height:h,frontUVs:V4(ou,ov,ou+len/12,ov+h/12)},scene);
    p.position.set(x+nx*half,h/2,z+nz*half);p.rotation.y=faceYaw(nx,nz);wallG[st].push(p);});
  const rf=hipRoof(w,d,Math.min(w,d)*0.28,0.7,x,h,z);roofG.push(rf);
}
// 建築小件
const box=(arr,x,y,z,w,h,d,rot)=>{const b=MB.CreateBox('xxPart',{width:w,height:h,depth:d},scene);b.position.set(x,y,z);b.rotation.y=rot||0;arr.push(b);return b;};
const cyl=(arr,x,y,z,db,dt,h,tess)=>{const c=MB.CreateCylinder('xxPartC',{diameterBottom:db,diameterTop:dt,height:h,tessellation:tess||10},scene);c.position.set(x,y,z);arr.push(c);return c;};
const sph=(arr,x,y,z,dm,sy)=>{const s=MB.CreateSphere('xxPartS',{diameter:dm,segments:8},scene);s.position.set(x,y,z);if(sy)s.scaling.y=sy;arr.push(s);return s;};
const rot2=(x,z,lx,lz,rot)=>[x+lx*Math.cos(rot)+lz*Math.sin(rot),z-lx*Math.sin(rot)+lz*Math.cos(rot)];
function temple(x,z,rot){   // 神殿：台基、台階、殿身、柱廊(20 根柱)、檐部、山牆、赤陶屋頂
  const P=(lx,lz)=>rot2(x,z,lx,lz,rot);
  let p=P(0,0);box(stoneG,p[0],0.6,p[1],22,1.2,36,rot);p=P(0,-19.2);box(stoneG,p[0],0.3,p[1],14,0.6,2.6,rot);p=P(0,6);box(marbleG,p[0],5.2,p[1],12,8,22,rot);
  const cols=[];for(let i=0;i<6;i++)cols.push([-8.5+i*3.4,-14]);for(let k=1;k<8;k++)for(const sx of[-8.5,8.5])cols.push([sx,-14+k*3.4]);
  cols.forEach(([lx,lz])=>{const q=P(lx,lz);cyl(marbleG,q[0],1.2+4.1,q[1],1.3,1.1,8.2,10);});
  p=P(0,-2.1);box(marbleG,p[0],10.5,p[1],19.4,1.4,26.4,rot);
  p=P(0,-15.2);const pd=prism(19.4,1.8,3.6,p[0],11.2,p[1],rot);marbleG.push(pd);
  p=P(0,-2.1);const rf=prism(19.4,26.4,3.4,p[0],11.2,p[1],rot);roofG.push(rf);
}
function statue(x,z,rot){box(marbleG,x,1,z,1.5,2,1.5,rot);cyl(marbleG,x,2+0.9,z,0.8,0.55,1.8,8);sph(marbleG,x,2+2.0,z,0.5);}
function pine(x,z,sc){sc=sc||1;cyl(pineTrunk,x,3.2*sc,z,0.6*sc,0.45*sc,6.4*sc,7);sph(pineLeaf,x,7.6*sc,z,8.5*sc,0.42);sph(pineLeaf,x+1.2*sc,8.6*sc,z-0.8*sc,5*sc,0.45);}
function cypress(x,z,sc){sc=sc||1;cyl(pineTrunk,x,0.8,z,0.4,0.3,1.6,6);const c=MB.CreateCylinder('xxCyp',{diameterBottom:2.6*sc,diameterTop:0,height:11*sc,tessellation:8},scene);c.position.set(x,6.6*sc,z);pineLeaf.push(c);}
function obelisk(x,z){box(stoneG,x,0.75,z,5.2,1.5,5.2);const s=MB.CreateCylinder('xxObel',{diameterBottom:3.2,diameterTop:1.9,height:24,tessellation:4},scene);s.position.set(x,13.5,z);s.rotation.y=Math.PI/4;bronzeG.push(s);
  const t=MB.CreateCylinder('xxObelTip',{diameterBottom:1.9,diameterTop:0,height:2.2,tessellation:4},scene);t.position.set(x,26.6,z);t.rotation.y=Math.PI/4;bronzeG.push(t);}
function fountain(x,z){cyl(stoneG,x,0.4,z,10,10,0.8,24);cyl(waterG,x,0.84,z,9,9,0.06,24);cyl(stoneG,x,2.6,z,3.2,1.2,4.4,16);cyl(waterG,x,5.0,z,1.6,1.6,0.1,12);sph(marbleG,x,5.3,z,1.0);}
// 圖拉真柱：貼螺旋浮雕
const columnMat=(()=>{const S=128,tx=newTex('xxColumnTex',S,512),g=tx.getContext();g.fillStyle='#e0d4b6';g.fillRect(0,0,S,512);g.strokeStyle='rgba(120,95,60,0.55)';g.lineWidth=7;
  for(let k=-2;k<10;k++){g.beginPath();g.moveTo(0,k*64+64);g.lineTo(S,k*64);g.stroke();}g.fillStyle='rgba(255,255,255,0.12)';g.fillRect(0,0,S*0.3,512);tx.update();return tm(tx,1);})();
function column(x,z){box(stoneG,x,1.5,z,5.0,3.0,5.0);const sh=MB.CreateCylinder('xxColumn',{diameterBottom:3.8,diameterTop:3.2,height:30,tessellation:20},scene);sh.position.set(x,17.9,z);sh.material=columnMat;sh.isPickable=false;
  cyl(stoneG,x,33.2,z,4.0,4.0,0.8,20);cyl(bronzeG,x,35.2,z,0.8,0.5,2.8,8);sph(bronzeG,x,37.2,z,1.0);}
// 凱旋門（君士坦丁凱旋門風格）：實心門體＋前後兩面平面貼圖（三拱門、四根獨立圓柱、頂部閣樓與浮雕圓盤）
function archTex(){const W=512,H=384,t=newTex('xxArchTex',W,H),g=t.getContext(),r=rng(81),kx=W/26,ky=H/19,Y=y=>H-y*ky;
  g.fillStyle='#e2d8bc';g.fillRect(0,0,W,H);speck(g,W,r,8000,'rgba(255,255,255,0.08)','rgba(70,50,20,0.10)');
  const arch=(cx,w,hs,hh)=>{const rr=w*kx/2,ys=Y(hs);g.beginPath();g.moveTo(cx*kx-rr,Y(0));g.lineTo(cx*kx-rr,ys);g.arc(cx*kx,ys,rr,Math.PI,0);g.lineTo(cx*kx+rr,Y(0));g.closePath();const gr=g.createLinearGradient(0,ys-rr,0,Y(0));gr.addColorStop(0,'#150c06');gr.addColorStop(1,'#4a2c12');g.fillStyle=gr;g.fill();g.strokeStyle='#cdbf9c';g.lineWidth=0.7*kx;g.stroke();};
  arch(13,8.4,8,0);arch(4.4,4.2,5,0);arch(21.6,4.2,5,0);
  for(const cx of[8.2,17.8,0.9,25.1]){const gx=g.createLinearGradient((cx-0.8)*kx,0,(cx+0.8)*kx,0);gx.addColorStop(0,'#b9ac8a');gx.addColorStop(0.5,'#efe6cb');gx.addColorStop(1,'#a89a78');g.fillStyle=gx;g.fillRect((cx-0.8)*kx,Y(12.4),1.6*kx,12.4*ky);g.fillStyle='#d8caa5';g.fillRect((cx-1.1)*kx,Y(12.9),2.2*kx,0.6*ky);}
  g.fillStyle='#cdbf9c';g.fillRect(0,Y(15),W,0.6*ky);
  for(const cx of[4.4,21.6]){g.fillStyle='#b8a67e';g.beginPath();g.arc(cx*kx,Y(10.6),1.7*kx,0,TAU);g.fill();g.strokeStyle='#8a7a58';g.lineWidth=3;g.stroke();}
  g.fillStyle='#d3c6a2';g.fillRect(1.5*kx,Y(18.4),23*kx,3.4*ky);g.strokeStyle='#8a7a58';g.lineWidth=3;g.strokeRect(1.5*kx,Y(18.4),23*kx,3.4*ky);
  g.font='bold 24px "Times New Roman",serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#6e1a14';g.fillText('IMP CAES FL CONSTANTINO MAXIMO',W/2,Y(16.7));
  g.fillStyle='#c9b98f';g.fillRect(0,Y(19),W,0.9*ky);t.update();return t;}
function triumphArch(x,z){const am=tm(archTex(),1);box(stoneG,x,9.5,z,25.8,19,6.6);
  const f=MB.CreatePlane('xxArchF',{width:26,height:19},scene);f.position.set(x,9.5,z-3.55);f.rotation.y=faceYaw(0,-1);f.material=am;f.isPickable=false;
  const b=MB.CreatePlane('xxArchB',{width:26,height:19},scene);b.position.set(x,9.5,z+3.55);b.rotation.y=faceYaw(0,1);b.material=am;b.isPickable=false;box(marbleG,x,19.5,z,26.6,1.0,7.4);}
// 輸水道：兩層拱廊（貼圖）
function aqTex(){const W=256,H=512,t=newTex('xxAqTex',W,H),g=t.getContext(),r=rng(91),kx=W/10,ky=H/26,Y=y=>H-y*ky;
  g.fillStyle='#b99c70';g.fillRect(0,0,W,H);speck(g,W,r,6000,'rgba(255,255,255,0.06)','rgba(60,40,15,0.12)');
  const arch=(cx,w,y0,hs)=>{const rr=w*kx/2;g.beginPath();g.moveTo(cx*kx-rr,Y(y0));g.lineTo(cx*kx-rr,Y(hs));g.arc(cx*kx,Y(hs),rr,Math.PI,0);g.lineTo(cx*kx+rr,Y(y0));g.closePath();g.fillStyle='#140c07';g.fill();g.strokeStyle='#d0b88c';g.lineWidth=0.35*kx;g.stroke();};
  arch(5,6.4,0,9.6);arch(2.5,3.0,13,17.6);arch(7.5,3.0,13,17.6);g.fillStyle='#a38760';g.fillRect(0,Y(13),W,0.8*ky);g.fillStyle='#8f7650';g.fillRect(0,Y(24),W,2*ky);t.update();return t;}
function aqSeg(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),mx=(ax+bx)/2,mz=(az+bz)/2,nx=dz/len,nz=-dx/len,am=aqSeg.m||(aqSeg.m=tm(aqTex(),1));
  for(const sg of[1,-1]){const p=MB.CreatePlane('xxAqueduct',{width:len,height:26,frontUVs:V4(0,0,len/10,1)},scene);p.position.set(mx+nx*sg*1.6,13,mz+nz*sg*1.6);p.rotation.y=faceYaw(nx*sg,nz*sg);p.material=am;p.isPickable=false;}
  const c=MB.CreateBox('xxAqCore',{width:len,height:26,depth:3.0},scene);c.position.set(mx,13,mz);c.rotation.y=Math.atan2(-dz,dx);c.material=stoneMat2;c.isPickable=false;}
aqSeg(-640,-470,-640,640);aqSeg(-640,-470,520,-470);

// ── 競技場旁的大廣場：凱旋門、噴泉、方尖碑、圖拉真柱、雕像、傘松、柏樹、火盆
triumphArch(0,-62);
[-62,62].forEach(x=>fountain(x,-62));[-136,136].forEach(x=>obelisk(x,48));[[-136,-60],[136,-60],[-136,160],[136,160]].forEach(([x,z])=>column(x,z));
for(let x=-100;x<=100;x+=33.3)statue(x,160,0);[[-136,0],[-136,100],[136,0],[136,100]].forEach(([x,z])=>statue(x,z,Math.PI/2));
for(let x=-124;x<=124;x+=16){pine(x,-67,0.9+(x%3)*0.05);pine(x,166,1.0);}for(let z=-50;z<=150;z+=18){pine(-145,z,1.0);pine(145,z,0.95);}
for(let i=0;i<NBAY;i+=3){const a=RP[i],dx=a[0]-EC[0],dz=a[1]-EC[1],l=Math.hypot(dx,dz),x=a[0]+dx/l*6.5,z=a[1]+dz/l*6.5;cyl(lampPole,x,1.8,z,0.22,0.22,3.6,6);cyl(lampBowl,x,3.75,z,0.9,0.6,0.5,8);cypress(a[0]+dx/l*10.5,a[1]+dz/l*10.5,0.8);}
// ── 街區：集合住宅、神殿廣場
for(let i=0;i<XS.length-1;i++)for(let j=0;j<ZS.length-1;j++){
  if(isCenter(i,j))continue;
  const bx0=XS[i]+RW/2+SW,bx1=XS[i+1]-RW/2-SW,bz0=ZS[j]+RW/2+SW,bz1=ZS[j+1]-RW/2-SW,cx=(bx0+bx1)/2,cz=(bz0+bz1)/2;
  if(Math.hypot(cx,cz-48)>560)continue;
  if((i*5+j*3)%8===0){   // 神殿廣場街廓
    temple(cx,cz,((i+j)%4)*Math.PI/2);for(const sx of[-1,1])for(const sz of[-1,1]){pine(cx+sx*(bx1-bx0)/2*0.82,cz+sz*(bz1-bz0)/2*0.82,1.0);statue(cx+sx*(bx1-bx0)/2*0.6,cz+sz*(bz1-bz0)/2*0.6,0);}continue;}
  const iw=bx1-bx0,ih=bz1-bz0,nx=Math.max(1,Math.floor(iw/32)),nz=Math.max(1,Math.floor(ih/32)),cw=iw/nx,ch=ih/nz;
  for(let a=0;a<nx;a++)for(let b=0;b<nz;b++){
    const x=bx0+cw*(a+0.5),z=bz0+ch*(b+0.5);if(rn()<0.08){pine(x,z,1.0);continue;}   // 偶爾留一塊中庭花園
    const w=snap(cw-4-rn()*4,4),d=snap(ch-4-rn()*4,4),fl=3+((rn()*rn()*4)|0);house(x,z,w,d,fl,(rn()*3)|0);
  }
}
// ── 街燈（青銅火盆燈）：沿街道人行道，離競技場 380 m 內
{const near=(x,z)=>Math.hypot(x,z-48)<380&&!(Math.abs(x)<151&&z>-75&&z<173);
 const seg=(vert,C,a,b)=>{for(let s=a+16;s<=b-16;s+=36)for(const off of[-8.5,8.5]){const x=vert?C+off:s,z=vert?s:C+off;if(!near(x,z))continue;cyl(lampPole,x,1.8,z,0.2,0.2,3.6,6);cyl(lampBowl,x,3.75,z,0.8,0.55,0.45,8);}};
 for(const X of XS)for(let j=0;j<ZS.length-1;j++)seg(true,X,ZS[j]+RW/2,ZS[j+1]-RW/2);
 for(const Z of ZS)for(let i=0;i<XS.length-1;i++)seg(false,Z,XS[i]+RW/2,XS[i+1]-RW/2);}
wallG.forEach((arr,i)=>merge(arr,wallMats[i],'xxInsulaWalls'+i));merge(roofG,tileMat,'xxRoofs');
merge(marbleG,marbleMat,'xxMarble');merge(stoneG,stoneMat2,'xxStoneWork');merge(bronzeG,candy('#a8664a',0.45),'xxObelisks');
merge(pineTrunk,candy('#5a3a22',0.4),'xxTrunks');merge(pineLeaf,candy('#2f5a2a',0.5),'xxPineLeaves');
merge(lampPole,M('#3a2c1c'),'xxLampPoles');merge(lampBowl,M('#ffb04a',{em:'#ffb04a'}),'xxBraziers');merge(waterG,M('#6fb8d8',{em:'#4a90b0'}),'xxWater');

// ═════════ ⑩ 全壘打規則 ═════════
ctx.setRules({fenceR:R,fenceH:WALL_H,arcDeg:45,simLimit:175,fenceAt});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).colosseum={id:'colosseum',name:'羅馬競技場球場',build:build};
})();
