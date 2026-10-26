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

(function(){
'use strict';
/* ─────────────────────────────────────────────────────────────────────────────
 * 乙子園球場（id: otsu）——風格：小而古典的黑土球場
 *   · 全壘打牆是「三段直線」(左翼牆－中外野牆－右翼牆)，牆面爬滿常春藤；不是圓弧。
 *   · 兩翼 98 m(321 呎)、中外野 101 m(331 呎)、左右中間角最深 106.6 m：比「中央球場」小，
 *     且高於規則要求的 250 呎下限，兩翼達到建議的 320 呎（中外野 400 呎的建議值因場地較小未達）。
 *   · 內野全黑土、沒有草坪（深褐近黑、有土塊與小石子）；外野草地沒有斜紋，只有草葉與深淺不均的草皮感。
 *   · 外野看台很小(5 階)；記分板是綠底、白框、翻牌數字的「傳統手動記分板」，不是電子記分板。
 *   · 球員休息區是凹進界外牆前的簡易棚子；另有小型封閉休息室（建在 x=240）。
 * 本檔「不」設定天空／霧／光源——那些由主程式的天氣系統決定。
 * 閱讀順序：①共用工具 ②貼圖 ③牆(三段直線) ④看台 ⑤擋球牆與休息區 ⑥記分板 ⑦休息室 ⑧登錄規則
 * ───────────────────────────────────────────────────────────────────────────── */
function build(ctx){
const {BABYLON,scene,MB,M,C,put,texMat,lpt,registerBallSolid,registerFenceCollider,sbTexInit}=ctx;
const SQ=Math.SQRT1_2;

// ═════════ ① 共用工具 ═════════
// 可重現的亂數（同一個種子每次畫出同一張貼圖）
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
// 貼圖邊緣要無縫：靠近邊緣的筆觸在對面也畫一次
const tile=(S,x,y,m,fn)=>{if(x>m&&x<S-m&&y>m&&y<S-m)return fn(0,0);for(const dx of[-S,0,S])for(const dy of[-S,0,S])fn(dx,dy);};
const newTex=(name,w,h)=>{const t=new BABYLON.DynamicTexture(name,{width:w,height:h},scene,true);t.wrapU=t.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;return t;};
const fillNoise=(g,S,rnd,r,gr,b,amp)=>{const img=g.createImageData(S,S),d=img.data;for(let i=0;i<S*S;i++){const k=1-amp+rnd()*2*amp;d[i*4]=r*k;d[i*4+1]=gr*k;d[i*4+2]=b*k;d[i*4+3]=255;}g.putImageData(img,0,0);};

// 兩點之間的一段牆：以「一個長方盒」表示（旋轉後的長方盒碰撞很準，也只佔一個碰撞物件）。
// ext＝兩端各多延伸的長度，用來蓋住轉角縫隙；fence=true 時人和球都會撞到；outfield=true 表示是全壘打牆本體。
function wallSeg(ax,az,bx,bz,h,th,mat,fence,outfield,capMat,ext){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)+(ext||0),ang=Math.atan2(-dz,dx),cx=(ax+bx)/2,cz=(az+bz)/2;   // Babylon：rotation.y=atan2(-dz,dx) 會讓盒子的 x 軸對齊 (dx,dz)
  const b=put(MB.CreateBox('xxWall',{width:len,height:h,depth:th}),cx,h/2,cz,mat);b.rotation.y=ang;
  if(fence)registerFenceCollider(b,!!outfield);
  if(capMat){const c=put(MB.CreateBox('xxCap',{width:len+0.1,height:0.2,depth:th+0.24}),cx,h+0.1,cz,capMat);c.rotation.y=ang;if(fence)registerFenceCollider(c,!!outfield);}
  return b;
}
// 看不見、只供球碰撞的方盒（看台、屋頂、記分板…）
function ghostBox(cx,cy,cz,w,h,d,ang,kind){
  const b=put(MB.CreateBox('xxHit',{width:w,height:h,depth:d}),cx,cy,cz,null);b.rotation.y=ang;b.isVisible=false;registerBallSolid(b,kind);return b;
}

// ═════════ ② 貼圖：草地、黑土、常春藤、觀眾 ═════════
// 草地：沒有斜紋；用「深淺不均的大色塊＋密集草葉＋少量枯草／三葉草」做出草地感。1024px 貼圖鋪 32 m。
function grassTexture(){
  const S=1024,t=newTex('xxGrass',S,S),g=t.getContext(),rnd=rng(11);
  fillNoise(g,S,rnd,64,134,58,0.10);
  for(let n=0;n<320;n++){const x=rnd()*S,y=rnd()*S,r=25+rnd()*95,k=rnd();   // 色塊：偏暗、偏亮、偏黃三種
    const col=k<0.4?'rgba(24,84,34,0.07)':k<0.75?'rgba(150,200,90,0.06)':'rgba(176,170,66,0.05)';
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=col;g.beginPath();g.arc(x+dx,y+dy,r,0,6.2832);g.fill();});}
  const blade=['rgba(28,92,36,0.55)','rgba(52,128,52,0.55)','rgba(92,164,70,0.5)','rgba(126,176,74,0.45)','rgba(20,70,30,0.5)'];
  for(let n=0;n<26000;n++){const x=rnd()*S,y=rnd()*S,len=5+rnd()*9,a=-1.57+(rnd()-0.5)*1.3;
    tile(S,x,y,14,(dx,dy)=>{g.strokeStyle=blade[(rnd()*blade.length)|0];g.lineWidth=0.8+rnd()*1.0;g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+Math.cos(a)*len,y+dy+Math.sin(a)*len);g.stroke();});}
  for(let n=0;n<420;n++){const x=rnd()*S,y=rnd()*S;   // 少量枯草與三葉草小點
    tile(S,x,y,6,(dx,dy)=>{g.fillStyle=n%3?'rgba(168,150,80,0.45)':'rgba(214,230,200,0.5)';g.fillRect(x+dx,y+dy,2+rnd()*2,2);});}
  t.update();return t;
}
// 黑土：深褐近黑，有土塊、小石子、耙過的細紋與濕潤的深色斑。512px 貼圖鋪 10 m。
function dirtTexture(){
  const S=512,t=newTex('xxDirt',S,S),g=t.getContext(),rnd=rng(23);
  fillNoise(g,S,rnd,60,45,37,0.16);
  for(let n=0;n<140;n++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*50,dark=rnd()<0.5;   // 乾濕不均的大斑
    tile(S,x,y,r,(dx,dy)=>{g.fillStyle=dark?'rgba(20,14,12,0.12)':'rgba(110,86,66,0.07)';g.beginPath();g.arc(x+dx,y+dy,r,0,6.2832);g.fill();});}
  for(let n=0;n<900;n++){const x=rnd()*S,y=rnd()*S,rx=1.5+rnd()*4.5,ry=rx*(0.6+rnd()*0.5),rot=rnd()*3.14;   // 土塊：暗面＋亮邊
    tile(S,x,y,8,(dx,dy)=>{g.fillStyle='rgba(28,20,16,0.55)';g.beginPath();g.ellipse(x+dx,y+dy,rx,ry,rot,0,6.2832);g.fill();
      g.fillStyle='rgba(120,96,76,0.35)';g.beginPath();g.ellipse(x+dx-0.8,y+dy-0.8,rx*0.55,ry*0.5,rot,0,6.2832);g.fill();});}
  for(let n=0;n<420;n++){const x=rnd()*S,y=rnd()*S;   // 小石子
    tile(S,x,y,4,(dx,dy)=>{g.fillStyle=n%2?'rgba(168,156,138,0.7)':'rgba(120,108,96,0.7)';g.fillRect(x+dx,y+dy,1+rnd()*2,1+rnd()*1.5);});}
  g.lineWidth=1;for(let n=0;n<70;n++){const y=rnd()*S,a=(rnd()-0.5)*0.12;g.strokeStyle='rgba(15,10,8,0.10)';g.beginPath();g.moveTo(0,y);g.lineTo(S,y+a*S);g.stroke();}   // 整地耙痕（橫向細紋）
  t.update();return t;
}
// 常春藤牆：深綠葉片堆疊＋少量紅葉。len＝這段牆的長度(m)，用 uScale 讓葉片大小在每段牆上一致。
function ivyMat(len){
  const t=newTex('xxIvy',1024,128),g=t.getContext(),rnd=rng(37+(len|0));
  g.fillStyle='#16381f';g.fillRect(0,0,1024,128);
  for(let n=0;n<2600;n++){const x=rnd()*1024,y=rnd()*128,rx=3+rnd()*5,ry=rx*0.6,rot=rnd()*3.14,k=rnd();
    const col=k<0.04?'rgb(178,66,38)':k<0.5?'rgb('+(30+rnd()*20|0)+','+(88+rnd()*36|0)+','+(40+rnd()*16|0)+')':'rgb('+(18+rnd()*14|0)+','+(58+rnd()*28|0)+','+(32+rnd()*12|0)+')';
    tile(1024,x,y,10,(dx,dy)=>{if(y+dy<-10||y+dy>140)return;g.fillStyle=col;g.beginPath();g.ellipse(x+dx,y+dy,rx,ry,rot,0,6.2832);g.fill();});}
  t.uScale=Math.max(1,len/8);t.update();
  return texMat(t,1);
}
// 觀眾：每個人＝身體(襯衫色)＋頭＋頭髮。front＝座位前面的立面(一排人)，top＝座位平面（俯視看到頭頂與肩膀）。
const CROWD_PEOPLE=14,CROWD_TW=CROWD_PEOPLE*0.5333,CROWD_ROW=0.8,CROWD_STEP=1.1;   // 貼圖橫向涵蓋 7.47 m、一排高 0.8 m、一階深 1.1 m
function crowdTextures(){
  const W=CROWD_PEOPLE*64,rnd=rng(5),shirts=['#c8d4e6','#e9ecef','#e57b5d','#4f7fb0','#6fa06a','#d8b24a','#8a6bb3','#d9d1c0','#3b4a63','#c24b57'],
    skins=['#f1c7a0','#e0ad82','#c98f63','#f6d4b4'],hairs=['#1e1a17','#2c231d','#4a3626','#8a8a8a','#10100f'];
  const front=newTex('xxCrowdF',W,96),gf=front.getContext(),top=newTex('xxCrowdT',W,132),gt=top.getContext();
  gf.fillStyle='#2b2f37';gf.fillRect(0,0,W,96);gt.fillStyle='#39414d';gt.fillRect(0,0,W,132);
  for(let i=0;i<CROWD_PEOPLE;i++){const cx=i*64+32+(rnd()-0.5)*8,sh=shirts[(rnd()*shirts.length)|0],sk=skins[(rnd()*skins.length)|0],hr=hairs[(rnd()*hairs.length)|0];
    gf.fillStyle=sh;gf.beginPath();gf.ellipse(cx,84,26,34,0,0,6.2832);gf.fill();               // 肩膀與身體
    gf.fillStyle=sk;gf.beginPath();gf.arc(cx,34,13,0,6.2832);gf.fill();                         // 頭
    gf.fillStyle=hr;gf.beginPath();gf.arc(cx,29,13.5,3.14,6.2832);gf.fill();                    // 頭髮
    gt.fillStyle=sh;gt.beginPath();gt.ellipse(cx,66,26,15,0,0,6.2832);gt.fill();gt.fillStyle=hr;gt.beginPath();gt.arc(cx,66,12,0,6.2832);gt.fill();}
  front.update();top.update();return {front,top};
}

