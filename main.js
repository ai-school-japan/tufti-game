/**
 * TUFTI流・引き寄せゲーム - Main Game Logic
 * "Reality is not something to fight, but something to choose."
 *
 * Architecture: Data-Driven SPA
 * - All game data loaded via fetch() from /data/*.json
 * - Falls back to inline data if running via file:// (no server)
 * - State managed in localStorage (future: Firebase)
 * - No framework dependencies
 */

'use strict';

// ================================================================
// CONFIG
// ================================================================

const CONFIG = {
  DATA_BASE:   './data/',
  AUDIO_BASE:  './assets/audio/',   // WAV音声ファイルのフォルダ
  AUDIO_EXT:   '.wav',              // 拡張子：.wav または .mp3
  AUDIO_VOL:   0.85,                // 音量 0.0〜1.0
  PARTICLE_COUNT:    30,
  MIKO_TYPING_SPEED: 45,            // ms per character
  SCENE_TRANSITION_MS: 350,
  TOAST_DURATION_MS: 3000,
  DAILY_LOGIN_RP: 5,
  VERSION: '2.1.0',
};


// ================================================================
// INLINE FALLBACK DATA (used when fetch() fails, e.g. file:// protocol)
// ================================================================

const FALLBACK_WORLDS = [
  {id:'love',name:'愛',emoji:'💜',themeColor:'#C86AD2',themeColorDark:'#7B2F8A',themeGradient:'linear-gradient(135deg,#2D0038 0%,#7B2F8A 50%,#C86AD2 100%)',particleId:'hearts',bgmId:'love.mp3',weight:0.7,description:'愛と絆の世界線。',unlockLevel:1,mikoMessage:'愛の世界線へようこそ。心を開いて。'},
  {id:'health',name:'健康',emoji:'💚',themeColor:'#4CAF50',themeColorDark:'#1B5E20',themeGradient:'linear-gradient(135deg,#003300 0%,#1B5E20 50%,#4CAF50 100%)',particleId:'heal',bgmId:'health.mp3',weight:0.7,description:'身体と魂が輝く健康の世界線。',unlockLevel:1,mikoMessage:'健康の世界線を選んだのね。身体の声を聞いて。'},
  {id:'money',name:'お金',emoji:'✨',themeColor:'#FFD700',themeColorDark:'#7B5E00',themeGradient:'linear-gradient(135deg,#1A1200 0%,#7B5E00 50%,#FFD700 100%)',particleId:'coins',bgmId:'abundance.mp3',weight:0.6,description:'豊かさと繁栄の世界線。',unlockLevel:1,mikoMessage:'豊かさの世界線ね。流れを信頼して。'},
  {id:'work',name:'仕事',emoji:'🔥',themeColor:'#FF6B35',themeColorDark:'#7A2E00',themeGradient:'linear-gradient(135deg,#1A0A00 0%,#7A2E00 50%,#FF6B35 100%)',particleId:'spark',bgmId:'work.mp3',weight:0.7,description:'才能が輝く仕事の世界線。',unlockLevel:1,mikoMessage:'仕事の世界線を選んだわ。あなたの才能を信じて。'},
  {id:'relations',name:'人間関係',emoji:'🌸',themeColor:'#FF9FB2',themeColorDark:'#7A2040',themeGradient:'linear-gradient(135deg,#1A0010 0%,#7A2040 50%,#FF9FB2 100%)',particleId:'sakura',bgmId:'harmony.mp3',weight:0.65,description:'人との絆が深まる世界線。',unlockLevel:1,mikoMessage:'人間関係の世界線ね。心のつながりを大切にして。'},
  {id:'freedom',name:'自由',emoji:'🦋',themeColor:'#64B5F6',themeColorDark:'#0D47A1',themeGradient:'linear-gradient(135deg,#000D1A 0%,#0D47A1 50%,#64B5F6 100%)',particleId:'breeze',bgmId:'freedom.mp3',weight:0.6,description:'魂が自由に飛び立つ世界線。',unlockLevel:2,mikoMessage:'自由の世界線へ。制限は幻想よ。'},
  {id:'challenge',name:'挑戦',emoji:'⚡',themeColor:'#FFC107',themeColorDark:'#7B4F00',themeGradient:'linear-gradient(135deg,#1A1000 0%,#7B4F00 50%,#FFC107 100%)',particleId:'lightning',bgmId:'challenge.mp3',weight:0.7,description:'限界を突破する挑戦の世界線。',unlockLevel:1,mikoMessage:'挑戦の世界線ね。恐れは成長の入り口よ。'},
  {id:'gratitude',name:'感謝',emoji:'🌟',themeColor:'#A5D6A7',themeColorDark:'#1B5E20',themeGradient:'linear-gradient(135deg,#001A00 0%,#1B5E20 50%,#A5D6A7 100%)',particleId:'shine',bgmId:'gratitude.mp3',weight:0.75,description:'感謝の波動が現実を変える世界線。',unlockLevel:1,mikoMessage:'感謝の世界線を選んだのね。豊かな心が現実を変える。'},
  {id:'miracle',name:'奇跡',emoji:'🌙',themeColor:'#B39DDB',themeColorDark:'#4A148C',themeGradient:'linear-gradient(135deg,#0A0014 0%,#4A148C 50%,#B39DDB 100%)',particleId:'aurora',bgmId:'miracle.mp3',weight:0.5,description:'宇宙の奇跡が起きる世界線。',unlockLevel:3,mikoMessage:'奇跡の世界線ね。宇宙はいつもあなたの味方よ。'},
  {id:'growth',name:'成長',emoji:'🌿',themeColor:'#80CBC4',themeColorDark:'#004D40',themeGradient:'linear-gradient(135deg,#001A16 0%,#004D40 50%,#80CBC4 100%)',particleId:'shine',bgmId:'growth.mp3',weight:0.7,description:'魂が進化する成長の世界線。',unlockLevel:1,mikoMessage:'成長の世界線を選んだわ。あなたは常に進化している。'}
];

const FALLBACK_MIKO = {
  welcome:['うふふ…また来たのね。','待っていたわ。','今日はどんな未来を選ぶの？','世界線があなたを呼んでいるわ。'],
  login:['今日も世界線を選ぶのよ。','また会えたわ。今日はどんな日にする？'],
  choice:['その選択も悪くないわ。','面白い選択ね。','あなたの直感を信じて。','心が動く方へ進んで。'],
  levelup:['レベルアップしました！意識が高まったわ。','進化のときよ…おめでとう。'],
  reward:['報酬を得たわ。','素敵な結果ね。','現実が動き始めているわ。'],
  mission:['新たなミッションが始まるわ。','挑戦を受け入れるかしないかはあなた次第。'],
  worldSelect:['どの世界線に進む？','心が惹かれる世界線を選んで。','直感で選ぶのが正解よ。'],
  noEvent:['今日はイベントがないわ。でも、それも意味があるのよ。'],
  ending:['これで一つの旅は終わり。また来て、続きを紡いでね。','今日の選択は宇宙に刻まれたわ。'],
  idle:['…まだそこにいるの？','心の声を聞いてみて。'],
  rare:['珍しいことが起きているわ…宇宙があなたに特別なものを届けているの。'],
  legendary:['…これは伝説よ。宇宙の奇跡があなたのもとへ降りてきた。']
};

