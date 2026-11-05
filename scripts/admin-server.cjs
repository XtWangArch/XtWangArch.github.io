const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const DATA = 'assets/js/site-data.js';
const PAGES = 'assets/js/page-content.js';
const MANIFEST = 'assets/js/image-manifest.js';
const HTML = ['index.html', 'cv.html', 'project.html', 'photography.html'];
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.avif':'image/avif', '.pdf':'application/pdf', '.mp4':'video/mp4', '.woff2':'font/woff2' };

function readAssignment(root, file, key, fallback) {
  if (!fs.existsSync(path.join(root, file))) return fallback;
  const box = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), box, { timeout: 1500 });
  return JSON.parse(JSON.stringify(box.window[key]));
}
function assignment(key, value) { return `window.${key} = ${JSON.stringify(value, null, 2)};\n`; }
function revision(root) {
  const hash = crypto.createHash('sha256');
  for (const file of [DATA, PAGES]) if (fs.existsSync(path.join(root, file))) hash.update(fs.readFileSync(path.join(root, file)));
  return hash.digest('hex');
}
function safeURL(value) {
  if (typeof value !== 'string') return false;
  if (!value) return true;
  value=value.trim();
  if(/[\u0000-\u001f\u007f]/.test(value))return false;
  if (/^[\x00-\x20]*[a-z][\w+.-]*:/i.test(value)) return /^(https?:\/\/|mailto:)/i.test(value);
  return !value.startsWith('//') && !value.includes('\\') && !value.split('/').includes('..');
}
function validate(data, pages) {
  if (!data || !Array.isArray(data.projects) || data.projects.length > 500) throw new Error('案例数据格式不正确');
  for (const key of ['education','experience','researchExperience','photography']) if (data[key] !== undefined && !Array.isArray(data[key])) throw new Error('列表内容格式不正确');
  if (data.videos && (!Array.isArray(data.videos.items) || !data.videos.featured || typeof data.videos.featured !== 'object')) throw new Error('视频列表格式不正确');
  const ids = new Set();
  for (const p of data.projects) {
    if (typeof p.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(p.id || '') || ids.has(p.id)) throw new Error('案例 ID 必须唯一，只能使用小写字母、数字和连字符');
    ids.add(p.id);
    if (typeof p.title !== 'string' || typeof p.category !== 'string' || !p.title.trim() || !p.category.trim()) throw new Error('每个案例都需要标题和分类');
    if (!Array.isArray(p.gallery) || p.gallery.length > 1000) throw new Error('图库数据格式不正确');
    if (p.gallery.some(image => !image || typeof image.image !== 'string' || typeof image.label !== 'string')) throw new Error('每张图库图片都需要路径和标题');
  }
  if (data.photoCollections !== undefined) {
    if (!Array.isArray(data.photoCollections) || data.photoCollections.length > 500) throw new Error('摄影集合格式不正确');
    const photoIds = new Set();
    for (const item of data.photoCollections) {
      if (!item || typeof item.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(item.id) || photoIds.has(item.id)) throw new Error('摄影集合 ID 必须唯一');
      photoIds.add(item.id);
      if (typeof item.title !== 'string' || !item.title.trim() || !['commercial', 'journey', 'landscape', 'architecture', 'elsewhere'].includes(item.kind)) throw new Error('摄影集合需要名称和有效栏目');
      if (!Array.isArray(item.gallery) || item.gallery.length > 1000 || item.gallery.some(image => !image || typeof image.image !== 'string' || typeof image.label !== 'string')) throw new Error('摄影图库格式不正确');
    }
  }
  if (data.photoSettings !== undefined) {
    if (!data.photoSettings || typeof data.photoSettings !== 'object' || Array.isArray(data.photoSettings)) throw new Error('摄影设置格式不正确');
    if (data.photoSettings.interval !== undefined && (!Number.isFinite(data.photoSettings.interval) || data.photoSettings.interval < 2500 || data.photoSettings.interval > 60000)) throw new Error('轮播间隔需在 2500 至 60000 毫秒之间');
  }
  function walk(value, depth=0) {
    if (depth > 18) throw new Error('数据嵌套过深');
    if (Array.isArray(value)) return value.forEach(v => walk(v, depth+1));
    if (value && typeof value === 'object') for (const [k,v] of Object.entries(value)) {
      if (['__proto__','constructor','prototype'].includes(k)) throw new Error('不允许的字段');
      if (['image','cover','logo','url','website','archdailyUrl','spotifyUrl','youtubeEmbed','src','href','poster','desktop','mobile','cv'].includes(k) && typeof v === 'string' && !safeURL(v)) throw new Error('链接格式不安全');
      walk(v, depth+1);
    }
  }
  walk(data); walk(pages);
  for (const [key,value] of Object.entries(data.links||{})) if(key!=='email'&&!safeURL(value))throw new Error('联系方式链接格式不安全');
  if (!pages || typeof pages !== 'object' || Array.isArray(pages)) throw new Error('页面文字数据格式不正确');
  for (const [page, fields] of Object.entries(pages)) {
    if (!['index','cv','project'].includes(page) || !fields || typeof fields !== 'object') throw new Error('未知页面');
    for (const [selector, patch] of Object.entries(fields)) {
      if (selector.length > 1000 || !patch || typeof patch !== 'object') throw new Error('页面字段无效');
      for (const [key,value] of Object.entries(patch)) if (!['text','label','content','src','alt','href','poster','desktop','mobile'].includes(key) || typeof value !== 'string') throw new Error('不允许的页面属性');
    }
  }
}

