const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createAdminServer,validate}=require('../scripts/admin-server.cjs');

async function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-admin-test-'));
  for(const folder of ['assets/js','admin'])fs.mkdirSync(path.join(root,folder),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'../assets/js/site-data.js'),path.join(root,'assets/js/site-data.js'));
  fs.writeFileSync(path.join(root,'assets/js/page-content.js'),'window.portfolioPageContent = {};');
  fs.writeFileSync(path.join(root,'index.html'),'<script src="assets/js/site-data.js?v=old"></script><script src="assets/js/page-content.js"></script>');
  fs.writeFileSync(path.join(root,'admin/index.html'),'<meta name="token" content="__ADMIN_TOKEN__">');
  const app=createAdminServer({root});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  t.after(()=>new Promise(r=>app.server.close(()=>{fs.rmSync(root,{recursive:true,force:true});r();})));
  const call=async(route,data,headers={})=>{const response=await fetch(base+route,{method:data?'POST':'GET',headers:{'X-Admin-Token':app.token,...headers,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {response,value:await response.json()};};
  return {...app,root,base,call};
}
test('admin APIs reject missing token, foreign origin and private paths',async t=>{
  const f=await fixture(t);
  assert.equal((await fetch(f.base+'/api/state')).status,403);
  assert.equal((await f.call('/api/state',null,{Origin:'https://example.com'})).response.status,403);
  assert.equal((await fetch(f.base+'/.git/config')).status,404);
  assert.equal((await fetch(f.base+'/assets/%2e%2e/%2e%2e/.git/config')).status,404);
  const html=await fetch(f.base+'/admin/');assert.ok((await html.text()).includes(f.token));
});
test('saving updates JS, bumps cache versions, backs up and detects concurrent edits',async t=>{
  const f=await fixture(t),initial=(await f.call('/api/state')).value;
  const oldTitle=initial.data.projects[0].title;initial.data.projects[0].title='CMS test project';
  const result=await f.call('/api/save',initial);assert.equal(result.response.status,200);assert.equal(result.value.data.projects[0].title,'CMS test project');
  assert.ok(fs.readFileSync(path.join(f.root,'index.html'),'utf8').includes('?v=admin-'));
  assert.equal((await f.call('/api/save',initial)).response.status,409);
  const backups=(await f.call('/api/backups')).value.items;assert.equal(backups.length,1);
  const restored=await f.call('/api/restore',{revision:result.value.revision,id:backups[0].id});assert.equal(restored.response.status,200);assert.equal(restored.value.data.projects[0].title,oldTitle);
});
test('project deletion is a reference change and does not delete media',async t=>{
  const f=await fixture(t),s=(await f.call('/api/state')).value;
  fs.mkdirSync(path.join(f.root,'assets/images/uploads'),{recursive:true});const file=path.join(f.root,'assets/images/uploads/keep.jpg');fs.writeFileSync(file,'original');
  s.data.projects.splice(0,1);assert.equal((await f.call('/api/save',s)).response.status,200);assert.equal(fs.readFileSync(file,'utf8'),'original');
});
test('uploads reject executable or mismatched files and preserve originals',async t=>{
  const f=await fixture(t);
  assert.equal((await f.call('/api/upload',{name:'evil.html',data:Buffer.from('<script>').toString('base64')})).response.status,400);
  assert.equal((await f.call('/api/upload',{name:'fake.jpg',data:Buffer.from('not an image').toString('base64')})).response.status,400);
  const pdf=await f.call('/api/upload',{name:'../new CV.pdf',data:Buffer.from('%PDF-1.4 test').toString('base64')});assert.equal(pdf.response.status,200);assert.ok(pdf.value.path.startsWith('assets/pdfs/uploads/'));assert.ok(fs.existsSync(path.join(f.root,pdf.value.path)));
});
test('preview does not save and requires the same-site session cookie',async t=>{
  const f=await fixture(t),s=(await f.call('/api/state')).value,revision=s.revision;
  s.data.projects[0].title='Preview only';assert.equal((await f.call('/api/preview',s)).response.status,200);assert.equal(f.state().revision,revision);
  assert.equal((await fetch(f.base+'/api/preview-data.js')).status,403);
  const response=await fetch(f.base+'/api/preview-data.js',{headers:{Cookie:`portfolio-admin=${f.token}`}});assert.equal(response.status,200);assert.ok((await response.text()).includes('Preview only'));
  const protectedPreview=await fetch(f.base+'/api/preview-data.js',{headers:{Cookie:`portfolio-admin=${f.token}`}});assert.match(await protectedPreview.text(),/portfolioAdminPreview = true/);
});
test('validation protects IDs, media URLs and editable attribute names',()=>{
  const data={projects:[{id:'test',title:'Test',category:'Academic Projects',gallery:[]}]};
  assert.doesNotThrow(()=>validate(data,{}));
  assert.throws(()=>validate({...data,projects:[...data.projects,...data.projects]},{}));
  assert.throws(()=>validate({...data,projects:[{...data.projects[0],cover:'javascript:alert(1)'}]},{}));
  assert.throws(()=>validate(data,{index:{body:{innerHTML:'bad'}}}));
  assert.throws(()=>validate({...data,links:{linkedin:'javascript:alert(1)'}},{}));
  assert.throws(()=>validate({...data,education:'not a list'},{}));
  assert.throws(()=>validate({...data,projects:[{...data.projects[0],id:1}]},{}));
});

test('photography CRUD persists all collection kinds, gallery order and cache versions',async t=>{
  const f=await fixture(t),s=(await f.call('/api/state')).value;
  fs.writeFileSync(path.join(f.root,'photography.html'),'<script src="assets/js/site-data.js?v=old"></script>');
  const before=s.data.projects.map(p=>p.id);
  s.data.photoSettings.filmLabel='Moving Image';
  s.data.photoSettings.architectureLabel='Architecture';
  s.data.photoCollections=[{id:'polestar-test',kind:'commercial',title:'Polestar test',year:'2026',cover:'cover.jpg',gallery:[{image:'two.jpg',label:'Two'},{image:'one.jpg',label:'One'}]},{id:'paris-test',kind:'journey',title:'Paris',gallery:[]},{id:'landscape-test',kind:'landscape',title:'Landscape test',gallery:[]},{id:'buildings-test',kind:'architecture',title:'Architecture test',gallery:[{image:'building.jpg',label:'Building'}]}];
  let saved=await f.call('/api/save',s);
  assert.equal(saved.response.status,200);
  assert.equal(saved.value.data.photoSettings.filmLabel,'Moving Image');
  assert.equal(saved.value.data.photoSettings.architectureLabel,'Architecture');
  assert.equal(saved.value.data.photoCollections[3].kind,'architecture');
  assert.equal(saved.value.data.photoCollections[3].gallery[0].image,'building.jpg');
  assert.deepEqual(saved.value.data.photoCollections[0].gallery.map(p=>p.label),['Two','One']);
  assert.deepEqual(saved.value.data.projects.map(p=>p.id),before);
  assert.match(fs.readFileSync(path.join(f.root,'photography.html'),'utf8'),/v=admin-/);
  saved.value.data.photoCollections.splice(0,1);
  const removed=await f.call('/api/save',saved.value);
  assert.equal(removed.response.status,200);
  assert.equal(removed.value.data.photoCollections[0].kind,'journey');
  assert.equal(removed.value.data.photoCollections[1].kind,'landscape');
  assert.equal(removed.value.data.photoCollections[2].kind,'architecture');
});