// ═════════ ③ 地面與外野牆（三段直線）═════════
const grassTex=grassTexture(),dirtTex=dirtTexture();
ctx.makeGround(texMat(grassTex,1));                                   // 外野草地（沒有斜紋）
// infield:false＝把共用的內野草皮菱形隱藏，整個內野（半徑 27 m 的圓）全是黑土、沒有草坪。
// 需要主程式 ctx.apiVersion>=2；若是舊版主程式（沒有 apiVersion），就改把菱形貼上黑土貼圖（uScale 把 10 m 一張換算成 32 m 一張）。
const dirtMats={dirt:texMat(dirtTex,1),home:texMat(dirtTex,0.92),mound:texMat(dirtTex,1.12)};
if((ctx.apiVersion||1)>=2)dirtMats.infield=false;
else{const t2=dirtTex.clone();t2.uScale=t2.vScale=ctx.GRASS_TILE/ctx.DIRT_TILE;dirtMats.infield=texMat(t2,1);}
ctx.setFieldMats(dirtMats);

// 全壘打牆的四個頂點（x,z）：左極柱 → 左中間角 → 右中間角 → 右極柱，三段直線。
const POLE=98,POLE_X=POLE*SQ;                                          // 界外線上的牆距離 98 m（沿 45° 線）
const OF=[[-POLE_X,POLE_X],[-34,101],[34,101],[POLE_X,POLE_X]];        // 中外野牆是 z=101 的一條直線
const WALL_H=4.0,FENCE_TOP=WALL_H+0.2;                                 // 牆高 4 m＋0.2 m 壓頂
// fenceAt(角度°)：從本壘板往該方向射出一條線，回傳與三段牆相交的距離（主程式用它判斷「球有沒有飛越牆」）。
function fenceAt(deg){
  const a=Math.max(-45,Math.min(45,deg))*Math.PI/180,dx=Math.sin(a),dz=Math.cos(a);
  for(let i=0;i<3;i++){const A=OF[i],B=OF[i+1],ex=B[0]-A[0],ez=B[1]-A[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
    const t=(A[0]*ez-A[1]*ex)/den,u=(A[0]*dz-A[1]*dx)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)return t;}
  return POLE;
}
const capMat=M('#d9d4c2');
for(let i=0;i<3;i++){const A=OF[i],B=OF[i+1];wallSeg(A[0],A[1],B[0],B[1],WALL_H,0.6,ivyMat(Math.hypot(B[0]-A[0],B[1]-A[1])),true,true,capMat,0.7);}
// 界外極柱（黃色，只是外觀，不參與碰撞）
const poleMat=M('#ffd21f',{em:'#6b5300'});
[-1,1].forEach(s=>put(MB.CreateCylinder('xxPole',{diameter:0.28,height:18,tessellation:10},scene),s*POLE_X,9,POLE_X,poleMat));

