const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/splash.js'),'utf8');
function boot({hash='',search='',type='navigate'}={}){
  const classes=new Set(),timers=[],listeners=new Map();
  const root={dataset:{},classList:{add(...names){names.forEach(name=>classes.add(name));},remove(...names){names.forEach(name=>classes.delete(name));}}};
  const context={URLSearchParams,location:{hash,search},performance:{getEntriesByType:()=>[{type}]},matchMedia:()=>({matches:false}),
    document:{documentElement:root,querySelector:()=>null,addEventListener(){}},
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),
    MutationObserver:class{observe(){}disconnect(){}},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},cancelAnimationFrame(){}};
  vm.runInNewContext(source,context);
  return {root,classes,timers,listeners};
}
test('splash plays on fresh cover entry but skips internal returns, history and admin preview',()=>{
  for(const value of [{hash:'#profile-intro'},{hash:'#portfolios'},{hash:'#work-academic-01'},{search:'?admin-preview=1'},{type:'back_forward'}])assert.equal(boot(value).classes.size,0);
  assert.ok(boot().classes.has('has-splash'));
  assert.ok(boot({hash:'#profile'}).classes.has('has-splash'));
});
test('splash blocks accidental input and always removes locks after its safety deadline',()=>{
  const state=boot();
  let prevented=false;
  state.listeners.get('wheel')({type:'wheel',preventDefault(){prevented=true;},stopImmediatePropagation(){}});
  assert.ok(prevented);
  state.timers.find(timer=>timer.ms===6500).fn();
  assert.equal(state.classes.size,0);
  assert.equal(state.listeners.has('wheel'),false);
  assert.equal(state.root.dataset.splashState,undefined);
});
test('splash uses a fixed three-second typographic progress, live Hero knockout and reduced motion',()=>{
  assert.match(source,/const duration = 3000/);
  assert.match(source,/timer = setTimeout\(reveal, duration\)/);
  assert.match(source,/createElementNS\(svgNS, name\)/);
  assert.match(source,/mask.style.maskType = 'luminance'/);
  assert.match(source,/if \(preference.matches\)/);
  assert.doesNotMatch(source,/video\.cloneNode|hero\.cloneNode|video\.src|fetch\(/);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.indexOf('assets/js/splash.js')<html.indexOf('fonts.googleapis.com'));
  assert.match(html,/XITAO<i class="splash-baseline"/);
  assert.match(html,/PORTFOLIO<i class="splash-baseline"/);
});
