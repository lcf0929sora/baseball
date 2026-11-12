/*
 * 球場清單：賽前選完兩隊後，會依這份清單列出可選的球場。
 * 新增球場：把 stadium-xxx.js 放進同一個資料夾，再在下面多加一行 {id,name,file}。
 *   id   必須與球場 JS 註冊時用的 id 相同（window.BaseballStadiums[id]）
 *   name 選單上顯示的名稱
 *   nameEn（選填）英文名稱：語言設定為 English 時優先顯示；沒寫就顯示 name
 *   file 球場 JS 的檔名（只能是同資料夾內的 .js）
 *   opening（選填）開場音樂：進入環繞空拍畫面時漸入開始播，第一棒打者出現時漸出停止。受設定內「音樂」開關控制。
 *   ambient（選填）現場環境噪音：進入環繞空拍畫面起循環播放到離開比賽，首尾交疊（約 3 秒）漸入漸出，聽不出接縫。受設定內「觀眾音效」開關控制。
 *     兩者都可寫單一路徑，或「同一首的多種格式」陣列，例如 ['crowd.ogg','crowd.m4a','crowd.mp3']：
 *     依瀏覽器支援挑第一個能播的（mp3／ogg／m4a／aac／wav／opus／flac／webm 都可）。
 *     路徑相對於這個資料夾（./baseball/），也可寫 http(s):// 或 ./ ../ / 開頭的路徑。沒寫或檔案讀不到＝沒有聲音。
 * 用清單檔而不是掃描資料夾，是因為瀏覽器不能列出資料夾內容，而且這樣用 file:// 直接開啟也能運作。
 */
window.BaseballStadiumList=[
  {id:'night',name:'中央球場',nameEn:'Central Stadium',file:'stadium-night.js',
   opening:'opening.mp3',   // 開場音樂（改成你的檔名；也可寫陣列 ['a.ogg','a.m4a'] 提供多種格式）
   ambient:'crowd.m4a'},   // 現場環境噪音（循環、交疊漸入漸出）
  {id:'otsu',name:'乙子園球場',nameEn:'Otsushien Stadium',file:'stadium-otsu.js',
   opening:'opening.mp3',   // 開場音樂（改成你的檔名；也可寫陣列 ['a.ogg','a.m4a'] 提供多種格式）
   ambient:'crowd.m4a'},   // 現場環境噪音（循環、交疊漸入漸出）
  {id:'dream',name:'夢幻球場',nameEn:'Dream Stadium',file:'stadium-dream.js',
   opening:'opening.mp3',   // 開場音樂（改成你的檔名；也可寫陣列 ['a.ogg','a.m4a'] 提供多種格式）
   ambient:'crowd.m4a'},   // 現場環境噪音（循環、交疊漸入漸出）
  {id:'ocean',name:'海洋球場',nameEn:'Ocean Stadium',file:'stadium-ocean.js',
   opening:'opening.mp3',   // 開場音樂（改成你的檔名；也可寫陣列 ['a.ogg','a.m4a'] 提供多種格式）
   ambient:'crowd.m4a'},   // 現場環境噪音（循環、交疊漸入漸出）
  {id:'colosseum',name:'羅馬競技場球場',nameEn:'Roman Colosseum Stadium',file:'stadium-colosseum.js',
   opening:'opening.mp3',   // 開場音樂（改成你的檔名；也可寫陣列 ['a.ogg','a.m4a'] 提供多種格式）
   ambient:'crowd.m4a'},   // 現場環境噪音（循環、交疊漸入漸出）
  {id:'istanbul',name:'伊斯坦堡清真寺球場',nameEn:'Istanbul Mosque Stadium',file:'stadium-istanbul.js',
   opening:'opening.mp3',   // 開場音樂（改成你的檔名；也可寫陣列 ['a.ogg','a.m4a'] 提供多種格式）
   ambient:'crowd.m4a'},   // 現場環境噪音（循環、交疊漸入漸出）
  {id:'war',name:'戰爭球場（被炸毀的廢墟）',nameEn:'War Stadium (Bombed-Out Ruins)',file:'stadium-war.js',
   opening:'opening.mp3'},   // 開場音樂；沒有觀眾，所以不設 ambient（人群噪音不適合）。想要戰場環境音（風聲、遠處爆炸）的話，加一行 ambient:'你的檔名.m4a'
  {id:'zhubei',name:'竹北球場（遠百旁）',nameEn:'Zhubei Stadium (Next to Far Eastern Dept. Store)',file:'stadium-zhubei.js',
   opening:'opening.mp3',   // 開場音樂
   ambient:'crowd.m4a'}   // 現場環境噪音（循環、交疊漸入漸出）
];