const FALLBACK_LEVELS = [
  {level:1,name:'旅人',xpRequired:0,xpToNext:50,title:'世界線の旅人',description:'現実の旅を始めたばかり。',unlockedWorlds:['love','health','money','work','relations','challenge','gratitude','growth'],mikoMessage:'旅人として最初の一歩を踏み出したわ。'},
  {level:2,name:'探求者',xpRequired:50,xpToNext:100,title:'世界線の探求者',description:'現実の深さを探り始めた。',unlockedWorlds:['freedom'],mikoMessage:'意識が広がってきたわ。自由の世界線が開いたよ。'},
  {level:3,name:'覚醒者',xpRequired:150,xpToNext:200,title:'覚醒した意識',description:'現実創造の仕組みに気づき始めた。',unlockedWorlds:['miracle'],mikoMessage:'奇跡の世界線が開いたわ…あなたは特別なの。'},
  {level:4,name:'創造者',xpRequired:350,xpToNext:300,title:'現実の創造者',description:'自分の現実を意図的に創造できる。',unlockedWorlds:[],mikoMessage:'現実創造者としての意識が芽生えたわ。'},
  {level:5,name:'世界線マスター',xpRequired:650,xpToNext:400,title:'世界線の支配者',description:'複数の世界線を自在に操る力を持つ。',unlockedWorlds:[],mikoMessage:'世界線を超えた存在になりつつあるわ。'},
  {level:6,name:'時空の扉守',xpRequired:1050,xpToNext:500,title:'時空の扉を守る者',description:'時間と空間を超えた認識を持つ。',unlockedWorlds:[],mikoMessage:'時空の扉を開く力があなたにあるわ。'},
  {level:7,name:'奇跡の語り部',xpRequired:1550,xpToNext:700,title:'奇跡を語る者',description:'自らが奇跡の源となり、他者にも影響を与える。',unlockedWorlds:[],mikoMessage:'伝説の世界線イベントが解放されたわ。'},
  {level:8,name:'宇宙の使者',xpRequired:2250,xpToNext:1000,title:'宇宙からの使者',description:'宇宙の意志を体現する存在。',unlockedWorlds:[],mikoMessage:'宇宙があなたを使者として選んだわ。'},
  {level:9,name:'神秘の体現者',xpRequired:3250,xpToNext:1500,title:'神秘を体現する者',description:'すべての世界線が透けて見える存在。',unlockedWorlds:[],mikoMessage:'もうすぐ頂点に到達するわ…見守っているわ。'},
  {level:10,name:'現実の神',xpRequired:4750,xpToNext:null,title:'現実創造の神',description:'現実のすべてを意のままに創造できる最上位の存在。',unlockedWorlds:[],mikoMessage:'あなたは…もう神の領域に達したわ。'}
];

const FALLBACK_EVENTS = [
  {id:'evt_001',title:'運命の出会い',description:'通勤電車の中で、不思議と目が合う人がいた。',category:'愛',rarity:'common',levelRequirement:1,probability:0.8,mikoVoiceId:'choice',choices:[{text:'微笑みを返す',rp:5,worldLineBonus:'愛'},{text:'そっと目を逸らす',rp:2,worldLineBonus:null}]},
  {id:'evt_002',title:'心の声',description:'大切な人に、ずっと伝えられなかった言葉がある。',category:'愛',rarity:'uncommon',levelRequirement:2,probability:0.6,mikoVoiceId:'choice',choices:[{text:'今日こそ伝える',rp:8,worldLineBonus:'愛'},{text:'タイミングを待つ',rp:3,worldLineBonus:null}]},
  {id:'evt_003',title:'朝の目覚め',description:'今日は清々しく目覚めた。体が軽い。',category:'健康',rarity:'common',levelRequirement:1,probability:0.9,mikoVoiceId:'reward',choices:[{text:'朝のルーティンを始める',rp:5,worldLineBonus:'健康'},{text:'もう少し休む',rp:1,worldLineBonus:null}]},
  {id:'evt_004',title:'思わぬ収入',description:'忘れていた口座に残高があった。',category:'お金',rarity:'uncommon',levelRequirement:2,probability:0.5,mikoVoiceId:'reward',choices:[{text:'投資に回す',rp:7,worldLineBonus:'お金'},{text:'大切な人に使う',rp:6,worldLineBonus:'愛'}]},
  {id:'evt_005',title:'重要な提案',description:'上司から大きなプロジェクトを任された。',category:'仕事',rarity:'uncommon',levelRequirement:2,probability:0.6,mikoVoiceId:'mission',choices:[{text:'全力で取り組む',rp:8,worldLineBonus:'仕事'},{text:'チームに頼る',rp:6,worldLineBonus:'人間関係'}]},
  {id:'evt_006',title:'古い友人からの連絡',description:'長い間連絡が途絶えていた友人から突然メッセージが届いた。',category:'人間関係',rarity:'common',levelRequirement:1,probability:0.75,mikoVoiceId:'choice',choices:[{text:'すぐに返信して再会を約束する',rp:6,worldLineBonus:'人間関係'},{text:'温かい言葉を送る',rp:4,worldLineBonus:'愛'}]},
  {id:'evt_007',title:'魂の自由',description:'ずっとやりたかったことをやる勇気が湧いてきた。',category:'自由',rarity:'uncommon',levelRequirement:2,probability:0.6,mikoVoiceId:'mission',choices:[{text:'今すぐ行動する',rp:9,worldLineBonus:'挑戦'},{text:'計画を立てる',rp:6,worldLineBonus:'仕事'}]},
  {id:'evt_008',title:'新しい挑戦',description:'未知の領域に足を踏み入れるチャンスが訪れた。',category:'挑戦',rarity:'common',levelRequirement:1,probability:0.8,mikoVoiceId:'mission',choices:[{text:'恐れずに飛び込む',rp:8,worldLineBonus:'挑戦'},{text:'小さな一歩から始める',rp:5,worldLineBonus:'成長'}]},
  {id:'evt_009',title:'感謝の力',description:'今日、自分を支えてくれた人たちに気づいた。',category:'感謝',rarity:'common',levelRequirement:1,probability:0.85,mikoVoiceId:'reward',choices:[{text:'感謝を言葉にして伝える',rp:6,worldLineBonus:'感謝'},{text:'心の中で深く感謝する',rp:5,worldLineBonus:'感謝'}]},
  {id:'evt_010',title:'宇宙の幸運',description:'すべてが奇跡的にうまく回っている感覚がある。',category:'奇跡',rarity:'rare',levelRequirement:3,probability:0.25,mikoVoiceId:'reward',choices:[{text:'この流れを信頼する',rp:10,worldLineBonus:'奇跡'},{text:'さらなる奇跡を招く行動をする',rp:12,worldLineBonus:'奇跡'}]},
  {id:'evt_011',title:'内なる成長',description:'昨日の自分と、今日の自分が違うと感じる。',category:'成長',rarity:'common',levelRequirement:1,probability:0.8,mikoVoiceId:'levelup',choices:[{text:'変化を楽しむ',rp:6,worldLineBonus:'成長'},{text:'さらに深く学ぶ',rp:7,worldLineBonus:'成長'}]},
  {id:'evt_012',title:'現実創造の瞬間',description:'想像していたことが現実になり始めた。',category:'奇跡',rarity:'legendary',levelRequirement:7,probability:0.05,mikoVoiceId:'ending',choices:[{text:'さらに大きな現実を描く',rp:20,worldLineBonus:'奇跡'},{text:'今ある奇跡に感謝する',rp:15,worldLineBonus:'感謝'}]}
];

