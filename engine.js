/* 空軍新聞稿生成器 — 規則引擎（語庫、智慧帶入、成稿、檢查、匯出）。純本機運算，不連網。 */
(function () {
  const OCC = ['一般', '春節', '中秋', '端午', '國慶／重大展演', '颱風', '演習'];
  const OK = { '一般': 'any', '春節': 'spring', '中秋': 'moon', '端午': 'boat', '國慶／重大展演': 'nat', '颱風': 'typhoon', '演習': 'drill' };
  const OSHORT = { spring: '春節', moon: '中秋', boat: '端午', nat: '國慶', typhoon: '颱風', drill: '演習', any: '' };
  const UNITS = [
    ['island', '外島', /外島|澎湖|馬公|金門|馬祖|東沙|南沙|蘭嶼|綠島/],
    ['radar', '雷達／戰管', /雷達|戰管|警戒/],
    ['missile', '防空飛彈', /飛彈|防空|天弓|愛國者|防砲/],
    ['school', '院校', /學院|官校|學校|院校|訓練中心|學員/],
    ['medic', '救護隊', /救護|醫務|醫療|衛生/],
    ['band', '樂儀隊', /樂隊|儀隊|樂儀/],
    ['maint', '修護後勤', /修護|後勤|補給|基勤|保修|彈藥|油料|工程/],
    ['wing', '飛行聯隊', /聯隊|大隊|中隊|作戰隊|飛行|戰術|展演/]
  ];
  const CATS = ['感謝', '肯定', '強調', '期許', '提醒', '勉勵', '祝福'];

  // [類別, 語句, 場合, 單位, ★, 群組 u=長官/典禮 h=司令部]
  const RAW = [
    ['感謝', '官兵於春節期間堅守崗位，犧牲與家人團聚的時間，守護國人安心過年', 'spring', '', 0],
    ['感謝', '官兵於中秋佳節堅守崗位，以實際行動守護國人闔家團圓', 'moon', '', 0],
    ['感謝', '官兵於端午連假期間不分晝夜執行戰備任務，讓國人安心度過佳節', 'boat', '', 0],
    ['感謝', '官兵在颱風期間全力投入防颱整備與災後復原，展現國軍「救災視同作戰」的決心', 'typhoon', '', 1],
    ['感謝', '全體展演官兵連日辛勤訓練，以精湛技術展現空軍堅實戰力', 'nat', '', 0],
    ['感謝', '官兵長期戍守外島，克服環境艱困，默默守護國家安全', '', 'island', 0],
    ['感謝', '官兵平日堅守崗位、任勞任怨，為空軍戰力奠定穩固基礎', '', '', 0],
    ['肯定', '{單位}全年無休執行空情監偵，是守護領空的「千里眼」', '', 'radar', 0],
    ['肯定', '{單位}嚴密監控空域動態，確保防空作戰即時應變', '', 'missile', 0],
    ['肯定', '{單位}飛行員與地勤人員密切合作，確保每一架次任務安全圓滿', '', 'wing', 0],
    ['肯定', '{單位}修護人員以專業與細心維持裝備妥善，是戰力的堅實後盾', '', 'maint', 0],
    ['肯定', '{單位}落實教育訓練，為空軍培育優秀專業人才', '', 'school', 0],
    ['肯定', '{單位}隨時待命執行緊急救護任務，守護官兵與民眾生命安全', '', 'medic', 0],
    ['肯定', '{單位}以嚴整軍容與精湛表演，展現國軍專業形象', '', 'band', 0],
    ['肯定', '{單位}戍守前線、克服離島環境限制，戰備整備確實', '', 'island', 0],
    ['肯定', '演習期間各參演部隊依計畫完成各項課目，展現聯合作戰能力', 'drill', '', 0],
    ['肯定', '{單位}官兵士氣高昂、紀律嚴明，充分展現堅實戰備', '', '', 0],
    ['強調', '雷達監偵是空防作戰的第一道防線，須確保裝備妥善、情資即時傳遞，不容絲毫鬆懈', '', 'radar', 0],
    ['強調', '防空部隊須熟練接戰程序，確保「發現即接戰」的即時反應能力', '', 'missile', 0],
    ['強調', '飛行安全是戰力的根本，各級幹部須落實飛安查核，嚴守各項安全規定', '', 'wing', 1],
    ['強調', '裝備妥善是戰力的基礎，須落實保修制度、強化料件管理', '', 'maint', 0],
    ['強調', '外島地處戰略前緣，官兵須時刻保持警覺，確保戰備無虞', '', 'island', 0],
    ['強調', '節日期間更須加強戰備，嚴密監控周邊海、空域動態', 'spring,moon,boat', '', 0],
    ['強調', '救災工作須以人員安全為首要，確保官兵與民眾安全', 'typhoon', '', 0],
    ['強調', '演習務必秉持「戰訓合一」，以實戰標準驗證作戰計畫', 'drill', '', 1],
    ['強調', '面對中共頻繁的灰色地帶襲擾與軍事威脅，須持續強化「無劇本、實戰化」訓練', '', '', 1],
    ['強調', '唯有平時扎實訓練，才能於關鍵時刻發揮戰力', '', '', 0],
    ['期許', '展演人員秉持「追求卓越」精神，持續淬鍊專業技能、強化團隊合作', 'nat', '', 1],
    ['期許', '學員珍惜學習機會，將所學運用於部隊任務', '', 'school', 0],
    ['期許', '全體官兵持續精進專業、強化戰技，共同守護國家安全', '', '', 0],
    ['期許', '官兵發揮團隊精神，以「零缺失」的標準完成每項任務', '', '', 0],
    ['提醒', '連假期間官兵返家休假，務必注意交通安全，平安歸建', 'spring,moon,boat', '', 0],
    ['提醒', '各級幹部加強宣導嚴禁酒駕、反毒與防詐，共同維護部隊安全', '', '', 1],
    ['提醒', '各級幹部落實官兵關懷，及時掌握同仁身心狀況', '', '', 0],
    ['勉勵', '官兵保重身體、照顧家人，在工作與生活間取得平衡', '', '', 0],
    ['祝福', '代表空軍向全體官兵及眷屬拜早年，祝福大家新春愉快、闔家平安', 'spring', '', 0],
    ['祝福', '預祝全體官兵及眷屬中秋佳節愉快、闔家團圓', 'moon', '', 0],
    ['祝福', '祝福全體官兵及眷屬端午佳節平安健康', 'boat', '', 0],
    ['祝福', '預祝展演任務圓滿成功', 'nat', '', 0],
    ['強調', '空軍將持續秉持公開透明原則，適時對外說明', '', '', 0, 'h'],
    ['強調', '國軍嚴密掌握臺海周邊海、空域動態，請國人安心', '', '', 1, 'h'],
    ['強調', '呼籲民眾勿輕信、轉傳未經證實的訊息，以免誤導社會大眾', '', '', 0, 'h'],
    ['強調', '空軍將持續落實各項安全管理，確保人員與裝備安全', '', '', 0, 'h'],
    ['期許', '全體官兵持續精進戰訓本務，以堅實戰力守護國家安全', '', '', 0, 'h']
  ];
  const LIB = RAW.map((r, i) => ({ id: 'p' + i, c: r[0], t: r[1], o: r[2] ? r[2].split(',') : [], u: r[3] ? r[3].split(',') : [], star: !!r[4], g: r[5] || 'u' }));

  const TYPES = [
    { k: 'leader', name: '長官活動', desc: '視導、慰問、主持活動', popular: true, d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { k: 'ceremony', name: '典禮', desc: '結訓、交接、交機典禮', d: 'M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM15.48 12.89 17 22l-5-3-5 3 1.52-9.11' },
    { k: 'clarify', name: '新聞澄清', desc: '針對媒體報導說明事實', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM12 7v4M12 14h.01' },
    { k: 'policy', name: '政策／裝備介紹', desc: '介紹新制度、新裝備', d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
    { k: 'hq', name: '司令部發布', desc: '表示 → 說明 → 強調 三段式', d: 'm3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6' },
    { k: 'airsit', name: '空情動態', desc: '固定格式，填入數字即可', d: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { k: 'rewrite', name: '素材轉寫', desc: '貼上筆記，自動整理成稿', d: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z' }
  ];

  const F = {
    person: { label: '人物', kind: 'chips', src: 'titles' },
    date: { label: '活動日期', kind: 'date' },
    action: { label: '動作', kind: 'chips', opts: ['視導', '慰問', '主持'] },
    occ: { label: '場合', kind: 'chips', opts: OCC },
    target: { label: '對象', kind: 'text', ph: '例：空軍第二雷達中隊', req: 1, unit: 1 },
    event: { label: '主持活動名稱', kind: 'text', ph: '例：國慶展演任務誓師' },
    purpose: { label: '目的', kind: 'area', ph: '智慧帶入會自動填寫' },
    process: { label: '過程', kind: 'area', ph: '智慧帶入會自動填寫' },
    title: { label: '標題', kind: 'text', ph: '留空則自動產生' },
    pubDate: { label: '發布日期', kind: 'date', ph: '預設今天' },
    extra: { label: '補充段落', kind: 'area', ph: '其他想加入的內容' },
    kind: { label: '典禮類型', kind: 'chips', opts: ['結訓', '交接', '交機'] },
    place: { label: '地點／單位', kind: 'text', ph: '例：空軍官校', req: 1, unit: 1 },
    subject: { label: '名稱', kind: 'text', ph: '例：114年度戰術領隊班', req: 1 },
    detail: { label: '典禮內容', kind: 'area', ph: '例：計32員完成訓練' },
    report: { label: '報導內容摘要', kind: 'area', ph: '例：網傳本軍戰機於○○迫降' },
    facts: { label: '事實說明', kind: 'area', ph: '經查實際情形為…', req: 1 },
    closing: { label: '結語', kind: 'area', ph: '預設：呼籲勿輕信未經證實訊息' },
    desc: { label: '內容說明', kind: 'area', ph: '主要內容、實施方式', req: 1 },
    benefit: { label: '效益', kind: 'area', ph: '對戰力或官兵的幫助' },
    say: { label: '表示（立場）', kind: 'area', req: 1 },
    explain: { label: '說明（事實）', kind: 'area', req: 1 },
    emph: { label: '強調（呼籲）', kind: 'area', req: 1 },
    n: { label: '共機架次', kind: 'num', req: 1 },
    m: { label: '逾越中線架次', kind: 'num' },
    areas: { label: '進入空域', kind: 'multi', opts: ['北部', '中部', '西南', '東部'] },
    ships: { label: '共艦艘數', kind: 'num' },
    boats: { label: '公務船艘數', kind: 'num' },
    notes: { label: '貼上筆記或素材', kind: 'area', ph: '一行一件事，空一行分段', req: 1, big: 1 }
  };
  const SCHEMA = {
    leader: { main: ['person', 'date', 'action', 'occ', 'target'], more: ['purpose', 'process', 'event', 'title', 'pubDate', 'extra'] },
    ceremony: { main: ['kind', 'person', 'date', 'place', 'subject'], more: ['purpose', 'detail', 'occ', 'title', 'pubDate'], labels: { subject: '班隊／職務／機型' } },
    clarify: { main: ['subject', 'report', 'facts', 'date'], more: ['closing', 'title', 'pubDate'], labels: { subject: '事件主題', date: '說明日期' } },
    policy: { main: ['subject', 'desc', 'date'], more: ['benefit', 'title', 'pubDate'], labels: { subject: '政策／裝備名稱', date: '發布日期' } },
    hq: { main: ['subject', 'say', 'explain', 'emph', 'date'], more: ['title', 'pubDate'], labels: { subject: '主題', date: '發布日期' } },
    airsit: { main: ['date', 'n', 'm', 'areas', 'ships', 'boats'], more: ['title', 'pubDate'], labels: { date: '統計截止日' } },
    rewrite: { main: ['notes', 'title'], more: ['pubDate'] }
  };
  const PHRASES = { leader: 'u', ceremony: 'u', clarify: 'h', policy: 'h', hq: 'h' };

  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => iso(new Date());
  const parse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const roc = s => { const d = parse(s); return d ? (d.getFullYear() - 1911) + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' : '○年○月○日'; };
  const md = d => (d.getMonth() + 1) + '月' + d.getDate() + '日';
  const br = (n, st) => st && st.bracket === 'half' ? '(' + n + ')' : '（' + n + '）';
  function dayWord(date, pub, st) {
    const d = parse(date), p = parse(pub || today());
    if (!d) return '今' + br('○', st) + '日';
    const diff = Math.round((p - d) / 864e5);
    if (diff === 0) return '今' + br(d.getDate(), st) + '日';
    if (diff === 1) return '昨' + br(d.getDate(), st) + '日';
    return '日前';
  }
  function dayLabel(date, pub) {
    const d = parse(date), p = parse(pub || today());
    if (!d) return '';
    const diff = Math.round((p - d) / 864e5);
    return diff === 0 ? '今日' : diff === 1 ? '昨日' : diff > 1 ? '日前' : '預發稿';
  }
  const clean = s => (s || '').trim().replace(/[。．.，,；;\s]+$/, '');
  const has = s => !!clean(s);
  const H = '○○';
  function detectUnit(s) { for (const u of UNITS) if (u[2].test(s || '')) return { k: u[0], name: u[1] }; return null; }
  const occKey = o => OK[o] || 'any';
  const sub = (t, unit) => t.replace(/\{單位\}/g, clean(unit) || '該單位');
  function who(f, st) {
    const t = (st.titles || []).find(x => x.role === f.person);
    const hd = r => (r || '').replace(/（.*?）|\(.*?\)/g, '');
    return t ? { role: hd(t.role), full: t.full || hd(t.role), short: t.short || hd(t.role) } : { role: f.person || H, full: f.person || H, short: f.person || H };
  }
  const unitOf = (type, f) => type === 'ceremony' ? f.place : f.target;

  function candidates(type, f, myLib) {
    const g = PHRASES[type]; if (!g) return [];
    const ok = occKey(f.occ), u = detectUnit(unitOf(type, f)), uk = u ? u.k : '';
    const list = LIB.concat((myLib || []).map(x => Object.assign({ o: [], u: [], g, mine: true }, x)));
    const out = [];
    list.forEach((p, i) => {
      if (!p.mine && p.g !== g) return;
      if (p.o.length && !p.o.includes(ok)) return;
      if (p.u.length && !p.u.includes(uk)) return;
      out.push(Object.assign({}, p, { score: (p.o.length ? 3 : 0) + (p.u.length ? 3 : 0) + (p.star ? 1 : 0) + (p.mine ? 2 : 0), i }));
    });
    out.sort((a, b) => b.score - a.score || a.i - b.i);
    return CATS.map(c => ({ cat: c, items: out.filter(p => p.c === c) })).filter(x => x.items.length);
  }
  function recommend(type, f, myLib, offset) {
    const groups = candidates(type, f, myLib); if (!groups.length) return [];
    const get = c => (groups.find(g => g.cat === c) || { items: [] }).items;
    const ok = occKey(f.occ);
    let plan;
    if (type === 'leader') {
      plan = [];
      if (f.action === '慰問' || ok !== 'any' || get('感謝').some(p => p.score >= 3)) plan.push('感謝');
      plan.push('肯定', '強調', f.action === '慰問' ? '提醒' : '期許', '祝福');
    } else if (type === 'ceremony') plan = ['肯定', '強調', '期許', '祝福'];
    else plan = ['強調'];
    const res = [];
    plan.forEach(c => {
      let items = get(c);
      if (c === '祝福') items = items.filter(p => p.o.length);
      if (!items.length) return;
      const p = items[(offset || 0) % items.length];
      res.push({ id: p.id, c: p.c, t: p.t, star: p.star, mine: p.mine });
    });
    return res;
  }

  const PURPOSE = {
    慰問: { spring: '關切春節加強戰備期間官兵執勤情形，肯定同仁堅守崗位的辛勞，並提前致上新春祝福', moon: '關心中秋連假期間官兵執勤情形，感謝同仁戍守崗位的辛勞，並致上佳節祝福', boat: '關心端午連假期間官兵執勤情形，感謝同仁堅守崗位，並致上佳節祝福', typhoon: '慰勉投入防颱整備及災後復原工作的官兵，並了解救災執行情形', nat: '慰勉參與國慶展演任務的官兵，肯定同仁連日訓練的辛勞', drill: '慰勉參演官兵，了解演習期間官兵生活與任務執行情形', any: '關心官兵生活與執勤情形，並慰勉同仁辛勞' },
    視導: { spring: '了解春節加強戰備期間單位整備與執勤情形', moon: '了解中秋連假期間單位戰備整備情形，並慰勉官兵辛勞', boat: '了解端午連假期間單位戰備整備情形', typhoon: '了解單位防颱整備與應變處置情形', nat: '了解國慶展演任務整備與訓練情形', drill: '了解演習各項課目執行與戰備整備情形', any: '了解單位戰備整備及訓練執行情形' },
    主持: { any: '向與會官兵致意，並肯定全體同仁的付出' }
  };
  const EVENT = { spring: '春節團拜', moon: '中秋聯歡活動', boat: '端午加菜餐敘', nat: '國慶展演任務誓師', typhoon: '防颱整備會議', drill: '演習任務提示', any: '' };
  const PROCESS = { radar: '聽取單位任務簡報，實地走訪雷達作業室及官兵生活區域', missile: '聽取單位任務簡報，實地察看飛彈陣地及戰備值班情形', wing: '聽取聯隊任務簡報，實地走訪棚廠、待命室及修護作業區', maint: '聽取單位簡報，實地察看修護棚廠及料件管理作業', island: '聽取單位任務簡報，實地走訪據點陣地及官兵生活區域', school: '聽取校務簡報，並實地察看教學與訓練設施', medic: '聽取任務簡報，實地察看救護裝備與待命整備情形', band: '觀摩樂儀隊操演，並與隊員互動交流', any: '聽取單位任務簡報，並實地走訪官兵工作與生活區域' };
  const GIFT = { spring: '，並致贈慰問品，與官兵互道新春祝福', moon: '，並致贈月餅及慰問品，與官兵共度佳節', boat: '，並致贈粽子及慰問品', typhoon: '，並致贈慰問品，慰勉官兵辛勞', any: '，並致贈慰問品' };
  const TAIL = { spring: '勉戰備不懈 守護國人安心過年', moon: '感謝堅守崗位 守護國人團圓', boat: '勉落實戰備 確保佳節安全', nat: '勉精益求精 展現空軍堅實戰力', typhoon: '肯定救災辛勞 守護家園', drill: '勉戰訓合一 驗證作戰能力' };
  const CER = { 結訓: '勉勵結訓學員將所學運用於部隊任務', 交接: '期勉新任主官承先啟後，持續精進單位戰力', 交機: '象徵空軍戰力持續提升' };

  function smartFill(type, f) {
    const p = {}, ok = occKey(f.occ), u = detectUnit(unitOf(type, f));
    const set = (k, v) => { if (!has(f[k]) && v) p[k] = v; };
    if (type === 'leader') {
      const a = f.action || '視導';
      set('purpose', (PURPOSE[a] || PURPOSE.視導)[ok] || (PURPOSE[a] || PURPOSE.視導).any);
      if (a === '主持') { set('event', EVENT[ok]); set('process', '親自向官兵致詞，並與與會人員合影留念'); }
      else set('process', PROCESS[u ? u.k : 'any'] + (a === '慰問' ? (GIFT[ok] || GIFT.any) : ''));
    }
    if (type === 'ceremony') set('purpose', CER[f.kind || '結訓']);
    if (type === 'clarify') set('closing', '空軍呼籲社會大眾勿輕信、轉傳未經證實之訊息，以免誤導視聽');
    return p;
  }

  const VERB = { 感謝: ['感謝', '也感謝', ''], 肯定: ['肯定', '並肯定', ''], 強調: ['強調', '進一步指出', '，'], 期許: ['期許', '也期勉', ''], 提醒: ['提醒', '並叮囑', '，'], 勉勵: ['勉勵', '也勉勵', ''] };
  const GROUPS = [['感謝', '肯定'], ['強調'], ['期許', '勉勵', '提醒']];
  const phraseText = (s, unit) => clean(s.edit != null ? s.edit : sub(s.t, unit));
  function phraseParas(sel, S, P, unit, ctx) {
    const out = [];
    GROUPS.forEach(g => {
      const items = []; g.forEach(c => sel.filter(s => s.c === c).forEach(s => items.push(s)));
      if (!items.length) return;
      const ss = items.map((s, i) => {
        const v = VERB[s.c], alt = ctx.last === s.c; ctx.last = s.c;
        return (i === 0 ? S : P) + (alt ? v[1] : v[0]) + v[2] + phraseText(s, unit) + '。';
      }).filter(x => x);
      out.push(ss.join(''));
    });
    return out;
  }
  function blessings(sel, S, unit) { return sel.filter(s => s.c === '祝福').map(s => '最後，' + S + phraseText(s, unit) + '。'); }

  function compose(type, f, sel, st) {
    st = st || {}; sel = (sel || []).filter(s => clean(phraseText(s, '')));
    const pub = f.pubDate || today(), day = dayWord(f.date, pub, st), ok = occKey(f.occ), occL = OSHORT[ok];
    const paras = []; let title = clean(f.title), ctx = { last: '' };
    const meta = '發布單位：空軍司令部　發布日期：' + roc(pub);
    if (type === 'leader') {
      const w = who(f, st), tgt = clean(f.target) || H, a = f.action || '視導';
      if (a === '主持') paras.push(w.full + day + '於' + tgt + '主持' + (clean(f.event) || H) + '，' + (clean(f.purpose) || H) + '。');
      else paras.push(w.full + day + '赴' + tgt + (occL ? '實施' + occL + a : a) + '，' + (clean(f.purpose) || H) + '。');
      if (has(f.process)) paras.push((a === '主持' ? '活動中' : a + '期間') + '，' + w.short + clean(f.process) + '。');
      paras.push(...phraseParas(sel, w.short, '他', tgt, ctx));
      if (has(f.extra)) paras.push(clean(f.extra) + '。');
      paras.push(...blessings(sel, w.short, tgt));
      if (!title) title = a === '主持' ? w.role + '主持' + (clean(f.event) || H) : w.role + occL + a + tgt + (TAIL[ok] ? ' ' + TAIL[ok] : a === '視導' ? ' 勉精實訓練 強化戰備' : a === '慰問' ? ' 肯定官兵辛勞' : '');
    } else if (type === 'ceremony') {
      const w = who(f, st), pl = clean(f.place) || H, sj = clean(f.subject) || H, k = f.kind || '結訓';
      const name = k === '結訓' ? '「' + sj + '」結訓典禮' : k === '交接' ? sj + '主官交接典禮' : sj + '交機典禮';
      paras.push(w.full + day + '於' + pl + '主持' + name + '，' + (clean(f.purpose) || H) + '。');
      if (has(f.detail)) paras.push(clean(f.detail) + '。');
      paras.push(...phraseParas(sel, w.short, '他', pl, ctx));
      paras.push(...blessings(sel, w.short, pl));
      if (!title) title = w.role + '主持' + (k === '結訓' ? sj + '結訓典禮' : name);
    } else if (type === 'clarify') {
      const sj = clean(f.subject) || H;
      paras.push('針對媒體報導「' + sj + '」一事，空軍司令部' + day + '提出說明。');
      paras.push((has(f.report) ? '報導指稱' + clean(f.report) + '，經查與事實不符。' : '') + (clean(f.facts) || H) + '。');
      paras.push(...phraseParas(sel, '空軍', '空軍', '', ctx));
      if (has(f.closing)) paras.push(clean(f.closing) + '。');
      if (!title) title = '針對' + sj + '報導 空軍說明';
    } else if (type === 'policy') {
      const sj = clean(f.subject) || H;
      paras.push('空軍司令部' + day + '介紹' + sj + '，' + (clean(f.desc) || H) + '。');
      if (has(f.benefit)) { paras.push('空軍指出，' + clean(f.benefit) + '。'); }
      paras.push(...phraseParas(sel, '空軍', '空軍', '', ctx));
      if (!title) title = '空軍介紹' + sj;
    } else if (type === 'hq') {
      paras.push('空軍司令部' + day + '表示，' + (clean(f.say) || H) + '。');
      paras.push('空軍說明，' + (clean(f.explain) || H) + '。');
      paras.push('空軍強調，' + (clean(f.emph) || H) + '。'); ctx.last = '強調';
      paras.push(...phraseParas(sel, '空軍', '空軍', '', ctx));
      if (!title) title = clean(f.subject) || H;
    } else if (type === 'airsit') {
      const d = parse(f.date) || new Date(), p = new Date(d - 864e5), num = v => has(v) ? String(v).trim() : '○';
      const m = parseInt(f.m) || 0, b = parseInt(f.boats) || 0, ar = (f.areas || []).join('、') || H;
      paras.push(md(p) + '6時至' + md(d) + '6時止，偵獲共機' + num(f.n) + '架次' + (m > 0 ? '，其中' + m + '架次逾越海峽中線及其延伸線，進入我' + ar + '空域' : '') + '；共艦' + num(f.ships) + '艘' + (b > 0 ? '、公務船' + b + '艘' : '') + '，持續在臺海周邊活動。');
      paras.push('國軍運用聯合情監偵手段嚴密監控，並派遣任務機、艦艇及岸置飛彈系統應處。');
      if (!title) title = md(d) + '臺海周邊空情動態';
    } else if (type === 'rewrite') {
      const lines = (f.notes || '').replace(/\r/g, '').split('\n'); let cur = [], first = null;
      const flush = () => { if (cur.length) paras.push(cur.join('')); cur = []; };
      lines.forEach(l => {
        let t = l.trim().replace(/^([-•*・●◎]|\d+[.、．)）])\s*/, '');
        if (!t) { flush(); return; }
        t = normalize(t);
        if (first === null) { first = t; if (!title && t.length <= 30 && !/[，。！？：]/.test(t)) { title = t; return; } }
        if (!/[。！？」』]$/.test(t)) t = t.replace(/[，、；]$/, '') + '。';
        cur.push(t); if (cur.length >= 3) flush();
      });
      flush();
      if (!paras.length) paras.push(H);
      if (!title) title = H;
    }
    return { title, meta, paras, contact: has(st.contact) ? '新聞聯絡人：' + clean(st.contact) : '' };
  }

  function normalize(s) {
    return s.replace(/台/g, '臺').replace(/([\u4e00-\u9fff])[ \t]+(?=[\u4e00-\u9fff])/g, '$1')
      .replace(/([\u4e00-\u9fff」）])\s*([,;:?!])/g, (m, a, b) => a + FW[b])
      .replace(/([,;:?!])\s*([\u4e00-\u9fff「（])/g, (m, a, b) => FW[a] + b);
  }
  const FW = { ',': '，', ';': '；', ':': '：', '?': '？', '!': '！' };

  function toText(doc) {
    return [doc.title, doc.meta, ''].concat(doc.paras.map(p => '　　' + p)).concat(doc.contact ? ['', doc.contact] : []).join('\n');
  }
  function parseText(txt) {
    const ls = (txt || '').split('\n'); let i = 0;
    while (i < ls.length && !ls[i].trim()) i++;
    const title = (ls[i++] || '').trim(); let meta = '';
    if (ls[i] && /^發布/.test(ls[i].trim())) meta = ls[i++].trim();
    const paras = []; let contact = '';
    for (; i < ls.length; i++) { const t = ls[i].replace(/^[\s　]+/, '').trimEnd(); if (!t) continue; if (/^新聞聯絡人/.test(t)) contact = t; else paras.push(t); }
    return { title, meta, paras, contact };
  }

  const COLLOQ = { '很棒': '優異', '搞定': '完成', '然後': '隨後', '超級': '極為', '蠻': '相當', '其實': '', 'OK': '妥適' };
  const SPEC = /可能|應該|似乎|據說|恐怕|大概|好像|據悉/g;
  const RULES = [
    { id: 'tai', title: '「台」應寫為「臺」', re: /台/g, fix: s => s.replace(/台/g, '臺') },
    { id: 'half', title: '半形標點', re: /[\u4e00-\u9fff」）]\s*[,;:?!]|[,;:?!]\s*[\u4e00-\u9fff「（]/g, fix: s => normalize(s.replace(/台/g, '台')) },
    { id: 'china', title: '「中國軍機／軍艦」應稱「共機／共艦」', re: /中國(軍機|戰機|軍艦|艦艇)|中共軍機/g, fix: s => s.replace(/中國(軍機|戰機)|中共軍機/g, '共機').replace(/中國(軍艦|艦艇)/g, '共艦') },
    { id: 'colloq', title: '口語用字', re: /很棒|搞定|然後|超級|蠻|其實|OK/g, fix: s => s.replace(/很棒|搞定|然後|超級|蠻|其實|OK/g, m => COLLOQ[m]) },
    { id: 'spec', title: '臆測語氣', re: SPEC, note: '新聞稿應陳述確定事實，請改寫或刪除' },
    { id: 'hole', title: '尚有欄位未填（○○）', re: /○+/g, note: '回到基本資料補齊', go: 2 }
  ];
  function checks(doc, st) {
    const all = [doc.title].concat(doc.paras).join('\n'), out = [];
    RULES.forEach(r => {
      const m = all.match(r.re); if (!m) return;
      out.push({ id: r.id, title: r.title, detail: r.note || ('出現 ' + m.length + ' 處：' + Array.from(new Set(m)).slice(0, 3).join('、')), count: m.length, fixable: !!r.fix, go: r.go || 0 });
    });
    if (!st || st.bracket !== 'half') { const m = all.match(/[今昨]\((\d+)\)日/g); if (m) out.push({ id: 'paren', title: '日期括號應為全形', detail: m.join('、'), count: m.length, fixable: true }); }
    const long = doc.paras.join('').split(/[。！？]/).filter(s => s.length > 80);
    if (long.length) out.push({ id: 'long', title: '句子過長', detail: long.length + ' 句超過 80 字，建議拆句：「' + long[0].slice(0, 14) + '…」', count: long.length, fixable: false });
    const tl = (doc.title || '').replace(/\s/g, '').length;
    if (tl > 30) out.push({ id: 'tlen', title: '標題超過 30 字', detail: '目前 ' + tl + ' 字，可在「更多細節」自訂較短標題', count: 1, fixable: false, go: 2 });
    return out;
  }
  function fixer(id) {
    if (id === 'paren') return s => s.replace(/([今昨])\((\d+)\)日/g, '$1（$2）日');
    const r = RULES.find(x => x.id === id); return r && r.fix ? r.fix : null;
  }

  const KW = [[/期勉|期許|期盼/, '期許'], [/勉勵/, '勉勵'], [/強調|指出|要求/, '強調'], [/提醒|叮囑/, '提醒'], [/肯定|讚許|嘉許/, '肯定'], [/感謝/, '感謝'], [/祝福|祝賀/, '祝福']];
  function extract(text) {
    const out = [], seen = {};
    (text || '').replace(/\s+/g, '').split(/[。！？]/).forEach(s => {
      for (const [re, c] of KW) {
        const m = re.exec(s); if (!m) continue;
        let t = s.slice(m.index + m[0].length).replace(/^[，：:,「]+/, '').replace(/」$/, '');
        t = normalize(t);
        if (t.length >= 8 && !seen[t]) { seen[t] = 1; out.push({ c, t }); }
        break;
      }
    });
    return out;
  }

  function wordHtml(doc) {
    const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return '\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + esc(doc.title) +
      '</title><style>@page WordSection1{size:21cm 29.7cm;margin:2.54cm 3.17cm}div.WordSection1{page:WordSection1}body{font-family:"標楷體","DFKai-SB","BiauKai";font-size:14pt;line-height:150%}h1{font-family:"標楷體","DFKai-SB";font-size:18pt;text-align:center;margin:0 0 12pt}p{font-family:"標楷體","DFKai-SB";text-indent:28pt;margin:0 0 6pt;text-align:justify}p.meta{text-indent:0;text-align:right;font-size:12pt}</style></head><body><div class="WordSection1"><h1>' + esc(doc.title) + '</h1>' +
      (doc.meta ? '<p class="meta">' + esc(doc.meta) + '</p>' : '') + doc.paras.map(p => '<p>' + esc(p) + '</p>').join('') + (doc.contact ? '<p class="meta">' + esc(doc.contact) + '</p>' : '') + '</div></body></html>';
  }

  function makeStore(prefix, memOnly) {
    const mem = {}; const s = { ok: true };
    s.get = k => { if (!memOnly) { try { const v = localStorage.getItem(prefix + k); if (v != null) return JSON.parse(v); } catch (e) { s.ok = false; } } return mem[k] != null ? mem[k] : null; };
    s.set = (k, v) => { mem[k] = v; if (memOnly) return; try { localStorage.setItem(prefix + k, JSON.stringify(v)); } catch (e) { s.ok = false; } };
    return s;
  }
  const defaultSettings = () => ({
    titles: [{ role: '司令', full: '空軍司令鄭榮豐上將', short: '鄭司令' }, { role: '副司令（王）', full: '空軍副司令王德揚中將', short: '王副司令' }, { role: '副司令（顏）', full: '空軍副司令顏有賢中將', short: '顏副司令' }, { role: '參謀長', full: '空軍參謀長李慶然中將', short: '李參謀長' }, { role: '政戰主任', full: '空軍司令部政戰主任虞德忠中將', short: '虞主任' }],
    bracket: 'full', contact: ''
  });
  const blankForm = () => ({ person: '司令', date: today(), pubDate: '', action: '視導', occ: '一般', target: '', kind: '結訓', areas: [] });
  const demo = () => ({ type: 'leader', form: Object.assign(blankForm(), { person: '司令', date: '2026-02-10', pubDate: '2026-02-10', action: '慰問', occ: '春節', target: '空軍第二雷達中隊' }), sel: [], manual: null });

  window.PRE = { OCC, CATS, TYPES, F, SCHEMA, PHRASES, LIB, detectUnit, occKey, sub, candidates, recommend, smartFill, compose, toText, parseText, checks, fixer, extract, wordHtml, makeStore, defaultSettings, blankForm, demo, roc, dayLabel, today, iso, unitOf, normalize };
})();
