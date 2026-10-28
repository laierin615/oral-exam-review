// 改完 index.html 後執行：node tests/check.mjs
// 檢查：script 語法、主題與題庫的對應、46 份滿分範本是否全部命中關鍵字且估計分 ≥ 85
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('<script>\n');
const end = html.lastIndexOf('</script>');
if (start < 0 || end < start) fail('找不到內嵌的 <script> 區塊');
const js = html.slice(start + '<script>\n'.length, end);

let problems = 0;
function fail(msg) { console.error('✗ ' + msg); process.exit(1); }
function warn(msg) { console.error('✗ ' + msg); problems++; }

// 1. 語法（只編譯不執行）
try { new vm.Script(js, { filename: 'index.html<script>' }); console.log('✓ script 語法正確'); }
catch (e) { fail('script 語法錯誤：' + e.message); }

// 2. 抽出題庫與比對引擎（依區塊標記切出，標記被改名時這裡會失敗）
const slice = (a, b) => {
  const i = js.indexOf(a), j = js.indexOf(b, i);
  if (i < 0 || j < 0) fail(`找不到區塊標記「${a}」或「${b}」，請保留這些標記`);
  return js.slice(i, j);
};
const code = slice('const TOPICS', 'const RANK') + slice('const synth', 'const Speaker') +
  slice('const SHORT', 'TOPICS.forEach') +
  '\n;globalThis.__out = { TOPICS, QUESTIONS, SHORT, grade, chunks, topicScript, topicParts, topicQuiz, questionQuiz, gapFor, CHUNK_MAX, mandarinVoices, pickVoice };';
const ctx = { window: {}, console };
vm.runInNewContext(code, ctx);
const { TOPICS, QUESTIONS, SHORT, grade, chunks, topicScript, topicParts, topicQuiz, questionQuiz, gapFor, CHUNK_MAX, mandarinVoices, pickVoice } = ctx.__out;

// 3. 主題與題庫對應
const ids = new Set(TOPICS.map(t => t.id));
if (ids.size !== TOPICS.length) warn('TOPICS 有重複的 id');
const qids = new Set(QUESTIONS.map(q => q.id));
if (qids.size !== QUESTIONS.length) warn('QUESTIONS 有重複的 id');
TOPICS.forEach(t => { if (!SHORT[t.id]) warn(`主題 ${t.id} 沒有主題簡稱（SHORT）`); });
QUESTIONS.forEach(q => [q.topic, ...(q.also || [])].forEach(t => { if (!ids.has(t)) warn(`第 ${q.id} 題的主題 ${t} 不存在`); }));
TOPICS.forEach(t => { if (!QUESTIONS.some(q => q.topic === t.id || (q.also || []).includes(t.id))) warn(`主題 ${t.id} 沒有任何口試題`); });
TOPICS.forEach((t, i) => { if (!chunks(topicScript(t, i)).length) warn(`主題 ${t.id} 朗讀稿是空的`); });

// 4. 滿分範本自測
let low = 0;
for (const q of QUESTIONS) {
  const r = grade(q, q.model);
  const miss = r.kws.filter(k => k.status !== 'hit');
  if (miss.length || r.total < 85) {
    low++;
    warn(`第 ${q.id} 題範本 ${r.total} 分` + (miss.length ? `，沒命中：${miss.map(k => `${k.label}（缺 ${k.lack.join('、')}）`).join('；')}` : '，定義句或實例不足'));
  }
}
if (!low) console.log(`✓ ${QUESTIONS.length} 份滿分範本全部命中關鍵字，估計分都 ≥ 85`);

// 5. 朗讀句長、跟讀段落與語音聽考
const before = problems;
const tooLong = units => units.filter(u => u.say && u.say.length > CHUNK_MAX + 1);
TOPICS.forEach((t, i) => {
  const long = chunks(topicScript(t, i)).filter(c => c.length > CHUNK_MAX + 1);
  if (long.length) warn(`主題 ${t.id} 有超過 ${CHUNK_MAX + 1} 字的朗讀句：${long[0]}`);
  const parts = topicParts(t, i).map(p => p.part);
  if (!parts.includes('open') || t.pts.some((_, k) => !parts.includes('pt-' + k)) || (t.traps.length && !parts.includes('traps'))) warn(`主題 ${t.id} 朗讀段落缺少開場句、重點或易錯提醒`);
  const quiz = topicQuiz(t, i);
  if (quiz.length !== t.pts.length + 2) warn(`主題 ${t.id} 聽考應有 ${t.pts.length + 2} 步，實際 ${quiz.length} 步`);
  quiz.forEach(s => {
    const gaps = s.units.filter(u => u.gap), sec = gaps[0] && gapFor(gaps[0].gap.ans, 'auto', gaps[0].gap.lo, gaps[0].gap.hi);
    if (gaps.length !== 1 || !s.units.some(u => u.part === 'q') || !s.units.some(u => u.part === 'a') || !(sec >= 6 && sec <= 30)) warn(`主題 ${t.id} 聽考「${s.label}」缺少題目、停頓或答案`);
    if (tooLong(s.units).length) warn(`主題 ${t.id} 聽考「${s.label}」有過長的朗讀句`);
  });
});
QUESTIONS.forEach(q => {
  const it = questionQuiz(q), g = it.units.find(u => u.gap), sec = g && gapFor(g.gap.ans, 'auto', g.gap.lo, g.gap.hi);
  if (!(sec >= 20 && sec <= 120)) warn(`第 ${q.id} 題聽考停頓 ${sec} 秒，超出 20～120`);
  if (tooLong(it.units).length) warn(`第 ${q.id} 題聽考有過長的朗讀句`);
});
if (gapFor('一二三', 'manual', 6, 30) !== -1 || gapFor('一二三', '10', 6, 30) !== 10 || gapFor('一二三', 'auto', 6, 30) !== 6) warn('作答時間設定換算錯誤');
if (problems === before) console.log(`✓ 朗讀句都在 ${CHUNK_MAX + 1} 字內，${TOPICS.length} 個主題與 ${QUESTIONS.length} 題聽考都有題目、停頓、答案`);