const STORAGE_KEYS = {
  name:         'tufti_name',
  rp:           'tufti_rp',
  level:        'tufti_level',
  xp:           'tufti_xp',
  lastLogin:    'tufti_last_login',
  streak:       'tufti_streak',
  worldHistory: 'tufti_world_history',
  totalDays:    'tufti_total_days',
};

// ================================================================
// STATE
// ================================================================

const state = {
  // Player
  name:         localStorage.getItem(STORAGE_KEYS.name) || '',
  rp:           Number(localStorage.getItem(STORAGE_KEYS.rp))    || 0,
  level:        Number(localStorage.getItem(STORAGE_KEYS.level)) || 1,
  xp:           Number(localStorage.getItem(STORAGE_KEYS.xp))   || 0,
  lastLogin:    localStorage.getItem(STORAGE_KEYS.lastLogin)     || '',
  streak:       Number(localStorage.getItem(STORAGE_KEYS.streak))|| 0,
  totalDays:    Number(localStorage.getItem(STORAGE_KEYS.totalDays)) || 0,
  worldHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.worldHistory) || '[]'),

  // Runtime (not persisted)
  currentWorld: null,
  currentEvent: null,
  currentScene: 'loading',    // loading | temple | login | game | profile

  // Data (loaded via fetch)
  data: {
    events:  [],
    worlds:  [],
    miko:    {},
    levels:  [],
  },
};

// ================================================================
// SAVE / LOAD
// ================================================================

function saveState() {
  localStorage.setItem(STORAGE_KEYS.name,         state.name);
  localStorage.setItem(STORAGE_KEYS.rp,           state.rp);
  localStorage.setItem(STORAGE_KEYS.level,        state.level);
  localStorage.setItem(STORAGE_KEYS.xp,           state.xp);
  localStorage.setItem(STORAGE_KEYS.lastLogin,    state.lastLogin);
  localStorage.setItem(STORAGE_KEYS.streak,       state.streak);
  localStorage.setItem(STORAGE_KEYS.totalDays,    state.totalDays);
  localStorage.setItem(STORAGE_KEYS.worldHistory, JSON.stringify(state.worldHistory));
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function handleDailyLogin() {
  const td = today();
  if (state.lastLogin === td) return false; // Already logged in today

  // Check streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (state.lastLogin === yesterday) {
    state.streak += 1;
  } else {
    state.streak = 1;
  }

  state.lastLogin = td;
  state.rp += CONFIG.DAILY_LOGIN_RP;
  state.totalDays += 1;
  return true; // First login today
}

// ================================================================
// DATA LOADING
// ================================================================

