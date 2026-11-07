/* 球隊資料：每隊 25 人（投手 9、捕手 2、一／二／三壘手與游擊手各 2、外野手 6）。
 * 球員欄位：id、name、number、position（專屬守位；外野手不分左中右）、
 *   attributes（batBox 打擊框、power 打擊威力、speed 跑速、acceleration 起跑、pitchSpeed 球速、
 *               armStrength 臂力、control 控球、defense 守備、stamina 體力；缺項一律當 75 分）、
 *   pitches（除直球外會的變化球：球種名 → 變化量分數，90 分＝程式目前的標準變化量；野手為空）。

 * 聯盟：頂層 leagues 定義有效聯盟（id、name、logo 徽章 webp 路徑）；每支球隊用 league 欄位填聯盟 id。沒有 league 的球隊只能玩單場／練習。
 * 是否先發不寫在這裡，由 index.html 依能力自動安排。
 * 能力：高斯分布平均 75、標準差 9.7（±25 分＝±2.576σ，100 分與 50 分各約 0.5%），限制在 50～100；投手的 batBox／power 平均 60、非投手的 pitchSpeed 平均 60。 */
window.BASEBALL_TEAM_CONFIG = {
  "version": 1,
  "leagues": [
    { "id": "TAIWAN", "name": "台灣聯賽", "logo": "./baseball/league_taiwan.webp" },
    { "id": "INTL", "name": "國際聯賽", "logo": "./baseball/league_intl.webp" }
  ],
  "teams": [
    {
      "id": "RED",
      "name": "四川熊貓隊",
      "league": "INTL",
      "logo": "./baseball/panda.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#1c1c1c",
          "body": "#1c1c1c",
          "arms": "#1c1c1c",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#1c1c1c",
          "body": "#1c1c1c",
          "arms": "#1c1c1c",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "RED-01",
          "name": "潘達",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 82, "power": 63, "speed": 73, "acceleration": 86, "pitchSpeed": 68, "armStrength": 93, "control": 73, "defense": 69, "stamina": 76 },
          "pitches": { "指叉球": 59, "變速球": 75, "滑球": 77 }
        },
        {
          "id": "RED-02",
          "name": "張蜀龍",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 76, "power": 58, "speed": 83, "acceleration": 74, "pitchSpeed": 50, "armStrength": 72, "control": 61, "defense": 79, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "RED-03",
          "name": "劉錦程",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 85, "power": 78, "speed": 78, "acceleration": 79, "pitchSpeed": 55, "armStrength": 79, "control": 81, "defense": 73, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "RED-04",
          "name": "關雲長",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 68, "power": 77, "speed": 56, "acceleration": 89, "pitchSpeed": 52, "armStrength": 50, "control": 66, "defense": 76, "stamina": 61 },
          "pitches": {}
        },
        {
          "id": "RED-05",
          "name": "趙子龍",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 71, "power": 66, "speed": 82, "acceleration": 92, "pitchSpeed": 67, "armStrength": 77, "control": 82, "defense": 77, "stamina": 91 },
          "pitches": {}
        },
        {
          "id": "RED-06",
          "name": "諸葛錦",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 78, "power": 88, "speed": 74, "acceleration": 84, "pitchSpeed": 50, "armStrength": 78, "control": 85, "defense": 90, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "RED-07",
          "name": "魏天府",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 81, "power": 65, "speed": 60, "acceleration": 75, "pitchSpeed": 70, "armStrength": 61, "control": 74, "defense": 76, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "RED-08",
          "name": "鄧錦城",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 56, "power": 62, "speed": 69, "acceleration": 80, "pitchSpeed": 50, "armStrength": 88, "control": 72, "defense": 78, "stamina": 98 },
          "pitches": {}
        },
        {
          "id": "RED-09",
          "name": "唐麻婆",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 72, "power": 60, "speed": 79, "acceleration": 62, "pitchSpeed": 51, "armStrength": 74, "control": 94, "defense": 87, "stamina": 65 },
          "pitches": {}
        },
        {
          "id": "RED-10",
          "name": "華竹林",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 76, "power": 76, "speed": 72, "acceleration": 73, "pitchSpeed": 55, "armStrength": 81, "control": 76, "defense": 72, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "RED-11",
          "name": "孟錦江",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 74, "power": 70, "speed": 70, "acceleration": 64, "pitchSpeed": 59, "armStrength": 50, "control": 81, "defense": 75, "stamina": 64 },
          "pitches": {}
        },
        {
          "id": "RED-12",
          "name": "薛青城",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 83, "power": 82, "speed": 73, "acceleration": 58, "pitchSpeed": 51, "armStrength": 77, "control": 68, "defense": 79, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "RED-13",
          "name": "潘小竹",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 55, "power": 74, "speed": 73, "acceleration": 79, "pitchSpeed": 76, "armStrength": 84, "control": 73, "defense": 85, "stamina": 55 },
          "pitches": { "卡特球": 58, "曲球": 70, "變速球": 76 }
        },
        {
          "id": "RED-14",
          "name": "蜀山青",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 52, "power": 70, "speed": 75, "acceleration": 85, "pitchSpeed": 85, "armStrength": 75, "control": 68, "defense": 66, "stamina": 71 },
          "pitches": { "指叉球": 68, "變速球": 91 }
        },
        {
          "id": "RED-15",
          "name": "峨眉雪",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 71, "power": 50, "speed": 58, "acceleration": 76, "pitchSpeed": 80, "armStrength": 66, "control": 70, "defense": 61, "stamina": 65 },
          "pitches": { "曲球": 62, "滑球": 80 }
        },
        {
          "id": "RED-16",
          "name": "火鍋王",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 59, "power": 61, "speed": 78, "acceleration": 68, "pitchSpeed": 74, "armStrength": 72, "control": 84, "defense": 75, "stamina": 66 },
          "pitches": { "指叉球": 86, "曲球": 73 }
        },
        {
          "id": "RED-17",
          "name": "青城風",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 58, "power": 66, "speed": 74, "acceleration": 72, "pitchSpeed": 68, "armStrength": 76, "control": 65, "defense": 67, "stamina": 63 },
          "pitches": { "卡特球": 75, "伸卡球": 80 }
        },
        {
          "id": "RED-18",
          "name": "九寨彥",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 61, "speed": 63, "acceleration": 77, "pitchSpeed": 70, "armStrength": 90, "control": 80, "defense": 76, "stamina": 76 },
          "pitches": { "伸卡球": 94, "卡特球": 70, "變速球": 83 }
        },
        {
          "id": "RED-19",
          "name": "樂山佛",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 70, "speed": 74, "acceleration": 66, "pitchSpeed": 73, "armStrength": 69, "control": 92, "defense": 76, "stamina": 60 },
          "pitches": { "伸卡球": 61, "變速球": 76, "曲球": 82 }
        },
        {
          "id": "RED-20",
          "name": "都江堰",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 69, "speed": 77, "acceleration": 69, "pitchSpeed": 82, "armStrength": 92, "control": 81, "defense": 84, "stamina": 72 },
          "pitches": { "滑球": 67, "卡特球": 81, "指叉球": 66 }
        },
        {
          "id": "RED-21",
          "name": "錦里安",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 74, "power": 67, "speed": 86, "acceleration": 80, "pitchSpeed": 68, "armStrength": 80, "control": 75, "defense": 64, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "RED-22",
          "name": "劍門關",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 75, "power": 90, "speed": 78, "acceleration": 75, "pitchSpeed": 59, "armStrength": 77, "control": 85, "defense": 75, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "RED-23",
          "name": "川劇變",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 71, "power": 72, "speed": 77, "acceleration": 67, "pitchSpeed": 57, "armStrength": 84, "control": 67, "defense": 80, "stamina": 70 },
          "pitches": {}
        },
        {
          "id": "RED-24",
          "name": "竹葉青",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 66, "power": 92, "speed": 73, "acceleration": 79, "pitchSpeed": 52, "armStrength": 72, "control": 89, "defense": 72, "stamina": 87 },
          "pitches": {}
        },
        {
          "id": "RED-25",
          "name": "宮保雞",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 59, "power": 63, "speed": 81, "acceleration": 68, "pitchSpeed": 71, "armStrength": 65, "control": 91, "defense": 83, "stamina": 88 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "BLUE",
      "name": "北海道山雀隊",
      "league": "INTL",
      "stadium": "乙子園",
      "logo": "./baseball/tit.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#c49a6c",
          "body": "#c49a6c",
          "arms": "#c49a6c",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#c49a6c",
          "body": "#c49a6c",
          "arms": "#c49a6c",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "BLUE-01",
          "name": "雀雀",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 76, "power": 56, "speed": 88, "acceleration": 60, "pitchSpeed": 85, "armStrength": 72, "control": 61, "defense": 84, "stamina": 75 },
          "pitches": { "變速球": 69, "卡特球": 51, "伸卡球": 60 }
        },
        {
          "id": "BLUE-02",
          "name": "雀胖胖",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 87, "power": 75, "speed": 68, "acceleration": 80, "pitchSpeed": 76, "armStrength": 78, "control": 83, "defense": 85, "stamina": 80 },
          "pitches": {}
        },
        {
          "id": "BLUE-03",
          "name": "雀中中",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 79, "power": 92, "speed": 66, "acceleration": 68, "pitchSpeed": 51, "armStrength": 59, "control": 86, "defense": 65, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "BLUE-04",
          "name": "雀小愛",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 64, "power": 71, "speed": 72, "acceleration": 67, "pitchSpeed": 60, "armStrength": 85, "control": 71, "defense": 78, "stamina": 88 },
          "pitches": {}
        },
        {
          "id": "BLUE-05",
          "name": "雀小玉",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 76, "power": 75, "speed": 86, "acceleration": 78, "pitchSpeed": 78, "armStrength": 79, "control": 68, "defense": 60, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "BLUE-06",
          "name": "雀笨笨",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 90, "power": 88, "speed": 82, "acceleration": 55, "pitchSpeed": 55, "armStrength": 73, "control": 79, "defense": 91, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "BLUE-07",
          "name": "雀大冰",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 54, "power": 90, "speed": 90, "acceleration": 77, "pitchSpeed": 75, "armStrength": 70, "control": 65, "defense": 75, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "BLUE-08",
          "name": "雀中冰",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 72, "power": 66, "speed": 69, "acceleration": 81, "pitchSpeed": 78, "armStrength": 55, "control": 68, "defense": 50, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "BLUE-09",
          "name": "雀小摳",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 83, "power": 63, "speed": 62, "acceleration": 77, "pitchSpeed": 71, "armStrength": 63, "control": 82, "defense": 75, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "BLUE-10",
          "name": "雀小快",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 71, "power": 72, "speed": 91, "acceleration": 79, "pitchSpeed": 67, "armStrength": 73, "control": 66, "defense": 71, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "BLUE-11",
          "name": "雀小可",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 64, "power": 80, "speed": 73, "acceleration": 57, "pitchSpeed": 69, "armStrength": 77, "control": 77, "defense": 82, "stamina": 76 },
          "pitches": {}
        },
        {
          "id": "BLUE-12",
          "name": "雀定",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 68, "power": 86, "speed": 62, "acceleration": 81, "pitchSpeed": 64, "armStrength": 75, "control": 87, "defense": 76, "stamina": 50 },
          "pitches": {}
        },
        {
          "id": "BLUE-13",
          "name": "雀小北",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 61, "power": 61, "speed": 81, "acceleration": 77, "pitchSpeed": 88, "armStrength": 70, "control": 73, "defense": 73, "stamina": 71 },
          "pitches": { "卡特球": 50, "曲球": 71 }
        },
        {
          "id": "BLUE-14",
          "name": "雪原翔",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 67, "power": 57, "speed": 67, "acceleration": 66, "pitchSpeed": 60, "armStrength": 75, "control": 67, "defense": 81, "stamina": 73 },
          "pitches": { "滑球": 79, "指叉球": 67, "伸卡球": 58 }
        },
        {
          "id": "BLUE-15",
          "name": "札幌風",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 71, "power": 68, "speed": 74, "acceleration": 71, "pitchSpeed": 90, "armStrength": 66, "control": 73, "defense": 62, "stamina": 74 },
          "pitches": { "曲球": 76, "指叉球": 76, "變速球": 88 }
        },
        {
          "id": "BLUE-16",
          "name": "函館夜",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 60, "speed": 94, "acceleration": 79, "pitchSpeed": 73, "armStrength": 82, "control": 67, "defense": 71, "stamina": 69 },
          "pitches": { "指叉球": 78, "變速球": 89, "卡特球": 50 }
        },
        {
          "id": "BLUE-17",
          "name": "小樽運",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 70, "speed": 78, "acceleration": 80, "pitchSpeed": 84, "armStrength": 62, "control": 85, "defense": 78, "stamina": 84 },
          "pitches": { "變速球": 70, "指叉球": 78 }
        },
        {
          "id": "BLUE-18",
          "name": "富良野",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 72, "power": 64, "speed": 63, "acceleration": 77, "pitchSpeed": 82, "armStrength": 74, "control": 100, "defense": 78, "stamina": 81 },
          "pitches": { "曲球": 81, "卡特球": 89, "滑球": 85 }
        },
        {
          "id": "BLUE-19",
          "name": "旭川雪",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 57, "power": 58, "speed": 65, "acceleration": 82, "pitchSpeed": 73, "armStrength": 74, "control": 69, "defense": 62, "stamina": 79 },
          "pitches": { "變速球": 88, "卡特球": 90 }
        },
        {
          "id": "BLUE-20",
          "name": "昆布王",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 53, "speed": 57, "acceleration": 81, "pitchSpeed": 89, "armStrength": 79, "control": 80, "defense": 79, "stamina": 77 },
          "pitches": { "滑球": 72, "伸卡球": 74, "卡特球": 73 }
        },
        {
          "id": "BLUE-21",
          "name": "螃蟹蟹",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 76, "power": 92, "speed": 64, "acceleration": 68, "pitchSpeed": 57, "armStrength": 60, "control": 80, "defense": 72, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "BLUE-22",
          "name": "薰衣草",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 81, "power": 79, "speed": 64, "acceleration": 66, "pitchSpeed": 62, "armStrength": 68, "control": 75, "defense": 68, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "BLUE-23",
          "name": "拉麵郎",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 67, "power": 70, "speed": 67, "acceleration": 80, "pitchSpeed": 74, "armStrength": 70, "control": 78, "defense": 83, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "BLUE-24",
          "name": "流冰丸",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 86, "power": 57, "speed": 78, "acceleration": 87, "pitchSpeed": 65, "armStrength": 90, "control": 76, "defense": 75, "stamina": 78 },
          "pitches": {}
        },
        {
          "id": "BLUE-25",
          "name": "羊蹄山",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 70, "power": 50, "speed": 62, "acceleration": 70, "pitchSpeed": 70, "armStrength": 80, "control": 60, "defense": 77, "stamina": 73 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "GREY",
      "name": "台中消波塊隊",
      "league": "TAIWAN",
      "stadium": "海洋",
      "logo": "./baseball/tetra.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#708090",
          "body": "#708090",
          "arms": "#708090",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#708090",
          "body": "#708090",
          "arms": "#708090",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "GREY-01",
          "name": "杜石強",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 73, "speed": 73, "acceleration": 87, "pitchSpeed": 71, "armStrength": 67, "control": 72, "defense": 85, "stamina": 92 },
          "pitches": { "伸卡球": 69, "卡特球": 85, "滑球": 82 }
        },
        {
          "id": "GREY-02",
          "name": "石安順",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 74, "power": 80, "speed": 63, "acceleration": 74, "pitchSpeed": 56, "armStrength": 82, "control": 69, "defense": 94, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "GREY-03",
          "name": "賴穩固",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 50, "power": 89, "speed": 77, "acceleration": 85, "pitchSpeed": 50, "armStrength": 90, "control": 74, "defense": 73, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "GREY-04",
          "name": "梁水泥",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 84, "power": 80, "speed": 66, "acceleration": 79, "pitchSpeed": 77, "armStrength": 75, "control": 73, "defense": 70, "stamina": 89 },
          "pitches": {}
        },
        {
          "id": "GREY-05",
          "name": "洪剛強",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 80, "power": 97, "speed": 78, "acceleration": 84, "pitchSpeed": 58, "armStrength": 63, "control": 81, "defense": 85, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "GREY-06",
          "name": "汪重磊",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 66, "power": 81, "speed": 67, "acceleration": 80, "pitchSpeed": 50, "armStrength": 72, "control": 69, "defense": 73, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "GREY-07",
          "name": "江岩石",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 85, "power": 81, "speed": 81, "acceleration": 74, "pitchSpeed": 62, "armStrength": 94, "control": 67, "defense": 74, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "GREY-08",
          "name": "柯磐石",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 93, "power": 67, "speed": 89, "acceleration": 90, "pitchSpeed": 50, "armStrength": 89, "control": 84, "defense": 78, "stamina": 83 },
          "pitches": {}
        },
        {
          "id": "GREY-09",
          "name": "廖鐵壁",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 84, "power": 93, "speed": 80, "acceleration": 82, "pitchSpeed": 58, "armStrength": 50, "control": 70, "defense": 67, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "GREY-10",
          "name": "許巨石",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 72, "power": 85, "speed": 83, "acceleration": 63, "pitchSpeed": 62, "armStrength": 85, "control": 85, "defense": 80, "stamina": 100 },
          "pitches": {}
        },
        {
          "id": "GREY-11",
          "name": "范定海",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 68, "power": 83, "speed": 78, "acceleration": 76, "pitchSpeed": 61, "armStrength": 75, "control": 93, "defense": 84, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "GREY-12",
          "name": "羅防波",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 92, "power": 74, "speed": 98, "acceleration": 69, "pitchSpeed": 72, "armStrength": 69, "control": 83, "defense": 85, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "GREY-13",
          "name": "水泥傑",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 59, "speed": 74, "acceleration": 85, "pitchSpeed": 67, "armStrength": 65, "control": 83, "defense": 91, "stamina": 50 },
          "pitches": { "卡特球": 63, "指叉球": 66, "滑球": 72 }
        },
        {
          "id": "GREY-14",
          "name": "鋼筋強",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 51, "speed": 87, "acceleration": 77, "pitchSpeed": 76, "armStrength": 80, "control": 79, "defense": 90, "stamina": 74 },
          "pitches": { "伸卡球": 70, "卡特球": 76 }
        },
        {
          "id": "GREY-15",
          "name": "磚頭郎",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 70, "speed": 78, "acceleration": 82, "pitchSpeed": 81, "armStrength": 87, "control": 61, "defense": 55, "stamina": 93 },
          "pitches": { "變速球": 78, "曲球": 73, "卡特球": 77 }
        },
        {
          "id": "GREY-16",
          "name": "防風林",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 61, "speed": 62, "acceleration": 83, "pitchSpeed": 77, "armStrength": 60, "control": 86, "defense": 59, "stamina": 79 },
          "pitches": { "滑球": 61 }
        },
        {
          "id": "GREY-17",
          "name": "港區安",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 52, "speed": 89, "acceleration": 72, "pitchSpeed": 78, "armStrength": 63, "control": 85, "defense": 75, "stamina": 76 },
          "pitches": { "變速球": 90, "伸卡球": 65, "卡特球": 73 }
        },
        {
          "id": "GREY-18",
          "name": "沙鹿浪",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 77, "power": 50, "speed": 84, "acceleration": 60, "pitchSpeed": 74, "armStrength": 79, "control": 57, "defense": 73, "stamina": 78 },
          "pitches": { "指叉球": 87, "伸卡球": 72, "滑球": 66 }
        },
        {
          "id": "GREY-19",
          "name": "梧棲潮",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 65, "speed": 80, "acceleration": 69, "pitchSpeed": 62, "armStrength": 77, "control": 75, "defense": 98, "stamina": 82 },
          "pitches": { "指叉球": 92, "卡特球": 66 }
        },
        {
          "id": "GREY-20",
          "name": "大甲溪",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 78, "power": 52, "speed": 61, "acceleration": 84, "pitchSpeed": 84, "armStrength": 81, "control": 65, "defense": 71, "stamina": 83 },
          "pitches": { "曲球": 77, "伸卡球": 82, "卡特球": 77 }
        },
        {
          "id": "GREY-21",
          "name": "谷關泉",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 68, "power": 66, "speed": 92, "acceleration": 69, "pitchSpeed": 52, "armStrength": 83, "control": 75, "defense": 62, "stamina": 63 },
          "pitches": {}
        },
        {
          "id": "GREY-22",
          "name": "太平山",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 78, "power": 89, "speed": 78, "acceleration": 79, "pitchSpeed": 74, "armStrength": 62, "control": 77, "defense": 62, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "GREY-23",
          "name": "霧峰岩",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 77, "power": 73, "speed": 83, "acceleration": 81, "pitchSpeed": 69, "armStrength": 62, "control": 55, "defense": 81, "stamina": 87 },
          "pitches": {}
        },
        {
          "id": "GREY-24",
          "name": "東勢柱",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 72, "power": 67, "speed": 79, "acceleration": 66, "pitchSpeed": 58, "armStrength": 84, "control": 74, "defense": 92, "stamina": 57 },
          "pitches": {}
        },
        {
          "id": "GREY-25",
          "name": "清水堤",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 55, "power": 61, "speed": 86, "acceleration": 61, "pitchSpeed": 50, "armStrength": 91, "control": 79, "defense": 84, "stamina": 63 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "ORANGE",
      "name": "苗栗貓隊",
      "league": "TAIWAN",
      "logo": "./baseball/leocat.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#e67e22",
          "body": "#e67e22",
          "arms": "#e67e22",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#e67e22",
          "body": "#e67e22",
          "arms": "#e67e22",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "ORANGE-01",
          "name": "橘貓君",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 73, "power": 61, "speed": 79, "acceleration": 63, "pitchSpeed": 82, "armStrength": 77, "control": 84, "defense": 56, "stamina": 68 },
          "pitches": { "指叉球": 75 }
        },
        {
          "id": "ORANGE-02",
          "name": "三花醬",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 90, "power": 91, "speed": 72, "acceleration": 78, "pitchSpeed": 67, "armStrength": 66, "control": 83, "defense": 73, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "ORANGE-03",
          "name": "波斯王",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 70, "power": 70, "speed": 90, "acceleration": 92, "pitchSpeed": 61, "armStrength": 71, "control": 63, "defense": 81, "stamina": 63 },
          "pitches": {}
        },
        {
          "id": "ORANGE-04",
          "name": "布偶萌",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 78, "power": 82, "speed": 79, "acceleration": 68, "pitchSpeed": 81, "armStrength": 97, "control": 66, "defense": 68, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "ORANGE-05",
          "name": "暹羅勁",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 75, "power": 69, "speed": 83, "acceleration": 76, "pitchSpeed": 62, "armStrength": 71, "control": 70, "defense": 63, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "ORANGE-06",
          "name": "豹貓豪",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 93, "power": 64, "speed": 86, "acceleration": 75, "pitchSpeed": 55, "armStrength": 73, "control": 90, "defense": 78, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "ORANGE-07",
          "name": "虎斑翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 70, "power": 72, "speed": 67, "acceleration": 78, "pitchSpeed": 62, "armStrength": 64, "control": 85, "defense": 78, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "ORANGE-08",
          "name": "緬因威",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 66, "power": 70, "speed": 66, "acceleration": 79, "pitchSpeed": 60, "armStrength": 87, "control": 77, "defense": 61, "stamina": 78 },
          "pitches": {}
        },
        {
          "id": "ORANGE-09",
          "name": "英短宇",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 81, "power": 84, "speed": 69, "acceleration": 76, "pitchSpeed": 56, "armStrength": 81, "control": 65, "defense": 69, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "ORANGE-10",
          "name": "摺耳傑",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 93, "power": 82, "speed": 78, "acceleration": 81, "pitchSpeed": 67, "armStrength": 80, "control": 75, "defense": 78, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "ORANGE-11",
          "name": "狸貓凱",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 76, "power": 70, "speed": 77, "acceleration": 78, "pitchSpeed": 63, "armStrength": 69, "control": 52, "defense": 81, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "ORANGE-12",
          "name": "山貓安",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 69, "power": 68, "speed": 91, "acceleration": 84, "pitchSpeed": 51, "armStrength": 61, "control": 91, "defense": 65, "stamina": 70 },
          "pitches": {}
        },
        {
          "id": "ORANGE-13",
          "name": "客家妹",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 67, "power": 65, "speed": 81, "acceleration": 95, "pitchSpeed": 71, "armStrength": 99, "control": 82, "defense": 75, "stamina": 81 },
          "pitches": { "變速球": 87, "伸卡球": 66, "曲球": 63 }
        },
        {
          "id": "ORANGE-14",
          "name": "三義木",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 56, "power": 63, "speed": 79, "acceleration": 64, "pitchSpeed": 69, "armStrength": 64, "control": 65, "defense": 87, "stamina": 62 },
          "pitches": { "滑球": 68, "伸卡球": 77 }
        },
        {
          "id": "ORANGE-15",
          "name": "後龍灣",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 75, "speed": 89, "acceleration": 67, "pitchSpeed": 98, "armStrength": 75, "control": 71, "defense": 96, "stamina": 68 },
          "pitches": { "伸卡球": 63, "變速球": 87, "卡特球": 75 }
        },
        {
          "id": "ORANGE-16",
          "name": "銅鑼杭",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 56, "power": 63, "speed": 75, "acceleration": 77, "pitchSpeed": 93, "armStrength": 75, "control": 74, "defense": 58, "stamina": 78 },
          "pitches": { "滑球": 62, "變速球": 68, "指叉球": 70 }
        },
        {
          "id": "ORANGE-17",
          "name": "南庄霧",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 75, "power": 67, "speed": 83, "acceleration": 70, "pitchSpeed": 75, "armStrength": 87, "control": 71, "defense": 81, "stamina": 76 },
          "pitches": { "滑球": 69, "伸卡球": 88, "變速球": 82 }
        },
        {
          "id": "ORANGE-18",
          "name": "通霄風",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 51, "power": 59, "speed": 67, "acceleration": 68, "pitchSpeed": 76, "armStrength": 75, "control": 77, "defense": 92, "stamina": 77 },
          "pitches": { "滑球": 67 }
        },
        {
          "id": "ORANGE-19",
          "name": "竹南浪",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 59, "speed": 77, "acceleration": 74, "pitchSpeed": 61, "armStrength": 82, "control": 82, "defense": 61, "stamina": 68 },
          "pitches": { "指叉球": 66, "滑球": 61, "曲球": 81 }
        },
        {
          "id": "ORANGE-20",
          "name": "頭份礦",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 56, "power": 52, "speed": 70, "acceleration": 68, "pitchSpeed": 78, "armStrength": 71, "control": 71, "defense": 95, "stamina": 91 },
          "pitches": { "卡特球": 71, "指叉球": 83, "變速球": 66 }
        },
        {
          "id": "ORANGE-21",
          "name": "公館棗",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 86, "power": 76, "speed": 80, "acceleration": 79, "pitchSpeed": 69, "armStrength": 77, "control": 57, "defense": 70, "stamina": 75 },
          "pitches": {}
        },
        {
          "id": "ORANGE-22",
          "name": "苑裡藺",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 61, "power": 75, "speed": 56, "acceleration": 69, "pitchSpeed": 54, "armStrength": 77, "control": 62, "defense": 79, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "ORANGE-23",
          "name": "大湖莓",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 82, "power": 80, "speed": 69, "acceleration": 65, "pitchSpeed": 50, "armStrength": 76, "control": 67, "defense": 90, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "ORANGE-24",
          "name": "獅潭湖",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 59, "power": 86, "speed": 66, "acceleration": 73, "pitchSpeed": 54, "armStrength": 94, "control": 66, "defense": 77, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "ORANGE-25",
          "name": "卓蘭桃",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 84, "power": 69, "speed": 88, "acceleration": 88, "pitchSpeed": 59, "armStrength": 82, "control": 79, "defense": 73, "stamina": 69 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "GREEN",
      "name": "黃金海岸無尾熊隊",
      "league": "INTL",
      "logo": "./baseball/koala.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#27ae60",
          "body": "#27ae60",
          "arms": "#27ae60",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#27ae60",
          "body": "#27ae60",
          "arms": "#27ae60",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "GREEN-01",
          "name": "尤加利",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 68, "power": 60, "speed": 79, "acceleration": 74, "pitchSpeed": 78, "armStrength": 66, "control": 76, "defense": 90, "stamina": 62 },
          "pitches": { "指叉球": 77 }
        },
        {
          "id": "GREEN-02",
          "name": "樹果安",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 74, "power": 63, "speed": 93, "acceleration": 58, "pitchSpeed": 69, "armStrength": 55, "control": 79, "defense": 80, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "GREEN-03",
          "name": "抱抱龍",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 78, "power": 66, "speed": 81, "acceleration": 76, "pitchSpeed": 63, "armStrength": 73, "control": 81, "defense": 85, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "GREEN-04",
          "name": "桉樹峰",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 76, "power": 81, "speed": 70, "acceleration": 90, "pitchSpeed": 59, "armStrength": 70, "control": 89, "defense": 79, "stamina": 83 },
          "pitches": {}
        },
        {
          "id": "GREEN-05",
          "name": "林間快",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 79, "power": 57, "speed": 76, "acceleration": 59, "pitchSpeed": 63, "armStrength": 74, "control": 98, "defense": 90, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "GREEN-06",
          "name": "枝頭威",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 74, "power": 79, "speed": 59, "acceleration": 94, "pitchSpeed": 68, "armStrength": 60, "control": 64, "defense": 67, "stamina": 99 },
          "pitches": {}
        },
        {
          "id": "GREEN-07",
          "name": "葉影翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 76, "power": 70, "speed": 87, "acceleration": 79, "pitchSpeed": 50, "armStrength": 79, "control": 87, "defense": 85, "stamina": 75 },
          "pitches": {}
        },
        {
          "id": "GREEN-08",
          "name": "森之風",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 65, "power": 78, "speed": 69, "acceleration": 77, "pitchSpeed": 61, "armStrength": 65, "control": 68, "defense": 96, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "GREEN-09",
          "name": "草地奔",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 61, "power": 56, "speed": 75, "acceleration": 83, "pitchSpeed": 62, "armStrength": 66, "control": 97, "defense": 73, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "GREEN-10",
          "name": "漫步者",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 78, "power": 73, "speed": 70, "acceleration": 71, "pitchSpeed": 60, "armStrength": 81, "control": 74, "defense": 63, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "GREEN-11",
          "name": "慢條理",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 71, "power": 56, "speed": 74, "acceleration": 63, "pitchSpeed": 57, "armStrength": 86, "control": 73, "defense": 86, "stamina": 88 },
          "pitches": {}
        },
        {
          "id": "GREEN-12",
          "name": "憨吉特",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 58, "power": 74, "speed": 53, "acceleration": 57, "pitchSpeed": 77, "armStrength": 86, "control": 68, "defense": 84, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "GREEN-13",
          "name": "黃金灘",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 60, "power": 61, "speed": 86, "acceleration": 86, "pitchSpeed": 87, "armStrength": 68, "control": 86, "defense": 68, "stamina": 67 },
          "pitches": { "卡特球": 65, "指叉球": 72, "滑球": 93 }
        },
        {
          "id": "GREEN-14",
          "name": "衝浪客",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 54, "power": 65, "speed": 82, "acceleration": 73, "pitchSpeed": 81, "armStrength": 74, "control": 79, "defense": 58, "stamina": 69 },
          "pitches": { "變速球": 80, "指叉球": 73 }
        },
        {
          "id": "GREEN-15",
          "name": "袋鼠跳",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 60, "power": 50, "speed": 84, "acceleration": 63, "pitchSpeed": 72, "armStrength": 85, "control": 75, "defense": 73, "stamina": 75 },
          "pitches": { "滑球": 87, "卡特球": 79, "曲球": 75 }
        },
        {
          "id": "GREEN-16",
          "name": "尤加桉",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 51, "speed": 82, "acceleration": 76, "pitchSpeed": 75, "armStrength": 75, "control": 74, "defense": 72, "stamina": 85 },
          "pitches": { "變速球": 88 }
        },
        {
          "id": "GREEN-17",
          "name": "昆士蘭",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 74, "speed": 72, "acceleration": 90, "pitchSpeed": 71, "armStrength": 77, "control": 66, "defense": 69, "stamina": 74 },
          "pitches": { "指叉球": 77, "曲球": 81 }
        },
        {
          "id": "GREEN-18",
          "name": "大堡礁",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 54, "speed": 89, "acceleration": 66, "pitchSpeed": 90, "armStrength": 77, "control": 64, "defense": 77, "stamina": 86 },
          "pitches": { "滑球": 61 }
        },
        {
          "id": "GREEN-19",
          "name": "澳洲風",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 53, "power": 51, "speed": 85, "acceleration": 81, "pitchSpeed": 82, "armStrength": 74, "control": 86, "defense": 87, "stamina": 84 },
          "pitches": { "曲球": 89 }
        },
        {
          "id": "GREEN-20",
          "name": "歌劇院",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 75, "power": 84, "speed": 50, "acceleration": 79, "pitchSpeed": 82, "armStrength": 89, "control": 82, "defense": 63, "stamina": 72 },
          "pitches": { "曲球": 85 }
        },
        {
          "id": "GREEN-21",
          "name": "烤肉郎",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 80, "power": 83, "speed": 86, "acceleration": 62, "pitchSpeed": 53, "armStrength": 81, "control": 68, "defense": 61, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "GREEN-22",
          "name": "海岸線",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 87, "power": 62, "speed": 66, "acceleration": 80, "pitchSpeed": 63, "armStrength": 61, "control": 66, "defense": 79, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "GREEN-23",
          "name": "椰影傑",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 77, "power": 72, "speed": 89, "acceleration": 93, "pitchSpeed": 52, "armStrength": 78, "control": 76, "defense": 76, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "GREEN-24",
          "name": "浪花凱",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 78, "power": 99, "speed": 100, "acceleration": 87, "pitchSpeed": 52, "armStrength": 84, "control": 74, "defense": 80, "stamina": 90 },
          "pitches": {}
        },
        {
          "id": "GREEN-25",
          "name": "日光浴",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 56, "power": 70, "speed": 82, "acceleration": 79, "pitchSpeed": 54, "armStrength": 86, "control": 89, "defense": 66, "stamina": 78 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "BUSAN",
      "name": "釜山海鷗隊",
      "league": "INTL",
      "logo": "./baseball/gull.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#1b365d",
          "body": "#1b365d",
          "arms": "#1b365d",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#1b365d",
          "body": "#1b365d",
          "arms": "#1b365d",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "BUSAN-01",
          "name": "朴翔宇",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 58, "speed": 79, "acceleration": 73, "pitchSpeed": 61, "armStrength": 75, "control": 73, "defense": 79, "stamina": 63 },
          "pitches": { "伸卡球": 70, "變速球": 82 }
        },
        {
          "id": "BUSAN-02",
          "name": "金大智",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 72, "power": 86, "speed": 88, "acceleration": 50, "pitchSpeed": 55, "armStrength": 63, "control": 73, "defense": 71, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "BUSAN-03",
          "name": "李守護",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 88, "power": 88, "speed": 89, "acceleration": 87, "pitchSpeed": 66, "armStrength": 54, "control": 64, "defense": 78, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "BUSAN-04",
          "name": "崔敏浩",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 73, "power": 73, "speed": 67, "acceleration": 71, "pitchSpeed": 73, "armStrength": 81, "control": 67, "defense": 66, "stamina": 96 },
          "pitches": {}
        },
        {
          "id": "BUSAN-05",
          "name": "姜振遠",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 90, "power": 83, "speed": 76, "acceleration": 71, "pitchSpeed": 56, "armStrength": 59, "control": 77, "defense": 75, "stamina": 64 },
          "pitches": {}
        },
        {
          "id": "BUSAN-06",
          "name": "尹海風",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 78, "power": 79, "speed": 89, "acceleration": 87, "pitchSpeed": 57, "armStrength": 65, "control": 69, "defense": 74, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "BUSAN-07",
          "name": "韓飛翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 62, "power": 64, "speed": 82, "acceleration": 71, "pitchSpeed": 63, "armStrength": 67, "control": 68, "defense": 78, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "BUSAN-08",
          "name": "宋天際",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 73, "power": 83, "speed": 78, "acceleration": 73, "pitchSpeed": 83, "armStrength": 80, "control": 53, "defense": 87, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "BUSAN-09",
          "name": "權浪潮",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 66, "power": 77, "speed": 68, "acceleration": 79, "pitchSpeed": 50, "armStrength": 85, "control": 68, "defense": 86, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "BUSAN-10",
          "name": "鄭智賢",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 69, "power": 72, "speed": 66, "acceleration": 68, "pitchSpeed": 57, "armStrength": 77, "control": 66, "defense": 75, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "BUSAN-11",
          "name": "林俊浩",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 66, "power": 71, "speed": 85, "acceleration": 86, "pitchSpeed": 61, "armStrength": 66, "control": 86, "defense": 79, "stamina": 58 },
          "pitches": {}
        },
        {
          "id": "BUSAN-12",
          "name": "申宇鎮",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 90, "power": 72, "speed": 79, "acceleration": 91, "pitchSpeed": 69, "armStrength": 65, "control": 71, "defense": 73, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "BUSAN-13",
          "name": "朴海岸",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 85, "power": 59, "speed": 87, "acceleration": 68, "pitchSpeed": 72, "armStrength": 71, "control": 79, "defense": 73, "stamina": 93 },
          "pitches": { "指叉球": 53, "卡特球": 79 }
        },
        {
          "id": "BUSAN-14",
          "name": "金港灣",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 58, "power": 57, "speed": 87, "acceleration": 72, "pitchSpeed": 72, "armStrength": 66, "control": 88, "defense": 50, "stamina": 72 },
          "pitches": { "曲球": 69 }
        },
        {
          "id": "BUSAN-15",
          "name": "李漁市",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 70, "power": 54, "speed": 84, "acceleration": 79, "pitchSpeed": 68, "armStrength": 73, "control": 94, "defense": 82, "stamina": 50 },
          "pitches": { "卡特球": 75, "變速球": 88, "曲球": 80 }
        },
        {
          "id": "BUSAN-16",
          "name": "崔鯨魚",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 80, "power": 56, "speed": 61, "acceleration": 86, "pitchSpeed": 75, "armStrength": 90, "control": 81, "defense": 73, "stamina": 66 },
          "pitches": { "指叉球": 74, "變速球": 74 }
        },
        {
          "id": "BUSAN-17",
          "name": "姜燈塔",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 56, "power": 53, "speed": 70, "acceleration": 79, "pitchSpeed": 67, "armStrength": 74, "control": 86, "defense": 81, "stamina": 60 },
          "pitches": { "伸卡球": 79 }
        },
        {
          "id": "BUSAN-18",
          "name": "尹浪花",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 60, "power": 71, "speed": 67, "acceleration": 75, "pitchSpeed": 55, "armStrength": 66, "control": 80, "defense": 86, "stamina": 83 },
          "pitches": { "伸卡球": 94, "指叉球": 91 }
        },
        {
          "id": "BUSAN-19",
          "name": "韓潮聲",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 53, "power": 65, "speed": 77, "acceleration": 72, "pitchSpeed": 84, "armStrength": 68, "control": 74, "defense": 77, "stamina": 90 },
          "pitches": { "曲球": 70, "指叉球": 67, "滑球": 75 }
        },
        {
          "id": "BUSAN-20",
          "name": "宋鷗翔",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 64, "power": 62, "speed": 86, "acceleration": 66, "pitchSpeed": 77, "armStrength": 89, "control": 66, "defense": 83, "stamina": 71 },
          "pitches": { "變速球": 67, "滑球": 80 }
        },
        {
          "id": "BUSAN-21",
          "name": "權大橋",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 76, "power": 78, "speed": 75, "acceleration": 78, "pitchSpeed": 62, "armStrength": 64, "control": 81, "defense": 76, "stamina": 75 },
          "pitches": {}
        },
        {
          "id": "BUSAN-22",
          "name": "鄭太宗",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 72, "power": 80, "speed": 52, "acceleration": 67, "pitchSpeed": 52, "armStrength": 86, "control": 67, "defense": 68, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "BUSAN-23",
          "name": "林海鮮",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 72, "power": 97, "speed": 71, "acceleration": 65, "pitchSpeed": 57, "armStrength": 96, "control": 80, "defense": 63, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "BUSAN-24",
          "name": "申冰爽",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 89, "power": 91, "speed": 86, "acceleration": 92, "pitchSpeed": 50, "armStrength": 77, "control": 81, "defense": 79, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "BUSAN-25",
          "name": "吳影島",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 58, "power": 91, "speed": 65, "acceleration": 92, "pitchSpeed": 75, "armStrength": 65, "control": 78, "defense": 75, "stamina": 83 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "TURKEY",
      "name": "土耳其火雞隊",
      "league": "INTL",
      "stadium": "伊斯坦堡",
      "logo": "./baseball/turkey.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#e74c3c",
          "body": "#e74c3c",
          "arms": "#e74c3c",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#e74c3c",
          "body": "#e74c3c",
          "arms": "#e74c3c",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "TURKEY-01",
          "name": "艾爾段",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 53, "speed": 64, "acceleration": 69, "pitchSpeed": 75, "armStrength": 86, "control": 84, "defense": 85, "stamina": 79 },
          "pitches": { "指叉球": 82, "曲球": 82 }
        },
        {
          "id": "TURKEY-02",
          "name": "卡巴布",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 81, "power": 81, "speed": 66, "acceleration": 67, "pitchSpeed": 59, "armStrength": 88, "control": 76, "defense": 85, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "TURKEY-03",
          "name": "巴克拉瓦",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 79, "power": 58, "speed": 86, "acceleration": 92, "pitchSpeed": 65, "armStrength": 81, "control": 75, "defense": 70, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "TURKEY-04",
          "name": "梅赫梅特",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 85, "power": 55, "speed": 75, "acceleration": 70, "pitchSpeed": 63, "armStrength": 89, "control": 65, "defense": 70, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "TURKEY-05",
          "name": "塞利姆",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 72, "power": 78, "speed": 68, "acceleration": 83, "pitchSpeed": 64, "armStrength": 86, "control": 78, "defense": 74, "stamina": 59 },
          "pitches": {}
        },
        {
          "id": "TURKEY-06",
          "name": "穆斯塔法",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 70, "power": 83, "speed": 83, "acceleration": 66, "pitchSpeed": 58, "armStrength": 78, "control": 81, "defense": 89, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "TURKEY-07",
          "name": "奧斯曼",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 87, "power": 67, "speed": 80, "acceleration": 94, "pitchSpeed": 50, "armStrength": 79, "control": 68, "defense": 76, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "TURKEY-08",
          "name": "伊斯坦堡",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 87, "power": 67, "speed": 78, "acceleration": 81, "pitchSpeed": 54, "armStrength": 72, "control": 74, "defense": 61, "stamina": 93 },
          "pitches": {}
        },
        {
          "id": "TURKEY-09",
          "name": "卡帕多奇亞",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 76, "power": 91, "speed": 80, "acceleration": 79, "pitchSpeed": 61, "armStrength": 86, "control": 58, "defense": 71, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "TURKEY-10",
          "name": "帕穆克",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 71, "power": 78, "speed": 90, "acceleration": 82, "pitchSpeed": 63, "armStrength": 79, "control": 83, "defense": 92, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "TURKEY-11",
          "name": "阿爾普",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 65, "power": 59, "speed": 80, "acceleration": 73, "pitchSpeed": 68, "armStrength": 90, "control": 73, "defense": 69, "stamina": 63 },
          "pitches": {}
        },
        {
          "id": "TURKEY-12",
          "name": "埃姆雷",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 75, "power": 78, "speed": 83, "acceleration": 66, "pitchSpeed": 76, "armStrength": 77, "control": 67, "defense": 81, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "TURKEY-13",
          "name": "烤雞王",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 76, "power": 51, "speed": 53, "acceleration": 70, "pitchSpeed": 85, "armStrength": 73, "control": 89, "defense": 85, "stamina": 69 },
          "pitches": { "曲球": 83, "滑球": 78 }
        },
        {
          "id": "TURKEY-14",
          "name": "伊茲密",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 52, "power": 57, "speed": 88, "acceleration": 73, "pitchSpeed": 73, "armStrength": 61, "control": 77, "defense": 85, "stamina": 87 },
          "pitches": { "指叉球": 66, "滑球": 95 }
        },
        {
          "id": "TURKEY-15",
          "name": "安卡拉",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 61, "power": 63, "speed": 78, "acceleration": 89, "pitchSpeed": 81, "armStrength": 74, "control": 77, "defense": 67, "stamina": 86 },
          "pitches": { "滑球": 70, "伸卡球": 79 }
        },
        {
          "id": "TURKEY-16",
          "name": "棉堡安",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 67, "power": 70, "speed": 56, "acceleration": 67, "pitchSpeed": 68, "armStrength": 84, "control": 69, "defense": 76, "stamina": 84 },
          "pitches": { "變速球": 81, "指叉球": 69 }
        },
        {
          "id": "TURKEY-17",
          "name": "黑海風",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 72, "power": 50, "speed": 63, "acceleration": 69, "pitchSpeed": 85, "armStrength": 97, "control": 83, "defense": 87, "stamina": 69 },
          "pitches": { "滑球": 80, "曲球": 70 }
        },
        {
          "id": "TURKEY-18",
          "name": "愛琴海",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 65, "power": 77, "speed": 84, "acceleration": 66, "pitchSpeed": 71, "armStrength": 83, "control": 76, "defense": 80, "stamina": 62 },
          "pitches": { "曲球": 76, "變速球": 66, "滑球": 77 }
        },
        {
          "id": "TURKEY-19",
          "name": "博斯普",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 60, "power": 69, "speed": 60, "acceleration": 88, "pitchSpeed": 68, "armStrength": 79, "control": 77, "defense": 78, "stamina": 76 },
          "pitches": { "伸卡球": 81, "曲球": 79, "卡特球": 73 }
        },
        {
          "id": "TURKEY-20",
          "name": "地毯商",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 61, "power": 73, "speed": 73, "acceleration": 100, "pitchSpeed": 73, "armStrength": 91, "control": 83, "defense": 90, "stamina": 71 },
          "pitches": { "曲球": 76, "變速球": 71, "滑球": 69 }
        },
        {
          "id": "TURKEY-21",
          "name": "藍色寺",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 79, "power": 62, "speed": 82, "acceleration": 79, "pitchSpeed": 74, "armStrength": 95, "control": 83, "defense": 77, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "TURKEY-22",
          "name": "熱氣球",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 92, "power": 74, "speed": 78, "acceleration": 81, "pitchSpeed": 65, "armStrength": 72, "control": 50, "defense": 76, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "TURKEY-23",
          "name": "旋轉僧",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 62, "power": 75, "speed": 79, "acceleration": 64, "pitchSpeed": 61, "armStrength": 63, "control": 65, "defense": 66, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "TURKEY-24",
          "name": "冰淇淋",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 80, "power": 66, "speed": 85, "acceleration": 75, "pitchSpeed": 72, "armStrength": 75, "control": 80, "defense": 83, "stamina": 83 },
          "pitches": {}
        },
        {
          "id": "TURKEY-25",
          "name": "沙威瑪",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 80, "power": 60, "speed": 90, "acceleration": 83, "pitchSpeed": 67, "armStrength": 73, "control": 78, "defense": 87, "stamina": 82 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "PERSIMMON",
      "name": "新竹柿子隊",
      "league": "TAIWAN",
      "logo": "./baseball/pesimmon.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#d35400",
          "body": "#d35400",
          "arms": "#d35400",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#d35400",
          "body": "#d35400",
          "arms": "#d35400",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "PERSIMMON-01",
          "name": "朱果強",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 83, "power": 67, "speed": 73, "acceleration": 75, "pitchSpeed": 71, "armStrength": 61, "control": 66, "defense": 79, "stamina": 100 },
          "pitches": { "曲球": 77 }
        },
        {
          "id": "PERSIMMON-02",
          "name": "柿大郎",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 73, "power": 67, "speed": 78, "acceleration": 81, "pitchSpeed": 65, "armStrength": 62, "control": 78, "defense": 65, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-03",
          "name": "羅果實",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 69, "power": 76, "speed": 60, "acceleration": 84, "pitchSpeed": 72, "armStrength": 77, "control": 86, "defense": 72, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-04",
          "name": "風乾毅",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 67, "power": 72, "speed": 70, "acceleration": 76, "pitchSpeed": 58, "armStrength": 85, "control": 61, "defense": 87, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-05",
          "name": "金脆宇",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 78, "power": 69, "speed": 63, "acceleration": 86, "pitchSpeed": 50, "armStrength": 74, "control": 80, "defense": 64, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-06",
          "name": "蜜糖安",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 82, "power": 65, "speed": 86, "acceleration": 66, "pitchSpeed": 76, "armStrength": 88, "control": 68, "defense": 64, "stamina": 80 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-07",
          "name": "筆柿翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 68, "power": 92, "speed": 73, "acceleration": 78, "pitchSpeed": 73, "armStrength": 77, "control": 83, "defense": 71, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-08",
          "name": "九降風",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 50, "power": 95, "speed": 74, "acceleration": 72, "pitchSpeed": 64, "armStrength": 66, "control": 82, "defense": 61, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-09",
          "name": "紅面豐",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 72, "power": 88, "speed": 78, "acceleration": 72, "pitchSpeed": 50, "armStrength": 69, "control": 70, "defense": 63, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-10",
          "name": "甜柿傑",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 79, "power": 64, "speed": 70, "acceleration": 87, "pitchSpeed": 63, "armStrength": 86, "control": 62, "defense": 66, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-11",
          "name": "水柿凱",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 67, "power": 74, "speed": 77, "acceleration": 82, "pitchSpeed": 50, "armStrength": 85, "control": 64, "defense": 69, "stamina": 70 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-12",
          "name": "冬藏安",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 70, "power": 62, "speed": 63, "acceleration": 86, "pitchSpeed": 63, "armStrength": 85, "control": 54, "defense": 90, "stamina": 87 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-13",
          "name": "風城強",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 67, "power": 73, "speed": 74, "acceleration": 86, "pitchSpeed": 66, "armStrength": 62, "control": 90, "defense": 73, "stamina": 72 },
          "pitches": { "滑球": 73, "變速球": 76, "指叉球": 75 }
        },
        {
          "id": "PERSIMMON-14",
          "name": "米粉郎",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 74, "power": 78, "speed": 81, "acceleration": 89, "pitchSpeed": 89, "armStrength": 71, "control": 78, "defense": 89, "stamina": 66 },
          "pitches": { "滑球": 76, "伸卡球": 88 }
        },
        {
          "id": "PERSIMMON-15",
          "name": "貢丸王",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 59, "power": 73, "speed": 80, "acceleration": 82, "pitchSpeed": 77, "armStrength": 73, "control": 77, "defense": 83, "stamina": 91 },
          "pitches": { "指叉球": 79, "伸卡球": 61, "變速球": 78 }
        },
        {
          "id": "PERSIMMON-16",
          "name": "新埔柿",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 56, "speed": 83, "acceleration": 91, "pitchSpeed": 59, "armStrength": 68, "control": 70, "defense": 79, "stamina": 76 },
          "pitches": { "滑球": 68, "變速球": 66 }
        },
        {
          "id": "PERSIMMON-17",
          "name": "竹科男",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 59, "power": 61, "speed": 88, "acceleration": 62, "pitchSpeed": 77, "armStrength": 82, "control": 64, "defense": 83, "stamina": 86 },
          "pitches": { "伸卡球": 77 }
        },
        {
          "id": "PERSIMMON-18",
          "name": "城隍廟",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 55, "power": 55, "speed": 76, "acceleration": 70, "pitchSpeed": 86, "armStrength": 64, "control": 60, "defense": 77, "stamina": 82 },
          "pitches": { "曲球": 71 }
        },
        {
          "id": "PERSIMMON-19",
          "name": "北埔茶",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 69, "power": 67, "speed": 70, "acceleration": 75, "pitchSpeed": 79, "armStrength": 50, "control": 73, "defense": 80, "stamina": 74 },
          "pitches": { "曲球": 72, "指叉球": 71, "滑球": 87 }
        },
        {
          "id": "PERSIMMON-20",
          "name": "峨眉湖",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 64, "power": 53, "speed": 66, "acceleration": 72, "pitchSpeed": 67, "armStrength": 65, "control": 86, "defense": 82, "stamina": 60 },
          "pitches": { "卡特球": 82, "指叉球": 62, "伸卡球": 67 }
        },
        {
          "id": "PERSIMMON-21",
          "name": "橫山站",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 70, "power": 85, "speed": 78, "acceleration": 50, "pitchSpeed": 50, "armStrength": 72, "control": 63, "defense": 71, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-22",
          "name": "湖口營",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 80, "power": 67, "speed": 78, "acceleration": 53, "pitchSpeed": 62, "armStrength": 84, "control": 65, "defense": 69, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-23",
          "name": "關西仙",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 81, "power": 88, "speed": 69, "acceleration": 86, "pitchSpeed": 52, "armStrength": 68, "control": 84, "defense": 58, "stamina": 65 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-24",
          "name": "芎林安",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 77, "power": 84, "speed": 82, "acceleration": 77, "pitchSpeed": 59, "armStrength": 78, "control": 67, "defense": 65, "stamina": 65 },
          "pitches": {}
        },
        {
          "id": "PERSIMMON-25",
          "name": "竹東嵐",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 65, "power": 74, "speed": 81, "acceleration": 64, "pitchSpeed": 51, "armStrength": 77, "control": 74, "defense": 69, "stamina": 82 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "BOY",
      "name": "布魯塞爾小童隊",
      "league": "INTL",
      "logo": "./baseball/boy.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#2980b9",
          "body": "#2980b9",
          "arms": "#2980b9",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#2980b9",
          "body": "#2980b9",
          "arms": "#2980b9",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "BOY-01",
          "name": "于勒斯",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 61, "speed": 67, "acceleration": 74, "pitchSpeed": 92, "armStrength": 75, "control": 85, "defense": 94, "stamina": 66 },
          "pitches": { "變速球": 73 }
        },
        {
          "id": "BOY-02",
          "name": "皮特森",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 77, "power": 80, "speed": 88, "acceleration": 73, "pitchSpeed": 50, "armStrength": 72, "control": 73, "defense": 77, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "BOY-03",
          "name": "弗蘭克",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 73, "power": 61, "speed": 82, "acceleration": 96, "pitchSpeed": 67, "armStrength": 68, "control": 71, "defense": 77, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "BOY-04",
          "name": "小漢斯",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 90, "power": 86, "speed": 67, "acceleration": 63, "pitchSpeed": 54, "armStrength": 70, "control": 81, "defense": 77, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "BOY-05",
          "name": "馬修斯",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 73, "power": 68, "speed": 92, "acceleration": 71, "pitchSpeed": 56, "armStrength": 62, "control": 69, "defense": 75, "stamina": 65 },
          "pitches": {}
        },
        {
          "id": "BOY-06",
          "name": "查理斯",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 72, "power": 81, "speed": 59, "acceleration": 68, "pitchSpeed": 50, "armStrength": 84, "control": 83, "defense": 64, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "BOY-07",
          "name": "噴泉翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 86, "power": 69, "speed": 73, "acceleration": 68, "pitchSpeed": 77, "armStrength": 87, "control": 86, "defense": 65, "stamina": 78 },
          "pitches": {}
        },
        {
          "id": "BOY-08",
          "name": "比利時",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 76, "power": 93, "speed": 92, "acceleration": 75, "pitchSpeed": 58, "armStrength": 76, "control": 65, "defense": 76, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "BOY-09",
          "name": "布魯克",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 70, "power": 85, "speed": 77, "acceleration": 65, "pitchSpeed": 65, "armStrength": 50, "control": 80, "defense": 70, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "BOY-10",
          "name": "盧卡斯",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 100, "power": 84, "speed": 80, "acceleration": 68, "pitchSpeed": 67, "armStrength": 66, "control": 97, "defense": 61, "stamina": 62 },
          "pitches": {}
        },
        {
          "id": "BOY-11",
          "name": "湯姆生",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 70, "power": 76, "speed": 75, "acceleration": 66, "pitchSpeed": 62, "armStrength": 73, "control": 74, "defense": 77, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "BOY-12",
          "name": "戴維斯",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 79, "power": 72, "speed": 67, "acceleration": 70, "pitchSpeed": 64, "armStrength": 69, "control": 75, "defense": 78, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "BOY-13",
          "name": "尿尿童",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 59, "speed": 76, "acceleration": 92, "pitchSpeed": 60, "armStrength": 75, "control": 59, "defense": 76, "stamina": 65 },
          "pitches": { "變速球": 77, "伸卡球": 89, "指叉球": 66 }
        },
        {
          "id": "BOY-14",
          "name": "華夫餅",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 56, "power": 57, "speed": 63, "acceleration": 78, "pitchSpeed": 77, "armStrength": 82, "control": 88, "defense": 75, "stamina": 87 },
          "pitches": { "曲球": 65, "變速球": 72 }
        },
        {
          "id": "BOY-15",
          "name": "巧克力",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 65, "power": 54, "speed": 76, "acceleration": 81, "pitchSpeed": 87, "armStrength": 64, "control": 100, "defense": 80, "stamina": 50 },
          "pitches": { "變速球": 63 }
        },
        {
          "id": "BOY-16",
          "name": "薯條王",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 55, "power": 51, "speed": 74, "acceleration": 70, "pitchSpeed": 71, "armStrength": 62, "control": 74, "defense": 77, "stamina": 79 },
          "pitches": { "伸卡球": 84, "卡特球": 99, "滑球": 67 }
        },
        {
          "id": "BOY-17",
          "name": "鬱金香",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 54, "power": 63, "speed": 78, "acceleration": 57, "pitchSpeed": 66, "armStrength": 65, "control": 64, "defense": 67, "stamina": 80 },
          "pitches": { "卡特球": 68, "滑球": 64 }
        },
        {
          "id": "BOY-18",
          "name": "大廣場",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 56, "power": 70, "speed": 91, "acceleration": 70, "pitchSpeed": 73, "armStrength": 84, "control": 64, "defense": 80, "stamina": 76 },
          "pitches": { "卡特球": 84, "變速球": 65 }
        },
        {
          "id": "BOY-19",
          "name": "原子塔",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 72, "power": 54, "speed": 71, "acceleration": 86, "pitchSpeed": 63, "armStrength": 70, "control": 63, "defense": 68, "stamina": 78 },
          "pitches": { "滑球": 67, "伸卡球": 84 }
        },
        {
          "id": "BOY-20",
          "name": "啤酒傑",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 59, "speed": 56, "acceleration": 82, "pitchSpeed": 68, "armStrength": 72, "control": 73, "defense": 74, "stamina": 87 },
          "pitches": { "變速球": 66, "伸卡球": 84 }
        },
        {
          "id": "BOY-21",
          "name": "蕾絲安",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 76, "power": 68, "speed": 83, "acceleration": 67, "pitchSpeed": 60, "armStrength": 82, "control": 66, "defense": 78, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "BOY-22",
          "name": "漫畫迷",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 79, "power": 75, "speed": 63, "acceleration": 75, "pitchSpeed": 60, "armStrength": 72, "control": 65, "defense": 64, "stamina": 64 },
          "pitches": {}
        },
        {
          "id": "BOY-23",
          "name": "運河風",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 62, "power": 78, "speed": 84, "acceleration": 69, "pitchSpeed": 68, "armStrength": 68, "control": 58, "defense": 88, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "BOY-24",
          "name": "鑽石商",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 65, "power": 71, "speed": 83, "acceleration": 73, "pitchSpeed": 58, "armStrength": 85, "control": 76, "defense": 75, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "BOY-25",
          "name": "淡菜凱",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 77, "power": 73, "speed": 93, "acceleration": 62, "pitchSpeed": 71, "armStrength": 86, "control": 89, "defense": 89, "stamina": 84 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "WOLF",
      "name": "羅馬母狼隊",
      "league": "INTL",
      "stadium": "羅馬",
      "logo": "./baseball/wolf.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#6b1424",
          "body": "#6b1424",
          "arms": "#6b1424",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#f5ebd6",
          "body": "#f5ebd6",
          "arms": "#f5ebd6",
          "shoes": "#1c1c1c"
        }
      },
      "players": [
        {
          "id": "WOLF-01",
          "name": "羅慕路斯",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 82, "power": 50, "speed": 71, "acceleration": 73, "pitchSpeed": 67, "armStrength": 89, "control": 83, "defense": 79, "stamina": 64 },
          "pitches": { "滑球": 61, "卡特球": 76, "變速球": 72 }
        },
        {
          "id": "WOLF-02",
          "name": "雷穆斯",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 89, "power": 56, "speed": 78, "acceleration": 73, "pitchSpeed": 60, "armStrength": 69, "control": 59, "defense": 85, "stamina": 94 },
          "pitches": {}
        },
        {
          "id": "WOLF-03",
          "name": "布魯圖",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 79, "power": 72, "speed": 65, "acceleration": 50, "pitchSpeed": 60, "armStrength": 57, "control": 66, "defense": 77, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "WOLF-04",
          "name": "尤利烏斯",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 85, "power": 59, "speed": 71, "acceleration": 76, "pitchSpeed": 50, "armStrength": 74, "control": 93, "defense": 66, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "WOLF-05",
          "name": "奧古斯都",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 85, "power": 61, "speed": 91, "acceleration": 82, "pitchSpeed": 53, "armStrength": 74, "control": 89, "defense": 86, "stamina": 92 },
          "pitches": {}
        },
        {
          "id": "WOLF-06",
          "name": "圖拉真",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 66, "power": 80, "speed": 84, "acceleration": 70, "pitchSpeed": 55, "armStrength": 65, "control": 82, "defense": 76, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "WOLF-07",
          "name": "哈德良",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 92, "power": 77, "speed": 67, "acceleration": 68, "pitchSpeed": 68, "armStrength": 76, "control": 81, "defense": 81, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "WOLF-08",
          "name": "西塞羅",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 87, "power": 78, "speed": 69, "acceleration": 52, "pitchSpeed": 58, "armStrength": 74, "control": 70, "defense": 80, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "WOLF-09",
          "name": "維吉爾",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 77, "power": 81, "speed": 76, "acceleration": 69, "pitchSpeed": 56, "armStrength": 60, "control": 67, "defense": 74, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "WOLF-10",
          "name": "尼祿",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 72, "power": 79, "speed": 54, "acceleration": 63, "pitchSpeed": 50, "armStrength": 58, "control": 75, "defense": 72, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "WOLF-11",
          "name": "康茂德",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 74, "power": 85, "speed": 69, "acceleration": 66, "pitchSpeed": 50, "armStrength": 64, "control": 68, "defense": 85, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "WOLF-12",
          "name": "斯巴達克",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 94, "power": 92, "speed": 56, "acceleration": 68, "pitchSpeed": 51, "armStrength": 63, "control": 72, "defense": 92, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "WOLF-13",
          "name": "西庇阿",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 54, "power": 73, "speed": 88, "acceleration": 81, "pitchSpeed": 72, "armStrength": 76, "control": 57, "defense": 79, "stamina": 80 },
          "pitches": { "曲球": 85 }
        },
        {
          "id": "WOLF-14",
          "name": "格拉古",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 58, "power": 72, "speed": 67, "acceleration": 85, "pitchSpeed": 57, "armStrength": 71, "control": 73, "defense": 100, "stamina": 79 },
          "pitches": { "變速球": 70, "伸卡球": 95 }
        },
        {
          "id": "WOLF-15",
          "name": "馬可士",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 68, "power": 53, "speed": 85, "acceleration": 77, "pitchSpeed": 72, "armStrength": 78, "control": 82, "defense": 79, "stamina": 83 },
          "pitches": { "變速球": 87, "伸卡球": 74 }
        },
        {
          "id": "WOLF-16",
          "name": "安東尼",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 71, "power": 67, "speed": 78, "acceleration": 77, "pitchSpeed": 98, "armStrength": 70, "control": 65, "defense": 82, "stamina": 80 },
          "pitches": { "卡特球": 66, "伸卡球": 78, "指叉球": 72 }
        },
        {
          "id": "WOLF-17",
          "name": "克拉蘇",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 72, "power": 50, "speed": 81, "acceleration": 90, "pitchSpeed": 73, "armStrength": 77, "control": 64, "defense": 65, "stamina": 64 },
          "pitches": { "滑球": 72 }
        },
        {
          "id": "WOLF-18",
          "name": "龐培王",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 60, "power": 64, "speed": 71, "acceleration": 52, "pitchSpeed": 71, "armStrength": 73, "control": 78, "defense": 64, "stamina": 80 },
          "pitches": { "指叉球": 95 }
        },
        {
          "id": "WOLF-19",
          "name": "加圖安",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 65, "speed": 79, "acceleration": 92, "pitchSpeed": 73, "armStrength": 71, "control": 99, "defense": 70, "stamina": 69 },
          "pitches": { "曲球": 82, "卡特球": 70, "指叉球": 80 }
        },
        {
          "id": "WOLF-20",
          "name": "屋大維",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 55, "speed": 76, "acceleration": 56, "pitchSpeed": 87, "armStrength": 80, "control": 61, "defense": 78, "stamina": 68 },
          "pitches": { "指叉球": 76, "卡特球": 72 }
        },
        {
          "id": "WOLF-21",
          "name": "奧理略",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 73, "power": 76, "speed": 87, "acceleration": 70, "pitchSpeed": 61, "armStrength": 78, "control": 74, "defense": 71, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "WOLF-22",
          "name": "賽維魯",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 67, "power": 100, "speed": 74, "acceleration": 83, "pitchSpeed": 60, "armStrength": 72, "control": 64, "defense": 80, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "WOLF-23",
          "name": "君士坦",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 68, "power": 67, "speed": 76, "acceleration": 61, "pitchSpeed": 66, "armStrength": 67, "control": 84, "defense": 83, "stamina": 87 },
          "pitches": {}
        },
        {
          "id": "WOLF-24",
          "name": "戴克里",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 66, "power": 77, "speed": 73, "acceleration": 72, "pitchSpeed": 57, "armStrength": 72, "control": 70, "defense": 67, "stamina": 88 },
          "pitches": {}
        },
        {
          "id": "WOLF-25",
          "name": "哈斯德",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 72, "power": 93, "speed": 83, "acceleration": 66, "pitchSpeed": 77, "armStrength": 72, "control": 69, "defense": 73, "stamina": 68 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "MONKEY",
      "name": "高雄獼猴隊",
      "league": "TAIWAN",
      "logo": "./baseball/monkey.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#1b4332",
          "body": "#1b4332",
          "arms": "#1b4332",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#1b4332",
          "body": "#1b4332",
          "arms": "#1b4332",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "MONKEY-01",
          "name": "柴山王",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 53, "power": 61, "speed": 86, "acceleration": 75, "pitchSpeed": 76, "armStrength": 73, "control": 79, "defense": 67, "stamina": 96 },
          "pitches": { "卡特球": 78, "伸卡球": 74 }
        },
        {
          "id": "MONKEY-02",
          "name": "壽山明",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 66, "power": 73, "speed": 81, "acceleration": 66, "pitchSpeed": 76, "armStrength": 66, "control": 67, "defense": 77, "stamina": 64 },
          "pitches": {}
        },
        {
          "id": "MONKEY-03",
          "name": "搶食強",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 68, "power": 70, "speed": 81, "acceleration": 79, "pitchSpeed": 50, "armStrength": 67, "control": 69, "defense": 64, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "MONKEY-04",
          "name": "攀岩捷",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 75, "power": 70, "speed": 92, "acceleration": 86, "pitchSpeed": 54, "armStrength": 86, "control": 78, "defense": 82, "stamina": 100 },
          "pitches": {}
        },
        {
          "id": "MONKEY-05",
          "name": "樹冠翔",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 83, "power": 68, "speed": 66, "acceleration": 66, "pitchSpeed": 60, "armStrength": 61, "control": 77, "defense": 73, "stamina": 54 },
          "pitches": {}
        },
        {
          "id": "MONKEY-06",
          "name": "獼猴安",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 71, "power": 75, "speed": 85, "acceleration": 80, "pitchSpeed": 62, "armStrength": 79, "control": 65, "defense": 74, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "MONKEY-07",
          "name": "旗後風",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 82, "power": 77, "speed": 70, "acceleration": 86, "pitchSpeed": 78, "armStrength": 68, "control": 77, "defense": 68, "stamina": 59 },
          "pitches": {}
        },
        {
          "id": "MONKEY-08",
          "name": "愛河潮",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 83, "power": 68, "speed": 68, "acceleration": 63, "pitchSpeed": 50, "armStrength": 70, "control": 82, "defense": 87, "stamina": 91 },
          "pitches": {}
        },
        {
          "id": "MONKEY-09",
          "name": "港都威",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 91, "power": 70, "speed": 79, "acceleration": 69, "pitchSpeed": 71, "armStrength": 83, "control": 74, "defense": 78, "stamina": 75 },
          "pitches": {}
        },
        {
          "id": "MONKEY-10",
          "name": "西子灣",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 72, "power": 88, "speed": 84, "acceleration": 62, "pitchSpeed": 63, "armStrength": 76, "control": 66, "defense": 72, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "MONKEY-11",
          "name": "巨蛋凱",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 58, "power": 62, "speed": 75, "acceleration": 78, "pitchSpeed": 69, "armStrength": 61, "control": 84, "defense": 63, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "MONKEY-12",
          "name": "莲池潭",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 68, "power": 62, "speed": 69, "acceleration": 74, "pitchSpeed": 70, "armStrength": 73, "control": 73, "defense": 60, "stamina": 83 },
          "pitches": {}
        },
        {
          "id": "MONKEY-13",
          "name": "壽山猴",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 68, "speed": 80, "acceleration": 85, "pitchSpeed": 68, "armStrength": 75, "control": 89, "defense": 80, "stamina": 75 },
          "pitches": { "曲球": 65, "伸卡球": 80, "卡特球": 77 }
        },
        {
          "id": "MONKEY-14",
          "name": "愛河風",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 54, "power": 63, "speed": 92, "acceleration": 85, "pitchSpeed": 78, "armStrength": 75, "control": 60, "defense": 80, "stamina": 80 },
          "pitches": { "曲球": 62, "伸卡球": 67, "指叉球": 81 }
        },
        {
          "id": "MONKEY-15",
          "name": "駁二藝",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 52, "power": 71, "speed": 73, "acceleration": 63, "pitchSpeed": 65, "armStrength": 79, "control": 80, "defense": 71, "stamina": 81 },
          "pitches": { "滑球": 78 }
        },
        {
          "id": "MONKEY-16",
          "name": "蓮池潭",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 71, "power": 72, "speed": 74, "acceleration": 55, "pitchSpeed": 61, "armStrength": 89, "control": 63, "defense": 71, "stamina": 80 },
          "pitches": { "滑球": 70, "伸卡球": 63, "曲球": 83 }
        },
        {
          "id": "MONKEY-17",
          "name": "旗津浪",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 57, "power": 61, "speed": 56, "acceleration": 68, "pitchSpeed": 71, "armStrength": 65, "control": 56, "defense": 82, "stamina": 59 },
          "pitches": { "指叉球": 79, "卡特球": 76 }
        },
        {
          "id": "MONKEY-18",
          "name": "左營港",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 55, "speed": 92, "acceleration": 71, "pitchSpeed": 100, "armStrength": 83, "control": 78, "defense": 79, "stamina": 78 },
          "pitches": { "變速球": 64, "滑球": 89 }
        },
        {
          "id": "MONKEY-19",
          "name": "鼓山燈",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 55, "speed": 81, "acceleration": 70, "pitchSpeed": 75, "armStrength": 84, "control": 75, "defense": 79, "stamina": 68 },
          "pitches": { "滑球": 78, "變速球": 70 }
        },
        {
          "id": "MONKEY-20",
          "name": "美濃傘",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 72, "power": 62, "speed": 60, "acceleration": 67, "pitchSpeed": 78, "armStrength": 59, "control": 81, "defense": 65, "stamina": 67 },
          "pitches": { "曲球": 60, "滑球": 66 }
        },
        {
          "id": "MONKEY-21",
          "name": "六合夜",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 68, "power": 84, "speed": 82, "acceleration": 58, "pitchSpeed": 52, "armStrength": 80, "control": 79, "defense": 72, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "MONKEY-22",
          "name": "林園煙",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 76, "power": 62, "speed": 84, "acceleration": 70, "pitchSpeed": 68, "armStrength": 81, "control": 70, "defense": 89, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "MONKEY-23",
          "name": "橋頭糖",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 68, "power": 67, "speed": 62, "acceleration": 89, "pitchSpeed": 50, "armStrength": 75, "control": 63, "defense": 71, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "MONKEY-24",
          "name": "岡山羊",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 85, "power": 77, "speed": 59, "acceleration": 96, "pitchSpeed": 53, "armStrength": 62, "control": 64, "defense": 73, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "MONKEY-25",
          "name": "茂林紫",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 64, "power": 66, "speed": 80, "acceleration": 63, "pitchSpeed": 62, "armStrength": 72, "control": 78, "defense": 83, "stamina": 63 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "KING",
      "name": "拉斯維加斯老千隊",
      "league": "INTL",
      "logo": "./baseball/king.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#900c3f",
          "body": "#900c3f",
          "arms": "#900c3f",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#111111",
          "body": "#111111",
          "arms": "#111111",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "KING-01",
          "name": "黑桃傑",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 74, "power": 64, "speed": 83, "acceleration": 79, "pitchSpeed": 81, "armStrength": 80, "control": 71, "defense": 75, "stamina": 73 },
          "pitches": { "卡特球": 88 }
        },
        {
          "id": "KING-02",
          "name": "紅心Q",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 83, "power": 79, "speed": 80, "acceleration": 88, "pitchSpeed": 50, "armStrength": 69, "control": 72, "defense": 72, "stamina": 91 },
          "pitches": {}
        },
        {
          "id": "KING-03",
          "name": "方塊K",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 75, "power": 71, "speed": 70, "acceleration": 77, "pitchSpeed": 53, "armStrength": 64, "control": 73, "defense": 70, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "KING-04",
          "name": "梅花A",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 66, "power": 75, "speed": 66, "acceleration": 65, "pitchSpeed": 62, "armStrength": 81, "control": 67, "defense": 69, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "KING-05",
          "name": "牌局生",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 75, "power": 70, "speed": 53, "acceleration": 74, "pitchSpeed": 60, "armStrength": 62, "control": 56, "defense": 67, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "KING-06",
          "name": "老千豪",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 77, "power": 78, "speed": 66, "acceleration": 56, "pitchSpeed": 65, "armStrength": 69, "control": 65, "defense": 75, "stamina": 53 },
          "pitches": {}
        },
        {
          "id": "KING-07",
          "name": "賭城翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 91, "power": 87, "speed": 68, "acceleration": 71, "pitchSpeed": 56, "armStrength": 71, "control": 57, "defense": 78, "stamina": 76 },
          "pitches": {}
        },
        {
          "id": "KING-08",
          "name": "決勝點",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 57, "power": 70, "speed": 60, "acceleration": 74, "pitchSpeed": 53, "armStrength": 61, "control": 89, "defense": 82, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "KING-09",
          "name": "全押威",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 63, "power": 77, "speed": 71, "acceleration": 65, "pitchSpeed": 50, "armStrength": 78, "control": 88, "defense": 65, "stamina": 87 },
          "pitches": {}
        },
        {
          "id": "KING-10",
          "name": "幸運星",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 59, "power": 84, "speed": 85, "acceleration": 75, "pitchSpeed": 63, "armStrength": 80, "control": 93, "defense": 59, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "KING-11",
          "name": "夜幕凱",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 77, "power": 62, "speed": 51, "acceleration": 74, "pitchSpeed": 69, "armStrength": 58, "control": 78, "defense": 81, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "KING-12",
          "name": "條碼安",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 84, "power": 67, "speed": 86, "acceleration": 65, "pitchSpeed": 70, "armStrength": 66, "control": 68, "defense": 85, "stamina": 99 },
          "pitches": {}
        },
        {
          "id": "KING-13",
          "name": "骰子王",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 61, "power": 65, "speed": 69, "acceleration": 82, "pitchSpeed": 75, "armStrength": 80, "control": 82, "defense": 57, "stamina": 70 },
          "pitches": { "曲球": 81, "指叉球": 82, "伸卡球": 75 }
        },
        {
          "id": "KING-14",
          "name": "籌碼郎",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 58, "power": 73, "speed": 80, "acceleration": 75, "pitchSpeed": 77, "armStrength": 58, "control": 64, "defense": 64, "stamina": 89 },
          "pitches": { "曲球": 79, "變速球": 68, "伸卡球": 79 }
        },
        {
          "id": "KING-15",
          "name": "輪盤安",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 68, "power": 50, "speed": 95, "acceleration": 66, "pitchSpeed": 64, "armStrength": 70, "control": 91, "defense": 61, "stamina": 69 },
          "pitches": { "指叉球": 59 }
        },
        {
          "id": "KING-16",
          "name": "詐胡傑",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 60, "speed": 63, "acceleration": 71, "pitchSpeed": 89, "armStrength": 83, "control": 72, "defense": 92, "stamina": 90 },
          "pitches": { "變速球": 58, "指叉球": 65 }
        },
        {
          "id": "KING-17",
          "name": "鬼牌哥",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 54, "speed": 77, "acceleration": 81, "pitchSpeed": 76, "armStrength": 59, "control": 85, "defense": 87, "stamina": 71 },
          "pitches": { "變速球": 55, "滑球": 84 }
        },
        {
          "id": "KING-18",
          "name": "同花順",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 86, "speed": 92, "acceleration": 72, "pitchSpeed": 79, "armStrength": 84, "control": 80, "defense": 71, "stamina": 62 },
          "pitches": { "卡特球": 72, "曲球": 61 }
        },
        {
          "id": "KING-19",
          "name": "莊家龍",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 50, "speed": 82, "acceleration": 76, "pitchSpeed": 79, "armStrength": 88, "control": 65, "defense": 82, "stamina": 68 },
          "pitches": { "曲球": 83, "滑球": 75 }
        },
        {
          "id": "KING-20",
          "name": "荷官凱",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 67, "power": 80, "speed": 69, "acceleration": 71, "pitchSpeed": 95, "armStrength": 77, "control": 82, "defense": 75, "stamina": 82 },
          "pitches": { "伸卡球": 63, "變速球": 74, "曲球": 88 }
        },
        {
          "id": "KING-21",
          "name": "老虎機",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 63, "power": 67, "speed": 72, "acceleration": 76, "pitchSpeed": 54, "armStrength": 85, "control": 75, "defense": 77, "stamina": 75 },
          "pitches": {}
        },
        {
          "id": "KING-22",
          "name": "霓虹燈",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 69, "power": 74, "speed": 85, "acceleration": 67, "pitchSpeed": 82, "armStrength": 77, "control": 89, "defense": 71, "stamina": 91 },
          "pitches": {}
        },
        {
          "id": "KING-23",
          "name": "皇家閃",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 52, "power": 67, "speed": 85, "acceleration": 73, "pitchSpeed": 53, "armStrength": 78, "control": 77, "defense": 64, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "KING-24",
          "name": "豹子號",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 63, "power": 72, "speed": 63, "acceleration": 84, "pitchSpeed": 50, "armStrength": 69, "control": 80, "defense": 90, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "KING-25",
          "name": "四條安",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 50, "power": 74, "speed": 52, "acceleration": 79, "pitchSpeed": 50, "armStrength": 73, "control": 92, "defense": 95, "stamina": 75 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "BEAN",
      "name": "嘉義綠豆人隊",
      "league": "TAIWAN",
      "logo": "./baseball/bean.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#196f3d",
          "body": "#196f3d",
          "arms": "#196f3d",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#196f3d",
          "body": "#196f3d",
          "arms": "#196f3d",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "BEAN-01",
          "name": "綠豆強",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 59, "power": 52, "speed": 70, "acceleration": 71, "pitchSpeed": 73, "armStrength": 89, "control": 74, "defense": 82, "stamina": 87 },
          "pitches": { "卡特球": 67, "指叉球": 80, "伸卡球": 68 }
        },
        {
          "id": "BEAN-02",
          "name": "豆沙安",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 71, "power": 80, "speed": 85, "acceleration": 85, "pitchSpeed": 63, "armStrength": 68, "control": 55, "defense": 66, "stamina": 56 },
          "pitches": {}
        },
        {
          "id": "BEAN-03",
          "name": "粉圓傑",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 76, "power": 77, "speed": 75, "acceleration": 86, "pitchSpeed": 71, "armStrength": 50, "control": 83, "defense": 94, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "BEAN-04",
          "name": "剉冰峰",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 66, "power": 80, "speed": 73, "acceleration": 67, "pitchSpeed": 65, "armStrength": 76, "control": 92, "defense": 89, "stamina": 100 },
          "pitches": {}
        },
        {
          "id": "BEAN-05",
          "name": "噴水池",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 94, "power": 76, "speed": 90, "acceleration": 58, "pitchSpeed": 59, "armStrength": 67, "control": 93, "defense": 93, "stamina": 63 },
          "pitches": {}
        },
        {
          "id": "BEAN-06",
          "name": "阿里山",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 81, "power": 83, "speed": 85, "acceleration": 66, "pitchSpeed": 91, "armStrength": 89, "control": 75, "defense": 60, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "BEAN-07",
          "name": "北回翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 78, "power": 68, "speed": 81, "acceleration": 87, "pitchSpeed": 55, "armStrength": 77, "control": 74, "defense": 77, "stamina": 57 },
          "pitches": {}
        },
        {
          "id": "BEAN-08",
          "name": "嘉義風",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 88, "power": 68, "speed": 81, "acceleration": 73, "pitchSpeed": 76, "armStrength": 73, "control": 91, "defense": 74, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "BEAN-09",
          "name": "管樂奔",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 55, "power": 72, "speed": 88, "acceleration": 80, "pitchSpeed": 51, "armStrength": 80, "control": 79, "defense": 82, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "BEAN-10",
          "name": "火雞肉",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 77, "power": 73, "speed": 84, "acceleration": 73, "pitchSpeed": 61, "armStrength": 80, "control": 89, "defense": 71, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "BEAN-11",
          "name": "方塊酥",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 73, "power": 79, "speed": 92, "acceleration": 87, "pitchSpeed": 53, "armStrength": 84, "control": 82, "defense": 75, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "BEAN-12",
          "name": "神木安",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 83, "power": 59, "speed": 75, "acceleration": 79, "pitchSpeed": 59, "armStrength": 89, "control": 60, "defense": 68, "stamina": 64 },
          "pitches": {}
        },
        {
          "id": "BEAN-13",
          "name": "火雞飯",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 55, "power": 55, "speed": 73, "acceleration": 88, "pitchSpeed": 80, "armStrength": 85, "control": 62, "defense": 56, "stamina": 100 },
          "pitches": { "卡特球": 64 }
        },
        {
          "id": "BEAN-14",
          "name": "檜意森",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 69, "power": 68, "speed": 73, "acceleration": 69, "pitchSpeed": 78, "armStrength": 71, "control": 89, "defense": 76, "stamina": 82 },
          "pitches": { "指叉球": 71 }
        },
        {
          "id": "BEAN-15",
          "name": "阿里坡",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 55, "power": 63, "speed": 76, "acceleration": 71, "pitchSpeed": 56, "armStrength": 80, "control": 61, "defense": 77, "stamina": 100 },
          "pitches": { "曲球": 81, "伸卡球": 72 }
        },
        {
          "id": "BEAN-16",
          "name": "朴子溪",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 51, "power": 68, "speed": 73, "acceleration": 66, "pitchSpeed": 77, "armStrength": 67, "control": 62, "defense": 73, "stamina": 71 },
          "pitches": { "滑球": 89, "伸卡球": 59 }
        },
        {
          "id": "BEAN-17",
          "name": "布袋港",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 54, "power": 69, "speed": 82, "acceleration": 78, "pitchSpeed": 80, "armStrength": 72, "control": 91, "defense": 81, "stamina": 96 },
          "pitches": { "指叉球": 80, "卡特球": 53, "曲球": 74 }
        },
        {
          "id": "BEAN-18",
          "name": "東石蚵",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 72, "speed": 60, "acceleration": 95, "pitchSpeed": 92, "armStrength": 80, "control": 85, "defense": 87, "stamina": 57 },
          "pitches": { "滑球": 68 }
        },
        {
          "id": "BEAN-19",
          "name": "梅山雲",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 67, "power": 71, "speed": 76, "acceleration": 90, "pitchSpeed": 89, "armStrength": 96, "control": 64, "defense": 78, "stamina": 52 },
          "pitches": { "卡特球": 66 }
        },
        {
          "id": "BEAN-20",
          "name": "竹崎站",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 51, "speed": 63, "acceleration": 85, "pitchSpeed": 64, "armStrength": 72, "control": 75, "defense": 70, "stamina": 80 },
          "pitches": { "卡特球": 92, "滑球": 60, "指叉球": 80 }
        },
        {
          "id": "BEAN-21",
          "name": "民雄鬼",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 68, "power": 64, "speed": 77, "acceleration": 87, "pitchSpeed": 59, "armStrength": 64, "control": 76, "defense": 62, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "BEAN-22",
          "name": "水上機",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 53, "power": 73, "speed": 83, "acceleration": 92, "pitchSpeed": 64, "armStrength": 73, "control": 81, "defense": 83, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "BEAN-23",
          "name": "中埔茶",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 72, "power": 66, "speed": 65, "acceleration": 90, "pitchSpeed": 52, "armStrength": 84, "control": 73, "defense": 72, "stamina": 79 },
          "pitches": {}
        },
        {
          "id": "BEAN-24",
          "name": "大林糖",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 75, "power": 95, "speed": 61, "acceleration": 74, "pitchSpeed": 63, "armStrength": 87, "control": 82, "defense": 79, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "BEAN-25",
          "name": "義竹鴨",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 68, "power": 50, "speed": 78, "acceleration": 65, "pitchSpeed": 71, "armStrength": 82, "control": 73, "defense": 94, "stamina": 76 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "DRAGON",
      "name": "台北天龍隊",
      "league": "TAIWAN",
      "logo": "./baseball/dragon.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#154360",
          "body": "#154360",
          "arms": "#154360",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#f39c12",
          "body": "#f39c12",
          "arms": "#f39c12",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "DRAGON-01",
          "name": "蒼龍王",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 53, "speed": 74, "acceleration": 58, "pitchSpeed": 64, "armStrength": 80, "control": 65, "defense": 76, "stamina": 85 },
          "pitches": { "變速球": 100, "卡特球": 62, "伸卡球": 89 }
        },
        {
          "id": "DRAGON-02",
          "name": "天龍安",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 67, "power": 61, "speed": 80, "acceleration": 71, "pitchSpeed": 62, "armStrength": 64, "control": 53, "defense": 83, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "DRAGON-03",
          "name": "雲端翔",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 98, "power": 54, "speed": 87, "acceleration": 74, "pitchSpeed": 61, "armStrength": 63, "control": 76, "defense": 63, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "DRAGON-04",
          "name": "金鱗傑",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 58, "power": 78, "speed": 52, "acceleration": 73, "pitchSpeed": 63, "armStrength": 71, "control": 81, "defense": 82, "stamina": 83 },
          "pitches": {}
        },
        {
          "id": "DRAGON-05",
          "name": "雷霆勁",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 77, "power": 74, "speed": 92, "acceleration": 59, "pitchSpeed": 57, "armStrength": 78, "control": 83, "defense": 85, "stamina": 75 },
          "pitches": {}
        },
        {
          "id": "DRAGON-06",
          "name": "烈火豪",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 82, "power": 66, "speed": 55, "acceleration": 70, "pitchSpeed": 60, "armStrength": 88, "control": 80, "defense": 83, "stamina": 53 },
          "pitches": {}
        },
        {
          "id": "DRAGON-07",
          "name": "九霄風",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 84, "power": 80, "speed": 75, "acceleration": 63, "pitchSpeed": 63, "armStrength": 87, "control": 74, "defense": 74, "stamina": 76 },
          "pitches": {}
        },
        {
          "id": "DRAGON-08",
          "name": "百川潮",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 78, "power": 89, "speed": 93, "acceleration": 80, "pitchSpeed": 59, "armStrength": 81, "control": 84, "defense": 68, "stamina": 76 },
          "pitches": {}
        },
        {
          "id": "DRAGON-09",
          "name": "神爪威",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 74, "power": 77, "speed": 86, "acceleration": 77, "pitchSpeed": 71, "armStrength": 70, "control": 67, "defense": 64, "stamina": 65 },
          "pitches": {}
        },
        {
          "id": "DRAGON-10",
          "name": "玉山凱",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 89, "power": 70, "speed": 80, "acceleration": 81, "pitchSpeed": 65, "armStrength": 74, "control": 66, "defense": 70, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "DRAGON-11",
          "name": "大安宇",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 69, "power": 92, "speed": 88, "acceleration": 67, "pitchSpeed": 66, "armStrength": 61, "control": 74, "defense": 91, "stamina": 70 },
          "pitches": {}
        },
        {
          "id": "DRAGON-12",
          "name": "信義安",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 79, "power": 73, "speed": 59, "acceleration": 74, "pitchSpeed": 73, "armStrength": 56, "control": 63, "defense": 66, "stamina": 87 },
          "pitches": {}
        },
        {
          "id": "DRAGON-13",
          "name": "一零一",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 81, "power": 68, "speed": 71, "acceleration": 82, "pitchSpeed": 86, "armStrength": 71, "control": 79, "defense": 60, "stamina": 63 },
          "pitches": { "伸卡球": 74 }
        },
        {
          "id": "DRAGON-14",
          "name": "象山步",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 68, "power": 65, "speed": 60, "acceleration": 71, "pitchSpeed": 75, "armStrength": 58, "control": 75, "defense": 66, "stamina": 84 },
          "pitches": { "滑球": 74, "伸卡球": 86 }
        },
        {
          "id": "DRAGON-15",
          "name": "士林夜",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 66, "power": 74, "speed": 67, "acceleration": 67, "pitchSpeed": 78, "armStrength": 68, "control": 74, "defense": 74, "stamina": 65 },
          "pitches": { "卡特球": 50, "曲球": 65 }
        },
        {
          "id": "DRAGON-16",
          "name": "北投泉",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 55, "speed": 61, "acceleration": 81, "pitchSpeed": 54, "armStrength": 87, "control": 73, "defense": 65, "stamina": 86 },
          "pitches": { "伸卡球": 62, "變速球": 80, "指叉球": 100 }
        },
        {
          "id": "DRAGON-17",
          "name": "淡水霞",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 58, "power": 65, "speed": 76, "acceleration": 87, "pitchSpeed": 68, "armStrength": 67, "control": 84, "defense": 80, "stamina": 96 },
          "pitches": { "曲球": 77, "卡特球": 77, "伸卡球": 80 }
        },
        {
          "id": "DRAGON-18",
          "name": "龍山寺",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 61, "power": 67, "speed": 75, "acceleration": 79, "pitchSpeed": 84, "armStrength": 72, "control": 60, "defense": 76, "stamina": 58 },
          "pitches": { "滑球": 79, "卡特球": 70 }
        },
        {
          "id": "DRAGON-19",
          "name": "西門町",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 60, "power": 64, "speed": 64, "acceleration": 76, "pitchSpeed": 78, "armStrength": 67, "control": 66, "defense": 76, "stamina": 82 },
          "pitches": { "滑球": 92, "曲球": 86, "變速球": 88 }
        },
        {
          "id": "DRAGON-20",
          "name": "木柵貓",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 53, "speed": 77, "acceleration": 67, "pitchSpeed": 74, "armStrength": 60, "control": 68, "defense": 73, "stamina": 60 },
          "pitches": { "指叉球": 63, "卡特球": 60, "變速球": 88 }
        },
        {
          "id": "DRAGON-21",
          "name": "內湖科",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 50, "power": 81, "speed": 83, "acceleration": 92, "pitchSpeed": 78, "armStrength": 59, "control": 78, "defense": 76, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "DRAGON-22",
          "name": "南港展",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 92, "power": 66, "speed": 78, "acceleration": 91, "pitchSpeed": 61, "armStrength": 59, "control": 87, "defense": 82, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "DRAGON-23",
          "name": "信義威",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 80, "power": 78, "speed": 58, "acceleration": 77, "pitchSpeed": 50, "armStrength": 87, "control": 85, "defense": 89, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "DRAGON-24",
          "name": "大稻埕",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 79, "power": 78, "speed": 61, "acceleration": 78, "pitchSpeed": 70, "armStrength": 79, "control": 69, "defense": 67, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "DRAGON-25",
          "name": "陽明花",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 85, "power": 77, "speed": 94, "acceleration": 70, "pitchSpeed": 85, "armStrength": 65, "control": 96, "defense": 89, "stamina": 90 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "POPE",
      "name": "凡蒂岡教皇隊",
      "league": "INTL",
      "logo": "./baseball/pope.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#78281f",
          "body": "#78281f",
          "arms": "#78281f",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#fdfefe",
          "body": "#fdfefe",
          "arms": "#fdfefe",
          "shoes": "#1c1c1c"
        }
      },
      "players": [
        {
          "id": "POPE-01",
          "name": "庇護安",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 57, "power": 50, "speed": 78, "acceleration": 71, "pitchSpeed": 66, "armStrength": 69, "control": 76, "defense": 79, "stamina": 70 },
          "pitches": { "曲球": 60, "變速球": 71 }
        },
        {
          "id": "POPE-02",
          "name": "十字傑",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 69, "power": 67, "speed": 56, "acceleration": 80, "pitchSpeed": 81, "armStrength": 75, "control": 81, "defense": 80, "stamina": 74 },
          "pitches": {}
        },
        {
          "id": "POPE-03",
          "name": "若望保",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 61, "power": 84, "speed": 100, "acceleration": 96, "pitchSpeed": 79, "armStrength": 86, "control": 82, "defense": 72, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "POPE-04",
          "name": "本篤凱",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 80, "power": 70, "speed": 79, "acceleration": 75, "pitchSpeed": 58, "armStrength": 99, "control": 77, "defense": 74, "stamina": 56 },
          "pitches": {}
        },
        {
          "id": "POPE-05",
          "name": "方濟各",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 79, "power": 65, "speed": 71, "acceleration": 77, "pitchSpeed": 57, "armStrength": 67, "control": 71, "defense": 87, "stamina": 67 },
          "pitches": {}
        },
        {
          "id": "POPE-06",
          "name": "伯多祿",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 69, "power": 77, "speed": 74, "acceleration": 75, "pitchSpeed": 63, "armStrength": 72, "control": 94, "defense": 63, "stamina": 66 },
          "pitches": {}
        },
        {
          "id": "POPE-07",
          "name": "聖座翔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 77, "power": 80, "speed": 75, "acceleration": 74, "pitchSpeed": 64, "armStrength": 75, "control": 72, "defense": 80, "stamina": 84 },
          "pitches": {}
        },
        {
          "id": "POPE-08",
          "name": "聖殿風",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 66, "power": 82, "speed": 65, "acceleration": 90, "pitchSpeed": 63, "armStrength": 76, "control": 65, "defense": 62, "stamina": 92 },
          "pitches": {}
        },
        {
          "id": "POPE-09",
          "name": "天國威",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 79, "power": 78, "speed": 66, "acceleration": 66, "pitchSpeed": 53, "armStrength": 100, "control": 90, "defense": 77, "stamina": 100 },
          "pitches": {}
        },
        {
          "id": "POPE-10",
          "name": "福音宇",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 74, "power": 69, "speed": 91, "acceleration": 74, "pitchSpeed": 57, "armStrength": 78, "control": 71, "defense": 76, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "POPE-11",
          "name": "聖歌安",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 79, "power": 67, "speed": 89, "acceleration": 70, "pitchSpeed": 56, "armStrength": 78, "control": 92, "defense": 84, "stamina": 69 },
          "pitches": {}
        },
        {
          "id": "POPE-12",
          "name": "梵蒂岡",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 71, "power": 72, "speed": 51, "acceleration": 62, "pitchSpeed": 60, "armStrength": 72, "control": 69, "defense": 68, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "POPE-13",
          "name": "良十三",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 57, "power": 76, "speed": 65, "acceleration": 76, "pitchSpeed": 61, "armStrength": 74, "control": 73, "defense": 55, "stamina": 73 },
          "pitches": { "滑球": 85, "伸卡球": 95 }
        },
        {
          "id": "POPE-14",
          "name": "額我略",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 73, "power": 56, "speed": 78, "acceleration": 86, "pitchSpeed": 72, "armStrength": 70, "control": 69, "defense": 85, "stamina": 84 },
          "pitches": { "指叉球": 100, "卡特球": 90, "伸卡球": 69 }
        },
        {
          "id": "POPE-15",
          "name": "西斯汀",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 50, "power": 50, "speed": 81, "acceleration": 73, "pitchSpeed": 88, "armStrength": 79, "control": 64, "defense": 81, "stamina": 78 },
          "pitches": { "變速球": 74, "曲球": 75 }
        },
        {
          "id": "POPE-16",
          "name": "聖伯多",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 55, "power": 53, "speed": 75, "acceleration": 94, "pitchSpeed": 79, "armStrength": 89, "control": 76, "defense": 88, "stamina": 92 },
          "pitches": { "滑球": 82, "指叉球": 92 }
        },
        {
          "id": "POPE-17",
          "name": "彌撒傑",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 70, "power": 50, "speed": 77, "acceleration": 88, "pitchSpeed": 66, "armStrength": 82, "control": 54, "defense": 88, "stamina": 71 },
          "pitches": { "卡特球": 71, "曲球": 66 }
        },
        {
          "id": "POPE-18",
          "name": "聖水安",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 50, "speed": 77, "acceleration": 82, "pitchSpeed": 78, "armStrength": 100, "control": 77, "defense": 82, "stamina": 77 },
          "pitches": { "變速球": 51, "指叉球": 73 }
        },
        {
          "id": "POPE-19",
          "name": "紅衣凱",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 59, "power": 72, "speed": 87, "acceleration": 77, "pitchSpeed": 88, "armStrength": 66, "control": 81, "defense": 67, "stamina": 65 },
          "pitches": { "卡特球": 75 }
        },
        {
          "id": "POPE-20",
          "name": "瑞士衛",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 59, "power": 55, "speed": 85, "acceleration": 61, "pitchSpeed": 77, "armStrength": 68, "control": 64, "defense": 78, "stamina": 78 },
          "pitches": { "伸卡球": 71 }
        },
        {
          "id": "POPE-21",
          "name": "聖母院",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 73, "power": 78, "speed": 70, "acceleration": 77, "pitchSpeed": 63, "armStrength": 66, "control": 53, "defense": 67, "stamina": 77 },
          "pitches": {}
        },
        {
          "id": "POPE-22",
          "name": "奧斯定",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 81, "power": 69, "speed": 65, "acceleration": 63, "pitchSpeed": 61, "armStrength": 68, "control": 88, "defense": 88, "stamina": 71 },
          "pitches": {}
        },
        {
          "id": "POPE-23",
          "name": "阿奎那",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 85, "power": 79, "speed": 71, "acceleration": 70, "pitchSpeed": 55, "armStrength": 71, "control": 75, "defense": 67, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "POPE-24",
          "name": "保祿六",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 83, "power": 75, "speed": 88, "acceleration": 79, "pitchSpeed": 50, "armStrength": 68, "control": 60, "defense": 54, "stamina": 83 },
          "pitches": {}
        },
        {
          "id": "POPE-25",
          "name": "克萊孟",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 79, "power": 63, "speed": 58, "acceleration": 76, "pitchSpeed": 50, "armStrength": 77, "control": 82, "defense": 73, "stamina": 75 },
          "pitches": {}
        }
      ]
    },
    {
      "id": "KYIV",
      "name": "基輔無人機隊",
      "league": "INTL",
      "logo": "./baseball/drone.webp",
      "music": {
        "chance": "chance.mp3",
        "cheer": "cheer.mp3",
        "out": "out.mp3"
      },
      "crowd": {
        "fly": "normal_scream.m4a",
        "strikeout": "middle_scream.m4a",
        "score": "long_scream.m4a",
        "hit": "middle_scream2.m4a",
        "homerun": "long_scream2.m4a",
        "win": "long_scream4.m4a"
      },
      "uniforms": {
        "home": {
          "helmet": "#0057b7",
          "body": "#ffd700",
          "arms": "#ffd700",
          "shoes": "#f2f2f2"
        },
        "away": {
          "helmet": "#0057b7",
          "body": "#ffd700",
          "arms": "#ffd700",
          "shoes": "#f2f2f2"
        }
      },
      "players": [
        {
          "id": "KYIV-01",
          "name": "博格丹",
          "number": 1,
          "position": "投手",
          "attributes": { "batBox": 61, "power": 50, "speed": 80, "acceleration": 78, "pitchSpeed": 52, "armStrength": 72, "control": 75, "defense": 74, "stamina": 51 },
          "pitches": { "卡特球": 69, "變速球": 74, "伸卡球": 75 }
        },
        {
          "id": "KYIV-02",
          "name": "塔拉斯",
          "number": 2,
          "position": "捕手",
          "attributes": { "batBox": 57, "power": 71, "speed": 71, "acceleration": 59, "pitchSpeed": 64, "armStrength": 67, "control": 86, "defense": 81, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "KYIV-03",
          "name": "德米特里",
          "number": 3,
          "position": "一壘手",
          "attributes": { "batBox": 60, "power": 79, "speed": 82, "acceleration": 88, "pitchSpeed": 62, "armStrength": 74, "control": 68, "defense": 89, "stamina": 73 },
          "pitches": {}
        },
        {
          "id": "KYIV-04",
          "name": "安德烈",
          "number": 4,
          "position": "二壘手",
          "attributes": { "batBox": 68, "power": 83, "speed": 68, "acceleration": 82, "pitchSpeed": 75, "armStrength": 81, "control": 77, "defense": 72, "stamina": 61 },
          "pitches": {}
        },
        {
          "id": "KYIV-05",
          "name": "伊万",
          "number": 5,
          "position": "游擊手",
          "attributes": { "batBox": 84, "power": 70, "speed": 73, "acceleration": 60, "pitchSpeed": 69, "armStrength": 71, "control": 87, "defense": 83, "stamina": 68 },
          "pitches": {}
        },
        {
          "id": "KYIV-06",
          "name": "谢尔盖",
          "number": 6,
          "position": "三壘手",
          "attributes": { "batBox": 64, "power": 70, "speed": 65, "acceleration": 72, "pitchSpeed": 59, "armStrength": 75, "control": 75, "defense": 77, "stamina": 86 },
          "pitches": {}
        },
        {
          "id": "KYIV-07",
          "name": "弗拉基米尔",
          "number": 7,
          "position": "外野手",
          "attributes": { "batBox": 59, "power": 70, "speed": 79, "acceleration": 69, "pitchSpeed": 55, "armStrength": 88, "control": 73, "defense": 71, "stamina": 61 },
          "pitches": {}
        },
        {
          "id": "KYIV-08",
          "name": "马克西姆",
          "number": 8,
          "position": "外野手",
          "attributes": { "batBox": 77, "power": 62, "speed": 83, "acceleration": 73, "pitchSpeed": 69, "armStrength": 76, "control": 64, "defense": 76, "stamina": 82 },
          "pitches": {}
        },
        {
          "id": "KYIV-09",
          "name": "叶夫根尼",
          "number": 9,
          "position": "外野手",
          "attributes": { "batBox": 65, "power": 68, "speed": 83, "acceleration": 67, "pitchSpeed": 57, "armStrength": 78, "control": 69, "defense": 91, "stamina": 72 },
          "pitches": {}
        },
        {
          "id": "KYIV-10",
          "name": "维克托",
          "number": 10,
          "position": "外野手",
          "attributes": { "batBox": 87, "power": 74, "speed": 82, "acceleration": 77, "pitchSpeed": 56, "armStrength": 81, "control": 72, "defense": 70, "stamina": 95 },
          "pitches": {}
        },
        {
          "id": "KYIV-11",
          "name": "阿尔乔姆",
          "number": 11,
          "position": "外野手",
          "attributes": { "batBox": 88, "power": 67, "speed": 72, "acceleration": 89, "pitchSpeed": 64, "armStrength": 80, "control": 68, "defense": 58, "stamina": 78 },
          "pitches": {}
        },
        {
          "id": "KYIV-12",
          "name": "罗曼",
          "number": 12,
          "position": "外野手",
          "attributes": { "batBox": 74, "power": 82, "speed": 74, "acceleration": 75, "pitchSpeed": 67, "armStrength": 69, "control": 74, "defense": 65, "stamina": 85 },
          "pitches": {}
        },
        {
          "id": "KYIV-13",
          "name": "奥列格",
          "number": 13,
          "position": "投手",
          "attributes": { "batBox": 52, "power": 57, "speed": 82, "acceleration": 86, "pitchSpeed": 78, "armStrength": 80, "control": 86, "defense": 71, "stamina": 75 },
          "pitches": { "卡特球": 81, "變速球": 83 }
        },
        {
          "id": "KYIV-14",
          "name": "米科拉",
          "number": 14,
          "position": "投手",
          "attributes": { "batBox": 62, "power": 60, "speed": 86, "acceleration": 80, "pitchSpeed": 70, "armStrength": 74, "control": 100, "defense": 78, "stamina": 96 },
          "pitches": { "卡特球": 71, "滑球": 70, "曲球": 87 }
        },
        {
          "id": "KYIV-15",
          "name": "帕夫洛",
          "number": 15,
          "position": "投手",
          "attributes": { "batBox": 63, "power": 69, "speed": 84, "acceleration": 74, "pitchSpeed": 78, "armStrength": 85, "control": 50, "defense": 81, "stamina": 76 },
          "pitches": { "變速球": 92, "指叉球": 50 }
        },
        {
          "id": "KYIV-16",
          "name": "雅罗斯",
          "number": 16,
          "position": "投手",
          "attributes": { "batBox": 54, "power": 64, "speed": 79, "acceleration": 70, "pitchSpeed": 60, "armStrength": 75, "control": 93, "defense": 54, "stamina": 87 },
          "pitches": { "曲球": 64 }
        },
        {
          "id": "KYIV-17",
          "name": "基辅风",
          "number": 17,
          "position": "投手",
          "attributes": { "batBox": 77, "power": 50, "speed": 71, "acceleration": 88, "pitchSpeed": 64, "armStrength": 62, "control": 56, "defense": 73, "stamina": 70 },
          "pitches": { "伸卡球": 76, "滑球": 75 }
        },
        {
          "id": "KYIV-18",
          "name": "第聂伯",
          "number": 18,
          "position": "投手",
          "attributes": { "batBox": 64, "power": 68, "speed": 72, "acceleration": 71, "pitchSpeed": 78, "armStrength": 88, "control": 69, "defense": 86, "stamina": 76 },
          "pitches": { "滑球": 77, "曲球": 70, "變速球": 83 }
        },
        {
          "id": "KYIV-19",
          "name": "黑土地",
          "number": 19,
          "position": "投手",
          "attributes": { "batBox": 80, "power": 67, "speed": 68, "acceleration": 84, "pitchSpeed": 88, "armStrength": 71, "control": 77, "defense": 83, "stamina": 77 },
          "pitches": { "指叉球": 71, "伸卡球": 76 }
        },
        {
          "id": "KYIV-20",
          "name": "向日葵",
          "number": 20,
          "position": "投手",
          "attributes": { "batBox": 64, "power": 70, "speed": 86, "acceleration": 73, "pitchSpeed": 80, "armStrength": 89, "control": 74, "defense": 81, "stamina": 84 },
          "pitches": { "卡特球": 54, "伸卡球": 65 }
        },
        {
          "id": "KYIV-21",
          "name": "勒维夫",
          "number": 21,
          "position": "捕手",
          "attributes": { "batBox": 76, "power": 74, "speed": 70, "acceleration": 84, "pitchSpeed": 62, "armStrength": 60, "control": 84, "defense": 76, "stamina": 93 },
          "pitches": {}
        },
        {
          "id": "KYIV-22",
          "name": "敖德萨",
          "number": 22,
          "position": "一壘手",
          "attributes": { "batBox": 77, "power": 66, "speed": 92, "acceleration": 67, "pitchSpeed": 58, "armStrength": 64, "control": 71, "defense": 73, "stamina": 63 },
          "pitches": {}
        },
        {
          "id": "KYIV-23",
          "name": "哈尔科",
          "number": 23,
          "position": "二壘手",
          "attributes": { "batBox": 77, "power": 71, "speed": 80, "acceleration": 60, "pitchSpeed": 62, "armStrength": 74, "control": 70, "defense": 58, "stamina": 81 },
          "pitches": {}
        },
        {
          "id": "KYIV-24",
          "name": "自由广",
          "number": 24,
          "position": "游擊手",
          "attributes": { "batBox": 63, "power": 81, "speed": 78, "acceleration": 50, "pitchSpeed": 50, "armStrength": 88, "control": 91, "defense": 75, "stamina": 59 },
          "pitches": {}
        },
        {
          "id": "KYIV-25",
          "name": "金门桥",
          "number": 25,
          "position": "三壘手",
          "attributes": { "batBox": 71, "power": 91, "speed": 80, "acceleration": 59, "pitchSpeed": 77, "armStrength": 73, "control": 63, "defense": 71, "stamina": 69 },
          "pitches": {}
        }
      ]
    }
  ]
};