// ═════════ ④ 看台（小）═════════
// 階梯式看台：沿 A→B 這條牆往外一階一階升高。每階有「立面」(貼一排人)與「踏面」(貼俯視的人頭)，合成一個 mesh；
// 再另外放看不見的碰撞方盒（每階一個）與一面後牆，讓球打到會當成「觀眾席」。法線自動指向球場外側。
const crowd=crowdTextures();
const cf=M('#000000');cf.emissiveTexture=crowd.front;cf.disableLighting=true;cf.backFaceCulling=false;
const ct=M('#000000');ct.emissiveTexture=crowd.top;ct.disableLighting=true;ct.backFaceCulling=false;
const crowdMat=new BABYLON.MultiMaterial('xxCrowd',scene);crowdMat.subMaterials=[cf,ct];
const concrete=M('#8b8f94');
function stand(ax,az,bx,bz,tiers,gap,top0,ext){
  const dx=bx-ax,dz=bz-az,L0=Math.hypot(dx,dz),ux=dx/L0,uz=dz/L0;
  let nx=uz,nz=-ux;if(nx*(ax+bx)/2+nz*(az+bz)/2<0){nx=-nx;nz=-nz;}   // 法向量：指向球場外
  const s0=-(ext||0),s1=L0+(ext||0),L=s1-s0,u1=L/CROWD_TW,pos=[],uv=[],idxR=[],idxT=[];
  const P=(s,off,y)=>pos.push(ax+ux*s+nx*off,y,az+uz*s+nz*off);
  const quad=arr=>{const n=pos.length/3-4;arr.push(n,n+1,n+2,n,n+2,n+3);};   // 把剛加入的 4 個頂點接成兩個三角形
  const vBase=top0-CROWD_ROW;
  for(let k=0;k<tiers;k++){const off=gap+k*CROWD_STEP,top=top0+k*CROWD_ROW,bot=k?top-CROWD_ROW:0;
    P(s0,off,bot);P(s1,off,bot);P(s1,off,top);P(s0,off,top);
    uv.push(0,(bot-vBase)/CROWD_ROW,u1,(bot-vBase)/CROWD_ROW,u1,(top-vBase)/CROWD_ROW,0,(top-vBase)/CROWD_ROW);quad(idxR);   // 立面
    P(s0,off,top);P(s1,off,top);P(s1,off+CROWD_STEP,top);P(s0,off+CROWD_STEP,top);
    uv.push(0,0,u1,0,u1,1,0,1);quad(idxT);}                                                                                     // 踏面
  const m=new BABYLON.Mesh('xxStand',scene),vd=new BABYLON.VertexData(),nor=[];
  vd.positions=pos;vd.indices=idxR.concat(idxT);vd.uvs=uv;BABYLON.VertexData.ComputeNormals(pos,vd.indices,nor);vd.normals=nor;vd.applyToMesh(m);
  m.material=crowdMat;m.isPickable=false;m.subMeshes=[];
  const nv=pos.length/3;new BABYLON.SubMesh(0,0,nv,0,idxR.length,m);new BABYLON.SubMesh(1,0,nv,idxR.length,idxT.length,m);
  const ang=Math.atan2(-dz,dx),mx=(ax+bx)/2,mz=(az+bz)/2;
  for(let k=0;k<tiers;k++){const off=gap+k*CROWD_STEP+CROWD_STEP/2,top=top0+k*CROWD_ROW;   // 每階的碰撞方盒
    ghostBox(mx+nx*off,top/2,mz+nz*off,L,top,CROWD_STEP+0.1,ang,'spectator');}
  const backOff=gap+tiers*CROWD_STEP+0.3,bh=top0+tiers*CROWD_ROW+1.6;                     // 看台後牆
  const bw=put(MB.CreateBox('xxStandBack',{width:L,height:bh,depth:0.6}),mx+nx*backOff,bh/2,mz+nz*backOff,concrete);bw.rotation.y=ang;registerBallSolid(bw,'spectator');
}
// 外野看台：跟在三段牆後面，只有 5 階，比「中央球場」小很多
for(let i=0;i<3;i++)stand(OF[i][0],OF[i][1],OF[i+1][0],OF[i+1][1],5,1.8,4.6,1.2);