async function loadJSON(filename) {
  const res = await fetch(`${CONFIG.DATA_BASE}${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

async function loadAllData() {
  const tryFetch = async (filename, fallback) => {
    try {
      return await loadJSON(filename);
    } catch {
      console.warn(`Using fallback data for ${filename}`);
      return fallback;
    }
  };

  const [events, worlds, miko, levels] = await Promise.all([
    tryFetch('events.json', FALLBACK_EVENTS),
    tryFetch('worlds.json', FALLBACK_WORLDS),
    tryFetch('miko.json',   FALLBACK_MIKO),
    tryFetch('levels.json', FALLBACK_LEVELS),
  ]);

  state.data.events = events;
  state.data.worlds = worlds;
  state.data.miko   = miko;
  state.data.levels = levels;
}

// ================================================================
// THEME / WORLD SYSTEM
// ================================================================

function applyWorldTheme(world) {
  if (!world) return;
  document.documentElement.style.setProperty('--theme-color',    world.themeColor);
  document.documentElement.style.setProperty('--theme-dark',     world.themeColorDark);
  document.documentElement.style.setProperty('--theme-gradient', world.themeGradient);
  document.documentElement.style.setProperty('--accent-glow',    world.themeColor + '55');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', world.themeColorDark);
}

function resetTheme() {
  document.documentElement.style.setProperty('--theme-color',    '#B39DDB');
  document.documentElement.style.setProperty('--theme-dark',     '#4A148C');
  document.documentElement.style.setProperty('--theme-gradient', 'linear-gradient(135deg, #0A0014 0%, #4A148C 50%, #B39DDB 100%)');
  document.documentElement.style.setProperty('--accent-glow',    'rgba(179,157,219,0.4)');
}

// ================================================================
// EVENT SELECTION (Data-driven, weighted)
// ================================================================

function pickEvent(worldName) {
  const { events } = state.data;
  const levelData  = getCurrentLevelData();
  const maxLevel   = levelData ? levelData.level : state.level;

  // Filter by level requirement
  const eligible = events.filter(e => e.levelRequirement <= maxLevel);
  if (eligible.length === 0) return null;

  // Weight: 70% same category, 30% others
  const sameCategory = eligible.filter(e => e.category === worldName);
  const others        = eligible.filter(e => e.category !== worldName);

  const pool = [];
  const addWeighted = (arr, baseWeight) => {
    arr.forEach(evt => {
      const w = Math.round((evt.probability || 0.5) * baseWeight * 10);
      for (let i = 0; i < w; i++) pool.push(evt);
    });
  };

  addWeighted(sameCategory, 7);
  addWeighted(others,        3);

  if (pool.length === 0) return eligible[Math.floor(Math.random() * eligible.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ================================================================
// MIKO DIALOGUE
// ================================================================

// miko.json の1エントリを正規化する（文字列 or {text,voice} 両対応）
function normalizeMikoEntry(entry) {
  if (typeof entry === 'string') return { text: entry, voice: '' };
  return { text: entry.text || '', voice: entry.voice || '' };
}

function getMikoLine(key) {
  const lines = state.data.miko[key];
  if (!lines || lines.length === 0) return { text: '…', voice: '' };
  const entry = lines[Math.floor(Math.random() * lines.length)];
  return normalizeMikoEntry(entry);
}

// テキストだけ取り出すショートカット
function getMikoText(key) {
  return getMikoLine(key).text;
}


// ================================================================
// LEVEL SYSTEM
// ================================================================

function getCurrentLevelData() {
  return state.data.levels.find(l => l.level === state.level) || state.data.levels[0];
}

function getNextLevelData() {
  return state.data.levels.find(l => l.level === state.level + 1);
}

function addXP(amount) {
  state.xp += amount;
  let didLevelUp = false;
  // Keep leveling up as long as XP threshold is met
  while (state.level < state.data.levels.length) {
    const nextLevel = getNextLevelData();
    if (!nextLevel) break;
    if (state.xp >= nextLevel.xpRequired) {
      state.level += 1;
      didLevelUp = true;
    } else {
      break;
    }
  }
  return didLevelUp;
}

function getXPPercent() {
  const currentLD = getCurrentLevelData();
  const nextLD    = getNextLevelData();
  if (!currentLD || !nextLD) return 100;
  const xpInLevel = state.xp - currentLD.xpRequired;
  const xpNeeded  = nextLD.xpRequired - currentLD.xpRequired;
  if (xpNeeded <= 0) return 100;
  return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
}

// ================================================================
// PARTICLES
// ================================================================
// AUDIO SERVICE（WAV / MP3 対応）
// ================================================================

let _currentAudio  = null;
let _audioUnlocked = false;
let _pendingVoice  = null;

// ユーザーの最初のタップ/クリックで音声を解放する
function _setupAudioUnlock() {
  const unlock = () => {
    if (_audioUnlocked) return;
    _audioUnlocked = true;
    console.log('[Audio] ユーザー操作により音声を解放しました');
    if (_pendingVoice) {
      const v = _pendingVoice;
      _pendingVoice = null;
      setTimeout(() => playVoiceFile(v), 50); // 少し待ってから再生
    }
  };
  // capture:true でボタンハンドラより先にキャッチ
  document.addEventListener('click',      unlock, { once: true, capture: true });
  document.addEventListener('touchend',   unlock, { once: true, capture: true });
}
_setupAudioUnlock();



/**
 * 音声ファイルを再生する
 * 大文字（.WAV）・小文字（.wav）どちらでも自動で試みる
 * @param {string} voiceFile  例: "うふふ…また来たのね。.WAV"
 */
function playVoiceFile(voiceFile) {
  if (!voiceFile) return;

  // ユーザー操作前は保留
  if (!_audioUnlocked) {
    _pendingVoice = voiceFile;
    return;
  }

  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
  }

  // 拡張子の大文字・小文字バリアントを生成
  const lastDot = voiceFile.lastIndexOf('.');
  const base    = voiceFile.slice(0, lastDot);   // 例: 待っていたわ。
  const ext     = voiceFile.slice(lastDot);       // 例: .wav

  // 日本語ファイル名はURLエンコードが必要（file:// でも http:// でも動く）
  const encodedBase = encodeURIComponent(base);

  const candidates = [
    CONFIG.AUDIO_BASE + encodedBase + ext.toLowerCase(), // .wav
    CONFIG.AUDIO_BASE + encodedBase + ext.toUpperCase(), // .WAV
    CONFIG.AUDIO_BASE + base        + ext.toLowerCase(), // エンコードなし .wav
    CONFIG.AUDIO_BASE + base        + ext.toUpperCase(), // エンコードなし .WAV
  ];
  const unique = [...new Set(candidates)];

  function tryNext(index) {
    if (index >= unique.length) {
      console.warn('[Audio] ファイルが見つかりません:', voiceFile);
      return;
    }
    console.log('[Audio] 試みるパス:', unique[index]);
    const audio = new Audio(unique[index]);
    audio.volume = CONFIG.AUDIO_VOL;
    _currentAudio = audio;
    audio.play()
      .then(() => console.log('[Audio] ✅ 再生成功:', unique[index]))
      .catch(err => {
        if (err.name === 'AbortError') {
          // 別の音声が再生されて中断された場合は次の候補を試さない
          return;
        }
        console.warn('[Audio] ❌', err.name, '→ 次を試します');
        tryNext(index + 1);
      });
  }

  tryNext(0);
}




function stopVoice() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
}

function setVoiceVolume(vol) {
  CONFIG.AUDIO_VOL = Math.max(0, Math.min(1, vol));
  if (_currentAudio) _currentAudio.volume = CONFIG.AUDIO_VOL;
}


function spawnParticles() {
  const bg = document.getElementById('particle-bg');

  if (!bg) return;

  // Remove existing particles
  bg.querySelectorAll('.particle').forEach(p => p.remove());

  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size    = Math.random() * 4 + 1;
    const left    = Math.random() * 100;
    const delay   = Math.random() * 12;
    const dur     = Math.random() * 10 + 8;
    const drift   = (Math.random() - 0.5) * 80;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      background: var(--theme-color);
      box-shadow: 0 0 ${size * 2}px var(--theme-color);
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
      --drift: ${drift}px;
    `;
    bg.appendChild(p);
  }
}

// ================================================================
// UI UTILITIES
// ================================================================

const app = document.getElementById('app');

function showToast(msg, duration = CONFIG.TOAST_DURATION_MS) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