// 6. 自動選聲音：各平台挑最自然的中文聲音，機械音與粵語不列入
const beforeVoice = problems;
const V = (name, lang, voiceURI = name) => ({ name, lang, voiceURI });
const apple = [V('美佳', 'zh-TW', 'com.apple.voice.compact.zh-TW.Meijia'), V('Eddy (中文（台灣）)', 'zh-TW', 'com.apple.eloquence.zh-TW.Eddy'),
  V('Flo (中文（台灣）)', 'zh-TW'), V('善怡', 'yue-HK'), V('婷婷', 'zh-CN'),
  V('Siri 聲音 2', 'zh-TW', 'com.apple.speech.synthesis.voice.custom.siri.zh-TW.voice2')];
[
  ['iPhone／Mac 基本語音', apple, '美佳'],
  ['下載加強版後', [...apple, V('美佳', 'zh-TW', 'com.apple.voice.enhanced.zh-TW.Meijia')], 'com.apple.voice.enhanced.zh-TW.Meijia'],
  ['Chrome', [V('美佳', 'zh-TW'), V('Eddy (中文（台灣）)', 'zh-TW'), V('Google 普通话（中国大陆）', 'zh-CN'), V('Google 國語（臺灣）', 'zh-TW'), V('Google 粤語（香港）', 'zh-HK')], 'Google 國語（臺灣）'],
  ['Edge', [V('Microsoft Hanhan - Chinese (Traditional, Taiwan)', 'zh-TW'), V('Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', 'zh-CN'),
    V('Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)', 'zh-TW')], 'Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)'],
].forEach(([label, list, want]) => {
  const got = pickVoice(mandarinVoices(list), '');
  if (!got || (got.name !== want && got.voiceURI !== want)) warn(`自動選聲音（${label}）應選「${want}」，實際「${got && got.name}」`);
});
if (mandarinVoices(apple).some(v => /Eddy|Flo|善怡|Siri/.test(v.name))) warn('聲音清單不應出現機械音、粵語或 Siri 聲音');
if (pickVoice(mandarinVoices(apple), 'com.apple.eloquence.zh-TW.Eddy')?.name !== '美佳') warn('之前選過的機械音應改回自動');
if (problems === beforeVoice) console.log('✓ 自動選聲音：Edge 自然語音、加強版、Google 依序優先，機械音、粵語與 Siri 聲音不列入');
// 7. 考古題：198 題（原題號 1～200，缺 93、137），每題有題幹、四個選項（199 題 D 原缺文）、答案與解析
const beforeMcq = problems;
const mcqCtx = {};
vm.runInNewContext(slice('const MCQ =', 'const MCQ_FILTERS') + ';globalThis.__mcq = MCQ;', mcqCtx);
const MCQ = mcqCtx.__mcq, nums = new Set(MCQ.map(x => x.n));
if (MCQ.length !== 198 || nums.size !== 198 || nums.has(93) || nums.has(137)) warn(`考古題應為 198 題且缺 93、137，實際 ${MCQ.length} 題`);
MCQ.forEach(x => {
  if (!x.q || x.o.length !== 4 || x.o.slice(0, x.n === 199 ? 3 : 4).some(o => !o)) warn(`考古題第 ${x.n} 題題幹或選項不完整`);
  if (!x.e || !x.al || (x.a && !'ABCD'.includes(x.a))) warn(`考古題第 ${x.n} 題缺答案或解析`);
});
if (MCQ.filter(x => !x.a).map(x => x.n).join() !== '73,133') warn('不計分的題目應只有第 73、133 題');
if (problems === beforeMcq) console.log(`✓ 考古題 ${MCQ.length} 題都有題幹、選項、答案與解析`);
console.log(`主題 ${TOPICS.length} 個、口試題 ${QUESTIONS.length} 題、考古題 ${MCQ.length} 題`);
if (problems) { console.error(`共 ${problems} 個問題`); process.exit(1); }
console.log('✓ 全部通過');
