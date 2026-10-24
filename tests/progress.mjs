// 舊版進度相容與間隔複習：node tests/progress.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const SHORT ='), source.indexOf('/* ---------- 主動回想：'));
function setup(seed) {
  const storage = structuredClone(seed); let state, pending, first = true;
  const ctx = { TOPICS: [{id:'a'},{id:'b'}], Date,
    load: (k,d) => storage[k] ?? d, save: (k,v) => storage[k] = structuredClone(v),
    useState: init => { if(first) state=typeof init==='function'?init():init; return [state, v=>{state=typeof v==='function'?v(state):v;}]; },
    useEffect: f=>pending=f };
  vm.createContext(ctx); vm.runInContext(code,ctx);
  function render(){const study=vm.runInContext('useStudy()',ctx);first=false;pending();return study;}
  return {render,storage};
}
let x=setup({village:{a:{stage:2,due:'2099-01-01',best:3,extra:'keep'}},res:{gold:900},drafts:{1:'草稿'},scores:{1:96},qstars:{1:3}});
let app=x.render();assert.equal(app.status('a').kind,'ok');assert.equal(app.status('b').kind,'new');
app.recordRecall('a',true);app=x.render();
assert.equal(x.storage.village.a.stage,2);assert.equal(x.storage.village.a.due,'2099-01-01');assert.equal(x.storage.village.a.extra,'keep');
assert.deepEqual(x.storage.res,{gold:900});assert.deepEqual(x.storage.drafts,{1:'草稿'});assert.deepEqual(x.storage.scores,{1:96});assert.deepEqual(x.storage.qstars,{1:3});
app.recordRecall('a',false);app=x.render();assert.equal(app.status('a').kind,'dmg');assert.equal(x.storage.village.a.stage,2);assert.equal(x.storage.village.a.best,3);
app.recordRecall('a',true);app=x.render();assert.equal(app.status('a').kind,'ok');assert.equal(x.storage.village.a.stage,3);
app.recordRecall('b',false);app=x.render();assert.equal(app.status('b').kind,'dmg');assert.equal(x.storage.village.b.stage,0);
app.recordRecall('b',true);app=x.render();assert.equal(x.storage.village.b.stage,1);
x=setup({village:{a:{stage:4,due:'2020-01-01',best:3}}});app=x.render();assert.equal(app.status('a').kind,'dmg');app.recordRecall('a',true);x.render();assert.equal(x.storage.village.a.stage,4);
x=setup({known:{a:true,b:false}});app=x.render();assert.equal(app.status('a').stage,1);assert.equal(app.status('b').stage,0);assert.equal(x.storage.known.a,true);
console.log('✓ 舊 village／known、草稿、分數與資源保留；提早、到期、需補強、新主題與最高階段複習均通過');