function addRipple(el, e) {
  const rect   = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.left = `${(e.clientX || rect.left + rect.width / 2) - rect.left}px`;
  ripple.style.top  = `${(e.clientY || rect.top + rect.height / 2) - rect.top}px`;
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

function transitionScene(renderFn) {
  document.body.classList.add('fade-out');
  setTimeout(() => {
    document.body.classList.remove('fade-out');
    renderFn();
    document.body.classList.add('fade-in');
    document.body.addEventListener('animationend', () => {
      document.body.classList.remove('fade-in');
    }, { once: true });
  }, CONFIG.SCENE_TRANSITION_MS);
}

// ================================================================
// MIKO TYPING ANIMATION
// ================================================================

function typeMikoText(el, text, speed = CONFIG.MIKO_TYPING_SPEED, onDone) {
  el.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'miko-cursor';
  el.appendChild(cursor);

  let i = 0;
  const chars = [...text]; // Unicode-safe

  function typeNext() {
    if (i < chars.length) {
      el.insertBefore(document.createTextNode(chars[i]), cursor);
      i++;
      setTimeout(typeNext, speed);
    } else {
      cursor.remove();
      if (onDone) onDone();
    }
  }

  typeNext();
}

const MIKO_IMG = 'assets/miko_default.png';

function renderMikoPanel(dialogueKey, customText, showPortrait = false) {
  const text = customText || getMikoLine(dialogueKey);
  if (showPortrait) {
    return `
      <div class="glass-card" style="padding:0;overflow:hidden;" role="status" aria-live="polite">
        <div class="miko-panel-row" style="padding:var(--space-md);">
          <img src="${MIKO_IMG}" alt="巫女" class="miko-portrait-sm"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="miko-avatar" style="display:none;" aria-hidden="true">🌸</div>
          <div class="miko-bubble">
            <div class="miko-name">巫 女</div>
            <div class="miko-text" id="miko-text-content"></div>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="glass-card miko-panel" role="status" aria-live="polite">
      <div class="miko-avatar" aria-hidden="true">🌸</div>
      <div class="miko-bubble">
        <div class="miko-name">巫 女</div>
        <div class="miko-text" id="miko-text-content"></div>
      </div>
    </div>
  `;
}

/**
 * 巫女テキストを表示 + 音声を自動再生する
 *
 * 音声の優先順位：
 *   1. miko.json の voice フィールドに書かれたファイル名
 *   2. セリフのテキストそのままのファイル名（例: うふふ…また来たのね。.wav）
 *   3. どちらもなければサイレント（字幕のみ）
 *
 * @param {string|{text,voice}} entry
 */
function startMikoTyping(entry) {
  const { text, voice } = (typeof entry === 'string')
    ? { text: entry, voice: '' }
    : entry;

  // テキストの {name} をプレイヤー名に置換する
  const displayText = text.replace(/{name}/g, state.name || 'あなた');

  // テキスト表示
  const el = document.getElementById('miko-text-content');
  if (el) typeMikoText(el, displayText);

  // 音声再生：voice フィールドがあればそれを優先、なければテキスト名で探す
  const voiceFile = voice || `${text}${CONFIG.AUDIO_EXT}`;
  playVoiceFile(voiceFile);
}




// ================================================================
// DAILY MISSIONS
// ================================================================

const DAILY_MISSIONS = [
  { id: 'login',      icon: '⛩️', title: '神殿への参拝',    desc: '今日ログインする',              rpReward: 5,  xpReward: 8,  storageKey: 'mission_login' },
  { id: 'choose',     icon: '🌙', title: '世界線の選択',    desc: '世界線を1つ選ぶ',               rpReward: 10, xpReward: 15, storageKey: 'mission_choose' },
  { id: 'threechoice',icon: '✨', title: '三つの選択',      desc: '3回イベントを選択する',          rpReward: 15, xpReward: 20, storageKey: 'mission_three' },
  { id: 'rare',       icon: '💫', title: 'レアの出会い',    desc: 'レア以上のイベントに遭遇する',    rpReward: 20, xpReward: 30, storageKey: 'mission_rare' },
];

function getMissionStorage() {
  const key = `tufti_missions_${today()}`;
  return JSON.parse(localStorage.getItem(key) || '{}');
}

function saveMissionStorage(data) {
  const key = `tufti_missions_${today()}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function isMissionDone(missionId) {
  return !!getMissionStorage()[missionId];
}

function completeMission(missionId) {
  const mission = DAILY_MISSIONS.find(m => m.id === missionId);
  if (!mission || isMissionDone(missionId)) return;
  const storage = getMissionStorage();
  storage[missionId] = true;
  saveMissionStorage(storage);
  state.rp += mission.rpReward;
  addXP(mission.xpReward);
  saveState();
  showToast(`🎉 ミッション達成！「${mission.title}」 +${mission.rpReward} RP`);
  updateHUD();
}

function checkAutoMissions(event, rarity) {
  // Auto-complete 'choose' mission on world select
  completeMission('choose');
  // Auto-complete 'rare' mission
  if (rarity === 'rare' || rarity === 'legendary') {
    completeMission('rare');
  }
  // Track choice count
  const key = `tufti_choices_${today()}`;
  const count = Number(localStorage.getItem(key) || 0) + 1;
  localStorage.setItem(key, count);
  if (count >= 3) completeMission('threechoice');
}

function renderMissionsSection() {
  const storage = getMissionStorage();
  const html = DAILY_MISSIONS.map(m => {
    const done = !!storage[m.id];
    return `
      <div class="mission-item ${done ? 'completed' : ''}" data-mission="${m.id}">
        <span class="mission-icon">${m.icon}</span>
        <div class="mission-content">
          <div class="mission-title">${m.title}</div>
          <div class="mission-desc">${m.desc}</div>
        </div>
        <span class="mission-reward">+${m.rpReward} RP</span>
        <span class="mission-check">${done ? '✅' : '○'}</span>
      </div>
    `;
  }).join('');
  return `
    <div>
      <h2 class="section-heading">📋 デイリーミッション</h2>
      <div class="missions-wrap">${html}</div>
    </div>
  `;
}

// ================================================================
// HUD UPDATER
// ================================================================

function updateHUD() {
  const rpEl  = document.getElementById('rp-display');
  const lvEl  = document.getElementById('level-display');
  const xpBar = document.getElementById('xp-bar');
  const xpEl  = document.getElementById('xp-display');
  if (rpEl)  rpEl.textContent  = state.rp;
  if (lvEl)  lvEl.textContent  = state.level;
  const pct = getXPPercent();
  if (xpBar) xpBar.style.width = pct + '%';
  const nextLD = getNextLevelData();
  if (xpEl)  xpEl.textContent  = nextLD
    ? `${state.xp} XP → Lv.${nextLD.level}まで ${nextLD.xpRequired - state.xp} XP`
    : `${state.xp} XP (MAX)`;
}

// ================================================================
// SCENE: LOADING
// ================================================================

function renderLoading() {
  app.innerHTML = `
    <div id="scene-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">世界線を読み込んでいます…</p>
    </div>
  `;
}

// ================================================================
// SCENE: TEMPLE ENTRANCE
// ================================================================

function renderTemple() {
  state.currentScene = 'temple';
  resetTheme();
  spawnParticles();

  const welcomeEntry = getMikoLine('welcome');
  const welcomeText  = welcomeEntry.text;

  app.innerHTML = `
    <div id="scene-temple" role="main">
      <!-- Miko Portrait (hero) -->
      <div class="miko-portrait-full">
        <div class="miko-img-wrap">
          <div class="miko-img-halo"></div>
          <div class="miko-img-halo"></div>
          <img src="${MIKO_IMG}" alt="巫女" class="miko-img"
               onerror="this.parentElement.innerHTML='<span style=\'font-size:5rem;filter:drop-shadow(0 0 20px var(--theme-color))\'>⛩️</span>'">
        </div>
      </div>

      <div style="text-align:center;">
        <h1 class="temple-title">TUFTI流<br>引き寄せゲーム</h1>
        <p class="temple-subtitle">現実は戦うものではなく、<br>選ぶもの。</p>
      </div>

      ${renderMikoPanel('welcome', welcomeText)}

      <button class="btn btn-primary" id="temple-enter-btn" aria-label="神殿に入る">
        🔊 神殿へ入る ✦
      </button>

      <p class="text-muted" style="font-size:0.75rem; letter-spacing:0.08em;">
        〜 タップして世界線を選ぶ 〜
      </p>
    </div>
  `;

  setTimeout(() => startMikoTyping(welcomeEntry), 500);



  document.getElementById('temple-enter-btn').addEventListener('click', (e) => {
    addRipple(e.currentTarget, e);
    // ボタンクリック = ユーザージェスチャー → 音声を必ず再生
    _audioUnlocked = true;
    playVoiceFile(welcomeEntry.voice || `${welcomeEntry.text}${CONFIG.AUDIO_EXT}`);
    transitionScene(() => {
      if (state.name) {
        handleDailyLogin();
        completeMission('login');
        saveState();
        renderGame();
      } else {
        renderLogin();
      }
    });
  });
}

// ================================================================
// SCENE: LOGIN
// ================================================================

function renderLogin() {
  state.currentScene = 'login';
  document.getElementById('bottom-nav').classList.add('hidden');

  const loginEntry = getMikoLine('welcome');
  const loginText  = loginEntry.text;

  app.innerHTML = `
    <div id="scene-login" role="main">
      <div class="login-logo">
        <span class="gate-symbol" aria-hidden="true">⛩️</span>
        <h1 class="login-title">TUFTI流<br>引き寄せゲーム</h1>
        <p class="login-subtitle">あなたの名前を教えて。<br>世界線があなたを待っているわ。</p>
      </div>

      ${renderMikoPanel('welcome', loginText)}

      <div class="login-form glass-card" style="gap:var(--space-lg)">
        <div class="input-group">
          <label class="input-label" for="name-input">あなたの名前</label>
          <input
            type="text"
            id="name-input"
            class="input"
            placeholder="名前を入力してください"
            maxlength="20"
            autocomplete="name"
            aria-label="プレイヤー名入力"
          />
        </div>
        <button class="btn btn-primary" id="login-start-btn" aria-label="旅を始める">
          旅を始める
        </button>
      </div>
    </div>
  `;

  setTimeout(() => startMikoTyping(loginEntry), 400);

  const nameInput = document.getElementById('name-input');
  const startBtn  = document.getElementById('login-start-btn');

  nameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') startBtn.click();
  });

  startBtn.addEventListener('click', (e) => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.style.borderColor = 'var(--rarity-rare)';
      nameInput.focus();
      showToast('名前を入力してください');
      return;
    }
    addRipple(e.currentTarget, e);
    state.name      = name;
    state.lastLogin = today();
    state.streak    = 1;
    state.totalDays = 1;
    state.rp       += CONFIG.DAILY_LOGIN_RP;
    saveState();
    transitionScene(renderGame);
  });
}

// ================================================================
// SCENE: MAIN GAME
// ================================================================

function renderGame() {
  state.currentScene = 'game';
  state.currentWorld = null;
  state.currentEvent = null;

  applyWorldTheme(null); // reset to default if no world selected
  resetTheme();
  spawnParticles();

  const levelData = getCurrentLevelData();
  const xpPct     = getXPPercent();
  const nextLD    = getNextLevelData();
  const worldEntry = getMikoLine('worldSelect');
  const worldText  = worldEntry.text;
  const isNewDay  = !state.worldHistory.find(h => h.date === today());

  // Show bottom nav
  const nav = document.getElementById('bottom-nav');
  nav.classList.remove('hidden');
  nav.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  document.getElementById('nav-game')?.classList.add('active');

  // Build world cards HTML
  const worldCardsHTML = state.data.worlds.map(world => {
    const isLocked  = world.unlockLevel > state.level;
    const lockedCls = isLocked ? ' locked' : '';
    return `
      <button
        class="world-card${lockedCls}"
        data-world-id="${world.id}"
        style="--world-color: ${world.themeColor}; --world-gradient: ${world.themeGradient}; --world-glow: ${world.themeColor}55;"
        aria-label="${world.name}の世界線${isLocked ? ' (ロック中)' : ''}"
        ${isLocked ? 'disabled aria-disabled="true"' : ''}
      >
        <span class="world-emoji" aria-hidden="true">${world.emoji}</span>
        <span class="world-name">${world.name}</span>
        ${isLocked ? `<span class="world-lock">🔒 Lv.${world.unlockLevel}</span>` : ''}
      </button>
    `;
  }).join('');

  app.innerHTML = `
    <div id="scene-game" class="page-content" role="main">
      <!-- HUD -->
      <div class="glass-card hud" style="padding: var(--space-sm) var(--space-md);">
        <div class="hud-name">${state.name}</div>
        <div class="hud-stats">
          <div class="stat-chip">
            <span class="icon" aria-hidden="true">⭐</span>
            <span id="rp-display">${state.rp}</span> RP
          </div>
          <div class="stat-chip">
            <span class="icon" aria-hidden="true">🌿</span>
            Lv.<span id="level-display">${state.level}</span>
          </div>
        </div>
      </div>

      <!-- XP Bar -->
      <div class="xp-bar-wrap glass-card" style="padding: var(--space-sm) var(--space-md);">
        <div class="xp-label">
          <span>${levelData?.name || '旅人'}</span>
          <span id="xp-display">${state.xp} XP ${nextLD ? `→ Lv.${nextLD.level}まで ${nextLD.xpRequired - state.xp} XP` : '(MAX)'}</span>
        </div>
        <div class="xp-bar-track" role="progressbar" aria-valuenow="${xpPct}" aria-valuemin="0" aria-valuemax="100">
          <div class="xp-bar-fill" id="xp-bar" style="width: ${xpPct}%"></div>
        </div>
      </div>

      ${isNewDay ? `
      <!-- Daily login banner -->
      <div class="glass-card daily-banner" id="daily-banner">
        <span class="daily-flame" aria-hidden="true">🔥</span>
        <div class="daily-text">
          <div class="daily-title">${state.streak}日連続ログイン！</div>
          <div class="daily-sub">ログインボーナス +${CONFIG.DAILY_LOGIN_RP} RP 獲得</div>
        </div>
      </div>
      ` : ''}

      <!-- Miko Panel -->
      ${renderMikoPanel('worldSelect', worldText)}

      <!-- World Line Selection -->
      <div class="glass-card" style="padding: var(--space-lg);">
        <p class="section-title" aria-label="今日の世界線を選んでください">— 今日の世界線を選んでください —</p>
        <div class="world-grid" role="list" id="world-grid">
          ${worldCardsHTML}
        </div>
      </div>

      <!-- Event area (hidden initially) -->
      <div id="event-area" class="hidden"></div>
    </div>
  `;

  // Miko typing
  setTimeout(() => startMikoTyping(worldEntry), 300);

  // World card click listeners
  document.querySelectorAll('.world-card:not(.locked)').forEach(card => {
    card.addEventListener('click', (e) => {
      addRipple(e.currentTarget, e);
      const worldId = card.dataset.worldId;
      const world   = state.data.worlds.find(w => w.id === worldId);
      if (!world) return;
      handleWorldSelect(world);
    });
  });

  // Auto-dismiss daily banner
  const banner = document.getElementById('daily-banner');
  if (banner) {
    setTimeout(() => {
      banner.style.transition = 'opacity 0.5s';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 500);
    }, 4000);
  }

  // Missions section (after world grid)
  const missionHTML = renderMissionsSection();
  const missionWrap = document.createElement('div');
  missionWrap.innerHTML = missionHTML;
  document.getElementById('scene-game')?.appendChild(missionWrap);

  // Login mission auto-complete
  completeMission('login');
}

// ================================================================
// WORLD SELECTION
// ================================================================

function handleWorldSelect(world) {
  state.currentWorld = world;
  applyWorldTheme(world);
  spawnParticles();

  // Highlight selected card
  document.querySelectorAll('.world-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-world-id="${world.id}"]`)?.classList.add('selected');

  // Pick event
  const evt = pickEvent(world.name);
  state.currentEvent = evt;

  // Show miko message for world
  const worldMikoEntry = (world.mikoMessage)
    ? { text: world.mikoMessage, voice: `${world.mikoMessage}${CONFIG.AUDIO_EXT}` }
    : getMikoLine('choice');
  const mikoEl = document.getElementById('miko-text-content');
  if (mikoEl) startMikoTyping(worldMikoEntry);

  // Show event after short delay
  setTimeout(() => renderEvent(evt), 600);
}

// ================================================================
// EVENT RENDERING
// ================================================================

function renderEvent(evt) {
  const eventArea = document.getElementById('event-area');
  if (!eventArea) return;

  if (!evt) {
    const noEvtEntry = getMikoLine('noEvent');
    eventArea.classList.remove('hidden');
    eventArea.innerHTML = `
      <div class="glass-card event-card">
        <p class="event-description text-center">${noEvtEntry.text}</p>
        <button class="btn btn-ghost" id="next-day-btn" style="width:100%; margin-top:var(--space-md);">
          また明日
        </button>
      </div>
    `;
    // 音声再生
    startMikoTyping(noEvtEntry);
    document.getElementById('next-day-btn')?.addEventListener('click', () => {
      transitionScene(renderGame);
    });
    return;
  }

  const rarityLabel = {
    common:    'コモン',
    uncommon:  'アンコモン',
    rare:      'レア',
    legendary: '伝説',
  }[evt.rarity] || 'コモン';

  // Special miko message for high rarity
  let mikoVoiceKey = evt.mikoVoiceId || 'choice';
  if (evt.rarity === 'legendary') mikoVoiceKey = 'legendary';
  else if (evt.rarity === 'rare')  mikoVoiceKey = 'rare';

  // Add rarity border glow class
  const rarityBorderClass = evt.rarity === 'legendary' ? 'rarity-legendary-border'
                          : evt.rarity === 'rare'      ? 'rarity-rare-border'
                          : '';

  const choicesHTML = evt.choices.map((ch, i) => `
    <li>
      <button class="choice-btn" data-index="${i}" aria-label="${ch.text} (${ch.rp} RP獲得)">
        <span>${ch.text}</span>
        <span class="choice-rp">+${ch.rp} RP</span>
      </button>
    </li>
  `).join('');

  eventArea.classList.remove('hidden');
  eventArea.innerHTML = `
    <div class="event-card glass-card ${rarityBorderClass} world-transition">
      <div class="event-header">
        <span class="event-rarity rarity-${evt.rarity}">${rarityLabel}</span>
        <span class="event-category">${evt.category}</span>
      </div>
      <h2 class="event-title">${evt.title}</h2>
      <p class="event-description">${evt.description}</p>
      ${renderMikoPanel(evt.mikoVoiceId || 'choice', undefined, true)}
      <p class="choices-label" style="margin-top:var(--space-md);">あなたはどうする？</p>
      <ul class="choices-list" id="choices-list" role="listbox" aria-label="選択肢">
        ${choicesHTML}
      </ul>
    </div>
  `;

  // Start miko typing in event card (with voice)
  setTimeout(() => {
    const evtMikoEl = document.getElementById('miko-text-content');
    if (evtMikoEl) {
      const mikoEntry = getMikoLine(mikoVoiceKey);
      startMikoTyping(mikoEntry);
    }
  }, 300);

  // Scroll to event
  eventArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Choice listeners
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      addRipple(e.currentTarget, e);
      const idx = Number(btn.dataset.index);
      handleChoice(evt.choices[idx], evt);
    });
  });
}