// ═════════ ⑤ 界外牆、擋球牆、球員休息區 ═════════
const FOUL_OFF=19;                                   // 界外牆離界外線 19 m（往界外側）
const foulMat=M('#1d4a30'),stripe=M('#e7e3d3');
const homeBackZ=-20;                                  // 本壘後方擋球牆（離本壘 20 m ≥ 規則建議的 60 呎）
// 本壘後方的擋球牆＋兩側斜牆，接到界外牆起點
wallSeg(-12,homeBackZ,12,homeBackZ,3.4,0.6,foulMat,true,false,stripe,0.6);
const sides=[-1,1];
sides.forEach(s=>{
  const a=lpt(s,0,FOUL_OFF),b=lpt(s,POLE,FOUL_OFF),pole=lpt(s,POLE,0);
  wallSeg(s*12,homeBackZ,a.x,a.z,3.0,0.6,foulMat,true,false,stripe,0.6);          // 斜牆：擋球牆端點 → 界外牆起點
  wallSeg(a.x,a.z,b.x,b.z,2.8,0.6,foulMat,true,false,stripe,0.6);                  // 界外牆：與界外線平行
  wallSeg(pole.x,pole.z,b.x,b.z,2.8,0.6,foulMat,true,false,stripe,0.6);           // 端牆：從極柱橫向接到界外牆末端
  const sa=lpt(s,8,FOUL_OFF),sb=lpt(s,70,FOUL_OFF);stand(sa.x,sa.z,sb.x,sb.z,5,1.4,3.6,0);   // 界外側看台
});
stand(-12,homeBackZ,12,homeBackZ,6,1.4,4.0,2);                                       // 本壘後方看台

