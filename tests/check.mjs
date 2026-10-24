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
  '\n;globalThis.__out = { TOPICS, QUESTIONS, SHORT, grade, chunks, topicScript };';
const ctx = { window: {}, console };
vm.runInNewContext(code, ctx);
const { TOPICS, QUESTIONS, SHORT, grade, chunks, topicScript } = ctx.__out;

// 3. 主題與題庫對應
const ids = new Set(TOPICS.map(t => t.id));
if (ids.size !== TOPICS.length) warn('TOPICS 有重複的 id');
const qids = new Set(QUESTIONS.map(q => q.id));
if (qids.size !== QUESTIONS.length) warn('QUESTIONS 有重複的 id');
TOPICS.forEach(t => { if (!SHORT[t.id]) warn(`主題 ${t.id} 沒有建築名稱（SHORT）`); });
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
console.log(`主題 ${TOPICS.length} 個、口試題 ${QUESTIONS.length} 題`);
if (problems) { console.error(`共 ${problems} 個問題`); process.exit(1); }
console.log('✓ 全部通過');