// ================================================================
// CHOICE HANDLING
// ================================================================

function handleChoice(choice, evt) {
  const rpGain = choice.rp || 0;
  const xpGain = Math.ceil(rpGain * 1.5);

  state.rp += rpGain;
  const didLevelUp = addXP(xpGain);

  // Record world history
  state.worldHistory.unshift({
    date:      today(),
    world:     state.currentWorld?.name || '不明',
    worldId:   state.currentWorld?.id   || '',
    worldEmoji:state.currentWorld?.emoji || '🌙',
    event:     evt.title,
    choice:    choice.text,
    rp:        rpGain,
  });
  // Keep last 30
  if (state.worldHistory.length > 30) state.worldHistory.pop();

  saveState();

  // Check auto-missions
  checkAutoMissions(evt, evt.rarity);

  renderResult(rpGain, xpGain, choice, didLevelUp, evt);
}

// ================================================================
// RESULT SCREEN
// ================================================================

function renderResult(rpGain, xpGain, choice, didLevelUp, evt) {
  const eventArea = document.getElementById('event-area');
  if (!eventArea) return;

  const world     = state.currentWorld;
  const mikoKey   = didLevelUp ? 'levelup' : (evt?.mikoVoiceId || 'reward');
  const mikoEntry  = getMikoLine(mikoKey);
  const mikoText   = mikoEntry.text;
  const resultEmoji = didLevelUp ? '🌟' : (rpGain >= 10 ? '✨' : '💫');

  const levelData  = getCurrentLevelData();
  const xpPct      = getXPPercent();
  const nextLD     = getNextLevelData();

  eventArea.innerHTML = `
    <div class="result-card glass-card">
      ${didLevelUp ? `
      <div class="levelup-banner">
        <div class="levelup-text">🎊 レベルアップ！ Lv.${state.level} 「${levelData?.name}」</div>
        <div class="text-muted" style="font-size:0.8rem;margin-top:4px;">${levelData?.mikoMessage || ''}</div>
      </div>
      ` : ''}

      <span class="result-icon" aria-hidden="true">${resultEmoji}</span>
      <div class="result-rp-gain">+${rpGain} RP</div>
      <p class="result-message">
        「${choice.text}」<br>
        <span style="font-size:0.85rem; color:var(--text-muted);">+${xpGain} XP 獲得</span>
      </p>

      <!-- Updated XP Bar -->
      <div class="xp-bar-wrap" style="margin-bottom:var(--space-lg);">
        <div class="xp-label">
          <span>${levelData?.name || '旅人'} Lv.${state.level}</span>
          <span>${xpPct}%</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" style="width:${xpPct}%"></div>
        </div>
      </div>

      <!-- Miko comment -->
      <div class="glass-card miko-panel" style="margin-bottom:var(--space-lg);">
        <div class="miko-avatar" aria-hidden="true">🌸</div>
        <div class="miko-bubble">
          <div class="miko-name">巫 女</div>
          <div class="miko-text" id="result-miko-text"></div>
        </div>
      </div>

      <div class="share-row">
        <button class="btn-share" id="share-btn">📤 シェアする</button>
        <button class="btn-share" id="copy-btn">📋 コピー</button>
      </div>

      <button class="btn btn-primary" id="next-btn" style="margin-top:var(--space-sm);">
        ${world ? `${world.emoji} ${world.name}の世界線へ戻る` : '次の世界線へ'}
      </button>
    </div>
  `;

  // Share button
  document.getElementById('share-btn')?.addEventListener('click', () => {
    const shareText = `【TUFTI流・引き寄せゲーム】\n` +
      `「${choice.text}」を選びました。\n+${rpGain} RP 獲得！\n` +
      (didLevelUp ? `🌟 Lv.${state.level}にレベルアップ！\n` : '') +
      `#TUFTI引き寄せゲーム #現実創造`;
    if (navigator.share) {
      navigator.share({ title: 'TUFTI流・引き寄せゲーム', text: shareText });
    } else {
      navigator.clipboard?.writeText(shareText).then(() => showToast('📋 クリップボードにコピーしました'));
    }
  });

  document.getElementById('copy-btn')?.addEventListener('click', () => {
    const txt = `今日の世界線：${state.currentWorld?.name || '不明'} ${state.currentWorld?.emoji || ''}\n` +
      `選択：「${choice.text}」 → +${rpGain} RP\n` +
      `Lv.${state.level} / ${state.rp} RP 累計\n#TUFTI引き寄せゲーム`;
    navigator.clipboard?.writeText(txt).then(() => showToast('📋 コピーしました！'));
  });

  // Update HUD numbers
  const rpDisp = document.getElementById('rp-display');
  const lvDisp = document.getElementById('level-display');
  const xpBar  = document.getElementById('xp-bar');
  if (rpDisp) rpDisp.textContent = state.rp;
  if (lvDisp) lvDisp.textContent = state.level;
  if (xpBar)  xpBar.style.width  = xpPct + '%';

  // Miko typing + 音声再生
  setTimeout(() => {
    const el = document.getElementById('result-miko-text');
    if (el) {
      typeMikoText(el, mikoText);
      playVoiceFile(mikoEntry.voice || `${mikoText}${CONFIG.AUDIO_EXT}`);
    }
  }, 200);

  eventArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('next-btn').addEventListener('click', (e) => {
    addRipple(e.currentTarget, e);
    transitionScene(renderGame);
  });

  showToast(`+${rpGain} RP 獲得！`);
}

