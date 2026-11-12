/*
 * 英文語言包（選填）：沒有這個檔案時，英文模式只會有 teams.js／stadiums.js 的英文名稱，其餘介面維持中文。
 * 遊戲內部全部用中文字串運作；英文模式是在「顯示」這一層把中文翻成英文（畫面文字、aria-label、計分板、語音播報）。
 * 想改某句英文：在 exact／pieces 裡找到那句中文，改右邊即可。
 *   exact  整句完全相同才套用（優先）
 *   rules  [正規表示式, 取代字串或函式]，依序對整段文字全域套用（處理「第 N 局」「N 勝 M 敗」這類有數字的句子）
 *   pieces 片段字典：由長到短逐一取代（長度 ≥ 2 才會當片段）；最後再把全形標點轉成半形
 */
(function(){
const BASE={'一':'1st','二':'2nd','三':'3rd','本':'home'};
const BASEW={'一':'first','二':'second','三':'third','本':'home'};
const WK={'日':'Sun','一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat'};
const exact={
// ── 單字（只能整句比對）
'一':'1B','二':'2B','三':'3B','投':'P','捕':'C','游':'SS','左':'LF','中':'CF','右':'RF',
'早':'Early','晚':'Late','開':'On','關':'Off','勝':'W','敗':'L','失':'RA','得':'RS','賽':'G','連':'Strk','局':'IP','休':'Off','主':'Home','客':'Away',
'低':'low','高':'high','內':'inside','外':'outside','球':'Ball',
// ── 位置
'投手':'Pitcher','捕手':'Catcher','一壘手':'1B','二壘手':'2B','三壘手':'3B','游擊手':'SS','左外野手':'LF','中外野手':'CF','右外野手':'RF','外野手':'OF','替補':'Sub','後備':'Reserve','打者':'Batter',
'一壘':'1st Base','二壘':'2nd Base','三壘':'3rd Base','主審':'Home plate umpire','一壘審':'1st base umpire','二壘審':'2nd base umpire','三壘審':'3rd base umpire',
// ── 選單與設定
'球來就打':'Swing Away','夜空之下　一球入魂':'Under the night sky, every pitch counts','請選擇遊戲模式':'Select a game mode','單場遊戲':'Single Game','聯盟聯賽':'League Season',
'選擇球隊':'Select Team','選擇球場':'Select Stadium','返回模式選擇':'Back to Mode Select','返回選擇球隊':'Back to Team Select','返回聯賽':'Back to League','返回比賽':'Back to Game',
'下一步：選擇球場':'Next: Choose Stadium','下一步':'Next','上一步':'Back','開始比賽':'Start Game','開始聯賽':'Start League','完成':'Done','設定':'Settings','選單':'Menu','開啟選單':'Open menu','關閉設定':'Close settings','關閉':'Close','取消':'Cancel','確定':'OK',
'聯盟聯賽：選擇你的球隊':'League Season: Choose Your Team','聯盟聯賽：選擇球隊':'League Season: Choose Team','聯盟聯賽：賽事設定':'League Season: Game Setup','聯盟聯賽：選擇你的球隊（左鍵選取、右鍵取消）':'League Season: Choose your team (left-click to select, right-click to cancel)',
'聯盟聯賽存檔':'League save data','比賽局數':'Innings per game','比賽場次':'Rounds','聯盟戰績':'Standings','賽程（你的球隊）':'Schedule (your team)','球員排行榜':'Player leaders','球隊球員成績':'Team player stats','各隊球員成績':'Player stats by team','聯賽主畫面':'League hub',
'離開聯賽（自動存檔）':'Leave league (auto-saved)','點欄位標題可排序':'Click a column header to sort','聲音':'Sound','擊球後視角（俯角）':'After-hit camera (pitch angle)','擊球後視角選擇':'After-hit camera angle',
'音樂（應援曲）':'Music (cheer songs)','音效（揮棒、擊球）':'Sound effects (swing, hit)','觀眾音效（尖叫聲、現場環境音）':'Crowd sounds (cheers, ambience)','音樂開關':'Music switch','音效開關':'Sound effects switch','觀眾音效開關':'Crowd sounds switch',
'音效':'Sound','靜音':'Muted','語言 / Language':'Language','進入球員休息室視角':'Enter locker room view','返回球場視角':'Back to field view','球員名單／數據':'Roster / Stats','球員名單與數據':'Rosters and Stats','關閉球員數據':'Close player stats',
'擊球後鏡頭相對地面的俯角：15° 接近平視、90° 為正上方俯視。預設 45°。不論角度，球飛到外野時都會停在畫面中央。':'Camera angle above the ground after a hit: 15° is nearly level, 90° is straight down. Default 45°. Whatever the angle, the ball stays centered when it flies to the outfield.',
'音樂：應援曲與出局曲。音效：揮棒、擊球、接球等一般音效。觀眾音效：高飛球、三振、得分、安打、全壘打、贏球的尖叫聲與歡呼，以及球場的現場環境噪音（循環）。音樂另含各球場的開場音樂（進入空拍到第一棒出現）。音檔由球隊 JSON 指定，沒定義或找不到檔案就沒有聲音。':'Music: cheer songs and out jingles. Sound effects: swing, hit, glove catch and other general sounds. Crowd sounds: cheers for fly balls, strikeouts, runs, hits, home runs and wins, plus looping stadium ambience. Music also includes each stadium\'s opening music (from the aerial shot until the first batter appears). Audio files are set in the team data; if undefined or missing, there is no sound.',
'聯賽存檔放在這個瀏覽器的 localStorage（每個聯盟一份）。有存檔時，按「聯盟聯賽」會直接進入聯賽畫面；要重新選隊請在這裡刪除存檔。':'League saves are kept in this browser\'s localStorage (one per league). When a save exists, "League Season" goes straight to the league screen; to pick a different team, delete the save here.',
'球員目前使用相同的能力值，但姓名、出賽與累積數據各自獨立。打擊率 AVG＝H/AB；上壘率 OBP＝(H+BB+HBP)/(AB+BB+HBP+SF)；長打率 SLG＝(1B+2×2B+3×3B+4×HR)/AB；投手 ERA＝ER×9/IP，WHIP＝(BB+H)/(IP)。數據會在比賽事件發生時更新。':'Players currently share the same ability values, but names, appearances and cumulative stats are tracked separately. AVG = H/AB; OBP = (H+BB+HBP)/(AB+BB+HBP+SF); SLG = (1B+2×2B+3×3B+4×HR)/AB; pitcher ERA = ER×9/IP, WHIP = (BB+H)/IP. Stats update as game events happen.',
'觸擊：按住右鍵擺出觸擊姿勢（框跟著滑鼠）　←→／A D 選擇打球方向　放開收棒':'Bunt: hold the right button to square around (the box follows the mouse)  ←→ / A D picks the direction  release to pull back',
'風速':'Wind speed','風向':'Wind dir','主場':'Home game','客場':'Away game',
// ── 畫面 aria
'打擊畫面，點擊揮棒':'Batting view, click to swing','目前打者與投手資訊':'Current batter and pitcher info','壘包與跑者位置':'Bases and runners','主隊隊徽':'Home team logo','客隊隊徽':'Away team logo','賽前先發名單':'Starting lineups','賽前球場選擇':'Stadium selection','賽前球隊選擇':'Team selection','跑壘戰術':'Baserunning tactics','選擇遊戲模式':'Select game mode',
'一壘手視角（點擊牽制一壘）':'First baseman view (click to pick off at 1st)','二壘手視角（點擊牽制二壘）':'Second baseman view (click to pick off at 2nd)','三壘手視角（點擊牽制三壘）':'Third baseman view (click to pick off at 3rd)',
// ── 戰術
'戰術 ▾':'Tactics ▾','戰術 ▴':'Tactics ▴','全員積極盜壘':'All: aggressive steal','全員盜壘':'All steal','積極盜壘':'Aggressive steal','預備積極盜壘（提早起跑）':'Aggressive steal ready (early jump)','預備盜壘（投手一動就跑）':'Steal ready (go on pitcher motion)','雙擊／右鍵＝盜壘　Shift＋雙擊／右鍵＝積極盜壘':'Double-click / right-click = steal   Shift = aggressive steal','守備位置':'Fielding positions','拖曳野手到指定位置':'Drag fielders to positions','已回到標準守備位置':'Back to standard positions','後退 ▼':'Back ▼','趨前 ▲':'In ▲','預設位置':'Default','內野':'Infield','外野':'Outfield',
'離壘':'Lead off','回壘':'Return','盜壘':'Steal','牽制！':'Pickoff!','轉身牽制…':'Spin move…','出局！':'Out!','安全':'Safe','球在飛…':'Ball in flight…','沒有跑者':'No runner','投手牽制！':'Pickoff throw!','被觸殺！':'Tagged out!','盜壘中！':'Stealing!','預備盜壘（投手一動就跑）':'Steal set (runs on pitcher\'s move)','按住＝離壘　雙擊／右鍵＝盜壘':'Hold = lead off  Double-click / right-click = steal',
'投球動作中不能牽制':'Can\'t pick off mid-pitch','現在無法牽制':'Can\'t pick off now','前方壘包有人':'Base ahead is occupied','牽制出局！':'Picked off!','牽制暴傳！':'Pickoff throwing error!','球滾遠了，跑者可自行判斷是否進壘':'The ball rolled away; runners may advance at their own risk',
'盜壘取消':'Steal cancelled','盜壘失敗 出局':'Caught stealing','盜壘成功':'Stolen base','盜本壘成功':'Stole home',
// ── 賽前 / 替補
'棒次':'Order','背號':'No.','姓名':'Name','守位':'Pos','玩家球隊':'Your team','電腦球隊':'CPU team','先發投手':'Starting pitcher','候補名單':'Bench','沒有候補球員':'No bench players','兩位先發：調換打序':'Two starters: swap batting order','兩位先發：調換守位':'Two starters: swap positions','替換先發名單':'Edit lineup','完成替換':'Finish editing',
'把一位球員的名字拖曳到另一位的名字上就會互換：先發拖到候補＝替補，候補接手該棒次與守位；先發拖到先發＝依上方模式調換打序或守位。點一下可查看球員卡。':'Drag one player\'s name onto another\'s to swap: starter onto bench = substitution (the bench player takes the batting slot and position); starter onto starter = swap batting order or positions per the mode above. Click to view a player card.',
'點選任一球員，中間會出現球員卡（第一位在上、第二位在下）。':'Click any player to show a player card in the middle (first pick on top, second below).',
'候補名單（尚未上場）':'Bench (not yet played)','沒有可上場的候補球員':'No bench players available','已退場（不能再上場）':'Removed (cannot return)','已退場':'Removed',
'把場上球員的名字拖曳到候補球員的名字上就會替補（也可以反過來）。點一下可查看球員卡。被換下的球員不能再回到場上。':'Drag an on-field player\'s name onto a bench player\'s name to substitute (or the other way around). Click to view a player card. A replaced player cannot return.',
'請把場上球員拖到候補球員的名字上（或反過來）。':'Drag an on-field player onto a bench player (or the other way around).','無法替補。':'Substitution not possible.',
'球路':'Pitches','候補':'Bench','打擊':'Batting','投球':'Pitching','打擊成績':'Batting stats','投手成績':'Pitching stats','守備成績':'Fielding stats','關閉球員卡':'Close player card','下局打者':'Due up',
// ── 能力
'打擊框':'Bat Box','打擊威力':'Power','跑速':'Speed','起跑':'Accel','球速':'Pitch Spd','控球':'Control','臂力':'Arm','守備':'Defense','體力':'Stamina','加速度':'Accel','速度':'Speed','平均':'Mean','中位數':'Median','球隊屬性蜘蛛網圖':'Team attribute radar chart',
'髮型':'Hairstyle','眼睛／鬍子':'Eyes / facial hair',
'左打':'bats L','右打':'bats R','兩打':'switch','左投':'throws L','右投':'throws R',
// ── 投球
'直球':'Fastball','滑球':'Slider','曲球':'Curveball','變速球':'Changeup','伸卡球':'Sinker','指叉球':'Splitter','卡特球':'Cutter',
// ── 打擊結果
'全壘打':'Home run','二壘安打':'Double','三壘安打':'Triple','一壘安打':'Single','場內全壘打':'Inside-the-park HR','場內球':'In play','擊出場內球':'Ball in play','觸擊 場內球':'Bunt in play','觸擊界外':'Bunt foul','觸擊沒碰到':'Bunt missed','界外球':'Foul ball','擦棒 界外':'Foul tip','界外接殺':'Foul fly caught','界外球請小心':'Watch out for the foul ball',
'擊中記分板':'Hit the scoreboard','進入觀眾席':'Into the stands','彈跳出場':'Bounced out of play','越過外野牆':'Over the outfield wall','球出界':'Out of play','滾地球穿越內野':'Grounder through the infield','內野手處理':'Handled by an infielder','滾地球 出局':'Groundout','內野高飛 出局':'Infield pop-up out','平飛球落地':'Line drive drops in','內野飛球 出局':'Infield fly out','外野飛球 出局':'Fly out','落在外野前方':'Drops in shallow outfield','外野深處':'Deep outfield','深遠飛球 出局':'Deep fly out','差一點':'Just short','球越過外野手':'Over the outfielder',
'完美時機':'Perfect timing','揮空':'Swing and miss','見逃':'Called strike','好球':'Strike','壞球':'Ball','四壞球':'Walk','保送上壘':'Walk to first','保送上壘 ・ 跑者可繼續推進':'Walk · runners may advance','三振':'Strikeout','不死三振 打者出局':'Dropped third strike: batter out','觸身球':'Hit by pitch','揮棒被球擊中':'Hit by pitch on the swing','好球帶內被球擊中':'Hit by pitch in the zone','揮棒／觸擊時被球擊中':'Hit by pitch while swinging / bunting',
'三殺':'Triple play','雙殺':'Double play','犧牲飛球':'Sacrifice fly','接殺出局':'Fly out','內野高飛 打者出局':'Infield fly: batter out','觸殺出局':'Tagged out','封殺出局':'Force out','跑者回壘失敗':'Runner failed to return','跑者被觸殺':'Runner tagged out','野手選擇':'Fielder\'s choice','內野高飛規則':'Infield fly rule','守備方觸殺／封殺':'Tag / force by the defense','三出局，攻守交換':'Three outs, change sides','妨礙跑壘：跑者獲判安全進壘':'Obstruction: runner awarded the base',
'暴投':'Wild pitch','牽制暴傳':'Pickoff throwing error','四壞球 暴投':'Walk + wild pitch','四壞球 暴投 跑者出局':'Walk + wild pitch, runner out','四壞球 暴投 跑者多進一壘':'Walk + wild pitch, runner takes an extra base','暴投 失分':'Wild pitch, run scores','暴投 跑者出局':'Wild pitch, runner out','暴投 跑者按兵不動':'Wild pitch, runners hold','暴投 跑者進壘':'Wild pitch, runners advance','三振 暴投 跑者進壘':'Strikeout + wild pitch, runners advance','三振 暴投 跑者按兵不動':'Strikeout + wild pitch, runners hold',
'死球':'Dead ball','死球 判給 2 個壘':'Dead ball: 2 bases awarded','球進入死球區，跑者獲判 2 個壘':'Ball out of play: runners awarded 2 bases',
// ── 聯賽
'賽季結束':'Season over','你的球隊今天輪空。':'Your team has a bye today.','模擬今日其他賽事':'Simulate today\'s other games','輪空':'Bye','今日 ▶':'Today ▶','未開賽':'Not played','PLAY 開始比賽':'PLAY','電腦模擬這場':'Simulate this game','需要先打完前面的比賽才能進行這一天。':'Finish the earlier games first.','你贏了！':'You win!','你輸了':'You lose','比賽結束':'Game Over','當日全聯盟賽果':'League results for the day',
'球隊':'Team','球員':'Player','勝率':'PCT','勝差':'GB','打席':'PA','尚無成績':'No stats yet','（還沒有人達到規定）':'(nobody qualifies yet)','存檔格式不符':'Save format mismatch','沒有存檔':'No save','目前沒有聯賽存檔':'No league saves','刪除存檔':'Delete save','再按一次確認刪除':'Click again to confirm','刪除資料':'Delete','繼續聯賽':'Continue league',
'守位':'Pos','投打':'B/T','被盜':'SBA','阻殺':'CS','阻殺率':'CS%','球數':'Pitches','PO 刺殺':'PO','A 助殺':'A','E 失誤':'E','DP 雙殺':'DP','守備率':'FPCT','被盜壘':'SBA',
'上壘率':'OBP','打擊率':'AVG','長打率':'SLG','保送':'Walks','安打':'Hits','得分':'Runs','打點':'RBI','勝投':'Wins','防禦率':'ERA','每九局三振':'K/9','先發場次':'Games started','投球局數':'Innings pitched','敗投':'Losses',
'⚠ 瀏覽器不允許儲存資料，這次的進度關閉後會消失':'⚠ This browser blocks data storage; progress will be lost when you close the page',
// ── 載入 / 錯誤
'球場載入中…':'Loading stadium…','預設球場':'Default stadium','不能選擇同一支球隊，請選擇另一支電腦對手':'You can\'t pick the same team; choose a different CPU opponent','請選擇你的球隊（左鍵選取、右鍵取消）':'Choose your team (left-click to select, right-click to cancel)','（右鍵可取消重選）':'(right-click to undo)',
'找不到或無法讀取 ./baseball/teams.js，或 JavaScript 球隊資料格式／內容有誤。請確認檔案存在且資料有效。':'Could not find or read ./baseball/teams.js, or the team data is malformed. Make sure the file exists and the data is valid.',
'teams.js 沒有定義有效的聯盟。':'teams.js defines no valid league.','需要頂層 leagues（id、name、logo），且每支球隊用 league 指定所屬聯盟（每個聯盟至少兩隊）。':'A top-level leagues list (id, name, logo) is required, and each team names its league (at least two teams per league).',
'JavaScript 球隊資料至少需要兩支球隊':'The team data needs at least two teams','每隊球員必須介於 9 至 35 人':'Each team needs between 9 and 35 players','每隊都需要 id 與 name':'Every team needs an id and a name',
'存檔的玩家球隊不在聯盟內':'The saved player team is not in the league'
};
const pieces={
'受傷：':'Injury: ','必須退場':'must leave the game','頭部觸身球：':'Head hit by pitch: ',' 被勒令退場':' ejected','沒有可替補的球員：':'No substitute available: ',' 留在場上':' stays in the game','電腦換人：':'CPU substitution: ','電腦換投手：':'CPU pitching change: ','傷：':'Inj: ','・嚴重':' (severe)','冷卻 ':'Cooldown ','退場':'Ejected',
'肩膀':'Shoulder','手肘':'Elbow','手臂肌肉':'Arm muscle','手指':'Finger','手部':'Hand','大腿拉傷':'Hamstring strain','腳踝扭傷':'Ankle sprain','膝蓋':'Knee','小腿抽筋':'Calf cramp','肋骨':'Ribs','腰部':'Lower back','背部':'Back','腦震盪':'Concussion','頭部撞擊':'Head impact',
'體力不支':'fatigue','冷卻時間未消':'cooldown not cleared','跑壘':'baserunning','被球擊中':'hit by ball',
'受傷無法繼續，必須換人。':' injured and cannot continue: a substitution is required.','被勒令退場／':' ejected / ',' 受傷，無法上場。':' is injured and cannot play.',
'聯盟聯賽：':'League Season: ','聯盟聯賽':'League Season','選擇球隊':'Select Team','選擇球場':'Select Stadium','返回選擇球隊':'Back to Team Select','返回聯賽':'Back to League',
'你的球隊：':'Your team: ','你的球隊':'Your team','玩家：':'Player: ','電腦：':'CPU: ','請選擇電腦對手（左鍵選取、右鍵取消）':'Choose a CPU opponent (left-click to select, right-click to cancel)','（再按一次其他球隊可更換，右鍵取消）':'(click another team to change, right-click to cancel)','選擇你的球隊（左鍵選取、右鍵取消）':'Choose your team (left-click to select, right-click to cancel)','（右鍵可取消重選）':'(right-click to undo)',
'存檔：':'Save: ','賽季結束':'Season over','繼續聯賽':'Continue league','刪除資料':'Delete','刪除存檔':'Delete save',
'無法讀取存檔：':'Could not read the save: ','（可到「設定」刪除存檔後重新選隊）':'(delete the save in Settings, then choose a team again)','」已不在 teams.js 內':'" is no longer in teams.js','聯盟「':'League "','存檔內的球隊已不在 teams.js：':'Teams in the save are no longer in teams.js: ',
'」已有存檔，開始新聯賽會覆蓋它。確定的話請再按一次「開始聯賽」。':'" already has a save; starting a new season will overwrite it. Click "Start League" again to confirm.',
'無法載入 ./baseball/teams.js：':'Could not load ./baseball/teams.js: ','此球場 JS 載入失敗（':'This stadium failed to load (','），已改用預設球場。':'); using the default stadium.',
'球員 ':'Player ','規定打席 ':'Qualifying PA: ','規定投球 ':'Qualifying IP: ','（球隊場次×3.1）':' (team games × 3.1)','（球隊場次×0.3）':' (team games × 0.3)',
'已退場，不能再上場。':'has been removed and cannot return.','替補完成：':'Substitution: ',' 下場，':' out, ',' 上場（':' in (',
'先發投手':'Starting pitcher','候補名單':'Bench','玩家球隊':'Your team','電腦球隊':'CPU team',
'球隊屬性（':'Team attributes (','平均':'Mean','中位數':'Median',
'風向 ':'Wind dir ','風速 ':'Wind speed ','晴天':'Clear','無風':'Calm','東北風':'NE wind','東南風':'SE wind','西北風':'NW wind','西南風':'SW wind','北風':'N wind','南風':'S wind','東風':'E wind','西風':'W wind',
'離壘 ':'Lead ','秒到達':'s ETA','落點距離：':'Distance: ','正中':'dead center','偏早 ':'Early ','偏晚 ':'Late ',' 框 ':' zone ','觸擊 ・ ':'Bunt · ','準心偏':'Aim off ',
'揮空 ・ ':'Swing and miss · ','暴投 ・ ':'Wild pitch · ','不死三振 ・ ':'Dropped third strike · ','打者衝向一壘':'batter runs to first','三出局，攻守交換':'Three outs, change sides',
'擊中':'Hit ','金屬頭盔':'helmet','頭部':'head','球鞋':'shoe','身體':'body','往本壘後方':'toward the backstop ','往投手方向':'toward the pitcher ','往側邊':'sideways ','斜上':'up and ','向上':'up ','反彈':'rebounds',' ・ 死球 ・ 擊中':' · dead ball · hit ','觸身球':'Hit by pitch','揮棒被球擊中':'Hit by pitch on the swing',
'失誤 ':'Error ','失分':'run scores','跑者進壘':'runners advance','跑者按兵不動':'runners hold','跑者出局':'runner out','暴投':'Wild pitch','四壞球':'Walk','三振':'Strikeout','出局':'out',
'球員卡 3D 大頭照失敗，改用卡通頭像：':'Player card 3D portrait failed, using cartoon avatar: ',
'距本壘 ':'from home ',' 趨前 ':' in ',' 後退 ':' back ','內野':'Infield','外野':'Outfield',
'斜上':'up and ','主審':'Home plate umpire','一壘審':'1st base umpire','二壘審':'2nd base umpire','三壘審':'3rd base umpire',
'勝投 ':'W: ','敗投 ':'L: ','打擊  ':'Batting  ','打擊':'Batting','投球':'Pitching','守備':'Defense'
};
// 全形標點 → 半形
const PUNCT=[['　',' '],['・',' · '],['，',', '],['、',', '],['：',': '],['；','; '],['。','. '],['！','!'],['？','?'],['（',' ('],['）',')'],['「','"'],['」','"'],['／','/'],['＝','='],['｜','|'],['～','~']];
const rules=[
 [/第 ?(\d+) ?局[\s　]*｜[\s　]*(.+?) 進攻/g,(m,n,t)=>'Inning '+n+' | '+t+' batting'],
 [/規定投球 ([\d.]+) 局/g,'Qualifying IP: $1'],
 [/第 ?(\d+) ?\/ ?(\d+) 日/g,'Day $1 / $2'],
 [/第 ?(\d+) 日/g,'Day $1'],
 [/第 ?(\d+) 名/g,'rank #$1'],
 [/第 ?(\d+) ?局/g,'Inn $1'],
 [/第 ?(\d+) ?棒/g,'#$1 hitter'],
 [/（([日一二三四五六])）/g,(m,w)=>' ('+WK[w]+')'],
 [/(\d+) 局制/g,'$1-inning'],
 [/(\d+) ?局/g,'$1 inn'],
 [/(\d+) ?勝 ?(\d+) ?敗/g,'$1-$2'],
 [/(勝|敗) (\d+)：(\d+)/g,(m,w,a,b)=>(w==='勝'?'W ':'L ')+a+'-'+b],
 [/(\d+) 輪[\s　]*（共 (\d+) 場）/g,(m,a,b)=>a+(a==='1'?' round':' rounds')+' ('+b+' games)'],
 [/聯盟 (\d+) 隊：每隊對其餘 (\d+) 隊各打 (\d+) 場，你的球隊共 (\d+) 場；其他球隊的比賽由電腦依球員數據模擬。/g,'League of $1 teams: each team plays each of the other $2 teams $3 time(s), $4 games for your team; other games are simulated from player stats.'],
 [/・共 (\d+) 隊/g,' · $1 teams'],
 [/得 (\d+) 分/g,(m,n)=>n+(n==='1'?' run scores':' runs score')],
 [/不死三振 打者上([一二三本])壘( 失分)?/g,(m,b,r)=>'Dropped third strike: batter reaches '+BASEW[b]+(r?', run scores':'')],
 [/失誤 上([一二三本])壘/g,(m,b)=>'Error: batter reaches '+BASEW[b]],
 [/([一二三])壘沒有跑者/g,(m,b)=>'No runner on '+BASE[b]],
 [/([一二三])壘跑者被觸殺/g,(m,b)=>BASE[b]+'-base runner tagged out'],
 [/([一二三])壘跑者及時回壘/g,(m,b)=>BASE[b]+'-base runner got back in time'],
 [/準心偏(低|高|內|外) /g,(m,d)=>'Aim off: '+({低:'low',高:'high',內:'inside',外:'outside'})[d]+' '],
 [/(\d+(?:\.\d+)?) ?秒到達/g,'$1 s ETA'],
 [/　?距本壘 (\d+) m/g,' · $1 m from home'],
 [/(\d+) 日/g,'$1 d'],
 [/(\d+) 天/g,'$1 d'],
 [/(\d+) 隊/g,'$1 teams'],
 [/(\d+) 場/g,'$1 games']
];
const all=Object.assign({},exact,pieces);   // 片段字典 = 整句字典 ∪ pieces（pieces 優先）
const SKIP=new Set(['打擊','投球','守備','球隊','球員','主審']);   // 太常出現在別的詞裡：只整句比對
const keys=Object.keys(all).filter(k=>k.length>=2&&k.length<=40&&(k in pieces||!SKIP.has(k))).sort((a,b)=>b.length-a.length);
window.BaseballLangEN={exact,pieces:all,rules,keys,punct:PUNCT};
})();