function createAdminServer({ root = path.resolve(__dirname, '..'), port = 5174 } = {}) {
  root = fs.realpathSync(root);
  const token = crypto.randomBytes(32).toString('hex');
  let writing = false;
  let preview = null;
  const backupsRoot = path.join(root, '.local-admin/backups');
  function commitFiles(files, note) {
    const id = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const dir = path.join(backupsRoot, id);
    const originals = new Map();
    for (const file of Object.keys(files)) {
      const target = path.join(root,file);
      const old = fs.existsSync(target) ? fs.readFileSync(target) : null;
      originals.set(file, old);
      if (old) { fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true}); fs.writeFileSync(path.join(dir,file),old); }
    }
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'backup.json'),JSON.stringify({id,date:new Date().toISOString(),note,files:[...originals.keys()].filter(f=>originals.get(f)!==null)},null,2));
    try {
      for (const [file,body] of Object.entries(files)) { const tmp=path.join(root,`${file}.admin-tmp`); fs.writeFileSync(tmp,body); fs.renameSync(tmp,path.join(root,file)); }
    } catch (error) {
      for (const [file,body] of originals) { if (body) fs.writeFileSync(path.join(root,file),body); else fs.rmSync(path.join(root,file),{force:true}); fs.rmSync(path.join(root,`${file}.admin-tmp`),{force:true}); }
      throw error;
    }
    return id;
  }
  function cacheFiles(files) {
    const version = `admin-${Date.now()}`;
    for (const html of HTML) if (fs.existsSync(path.join(root,html))) {
      files[html] = fs.readFileSync(path.join(root,html),'utf8').replace(/(assets\/js\/(?:site-data|page-content|image-manifest)\.js)(?:\?v=[^"']*)?/g, `$1?v=${version}`);
    }
    return files;
  }
  function state() { return { data:readAssignment(root,DATA,'portfolioData',{}), pages:readAssignment(root,PAGES,'portfolioPageContent',{}), revision:revision(root) }; }
  function json(res,status,value) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(value)); }
  async function body(req) {
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>145*1024*1024)throw new Error('文件太大，单次上传请小于 100 MB');chunks.push(chunk);}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  function assertRevision(value) { if (value !== revision(root)) { const e=new Error('文件已在其他窗口或编辑器中更新，请重新载入后再保存；当前草稿仍保留在浏览器中。'); e.status=409; throw e; } }
  function filesUnder(folder) {
    const result=[]; if(!fs.existsSync(folder))return result;
    for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
      if(entry.isSymbolicLink())continue;
      const full=path.join(folder,entry.name);
      if(entry.isDirectory()){if(entry.name!=='optimized')result.push(...filesUnder(full));}
      else if(['.jpg','.jpeg','.png','.webp','.gif','.avif','.svg','.pdf','.mp4'].includes(path.extname(entry.name).toLowerCase()))result.push({path:path.relative(root,full).replaceAll('\\','/'),bytes:fs.statSync(full).size});
    }return result;
  }
  function upload(payload) {
    const ext=path.extname(payload.name||'').toLowerCase();
    const allowed=['.jpg','.jpeg','.png','.webp','.gif','.avif','.pdf','.mp4'];
    if(!allowed.includes(ext))throw new Error('支持 JPG、PNG、WebP、GIF、AVIF、PDF 和 MP4；新 SVG 请先转换为 PNG');
    if(typeof payload.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(payload.data))throw new Error('上传数据无效');
    const bytes=Buffer.from(payload.data,'base64');
    if(!bytes.length||bytes.length>100*1024*1024)throw new Error('文件为空或超过 100 MB');
    const signature=bytes.subarray(0,16);
    const valid=ext==='.pdf'?signature.toString().startsWith('%PDF-'):ext==='.mp4'?signature.subarray(4,8).toString()==='ftyp':ext==='.png'?signature.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):['.jpg','.jpeg'].includes(ext)?signature[0]===255&&signature[1]===216:ext==='.webp'?signature.subarray(0,4).toString()==='RIFF'&&signature.subarray(8,12).toString()==='WEBP':ext==='.gif'?signature.toString().startsWith('GIF8'):signature.subarray(4,8).toString()==='ftyp';
    if(!valid)throw new Error('文件内容与扩展名不一致');
    const stem=(path.basename(payload.name,ext).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,60)||'media');
    const folder=ext==='.pdf'?'assets/pdfs/uploads':ext==='.mp4'?'assets/video/uploads':'assets/images/uploads';
    const relative=`${folder}/${stem}-${crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12)}${ext}`;
    fs.mkdirSync(path.join(root,folder),{recursive:true});fs.writeFileSync(path.join(root,relative),bytes);
    let warning;
    if (['.jpg','.jpeg','.png','.webp'].includes(ext) && fs.existsSync(path.join(root,'scripts/optimize-upload.py'))) {
      const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
      const python=fs.existsSync(bundled)?bundled:'python';
      const result=spawnSync(python,[path.join(root,'scripts/optimize-upload.py'),relative],{cwd:root,encoding:'utf8',timeout:60000,windowsHide:true});
      if(result.status!==0)warning='原图已上传；自动缩略图生成未完成，网站将使用原图。';
    }
    return {path:relative,bytes:bytes.length,warning};
  }
  const server=http.createServer(async(req,res)=>{
    const host=req.headers.host||'';
    if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)){res.writeHead(403);res.end('Local access only');return;}
    let url;
    try{url=new URL(req.url,`http://${host}`);}catch{res.writeHead(400);res.end();return;}
    const origin=req.headers.origin;
    if(origin&&origin!==`http://${host}`){json(res,403,{error:'跨站请求已阻止'});return;}
    try{
      if(url.pathname.startsWith('/api/')){
        if (req.method==='GET' && ['/api/preview-data.js','/api/preview-pages.js'].includes(url.pathname)) {
          if (!(req.headers.cookie||'').split(';').some(c=>c.trim()===`portfolio-admin=${token}`)) { json(res,403,{error:'仅后台预览可访问'}); return; }
          const content=preview||state();
          res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});
          res.end(url.pathname.includes('preview-data')?assignment('portfolioData',content.data)+'window.portfolioAdminPreview = true;\n':assignment('portfolioPageContent',content.pages));return;
        }
        if(req.headers['x-admin-token']!==token){json(res,403,{error:'请从本地后台页面操作'});return;}
        if(req.method==='GET'&&url.pathname==='/api/state'){json(res,200,state());return;}
        if(req.method==='GET'&&url.pathname==='/api/assets'){json(res,200,{items:[...filesUnder(path.join(root,'assets/images')),...filesUnder(path.join(root,'assets/pdfs')),...filesUnder(path.join(root,'assets/video'))]});return;}
        if(req.method==='GET'&&url.pathname==='/api/backups'){
          const items=fs.existsSync(backupsRoot)?fs.readdirSync(backupsRoot).sort().reverse().flatMap(id=>{try{return [JSON.parse(fs.readFileSync(path.join(backupsRoot,id,'backup.json'),'utf8'))];}catch{return [];}}):[];
          json(res,200,{items});return;
        }
        if(req.method!=='POST'){json(res,404,{error:'未找到接口'});return;}
        if(writing){json(res,409,{error:'正在保存，请稍后重试'});return;}
        writing=true;
        try{
          const payload=await body(req);
          if(url.pathname==='/api/preview'){validate(payload.data,payload.pages);preview={data:payload.data,pages:payload.pages};json(res,200,{ok:true});return;}
          if(url.pathname==='/api/upload'){json(res,200,upload(payload));return;}
          assertRevision(payload.revision);
          if(url.pathname==='/api/save'){
            validate(payload.data,payload.pages);
            const id=commitFiles(cacheFiles({[DATA]:assignment('portfolioData',payload.data),[PAGES]:assignment('portfolioPageContent',payload.pages)}),'保存网站内容');
            json(res,200,{...state(),backup:id});return;
          }
          if(url.pathname==='/api/restore'){
            if(!/^\d+-[a-f0-9]{6}$/.test(payload.id||''))throw new Error('备份编号无效');
            const dir=path.join(backupsRoot,payload.id),meta=JSON.parse(fs.readFileSync(path.join(dir,'backup.json'),'utf8'));
            const files={};for(const file of meta.files){if(![DATA,PAGES,...HTML].includes(file))throw new Error('备份文件不在允许范围');files[file]=fs.readFileSync(path.join(dir,file));}
            commitFiles(cacheFiles(files),'恢复备份前的自动备份');json(res,200,state());return;
          }
          json(res,404,{error:'未找到接口'});return;
        }finally{writing=false;}
      }
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
      let pathname=decodeURIComponent(url.pathname);
      if(pathname==='/')pathname='/admin/';
      if(pathname==='/admin/')pathname='/admin/index.html';
      if(!/^\/(?:admin\/|assets\/|index\.html$|project\.html$|cv\.html$|photography\.html$)/.test(pathname)||pathname.includes('\\')||pathname.split('/').some(p=>p==='..'||p.startsWith('.'))){res.writeHead(404);res.end();return;}
      const file=path.resolve(root,`.${pathname}`);
      if(!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
      const type=MIME[path.extname(file).toLowerCase()]||'application/octet-stream';
      if(pathname==='/admin/index.html'){
        const html=fs.readFileSync(file,'utf8').replace('__ADMIN_TOKEN__',token);
        res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Set-Cookie':`portfolio-admin=${token}; HttpOnly; SameSite=Strict; Path=/`,'X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"});res.end(html);return;
      }
      if (path.extname(file)==='.html' && url.searchParams.has('admin-preview')) {
        let html=fs.readFileSync(file,'utf8').replace(/assets\/js\/site-data\.js[^"']*/g,'/api/preview-data.js').replace(/assets\/js\/page-content\.js[^"']*/g,'/api/preview-pages.js');
        res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(html);return;
      }
      const stat=fs.statSync(file),headers={'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
      const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if(range){const begin=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;if(begin>end||begin>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${begin}-${end}/${stat.size}`,'Content-Length':end-begin+1});if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start:begin,end}).pipe(res);}
      else{res.writeHead(200,{...headers,'Content-Length':stat.size});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);}
    }catch(error){json(res,error.status||400,{error:error.message||'操作失败'});}
  });
  return {server,token,root,port,state};
}
if(require.main===module){
  const port=Number(process.env.PORT||5174),app=createAdminServer({port});
  app.server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`端口 ${port} 已被占用，请打开现有后台或设置 PORT 使用其他端口。`:error.message);process.exitCode=1;});
  app.server.listen(port,'127.0.0.1',()=>console.log(`Portfolio admin: http://127.0.0.1:${port}/admin/\n仅本机可访问；保存不会自动发布到 GitHub。`));
}
module.exports={createAdminServer,validate,safeURL};