// 球員休息區：凹在界外牆前面的簡易棚子。前緣矮牆(o=12.5)有一個 2.6 m 的缺口，長椅靠著界外牆(o≈18)。
const DUG_R=19,DUG_FRONT=12.5,benchMat=M('#9b7a4d'),roofMat=M('#2c3a33'),slab=M('#6e7176');
sides.forEach(s=>{
  const dirX=s*SQ,dirZ=SQ;   // 界外線方向 (s*SQ, SQ)；盒子的 x 軸要對齊它
  const ang=Math.atan2(-dirZ,dirX),c=lpt(s,DUG_R,(DUG_FRONT+FOUL_OFF)/2);
  const floor=put(MB.CreateBox('xxDugFloor',{width:14,height:0.06,depth:FOUL_OFF-DUG_FRONT}),c.x,0.04,c.z,slab);floor.rotation.y=ang;
  const roof=put(MB.CreateBox('xxDugRoof',{width:14.6,height:0.18,depth:FOUL_OFF-DUG_FRONT+0.8}),c.x,2.7,c.z,roofMat);roof.rotation.y=ang;registerBallSolid(roof);
  const bn=lpt(s,DUG_R,FOUL_OFF-1.2),bench=put(MB.CreateBox('xxDugBench',{width:11,height:0.5,depth:0.7}),bn.x,0.3,bn.z,benchMat);bench.rotation.y=ang;
  const f0=lpt(s,DUG_R-7,DUG_FRONT),f1=lpt(s,DUG_R-1.3,DUG_FRONT),f2=lpt(s,DUG_R+1.3,DUG_FRONT),f3=lpt(s,DUG_R+7,DUG_FRONT);   // 前緣矮牆：左段、缺口、右段
  wallSeg(f0.x,f0.z,f1.x,f1.z,1.1,0.4,foulMat,true,false,stripe,0);
  wallSeg(f2.x,f2.z,f3.x,f3.z,1.1,0.4,foulMat,true,false,stripe,0);
});

