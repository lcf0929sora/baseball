/*
 * ═══════════════════ 球場外掛開發指南（給人或 LLM：不需要看主程式 HTML，讀這份就能寫新球場）═══════════════════
 *
 * 【運作方式】
 *  1. 球場 JS 放在 ./baseball/（與 hair／face 外掛同一個資料夾），並在 ./baseball/stadiums.js 的
 *     window.BaseballStadiumList 加一筆 {id,name,file}。賽前選完兩隊後，玩家從清單選球場。
 *  2. 球場 JS 載入後必須註冊： (window.BaseballStadiums=window.BaseballStadiums||{})[id]={id,name,build};
 *     id 要與清單中的 id 相同。build(ctx) 必須「同步」執行完畢（不可 setTimeout／fetch／async）。
 *  3. 換球場時，主程式會自動清掉上一個球場在 build() 期間建立的所有 mesh／material／texture，
 *     所以：只在 build() 內建立物件、不要把物件存到全域、不需要自己 dispose。
 *  4. build() 丟出例外時，主程式會改用內建的簡陋預設球場，不會當機。
 *  5. 沒有任何球場 JS 時，主程式使用內建預設球場（一片綠地＋圓形圍牆）。
 *
 * 【座標與單位】Babylon.js（左手座標，y 向上），1 單位＝1 公尺。
 *  本壘板在原點(0,0,0)；+z＝中外野方向；+x＝右外野／一壘側；-x＝左外野／三壘側。
 *  界外線沿 45°：右線方向 (1,0,1)/√2，左線方向 (-1,0,1)/√2。
 *  一壘(19.4,19.4)、二壘(0,38.8)、三壘(-19.4,19.4)、投手板 z=18.44。內野土區是以 (0,17) 為圓心、半徑 27 的圓。
 *  預設守備站位：中外野 (0,93)、左／右外野 (∓40,78.4)；防守視角攝影機在 (0,12,95) 往本壘看，
 *  所以中外野牆必須在 z≈100 以外，左右外野牆必須在半徑約 92 m 以外。
 *  打擊視角攝影機在 (0,2.35,-6.8)，本壘後方的擋球牆要在它後面（建議 z≤-18）。
 *
 * 【主程式已提供，球場 JS 不要再建】
 *  壘包、本壘板、投手丘、投手板、壘線、內野土區與內野草皮菱形（球場 JS 只能用 ctx.setFieldMats 換它們的材質）、
 *  天空／霧／天氣／光源／陰影／攝影機（天空顏色由系統天氣設定決定，球場 JS 絕對不要設定 scene.clearColor、fog、skyDome、光源）。
 *
 * 【球場 JS 負責】外野草地(ground)、外野牆(全壘打牆)、界外牆、擋球牆、看台、記分板、照明塔、球員休息區、
 *  封閉的球員休息室(選用)，以及全壘打判定範圍(setRules)。
 *
 * 【ctx 提供的東西（build(ctx) 的參數）】
 *  工具：BABYLON、scene、MB(=BABYLON.MeshBuilder)、V(x,y,z)=Vector3、C(r,g,b)=Color3(0~1)。
 *   M(hex,{em:'#hex',alpha:0~1})  建立 StandardMaterial（無鏡面反光；em=自發光色）。
 *   put(mesh,x,y,z,mat)           設定位置與材質並回傳 mesh（materials 可傳 null）。
 *   texMat(texture,tint=1)        以貼圖建立不受反光影響的材質；tint 為亮度倍率。
 *   worldPoly(name,[[x,z],...],y,mat,T)  建立貼在地面的多邊形，貼圖以世界座標每 T 公尺重複一次。
 *   circlePts(cx,cz,r)            圓形多邊形點列。
 *   lpt(side,r,o)                 回傳 Vector3：side=-1(三壘側)／1(一壘側)，沿該側界外線 r 公尺處，往界外側垂直偏移 o 公尺。
 *   GRASS_TILE(=32)、DIRT_TILE(=10)  共用內野草皮／土區的貼圖重複大小(公尺)；setFieldMats 的貼圖請以此尺寸設計。
 *  建立與登錄：
 *   apiVersion                   主程式的外掛介面版本（2＝支援 infield:false、setRules.fenceAt、setScoreboardRenderer）；舊版沒有此欄位。
 *   makeGround(mat,T=32)          建立名為 ground 的 420×420 m 大地面（x:-210~210, z:-150~270）。必須呼叫一次。
 *   setFieldMats({infield,dirt,home,mound})  替共用的內野草皮／內野土區／本壘土區／投手丘換材質（可只給部分）。
 *        infield:false＝隱藏內野草皮菱形，整個內野(以(0,17)為圓心、半徑 27 m 的 dirt 土區)都是土，沒有草坪。
 *   setRules({fenceR,fenceH,arcDeg,simLimit,fenceAt})  全壘打判定：
 *        fenceR  牆的半徑(m，圓形牆用)；fenceAt(角度°)→牆的距離(m)，非圓形牆用（優先於 fenceR）。
 *                角度＝從中外野正方向起算，右為正、左為負；回傳「從本壘板沿該方向到牆的距離」。必須與實體牆位置一致。
 *        fenceH  牆的最高點高度(m)。球心高於 fenceH+球半徑 越過牆線才算全壘打；較低則撞牆反彈。
 *        arcDeg  左右各幾度內才算外野牆（填 45＝只有界內；界外球本來就不算全壘打）。
 *        simLimit 球模擬的最遠距離(m)，需大於看台最外緣。
 *   registerFenceCollider(mesh,isOutfield)  人與球都會撞到的牆。isOutfield=true 表示是全壘打牆本體（球撞上會被記為撞牆）。
 *   registerBallSolid(mesh,kind)   只有球會撞的實體（看台、記分板、屋頂…）。kind：
 *        'spectator' 看台（球打到＝進觀眾席）、'scoreboard' 記分板、省略＝一般實體。
 *      碰撞用的 mesh 可 isVisible=false 做成看不見的方盒（碰撞以方盒的旋轉外框 OBB 計算，細長的牆用一個長方盒就好）。
 *      註冊的碰撞物件請控制在幾十個內（球每個物理步都要逐一檢查）。
 *   setDugouts({E,T,gate,seat})  球員休息區（side：-1＝三壘側／我方先攻，1＝一壘側），全部回傳地面座標 {x,z}：
 *        E(side)            休息區入口外側（跑者／換場球員先走到這裡）
 *        T(side)            休息區內（長椅前）
 *        gate(side,j,inside) 前緣矮牆缺口：j＝沿界外線的橫向位移(m，約 ±1)，inside=true 取內側點、false 取外側點
 *        seat(side,i)       第 i 名候補球員的站／坐位置，回傳 {x,y,z,ry,scale}（y＝高度，ry＝面向(弧度)，scale＝[sx,sy,sz]或null）
 *      未呼叫時使用內建簡易站位。
 *   setLocker({camPos,camTarget,seat})  封閉球員休息室（選用）：建在球場外（x 必須 >200），camPos/camTarget 為切換到休息室視角的
 *        攝影機位置／注視點 [x,y,z]；seat(player)→{x,y,z,s}，player.team 為 'RED'|'BLUE'，player.index 為 0 起算序號。
 *        不呼叫＝此球場沒有休息室，選單會隱藏「休息室視角」。
 *   setScoreboardRenderer(fn)  自訂記分板畫法（選用）。先用 sbTexInit(寬,高) 取得 DynamicTexture（預設 1536×512，
 *        請貼在你自己的 mesh 上當 emissiveTexture），再註冊 fn(g,s,W,H)：g＝2D canvas context、W/H＝貼圖尺寸；
 *        每當比賽狀態改變時主程式就呼叫一次，fn 內請重畫整張圖。s 的欄位：
 *          s.inn 目前局數；s.batTeam 'me'(紅/玩家)|'cpu'(藍) 現在是哪一隊打擊；s.gameOver 比賽結束；
 *          s.balls/s.strikes/s.outs；s.bases=[一壘,二壘,三壘] 布林；s.batter 打者字串；
 *          s.score/s.hits/s.errors：{me,cpu}；s.lineScore：{me:[每局得分…],cpu:[…]}；s.names：{me,cpu} 隊名；
 *          s.innings(=9)、s.first(目前畫面第一欄的局數，延長賽會往後移)；
 *          s.played(key,n) 第 n 局該隊是否已打過；s.current(key,n) 是否正在打。
 *        不呼叫＝不要記分板，或呼叫 sbTexInit() 不帶 renderer 使用內建電子記分板。
 *
 * 【不要使用的 mesh 名稱】主程式依名稱判斷特殊物件：'stand','standback','standend','sb','wing','homewall',
 *  'foul-side-wall'(舊版會被自動當成球碰撞實體)、'base','plate','rubber','ground'(只能由 makeGround 建立)、
 *  'infield','d'、'skyDome'、'scoreboardTex'。請用自己的前綴（例如 'xxWall'），要碰撞就自己 register。
 *
 * 【全壘打牆／規則】牆建議以 registerFenceCollider(mesh,true) 登錄；fenceAt/fenceR 與牆的位置要吻合。
 *  棒球規則(OBR 2.01)：本壘板到界內最近的牆或障礙物須 ≥250 呎(76.2 m)，建議兩翼 ≥320 呎(97.5 m)、中外野 ≥400 呎(122 m)。
 *
 * 【貼圖】請用 DynamicTexture 程式繪製（不要引用外部圖片，檔案才小）；貼圖要能無縫重複(tile)。
 *  自己建立的材質建議 backFaceCulling=false（M()／texMat 中 texMat 已設定，M() 沒有）；發光物用 M 的 em 選項。
 *
 * 【最小可用球場範例】
 *   build(ctx){ const {M,MB,put}=ctx;
 *     ctx.makeGround(M('#2f7a3c'));
 *     const w=put(MB.CreateBox('xxWall',{width:60,height:4,depth:0.6}),0,2,100,M('#245'));
 *     ctx.registerFenceCollider(w,true);
 *     ctx.setRules({fenceR:100,fenceH:4,arcDeg:45,simLimit:130}); }
 */