// ================================================================
// SCENE: PROFILE
// ================================================================

function renderProfile() {
  state.currentScene = 'profile';
  spawnParticles();

  const levelData = getCurrentLevelData();
  const xpPct     = getXPPercent();
  const nextLD    = getNextLevelData();

  // World usage count
  const worldCounts = {};
  state.worldHistory.forEach(h => {
    if (h.worldId) worldCounts[h.worldId] = (worldCounts[h.worldId] || 0) + 1;
  });

  const totalRP    = state.rp;
  const totalDays  = state.totalDays;
  const topWorldId = Object.keys(worldCounts).sort((a,b) => worldCounts[b] - worldCounts[a])[0];
  const topWorld   = state.data.worlds.find(w => w.id === topWorldId);

  // Bottom nav
  const nav = document.getElementById('bottom-nav');
  nav.classList.remove('hidden');
  nav.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  document.getElementById('nav-profile')?.classList.add('active');

  const historyHTML = state.worldHistory.slice(0, 10).map(h => `
    <li class="history-item">
      <div class="history-world">
        <span>${h.worldEmoji || '🌙'}</span>
        <span>${h.world}</span>
      </div>
      <span class="history-rp">+${h.rp} RP</span>
      <span class="history-date">${h.date}</span>
    </li>
  `).join('') || '<li class="history-item text-muted">まだ記録がありません</li>';

  // World completion map
  const worldMapHTML = state.data.worlds.map(w => {
    const count  = worldCounts[w.id] || 0;
    const hasExp = count > 0;
    return `
      <div class="stat-item" style="${hasExp ? `border-color:${w.themeColor};` : ''}">
        <span class="stat-value" style="${hasExp ? `color:${w.themeColor};` : ''}">${w.emoji}</span>
        <span class="stat-label">${w.name}</span>
        <span style="font-size:0.65rem;color:var(--text-muted);">${count}回</span>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div id="scene-profile" class="page-content" role="main">
      <!-- Profile Header -->
      <div class="profile-header glass-card">
        <div class="profile-avatar" style="${levelData ? `background:${state.data.worlds[0]?.themeGradient || ''};` : ''}" aria-hidden="true">
          🌸
        </div>
        <div class="profile-name">${state.name}</div>
        <div class="profile-title">${levelData?.title || '旅人'} — Lv.${state.level}</div>

        <!-- XP Bar -->
        <div class="xp-bar-wrap" style="margin-top:var(--space-md);margin-bottom:0;">
          <div class="xp-label">
            <span>XP: ${state.xp}</span>
            <span>${nextLD ? `次まで ${nextLD.xpRequired - state.xp} XP` : 'MAX'}</span>
          </div>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" style="width:${xpPct}%"></div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div>
        <h2 class="section-heading">📊 統計</h2>
        <div class="stats-grid">
          <div class="stat-item glass-card">
            <span class="stat-value">${totalRP}</span>
            <span class="stat-label">総 RP</span>
          </div>
          <div class="stat-item glass-card">
            <span class="stat-value">${state.streak}</span>
            <span class="stat-label">連続日数</span>
          </div>
          <div class="stat-item glass-card">
            <span class="stat-value">${totalDays}</span>
            <span class="stat-label">総プレイ日</span>
          </div>
        </div>
      </div>

      <!-- Favorite World -->
      ${topWorld ? `
      <div class="glass-card" style="padding:var(--space-md);">
        <p class="section-title">— 最も選んだ世界線 —</p>
        <div style="text-align:center;">
          <span style="font-size:2.5rem;">${topWorld.emoji}</span>
          <div style="font-size:1.1rem;font-weight:700;color:${topWorld.themeColor};">${topWorld.name}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">${worldCounts[topWorldId]}回</div>
        </div>
      </div>
      ` : ''}

      <!-- World Map -->
      <div>
        <h2 class="section-heading">🗺️ 世界線マップ</h2>
        <div class="stats-grid">
          ${worldMapHTML}
        </div>
      </div>

      <!-- History -->
      <div>
        <h2 class="section-heading">📜 選択履歴</h2>
        <ul class="history-list">
          ${historyHTML}
        </ul>
      </div>

      <!-- Miko -->
      ${renderMikoPanel('idle')}
    </div>
  `;

  const idleText = getMikoLine('idle');
  setTimeout(() => {
    const el = document.getElementById('miko-text-content');
    if (el) typeMikoText(el, idleText);
  }, 400);
}

// ================================================================
// NAVIGATION
// ================================================================

function setupNav() {
  document.getElementById('nav-game')?.addEventListener('click', () => {
    if (state.currentScene !== 'game') {
      transitionScene(renderGame);
    }
  });

  document.getElementById('nav-profile')?.addEventListener('click', () => {
    if (state.currentScene !== 'profile') {
      transitionScene(renderProfile);
    }
  });
}

// ================================================================
// INIT
// ================================================================

async function init() {
  // Show loading screen immediately
  renderLoading();

  try {
    await loadAllData();
  } catch (err) {
    console.error('Data load error:', err);
    app.innerHTML = `
      <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;">
        <div>
          <p style="font-size:2rem;margin-bottom:1rem;">⚠️</p>
          <p style="color:var(--text-secondary);">データの読み込みに失敗しました。<br>ページを再読み込みしてください。</p>
        </div>
      </div>
    `;
    return;
  }

  setupNav();

  // Slight delay after loading for smooth reveal
  setTimeout(() => {
    if (!state.name) {
      renderTemple();
    } else {
      handleDailyLogin();
      saveState();
      renderTemple();
    }
  }, 600);
}

// Start
init();