// ═════════ ⑥ 傳統記分板（綠底、白框、翻牌數字）═════════
// 位置：中外野牆(z=101)正後方，兩根立柱撐起，板子下緣離地 6 m、不擋看台。大小 36×12 m（貼圖仍是 1536×512，比例 3:1）。
const BOARD_W=36,BOARD_H=12,BOARD_Y=6+BOARD_H/2+0.6,BOARD_Z=101.9;
const boardTex=sbTexInit();                          // 1536×512 的 DynamicTexture，主程式每次比賽狀態改變會呼叫下面的 drawBoard 重畫
const faceMat=M('#000000');faceMat.emissiveTexture=boardTex;faceMat.disableLighting=true;faceMat.backFaceCulling=false;
const face=put(MB.CreatePlane('xxBoardFace',{width:BOARD_W,height:BOARD_H,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),0,BOARD_Y,BOARD_Z-0.32,faceMat);   // 平面預設朝 -z，也就是朝向本壘板
const frame=put(MB.CreateBox('xxBoardFrame',{width:BOARD_W+1.2,height:BOARD_H+1.2,depth:0.6}),0,BOARD_Y,BOARD_Z,M('#10281a'));registerBallSolid(frame,'scoreboard');
const roofB=put(MB.CreateBox('xxBoardRoof',{width:BOARD_W+2.2,height:0.3,depth:1.6}),0,BOARD_Y+BOARD_H/2+0.9,BOARD_Z-0.3,M('#2c3a33'));registerBallSolid(roofB,'scoreboard');
[-13.5,13.5].forEach(x=>{const p=put(MB.CreateBox('xxBoardPost',{width:1.0,height:BOARD_Y,depth:1.0}),x,BOARD_Y/2,BOARD_Z+0.2,M('#3a3f45'));registerBallSolid(p,'scoreboard');});
// 畫記分板：g＝2D context，s＝比賽狀態（欄位說明見檔案最上方的指南），W×H＝貼圖尺寸。每次被呼叫都要「整張重畫」。
function drawBoard(g,s,W,H){
  const FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',NUM='"Arial Narrow","Helvetica Neue",Arial,sans-serif';
  g.fillStyle='#1a4a31';g.fillRect(0,0,W,H);
  g.fillStyle='rgba(0,0,0,0.07)';for(let x=0;x<W;x+=14)g.fillRect(x,0,3,H);                    // 木板直紋
  g.strokeStyle='#efece0';g.lineWidth=9;g.strokeRect(10,10,W-20,H-20);                         // 白色外框
  const NX=34,NW=300,IX=NX+NW,IW=88,RX=IX+9*IW+20,RW=100,HY=34,HH=66,R1=HY+HH+8,RH=104,R2=R1+RH+6;
  const plate=(x,y,w,h,txt,size,col)=>{g.fillStyle='#0b0f0d';g.fillRect(x+4,y+4,w-8,h-8);g.strokeStyle='#efece0';g.lineWidth=2;g.strokeRect(x+4,y+4,w-8,h-8);   // 翻牌：黑底白字
    g.fillStyle=col||'#f7f4e8';g.font='bold '+size+'px '+NUM;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,x+w/2,y+h/2+2);};
  g.strokeStyle='#efece0';g.lineWidth=3;                                                       // 白色格線
  for(let i=0;i<=9;i++){g.beginPath();g.moveTo(IX+i*IW,HY);g.lineTo(IX+i*IW,R2+RH);g.stroke();}
  for(let i=0;i<=3;i++){g.beginPath();g.moveTo(RX+i*RW,HY);g.lineTo(RX+i*RW,R2+RH);g.stroke();}
  [HY,R1,R2,R2+RH].forEach(y=>{g.beginPath();g.moveTo(NX,y);g.lineTo(RX+3*RW,y);g.stroke();});
  g.fillStyle='#efece0';g.font='bold 44px '+NUM;g.textAlign='center';g.textBaseline='middle';
  for(let i=0;i<9;i++){const n=s.first+i,cur=!s.gameOver&&n===s.inn;g.fillStyle=cur?'#ffd84a':'#efece0';g.fillText(String(n),IX+i*IW+IW/2,HY+HH/2+2);}
  g.fillStyle='#efece0';['R','H','E'].forEach((t,i)=>g.fillText(t,RX+i*RW+RW/2,HY+HH/2+2));
  g.textAlign='left';g.font='bold 22px '+FONT;g.fillText('球隊',NX+16,HY+HH/2+2);
  [['me',R1,'#d8323a'],['cpu',R2,'#2f6fe0']].forEach(([key,y,col])=>{
    g.fillStyle=col;g.fillRect(NX+6,y+14,14,RH-28);                                            // 隊色條
    let nm=String(s.names[key]||key);if(nm.length>6)nm=nm.slice(0,6);
    g.fillStyle='#f7f4e8';g.font='bold '+(nm.length>4?44:54)+'px '+FONT;g.textAlign='left';g.textBaseline='middle';g.fillText(nm,NX+32,y+RH/2+2);
    for(let i=0;i<9;i++){const n=s.first+i;if(!s.played(key,n))continue;                         // 還沒打到的局保持空白綠板
      const v=(s.lineScore[key]||[])[n-1];plate(IX+i*IW,y,IW,RH,v==null?'0':String(v),60,s.current(key,n)?'#ffd84a':null);}
    plate(RX,y,RW,RH,String(s.score[key]),64);plate(RX+RW,y,RW,RH,String(s.hits[key]),60);plate(RX+2*RW,y,RW,RH,String(s.errors[key]),60);});
  // 下排：BSO 燈（B 綠、S 黃、O 紅）、壘上跑者、打者
  const by=R2+RH+66;g.textBaseline='middle';
  [['B',s.balls,3,'#53e08a'],['S',s.strikes,2,'#ffd84a'],['O',s.outs,2,'#ff4a3a']].forEach(([lab,n,max,col],r)=>{
    const x0=NX+16+r*210;g.fillStyle='#efece0';g.font='bold 46px '+NUM;g.textAlign='left';g.fillText(lab,x0,by);
    for(let i=0;i<max;i++){g.beginPath();g.arc(x0+66+i*50,by,19,0,6.2832);g.fillStyle=i<n?col:'#0c2616';g.fill();g.strokeStyle='#efece0';g.lineWidth=3;g.stroke();}});
  const dx0=NX+16+3*210+40;[[1,0],[0,-1],[-1,0]].forEach(([ox,oy],i)=>{const cx=dx0+ox*34+34,cy=by+oy*22;g.save();g.translate(cx,cy);g.rotate(Math.PI/4);   // 壘上跑者菱形
    g.fillStyle=s.bases[i]?'#ffd84a':'#0c2616';g.fillRect(-12,-12,24,24);g.strokeStyle='#efece0';g.lineWidth=3;g.strokeRect(-12,-12,24,24);g.restore();});
  g.textAlign='right';g.fillStyle='#efece0';g.font='bold 34px '+FONT;
  g.fillText(s.gameOver?'比賽結束':((s.batTeam==='me'?'▲ ':'▼ ')+'打擊 '+s.batter),W-44,by);
}
ctx.setScoreboardRenderer(drawBoard);