/*
 * 中央球場（由原本內建的 3D 球場模型直接搬出來；圓弧外野牆、大型看台、電子記分板、斜紋草地）
 * 球場外：大都會夜景——球場獨佔一個大街廓、四周井字形馬路，外圍是亮燈的高樓大廈群（見「球場外：大都會」一節）。
 */
(function(){
'use strict';
function build(ctx){
const {BABYLON,scene,MB,M,V,C,put,texMat,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const mulberry32=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
function wrapDraw(S,fn){for(const dx of [-S,0,S])for(const dy of [-S,0,S])fn(dx,dy);}   // 靠近邊緣的圖形繞回另一側 → 無縫
function makeGrassTexture(){
 const S=512,N=6,tex=new BABYLON.DynamicTexture('grassTex',{width:S,height:S},scene,true),g=tex.getContext(),rnd=mulberry32(7);
 const img=g.createImageData(S,S),d=img.data,LIGHT=[0x45,0x98,0x52],DARK=[0x2b,0x69,0x39];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const c=(Math.floor(((x+y)%S)/(S/N))%2)?DARK:LIGHT,k=1+(rnd()-0.5)*0.16,i=(y*S+x)*4;   // 依 (x+y) 分帶＝45° 斜條紋
  d[i]=c[0]*k;d[i+1]=c[1]*k;d[i+2]=c[2]*k;d[i+3]=255;
 }
 g.putImageData(img,0,0);
 for(let n=0;n<110;n++){const x=rnd()*S,y=rnd()*S,r=18+rnd()*60,hi=rnd()<0.5;   // 大塊明暗斑：草皮生長不均
  g.fillStyle=hi?'rgba(190,255,170,0.035)':'rgba(0,30,10,0.05)';
  wrapDraw(S,(dx,dy)=>{g.beginPath();g.arc(x+dx,y+dy,r,0,6.2832);g.fill();});}
 for(let n=0;n<2200;n++){const x=rnd()*S,y=rnd()*S,l=3+rnd()*5,hi=rnd()<0.5;   // 細短草葉
  g.strokeStyle=hi?'rgba(170,230,140,0.22)':'rgba(10,50,25,0.22)';g.lineWidth=1;
  wrapDraw(S,(dx,dy)=>{if(Math.abs(dx)+Math.abs(dy)&&(x>6&&x<S-6&&y>10&&y<S-10))return;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+(rnd()-0.5)*2,y+dy-l);g.stroke();});}
 tex.wrapU=tex.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;tex.anisotropicFilteringLevel=8;tex.update();return tex;
}
function makeDirtTexture(){
 const S=512,tex=new BABYLON.DynamicTexture('dirtTex',{width:S,height:S},scene,true),g=tex.getContext(),rnd=mulberry32(21);
 const img=g.createImageData(S,S),d=img.data;
 for(let i=0;i<S*S*4;i+=4){const k=1+(rnd()-0.5)*0.2;d[i]=180*k;d[i+1]=116*k;d[i+2]=63*k;d[i+3]=255;}   // 基底 #b4743f ＋ 顆粒雜訊
 g.putImageData(img,0,0);
 for(let n=0;n<170;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*66,t=rnd();   // 乾濕、深淺斑塊
  g.fillStyle=t<0.4?'rgba(110,62,28,0.11)':t<0.8?'rgba(222,170,118,0.10)':'rgba(150,100,60,0.08)';
  wrapDraw(S,(dx,dy)=>{g.beginPath();g.arc(x+dx,y+dy,r,0,6.2832);g.fill();});}
 for(let n=0;n<70;n++){const x=rnd()*S,y=rnd()*S,l=60+rnd()*160,a=0.35+(rnd()-0.5)*0.25,hi=rnd()<0.5;   // 耙地痕跡（大致同向）
  g.strokeStyle=hi?'rgba(235,190,140,0.10)':'rgba(90,50,22,0.10)';g.lineWidth=1+rnd()*2;
  wrapDraw(S,(dx,dy)=>{g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*l,y+dy+Math.sin(a)*l);g.stroke();});}
 for(let n=0;n<1100;n++){const x=rnd()*S,y=rnd()*S,r=0.8+rnd()*1.8,hi=rnd()<0.45;   // 碎石與土粒
  g.fillStyle=hi?'rgba(232,196,150,0.55)':'rgba(84,48,24,0.5)';
  wrapDraw(S,(dx,dy)=>{if(Math.abs(dx)+Math.abs(dy)&&(x>6&&x<S-6&&y>6&&y<S-6))return;g.beginPath();g.ellipse(x+dx,y+dy,r*1.3,r,0,0,6.2832);g.fill();});}
 tex.wrapU=tex.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;tex.anisotropicFilteringLevel=8;tex.update();return tex;
}
const grassTex=makeGrassTexture(),dirtTex=makeDirtTexture();
ctx.makeGround(texMat(grassTex,1));   // 外野草地（斜條紋）
ctx.setFieldMats({infield:texMat(grassTex,1.05),dirt:texMat(dirtTex,1),home:texMat(dirtTex,0.94),mound:texMat(dirtTex,1.1)});   // 共用內野土區／草皮換上貼圖
// ---- outfield wall (105 m from home plate) and crowd stands
const FENCE_R=105,FENCE_H=4;
const FOUL_WALL_OFFSET=20; // foul-territory walls stay at least 20 m outside each foul line
const OUTFIELD_ARC_DEG=56;   // 外野牆只做到與界外牆交會處（約 56°），再往外就是轉角看台
const wallA=M('#0f4a33'),wallB=M('#123c5a'),trim=M('#ffb43a',{em:'#ffb43a'});
for(let i=0;i<40;i++){
  const th=(-OUTFIELD_ARC_DEG+i*(OUTFIELD_ARC_DEG*2)/39)*Math.PI/180,w=2*FENCE_R*Math.sin(Math.PI/180*(OUTFIELD_ARC_DEG*2)/39/2)+0.4;
  const b=put(MB.CreateBox('w',{width:w,height:FENCE_H,depth:0.6}),FENCE_R*Math.sin(th),FENCE_H/2,FENCE_R*Math.cos(th),i%2?wallA:wallB);b.rotation.y=th;registerFenceCollider(b,true);
  const t=put(MB.CreateBox('t',{width:w,height:0.16,depth:0.7}),FENCE_R*Math.sin(th),FENCE_H+0.08,FENCE_R*Math.cos(th),trim);t.rotation.y=th;registerFenceCollider(t,true);
}
// ---- foul-territory side fencing: parallel to, and 20 m outside, each foul line.
// Parameter r measures distance along the foul-line direction before the 20 m perpendicular offset.
const DUG_R=22,DUG_HALF=6,DUG_H=2.7;   // 休息室凹槽：中心在界外線上 r=22 m、寬 12 m、高 2.7 m
const SIDE_SEGMENTS=40,SIDE_H=3.2,SIDE_DEPTH=0.32;
const SIDE_R_END=Math.sqrt(FENCE_R*FENCE_R-FOUL_WALL_OFFSET*FOUL_WALL_OFFSET);
const SIDE_SEG=(SIDE_R_END)/SIDE_SEGMENTS;
const sideMat=M('#164a38'),sideTrim=M('#d6a84b');
for(const side of [-1,1]){
  const a=side*Math.PI/4;
  for(let i=0;i<SIDE_SEGMENTS;i++){
    const r=(i+0.5)*SIDE_SEG;
    if(Math.abs(r-DUG_R)<DUG_HALF)continue;   // 休息室凹槽位置不放外牆
    // Shift the whole fence 20 m perpendicular to the foul line, away from fair territory.
    const x=side*(r+FOUL_WALL_OFFSET)/Math.sqrt(2),z=(r-FOUL_WALL_OFFSET)/Math.sqrt(2);
    const b=put(MB.CreateBox('foul-side-wall',{width:SIDE_SEG+0.12,height:SIDE_H,depth:SIDE_DEPTH}),x,SIDE_H/2,z,sideMat);
    b.rotation.y=a-Math.PI/2;registerFenceCollider(b);
    const cap=put(MB.CreateBox('foul-side-cap',{width:SIDE_SEG+0.12,height:0.12,depth:SIDE_DEPTH+0.12}),x,SIDE_H+0.06,z,sideTrim);
    cap.rotation.y=a-Math.PI/2;registerFenceCollider(cap);
  }
}
// ---- 觀眾：以「一排排坐著的人」重新繪製。每個人有頭、髮／帽、肩膀與衣服，部分人舉手歡呼、部分座位空著。
//   · 看台立面（階梯的垂直面）畫人的上半身；看台踏面（水平面）畫座位與從上方看到的頭和肩。
//   · UV 依「世界公尺」換算並貼合階梯高度，每階剛好一排人，不論看台多長，人的大小都一致、不會被拉伸。
const CROWD_N=16,CROWD_PITCH=64,CROWD_TILE_W=CROWD_N*0.5333,CROWD_ROW_H=0.8,CROWD_STEP_D=1.1;
function makeCrowdTextures(){
  const rnd=mulberry32(5),pick=a=>a[Math.floor(rnd()*a.length)];
  const shirts=['#d2453a','#d2453a','#d2453a','#3f6fd0','#3f6fd0','#3f6fd0','#e9e6dc','#e9e6dc','#e9e6dc','#7d879a','#7d879a','#f0b53c','#3d9a68','#26324f','#2a2d36','#e3813a','#7a4fb0'];
  const skins=['#f1c9a5','#e8b88f','#d9a07a','#c68a5e','#a56a43','#7a4a2c'];
  const hairs=['#16120f','#16120f','#2b1d14','#5a3a1e','#8a6a3a','#c9b27a','#6b6b6b','#d8d4c8'];
  const caps=['#d2453a','#3f6fd0','#f2f2ee','#1c1f2a'];
  const W=CROWD_N*CROWD_PITCH;
  const people=[];
  for(let i=0;i<CROWD_N;i++)people.push({cx:i*CROWD_PITCH+CROWD_PITCH/2+(rnd()-0.5)*8,shirt:pick(shirts),skin:pick(skins),hair:pick(hairs),cap:rnd()<0.14?pick(caps):null,arms:rnd()<0.1,empty:rnd()<0.08,s:0.92+rnd()*0.16,dy:(rnd()-0.5)*5});
  const mk=(name,h)=>{const t=new BABYLON.DynamicTexture(name,{width:W,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
  const wrapX=(fn)=>{for(const dx of [-W,0,W])fn(dx);};
  const ell=(g,x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,6.2832);g.fill();};
  const rrect=(g,x,y,w,h,r,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();g.fill();};
  // ---- 立面：一排人的上半身（96 px ＝ 0.8 m）
  const H1=96,front=mk('crowdFront',H1),g1=front.getContext();
  {const bg=g1.createLinearGradient(0,0,0,H1);bg.addColorStop(0,'#1a2338');bg.addColorStop(1,'#0b101d');g1.fillStyle=bg;g1.fillRect(0,0,W,H1);
   people.forEach(p=>wrapX(dx=>{
     const x=p.cx+dx,s=p.s,by=p.dy;
     if(p.empty){rrect(g1,x-22,46,44,60,10,'#2a3a63');rrect(g1,x-22,46,44,8,4,'#3a4d7e');return;}
     if(p.arms){g1.lineCap='round';g1.strokeStyle=p.shirt;g1.lineWidth=10;
       [-1,1].forEach(sd=>{g1.beginPath();g1.moveTo(x+sd*22,66+by);g1.lineTo(x+sd*30,36+by);g1.stroke();ell(g1,x+sd*30,31+by,5,5.5,p.skin);});}
     rrect(g1,x-27*s,50+by,54*s,60,17,p.shirt);                          // 肩膀＋身體
     g1.fillStyle='rgba(0,0,0,.20)';g1.fillRect(x-27*s,82+by,54*s,20);   // 下緣陰影
     g1.fillStyle='rgba(255,255,255,.10)';g1.fillRect(x-27*s+4,53+by,10,12);   // 肩部亮面
     g1.fillStyle=p.skin;g1.fillRect(x-5,42+by,10,10);                    // 脖子
     ell(g1,x,33+by,12.5*s,14*s,p.skin);                                   // 頭
     if(p.cap){g1.fillStyle=p.cap;g1.beginPath();g1.ellipse(x,29+by,13*s,11*s,0,Math.PI,0);g1.fill();ell(g1,x+8,30+by,10,3,p.cap);}
     else{g1.fillStyle=p.hair;g1.beginPath();g1.ellipse(x,28+by,13*s,11*s,0,Math.PI*1.02,Math.PI*1.98);g1.fill();g1.fillRect(x-13*s,27+by,3,8);g1.fillRect(x+10*s,27+by,3,8);}
     g1.fillStyle='rgba(20,10,5,.7)';g1.fillRect(x-5,33+by,2,2.5);g1.fillRect(x+3,33+by,2,2.5);   // 眼睛
   }));
   const sh=g1.createLinearGradient(0,H1-26,0,H1);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.45)');g1.fillStyle=sh;g1.fillRect(0,H1-26,W,26);}
  front.update();
  // ---- 踏面：座位＋從上方看到的頭與肩（132 px ＝ 1.1 m）
  const H2=132,top=mk('crowdTop',H2),g2=top.getContext();
  {const bg=g2.createLinearGradient(0,0,0,H2);bg.addColorStop(0,'#2a3144');bg.addColorStop(1,'#1b2133');g2.fillStyle=bg;g2.fillRect(0,0,W,H2);
   g2.fillStyle='#10141f';g2.fillRect(0,H2-6,W,6);g2.fillStyle='#3a4156';g2.fillRect(0,0,W,3);
   people.forEach(p=>wrapX(dx=>{
     const x=p.cx+dx,s=p.s;
     rrect(g2,x-24,50,48,70,8,'#2a3a63');                                   // 座椅
     if(p.empty)return;
     ell(g2,x,84,28*s,13*s,p.shirt);                                        // 肩膀（上視）
     if(p.arms){ell(g2,x-30,66,5,9,p.skin);ell(g2,x+30,66,5,9,p.skin);}
     ell(g2,x,76,12.5*s,12*s,p.cap||p.hair);                                // 頭頂（髮或帽）
     if(p.cap)ell(g2,x+9,78,9,4,p.cap);
   }));}
  top.update();
  return {front,top};
}
const crowdTex=makeCrowdTextures();
const crowdFrontMat=M('#000000');crowdFrontMat.emissiveTexture=crowdTex.front;crowdFrontMat.emissiveTexture.level=0.95;crowdFrontMat.disableLighting=true;
const crowdTopMat=M('#000000');crowdTopMat.emissiveTexture=crowdTex.top;crowdTopMat.emissiveTexture.level=0.95;crowdTopMat.disableLighting=true;
const crowdBaseMat=M('#1a2030',{em:'#0d111b'});
const standMat=new BABYLON.MultiMaterial('crowd',scene);standMat.subMaterials=[crowdFrontMat,crowdTopMat,crowdBaseMat];
// 把方塊的 UV 改成世界公尺比例，並讓側面／頂面／底面各用不同材質。yBase＝方塊底的世界高度，rowBase＝一排人的基準高度（讓階梯頂緣對齊貼圖邊緣）。
function crowdUV(mesh,w,h,d,yBase,rowBase){
  const uv=mesh.getVerticesData(BABYLON.VertexBuffer.UVKind),tw=CROWD_TILE_W;
  const dims=[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]];
  for(let f=0;f<6;f++){
    const [fw,fh]=dims[f];
    for(let v=0;v<4;v++){const i=(f*4+v)*2;
      const u0=uv[i],v0=uv[i+1];
      uv[i]=u0*fw/tw;
      uv[i+1]=f<4?((yBase-rowBase)/CROWD_ROW_H+v0*fh/CROWD_ROW_H):v0*fh/CROWD_STEP_D;
    }
  }
  mesh.setVerticesData(BABYLON.VertexBuffer.UVKind,uv);
  mesh.subMeshes=[];
  const mi=[0,0,0,0,1,2];
  for(let f=0;f<6;f++)new BABYLON.SubMesh(mi[f],0,24,f*6,6,mesh);
  return mesh;
}
// 外野看台：從外野全壘打牆外側（r=107 m）起，一階一階往外升高成斜坡（每階深 1.1 m、高 0.8 m，約 36°）。
//   立面（riser）貼「人的上半身」、踏面（tread）貼「座椅＋頭肩俯視」，與內野看台同一套貼圖，UV 以世界公尺計算。
crowdFrontMat.backFaceCulling=false;crowdTopMat.backFaceCulling=false;
// 看台輪廓：內野側邊看台（界外牆外側、深 12 階）→ 轉角扇形看台 → 外野看台，連成一圈等深的封閉碗形。
//   轉角點 J＝界外牆外側看台前緣（偏移 20.16 m）與外野看台前緣（r=107 m）的交會點，位於約 56° 處。
const OUT_R0=107,OUT_N=12,OUT_D=1.1,OUT_TH=0.8,OUT_SEG=34;
const CORNER_S=Math.sqrt(OUT_R0*OUT_R0-20.16*20.16),CORNER_A=Math.atan2(CORNER_S+20.16,CORNER_S-20.16)*180/Math.PI,OUT_A=CORNER_A;
const outTop=k=>4.2+OUT_TH*k;
// 擊球模擬需走到看台後牆與外野照明塔附近，不能在 r=119 m 就提早截斷，否則高飛球會看似穿過看台。
const BALL_SIMULATION_OUTER_LIMIT=150;
{
  const pos=[],uv=[],idxR=[],idxT=[],TW=CROWD_TILE_W;
  const P=(a,r,y)=>pos.push(r*Math.sin(a),y,r*Math.cos(a));
  for(let k=0;k<OUT_N;k++){
    const ra=OUT_R0+OUT_D*k,rb=ra+OUT_D,top=outTop(k),yb=k===0?0:top-OUT_TH;
    for(let j=0;j<OUT_SEG;j++){
      const a0=(-OUT_A+j*2*OUT_A/OUT_SEG)*Math.PI/180,a1=(-OUT_A+(j+1)*2*OUT_A/OUT_SEG)*Math.PI/180;
      // 立面（面向球場）
      let n=pos.length/3;
      P(a0,ra,yb);P(a1,ra,yb);P(a1,ra,top);P(a0,ra,top);
      const rm=ra,v0=(yb-3.4)/OUT_TH,v1=(top-3.4)/OUT_TH;
      uv.push(a0*rm/TW,v0,a1*rm/TW,v0,a1*rm/TW,v1,a0*rm/TW,v1);
      idxR.push(n,n+1,n+2,n,n+2,n+3);
      // 踏面（水平）
      n=pos.length/3;
      P(a0,ra,top);P(a1,ra,top);P(a1,rb,top);P(a0,rb,top);
      const rt=(ra+rb)/2;
      uv.push(a0*rt/TW,0,a1*rt/TW,0,a1*rt/TW,1,a0*rt/TW,1);
      idxT.push(n,n+1,n+2,n,n+2,n+3);
    }
  }
  const mesh=new BABYLON.Mesh('outstand',scene);
  const vd=new BABYLON.VertexData();vd.positions=pos;vd.indices=idxR.concat(idxT);vd.uvs=uv;
  const nrm=[];BABYLON.VertexData.ComputeNormals(pos,vd.indices,nrm);vd.normals=nrm;
  vd.applyToMesh(mesh);
  const mm=new BABYLON.MultiMaterial('outCrowd',scene);mm.subMaterials=[crowdFrontMat,crowdTopMat];
  mesh.material=mm;mesh.isPickable=false;
  mesh.subMeshes=[];
  const nv=pos.length/3;
  new BABYLON.SubMesh(0,0,nv,0,idxR.length,mesh);
  new BABYLON.SubMesh(1,0,nv,idxR.length,idxT.length,mesh);
  // 隱形觀眾席碰撞體：依每階實際半徑／高度建立分段實體，不把整個看台包成一個巨大方盒。
  // 所有球路都用 solidHit 的同一套連續線段－OBB 判定；24 個扇區／階可兼顧曲面精度與檢查成本。
  const STAND_COLLISION_SECTORS=18;
  for(let k=0;k<OUT_N;k++){
    const ra=OUT_R0+OUT_D*k,rb=ra+OUT_D,top=outTop(k),yb=0;
    for(let j=0;j<STAND_COLLISION_SECTORS;j++){
      const da=(-OUT_A+j*2*OUT_A/STAND_COLLISION_SECTORS)*Math.PI/180;
      const db=(-OUT_A+(j+1)*2*OUT_A/STAND_COLLISION_SECTORS)*Math.PI/180;
      const th=(da+db)/2,rm=(ra+rb)/2;
      const width=2*rm*Math.sin((db-da)/2)+0.24;
      const box=put(MB.CreateBox('outfield-seat-collider',{width,height:top-yb,depth:OUT_D+0.14}),rm*Math.sin(th),(top+yb)/2,rm*Math.cos(th),null);
      box.rotation.y=th;box.isVisible=false;box.visibility=0;box.isPickable=false;
      registerBallSolid(box,'spectator');
    }
  }
  // 看台後方的混凝土外牆＋頂緣燈帶
  const rBack=OUT_R0+OUT_D*OUT_N+0.7,hBack=outTop(OUT_N-1)+3;
  const NB=28,outConcrete=M('#232733'),outGlow=M('#ffe2a8',{em:'#ffe2a8'});
  for(let i=0;i<NB;i++){
    const th=(-OUT_A+(i+0.5)*2*OUT_A/NB)*Math.PI/180,w=2*rBack*Math.sin(OUT_A*Math.PI/180/NB)+0.6;
    const x=rBack*Math.sin(th),z=rBack*Math.cos(th);
    const wl=put(MB.CreateBox('outback',{width:w,height:hBack,depth:0.8}),x,hBack/2,z,outConcrete);wl.rotation.y=th;registerBallSolid(wl,'spectator');
    const gl=put(MB.CreateBox('outbackglow',{width:w,height:0.3,depth:0.5}),x,hBack,z,outGlow);gl.rotation.y=th;registerBallSolid(gl,'spectator');
  }
}

// ---- 中外野正中央：綠色高牆（打者視線背景）＋牆上的大型即時記分板
const WALL_W=44,WALL_H=12,WALL_Z=108.0,WALL_D=2.4,WALL_ZC=WALL_Z+WALL_D/2;
const SB_HOUSE_W=40.4,SB_HOUSE_H=14.4,SB_PW=38,SB_PH=38*512/1536;
{
  const wt=new BABYLON.DynamicTexture('greenWallTex',{width:1024,height:256},scene,true),g=wt.getContext();
  const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#2a8a4c');gr.addColorStop(1,'#14572f');g.fillStyle=gr;g.fillRect(0,0,1024,256);
  g.fillStyle='rgba(0,0,0,.16)';for(let x=0;x<1024;x+=64)g.fillRect(x,0,3,256);        // 板縫
  g.fillStyle='rgba(255,255,255,.06)';for(let x=0;x<1024;x+=64)g.fillRect(x+3,0,2,256);
  g.fillStyle='rgba(0,0,0,.14)';[85,170].forEach(y=>g.fillRect(0,y,1024,3));              // 橫向接縫
  g.fillStyle='rgba(255,255,255,.55)';g.fillRect(0,236,1024,6);                            // 底部白線
  wt.update();
  const wm=new BABYLON.StandardMaterial('greenWallMat',scene);wm.diffuseTexture=wt;wm.emissiveColor=C(0.10,0.17,0.12);wm.specularColor=C(0,0,0);
  registerBallSolid(put(MB.CreateBox('greenwall',{width:WALL_W,height:WALL_H,depth:WALL_D}),0,WALL_H/2,WALL_ZC,wm));
  registerBallSolid(put(MB.CreateBox('greenwallcap',{width:WALL_W+0.6,height:0.4,depth:WALL_D+0.4}),0,WALL_H+0.2,WALL_ZC,M('#e9e6dc')));
  // 記分板外殼（立在牆頂）＋頂緣燈帶
  const houseMat=M('#0c111b');
  registerBallSolid(put(MB.CreateBox('sbhouse',{width:SB_HOUSE_W,height:SB_HOUSE_H,depth:2}),0,WALL_H+0.4+SB_HOUSE_H/2,WALL_ZC,houseMat),'scoreboard');
  registerBallSolid(put(MB.CreateBox('sbtrim',{width:SB_HOUSE_W+0.8,height:0.5,depth:2.4}),0,WALL_H+0.4+SB_HOUSE_H+0.25,WALL_ZC,M('#ffb43a',{em:'#ffb43a'})),'scoreboard');
  [-1,1].forEach(sd=>registerBallSolid(put(MB.CreateBox('sbpost',{width:1.2,height:WALL_H*0.5,depth:1.2}),sd*SB_HOUSE_W*0.38,WALL_H*0.75,WALL_ZC,houseMat),'scoreboard'));
  const pl=MB.CreatePlane('scoreboard',{width:SB_PW,height:SB_PH,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
  pl.position.set(0,WALL_H+0.4+SB_HOUSE_H/2,WALL_ZC-1.05);pl.isPickable=false;
  const sbCollider=put(MB.CreateBox('scoreboard-collider',{width:SB_PW,height:SB_PH,depth:0.12}),0,WALL_H+0.4+SB_HOUSE_H/2,WALL_ZC-1.05,null);sbCollider.isVisible=false;sbCollider.visibility=0;registerBallSolid(sbCollider,'scoreboard');
  const sm=new BABYLON.StandardMaterial('scoreboardMat',scene);sm.emissiveTexture=sbTexInit();sm.diffuseColor=C(0,0,0);sm.specularColor=C(0,0,0);sm.disableLighting=true;sm.backFaceCulling=false;
  pl.material=sm;
}
const lampMat=M('#fff6d8',{em:'#fff6d8'}),poleMat=M('#2a3550');
[-62,-32,32,62].forEach(a=>{const th=a*Math.PI/180,r=142;
  // 照明塔與燈具也是球場中的實體，納入和全壘打牆／看台相同的球體碰撞索引。
  registerBallSolid(put(MB.CreateCylinder('p',{diameter:1.2,height:52}),r*Math.sin(th),26,r*Math.cos(th),poleMat));
  const p=put(MB.CreateBox('lp',{width:18,height:9,depth:1}),r*Math.sin(th),54,r*Math.cos(th),lampMat);p.rotation.y=th;registerBallSolid(p);});

// ================= 內野看台 / 觀眾席 / 本壘後方牆面 / 休息室凹槽 =================
const SQ=Math.SQRT1_2,lpt=ctx.lpt;   // 座標：沿界外線 r、往界外側偏移 o（界外牆在 o=20）
const concrete=M('#232733'),benchMat=M('#9b7a4d'),glowMat=M('#ffe2a8',{em:'#ffe2a8'}),railMat=M('#aeb8c8',{em:'#3a4252'});
const STAND_N=12,TIER_D=1.1,TIER_H=0.8,O_FIRST=20.16+0.55,STAND_R1=CORNER_S;   // 側邊看台延伸到轉角點
const standTop=k=>3.4+TIER_H*k,standOff=k=>O_FIRST+TIER_D*k,sideRot=side=>side*Math.PI/4-Math.PI/2;
function tierBox(side,k,ra,rb,y0,y1,mat){
  const c=lpt(side,(ra+rb)/2,standOff(k));
  const b=put(MB.CreateBox('stand',{width:rb-ra,height:y1-y0,depth:TIER_D}),c.x,(y0+y1)/2,c.z,mat);b.rotation.y=sideRot(side);
  if(mat===standMat)crowdUV(b,rb-ra,y1-y0,TIER_D,y0,3.4);
  return b;
}
function sideBox(side,r,o,w,h,d,y,mat){const c=lpt(side,r,o),b=put(MB.CreateBox('sb',{width:w,height:h,depth:d}),c.x,y,c.z,mat);b.rotation.y=sideRot(side);return b;}
const adT=new BABYLON.DynamicTexture('ads',{width:1024,height:64},scene,false);
{const g=adT.getContext(),cs=['#c8372d','#f2f2ee','#1f5fbf','#f0b429','#1c8c5a','#f2f2ee'];
 for(let i=0;i<16;i++){g.fillStyle=cs[i%cs.length];g.fillRect(i*64,0,64,64);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(i*64+6,24,52,16);}
 adT.update();}
const adMat=M('#000000');adMat.emissiveTexture=adT;adMat.disableLighting=true;
// --- 左右兩側內野看台（沿界外牆外側，階梯式往上）＋休息室凹槽
for(const side of [-1,1]){
  for(let k=0;k<STAND_N;k++){
    const top=standTop(k);
    if(k<4){   // 前四階被休息室凹槽切掉下半部，只留上方的「樑」當天花板
      tierBox(side,k,0,DUG_R-DUG_HALF,0,top,standMat);
      tierBox(side,k,DUG_R+DUG_HALF,STAND_R1,0,top,standMat);
      tierBox(side,k,DUG_R-DUG_HALF,DUG_R+DUG_HALF,DUG_H,top,k===0?sideMat:standMat);
    }else tierBox(side,k,0,STAND_R1,0,top,standMat);
  }
  // 看台後方外牆＋頂緣燈帶、尾端封牆
  const oBack=standOff(STAND_N)+0.2;
  sideBox(side,STAND_R1/2,oBack,STAND_R1,15,0.6,7.5,concrete);
  sideBox(side,STAND_R1/2,oBack-0.2,STAND_R1,0.25,0.3,15,glowMat);
  // 看台前緣欄杆
  sideBox(side,(STAND_R1+DUG_R+DUG_HALF)/2,standOff(0)-0.5,STAND_R1-(DUG_R+DUG_HALF),0.08,0.08,standTop(0)+1.0,railMat);
  sideBox(side,(DUG_R-DUG_HALF)/2,standOff(0)-0.5,DUG_R-DUG_HALF,0.08,0.08,standTop(0)+1.0,railMat);
  // 本壘後方斜牆（與界外牆起點相接，把本壘後方封起來）
  {const c=lpt(side,0,27),w=put(MB.CreateBox('wing',{width:14,height:SIDE_H,depth:0.32}),c.x,SIDE_H/2,c.z,sideMat);w.rotation.y=Math.PI/2-side*Math.PI/4;registerFenceCollider(w);
   const cap=put(MB.CreateBox('wingcap',{width:14,height:0.12,depth:0.44}),c.x,SIDE_H+0.06,c.z,sideTrim);cap.rotation.y=Math.PI/2-side*Math.PI/4;registerFenceCollider(cap);}
  // 休息室內部：內襯、地板、長椅、天花板燈
  const ct0=DUG_R,ow=2*DUG_HALF,od=standOff(4)-0.55-19.9;   // 凹槽深度＝前 4 階
  const oc=(19.9+standOff(4)-0.55)/2;
  sideBox(side,ct0,standOff(4)-0.55-0.04,ow,DUG_H,0.06,DUG_H/2,concrete);                 // 後牆
  sideBox(side,ct0-DUG_HALF+0.03,oc,0.06,DUG_H,od,DUG_H/2,concrete);                       // 左牆
  sideBox(side,ct0+DUG_HALF-0.03,oc,0.06,DUG_H,od,DUG_H/2,concrete);                       // 右牆
  sideBox(side,ct0,oc,ow,0.05,od,DUG_H-0.03,concrete);                                     // 天花板
  sideBox(side,ct0,oc,ow,0.05,od+0.2,0.03,M('#4a4f5c'));                                    // 水泥地板
  sideBox(side,ct0,standOff(4)-0.55-0.45,ow-2,0.12,0.5,0.5,benchMat);                       // 長椅
  sideBox(side,ct0,standOff(4)-0.55-0.2,ow-2,0.5,0.1,0.8,benchMat);                         // 椅背
  sideBox(side,ct0,oc,ow-3,0.06,0.25,DUG_H-0.1,glowMat);                                    // 天花板燈
  // 休息室前緣矮牆（中間留 2.6 m 出入口）
  [[DUG_R-DUG_HALF,DUG_R-1.3],[DUG_R+1.3,DUG_R+DUG_HALF]].forEach(([a,b])=>{
    const w=sideBox(side,(a+b)/2,19.9,b-a,1.1,0.32,0.55,sideMat);registerFenceCollider(w);
    const cap=sideBox(side,(a+b)/2,19.9,b-a,0.1,0.44,1.15,sideTrim);registerFenceCollider(cap);});
}
// --- 轉角扇形看台：接起「側邊看台」與「外野看台」。以轉角點 J 為圓心，每一階是一圈圓弧；
//     階高從側邊的 3.4+0.8k 漸變到外野的 4.2+0.8k（踏面微斜），兩端都與鄰接的看台無縫相接。
for(const side of [-1,1]){
  const F=lpt(side,CORNER_S,20.16),A0=side*135*Math.PI/180,A1=side*OUT_A*Math.PI/180,NS=12,TW=CROWD_TILE_W,pos=[],uv=[],idxR=[],idxT=[];
  const Pt=(a,rho,y)=>pos.push(F.x+rho*Math.sin(a),y,F.z+rho*Math.cos(a));
  const hT=(k,j)=>3.4+TIER_H*k+0.8*j/NS;
  for(let k=0;k<STAND_N;k++){
    const ra=TIER_D*k,rb=ra+TIER_D,rt=(ra+rb)/2;
    for(let j=0;j<NS;j++){
      const a0=A0+(A1-A0)*j/NS,a1=A0+(A1-A0)*(j+1)/NS,u0=Math.abs(a0-A0),u1=Math.abs(a1-A0);
      const t0=hT(k,j),t1=hT(k,j+1),b0=k?t0-TIER_H:0,b1=k?t1-TIER_H:0;
      let n=pos.length/3;
      Pt(a0,ra,b0);Pt(a1,ra,b1);Pt(a1,ra,t1);Pt(a0,ra,t0);   // 立面
      uv.push(u0*ra/TW,(b0-3.4)/TIER_H,u1*ra/TW,(b1-3.4)/TIER_H,u1*ra/TW,(t1-3.4)/TIER_H,u0*ra/TW,(t0-3.4)/TIER_H);
      idxR.push(n,n+1,n+2,n,n+2,n+3);
      n=pos.length/3;
      Pt(a0,ra,t0);Pt(a1,ra,t1);Pt(a1,rb,t1);Pt(a0,rb,t0);   // 踏面
      uv.push(u0*rt/TW,0,u1*rt/TW,0,u1*rt/TW,1,u0*rt/TW,1);
      idxT.push(n,n+1,n+2,n,n+2,n+3);
    }
  }
  const mesh=new BABYLON.Mesh('fanstand',scene),vd=new BABYLON.VertexData(),nrm=[];
  vd.positions=pos;vd.indices=idxR.concat(idxT);vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,vd.indices,nrm);vd.normals=nrm;vd.applyToMesh(mesh);
  const mm=new BABYLON.MultiMaterial('fanCrowd',scene);mm.subMaterials=[crowdFrontMat,crowdTopMat];mesh.material=mm;mesh.isPickable=false;mesh.subMeshes=[];
  const nv=pos.length/3;new BABYLON.SubMesh(0,0,nv,0,idxR.length,mesh);new BABYLON.SubMesh(1,0,nv,idxR.length,idxT.length,mesh);
  // 隱形觀眾席碰撞體：每階分 4 個扇區
  const NSC=4;
  for(let k=0;k<STAND_N;k++){const rm=TIER_D*k+TIER_D/2;
    for(let m=0;m<NSC;m++){
      const aa=A0+(A1-A0)*m/NSC,ab=A0+(A1-A0)*(m+1)/NSC,am=(aa+ab)/2,top=hT(k,(m+1)*NS/NSC),width=2*rm*Math.sin(Math.abs(ab-aa)/2)+0.3;
      const box=put(MB.CreateBox('fan-seat-collider',{width,height:top,depth:TIER_D+0.14}),F.x+rm*Math.sin(am),top/2,F.z+rm*Math.cos(am),null);
      box.rotation.y=am;box.isVisible=false;box.visibility=0;box.isPickable=false;registerBallSolid(box,'spectator');}}
  // 後方混凝土外牆＋頂緣燈帶（高度從側邊的 15 m 漸變到外野的 16 m）
  const Rb=standOff(STAND_N)+0.2-20.16,NB=12;
  for(let j=0;j<NB;j++){
    const am=A0+(A1-A0)*(j+0.5)/NB,hb=15+(j+0.5)/NB,w=2*Rb*Math.sin(Math.abs(A1-A0)/NB/2)+0.5,x=F.x+Rb*Math.sin(am),z=F.z+Rb*Math.cos(am);
    const wl=put(MB.CreateBox('fanback',{width:w,height:hb,depth:0.7}),x,hb/2,z,concrete);wl.rotation.y=am;registerBallSolid(wl,'spectator');
    const gl=put(MB.CreateBox('fanbackglow',{width:w,height:0.25,depth:0.3}),x-Math.sin(am)*0.2,hb,z-Math.cos(am)*0.2,glowMat);gl.rotation.y=am;
  }
}
// --- 本壘後方：牆面（廣告板）＋看台
{const HW=24,WZ=-24.0,backWall=put(MB.CreateBox('homewall',{width:2*HW,height:3.6,depth:0.3}),0,1.8,WZ,adMat);registerFenceCollider(backWall);
 const backWallCap=put(MB.CreateBox('homewallcap',{width:2*HW,height:0.14,depth:0.44}),0,3.67,WZ,sideTrim);registerFenceCollider(backWallCap);
 for(let k=0;k<STAND_N;k++){const top=standTop(k);const sb2=put(MB.CreateBox('stand',{width:2*HW,height:top,depth:TIER_D}),0,top/2,-(24.7+TIER_D*k),standMat);crowdUV(sb2,2*HW,top,TIER_D,0,3.4);}
 const zb=-(24.7+TIER_D*STAND_N+0.2);
 put(MB.CreateBox('standback',{width:2*HW,height:15,depth:0.6}),0,7.5,zb,concrete);
 put(MB.CreateBox('standbackglow',{width:2*HW,height:0.25,depth:0.3}),0,15,zb+0.2,glowMat);
 [-1,1].forEach(sd=>put(MB.CreateBox('standend',{width:0.5,height:7,depth:Math.abs(zb)-24}),sd*HW,3.5,(zb-24)/2,concrete));
 registerBallSolid(put(MB.CreateBox('homerail',{width:2*HW,height:0.08,depth:0.08}),0,standTop(0)+1.0,-24.15,railMat));}
// ================= 球員休息區（跑者進出、守備員換場、候補球員座位）=================
ctx.setDugouts({
  E:s=>lpt(s,DUG_R,18.6),                                   // 前緣矮牆外側（跑者先到這裡）
  T:s=>lpt(s,DUG_R,22.4),                                   // 凹槽內長椅前
  gate:(s,j,inside)=>lpt(s,DUG_R+j,inside?21.3:18.4),       // 前緣矮牆缺口：j＝沿界外線的橫向位移（公尺）
  seat:(s,i)=>{const p=lpt(s,16.8+(i%9)*1.3,i%3===0?23.9:(i%3===1?21.7:22.8));   // i＝球員在名單中的序號；坐長椅或站著
    return {x:p.x,y:i%3===0?0.48:0,z:p.z,ry:s===-1?Math.PI/4:-Math.PI/4,scale:i%3===0?[0.82,0.72,0.82]:null};}
});
ctx.setRules({fenceR:FENCE_R,fenceH:FENCE_H,arcDeg:OUTFIELD_ARC_DEG,simLimit:BALL_SIMULATION_OUTER_LIMIT});   // 全壘打判定：牆半徑／高度／涵蓋角度
// ================= 球場外：大都會（高樓大廈）=================
// 球場獨佔一個「超大街廓」(block)，外圍用兩縱兩橫的「井」字形馬路圍起來，球場就坐在井字中央的「口」裡，
// 四條馬路都是完整的、不會被球場截斷；井字的四條路再向外延伸成整個城市的街道網（平常街廓間距 96 m）。
//   · 中央街廓：x∈[-140,140]、z∈[-60,144]。邊緣是 4 m 人行道，裡面是廣場鋪面（有發光接縫），球場佔地（看台後牆外緣）就在其中；
//     外野照明塔也都落在這個街廓的廣場上。
//   · 道路：寬 20 m，雙黃線＋虛線車道線＋路邊白線，路口接斑馬線；球員休息室（x=240）落在井字右側的一個街廓內。
//   · 街廓裡蓋滿高樓大廈（低層→中層→超高層，離球場越遠越高），窗戶貼圖是「夜晚亮燈的窗」，
//     高樓有霓虹頂冠、避雷針與紅色航空警示燈；另有屋頂霓虹看板、路燈、車燈。全部是純外觀、不參與碰撞。
// 為了效能：同一種外牆貼圖的所有建築、同一顏色的所有小燈，最後各合併成一個 mesh；地面也是依材質合併。
{
const TAU=Math.PI*2,V4=(a,b,c,d)=>new BABYLON.Vector4(a,b,c,d),rn=mulberry32(20261025);
const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const newT=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const merge=(arr,mat,name)=>{if(!arr.length)return null;const m=BABYLON.Mesh.MergeMeshes(arr,true,true);if(m){m.name=name;if(mat)m.material=mat;m.isPickable=false;}return m;};
const CX=0,CZ=40,NA=216,PW=14,GY=0.08;   // 中心點、角度取樣數、（距離判斷用的）廣場寬、地面高度
const RW=20,SW=4;                        // 道路寬、人行道寬
const IX=136,IZ0=-56,IZ1=140;            // 中央街廓內緣（人行道以內）：x∈[-136,136]、z∈[-56,140]；外緣加 4 m 人行道＝[-140,140]×[-60,144]
// 馬路中心線：中央街廓四周 x=±150、z=-70／154 構成「井」字；再往外 x 先到 ±270（讓休息室所在街廓夠寬），之後每 96 m 一條
const XS=[];[150,270,366,462,558,654,750].forEach(v=>{XS.push(v,-v);});XS.sort((a,b)=>a-b);
const ZS=[-70,-166,-262,-358,-454,-550,-646,154,250,346,442,538,634,730].sort((a,b)=>a-b);
const isCenter=(i,j)=>XS[i]===-150&&XS[i+1]===150&&ZS[j]===-70&&ZS[j+1]===154;

// ── 球場佔地多邊形（以 (CX,CZ) 為中心的「星形」，逐方向算出邊界距離 rho）
const poly=[[0,-40.5]],half=[[26,-40.5],[26,-25.5]];
{const F=lpt(1,CORNER_S,20.16);for(let i=0;i<=6;i++){const a=(135+(CORNER_A-135)*i/6)*Math.PI/180;half.push([F.x+16*Math.sin(a),F.z+16*Math.cos(a)]);}}   // 轉角扇形看台外緣
poly.push(...half);
for(let i=0;i<=28;i++){const t=(CORNER_A-2*CORNER_A*i/28)*Math.PI/180;poly.push([123.5*Math.sin(t),123.5*Math.cos(t)]);}   // 外野看台外緣
poly.push(...half.map(([x,z])=>[-x,z]).reverse());
const rho=new Array(NA);
for(let i=0;i<NA;i++){const th=i*TAU/NA,dx=Math.cos(th),dz=Math.sin(th);let best=1e9;
  for(let j=0;j<poly.length;j++){const A=poly[j],B=poly[(j+1)%poly.length],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
    const ax=A[0]-CX,az=A[1]-CZ,t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=0&&u<=1&&t<best)best=t;}
  rho[i]=best;}
const rhoAt=th=>{th=((th%TAU)+TAU)%TAU;const f=th/TAU*NA,i0=Math.floor(f)%NA,i1=(i0+1)%NA,w=f-Math.floor(f);return rho[i0]*(1-w)+rho[i1]*w;};
const dOut=(x,z)=>{const dx=x-CX,dz=z-CZ;return Math.hypot(dx,dz)-rhoAt(Math.atan2(dz,dx));};   // 到球場佔地邊界的距離（負＝在球場內）

// ── 地面：依「道路中心線 XS/ZS」切成 路口／路段(含斑馬線)／人行道／街廓鋪面／中央街廓廣場，再依材質合併成幾個 mesh
const speck=(g,S,r,n,a1,a2)=>{for(let q=0;q<n;q++){g.fillStyle=q%2?a1:a2;const s=1+r()*2;g.fillRect(r()*S,r()*S,s,s);}};
function roadTex(){   // 20 m（寬，u）× 24 m（長，v）：雙黃線、虛線車道線、路邊白線
  const S=256,kx=S/20,ky=S/24,t=newT('cyRoad',S,S),g=t.getContext(),r=mulberry32(5);
  const R=(u0,v0,u1,v1,c)=>{g.fillStyle=c;g.fillRect(u0*kx,v0*ky,(u1-u0)*kx,(v1-v0)*ky);};
  R(0,0,20,24,'#1b1e26');speck(g,S,r,5000,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');
  R(9.78,0,9.93,24,'#d9b43a');R(10.07,0,10.22,24,'#d9b43a');
  R(1,0,1.15,24,'#d6dae3');R(18.85,0,19,24,'#d6dae3');
  [1.5,13.5].forEach(v=>{R(4.92,v,5.08,v+3,'#d6dae3');R(14.92,v,15.08,v+3,'#d6dae3');});
  t.update();return t;
}
function zebraTex(){  // 2.4 m × 3.6 m：兩條 0.6 m 的白條
  const S=128,t=newT('cyZebra',S,S),g=t.getContext(),r=mulberry32(6);
  g.fillStyle='#1b1e26';g.fillRect(0,0,S,S);speck(g,S,r,1500,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');
  g.fillStyle='#cfd3dc';g.fillRect(0,0,S/4,S);g.fillRect(S/2,0,S/4,S);t.update();return t;
}
function asphaltTex(){const S=128,t=newT('cyAsph',S,S),g=t.getContext(),r=mulberry32(7);g.fillStyle='#1b1e26';g.fillRect(0,0,S,S);speck(g,S,r,2500,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');t.update();return t;}
function sidewalkTex(){   // 4 m（寬，u；u=0 是路緣）× 8 m（長，v）
  const W=128,H=256,t=newT('cySide',W,H),g=t.getContext(),r=mulberry32(8);
  g.fillStyle='#4d5361';g.fillRect(0,0,W,H);speck(g,W,r,2500,'rgba(255,255,255,0.05)','rgba(0,0,0,0.10)');
  g.fillStyle='#9aa1b3';g.fillRect(0,0,W*0.0875,H);
  g.strokeStyle='rgba(0,0,0,0.28)';g.lineWidth=1;g.beginPath();for(let v=0;v<=8;v++){g.moveTo(0,v*H/8);g.lineTo(W,v*H/8);}g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();
  t.update();return t;
}
function paveTex(){   // 16 m 一格的街廓鋪面（4 m 大格、2 m 小格）
  const S=512,k=S/16,t=newT('cyPave',S,S),g=t.getContext(),r=mulberry32(9);
  g.fillStyle='#2b303b';g.fillRect(0,0,S,S);speck(g,S,r,6000,'rgba(255,255,255,0.04)','rgba(0,0,0,0.10)');
  for(let m=0;m<=16;m+=2){g.strokeStyle=m%4?'rgba(0,0,0,0.12)':'rgba(0,0,0,0.28)';g.lineWidth=m%4?1:2;g.beginPath();g.moveTo(m*k,0);g.lineTo(m*k,S);g.moveTo(0,m*k);g.lineTo(S,m*k);g.stroke();}
  t.update();return t;
}
function plazaTex(){    // 16 m 一格的球場廣場鋪面：2 m 分格＋發光的接縫
  const S=512,k=S/16,t=newT('cyPlaza',S,S),g=t.getContext(),r=mulberry32(10);
  g.fillStyle='#3d4352';g.fillRect(0,0,S,S);speck(g,S,r,8000,'rgba(255,255,255,0.05)','rgba(0,0,0,0.10)');
  g.strokeStyle='rgba(0,0,0,0.30)';g.lineWidth=2;for(let m=0;m<=16;m+=2){g.beginPath();g.moveTo(m*k,0);g.lineTo(m*k,S);g.moveTo(0,m*k);g.lineTo(S,m*k);g.stroke();}
  g.fillStyle='rgba(255,196,110,0.75)';g.fillRect(7.9*k,0,0.2*k,S);g.fillRect(0,7.9*k,S,0.2*k);g.fillRect(0,0,0.1*k,S);g.fillRect(S-0.1*k,0,0.1*k,S);g.fillRect(0,0,S,0.1*k);g.fillRect(0,S-0.1*k,S,0.1*k);
  t.update();return t;
}
const gMat={road:roadTex(),zebra:zebraTex(),asph:asphaltTex(),side:sidewalkTex(),pave:paveTex(),plaza:plazaTex()};
Object.keys(gMat).forEach(k=>{const m=texMat(gMat[k],1);m.backFaceCulling=false;gMat[k]=m;});
const acc={};
const gq=(key,pts,uvf)=>{const a=acc[key]||(acc[key]={pos:[],uv:[],idx:[]}),n=a.pos.length/3;   // 一個四邊形（4 個角）
  pts.forEach(([x,z])=>{a.pos.push(x,GY,z);const u=uvf(x,z);a.uv.push(u[0],u[1]);});a.idx.push(n,n+1,n+2,n,n+2,n+3);};
const rectQ=(key,x0,z0,x1,z1,uvf)=>gq(key,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],uvf);
const W8=(x,z)=>[x/8,z/8];
// 路口
for(const X of XS)for(const Z of ZS)rectQ('asph',X-RW/2,Z-RW/2,X+RW/2,Z+RW/2,W8);
// 路段：兩端各留 0.8 m 空白＋3.6 m 斑馬線，中間是車道線
function roadSeg(vert,C,a,b){
  const c0=C-RW/2,c1=C+RW/2;
  const piece=(key,p0,p1,uvf)=>vert?rectQ(key,c0,p0,c1,p1,uvf):rectQ(key,p0,c0,p1,c1,uvf);
  const zeb=p0=>(x,z)=>vert?[(x-c0)/2.4,(z-p0)/3.6]:[(z-c0)/2.4,(x-p0)/3.6];
  piece('asph',a,a+0.8,W8);piece('zebra',a+0.8,a+4.4,zeb(a+0.8));
  piece('road',a+4.4,b-4.4,(x,z)=>vert?[(x-c0)/RW,(z-(a+4.4))/24]:[(z-c0)/RW,(x-(a+4.4))/24]);
  piece('zebra',b-4.4,b-0.8,zeb(b-4.4));piece('asph',b-0.8,b,W8);
}
for(const X of XS)for(let j=0;j<ZS.length-1;j++)roadSeg(true,X,ZS[j]+RW/2,ZS[j+1]-RW/2);
for(const Z of ZS)for(let i=0;i<XS.length-1;i++)roadSeg(false,Z,XS[i]+RW/2,XS[i+1]-RW/2);
// 街廓：四周 4 m 人行道（u=0 靠路緣）＋ 內部鋪面（中央街廓的內部改鋪廣場、並挖掉球場佔地）
for(let i=0;i<XS.length-1;i++)for(let j=0;j<ZS.length-1;j++){
  const x0=XS[i]+RW/2,x1=XS[i+1]-RW/2,z0=ZS[j]+RW/2,z1=ZS[j+1]-RW/2;
  rectQ('side',x0,z0,x1,z0+SW,(x,z)=>[(z-z0)/SW,(x-x0)/8]);
  rectQ('side',x0,z1-SW,x1,z1,(x,z)=>[(z1-z)/SW,(x-x0)/8]);
  rectQ('side',x0,z0+SW,x0+SW,z1-SW,(x,z)=>[(x-x0)/SW,(z-z0)/8]);
  rectQ('side',x1-SW,z0+SW,x1,z1-SW,(x,z)=>[(x1-x)/SW,(z-z0)/8]);
  if(!isCenter(i,j))rectQ('pave',x0+SW,z0+SW,x1-SW,z1-SW,(x,z)=>[x/16,z/16]);
}
// 中央街廓的廣場：內緣矩形 與 球場佔地多邊形 之間的環形區域（以 (CX,CZ) 為中心逐角度切片；多邊形頂點與矩形四角都加進取樣角，邊界才會精確）
function castPoly(th){const dx=Math.cos(th),dz=Math.sin(th);let best=1e9;
  for(let j=0;j<poly.length;j++){const A=poly[j],B=poly[(j+1)%poly.length],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
    const ax=A[0]-CX,az=A[1]-CZ,t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6&&t<best)best=t;}
  return best;}
function castRect(th){const dx=Math.cos(th),dz=Math.sin(th);
  const tx=dx>1e-12?(IX-CX)/dx:dx<-1e-12?(-IX-CX)/dx:1e9,tz=dz>1e-12?(IZ1-CZ)/dz:dz<-1e-12?(IZ0-CZ)/dz:1e9;return Math.min(tx,tz);}
{const angOf=(x,z)=>((Math.atan2(z-CZ,x-CX)%TAU)+TAU)%TAU,raw=[];
 for(let i=0;i<NA;i++)raw.push(i*TAU/NA);
 poly.forEach(([x,z])=>raw.push(angOf(x,z)));[[IX,IZ0],[-IX,IZ0],[IX,IZ1],[-IX,IZ1]].forEach(([x,z])=>raw.push(angOf(x,z)));
 raw.sort((a,b)=>a-b);const A=raw.filter((a,i)=>i===0||a-raw[i-1]>1e-7),PX=(th,r)=>[CX+r*Math.cos(th),CZ+r*Math.sin(th)];
 for(let i=0;i<A.length;i++){const t0=A[i],t1=i===A.length-1?A[0]+TAU:A[i+1];
   gq('plaza',[PX(t0,castPoly(t0)),PX(t0,castRect(t0)),PX(t1,castRect(t1)),PX(t1,castPoly(t1))],(x,z)=>[x/16,z/16]);}}
Object.keys(acc).forEach(key=>{const a=acc[key],m=new BABYLON.Mesh('cyGround_'+key,scene),vd=new BABYLON.VertexData(),nor=[];
  for(let q=0;q<a.pos.length/3;q++)nor.push(0,1,0);
  vd.positions=a.pos;vd.normals=nor;vd.uvs=a.uv;vd.indices=a.idx;vd.applyToMesh(m);m.material=gMat[key];m.isPickable=false;});

// ── 大樓外牆貼圖：24 m × 24 m 一格（12 欄 × 6 層，每格 2 m × 4 m），全是夜晚亮燈的窗
const WIN_STYLES=['辦公大樓(暖光)','玻璃帷幕(冷藍)','住宅(暖橘)','科技大樓(垂直光帶)','古典石造','全亮辦公'];
function winTex(style,seed){
  const S=768,CW=64,CH=128,t=newT('cyWin'+style,S,S),g=t.getContext(),r=mulberry32(seed);
  const FAC=['#12151f','#0a1224','#1b1620','#070b16','#2a2a32','#202636'][style],pick=a=>a[(r()*a.length)|0];
  g.fillStyle=FAC;g.fillRect(0,0,S,S);
  for(let row=0;row<6;row++)for(let c=0;c<12;c++){
    const x=c*CW,y=row*CH,lit=r();
    if(style===0){const gr=g.createLinearGradient(0,y+14,0,y+104);if(lit<0.5){gr.addColorStop(0,pick(['#ffd89a','#ffe9c0','#ffc46b','#fff3d6']));gr.addColorStop(1,'#d9a35a');}else{gr.addColorStop(0,'#16213a');gr.addColorStop(1,'#0b1020');}g.fillStyle=gr;g.fillRect(x+8,y+14,48,90);}
    else if(style===1){g.fillStyle='#10264a';g.fillRect(x,y+10,CW,98);if(lit<0.45){g.fillStyle=pick(['#9fd2ff','#e6f4ff','#7fb8f0']);g.globalAlpha=0.55+r()*0.4;g.fillRect(x+3,y+14,CW-6,90);g.globalAlpha=1;}g.fillStyle=FAC;g.fillRect(x+CW-2,y+10,3,98);}
    else if(style===2){g.fillStyle=lit<0.42?(r()<0.1?'#8fb6ff':pick(['#ffb86b','#ffd9a0','#ff9d5c'])):'#120f18';g.fillRect(x+14,y+26,36,64);g.fillStyle='#2a2330';g.fillRect(x+4,y+94,56,8);}
    else if(style===3){const gr=g.createLinearGradient(0,y,0,y+CH-16);if(lit<0.6){gr.addColorStop(0,pick(['#5fe6ff','#8af0ff','#b48bff']));gr.addColorStop(1,'#2a6bd6');}else{gr.addColorStop(0,'#0c1630');gr.addColorStop(1,'#0c1630');}g.fillStyle=gr;g.fillRect(x+16,y,32,CH-16);}
    else if(style===4){g.fillStyle='#3a3a45';g.fillRect(x+2,y,8,CH-14);g.fillStyle=lit<0.35?'#ffd27a':'#101018';g.fillRect(x+22,y+14,20,96);}
    else{g.fillStyle=lit<0.85?pick(['#fff6e0','#eaf4ff','#ffe9b8']):'#1a2236';g.fillRect(x+6,y+10,52,100);}
    g.fillStyle='#05070c';g.fillRect(x,y+CH-14,CW,14);   // 樓板邊（每層底部；也是屋頂 UV 取色的位置）
  }
  t.update();return t;
}
const MATS=[0,1,2,3,4,5].map(i=>texMat(winTex(i,100+i*17),0.95)),G=MATS.map(()=>[]);
const ROOF=V4(0.01,0.002,0.03,0.014);
const NEON=['#ff2d95','#19d3ff','#ffb000','#7cff4f','#b86bff'],neonG=NEON.map(()=>[]),spireG=[],beaconG=[];
function box(x,z,w,d,h,y0,st){   // w,d 取 2 m 倍數、h 取 4 m 倍數，窗格才對得齊
  const uw=w/24,ud=d/24,vh=h/24,ou=((rn()*12)|0)/12,ov=((rn()*6)|0)/6;
  const b=MB.CreateBox('cyB',{width:w,height:h,depth:d,faceUV:[V4(ou,ov,ou+uw,ov+vh),V4(ou,ov,ou+uw,ov+vh),V4(ou,ov,ou+ud,ov+vh),V4(ou,ov,ou+ud,ov+vh),ROOF,ROOF]},scene);
  b.position.set(x,y0+h/2,z);G[st].push(b);return b;
}
function cyl(x,z,dBot,dTop,h,y0,st){
  const dm=(dBot+dTop)/2,cells=Math.max(6,Math.round(Math.PI*dm/2)),ou=((rn()*12)|0)/12,ov=((rn()*6)|0)/6;
  const b=MB.CreateCylinder('cyC',{diameterBottom:dBot,diameterTop:dTop,height:h,tessellation:28,faceUV:[V4(0,0,1,1),V4(ou,ov,ou+cells/12,ov+h/24),ROOF]},scene);
  b.position.set(x,y0+h/2,z);G[st].push(b);return b;
}
const snap=(v,m)=>Math.max(m,Math.round(v/m)*m);
const styleFor=h=>{const a=h<50?[2,4,0,5,2]:h<110?[0,1,5,2,4,1]:[1,3,5,0,1,3];return a[(rn()*a.length)|0];};
function crown(x,z,w,d,h,round){   // 霓虹頂冠、避雷針、航空警示燈
  const ci=(rn()*NEON.length)|0;
  if(h>=96){const n=MB.CreateBox('cyNeon',{width:w+0.6,height:1.2,depth:d+0.6},scene);n.position.set(x,h-3,z);neonG[ci].push(n);}
  if(h>=130&&rn()<0.75){const sh=10+rn()*30,sp=MB.CreateCylinder('cySpire',{diameter:0.7,height:sh,tessellation:6},scene);sp.position.set(x,h+sh/2,z);spireG.push(sp);
    const bc=MB.CreateSphere('cyBeacon',{diameter:1.6,segments:6},scene);bc.position.set(x,h+sh,z);beaconG.push(bc);}
}
// ── 建築配置：每個街廓（人行道以內）依大小切成若干 30 m 左右的地塊
const okRect=(x,z,w,d,m)=>{for(const sx of [-1,0,1])for(const sz of [-1,0,1])if(dOut(x+sx*w/2,z+sz*d/2)<m)return false;return true;};
const lots=[];
for(let i=0;i<XS.length-1;i++)for(let j=0;j<ZS.length-1;j++){
  if(isCenter(i,j))continue;                                            // 中央街廓是球場，不蓋樓
  const bx0=XS[i]+RW/2+SW,bx1=XS[i+1]-RW/2-SW,bz0=ZS[j]+RW/2+SW,bz1=ZS[j+1]-RW/2-SW;
  const iw=bx1-bx0,ih=bz1-bz0,nx=Math.max(1,Math.floor(iw/32)),nz=Math.max(1,Math.floor(ih/32)),cw=iw/nx,ch=ih/nz;
  for(let a=0;a<nx;a++)for(let b=0;b<nz;b++){
    const w=snap(cw-2-rn()*3,2),d=snap(ch-2-rn()*3,2),x=bx0+cw*(a+0.5),z=bz0+ch*(b+0.5);
    if(Math.hypot(x-CX,z-CZ)>600||!okRect(x,z,w+2,d+2,PW+6))continue;
    if(Math.abs(x-240)<w/2+30&&Math.abs(z)<d/2+26)continue;            // 球員休息室周圍留空
    const D=dOut(x,z);if(D>330&&rn()<0.12)continue;
    lots.push({x,z,w,d,D});
  }
}
let landmarks=0;
lots.forEach(L=>{
  const {x,z,w,d,D}=L,base=D<70?20:D<220?40:80,sp=D<70?60:D<220?150:230;
  let h=snap(base+sp*Math.pow(rn(),1.7),4);L.h=h;
  if(D>260&&landmarks<8&&rn()<0.09){   // 地標超高樓：上窄下寬的圓錐塔
    landmarks++;h=snap(220+rn()*110,4);L.h=h;const dia=Math.min(w,d)*0.95;
    cyl(x,z,dia,dia*0.6,h,0,[1,3][landmarks%2]);crown(x,z,dia*0.6,dia*0.6,h,true);
    const ci=landmarks%NEON.length,n=MB.CreateCylinder('cyNeon',{diameter:dia*0.6+0.8,height:1.4,tessellation:28},scene);n.position.set(x,h*0.6,z);neonG[ci].push(n);return;
  }
  if(h>=64&&rn()<0.45){   // 裙樓＋塔樓
    const hp=snap(8+rn()*8,4);box(x,z,w,d,hp,0,[4,0][(rn()*2)|0]);
    const st=styleFor(h),w2=w-8,d2=d-8;box(x,z,w2,d2,h,hp,st);L.h=h+hp;crown(x,z,w2,d2,h+hp,false);return;
  }
  if(h>=80&&rn()<0.16){const dia=Math.min(w,d)*0.9;cyl(x,z,dia,dia,h,0,styleFor(h));crown(x,z,dia,dia,h,true);return;}   // 圓柱塔
  const st=styleFor(h);box(x,z,w,d,h,0,st);
  if(h>=96&&rn()<0.5){const w3=snap(w*0.62,2),d3=snap(d*0.62,2),h3=snap(h*0.18,4);box(x,z,w3,d3,h3,h,st);L.h=h+h3;crown(x,z,w3,d3,h+h3,false);}   // 頂部退縮
  else crown(x,z,w,d,h,false);
});
G.forEach((arr,i)=>merge(arr,MATS[i],'cyBuildings'+i));
neonG.forEach((arr,i)=>merge(arr,M(NEON[i],{em:NEON[i]}),'cyNeon'));
merge(spireG,M('#2b3040'),'cySpires');merge(beaconG,M('#ff2a2a',{em:'#ff2a2a'}),'cyBeacons');

// ── 屋頂霓虹看板：面向球場
{const cand=lots.filter(L=>L.D<140&&L.h>=28&&L.h<=72&&L.w>=22).sort(()=>rn()-0.5).slice(0,14),frame=[],panels=NEON.map(()=>[]);
 cand.forEach((L,i)=>{const yaw=Math.atan2(CX-L.x,CZ-L.z),y=L.h+5.5;
   const f=MB.CreateBox('cySignF',{width:21,height:10,depth:0.5},scene);f.position.set(L.x,y,L.z);f.rotation.y=yaw;frame.push(f);
   const p=MB.CreateBox('cySignP',{width:19.4,height:8.4,depth:0.9},scene);p.position.set(L.x,y,L.z);p.rotation.y=yaw;panels[i%NEON.length].push(p);
   [-7,7].forEach(sx=>{const leg=MB.CreateBox('cySignL',{width:0.6,height:4.6,depth:0.6},scene);leg.position.set(L.x+Math.cos(yaw)*sx,L.h+2.3,L.z-Math.sin(yaw)*sx);frame.push(leg);});});
 merge(frame,M('#0a0d14'),'cySignFrames');panels.forEach((arr,i)=>merge(arr,M(NEON[i],{em:NEON[i]}),'cySignPanels'));}

// ── 路燈與車燈（沿街道，離球場 300 m 內）
{const heads=[],poles=[],carsR=[],carsW=[],carsA=[],lanes=[-7.5,-2.5,2.5,7.5];
 const near=(x,z)=>dOut(x,z)>5&&Math.hypot(x-CX,z-CZ)<300&&!(Math.abs(x-240)<24&&Math.abs(z)<20);
 const seg=(vert,C,a,b)=>{let c=0;
   for(let s=a+16;s<=b-16;s+=8,c++){
     const P=off=>vert?[C+off,s]:[s,C+off];
     if(c%6===0)[-12,12].forEach(off=>{const [x,z]=P(off);if(!near(x,z))return;
       const pl=MB.CreateBox('cyPole',{width:0.25,height:8,depth:0.25},scene);pl.position.set(x,4,z);poles.push(pl);
       const hd=MB.CreateBox('cyLamp',{width:vert?0.5:2.2,height:0.3,depth:vert?2.2:0.5},scene);hd.position.set(x,8.1,z);heads.push(hd);});
     if(rn()<0.1){const [x,z]=P(lanes[(rn()*4)|0]);if(!near(x,z))continue;
       const cb=MB.CreateBox('cyCar',{width:vert?1.5:0.25,height:0.3,depth:vert?0.25:1.5},scene);cb.position.set(x,0.7,z);const q=rn();(q<0.5?carsR:q<0.9?carsW:carsA).push(cb);}
   }};
 for(const X of XS)for(let j=0;j<ZS.length-1;j++)seg(true,X,ZS[j]+RW/2,ZS[j+1]-RW/2);
 for(const Z of ZS)for(let i=0;i<XS.length-1;i++)seg(false,Z,XS[i]+RW/2,XS[i+1]-RW/2);
 merge(poles,M('#1a1f2b'),'cyPoles');merge(heads,M('#ffd9a0',{em:'#ffd9a0'}),'cyLamps');
 merge(carsR,M('#ff2a2a',{em:'#ff2a2a'}),'cyCarsR');merge(carsW,M('#fff1d0',{em:'#fff1d0'}),'cyCarsW');merge(carsA,M('#ffb000',{em:'#ffb000'}),'cyCarsA');}
// 休息室周圍鋪一塊混凝土（高於都市地面 8 cm，避免道路線條穿過休息室地板）
put(MB.CreateBox('cyLockerPad',{width:34,height:0.2,depth:28}),240,0,0,M('#2e3340'));
}

// ================= 封閉的球員休息室（建在球場外 x=240；攝影機切換到此才看得到）=================
const roomMat=M('#26354a'),roomFloorMat=M('#384b57'),lockerBenchMat=M('#754b30'),lockerMat=M('#d8e0e9'),lockerDark=M('#182536');
put(MB.CreateBox('lockerFloor',{width:26,height:0.3,depth:18}),240,0,0,roomFloorMat);   // 頂面 0.15 m，高於都市地面(0.08)
put(MB.CreateBox('lockerBackWall',{width:26,height:7,depth:0.35}),240,3.35,9,roomMat);
put(MB.CreateBox('lockerLeftWall',{width:0.35,height:7,depth:18}),227,3.35,0,roomMat);
put(MB.CreateBox('lockerRightWall',{width:0.35,height:7,depth:18}),253,3.35,0,roomMat);
for(let i=0;i<18;i++){
 const x=228.2+(i%9)*2.95,z=i<9?7.7:-7.1;
 put(MB.CreateBox('lockerCabinet',{width:1.15,height:3.7,depth:0.55}),x,1.85,z,lockerMat);
 put(MB.CreateBox('lockerDoor',{width:0.94,height:3.35,depth:0.08}),x,1.82,z-0.31,lockerDark);
 put(MB.CreateBox('lockerVent',{width:0.55,height:0.04,depth:0.03}),x,2.45,z-0.37,M('#8494a8'));
}
for(let row=0;row<2;row++){
 put(MB.CreateBox('lockerBench',{width:21,height:0.3,depth:0.9}),240,0.72,row?1.1:-2.4,lockerBenchMat);
 put(MB.CreateBox('lockerBenchLeg',{width:20.5,height:0.65,depth:0.12}),240,0.33,row?1.1:-2.4,lockerDark);
}
ctx.setLocker({camPos:[240,12,-22],camTarget:[240,1,0],seat:p=>({x:230.2+(p.index%9)*2.45,y:0.15,z:p.team==='RED'?3.6:-4.5,s:1.05})});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).night={id:'night',name:'中央球場',build:build};
})();
