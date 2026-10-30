/* ═══════════════════════════════════════════════════════════════════════════
 * cheerleaders.js — 啦啦隊外掛（放在 ./baseball/cheerleaders.js）
 *
 * 主程式只在「目前球場有 cheerSlots 站位」而且「這支 JS 載入成功」時才會呼叫 attach()；任何一邊缺少就沒有啦啦隊。
 * 啦啦隊的外觀（女生裝扮：高馬尾＋蝴蝶結、短版上衣＋百褶裙＋短襪運動鞋、手持彩球）與舞蹈動作都在這個檔案裡。
 *
 * 介面：
 *   window.BaseballCheerleaders.attach(BABYLON, scene, slots, opts) → handle
 *     slots：球場提供的站位 [{side,row,x,y,z,ry}]（y＝台面高度、ry＝面向場內的弧度）
 *     opts ：{color:'#rrggbb'}  主場球隊制服色（上衣、裙子、彩球都用這個顏色）
 *   handle.setColor(hex)   換隊／換制服色時重新上色（所有人共用材質，不必重建）
 *   handle.update(dt)      每個畫面呼叫一次（dt 單位：秒）；驅動舞蹈
 *   handle.excite(sec)     場上有好球（安打、全壘打…）時讓舞蹈更激動 sec 秒（選用）
 *   handle.setEnabled(on)  顯示／隱藏
 *   handle.dispose()       清除所有網格、材質
 *
 * 舞蹈（每段 4 拍，BPM 126，八段一輪、約 15 秒）：
 *   0 V 字彩球：雙手舉成 V 字上下擺，每拍屈膝彈跳
 *   1 波浪擺動：雙手高舉左右擺，身體跟著傾斜，前後排差半拍形成波浪
 *   2 交叉踏步：雙手胸前交叉擊掌，左右併步＋踢腿
 *   3 轉圈收尾：跳躍＋原地轉一圈，最後雙手高舉定格
 *   段與段之間用 0.5 拍平滑過渡，全隊動作一致（只有波浪段前後排有時間差）
 * ═══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const BPM=126,SEG_BEATS=4,SEQ=[0,1,2,1,0,2,1,3],BLEND=0.5;
const TAU=Math.PI*2,sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
// 姿勢向量欄位：左臂(外展,前舉,肘彎) 右臂(外展,前舉,肘彎) 屈膝 跳躍 身體側傾 轉身 頭歪 平移 左腿踢 右腿踢 嘴巴張開
const K={lA:0,lF:1,lE:2,rA:3,rF:4,rE:5,dip:6,hop:7,roll:8,turn:9,tilt:10,shift:11,kL:12,kR:13,mouth:14,N:15};

// ── 四段舞蹈：loc＝段內拍數 0~4，f＝這個人（row：0 前排／1 後排）；回傳姿勢向量 ──
const DANCES=[
 // 0 V 字彩球
 (loc,f)=>{const p=new Array(K.N).fill(0),ph=loc*TAU,pump=Math.sin(ph);
  p[K.lA]=p[K.rA]=2.25+0.3*pump;p[K.lF]=p[K.rF]=-0.15;p[K.lE]=p[K.rE]=0.25+0.15*(1-pump);
  p[K.dip]=0.05*(0.5-0.5*Math.cos(ph));p[K.hop]=0.05*Math.abs(Math.sin(ph/2));
  p[K.tilt]=0.08*Math.sin(ph/2);p[K.mouth]=1;return p;},
 // 1 波浪擺動（後排慢半拍）
 (loc,f)=>{const p=new Array(K.N).fill(0),s=Math.sin((loc-0.5*f.row)*Math.PI);
  p[K.rA]=2.55-0.5*s;p[K.lA]=2.55+0.5*s;p[K.lF]=p[K.rF]=-0.1;p[K.lE]=p[K.rE]=0.15;
  p[K.roll]=0.14*s;p[K.shift]=0.1*s;p[K.tilt]=-0.12*s;p[K.dip]=0.03*(0.5+0.5*Math.cos(loc*TAU));
  p[K.mouth]=0.4;return p;},
 // 2 交叉踏步
 (loc,f)=>{const p=new Array(K.N).fill(0),s=Math.sin(loc*Math.PI),c=Math.cos(loc*TAU*1);
  const cl=0.5+0.5*Math.cos(loc*TAU*2);   // 每半拍擊掌一次
  p[K.lA]=p[K.rA]=0.35+0.35*cl;p[K.lF]=p[K.rF]=-(0.9+0.35*cl);p[K.lE]=p[K.rE]=1.15-0.35*cl;
  p[K.shift]=0.2*s;p[K.roll]=-0.08*s;p[K.kL]=0.35*Math.max(0,-s);p[K.kR]=0.35*Math.max(0,s);
  p[K.dip]=0.045*(0.5-0.5*Math.cos(loc*TAU*2));p[K.tilt]=0.1*s;p[K.mouth]=0.7;return p;},
 // 3 轉圈收尾
 (loc,f)=>{const p=new Array(K.N).fill(0),ph=loc*TAU,sp=sm((loc-1)/2);
  p[K.lA]=p[K.rA]=2.45+0.2*Math.sin(ph*2);p[K.lF]=p[K.rF]=-0.1;p[K.lE]=p[K.rE]=0.2;
  p[K.turn]=(f.row?-1:1)*TAU*sp;
  p[K.hop]=loc<3?0.1*Math.abs(Math.sin(loc*Math.PI)):0.03*Math.abs(Math.sin(ph*2));
  p[K.dip]=loc>=3?0.04*(0.5-0.5*Math.cos(ph*2)):0.03*(0.5-0.5*Math.cos(ph));
  p[K.mouth]=1;return p;}
];
// 取得第 b 拍（全域）的姿勢：本段姿勢與上一段延續後的姿勢做 0.5 拍平滑過渡（轉身角不混合，轉完 = 2π ≡ 0）
function poseAt(b,f,boost){
 const seg=Math.floor(b/SEG_BEATS),loc=b-seg*SEG_BEATS,n=SEQ.length,cur=SEQ[((seg%n)+n)%n],prv=SEQ[(((seg-1)%n)+n)%n];
 const a=DANCES[cur](loc,f),w=1-sm(loc/BLEND);
 if(w>0){const o=DANCES[prv](loc+SEG_BEATS,f);for(let i=0;i<K.N;i++)if(i!==K.turn)a[i]=a[i]*(1-w)+o[i]*w;}
 if(boost>0){a[K.hop]+=0.04*boost*Math.abs(Math.sin(b*Math.PI));a[K.lA]+=0.15*boost;a[K.rA]+=0.15*boost;}
 return a;
}

function attach(BABYLON,scene,slots,opts){
 opts=opts||{};
 const V3=BABYLON.Vector3,MB=BABYLON.MeshBuilder,mats={},srcs={},all=[],nodes=[];
 // ── 共用材質（所有人共用 → 換隊色只改 main／trim 兩顆）──
 const mat=(k,hex)=>{const m=new BABYLON.StandardMaterial('xxCheer_'+k,scene);m.specularColor=new BABYLON.Color3(0,0,0);mats[k]=m;setMat(m,hex);return m;};
 const setMat=(m,hex)=>{const c=BABYLON.Color3.FromHexString(hex);m.diffuseColor=c;m.emissiveColor=c.scale(0.18);};
 mat('skin','#f7d0ae');mat('hair','#3b2417');mat('main','#d8323a');mat('trim','#ffffff');
 mat('eye','#1b1b24');mat('blush','#ff9aa8');mat('lip','#d8444f');mat('shine','#ffffff');
 // 來源網格（隱藏）＋每人用 createInstance（30 人 × 約 40 個零件也只是少數 draw call）
 const src=(key,build,m)=>{const k=key+'|'+m;if(!srcs[k]){const s=build();s.material=mats[m];s.isVisible=false;s.isPickable=false;srcs[k]=s;all.push(s);}return srcs[k];};
 const sph=()=>MB.CreateSphere('xxCheerS',{diameter:1,segments:10},scene);
 const cyl=()=>MB.CreateCylinder('xxCheerC',{diameter:1,height:1,tessellation:14},scene);
 const box=()=>MB.CreateBox('xxCheerB',{size:1},scene);
 const ico=()=>MB.CreateIcoSphere('xxCheerP',{radius:0.5,subdivisions:2,flat:true},scene);
 const skirtM=()=>MB.CreateCylinder('xxCheerSk',{diameterTop:0.30,diameterBottom:0.58,height:1,tessellation:20},scene);
 const topM=()=>MB.CreateCylinder('xxCheerTp',{diameterTop:0.34,diameterBottom:0.26,height:1,tessellation:16},scene);
 const lum=hex=>{const c=BABYLON.Color3.FromHexString(hex);return 0.3*c.r+0.59*c.g+0.11*c.b;};

 function figure(slot,idx){
  const f={row:slot.row?1:0,idx,roll:0};
  const root=new BABYLON.TransformNode('xxCheerFig',scene);root.position.set(slot.x,slot.y,slot.z);root.rotation.y=slot.ry;nodes.push(root);
  const node=(parent,x,y,z)=>{const n=new BABYLON.TransformNode('xxCheerN',scene);n.parent=parent;n.position.set(x,y,z);nodes.push(n);return n;};
  const part=(parent,kind,m,x,y,z,sx,sy,sz)=>{const s=src(kind.name,kind,m),i=s.createInstance('xxCheerI');i.parent=parent;i.position.set(x,y,z);i.scaling.set(sx,sy,sz);i.isPickable=false;all.push(i);return i;};
  const pv=f.pivot=node(root,0,0,0);                       // 位移／跳躍／轉身
  const B=0.58;                                            // 髖高
  // 腿＋短襪＋運動鞋
  f.hip=[-1,1].map(sd=>{const h=node(pv,sd*0.085,B,0);
    part(h,cyl,'skin',0,-B/2,0,0.1,B,0.1);part(h,cyl,'trim',0,-B+0.09,0,0.118,0.17,0.118);part(h,box,'trim',0,-B+0.035,0.035,0.13,0.07,0.22);return h;});
  const body=f.body=node(pv,0,B,0);                        // 上半身（可側傾、屈膝下沉）
  part(body,skirtM,'main',0,0.67-B,0,1,0.24,1);part(body,cyl,'trim',0,0.545-B,0,0.585,0.028,0.585);   // 百褶裙＋白色下襬
  part(body,cyl,'skin',0,0.82-B,0,0.22,0.09,0.22);                                                      // 肚臍裝腰身
  part(body,topM,'main',0,0.99-B,0,1,0.26,1);part(body,cyl,'trim',0,0.875-B,0,0.275,0.03,0.275);       // 短版上衣＋白邊
  part(body,cyl,'trim',0,1.1-B,0,0.30,0.025,0.30);
  // 手臂＋彩球
  f.arm=[-1,1].map(sd=>{const sh=node(body,sd*0.175,1.07-B,0),el=node(sh,0,-0.2,0);
    part(sh,sph,'main',0,0,0,0.11,0.11,0.11);part(sh,cyl,'skin',0,-0.1,0,0.075,0.2,0.075);
    part(el,cyl,'skin',0,-0.1,0,0.068,0.2,0.068);part(el,sph,'skin',0,-0.2,0,0.09,0.09,0.09);
    const pm=node(el,0,-0.27,0);part(pm,ico,'main',0,0,0,0.3,0.3,0.3);part(pm,ico,'trim',0,0.05,0,0.2,0.2,0.2);
    return {sh,el,pm};});
  // 頭：臉＋固定髮型（高馬尾＋瀏海＋蝴蝶結）
  const hd=f.head=node(body,0,1.36-B,0);
  part(hd,sph,'skin',0,0,0,0.5,0.5,0.5);
  part(hd,sph,'hair',0,0.04,-0.05,0.55,0.54,0.5);                       // 後腦＋頭頂的頭髮
  part(hd,sph,'hair',0,0.19,0.1,0.42,0.17,0.3);                         // 瀏海
  [-1,1].forEach(sd=>{part(hd,sph,'hair',sd*0.215,0.02,0.07,0.1,0.26,0.14);   // 兩側鬢髮
    part(hd,sph,'eye',sd*0.1,0.0,0.222,0.055,0.075,0.03);part(hd,sph,'shine',sd*0.1+0.012,0.022,0.238,0.02,0.02,0.01);   // 眼睛＋高光
    part(hd,sph,'blush',sd*0.155,-0.07,0.19,0.07,0.04,0.03);});                // 腮紅
  f.mouth=part(hd,sph,'lip',0,-0.1,0.235,0.06,0.025,0.02);
  const pony=f.pony=node(hd,0,0.24,-0.2);
  part(pony,sph,'hair',0,-0.22,0,0.17,0.46,0.17);part(pony,sph,'hair',0,-0.46,0,0.13,0.2,0.13);
  const bow=node(hd,0,0.255,-0.17);part(bow,sph,'trim',0,0,0,0.06,0.06,0.06);
  [-1,1].forEach(sd=>{const l=part(bow,sph,'trim',sd*0.075,0,0,0.12,0.075,0.05);l.rotation.z=sd*0.35;});
  return f;
 }
 const figs=slots.map((s,i)=>figure(s,i));
 let t=0,boost=0,color=opts.color||'#d8323a';
 function setColor(hex){color=hex||color;setMat(mats.main,color);setMat(mats.trim,lum(color)>0.82?'#1d2433':'#ffffff');}
 setColor(color);
 const bob=new V3(0,0,0);
 function pose(f,p,b){
  f.pivot.position.set(p[K.shift],p[K.hop],0);f.pivot.rotation.y=p[K.turn];
  f.body.position.y=0.58-p[K.dip];f.body.rotation.z=p[K.roll];
  const sy=(0.58-p[K.dip])/0.58;f.hip[0].position.y=f.hip[1].position.y=0.58-p[K.dip];f.hip[0].scaling.y=f.hip[1].scaling.y=sy;
  f.hip[0].rotation.x=-p[K.kL];f.hip[1].rotation.x=-p[K.kR];
  // 左臂（sd=-1）外展角取負；彩球微晃（肘 ± 0.12 rad @ 4 倍速）
  const sh=Math.sin(b*TAU*2)*0.12;
  f.arm[0].sh.rotation.set(p[K.lF],0,-p[K.lA]);f.arm[0].el.rotation.x=-(p[K.lE]+sh);
  f.arm[1].sh.rotation.set(p[K.rF],0,p[K.rA]);f.arm[1].el.rotation.x=-(p[K.rE]-sh);
  f.head.rotation.z=p[K.tilt];f.head.rotation.x=0.04*Math.sin(b*TAU);
  f.pony.rotation.x=0.28+0.2*Math.sin(b*TAU-0.8)+p[K.hop]*2;f.pony.rotation.z=-p[K.roll]*1.5-p[K.tilt]*0.6+0.25*Math.sin(p[K.turn]);
  f.mouth.scaling.y=0.025+0.045*p[K.mouth]*(0.5+0.5*Math.sin(b*TAU*2));
 }
 const H={
  setColor,
  update(dt){
   boost=Math.max(0,boost-dt*0.5);const tempo=1+0.12*Math.min(1,boost);t+=dt*tempo;
   const b=t*BPM/60;for(const f of figs)pose(f,poseAt(b,f,Math.min(1,boost)),b);
  },
  excite(sec){boost=Math.max(boost,Math.min(1,sec/2)*1);boost=Math.max(boost,sec);if(boost>2)boost=2;},
  setEnabled(on){nodes.forEach(n=>n.setEnabled(!!on));},
  dispose(){figs.length=0;all.forEach(m=>{try{m.dispose(false,false);}catch(e){}});nodes.forEach(n=>{try{n.dispose(false,false);}catch(e){}});Object.values(mats).forEach(m=>m.dispose());all.length=0;nodes.length=0;},
  count:figs.length
 };
 H.update(0);
 return H;
}
window.BaseballCheerleaders={attach,version:1};
})();
