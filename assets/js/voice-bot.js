/* ==========================================================================
   Ai3 新官網 · 首頁語音機器人
   - 聽：Web Speech API（SpeechRecognition, zh-TW）＋ Web Audio 取音量驅動 3D 球體
   - 想：Brain 介面（demo 內建知識庫 / http 接自家後端）
   - 說：speechSynthesis（挑 zh-TW 聲音）
   依賴：window.AI3_CONFIG（config.js）、window.AiOrb（orb.js，可缺席）
   ========================================================================== */
(function () {
  "use strict";

  const cfg = window.AI3_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);

  const ui = {
    wrap: $("#stage"),
    log: $("#voiceLog"),
    mic: $("#micBtn"),
    input: $("#voiceInput"),
    send: $("#voiceSend"),
    stt: $("#sttStatus"),
    tts: $("#ttsStatus"),
    brain: $("#brainStatus"),
    hint: $("#voiceHint"),
    sayBox: $("#say"), sayText: $("#sayText"), saySound: $("#saySound"),
    chips: document.querySelectorAll("[data-ask]")
  };
  if (!ui.log || !ui.mic) return;

  /* ---------------------------------------------------------------------
     機器人狀態橋接（avatar.js）
     --------------------------------------------------------------------- */
  const avatar = () => window.AiAvatar || window.AiOrb;
  const orb = {
    state(s) {
      ui.wrap && ui.wrap.setAttribute("data-state", s);
      avatar() && avatar().setState(s);
    },
    level(v) { avatar() && avatar().setLevel(v); }
  };

  /* ---------------------------------------------------------------------
     Brain：demo 知識庫（關鍵字比對）
     正式版請改 cfg.brain = 'http'，接 Ai3 的 RAG / Qbi 後端
     --------------------------------------------------------------------- */
  const KB = [
    { k: ["你好", "哈囉", "嗨", "hello", "hi", "早安", "午安", "晚安"], e: "joy",
      a: "你好！我是貴哥。可以問我 Ai3 做什麼、有哪些產品、服務過哪些客戶，或怎麼開始導入。" },
    { k: ["你是誰", "你叫", "什麼名字", "你是什麼", "貴哥"], e: "salute",
      a: "我是貴哥，Ai3 人工智能董事長張榮貴博士的 AI 數位分身。目前是網站展示版，用內建知識庫回答；正式上線後會接 Ai3 自家的 RAG 知識庫與語音引擎。" },
    { k: ["公司", "介紹", "ai3", "做什麼", "是什麼", "成立", "背景", "南港"], e: "proud",
      a: "Ai3 人工智能成立於 2018 年，總部在台北南港，專注 AI 對話、語音辨識與客服系統整合，已服務超過一百家企業，客戶橫跨金融、公部門、電商與物流。" },
    { k: ["產品", "服務", "有哪些", "方案", "解決方案", "提供"], e: "explaining",
      a: "Ai3 有三條產品線：QbiAI 企業客服機器人，負責文字與語音對話；Qbi Bot 智能機器人，支援選單式與語意式問答；Qbi CRM 智能客服系統，把全通路客戶資料與客服流程整合在一起。中小企業可以用雲端訂閱，大型企業採專案客製。" },
    { k: ["語音", "聲音", "說話", "電話", "cti", "voice"], e: "sing",
      a: "語音是 Ai3 的核心能力之一。QbiAI 整合語音辨識、自然語言理解與語音合成，可以接網頁、LINE，也能透過 CTI 接進企業電話總機，讓客戶用說的就能完成查詢。" },
    { k: ["客戶", "服務過", "哪些企業", "合作", "案例", "誰在用"], e: "confident",
      a: "Ai3 的客戶包括華碩、長榮航空、中國信託、台北捷運、台北富邦銀行、黑貓宅急便、高雄市政府、衛福部健保署、萊雅、經濟部與陽信銀行等。" },
    { k: ["富邦", "邦妮", "銀行", "金融"], e: "proud",
      a: "台北富邦銀行的智能客服「邦妮」是 Ai3 的代表案例之一，處理帳務查詢、信用卡點數與分期等問題，官網揭露的回答準確率達九成，有效降低人力成本。" },
    { k: ["黑貓", "宅急便", "物流", "查件", "包裹"], e: "wink",
      a: "黑貓宅急便自 2017 年起導入 Ai3 的智能客服，客戶可以 24 小時自助查訂單、包裹狀態與線上取件，明顯降低了進線量。" },
    { k: ["捷運", "交通", "政府", "公部門", "健保"], e: "okay",
      a: "在公部門與交通領域，Ai3 服務過台北捷運、高雄市政府與衛福部健保署等單位，提供全通路智能客服與客服管理系統。" },
    { k: ["價格", "費用", "多少錢", "報價", "預算", "收費", "訂閱"], e: "thinking",
      a: "費用依導入方式而定：中小企業可選雲端訂閱方案，快速開通、預算輕；大型企業則採專案客製，含專屬顧問與系統整合。留下聯絡方式，我們會安排顧問為你評估。" },
    { k: ["聯絡", "電話", "email", "信箱", "地址", "怎麼找", "聯繫"], e: "warm",
      a: "可以打 02-7706-6101，或寫信到 contactai3@ai3.cloud。公司地址是台北市南港區重陽路 273 號 9 樓。" },
    { k: ["獎", "認證", "iso", "gartner", "witsa", "nvidia", "榮譽"], e: "celebrate",
      a: "Ai3 曾獲 WITSA 全球資通訊卓越獎、被 Gartner 列為大中華區 AI 指標廠商，2024 年成為 NVIDIA Taipei-1 算力平台首批團隊，2026 年取得全台首張 ISO/IEC 42001 AI 管理系統認證，並獲 2026 ASOCIO 國際大獎。" },
    { k: ["導入", "怎麼開始", "流程", "多久", "上線", "時間"], e: "explaining",
      a: "導入通常分三步：先盤點你的常見問題與知識來源，接著建置知識庫並訓練對話，最後接上網頁、LINE 或電話等通路上線。雲端訂閱最快幾天內可開通，專案客製依範圍規劃時程。" },
    { k: ["line", "通路", "網頁", "facebook", "全通路", "整合"], e: "amused",
      a: "Ai3 支援全通路整合：網頁聊天、LINE、Meta 訊息、電話 CTI、Email 與簡訊，所有互動紀錄集中在 Qbi CRM，讓客服看見完整客戶脈絡。" },
    { k: ["招募", "徵才", "工作", "職缺", "加入"], e: "cheer",
      a: "Ai3 持續招募 AI 應用、客服系統與業務相關人才，可以到官網「關於 Ai3 › 人才招募」查看最新職缺。" },
    { k: ["esg", "永續", "報告書"], e: "satisfied",
      a: "Ai3 自 2021 年起每年發布 ESG 永續報告書，最新為 2025 年版，可在官網「關於 Ai3 › ESG 永續報告」下載。" },
    { k: ["謝謝", "感謝", "掰", "再見"], e: "joy",
      a: "不客氣！有需要隨時再來找我，或直接點「聯絡我們」留下需求。" },
    // 以下用來展示貴哥的表情與動作（65 種，見 avatar.js 的 EMO 目錄）
    { k: ["生氣給我看", "你會生氣嗎", "生氣的樣子", "憤怒", "發火"], e: "angry",
      a: "哼！如果有人冒用 Ai3 的名義去騙客戶，我真的會很生氣！遇到可疑來電或訊息，請直接打 02-7706-6101 跟我們確認。" },
    { k: ["暴怒", "氣炸", "抓狂"], e: "furious", a: "氣炸了！不過冷靜一下……有問題我們一件一件解決。" },
    { k: ["難過", "傷心", "難過給我看", "你會難過嗎"], e: "sad",
      a: "聽你這麼說，我也有點難過……不過沒關係，告訴我發生了什麼事，我們一起想辦法。" },
    { k: ["哭", "大哭", "哭給我看"], e: "cry", a: "嗚嗚……好啦，哭完就沒事了。有什麼我可以幫忙的，儘管說。" },
    { k: ["開心", "快樂", "高興", "你會開心嗎", "開心給我看"], e: "joy",
      a: "耶！跟你聊天我超開心的！Ai3 的目標，就是讓每一次客服互動都像現在這樣輕鬆。" },
    { k: ["笑一個", "大笑", "哈哈", "好笑"], e: "laugh", a: "哈哈哈！你也太會講了吧！好，笑完回到正題，想了解 Ai3 的哪一部分？" },
    { k: ["偷笑", "嘻嘻"], e: "giggle", a: "嘻嘻……沒事沒事，我只是想到客戶說我們的機器人比真人還有禮貌。" },
    { k: ["驚喜", "嚇一跳", "哇", "驚訝", "嚇你"], e: "surprised",
      a: "哇！真的嗎？我完全沒想到！你再多說一點，我想聽。" },
    { k: ["嚇到", "嚇死", "恐怖"], e: "shocked", a: "嚇我一跳！還好還好……客服最怕的就是突發狀況，所以我們的系統 24 小時都有人機協作在盯著。" },
    { k: ["害羞", "不好意思啦", "臉紅"], e: "shy", a: "欸……別這樣說啦，我會害羞。其實這些都是 Ai3 團隊的功勞。" },
    { k: ["害怕", "怕不怕", "好可怕"], e: "scared", a: "有、有一點怕……不過有 ISO/IEC 42001 的治理機制在，AI 不會亂來的。" },
    { k: ["累了", "你累嗎", "好累"], e: "tired", a: "呼……今天回答了很多問題。不過 AI 客服最大的好處就是不用休息，24 小時都在。" },
    { k: ["想睡", "睡覺", "晚安囉", "好睏"], e: "sleepy", a: "zzz……抱歉，我差點睡著了。你說到哪了？" },
    { k: ["打呵欠", "呵欠"], e: "yawn", a: "哈～～抱歉，打了個呵欠。繼續吧，我在聽。" },
    { k: ["跳舞", "跳支舞", "dance"], e: "dance", a: "來！跟著節奏動一動～Ai3 的客服機器人也可以這麼有活力。" },
    { k: ["唱歌", "唱一首", "sing"], e: "sing", a: "啦～啦～啦～開口就是服務的開始～（我只會唱這句）" },
    { k: ["加油", "鼓勵我", "打氣"], e: "cheer", a: "加油加油！你一定可以的！需要幫手的話，Ai3 隨時在。" },
    { k: ["愛你", "喜歡你", "我愛你", "好愛"], e: "love", a: "我也喜歡你！跟你聊天是我今天最開心的事。" },
    { k: ["耍帥", "好帥", "帥一個", "很酷"], e: "cool", a: "嘿，帥不是重點，能把客戶的問題一次解決才是真的帥。" },
    { k: ["得意", "驕傲", "厲害吧"], e: "proud", a: "哼哼，全台第一張 ISO/IEC 42001 認證，就是 Ai3 拿到的。" },
    { k: ["想一想", "想一下", "思考", "讓你想"], e: "thinking", a: "嗯……讓我想一想。這個問題我需要查一下知識庫。" },
    { k: ["好點子", "有想法", "靈感", "idea"], e: "idea", a: "有了！不如先用雲端訂閱方案小規模試跑，看成效再擴大導入。" },
    { k: ["好奇", "為什麼", "怎麼會"], e: "curious", a: "欸？這個問題有意思。你是在哪個情境遇到的？多說一點，我幫你想。" },
    { k: ["困惑", "聽不懂", "搞不懂", "什麼意思"], e: "confused", a: "呃……我可能沒聽清楚。可以換個方式再說一次嗎？" },
    { k: ["懷疑", "真的假的", "騙人"], e: "doubt", a: "嗯～你不信？官網上每一個案例都有客戶名字，歡迎去查。" },
    { k: ["頭暈", "暈了", "好暈"], e: "dizzy", a: "哇……轉太多圈了，頭好暈。等我一下，馬上恢復。" },
    { k: ["昏倒", "暈倒", "倒下"], e: "faint", a: "啊……我倒了……（開玩笑的，AI 不會倒，系統有異地備援。）" },
    { k: ["無聊", "好無聊", "沒事做"], e: "bored", a: "無聊喔……那不然問我一個客戶案例，保證不無聊。" },
    { k: ["對不起", "抱歉", "不好意思"], e: "warm", a: "沒關係的，別放在心上。有什麼我可以幫你的嗎？" },
    { k: ["道歉", "你道歉", "說對不起"], e: "sorry", a: "真的很抱歉，是我沒有把事情做好。請再給我一次機會。" },
    { k: ["不行", "拒絕", "不可以", "說不"], e: "refuse", a: "這個真的不行喔——Ai3 不會把客戶資料拿去做別的用途。" },
    { k: ["敬禮", "立正"], e: "salute", a: "是！貴哥向您報到，隨時待命！" },
    { k: ["悄悄話", "小聲", "秘密"], e: "whisper", a: "（小聲）跟你說個秘密……其實董事長的本名叫張榮貴，貴哥就是從這裡來的。" },
    { k: ["無言", "傻眼", "..."], e: "speechless", a: "……好吧，我無言了。我們換個話題？" },
    { k: ["緊張", "好緊張"], e: "nervous", a: "我、我有點緊張……第一次在新官網上班。不過你放心，問題我都會好好回答。" },
    { k: ["慶祝", "恭喜", "太棒了", "成功了"], e: "celebrate", a: "太棒了！恭喜恭喜！值得慶祝一下！" },
    { k: ["歡迎", "你好嗎"], e: "welcome", a: "歡迎光臨 Ai3！我是貴哥，有任何問題都可以問我。" },
    { k: ["眨眼", "wink", "眨一下"], e: "wink", a: "😉 眨～看到了嗎？" },
    { k: ["興奮", "好期待", "等不及"], e: "excited", a: "我也超期待的！新官網上線後，每個客戶都能先跟我聊聊。" },
    { k: ["專注", "認真", "正經"], e: "serious", a: "好，我認真回答。Ai3 的核心是把語音、對話與知識整合成企業的 AI 客服。" },
    { k: ["表情秀", "所有表情", "全部表情", "表情有哪些", "動作有哪些", "你會哪些表情"], cmd: "showcase",
      a: "好，我把 65 種表情和動作全部做一遍給你看，每一種對應不同的聊天情緒。" }
  ];

  const brains = {
    demo: {
      label: "Demo 知識庫",
      async reply(text) {
        await wait(500 + Math.random() * 500);
        const t = text.toLowerCase();
        let best = null, score = 0;
        for (const item of KB) {
          const s = item.k.reduce((n, k) => n + (t.includes(k.toLowerCase()) ? 1 : 0), 0);
          if (s > score) { score = s; best = item; }
        }
        if (best) {
          const ue = detectEmotion(text, "");                 // 使用者帶情緒就先回應情緒
          const emo = (ue && !TALK_POOL.includes(ue) && ue !== "curious") ? ue : (best.e || detectEmotion(text, best.a));
          return { text: best.a, emotion: emo, cmd: best.cmd };
        }
        const fb = detectEmotion(text, ""); return { text: "這題在展示版知識庫裡找不到。正式版會接 Ai3 的 RAG 知識庫回答。你可以先問我：產品、客戶案例、導入流程，或聯絡方式。", emotion: (TALK_POOL.includes(fb) || fb === "curious") ? "confused" : fb };
      }
    },
    http: {
      label: "Ai3 後端",
      async reply(text, history) {
        const res = await fetch(cfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId: session, history })
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const reply = data.reply || data.answer || data.text || "（後端沒有回傳內容）";
        // 後端可直接回 emotion（65 種之一，見 avatar.js 的 EMO 目錄，如 happy / joy / laugh / shy / thinking / sorry…）；沒有就用關鍵字判斷
        return { text: reply, emotion: data.emotion || detectEmotion(text, reply) };
      }
    }
  };

  /* 喜怒哀樂：先看使用者說了什麼，再看回答內容（Demo 用的關鍵字版；正式版由 LLM 回傳 emotion） */
  /* 使用者的話 → 貴哥的反應；回答內容 → 貴哥的表情（Demo 用的關鍵字版；正式版由 LLM 直接回傳 emotion） */
  const USER_EMO = [   // 使用者的話帶情緒 → 貴哥的反應
    ["sorry", ["生氣", "氣死", "爛", "差勁", "太慢", "投訴", "客訴", "不滿", "可惡", "搞什麼", "廢", "討厭", "糟糕", "很差", "騙"]],
    ["worried", ["難過", "失望", "可惜", "遺憾", "壓力", "煩", "困擾", "麻煩", "出問題", "當機", "故障"]],
    ["shy", ["厲害", "太棒", "好棒", "讚", "聰明", "可愛", "喜歡你", "愛你", "帥", "好強"]],
    ["thanks", ["謝謝", "感謝", "多謝", "辛苦了"]],
    ["goodbye", ["再見", "掰掰", "bye", "拜拜", "下次聊", "先這樣"]],
    ["greeting", ["你好", "哈囉", "嗨", "hello", "hi", "早安", "午安", "晚安"]],
    ["laugh", ["哈哈", "好笑", "笑死", "xd"]],
    ["surprised", ["真的嗎", "真假", "哇", "居然", "竟然", "沒想到", "什麼！"]],
    ["agree", ["好的", "沒問題", "可以", "ok", "了解", "好啊", "好喔", "收到"]],
    ["excited", ["太好了", "期待", "想試", "想導入", "想買", "想了解"]]
  ];
  const REPLY_EMO = [   // 回答內容的線索
    ["sorry", ["抱歉", "對不起", "不好意思", "找不到", "無法", "沒辦法", "發生問題"]],
    ["celebrate", ["恭喜", "太棒", "成功", "獲獎", "榮獲"]],
    ["laugh", ["哈哈"]],
    ["proud", ["第一", "首張", "領先", "認證", "指標"]],
    ["cheer", ["24 小時", "不打烊", "加油", "隨時"]],
    ["welcome", ["歡迎"]],
    ["thanks", ["不客氣"]],
    ["warm", ["聯絡", "電話", "寫信", "顧問"]],
    ["idea", ["建議", "不如", "可以先"]]
  ];
  // 一般說明型回答：輪流換表情，不要每句都一樣
  const TALK_POOL = ["explaining", "confident", "happy", "warm", "wink", "okay", "amused", "satisfied", "proud", "cheer", "agree", "welcome"];
  let talkIdx = 0;
  function detectEmotion(userText, replyText) {
    const u = (userText || "").toLowerCase(), r = (replyText || "");
    for (const [e, words] of USER_EMO) if (words.some(w => u.includes(w.toLowerCase()))) return e;
    for (const [e, words] of REPLY_EMO) if (words.some(w => r.includes(w))) return e;
    if (/[？?]\s*$/.test(r)) return "curious";        // 貴哥自己反問時才用問號臉
    talkIdx = (talkIdx + 1 + (r.length % 3)) % TALK_POOL.length;
    return TALK_POOL[talkIdx];
  }
  /* 一段回答逐句換表情：第一句用「對你這句話的反應」，之後每句依內容換（數字、建議、聯絡、驚嘆、反問…），不連續重複 */
  const SENT_EMO = [
    ["sorry", /抱歉|對不起|不好意思|找不到|無法|沒辦法/],
    ["celebrate", /恭喜|成功導入|太棒了/],
    ["proud", /第一|首張|首批|領先|獲獎|榮獲|認證|超過\s*\d|\d+\s*(家|位|個|種|%|％|萬|倍|年)/],
    ["surprised", /竟然|居然|沒想到|連.*都/],
    ["idea", /建議|不如|可以先|例如|比如|像是|舉例/],
    ["thinking", /如果|取決|看情況|評估|通常|一般來說/],
    ["warm", /聯絡|電話|寫信|顧問|陪你|協助|幫你|專人/],
    ["cheer", /24\s*小時|不打烊|隨時|加油|馬上|立刻/],
    ["confident", /可以|能夠|支援|做得到|沒問題|一定|整合/],
    ["wink", /其實|偷偷|小秘密|順便/],
    ["explaining", /包括|包含|分成|步驟|首先|接著|然後|最後/]
  ];
  const pickNot = (pool, not) => { const c = pool.filter(x => x !== not); return c[Math.floor(Math.random() * c.length)]; };
  function emotionTrack(text, first) {
    // 句號、驚嘆、問號一定換；很長的一句在逗號、冒號、頓號處（距上次換表情 22 字以上）也換
    const parts = text.match(/[^。！？!?；;\n，,：:、]+[。！？!?；;\n，,：:、]*/g) || [text];
    const track = [{ at: 0, emo: first }];
    let at = 0, prev = first, since = 0, endSentence = false;
    parts.forEach((p, i) => {
      if (i > 0 && p.replace(/\s/g, "").length >= 4 && (endSentence || since >= 22)) {
        let emo = null;
        for (const [e, re] of SENT_EMO) if (e !== prev && re.test(p)) { emo = e; break; }
        if (!emo && /[！!]\s*$/.test(p)) emo = pickNot(["cheer", "amazed", "playful", "proud", "confident"], prev);
        if (!emo && /[？?]\s*$/.test(p)) emo = prev === "curious" ? "hmm" : "curious";
        if (!emo) emo = pickNot(TALK_POOL, prev);
        track.push({ at, emo }); prev = emo; since = 0;
      }
      at += p.length; since += p.length; endSentence = /[。！？!?；;\n]\s*$/.test(p);
    });
    return track;
  }
  const brain = brains[cfg.brain] || brains.demo;
  const session = "s_" + Math.random().toString(36).slice(2, 10);
  const history = [];

  /* ---------------------------------------------------------------------
     TTS
     --------------------------------------------------------------------- */
  const synth = window.speechSynthesis;
  let voice = null, voiceMale = false;
  /* 貴哥是男生：先找男聲（台灣國語優先，再來普通話；粵語不用），找不到才用女聲並壓低音高 */
  const MALE = cfg.ttsMale || ["YunJhe", "Zhiwei", "Yunxi", "Yunjian", "Yunyang", "Yunze", "Yunye", "Kangkang", "Li-Mu", "Limu"];
  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    if (!voices.length) return;
    const mandarin = voices.filter(v => /^(zh|cmn)([-_](TW|CN|Hant|Hans|SG)|$)/i.test(v.lang) && !/HK|yue/i.test(v.lang + v.name));
    const tw = mandarin.filter(v => /TW|Hant/i.test(v.lang));
    const named = MALE.map(n => mandarin.find(v => v.name.toLowerCase().replace(/[\s-]/g, "").includes(n.toLowerCase().replace(/[\s-]/g, "")))).find(Boolean);
    const tagged = mandarin.find(v => /\bmale\b|男/i.test(v.name) && !/female|女/i.test(v.name));
    const male = named || tagged;
    voice = male || tw[0] || mandarin[0] || voices.find(v => /^zh/i.test(v.lang)) || null;
    voiceMale = !!male;
    setStatus(ui.tts, voice ? "語音合成：" + voice.name.replace(/Microsoft |Google |Online \(Natural\)|- Chinese.*$/g, "").trim() + (voiceMale ? "（男聲）" : "（壓低音高）") : "語音合成：此瀏覽器無中文聲音", !!voice);
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  let speakTimer = null, cancelSpeak = null, soundOn = false, muted = false, sayTimer = null, lastLine = "";
  /* 對話泡泡：字幕跟著說話速度逐字打出 */
  function caption(text, ms, onChar) {
    if (!ui.sayText) return;
    lastLine = text; clearInterval(sayTimer);
    ui.sayBox && ui.sayBox.classList.add("is-on");
    ui.sayText.textContent = ""; ui.sayText.classList.add("is-typing");
    let i = 0; const step = Math.max(28, Math.min(160, ms / Math.max(1, text.length)));
    sayTimer = setInterval(() => {
      i++; ui.sayText.textContent = text.slice(0, i); ui.sayText.scrollTop = ui.sayText.scrollHeight; onChar && onChar(i);
      if (i >= text.length) { clearInterval(sayTimer); ui.sayText.classList.remove("is-typing"); }
    }, step);
  }
  function finishCaption() { if (!ui.sayText || !lastLine) return; clearInterval(sayTimer); ui.sayText.textContent = lastLine; ui.sayText.classList.remove("is-typing"); }
  function stopSpeech() { synth && synth.cancel(); if (cancelSpeak) cancelSpeak(); }
  /* opts.silent：不出聲，只動嘴巴＋打字幕（開場白與閒聊；瀏覽器在使用者互動前不允許播放語音） */
  function speak(text, opts = {}) {
    if (cancelSpeak) cancelSpeak();
    return new Promise(resolve => {
      if (synth && !voice) pickVoice(); // 聲音清單是非同步載入的，講話前再找一次
      const silent = opts.silent || muted || !synth || !voice;
      orb.state("speaking");
      const track = opts.track || []; let ti = 0;
      const fire = idx => { while (ti < track.length && idx >= track[ti].at) { const A = window.AiAvatar; if (A && A.setEmotion) A.setEmotion(track[ti].emo); ti++; } };
      fire(0);
      // speechSynthesis 不給音訊資料，用節奏包絡模擬說話起伏
      let t = 0, finished = false;
      clearInterval(speakTimer);
      speakTimer = setInterval(() => { t += 0.09; orb.level(0.12 + 0.8 * Math.abs(Math.sin(t * 7.3)) * (0.55 + 0.45 * Math.sin(t * 2.1))); }, 50);
      const done = () => { if (finished) return; finished = true; cancelSpeak = null; clearInterval(speakTimer); clearTimeout(guard); clearTimeout(quiet); finishCaption(); orb.level(0); orb.state("idle"); resolve(); };
      cancelSpeak = done;
      const est = Math.min(16000, 500 + text.length * (silent ? 165 : 185));
      caption(text, est * 0.92, fire);
      const guard = setTimeout(done, Math.min(45000, 3000 + text.length * 260)); // 保險：合成器沒回報結束也會收尾
      let quiet = null;
      if (silent) { clearTimeout(guard); quiet = setTimeout(done, est); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice; u.lang = voice.lang; u.rate = cfg.ttsRate || 1; u.pitch = voiceMale ? (cfg.ttsPitch || 1) : (cfg.ttsFallbackPitch || 0.6);
      u.onend = done; u.onerror = done;
      u.onboundary = e => { const A = window.AiAvatar; if (A && A.kick) A.kick(); if (e && e.charIndex != null) fire(e.charIndex); };   // 每個字／詞的邊界讓嘴巴再張一下
      synth.speak(u);
    });
  }

  /* ---------------------------------------------------------------------
     STT ＋ 麥克風音量
     --------------------------------------------------------------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, audioCtx = null, analyser = null, stream = null, raf = null, interimEl = null;
  let autoListen = false, silentCount = 0; // 按一次麥克風就進入連續對答：貴哥講完自動再聽
  function setHint(t) { if (ui.hint) { ui.hint.textContent = t; ui.hint.hidden = !t; } }

  if (SR) {
    rec = new SR();
    rec.lang = cfg.sttLang || "zh-TW";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = e => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript; else interim += r[0].transcript;
      }
      if (interim) showInterim(interim);
      if (final) { clearInterim(); handleUser(final.trim()); }
    };
    rec.onend = () => stopListening(false);
    rec.onerror = e => {
      stopListening(false);
      if (e.error === "not-allowed") { autoListen = false; setHint(""); addMsg("bot", "瀏覽器沒有開放麥克風權限。請在網址列允許麥克風，或直接用下方文字輸入。"); }
      else if (e.error === "no-speech") {
        // 連續對話模式：安靜時再聽一次，連續兩次沒聲音才停
        if (autoListen && silentCount < 2) { silentCount++; setTimeout(() => { if (autoListen && !listening) startListening(); }, 300); }
        else { autoListen = false; setHint(""); addMsg("bot", "沒有聽到聲音，想繼續聊再按一次麥克風。"); }
      }
    };
    setStatus(ui.stt, "語音辨識：瀏覽器內建（" + rec.lang + "）", true);
  } else {
    setStatus(ui.stt, "語音辨識：此瀏覽器不支援，請用 Chrome / Edge，或改用文字", false);
    ui.mic.setAttribute("title", "此瀏覽器不支援語音辨識");
  }
  setStatus(ui.brain, "對話引擎：" + brain.label, cfg.brain === "http");

  async function startListening() {
    if (!rec || listening) return;
    synth && synth.cancel();
    clearInterval(speakTimer);
    listening = true;
    ui.mic.setAttribute("data-active", "true");
    ui.mic.setAttribute("aria-pressed", "true");
    orb.state("listening");
    try { rec.start(); } catch (_) { /* 已在辨識中 */ }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!listening) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        orb.level(Math.min(1, rms * 4));
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) { /* 沒有音量也能辨識 */ }
  }

  function stopListening(abort = true) {
    if (!listening) return;
    listening = false;
    ui.mic.setAttribute("data-active", "false");
    ui.mic.setAttribute("aria-pressed", "false");
    cancelAnimationFrame(raf);
    orb.level(0);
    if (ui.wrap && ui.wrap.getAttribute("data-state") === "listening") orb.state("idle");
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (abort && rec) { try { rec.abort(); } catch (_) {} }
    clearInterim();
  }

  /* ---------------------------------------------------------------------
     對話流程
     --------------------------------------------------------------------- */
  async function handleUser(text) {
    if (!text) return;
    userActed();
    if (cancelSpeak) stopSpeech();                 // 開場白講到一半也先停下來聽你說
    if (!muted && !soundOn) setSound(true);         // 你開口問了，回答就用聲音（除非你按掉聲音）
    if (avatar() && avatar().stopShowcase) avatar().stopShowcase();
    addMsg("user", text);
    history.push({ role: "user", content: text });
    orb.state("thinking");
    const typing = addMsg("bot", "…", true);
    let out;
    try { out = await brain.reply(text, history.slice(-10)); }
    catch (err) { out = { text: "連線到對話後端時發生問題（" + err.message + "）。請確認 config.js 的 endpoint 設定。", emotion: "sad" }; }
    const reply = typeof out === "string" ? out : out.text;
    typing.classList.remove("msg--interim");
    typeInto(typing, reply); // 逐字打出，和語音同步進行
    history.push({ role: "assistant", content: reply });
    // 先換表情（喜怒哀樂），再開口；說話期間 avatar.js 會同步動嘴巴、手和身體
    const first = (typeof out === "object" && out.emotion) || "happy";
    await speak(reply, { track: emotionTrack(reply, first) });
    if (typeof out === "object" && out.cmd === "showcase" && avatar() && avatar().showcase) { avatar().showcase(); return; }
    // 連續對答：講完換你說
    if (autoListen && rec && !listening && document.visibilityState === "visible") { silentCount = 0; setTimeout(() => { if (autoListen && !listening) startListening(); }, 350); }
  }

  let typeTimer = null;
  function typeInto(el, text) {
    clearInterval(typeTimer);
    el.textContent = "";
    let i = 0;
    const step = Math.max(14, Math.min(45, 2600 / Math.max(1, text.length))); // 長句打快一點
    typeTimer = setInterval(() => {
      i += 1; el.textContent = text.slice(0, i); ui.log.scrollTop = ui.log.scrollHeight;
      if (i >= text.length) clearInterval(typeTimer);
    }, step);
  }
  function addMsg(who, text, interim = false) {
    const el = document.createElement("div");
    el.className = "msg msg--" + who + (interim ? " msg--interim" : "");
    el.textContent = text;
    ui.log.appendChild(el);
    ui.log.scrollTop = ui.log.scrollHeight;
    return el;
  }
  function showInterim(text) {
    if (!interimEl) interimEl = addMsg("user", text, true);
    interimEl.textContent = text;
    ui.log.scrollTop = ui.log.scrollHeight;
  }
  function clearInterim() { if (interimEl) { interimEl.remove(); interimEl = null; } }
  function setStatus(el, text, live) { if (!el) return; el.innerHTML = "<b>" + text + "</b>"; el.setAttribute("data-live", live ? "on" : "off"); }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ---------------------------------------------------------------------
     事件
     --------------------------------------------------------------------- */
  ui.mic.addEventListener("click", () => {
    userActed(); if (cancelSpeak && !listening) stopSpeech();
    if (!rec) { ui.input && ui.input.focus(); return; }
    if (listening || autoListen) { autoListen = false; silentCount = 0; setHint(""); stopListening(); synth && synth.cancel(); clearInterval(speakTimer); orb.level(0); orb.state("idle"); }
    else { autoListen = true; silentCount = 0; setHint("連續對答中：說完等貴哥回答，再接著說；想結束再按一次麥克風。"); startListening(); }
  });
  const submit = () => { const v = ui.input.value.trim(); if (!v) return; ui.input.value = ""; autoListen = false; setHint(""); stopListening(); handleUser(v); };
  ui.send && ui.send.addEventListener("click", submit);
  ui.input && ui.input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  ui.chips.forEach(c => c.addEventListener("click", () => { stopListening(); handleUser(c.getAttribute("data-ask")); }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) { autoListen = false; setHint(""); stopListening(); synth && synth.cancel(); } });

  /* ---------------------------------------------------------------------
     開場：一進首頁貴哥就主動說話（字幕＋嘴型；按泡泡上的「開聲音」就會出聲）
     --------------------------------------------------------------------- */
  const GREET = cfg.greetLines || [
    ["greeting", "嗨！我是貴哥，歡迎來到 Ai3。"],
    ["explaining", "我聽得懂台灣國語，會從企業的知識庫找答案，再用聲音回答你。"],
    ["welcome", "按下麥克風直接跟我說話，或點" + (window.innerWidth < 900 ? "下面" : "左邊") + "的問題，我馬上回答。"]
  ];
  const CHATTER = cfg.chatterLines || [
    ["curious", "想知道 Ai3 服務過哪些客戶嗎？點「服務過哪些客戶？」問我。"],
    ["proud", "從 2018 年到現在，Ai3 已經服務超過一百家企業與機關。"],
    ["playful", "我會 65 種表情喔，點「貴哥表情秀」看看。"],
    ["explaining", "往下捲，可以看到一通電話怎麼被聽懂、找到答案、再說回去。"],
    ["idea", "雲端訂閱幾天內就能開通，要不要問我費用怎麼算？"],
    ["cool", "我也能接 LINE、網頁和電話總機，一套知識庫全部共用。"]
  ];
  let scriptOn = true, lastUser = 0, chatterN = 0, chatterIdx = Math.floor(Math.random() * CHATTER.length), stageSeen = true;
  if ("IntersectionObserver" in window && ui.wrap) new IntersectionObserver(en => { stageSeen = en[0].isIntersecting; }).observe(ui.wrap);
  const busy = () => listening || (ui.wrap && ui.wrap.getAttribute("data-state") !== "idle");
  async function runScript(lines) {
    for (const [e, line] of lines) {
      if (!scriptOn) return;
      if (avatar() && avatar().setEmotion) avatar().setEmotion(e);
      await speak(line, { silent: !soundOn });
      if (!scriptOn) return;
      await wait(650);
    }
  }
  function userActed() { lastUser = Date.now(); scriptOn = false; }
  function chatterLoop() {
    setTimeout(async () => {
      const calm = Date.now() - lastUser > 30000;
      const docked = window.AI3Dock && window.AI3Dock.docked;   // 縮到右下角時也算看得到
      if (calm && (stageSeen || docked) && !busy() && document.visibilityState === "visible" && chatterN < (cfg.chatterMax || 8)) {
        chatterIdx = (chatterIdx + 1) % CHATTER.length; chatterN++;
        scriptOn = true; await runScript([CHATTER[chatterIdx]]); scriptOn = false;
      }
      chatterLoop();
    }, 16000 + Math.random() * 12000);
  }
  let started = false;
  const startShow = () => { if (started) return; started = true; setTimeout(async () => { if (scriptOn) await runScript(GREET); scriptOn = false; chatterLoop(); }, cfg.greetDelay || 500); };
  window.addEventListener("ai3:intro", startShow);
  setTimeout(startShow, 4500);   // 保險：開場動畫沒觸發也會開口
  setTimeout(() => addMsg("bot", cfg.greeting || "你好，有什麼想問 Ai3 的？"), 1400);

  /* 泡泡上的「開聲音」：使用者點了才能播放語音，點了就把目前這句用聲音再說一次 */
  function setSound(on) {
    soundOn = on; muted = !on;
    if (!ui.saySound) return;
    ui.saySound.setAttribute("aria-pressed", String(on));
    ui.saySound.setAttribute("aria-label", on ? "關閉貴哥的聲音" : "開啟貴哥的聲音");
    const lbl = ui.saySound.querySelector("span"); if (lbl) lbl.textContent = on ? "聲音開" : "開聲音";
  }
  if (ui.saySound) ui.saySound.addEventListener("click", () => {
    const on = !soundOn; setSound(on);
    if (on) { userActed(); if (synth && !voice) pickVoice(); if (lastLine) speak(lastLine); }
    else stopSpeech();
  });

  window.AI3VoiceBot = { ask: handleUser, start: startListening, stop: stopListening, say: (t, e) => { if (e && avatar()) avatar().setEmotion(e); return speak(t, { silent: !soundOn }); } };
})();
