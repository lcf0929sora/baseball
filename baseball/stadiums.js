/*
 * 球場清單：賽前選完兩隊後，會依這份清單列出可選的球場。
 * 新增球場：把 stadium-xxx.js 放進同一個資料夾，再在下面多加一行 {id,name,file}。
 *   id   必須與球場 JS 註冊時用的 id 相同（window.BaseballStadiums[id]）
 *   name 選單上顯示的名稱
 *   file 球場 JS 的檔名（只能是同資料夾內的 .js）
 * 用清單檔而不是掃描資料夾，是因為瀏覽器不能列出資料夾內容，而且這樣用 file:// 直接開啟也能運作。
 */
window.BaseballStadiumList=[
  {id:'night',name:'中央球場',file:'stadium-night.js'},
  {id:'otsu',name:'乙子園球場',file:'stadium-otsu.js'},
  {id:'dream',name:'夢幻球場',file:'stadium-dream.js'},
  {id:'ocean',name:'海洋球場',file:'stadium-ocean.js'}
];