// ═════════ ⑦ 封閉球員休息室（建在 x=240，遠離球場；切換到休息室視角才看得到）═════════
{
  const wall=M('#cfc8b4'),floorM=M('#6b6258'),lockerM=M('#35506b'),bench=M('#8a6b43');
  put(MB.CreateBox('xxLockFloor',{width:34,height:0.2,depth:16}),240,0.1,0,floorM);
  put(MB.CreateBox('xxLockBack',{width:34,height:7,depth:0.4}),240,3.5,8.2,wall);
  [-17,17].forEach(x=>put(MB.CreateBox('xxLockSide',{width:0.4,height:7,depth:16}),240+x,3.5,0,wall));
  put(MB.CreateBox('xxLockCeil',{width:34,height:0.3,depth:16}),240,7,0,wall);
  for(let i=0;i<10;i++){put(MB.CreateBox('xxLocker',{width:2.4,height:4.2,depth:1.2}),224.6+i*3.4,2.1,7.4,lockerM);
    put(MB.CreateBox('xxLockSeat',{width:2.6,height:0.45,depth:0.9}),224.6+i*3.4,0.4,5.8,bench);}
}
ctx.setLocker({camPos:[240,12,-22],camTarget:[240,1,0],seat:p=>({x:230.2+(p.index%9)*2.45,y:0,z:p.team==='RED'?3.6:-4.5,s:1.05})});

// ═════════ ⑧ 休息區位置契約＋全壘打規則 ═════════
ctx.setDugouts({
  E:s=>lpt(s,DUG_R,DUG_FRONT-1.4),                         // 前緣矮牆外側
  T:s=>lpt(s,DUG_R,FOUL_OFF-3.2),                          // 棚內、長椅前
  gate:(s,j,inside)=>lpt(s,DUG_R+j,inside?DUG_FRONT+2.4:DUG_FRONT-1.4),   // 前緣缺口的內／外側點
  seat:(s,i)=>{const p=lpt(s,DUG_R-5+(i%9)*1.25,i%3===0?FOUL_OFF-1.2:(i%3===1?FOUL_OFF-3.0:FOUL_OFF-4.2));   // 坐長椅或站在棚內
    return {x:p.x,y:i%3===0?0.55:0,z:p.z,ry:s===-1?Math.PI/4:-Math.PI/4,scale:i%3===0?[0.82,0.72,0.82]:null};}
});
ctx.setRules({fenceR:101,fenceH:FENCE_TOP,arcDeg:45,simLimit:140,fenceAt});
}
(window.BaseballStadiums=window.BaseballStadiums||{}).otsu={id:'otsu',name:'乙子園球場',build:build};
})();
