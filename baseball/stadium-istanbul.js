/*
 * 伊斯坦堡清真寺球場（id: istanbul）— 外觀是土耳其（奧斯曼）清真寺風格：球場外圍沒有外牆，只在四個角各立一座巨大的禮拜塔
 * （宣禮塔，約 130 m）；裡面是棒球場；球場外是伊斯坦堡的景色。
 * 介面規格請參考 stadium-night.js 開頭的「球場外掛開發指南」。
 *
 *  場地
 *   · 外野草皮是「八芒星＋菱形」的伊斯蘭幾何鑲嵌割草紋（24 m 一格，星為亮綠、菱形為深綠）；內野是割草斜紋草皮，土區是赤陶紅土。
 *   · 外野牆（半徑 104 m）與界外牆：鈷藍底、綠松石八芒星磁磚、金邊、上下紅白帶（伊茲尼克風格）。
 *  配色：土耳其紅(#E30A17)、白、綠松石藍、鈷藍、金；觀眾多穿紅白球衣。
 *  看台與啦啦隊
 *   · 看台是一圈封閉、等深(12 階)的碗；一壘／三壘兩側各有一座懸挑的大理石啦啦隊舞台（18×7.3 m，各 15 個站位，球員尺寸），
 *     紅底白字橫幅「TÜRKİYE CHEERS」、旗桿上掛土耳其國旗；站位座標在 BaseballStadiums.istanbul.cheerSlots。
 *  清真寺外觀
 *   · 外圍的橢圓高牆已拆除；四根禮拜塔立在橢圓（半長軸 120 m、半短軸 94 m）的四個角：方形基座、有凹槽的長長塔身、
 *     兩層陽台(şerefe)、鉛灰色尖頂與金色頂飾。
 *   · 記分板立在外野看台的最後端（看台後牆頂上、中外野正後方；鈷藍／金框、象牙白分數格）。
 *  打擊區看得到的國旗
 *   · 記分板左右兩側對稱各立一根 46 m 的旗桿，各掛一面 24×16 m 的土耳其國旗（2:3 標準比例），旗面每幀用程式擺動、有明暗皺褶，飄揚中；
 *     旗面最高點 42 m、立在海峽南岸邊（離本壘 182 m），從打擊區看出去仰角約 8°~13°，且在記分板兩側不被擋住。
 *  伊斯坦堡
 *   · 外圍是起伏的山丘城市：彩色牆面、赤陶屋頂的奧斯曼木屋、成排的柏樹與傘松、多座清真寺（藍色清真寺、聖索菲亞、蘇萊曼尼耶…）、加拉達塔；
 *     北邊緊鄰博斯普魯斯海峽（南岸離外牆區約 50 m）：懸索大橋、渡輪、貨輪、少女塔小島，對岸是一片山丘城市；兩面國旗立在岸邊。
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

function grassTexture(name,seed,base,dark){   // 45° 割草斜紋（無縫），1024px 鋪 32 m
  const S=1024,t=newTex(name,S,S),g=t.getContext(),rnd=rng(seed),img=g.createImageData(S,S),d=img.data;
  for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.12;d[i]=base[0]*k;d[i+1]=base[1]*k;d[i+2]=base[2]*k;d[i+3]=255;}g.putImageData(img,0,0);
  const w=S/8;g.fillStyle=dark;for(let k=0;k<16;k+=2){g.beginPath();g.moveTo(k*w,0);g.lineTo((k+1)*w,0);g.lineTo((k+1)*w-S,S);g.lineTo(k*w-S,S);g.closePath();g.fill();}
  for(let n=0;n<240;n++){const x=rnd()*S,y=rnd()*S,r=25+rnd()*90;tile(S,x,y,r,(dx,dy)=>{g.fillStyle=n%2?'rgba(255,255,200,0.04)':'rgba(0,40,0,0.06)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  const bl=['rgba(30,90,30,0.4)','rgba(110,170,60,0.35)','rgba(20,70,20,0.35)','rgba(150,200,90,0.3)'];
  for(let n=0;n<22000;n++){const x=rnd()*S,y=rnd()*S,l=5+rnd()*9,a=-1.57+(rnd()-0.5)*1.3;tile(S,x,y,14,(dx,dy)=>{g.strokeStyle=bl[(rnd()*4)|0];g.lineWidth=0.8+rnd();g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke();});}
  t.update();return t;
}
// 八芒星（兩個疊起來的正方形）：Ro＝外徑，rot＝旋轉；先 beginPath 再畫，不 fill
const star8=(g,cx,cy,Ro,rot)=>{const Ri=Ro*0.7654;g.beginPath();for(let k=0;k<16;k++){const a=(rot||0)+k*Math.PI/8,r=k%2?Ri:Ro;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();};
const star5=(g,cx,cy,Ro,rot,fill)=>{g.fillStyle=fill;g.beginPath();for(let k=0;k<10;k++){const a=(rot||0)+k*Math.PI/5,r=k%2?Ro*0.382:Ro;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.fill();};
// 土耳其國旗（2:3）：紅底、白色新月（開口朝向飄動端）、五角星
function drawTurkishFlag(g,W,H){
  g.fillStyle='#E30A17';g.fillRect(0,0,W,H);const A=H;
  g.fillStyle='#ffffff';g.beginPath();g.arc(0.45*A,0.5*A,0.25*A,0,TAU);g.fill();
  g.fillStyle='#E30A17';g.beginPath();g.arc(0.5125*A,0.5*A,0.2*A,0,TAU);g.fill();
  star5(g,0.80*A,0.5*A,0.125*A,0,'#ffffff');
}
function crescentIcon(g,cx,cy,R,col,bg){g.fillStyle=col;g.beginPath();g.arc(cx,cy,R,0,TAU);g.fill();g.fillStyle=bg;g.beginPath();g.arc(cx+R*0.3,cy,R*0.8,0,TAU);g.fill();star5(g,cx+R*1.25,cy,R*0.5,0,col);}   // 新月（開口朝右）＋星；bg＝底色
// ═════════ ② 場地貼圖：外野草皮的八芒星鑲嵌、內野割草斜紋、赤陶紅土 ═════════
function starGrassTexture(){   // 24 m 一格（1024px）：中央一顆八芒星（亮）＋四角各 1/4 菱形（拼起來是完整菱形、深）＝「星與十字」鑲嵌
  const S=1024,t=newTex('xxGrass',S,S),g=t.getContext(),rnd=rng(11),img=g.createImageData(S,S),d=img.data;
  for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.10;d[i]=54*k;d[i+1]=136*k;d[i+2]=62*k;d[i+3]=255;}g.putImageData(img,0,0);
  const dr=S*0.17;g.fillStyle='#2a7236';for(const [x,y] of [[0,0],[S,0],[0,S],[S,S]]){g.beginPath();g.moveTo(x-dr,y);g.lineTo(x,y-dr);g.lineTo(x+dr,y);g.lineTo(x,y+dr);g.closePath();g.fill();}
  g.fillStyle='#5cb86a';star8(g,S/2,S/2,S*0.47,0);g.fill();g.strokeStyle='rgba(225,247,215,0.65)';g.lineWidth=5;g.stroke();
  g.fillStyle='#46a557';star8(g,S/2,S/2,S*0.30,Math.PI/8);g.fill();g.strokeStyle='rgba(225,247,215,0.5)';g.lineWidth=4;g.stroke();
  g.fillStyle='#7cc986';star8(g,S/2,S/2,S*0.13,0);g.fill();g.strokeStyle='rgba(245,255,235,0.7)';g.lineWidth=3;g.stroke();
  g.strokeStyle='rgba(225,247,215,0.55)';g.lineWidth=4;for(const [x,y] of [[0,0],[S,0],[0,S],[S,S]]){g.beginPath();g.moveTo(x-dr,y);g.lineTo(x,y-dr);g.lineTo(x+dr,y);g.lineTo(x,y+dr);g.closePath();g.stroke();}
  const bl=['rgba(20,80,30,0.35)','rgba(140,210,110,0.3)','rgba(15,60,20,0.3)','rgba(170,225,130,0.25)'];
  for(let n=0;n<26000;n++){const x=rnd()*S,y=rnd()*S,l=5+rnd()*9,a=-1.57+(rnd()-0.5)*1.3;tile(S,x,y,14,(dx,dy)=>{g.strokeStyle=bl[(rnd()*4)|0];g.lineWidth=0.8+rnd();g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke();});}
  t.update();return t;
}
function clayTexture(){   // 赤陶紅土
  const S=512,t=newTex('xxClay',S,S),g=t.getContext(),rnd=rng(23),img=g.createImageData(S,S),d=img.data;
  for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.14;d[i]=180*k;d[i+1]=96*k;d[i+2]=60*k;d[i+3]=255;}g.putImageData(img,0,0);
  for(let n=0;n<130;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*50;tile(S,x,y,r,(dx,dy)=>{g.fillStyle=n%2?'rgba(235,170,130,0.10)':'rgba(110,50,28,0.12)';g.beginPath();g.arc(x+dx,y+dy,r,0,TAU);g.fill();});}
  for(let n=0;n<800;n++){const x=rnd()*S,y=rnd()*S,r=0.8+rnd()*1.8;tile(S,x,y,6,(dx,dy)=>{g.fillStyle=n%2?'rgba(232,180,140,0.55)':'rgba(80,38,22,0.5)';g.beginPath();g.ellipse(x+dx,y+dy,r*1.3,r,rnd()*3,0,TAU);g.fill();});}
  for(let n=0;n<45;n++){const y=rnd()*S;g.strokeStyle='rgba(110,55,30,0.12)';g.lineWidth=1;g.beginPath();g.moveTo(0,y);g.lineTo(S,y);g.stroke();}
  t.update();return t;
}
const starGrassT=starGrassTexture(),infT=grassTexture('xxInfield',31,[62,134,62],'rgba(0,45,0,0.12)'),clayT=clayTexture();
ctx.makeGround(texMat(starGrassT,1),24);                    // 外野草地：24 m 一個重複＝一顆八芒星
ctx.setFieldMats({infield:texMat(infT,1),dirt:texMat(clayT,1),home:texMat(clayT,0.97),mound:texMat(clayT,1.04)});

// ═════════ ③ 外野牆、界外牆（石灰華＋盾牌浮雕帶）═════════
const R=104,WALL_H=3.4,FOUL_OFF=20,T=12,STEP=1.1,ROW=0.8,GAP=1.6;
const S_W=Math.sqrt(R*R-FOUL_OFF*FOUL_OFF),A_W=Math.atan2(S_W+FOUL_OFF,S_W-FOUL_OFF)/D2R;     // 界外牆與外野牆交會處（約 56°）
const R_O=R+GAP,F_S=FOUL_OFF+GAP,S_C=Math.sqrt(R_O*R_O-F_S*F_S);                              // 轉角點 J：側邊看台前緣 ∩ 外野看台前緣
const JP=s=>lpt(s,S_C,F_S),A_C=Math.atan2(JP(1).x,JP(1).z);                                      // A_C：轉角的方位角(弧度)
function friezeTex(){   // 6 m 一格：鈷藍底、綠松石八芒星磁磚（伊茲尼克風格）、金邊、上緣乳白線腳、下緣土耳其紅
  const W=512,H=256,t=newTex('xxFrieze',W,H),g=t.getContext(),r=rng(31);
  g.fillStyle='#1c4696';g.fillRect(0,0,W,H);speck(g,W,r,3500,'rgba(255,255,255,0.06)','rgba(0,10,40,0.12)');
  g.fillStyle='#efe7d2';g.fillRect(0,0,W,20);g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(0,20,W,4);g.fillStyle='#d9b04a';g.fillRect(0,26,W,4);
  g.fillStyle='#E30A17';g.fillRect(0,H-34,W,34);g.fillStyle='#efe7d2';g.fillRect(0,H-38,W,4);g.fillStyle='#d9b04a';g.fillRect(0,H-44,W,4);
  const cx=W/2,cy=(34+H-44)/2+2,Ro=H*0.40;
  g.fillStyle='#18a3b4';star8(g,cx,cy,Ro,0);g.fill();g.strokeStyle='#f4f0e0';g.lineWidth=5;g.stroke();
  g.fillStyle='#1c4696';star8(g,cx,cy,Ro*0.62,Math.PI/8);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=3;g.stroke();
  g.fillStyle='#f4f0e0';star8(g,cx,cy,Ro*0.30,0);g.fill();g.fillStyle='#E30A17';g.beginPath();g.arc(cx,cy,Ro*0.13,0,TAU);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=2;g.stroke();
  for(const x of [0,W]){g.fillStyle='#f4f0e0';g.beginPath();g.moveTo(x-22,cy);g.lineTo(x,cy-22);g.lineTo(x+22,cy);g.lineTo(x,cy+22);g.closePath();g.fill();g.fillStyle='#18a3b4';g.beginPath();g.moveTo(x-10,cy);g.lineTo(x,cy-10);g.lineTo(x+10,cy);g.lineTo(x,cy+10);g.closePath();g.fill();}
  t.update();return t;
}
function facadeTex(){   // 8 m 寬 × 16 m 高一格（每公尺 64 px）：土耳其紅白石條基座＋尖拱壁龕（伊茲尼克磁磚＋花窗）＋八芒星磁磚飾帶＋小尖拱垛口
  const W=512,H=1024,t=newTex('xxFacade',W,H),g=t.getContext(),r=rng(88),P=64,Y=m=>H-m*P,X=m=>m*P;
  g.fillStyle='#efe5cc';g.fillRect(0,0,W,H);for(let q=0;q<18000;q++){g.fillStyle=q%2?'rgba(255,255,255,0.10)':'rgba(90,70,35,0.10)';const s2=1+r()*2;g.fillRect(r()*W,r()*H,s2,s2);}
  // 基座：紅白相間的石條（ablaq）＋深色線腳
  for(let i=0;i<5;i++){g.fillStyle=i%2?'#efe5cc':'#b5483a';g.fillRect(0,Y(0.44*(i+1)),W,0.44*P+1);}
  g.fillStyle='#6b4a2a';g.fillRect(0,Y(2.4),W,0.2*P);g.fillStyle='#d9b04a';g.fillRect(0,Y(2.4)-3,W,3);
  // 壁柱（模組兩側）：淺色，帶細直線
  g.fillStyle='#f4ecd6';g.fillRect(0,Y(14.0),X(0.9),Y(2.6)-Y(14.0));g.fillRect(X(7.1),Y(14.0),X(0.9),Y(2.6)-Y(14.0));
  g.strokeStyle='rgba(120,95,50,0.55)';g.lineWidth=2;for(const x of[0.9,7.1]){g.beginPath();g.moveTo(X(x),Y(2.6));g.lineTo(X(x),Y(11.8));g.stroke();}
  // 尖拱壁龕
  const cx=X(4),x0=X(0.9+0.35),x1=X(7.1-0.35),yb=Y(2.9),ys=Y(8.4),yp=Y(11.2);
  const arch=(xa,xb,yBase,ySpring,yPeak)=>{const c=(xa+xb)/2;g.beginPath();g.moveTo(xa,yBase);g.lineTo(xa,ySpring);g.bezierCurveTo(xa,ySpring-(ySpring-yPeak)*0.55,c-(xb-xa)*0.12,yPeak+(ySpring-yPeak)*0.18,c,yPeak);g.bezierCurveTo(c+(xb-xa)*0.12,yPeak+(ySpring-yPeak)*0.18,xb,ySpring-(ySpring-yPeak)*0.55,xb,ySpring);g.lineTo(xb,yBase);g.closePath();};
  arch(x0,x1,yb,ys,yp);g.fillStyle='#cdbd96';g.fill();g.strokeStyle='#b08a3a';g.lineWidth=6;g.stroke();
  arch(x0+7,x1-7,yb,ys,yp+9);g.strokeStyle='#7a5a2a';g.lineWidth=2;g.stroke();
  // 壁龕下半：藍色磁磚＋綠松石八芒星
  g.fillStyle='#1c4696';g.fillRect(x0+12,Y(4.4),x1-x0-24,Y(2.9)-Y(4.4)-6);
  for(let i=0;i<4;i++){const sx=X(1.9+i*1.4),sy=Y(3.65);g.fillStyle='#18a3b4';star8(g,sx,sy,0.42*P,0);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=1.5;g.stroke();g.fillStyle='#f4f0e0';star8(g,sx,sy,0.16*P,Math.PI/8);g.fill();}
  // 尖拱花窗：深藍玻璃、象牙白窗櫺、綠松石外框
  arch(X(2.55),X(5.45),Y(4.9),Y(8.0),Y(9.5));g.fillStyle='#14223d';g.fill();g.strokeStyle='#18a3b4';g.lineWidth=7;g.stroke();g.strokeStyle='#e8dfc4';g.lineWidth=3;g.stroke();
  g.strokeStyle='#e8dfc4';g.lineWidth=3;g.beginPath();g.moveTo(cx,Y(4.9));g.lineTo(cx,Y(9.3));for(const yy of[6.2,7.4]){g.moveTo(X(2.6),Y(yy));g.lineTo(X(5.4),Y(yy));}g.stroke();
  g.beginPath();g.arc(cx,Y(8.55),0.34*P,0,TAU);g.stroke();
  // 拱心：八芒星
  g.fillStyle='#18a3b4';star8(g,cx,Y(10.2),0.5*P,0);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=3;g.stroke();g.fillStyle='#E30A17';g.beginPath();g.arc(cx,Y(10.2),0.12*P,0,TAU);g.fill();
  // 八芒星磁磚飾帶（鈷藍底、綠松石＋象牙白八芒星、金邊）
  g.fillStyle='#1c4696';g.fillRect(0,Y(13.4),W,Y(11.8)-Y(13.4));
  for(let i=0;i<4;i++){const sx=X(1+i*2),sy=Y(12.6);g.fillStyle='#18a3b4';star8(g,sx,sy,0.7*P,0);g.fill();g.strokeStyle='#f4f0e0';g.lineWidth=3;g.stroke();g.fillStyle='#1c4696';star8(g,sx,sy,0.42*P,Math.PI/8);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=2;g.stroke();g.fillStyle='#f4f0e0';star8(g,sx,sy,0.2*P,0);g.fill();g.fillStyle='#E30A17';g.beginPath();g.arc(sx,sy,0.07*P,0,TAU);g.fill();}
  g.fillStyle='#d9b04a';g.fillRect(0,Y(13.4)-4,W,5);g.fillRect(0,Y(11.8)-1,W,5);
  // 檐口＋小尖拱垛口
  g.fillStyle='#8a7548';g.fillRect(0,Y(14.0),W,0.35*P);g.fillStyle='#efe7d2';g.fillRect(0,Y(13.65),W,0.25*P);
  for(let i=0;i<8;i++){const xa=X(i),xb=X(i+1)-3;arch(xa+4,xb,Y(14.0),Y(15.0),Y(15.9));g.fillStyle='#18a3b4';g.fill();g.strokeStyle='#d9b04a';g.lineWidth=2;g.stroke();}
  t.update();return t;
}
const stoneMat=candy('#e6dcc0',0.55),friezeMat=tm(friezeTex(),1),capMat=candy('#f3ecd8',0.6),facadeMat=tm(facadeTex(),1);
// 看台後牆（球場的「外牆」）：盒子的大面貼 facadeTex，按公尺換算 UV（8 m × 16 m 一格）
const facadeBox=(name,w,h,d)=>{const f=V4(0,0,w/8,h/16);return MB.CreateBox(name,{width:w,height:h,depth:d,faceUV:[f,f,V4(0,0,0.05,0.05),V4(0,0,0.05,0.05),V4(0,0,0.05,0.05),V4(0,0,0.05,0.05)]});};
function inward(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz);let nx=-dz/l,nz=dx/l;const mx=(ax+bx)/2,mz=(az+bz)/2;if(nx*(0-mx)+nz*(40-mz)<0){nx=-nx;nz=-nz;}return [nx,nz];}   // 朝向場內(0,40)的法線
let wsN=0;
function wallSeg(ax,az,bx,bz,h,th,fence,outfield,ext){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2,n=inward(ax,az,bx,bz);
  const b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th}),cx,h/2,cz,stoneMat);b.rotation.y=ang;if(fence)registerFenceCollider(b,!!outfield);
  put(MB.CreateBox('xxCap',{width:len+0.1,height:0.3,depth:th+0.3}),cx,h+0.15+(wsN++%2)*0.04,cz,capMat).rotation.y=ang;   // 相鄰石帽高度錯開 4 cm，接縫重疊處就不會共面
  const p=put(MB.CreatePlane('xxWallFace',{width:len,height:h-0.05,frontUVs:V4(0,0,len/6,1)},scene),cx+n[0]*(th/2+0.1),(h-0.05)/2,cz+n[1]*(th/2+0.1),friezeMat);p.rotation.y=faceYaw(n[0],n[1]);   // 場內側的浮雕帶（平面）
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
{const pm=candy('#d9b04a',0.8);sides.forEach(s=>{const p=lpt(s,R,0);put(MB.CreateCylinder('xxPole',{diameter:0.4,height:18.2,tessellation:10},scene),p.x,9,p.z,pm);});}

// ═════════ ④ 觀眾席：一圈封閉、等深的碗（托加觀眾）═════════
const CROWD_N=14,CROWD_TW=CROWD_N*0.5333;
function crowdTextures(){
  const W=CROWD_N*64,rnd=rng(5),shirts=['#E30A17','#ffffff','#E30A17','#f4f0e0','#c4121c','#ffffff','#1c4696','#18a3b4','#E30A17','#ffffff'],
    skins=['#f6d4b4','#f1c7a0','#e0ad82','#c98f63'],hairs=['#2c231d','#4a3626','#10100f','#6a4a2a','#8a6a3a'];
  const front=newTex('xxCrowdF',W,96),gf=front.getContext(),top=newTex('xxCrowdT',W,132),gt=top.getContext();
  gf.fillStyle='#16275a';gf.fillRect(0,0,W,96);gt.fillStyle='#1d3070';gt.fillRect(0,0,W,132);
  for(let i=0;i<CROWD_N;i++){const cx=i*64+32+(rnd()-0.5)*8,sh=shirts[(rnd()*shirts.length)|0],sk=skins[(rnd()*skins.length)|0],hr=hairs[(rnd()*hairs.length)|0];
    gf.fillStyle=sh;gf.beginPath();gf.ellipse(cx,84,26,34,0,0,TAU);gf.fill();
    gf.fillStyle=(sh==='#ffffff'||sh==='#f4f0e0')?'#E30A17':'#ffffff';gf.fillRect(cx-5,56,10,40);   // 圍巾條紋   // 托加的紫紅／淺色條紋
    gf.fillStyle=sk;gf.beginPath();gf.arc(cx,34,13,0,TAU);gf.fill();
    gf.fillStyle=hr;gf.beginPath();gf.arc(cx,29,13.5,Math.PI,TAU);gf.fill();
    if(rnd()<0.2){gf.fillStyle='#E30A17';gf.beginPath();gf.arc(cx,26,14,Math.PI,TAU);gf.fill();gf.fillStyle='#ffffff';gf.beginPath();gf.arc(cx-2,22,3.2,0,TAU);gf.fill();}   // 紅帽子加白色新月
    gt.fillStyle=sh;gt.beginPath();gt.ellipse(cx,66,26,15,0,0,TAU);gt.fill();gt.fillStyle=hr;gt.beginPath();gt.arc(cx,66,12,0,TAU);gt.fill();}
  front.update();top.update();return {front,top};
}
const crowd=crowdTextures();
const cf=M('#000000');cf.emissiveTexture=crowd.front;cf.disableLighting=true;cf.backFaceCulling=false;
const ct=M('#000000');ct.emissiveTexture=crowd.top;ct.disableLighting=true;ct.backFaceCulling=false;
const crowdMat=new BABYLON.MultiMaterial('xxCrowd',scene);crowdMat.subMaterials=[cf,ct];
const concrete=candy('#e4d9bc',0.5),glowStrip=M('#8fe0ea',{em:'#8fe0ea'});
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
  const backOff=gap+tiers*STEP+0.3,bh=top0+tiers*ROW+1.6,bw=put(facadeBox('xxStandBack',L,bh,0.6),mx+nx*backOff,bh/2,mz+nz*backOff,facadeMat);
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
    const wl=put(facadeBox('xxFanBack',w,bh,0.7),x,bh/2,z,facadeMat);wl.rotation.y=am;registerBallSolid(wl,'spectator');
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
const DUG_R=19,DUG_FRONT=12.4,benchMat=candy('#b8863a',0.4),roofMat=candy('#1c4696',0.6),slab=candy('#d8ceb0',0.4);
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

// ═════════ ⑥ 禮拜塔：外圍的橢圓高牆已拆除，只留橢圓四個角上的四根巨大禮拜塔 ═════════
const EC=[0,48],EA=120,EB=94;   // 橢圓（外圍廣場／山丘平台的範圍，也是四根禮拜塔的定位基準）
const ell=t=>[EA*Math.cos(t),EC[1]+EB*Math.sin(t)];
// 圓頂：用旋轉面做的半球（base 在 y=0）
const domeMesh=(R,hs)=>{const sh=[];for(let a=0;a<=90;a+=10)sh.push(new BABYLON.Vector3(R*Math.cos(a*D2R),R*Math.sin(a*D2R)*hs,0));return MB.CreateLathe('xxDome',{shape:sh,tessellation:20,closed:false,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);};
const addDome=(arr,x,y,z,R,hs)=>{const m=domeMesh(R,hs);m.position.set(x,y,z);arr.push(m);return m;};
// 禮拜塔（宣禮塔）：方形基座 → 有凹槽的塔身 → 陽台(şerefe) ×2 → 鉛灰尖頂 → 金色頂飾；s＝比例（1＝約 130 m）
function minTex(){const S=128,t=newTex('xxMinaretTex',S,S),g=t.getContext(),r=rng(55);g.fillStyle='#eee6d2';g.fillRect(0,0,S,S);speck(g,S,r,1500,'rgba(255,255,255,0.1)','rgba(90,70,40,0.1)');
  for(let x=0;x<S;x+=16){g.fillStyle='rgba(120,100,70,0.22)';g.fillRect(x,0,3,S);g.fillStyle='rgba(255,255,255,0.28)';g.fillRect(x+3,0,2,S);}g.fillStyle='rgba(217,176,74,0.55)';g.fillRect(0,0,S,6);g.fillRect(0,S-6,S,6);t.update();return t;}
const minMat=tm(minTex(),1),minStoneM=candy('#e4dcc6',0.55),minDeckM=candy('#d4c9ae',0.5),minCapM=candy('#8c9eaa',0.5),goldM=candy('#e0b94e',0.8);
const minG={shaft:[],stone:[],deck:[],cap:[],gold:[]};
function minaret(x,z,s,y0){
  const Yh=h=>y0+h*s;
  const cy_=(arr,db,dt,h,yc,tess,fuv)=>{const o={diameterBottom:db*s,diameterTop:dt*s,height:h*s,tessellation:tess||20};if(fuv)o.faceUV=fuv;const c=MB.CreateCylinder('xxMin',o,scene);c.position.set(x,Yh(yc),z);arr.push(c);};
  const bx_=(arr,w,h,d,yc)=>{const b=MB.CreateBox('xxMinB',{width:w*s,height:h*s,depth:d*s},scene);b.position.set(x,Yh(yc),z);arr.push(b);};
  const tor=(arr,d,yc)=>{const o=MB.CreateTorus('xxMinRail',{diameter:d*s,thickness:0.2*s,tessellation:24},scene);o.position.set(x,Yh(yc),z);arr.push(o);};
  const side=h=>[V4(0,0,1,1),V4(0,0,6,Math.max(1,h*s/10)),V4(0,0,1,1)];
  bx_(minG.stone,10,14,10,7);bx_(minG.stone,11,0.9,11,14.2);cy_(minG.stone,8.4,6.8,2.4,15.6,16);
  cy_(minG.shaft,6.8,5.4,44,38.6,22,side(44));                                       // 塔身 1：16.4 ~ 60.6
  cy_(minG.stone,5.4,9.2,2.6,61.9,20);cy_(minG.deck,9.4,9.4,0.6,63.5,24);tor(minG.deck,9.0,64.7);tor(minG.deck,9.0,64.0);   // 陽台 1：托座、地板、欄杆
  cy_(minG.shaft,4.6,4.0,18,73.0,18,side(18));                                       // 塔身 2：64 ~ 82
  cy_(minG.stone,4.0,7.2,2.2,83.1,18);cy_(minG.deck,7.4,7.4,0.5,84.45,20);tor(minG.deck,7.0,85.4);tor(minG.deck,7.0,84.8);  // 陽台 2
  cy_(minG.shaft,3.4,2.9,14,92.0,16,side(14));                                       // 塔身 3：85 ~ 99
  cy_(minG.cap,3.9,0,26,112,16);                                                     // 尖頂：99 ~ 125
  cy_(minG.gold,0.3,0.3,5,127.5,8);const g1=MB.CreateSphere('xxMinGold',{diameter:0.9*s,segments:8},scene);g1.position.set(x,Yh(125.2),z);minG.gold.push(g1);
  const g2=MB.CreateSphere('xxMinGold',{diameter:0.55*s,segments:8},scene);g2.position.set(x,Yh(130.3),z);minG.gold.push(g2);
}
// 四根巨大的禮拜塔：立在橢圓的四個角（參數角 45°、135°、225°、315°），離橢圓 9 m
  [45,135,225,315].forEach(a=>{const t=a*D2R,p=ell(t),gx=(p[0]-EC[0])/(EA*EA),gz=(p[1]-EC[1])/(EB*EB),gl=Math.hypot(gx,gz);minaret(p[0]+gx/gl*9,p[1]+gz/gl*9,1,0.08);});
// 看台外緣多邊形（用來挖空看台與外牆之間的廣場鋪面）：本壘後方 → 側邊看台 → 轉角 → 外野弧 → 左側
const fo=(s,r,o)=>{const p=lpt(s,r,o);return [p.x,p.z];};
const standPoly=[[0,-31]],half=[[16,-31],fo(1,8,37),fo(1,S_C,37)];
{const J=JP(1);for(let i=0;i<=6;i++){const a=Math.atan2(SQ,-SQ)+(A_C-Math.atan2(SQ,-SQ))*i/6;half.push([J.x+15.5*Math.sin(a),J.z+15.5*Math.cos(a)]);}}
standPoly.push(...half);for(let i=0;i<=28;i++){const a=A_C-2*A_C*i/28;standPoly.push([121.5*Math.sin(a),121.5*Math.cos(a)]);}
standPoly.push(...half.map(([x,z])=>[-x,z]).reverse());

// ═════════ ⑦ 記分板：立在外野看台的最後端（看台後牆頂上、中外野正後方；36×12 m）；鈷藍底、金框、象牙白分數格、綠松石局數、八芒星裝飾 ═════════
{
  const BW=36,BH=12,BY=22.1,boardTex=sbTexInit();   // 外野看台後牆頂高 15.6 m、後牆中心半徑 119.1 m；框底 15.4 m（插進牆頂 0.2 m），記分板坐在牆頂上，看台本身不動
  const fm=M('#000000');fm.emissiveTexture=boardTex;fm.disableLighting=true;fm.backFaceCulling=false;
  put(MB.CreatePlane('xxBoardFace',{width:BW,height:BH,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),0,BY,116.7,fm);                    // 平面正面 -z ＝ 朝向本壘（框前面 117.4，記分板在框前 0.7 m）
  registerBallSolid(put(MB.CreateBox('xxBoardFrame',{width:BW+1.4,height:BH+1.4,depth:2.4}),0,BY,118.6,candy('#d9b04a',0.7)));   // 框 z 117.4~119.8：後端蓋過弧形後牆（記分板兩端的後牆退到 z≈117.3）
  function drawBoard(g,s,W,H){
    const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',NUM='"Arial Rounded MT Bold","Arial Narrow",Arial,sans-serif';
    const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#14409a');bg.addColorStop(1,'#0a2562');g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.strokeStyle='#d9b04a';g.lineWidth=14;rr(10,10,W-20,H-20,18);g.stroke();g.strokeStyle='rgba(120,226,236,0.8)';g.lineWidth=3;rr(28,28,W-56,H-56,12);g.stroke();
    for(const [x,y] of [[60,60],[W-60,60],[60,H-60],[W-60,H-60]]){g.fillStyle='#18a3b4';star8(g,x,y,26,0);g.fill();g.strokeStyle='#f4f0e0';g.lineWidth=3;g.stroke();g.fillStyle='#d9b04a';g.beginPath();g.arc(x,y,6,0,TAU);g.fill();}
    const NX=100,NW=250,IX=NX+NW,IW=80,RX=IX+9*IW+16,RW=96,HY=40,HH=62,R1=HY+HH+8,RH=104,R2=R1+RH+6;
    const tile_=(x,y,w,h,fill)=>{g.fillStyle=fill;rr(x+5,y+5,w-10,h-10,8);g.fill();};
    const txt=(t,cx,cy,sz,col,font)=>{g.font='bold '+sz+'px '+(font||NUM);g.textAlign='center';g.textBaseline='middle';g.fillStyle=col;g.fillText(t,cx,cy+2);};
    for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn,x=IX+i*IW;tile_(x,HY,IW,HH,cur?'#f2c94c':'#17909e');txt(String(n),x+IW/2,HY+HH/2,42,cur?'#0a2562':'#ffffff');}
    [['R','#ffffff'],['H','#ffffff'],['E','#ffffff']].forEach(([t,c],i)=>{tile_(RX+i*RW,HY,RW,HH,'#E30A17');txt(t,RX+i*RW+RW/2,HY+HH/2,44,c);});
    g.font='bold 24px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle='#bfe9ee';g.fillText('球隊',NX+16,HY+HH/2+2);
    [['me',R1,'#ff6b78'],['cpu',R2,'#8fe0ea']].forEach(([key,y,col])=>{
      tile_(NX,y,NW,RH,'#0b2c78');g.fillStyle=col;g.fillRect(NX+10,y+14,10,RH-28);
      let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);g.font='bold '+(nm.length>4?42:52)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillStyle='#fffdf2';g.fillText(nm,NX+30,y+RH/2+2);
      for(let i=0;i<9;i++){const n=s.first+i,x=IX+i*IW;tile_(x,y,IW,RH,'#f7f2e3');if(!s.played(key,n))continue;const v=(s.lineScore[key]||[])[n-1];txt(v==null?'0':String(v),x+IW/2,y+RH/2,62,s.current(key,n)?'#E30A17':'#0a2562');}
      [[s.score[key],66,'#f2c94c','#0a2562'],[s.hits[key],60,'#f7f2e3','#0a2562'],[s.errors[key],60,'#f7f2e3','#0a2562']].forEach(([v,sz,fill,tc],i)=>{tile_(RX+i*RW,y,RW,RH,fill);txt(String(v),RX+i*RW+RW/2,y+RH/2,sz,tc);});
    });
    const by=R2+RH+66;g.textBaseline='middle';
    [['B',s.balls,3,'#7ee28a'],['S',s.strikes,2,'#f2c94c'],['O',s.outs,2,'#ff6b78']].forEach(([lab,n,max,col],r)=>{
      const x0=NX+16+r*200;txt(lab,x0+14,by,46,col);
      for(let i=0;i<max;i++){const cx=x0+78+i*50,lit=i<n;g.beginPath();g.arc(cx,by,19,0,TAU);g.fillStyle=lit?col:'#0b2c78';g.fill();g.strokeStyle=lit?'#ffffff':'rgba(217,176,74,0.7)';g.lineWidth=3;g.stroke();}});
    const dx0=NX+16+3*200+40;
    [[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22,on=s.bases[i];g.save();g.translate(cx,cy);g.rotate(Math.PI/4);g.fillStyle=on?'#f2c94c':'#0b2c78';g.fillRect(-12,-12,24,24);g.strokeStyle=on?'#ffffff':'rgba(217,176,74,0.7)';g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
    g.textAlign='right';g.font='bold 34px '+FONT;g.fillStyle='#fffdf2';g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+(s.batter==null?'':s.batter)),W-60,by);
    crescentIcon(g,W/2-190,H-66,20,'#ffffff','#0b2c78');g.textAlign='center';g.font='bold 34px '+NUM;g.fillStyle='#f2c94c';g.fillText('İSTANBUL  PARK',W/2+20,H-64);
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
  const floorT=(()=>{const W=1024,H=Math.round(W*WD/L),t=newTex('xxCheerFloorTex',W,H),g=t.getContext(),r=rng(88);
    g.fillStyle='#f3eee2';g.fillRect(0,0,W,H);speck(g,W,r,6000,'rgba(255,255,255,0.12)','rgba(120,100,70,0.08)');
    g.strokeStyle='rgba(150,130,100,0.18)';g.lineWidth=2;for(let i=0;i<14;i++){g.beginPath();g.moveTo(r()*W,0);g.bezierCurveTo(r()*W,H*0.3,r()*W,H*0.7,r()*W,H);g.stroke();}   // 大理石紋
    const u=H/12;for(let i=0;i<Math.floor(W/u);i++){g.fillStyle=i%2?'#E30A17':'#ffffff';g.fillRect(i*u+4,4,u,u);g.fillRect(i*u+4,H-u-4,u,u);}                       // 上下邊：紅白方塊帶
    g.fillStyle='#d9b04a';g.fillRect(0,u+8,W,6);g.fillRect(0,H-u-14,W,6);g.strokeStyle='#d9b04a';g.lineWidth=8;g.strokeRect(10,10,W-20,H-20);
    g.fillStyle='#1c4696';star8(g,W/2,H/2,H*0.17,0);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=5;g.stroke();g.fillStyle='#18a3b4';star8(g,W/2,H/2,H*0.10,Math.PI/8);g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(W/2,H/2,H*0.035,0,TAU);g.fill();   // 中央八芒星
    ROWS.forEach(([o,drs])=>drs.forEach(dr=>{const x=(0.5+dr/L)*W,y=(o-CH.oF)/WD*H;g.fillStyle='rgba(227,10,23,0.14)';g.beginPath();g.arc(x,y,H*0.075,0,TAU);g.fill();g.strokeStyle='#E30A17';g.lineWidth=5;g.stroke();g.fillStyle='#E30A17';g.beginPath();g.arc(x,y,4,0,TAU);g.fill();}));
    t.update();return t;})();
  const bannerT=(()=>{const W=1536,H=128,t=newTex('xxCheerBannerTex',W,H),g=t.getContext();
    g.fillStyle='#E30A17';g.fillRect(0,0,W,H);g.fillStyle='#ffffff';g.fillRect(0,0,W,8);g.fillRect(0,H-8,W,8);g.fillStyle='#d9b04a';g.fillRect(0,8,W,3);g.fillRect(0,H-11,W,3);
    [70,W/2,W-70].forEach(x=>crescentIcon(g,x-16,H/2,26,'#ffffff','#E30A17'));
    g.font='bold 58px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffffff';[0.27,0.73].forEach(f=>g.fillText('TÜRKİYE CHEERS',W*f,H/2+3));
    t.update();return t;})();
  const flagT=(()=>{const W=384,H=256,t=newTex('xxCheerFlagTex',W,H),g=t.getContext();drawTurkishFlag(g,W,H);t.update();return t;})();
  const floorMat=tm(floorT,1),bannerMat=tm(bannerT,1),flagMat=tm(flagT,1),deckMat=candy('#e9e3d2',0.5),railMat=candy('#d9b04a',0.7),ledMat=M('#5fe0ee',{em:'#5fe0ee'}),lampMat=M('#ffffff',{em:'#ffffff'});
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
      const fp=P(r+(r<RC?1.25:-1.25),22.8);put(MB.CreatePlane('xxCheerFlag',{width:2.4,height:1.6,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),fp.x,CH.top+4.9,fp.z,flagMat).rotation.y=ang+Math.PI;}
    ROWS.forEach(([o,drs],row)=>drs.forEach(dr=>{const p=P(RC+dr,o);cheerSlots.push({side:s,row,x:p.x,y:CH.top,z:p.z,ry:-s*Math.PI/4});}));
    cheerZones.push({side:s,center:{x:c.x,z:c.z},y:CH.top,length:L,depth:WD,slots:ROWS.reduce((n,[,d])=>n+d.length,0)});
  });
  const reg=(window.BaseballStadiums||{}).istanbul;if(reg){reg.cheerSlots=cheerSlots;reg.cheerZones=cheerZones;}
}

// ═════════ ⑨ 球場外：伊斯坦堡 ═════════
// 看台外圍的環形廣場 → 外圍的山丘城市（彩色木屋、清真寺、加拉達塔）→ 北邊的博斯普魯斯海峽（懸索大橋、渡輪、貨輪）→ 對岸的山丘城市。
// 全部是純外觀（沒有外牆，球飛出看台就是全壘打）。
const GY=0.08,SEA_Y=0.12;
const ZS=500;   // 海峽（連同大橋、船、對岸城市）整體往球場平移的距離：原本 z≈690~1180 → 現在 z≈190~680，南岸就在球場北邊約 50 m 處；下面所有「690／1180」之類的數字都是平移前的座標，用 ZS 換算
const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const ellR=(th,a,b)=>1/Math.sqrt((Math.cos(th)/a)**2+(Math.sin(th)/b)**2);
const castPoly=(poly,th)=>{const dx=Math.cos(th),dz=Math.sin(th);let best=1e9;
  for(let j=0;j<poly.length;j++){const A=poly[j],B=poly[(j+1)%poly.length],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
    const ax=A[0]-EC[0],az=A[1]-EC[1],t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6&&t<best)best=t;}return best;};
function plazaTex(){   // 8 m 一格：大理石鋪面上的八芒星鑲嵌
  const S=512,t=newTex('xxPlaza',S,S),g=t.getContext(),r=rng(54);
  g.fillStyle='#e6dcc4';g.fillRect(0,0,S,S);speck(g,S,r,8000,'rgba(255,255,255,0.08)','rgba(80,60,30,0.10)');
  const dr=S*0.17;g.fillStyle='#8fb7c4';for(const [x,y] of [[0,0],[S,0],[0,S],[S,S]]){g.beginPath();g.moveTo(x-dr,y);g.lineTo(x,y-dr);g.lineTo(x+dr,y);g.lineTo(x,y+dr);g.closePath();g.fill();}
  g.fillStyle='#cdbb94';star8(g,S/2,S/2,S*0.47,0);g.fill();g.strokeStyle='#8a7548';g.lineWidth=4;g.stroke();
  g.fillStyle='#1c4696';star8(g,S/2,S/2,S*0.28,Math.PI/8);g.fill();g.strokeStyle='#d9b04a';g.lineWidth=4;g.stroke();g.fillStyle='#18a3b4';star8(g,S/2,S/2,S*0.14,0);g.fill();g.fillStyle='#E30A17';g.beginPath();g.arc(S/2,S/2,S*0.04,0,TAU);g.fill();
  t.update();return t;}
const acc={};
const gq=(key,pts,uvf)=>{const a=acc[key]||(acc[key]={pos:[],uv:[],idx:[]}),n=a.pos.length/3;pts.forEach(([x,z])=>{a.pos.push(x,GY,z);const q=uvf(x,z);a.uv.push(q[0],q[1]);});a.idx.push(n,n+1,n+2,n,n+2,n+3);};
function annulus(key,rIn,rOut,extraPts){
  const angOf=(x,z)=>((Math.atan2(z-EC[1],x-EC[0])%TAU)+TAU)%TAU,raw=[];for(let i=0;i<360;i++)raw.push(i*TAU/360);(extraPts||[]).forEach(([x,z])=>raw.push(angOf(x,z)));
  raw.sort((a,b)=>a-b);const A=raw.filter((a,i)=>i===0||a-raw[i-1]>1e-7),PX=(t2,r)=>[EC[0]+r*Math.cos(t2),EC[1]+r*Math.sin(t2)];
  for(let i=0;i<A.length;i++){const t0=A[i],t1=i===A.length-1?A[0]+TAU:A[i+1];gq(key,[PX(t0,rIn(t0)),PX(t0,rOut(t0)),PX(t1,rOut(t1)),PX(t1,rIn(t1))],(x,z)=>[x/8,z/8]);}
}
annulus('plaza',th=>castPoly(standPoly,th),th=>ellR(th,EA-0.6,EB-0.6),standPoly);       // 看台外圍的環形廣場（鋪到橢圓邊緣）
Object.keys(acc).forEach(key=>{const a=acc[key],m=new BABYLON.Mesh('xxGround_'+key,scene),vd=new BABYLON.VertexData(),nor=[];for(let q=0;q<a.pos.length/3;q++)nor.push(0,1,0);
  vd.positions=a.pos;vd.normals=nor;vd.uvs=a.uv;vd.indices=a.idx;vd.applyToMesh(m);m.material=tm(plazaTex(),1);m.isPickable=false;});

// ── 山丘地形：外牆外緣一圈 30 m 平台（石板），再往外慢慢隆起成起伏的山丘城市；北邊(z≈190~680，已用 ZS 平移)是海峽，對岸(z>680)是山丘
const rhoT=th=>ellR(th,EA+1.4,EB+1.4);
const land=z=>{z+=ZS;return z<700?1-sst(560,690,z):(z>1180?sst(1180,1270,z):0);};   // 近岸(球場這一側)的山丘在海峽前漸漸變平；遠岸才隆起
function hAt(x,z){
  const dx=x-EC[0],dz=z-EC[1],D=Math.hypot(dx,dz)-rhoT(Math.atan2(dz,dx));if(D<=0)return GY;
  const n=0.5*Math.sin(x*0.011+1.3)*Math.sin(z*0.013+0.4)+0.3*Math.sin(x*0.027+z*0.021+2.1)+0.2*Math.sin(z*0.043-x*0.037+0.7),sh=Math.pow(Math.max(0,0.5+0.58*n),1.2);
  return GY+sst(36,240,D)*(8+52*sst(80,620,D))*sh*land(z);
}
const distOut=(x,z)=>{const dx=x-EC[0],dz=z-EC[1];return Math.hypot(dx,dz)-rhoT(Math.atan2(dz,dx));};
// 大橋引橋參數：橋面頂 61.2 m，兩端各接一段高架引橋，以 8% 坡度往下，一直到撞上山坡（zpN／zpF）進隧道口
const BRG={Bx:-230,g:0.08,yTop:61.2,zN:690-ZS-20,zF:1180-ZS+20};
BRG.roadY=z=>BRG.yTop-BRG.g*(z<BRG.zN?BRG.zN-z:(z>BRG.zF?z-BRG.zF:0));
const slopeAt=(x,z)=>{const e=3;return Math.hypot(hAt(x+e,z)-hAt(x-e,z),hAt(x,z+e)-hAt(x,z-e))/(2*e);};
{let z=BRG.zN;for(;z>-900;z-=2)if(BRG.roadY(z)-1.6<=hAt(BRG.Bx,z)+0.5)break;BRG.zpN=z;z=BRG.zF;for(;z<1010;z+=2)if(BRG.roadY(z)-1.6<=hAt(BRG.Bx,z)+0.5)break;BRG.zpF=z;}   // 引橋撞上山坡的位置
{
  const NAT=240,KT=64,ROUT=1000,cityT=(()=>{const S=256,t=newTex('xxCityGround',S,S),g=t.getContext(),r=rng(404),img=g.createImageData(S,S),d=img.data;
    for(let i=0;i<S*S*4;i+=4){const k=1+(r()-0.5)*0.10;d[i]=236*k;d[i+1]=230*k;d[i+2]=214*k;d[i+3]=255;}g.putImageData(img,0,0);
    for(let n=0;n<70;n++){const x=r()*S,y=r()*S,rr=8+r()*26;tile(S,x,y,rr,(dx,dy)=>{g.fillStyle=n%2?'rgba(120,100,60,0.10)':'rgba(255,255,240,0.10)';g.beginPath();g.arc(x+dx,y+dy,rr,0,TAU);g.fill();});}
    for(let n=0;n<3500;n++){g.fillStyle=n%2?'rgba(255,255,255,0.12)':'rgba(70,55,30,0.16)';const s2=1+r()*2;g.fillRect(r()*S,r()*S,s2,s2);}
    t.update();return t;})();
  const pos=[],uv=[],idx=[],cnt=NAT*(KT+1);
  for(let i=0;i<NAT;i++){const th=i*TAU/NAT,c=Math.cos(th),sn=Math.sin(th),rho=rhoT(th);
    for(let k=0;k<=KT;k++){const r=rho+(ROUT-rho)*Math.pow(k/KT,1.7),x=EC[0]+r*c,z=EC[1]+r*sn;pos.push(x,hAt(x,z),z);uv.push(x/12,z/12);}}
  for(let i=0;i<NAT;i++)for(let k=0;k<KT;k++){const a=i*(KT+1)+k,b=((i+1)%NAT)*(KT+1)+k;idx.push(a,b,a+1,b,b+1,a+1);}
  let nor=[];BABYLON.VertexData.ComputeNormals(pos,idx,nor);let ny=0;for(let v=0;v<cnt;v++)ny+=nor[3*v+1];
  if(ny<0){for(let q=0;q<idx.length;q+=3){const t=idx[q+1];idx[q+1]=idx[q+2];idx[q+2]=t;}nor=[];BABYLON.VertexData.ComputeNormals(pos,idx,nor);}
  const sun=(()=>{const v=[0.42,0.78,-0.46],l=Math.hypot(...v);return v.map(a=>a/l);})(),col=[],mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  for(let v=0;v<cnt;v++){const x=pos[3*v],y=pos[3*v+1],z=pos[3*v+2],D=distOut(x,z),sh=0.62+0.5*Math.max(0,nor[3*v]*sun[0]+nor[3*v+1]*sun[1]+nor[3*v+2]*sun[2]);
    let c=D<32?[0.86,0.82,0.72]:mix([0.50,0.60,0.36],[0.68,0.62,0.45],0.5+0.5*Math.sin(x*0.05)*Math.sin(z*0.047));
    c=mix(c,[0.56,0.52,0.44],sst(0,80,y-GY)*0.5);if((z+ZS>640&&z+ZS<710)||(z+ZS>1160&&z+ZS<1230))c=mix(c,[0.84,0.78,0.60],0.7);
    col.push(Math.min(1,c[0]*sh),Math.min(1,c[1]*sh),Math.min(1,c[2]*sh),1);}
  const tm_=new BABYLON.Mesh('xxCityTerrain',scene),vd=new BABYLON.VertexData(),mt=M('#000000');mt.emissiveTexture=cityT;mt.disableLighting=true;mt.backFaceCulling=false;
  vd.positions=pos;vd.indices=idx;vd.normals=nor;vd.uvs=uv;vd.colors=col;vd.applyToMesh(tm_);tm_.material=mt;tm_.isPickable=false;
}
// ── 博斯普魯斯海峽：z≈190~680（平移前 690~1180），從岸邊的淺綠松石漸層到深藍，浪紋＋白色浪花
{const S=512,t=newTex('xxSeaTex',S,S),g=t.getContext(),r=rng(77);g.fillStyle='#d8e6f6';g.fillRect(0,0,S,S);speck(g,S,r,4000,'rgba(255,255,255,0.10)','rgba(0,40,100,0.08)');
 for(let L=0;L<26;L++){const y0=L*S/26+r()*6,k=2+((r()*3)|0),ph=r()*TAU,amp=3+r()*5;for(const [c,off] of [['rgba(255,255,255,0.40)',0],['rgba(0,50,120,0.22)',3]]){g.strokeStyle=c;g.lineWidth=1.6;g.beginPath();for(let x=0;x<=S;x+=4){const y=y0+off+amp*Math.sin(x/S*TAU*k+ph);x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}}
 for(let n=0;n<160;n++){const x=r()*S,y=r()*S;tile(S,x,y,6,(dx,dy)=>{g.fillStyle='rgba(255,255,255,0.7)';g.fillRect(x+dx,y+dy,2+r()*3,1.2);});}t.update();
 const sm=M('#000000');sm.emissiveTexture=t;sm.disableLighting=true;sm.backFaceCulling=false;
 const SEA_R=990,stops=[[690,[1,1,1]],[694,[0.80,0.97,0.96]],[708,[0.30,0.80,0.84]],[740,[0.12,0.56,0.76]],[800,[0.06,0.38,0.66]],[900,[0.04,0.25,0.52]],[1000,[0.04,0.25,0.52]],[1080,[0.06,0.38,0.66]],[1140,[0.12,0.56,0.76]],[1168,[0.30,0.80,0.84]],[1180,[0.80,0.97,0.96]],[1186,[1,1,1]]];
 const pos=[],uv=[],col=[],idx=[],nor=[];stops.forEach(([z,c])=>{const hw=Math.sqrt(Math.max(0,SEA_R*SEA_R-(z-ZS-EC[1])**2));[-hw,hw].forEach(x=>{pos.push(x,SEA_Y,z-ZS);uv.push(x/64,z/64);col.push(c[0],c[1],c[2],1);nor.push(0,1,0);});});   // 海面只鋪到離球場中心 990 m 以內
 for(let i=0;i<stops.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 const sea=new BABYLON.Mesh('xxStrait',scene),vd=new BABYLON.VertexData();vd.positions=pos;vd.normals=nor;vd.uvs=uv;vd.colors=col;vd.indices=idx;vd.applyToMesh(sea);sea.material=sm;sea.isPickable=false;}

// ── 小件工具與材質群組（最後依材質合併）
const rnc=rng(20261102);
const box=(arr,x,y,z,w,h,d,rot)=>{const b=MB.CreateBox('xxPart',{width:w,height:h,depth:d},scene);b.position.set(x,y,z);b.rotation.y=rot||0;arr.push(b);return b;};
const cyl=(arr,x,y,z,db,dt,h,tess)=>{const c=MB.CreateCylinder('xxPartC',{diameterBottom:db,diameterTop:dt,height:h,tessellation:tess||12},scene);c.position.set(x,y,z);arr.push(c);return c;};
const sph=(arr,x,y,z,dm,sy)=>{const s2=MB.CreateSphere('xxPartS',{diameter:dm,segments:8},scene);s2.position.set(x,y,z);if(sy)s2.scaling.y=sy;arr.push(s2);return s2;};
const rot2=(x,z,lx,lz,rot)=>[x+lx*Math.cos(rot)+lz*Math.sin(rot),z-lx*Math.sin(rot)+lz*Math.cos(rot)];
const terrainMin=(x,z,rad)=>{let m=1e9;for(const [dx,dz] of [[0,0],[rad,0],[-rad,0],[0,rad],[0,-rad],[rad*0.7,rad*0.7],[-rad*0.7,-rad*0.7],[rad*0.7,-rad*0.7],[-rad*0.7,rad*0.7]])m=Math.min(m,hAt(x+dx,z+dz));return m;};
function roofTex(){const S=256,t=newTex('xxRoofTile',S,S),g=t.getContext(),r=rng(61);g.fillStyle='#a8492a';g.fillRect(0,0,S,S);
  for(let y=0;y<S;y+=16){for(let x=((y/16)%2)*12;x<S;x+=24){const k=0.85+r()*0.3;g.fillStyle=`rgb(${Math.min(255,Math.round(184*k))},${Math.round(84*k)},${Math.round(48*k)})`;g.beginPath();g.arc(x+12,y+4,12,0,Math.PI);g.fill();g.strokeStyle='rgba(60,20,8,0.45)';g.lineWidth=1.5;g.stroke();}}
  speck(g,S,r,2500,'rgba(255,255,255,0.05)','rgba(0,0,0,0.12)');t.update();return t;}
const tileMat=tm(roofTex(),1);
function hipRoof(w,d,rh,over,x,y0,z){
  const hw=w/2+over,hd=d/2+over,rl=Math.abs(w-d)/2,alongX=w>=d;
  const E=[[-hw,0,-hd],[hw,0,-hd],[hw,0,hd],[-hw,0,hd]],Rg=rl<0.01?[[0,rh,0]]:(alongX?[[-rl,rh,0],[rl,rh,0]]:[[0,rh,-rl],[0,rh,rl]]);
  const pos=[],idx=[],uv=[];E.concat(Rg).forEach(p=>{pos.push(p[0],p[1],p[2]);uv.push(p[0]/5,p[2]/5+p[1]*0.2);});
  const near=p=>{let bi=0,bd=1e9;Rg.forEach((q,i)=>{const dd=(p[0]-q[0])**2+(p[2]-q[2])**2;if(dd<bd){bd=dd;bi=i;}});return 4+bi;};
  for(let e=0;e<4;e++){const a=e,b=(e+1)%4,pa=near(E[a]),pb=near(E[b]);if(pa===pb)idx.push(a,b,pa);else idx.push(a,b,pb,a,pb,pa);}
  const m=new BABYLON.Mesh('xxRoof',scene),vd=new BABYLON.VertexData(),nor=[];vd.positions=pos;vd.indices=idx;vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,idx,nor);vd.normals=nor;vd.applyToMesh(m);m.position.set(x,y0,z);return m;
}
// 奧斯曼木屋：6 種外牆顏色，3×3 格方窗（亮燈的窗是暖黃色）
const HOUSE_COL=['#d9a65f','#c4623f','#efe6d2','#4fa3a5','#e0a5a0','#8aa5c4'];
function houseTex(st,seed){const S=256,k=S/12,t=newTex('xxHouse'+st,S,S),g=t.getContext(),r=rng(seed);g.fillStyle=HOUSE_COL[st];g.fillRect(0,0,S,S);speck(g,S,r,5000,'rgba(255,255,255,0.08)','rgba(60,40,15,0.12)');
  for(let f=0;f<3;f++){g.fillStyle='rgba(0,0,0,0.16)';g.fillRect(0,S-f*4*k-3,S,3);for(let c=0;c<3;c++){const x=c*4*k+1.1*k,y=S-(f+1)*4*k+1.0*k,w=1.8*k,h=2.2*k,lit=r()<0.35;
    g.fillStyle='#f4f0e0';g.fillRect(x-0.15*k,y-0.15*k,w+0.3*k,h+0.3*k);g.fillStyle=lit?'#ffcf70':'#1a2438';g.fillRect(x,y,w,h);g.fillStyle='#f4f0e0';g.fillRect(x+w/2-0.05*k,y,0.1*k,h);g.fillRect(x,y+h/2-0.05*k,w,0.1*k);
    g.fillStyle='rgba(60,40,20,0.35)';g.fillRect(x-0.3*k,y+h+0.15*k,w+0.6*k,0.2*k);}}
  t.update();return t;}
const houseMats=[0,1,2,3,4,5].map(i=>tm(houseTex(i,300+i*13),1)),houseG=[[],[],[],[],[],[]],roofG=[],treeG=[],trunkG=[];
const mosqueAt=[];   // 已佔用的位置（房屋避開）
function house(x,z,w,d,fl,st){
  const ys=[hAt(x-w/2,z-d/2),hAt(x+w/2,z-d/2),hAt(x-w/2,z+d/2),hAt(x+w/2,z+d/2)],y0=Math.min(...ys)-0.2,hh=fl*3.4,top=Math.max(...ys)+hh,tot=top-y0+3,ou=((rnc()*3)|0)/3,ov=((rnc()*3)|0)/3;
  const fu=V4(ou,ov,ou+w/12,ov+tot/12),su=V4(ou,ov,ou+d/12,ov+tot/12);
  const b=MB.CreateBox('xxHouseB',{width:w,height:tot,depth:d,faceUV:[fu,fu,su,su,V4(0,0,0.02,0.02),V4(0,0,0.02,0.02)]},scene);b.position.set(x,y0-3+tot/2,z);houseG[st].push(b);
  roofG.push(hipRoof(w,d,Math.min(w,d)*0.32,0.5,x,top,z));
}
function pine(x,z,sc){const y=hAt(x,z);cyl(trunkG,x,y+3*sc,z,0.5*sc,0.4*sc,6*sc,6);sph(treeG,x,y+7.2*sc,z,7.5*sc,0.45);}
function cypress(x,z,sc){const y=hAt(x,z);const c=MB.CreateCylinder('xxCyp',{diameterBottom:2.4*sc,diameterTop:0,height:11*sc,tessellation:7},scene);c.position.set(x,y+5.5*sc,z);treeG.push(c);}
// ── 清真寺：禮拜殿＋主圓頂＋四個半圓頂＋角落小圓頂＋禮拜塔（2/4/6 根）
const mG={stone:[],drum:[],dome:[],gold:[]};
function mosque(x,z,s,rot,nMin){
  mosqueAt.push([x,z,40*s]);
  const y0=terrainMin(x,z,24*s)-0.2,P=(lx,lz)=>rot2(x,z,lx*s,lz*s,rot);let p=P(0,0);
  box(mG.stone,p[0],y0-1,p[1],46*s,4,46*s,rot);box(mG.stone,p[0],y0+1+7*s,p[1],30*s,14*s,30*s,rot);
  const top=y0+1+14*s;cyl(mG.drum,p[0],top+2.5*s,p[1],26*s,26*s,5*s,24);addDome(mG.dome,p[0],top+5*s,p[1],13*s,0.95);
  [[17,0],[-17,0],[0,17],[0,-17]].forEach(([lx,lz])=>{const q=P(lx,lz);addDome(mG.dome,q[0],top-2.5*s,q[1],9.5*s,0.85);});
  [[14,14],[-14,14],[14,-14],[-14,-14]].forEach(([lx,lz])=>{const q=P(lx,lz);cyl(mG.drum,q[0],top+1*s,q[1],8.4*s,8.4*s,2*s,12);addDome(mG.dome,q[0],top+2*s,q[1],4.2*s,0.9);});
  cyl(mG.gold,p[0],top+17.35*s+2.5*s,p[1],0.5*s,0.5*s,5*s,8);sph(mG.gold,p[0],top+17.3*s,p[1],1.6*s);
  const mp=[[23,-23],[-23,-23],[23,23],[-23,23],[23,0],[-23,0]];for(let k=0;k<nMin;k++){const q=P(mp[k][0],mp[k][1]);minaret(q[0],q[1],s*0.5,y0+1);}
}
[[-130,820,1.4,0,6],[150,880,1.5,0.4,4],[-20,960,1.7,0.2,4],[330,790,1.1,0.8,2],[-360,770,1.2,-0.5,2],[430,90,1.0,0.3,2],[-440,-40,1.0,1.1,2],[270,-300,1.1,0.2,4],[-360,-330,1.1,0.9,2],[-200,900,1.2,0,4],[260,850,1.0,0,2]].forEach(m=>mosque(...m));
// 加拉達塔：石造圓塔＋陽台＋錐形尖頂
{const gx=-80,gz=790,y0=terrainMin(gx,gz,9)-0.2;mosqueAt.push([gx,gz,30]);
 cyl(mG.stone,gx,y0+18,gz,19,17,36,24);cyl(mG.stone,gx,y0+39,gz,19,19,6,24);cyl(mG.drum,gx,y0+42.4,gz,23,23,1,24);
 const tr=MB.CreateTorus('xxGalataRail',{diameter:22.4,thickness:0.4,tessellation:28},scene);tr.position.set(gx,y0+43.6,gz);mG.drum.push(tr);
 cyl(mG.stone,gx,y0+47.5,gz,14,14,8,24);const cap=MB.CreateCylinder('xxGalataCap',{diameterBottom:16,diameterTop:0,height:16,tessellation:24},scene);cap.position.set(gx,y0+59.5,gz);mG.dome.push(cap);cyl(mG.gold,gx,y0+69,gz,0.4,0.4,4,8);}
// 少女塔（海峽中的小島）
{const sx=150,sz=935-ZS;cyl(mG.stone,sx,0.6,sz,34,30,1.2,20);box(mG.stone,sx,8,sz,8,14,8,0);cyl(mG.drum,sx,15.6,sz,10,10,1.4,16);addDome(mG.dome,sx,16.3,sz,4.6,0.9);cyl(mG.gold,sx,23,sz,0.3,0.3,3,6);}
// ── 房屋與樹：以約 22 m 的格子鋪滿山丘（遠岸用 40 m 格）
function placeCells(x0,x1,z0,z1,step,dens){
  for(let x=x0;x<x1;x+=step)for(let z=z0;z<z1;z+=step){
    const px=x+(rnc()-0.5)*step*0.5,pz=z+(rnc()-0.5)*step*0.5;if(distOut(px,pz)<34||land(pz)<0.2)continue;
    if(Math.hypot(px-EC[0],pz-EC[1])>985)continue;   // 離球場中心超過 1 km 的地方不放東西
    {const dB=Math.abs(px-BRG.Bx);if(dB<34&&((pz<BRG.zN+10&&pz>BRG.zpN-8)||(pz>BRG.zF-10&&pz<BRG.zpF+8)))continue;}   // 大橋引橋底下的房子／樹拆掉
    if(mosqueAt.some(m=>Math.hypot(px-m[0],pz-m[1])<m[2]))continue;if(slopeAt(px,pz)>0.55)continue;
    const dist=Math.hypot(px-EC[0],pz-EC[1]);if(rnc()>dens-dist*0.00035)continue;
    if(rnc()<0.16){(rnc()<0.5?pine:cypress)(px,pz,0.9+rnc()*0.5);continue;}
    const w=Math.round(8+rnc()*(step*0.4)),d=Math.round(8+rnc()*(step*0.4)),fl=2+((rnc()*rnc()*3.2)|0);house(px,pz,w,d,fl,(rnc()*6)|0);
  }
}
placeCells(-800,800,-440,690-ZS+20,22,0.78);placeCells(-760,760,1190-ZS,1440-ZS,40,0.7);

// ── 博斯普魯斯大橋（白色懸索橋）：橋面、兩座橋塔、主纜、吊索；兩端各接一段高架引橋（8% 坡度、每 40 m 一組橋墩），
//    一路往下，直到撞上山坡，在山坡上開隧道口（白色擋土牆＋黑色洞口），道路就這樣接到陸地上；引橋底下的房子已拆除。
{const Bx=BRG.Bx,z0=690-ZS,z1=1180-ZS,deckY=60,tz=[780-ZS,1090-ZS],towerH=104,bm=[],cm=[],dm=[],pm=[],am=[],lm=[],um=[],
  white=candy('#f4f6f8',0.8),asph=candy('#2b2e33',0.35),laneM=candy('#f2d24a',0.8),darkM=candy('#08090c',0.05);
 const tbox=(arr,x,y,z,w,h,d,rx)=>{const b=MB.CreateBox('xxPart',{width:w,height:h,depth:d},scene);b.position.set(x,y,z);if(rx)b.rotation.x=rx;arr.push(b);return b;};
 // 主橋面（白色）＋柏油路面＋護欄＋中央黃色虛線
 box(dm,Bx,deckY,(z0+z1)/2,26,2.4,z1-z0+40,0);box(am,Bx,deckY+1.26,(z0+z1)/2,22,0.12,z1-z0+40,0);
 for(const sx of[-1,1])box(dm,Bx+sx*12.7,deckY+1.8,(z0+z1)/2,0.5,1.2,z1-z0+40,0);
 for(let z=z0-12;z<=z1+12;z+=14)box(lm,Bx,deckY+1.34,z,0.35,0.05,6,0);
 for(const z of tz){for(const sx of[-1,1])box(bm,Bx+sx*14,towerH/2,z,4.2,towerH,4.2,0);for(const y of[deckY+12,towerH-10,towerH-2])box(bm,Bx,y,z,32,2.6,3.6,0);}
 const cableY=z=>{if(z<=tz[0]){const t=(tz[0]-z)/(tz[0]-z0);return towerH-2-(towerH-2-(deckY+2))*t*t;}if(z>=tz[1]){const t=(z-tz[1])/(z1-tz[1]);return towerH-2-(towerH-2-(deckY+2))*t*t;}
   const zm=(tz[0]+tz[1])/2,hw=(tz[1]-tz[0])/2,t=(z-zm)/hw;return deckY+10+(towerH-2-deckY-10)*t*t;};
 for(const sx of[-1,1]){let pz=z0,py=cableY(z0);for(let z=z0+12;z<=z1+0.1;z+=12){const y=cableY(z),len=Math.hypot(12,y-py),b=MB.CreateBox('xxCable',{width:0.8,height:0.8,depth:len},scene);b.position.set(Bx+sx*13,(py+y)/2,(pz+z)/2);b.rotation.x=-Math.atan2(y-py,12);cm.push(b);
   if(Math.abs(z-tz[0])>6&&Math.abs(z-tz[1])>6)box(cm,Bx+sx*13,(y+deckY+1.2)/2,z,0.3,y-deckY-1.2,0.3,0);pz=z;py=y;}}
 // 兩端的引橋：dirS＝-1 往球場那一側（−z）、+1 往對岸（+z）；zStart＝橋面端點、zp＝撞上山坡的位置
 const rxA=Math.atan(BRG.g);
 for(const [zStart,zp,dirS] of [[BRG.zN,BRG.zpN,-1],[BRG.zF,BRG.zpF,1]]){
   const rx=dirS<0?-rxA:rxA;   // 往 −z 走是往下，也就是 y 隨 z 增加，rotation.x 為負（和主纜同一個約定）
   for(let a=zStart,k=0;dirS<0?a>zp:a<zp;a+=dirS*20,k++){
     const b=dirS<0?Math.max(a-20,zp):Math.min(a+20,zp),zc=(a+b)/2,len=Math.abs(b-a)+0.4,ry=BRG.roadY(zc);
     tbox(dm,Bx,ry-0.8,zc,26,1.6,len,rx);tbox(am,Bx,ry+0.06,zc,22,0.12,len,rx);for(const sx of[-1,1])tbox(dm,Bx+sx*12.7,ry+0.6,zc,0.5,1.2,len,rx);
     if(k%2===0)tbox(lm,Bx,ry+0.14,zc,0.35,0.05,8,rx);}
   for(let z=zStart+dirS*40;dirS<0?z>zp+6:z<zp-6;z+=dirS*40){                       // 橋墩：兩根方柱＋橫梁，落在地面（或山坡）上
     const bot=BRG.roadY(z)-1.6,gy=Math.min(hAt(Bx-8,z),hAt(Bx+8,z)),h=bot-gy;if(h<1.5)continue;
     for(const sx of[-1,1])box(pm,Bx+sx*8,gy+(h+1)/2-0.5,z,3,h+1,3,0);box(pm,Bx,bot-0.9,z,22,1.8,3.6,0);}
   // 隧道口：大面白色擋土牆（嵌進山坡）、兩根門柱＋門楣、黑色洞口
   const yR=BRG.roadY(zp),zf=zp,zb=zp+dirS*4;
   box(pm,Bx,(yR+16)/2-5,zb,64,yR+26,8,0);
   for(const sx of[-1,1])box(pm,Bx+sx*12.5,yR+5.6,zf-dirS*0.4,3,11.2,1.2,0);box(pm,Bx,yR+11.6,zf-dirS*0.4,28,2.6,1.2,0);
   box(um,Bx,yR+5.2,zf-dirS*0.25,22,10.2,0.3,0);box(am,Bx,yR+0.09,zf-dirS*8,22,0.12,16,0);}
 merge(bm,white,'xxBridgeTowers');merge(cm,white,'xxBridgeCables');merge(dm,white,'xxBridgeDeck');merge(pm,white,'xxBridgePiers');merge(am,asph,'xxBridgeAsphalt');merge(lm,laneM,'xxBridgeLanes');merge(um,darkM,'xxTunnelMouths');}

// ── 海峽裡的船：貨輪、油輪、渡輪、帆船、漁船
const shipG={},sMat={};const sm_=(h,k)=>sMat[h]||(sMat[h]=candy(h,k==null?0.35:k));
const addShip=(hex,mesh,k)=>{(shipG[hex]||(shipG[hex]={mat:sm_(hex,k),arr:[]})).arr.push(mesh);};
function hullMesh(L,W,H,bowL){
  const top=[[-L/2,-W/2],[-L/2,W/2],[L/2-bowL,W/2],[L/2,0],[L/2-bowL,-W/2]],bot=[[-L/2+L*0.04,-W*0.3],[-L/2+L*0.04,W*0.3],[L/2-bowL,W*0.3],[L/2-L*0.01,0],[L/2-bowL,-W*0.3]],pos=[],idx=[];
  top.forEach(([x,z])=>pos.push(x,H,z));bot.forEach(([x,z])=>pos.push(x,0,z));pos.push(0,H,0,0,0,0);const n=5,cT=2*n,cB=2*n+1;
  for(let i=0;i<n;i++){const j=(i+1)%n;idx.push(cT,i,j);idx.push(cB,n+j,n+i);idx.push(i,n+i,n+j,i,n+j,j);}
  const m=new BABYLON.Mesh('xxHull',scene),vd=new BABYLON.VertexData(),nor=[];vd.positions=pos;vd.indices=idx;BABYLON.VertexData.ComputeNormals(pos,idx,nor);vd.normals=nor;vd.uvs=new Array(pos.length/3*2).fill(0);vd.applyToMesh(m);return m;
}
function ship(type,x,z,dir,sc){
  const yaw=dir<0?Math.PI:0,c=Math.cos(yaw),s=Math.sin(yaw);sc=sc||1;
  const put_=(m,lx,ly,lz,hex,k)=>{m.position.set(x+lx*c+lz*s,0.1+ly,z-lx*s+lz*c);m.rotation.y=yaw;addShip(hex,m,k);return m;};
  const part=(lx,ly,lz,w,h,d,hex,k)=>put_(MB.CreateBox('xxShipB',{width:w*sc,height:h*sc,depth:d*sc},scene),lx*sc,(ly+h/2)*sc,lz*sc,hex,k);
  const hull=(L,Wd,H,bow,hex,k)=>put_(hullMesh(L*sc,Wd*sc,H*sc,bow*sc),0,0,0,hex,k);
  if(type==='cargo'){hull(190,28,14,28,'#10285a');part(0,14,0,158,1,26,'#c7d3ea',0.3);part(-80,15,0,22,26,22,'#f1f5ff',0.5);part(-80,41,0,12,6,16,'#f1f5ff',0.5);part(-86,47,0,3,10,3,'#E30A17',0.8);
    const cc=['#e8503a','#2b6fd6','#f2b632','#2fa36b','#d8dde8','#8a3fd0'],rr=rng((x*7+z)|0);for(let b=0;b<9;b++)for(let r2=-2;r2<=2;r2++){const hgt=1+((rr()*4)|0);for(let q=0;q<hgt;q++)part(-52+b*13.5,15+q*5.2,r2*5.3,12.4,5,5,cc[(rr()*cc.length)|0],0.45);}}
  else if(type==='tanker'){hull(230,38,15,34,'#0a1f4d');part(0,15,0,196,1.5,36,'#a53a2e',0.4);part(-96,16.5,0,24,30,30,'#f1f5ff',0.5);part(-96,46,0,14,6,18,'#f1f5ff',0.5);for(let i=0;i<7;i++)part(-60+i*26,16.5,0,12,3,3,'#8a96b0',0.3);part(-103,52,0,4,12,4,'#ffd23a',0.8);}
  else if(type==='ferry'){hull(52,12,5,8,'#f4f0e0');part(-2,5,0,40,5,10,'#f4f0e0',0.5);part(-2,10,0,30,4,9,'#f4f0e0',0.5);part(-2,14,0,16,4,8,'#cfe0ff',0.5);part(-2,5.9,0,40.2,1.0,10.2,'#E30A17',0.7);part(-2,10.8,0,30.2,1.0,9.2,'#E30A17',0.7);part(-8,18,0,3,6,3,'#111111',0.8);part(-1,18,0,3,6,3,'#E30A17',0.8);}
  else if(type==='sail'){hull(11,3.2,1.3,2.2,'#f4f0e0');part(0,1.3,0,5,1.2,2.2,'#d6e4ff',0.4);const mast=MB.CreateCylinder('xxMast',{diameter:0.18*sc,height:13*sc,tessellation:6},scene);put_(mast,0.5*sc,6.8*sc,0,'#b9c6e6',0.4);
    for(const [dx2,hh,colr] of [[0.3,11.6,'#ffffff'],[2.4,7.0,'#ffd0c8']]){const tri=new BABYLON.Mesh('xxSail',scene),vd=new BABYLON.VertexData();vd.positions=[0,1.6,0,0,hh,0,-4.4,1.6,0];vd.indices=[0,1,2,0,2,1];vd.normals=[0,0,1,0,0,1,0,0,1];vd.uvs=[0,0,0,1,1,0];vd.applyToMesh(tri);tri.scaling.set(sc,sc,sc);put_(tri,dx2*sc,0,0,colr,0.7);}}
  else if(type==='fish'){hull(14,4,1.8,3,'#143a82');part(-2,1.8,0,5,2.6,3,'#f4f0e0',0.5);part(-3,4.4,0,1,3,1,'#ffb000',0.9);part(2.5,3.2,0,0.5,0.5,0.5,'#ffffaa',1);}
}
[['ferry',-60,760,1,1.1],['ferry',320,800,-1,1.1],['ferry',-420,860,1,1],['ferry',120,1010,-1,1],['cargo',-120,960,1,1],['cargo',480,1090,-1,1.1],['tanker',-560,1100,1,1],['tanker',640,870,-1,1],
 ['sail',20,730,1,1.2],['sail',-180,790,-1,1],['sail',240,740,1,1.1],['sail',380,950,1,1],['sail',-340,1030,-1,0.9],['fish',-20,720,1,1],['fish',200,830,1,1],['fish',-300,740,-1,1],['fish',60,1140,1,1]].forEach(a=>ship(a[0],a[1],a[2]-ZS,a[3],a[4]));

// ── 打擊區看得到的土耳其國旗：記分板左右對稱各一面。旗面 24×16 m（2:3）、最高點 42 m、旗桿 46 m，每幀擺動並有明暗皺褶
{
  const FWm=24,FHm=16,NXf=44,NYf=24,hz=182,yb=26,sc=FWm/66,pm=candy('#e0b94e',0.8);   // 旗面底緣 26 m、頂緣 42 m；兩面旗離本壘 182 m、就立在海峽南岸邊（岸線在 z≈190）、左右各在 x=±36~60 m（記分板兩側）
  const ft=newTex('xxGiantFlagTex',1536,1024),fg=ft.getContext();drawTurkishFlag(fg,1536,1024);ft.update();
  const fm=M('#000000');fm.emissiveTexture=ft;fm.disableLighting=true;fm.backFaceCulling=false;
  [-60,36].forEach((hx,side)=>{   // hx＝旗桿所在 x（旗面從旗桿往右展開）：左旗 -60~-36，右旗 36~60，對稱於 x=0
    const pos0=[],uv=[],idx=[],col=[],nor=[];
    for(let j=0;j<=NYf;j++)for(let i=0;i<=NXf;i++){const u=i/NXf,v=j/NYf;pos0.push(hx+u*FWm,yb+(1-v)*FHm,hz);uv.push(u,1-v);col.push(1,1,1,1);nor.push(0,0,-1);}
    for(let j=0;j<NYf;j++)for(let i=0;i<NXf;i++){const a=j*(NXf+1)+i;idx.push(a,a+1,a+NXf+1,a+1,a+NXf+2,a+NXf+1);}
    const flag=new BABYLON.Mesh('xxGiantFlag'+side,scene),vd=new BABYLON.VertexData();vd.positions=pos0.slice();vd.indices=idx;vd.uvs=uv;vd.normals=nor;vd.colors=col;vd.applyToMesh(flag,true);
    flag.material=fm;flag.alwaysSelectAsActiveMesh=true;flag.isPickable=false;
    put(MB.CreateCylinder('xxFlagPole',{diameter:0.9,height:46,tessellation:14},scene),hx-0.5,23,hz,pm);put(MB.CreateSphere('xxFlagPoleTop',{diameter:2.0,segments:10},scene),hx-0.5,46.8,hz,pm);
    const cur=pos0.slice(),colA=col.slice(),t0=Date.now();
    const obs=scene.onBeforeRenderObservable.add(()=>{
      if(flag.isDisposed()){scene.onBeforeRenderObservable.remove(obs);return;}   // 換球場時自動移除
      const t=(Date.now()-t0)/1000;
      for(let j=0;j<=NYf;j++)for(let i=0;i<=NXf;i++){const u=i/NXf,v=j/NYf,k=(j*(NXf+1)+i),amp=sc*u*(1.2+4.6*u),ph=u*9.0-t*3.0+v*1.3;
        cur[k*3]=hx+u*FWm-0.05*amp*amp/sc*(0.5+0.5*Math.sin(ph));cur[k*3+1]=yb+(1-v)*FHm-1.4*sc*u*u-0.18*amp*Math.cos(ph);cur[k*3+2]=hz+amp*Math.sin(ph)+0.3*amp*Math.sin(u*17-t*5+v*2.1);
        const sh=0.84+0.16*Math.cos(ph-0.5)*Math.min(1,u*4);colA[k*4]=colA[k*4+1]=colA[k*4+2]=sh;}
      flag.updateVerticesData(BABYLON.VertexBuffer.PositionKind,cur);flag.updateVerticesData(BABYLON.VertexBuffer.ColorKind,colA);
    });
  });
}
// ── 合併
houseG.forEach((arr,i)=>merge(arr,houseMats[i],'xxHouses'+i));merge(roofG,tileMat,'xxHouseRoofs');merge(treeG,candy('#2f5a2a',0.5),'xxTreeLeaves');merge(trunkG,candy('#5a3a22',0.4),'xxTreeTrunks');
merge(mG.stone,candy('#eee6d2',0.55),'xxMosqueStone');merge(mG.drum,candy('#d8cfb4',0.5),'xxMosqueDrums');merge(mG.dome,candy('#8c9eaa',0.5),'xxMosqueDomes');merge(mG.gold,goldM,'xxMosqueGold');
merge(minG.shaft,minMat,'xxMinaretShafts');merge(minG.stone,minStoneM,'xxMinaretStone');merge(minG.deck,minDeckM,'xxMinaretDecks');merge(minG.cap,minCapM,'xxMinaretCaps');merge(minG.gold,goldM,'xxMinaretGold');
Object.values(shipG).forEach(o=>merge(o.arr,o.mat,'xxShips'));

// ═════════ ⑩ 全壘打規則 ═════════
ctx.setRules({fenceR:R,fenceH:WALL_H,arcDeg:45,simLimit:175,fenceAt});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).istanbul={id:'istanbul',name:'伊斯坦堡清真寺球場',build:build};
})();