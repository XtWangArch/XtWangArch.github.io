const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {validate} = require('../scripts/admin-server.cjs');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/photography.js'), 'utf8');
function model(data = {}) {
  const context = {window:{portfolioData:data,portfolioText:{escape:String}},document:{addEventListener(){}}};
  vm.runInNewContext(source, context);
  return context.window.photographyModel;
}

test('album directories stop at the bottom and use explicit footer navigation', () => {
  assert.doesNotMatch(source,/createBottomGuard|bottomGuard/);
  assert.match(source,/albumDirectory && direction > 0/);
  assert.match(source,/direction < 0 && !slide && !nextView/);
  assert.match(source,/aria-label="Photography and film collections, bottom"/);
  assert.match(source,/Go to Architecture Portfolio/);
  assert.match(source,/href="index.html#selected-works"/);
  assert.match(source,/querySelectorAll\('\.photo-tabs'\)/);
  assert.match(source,/location.hash !== '#photography-works'/);
});
test('photography keeps the uploaded order and never inserts the cover into the gallery', () => {
  const m = model(), item = {id:'test',cover:'cover.jpg',gallery:[{image:'second.jpg'},{image:'first.jpg'}]};
  assert.deepEqual(Array.from(m.photos(item), x=>x.image), ['second.jpg','first.jpg']);
  assert.equal(m.cover(item), 'cover.jpg');
  assert.equal(m.cover({...item,cover:''}), 'second.jpg');
  assert.equal(m.photos({gallery:[]}).length, 0);
});
test('collection detail and return links identify the correct collection and directory', () => {
  const m = model(), item={id:'paris',kind:'elsewhere'};
  assert.equal(m.detailURL(item),'photography.html?collection=paris');
  assert.equal(m.returnURL(item),'index.html?photo=paris&photo-view=journey#photography-works');
  assert.equal(m.returnURL({id:'mountains',kind:'landscape'}),'index.html?photo=mountains&photo-view=landscape#photography-works');
  assert.equal(m.returnURL({id:'buildings',kind:'architecture'}),'index.html?photo=buildings&photo-view=architecture#photography-works');
});

test('each contact-sheet photograph has its own album position without changing album-level links', () => {
  const m=model(), item={id:'album & one',gallery:[{image:'one.jpg'},{image:'two.jpg'}]};
  assert.equal(m.detailURL(item),'photography.html?collection=album%20%26%20one');
  assert.equal(m.detailURL(item,0),'photography.html?collection=album%20%26%20one#photo-1');
  assert.equal(m.detailURL(item,1),'photography.html?collection=album%20%26%20one#photo-2');
  assert.equal(m.detailURL(item,-1),m.detailURL(item));
  assert.match(source,/detailURL\(place, i\)/);
  assert.match(source,/id="photo-\$\{i \+ 1\}"/);
});

test('requested photographs use valid integer positions and clamp to the available album', () => {
  const m=model();
  assert.equal(m.entryIndex('#photo-3',5),2);
  assert.equal(m.entryIndex('#photo-999',5),4);
  for(const hash of ['', '#photo-0','#photo--2','#photo-1.5','#photo-Infinity','#photo-999999999999999999999']) assert.equal(m.entryIndex(hash,5),0,hash);
  assert.match(source,/controller.signal.aborted \|\| location.hash !== entryHash/);
});
test('photography schema rejects duplicate IDs, invalid categories, galleries and unsafe media', () => {
  const item={id:'test',kind:'commercial',title:'Test',gallery:[]};
  const data={projects:[],photoCollections:[item]};
  assert.doesNotThrow(()=>validate(data,{}));
  for(const changes of [{kind:'other'},{gallery:null},{title:''},{id:'../escape'},{cover:'javascript:alert(1)'},{spotifyUrl:'javascript:alert(1)'},{gallery:[{image:'bad.jpg'}]}]) {
    assert.throws(()=>validate({...data,photoCollections:[{...item,...changes}]},{}));
  }
  assert.throws(()=>validate({...data,photoCollections:[item,item]},{}));
  assert.throws(()=>validate({...data,photoSettings:{interval:0}},{}));
  assert.doesNotThrow(()=>validate({...data,photoSettings:{interval:6000}},{}));
  for (const kind of ['journey','landscape','architecture','elsewhere']) assert.doesNotThrow(()=>validate({...data,photoCollections:[{...item,kind}]},{}));
});

test('the artist collection keeps an editable Spotify album link without replacing its portfolio detail route', () => {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/site-data.js'),'utf8'),context);
  const artist=context.window.portfolioData.photoCollections.find(p=>p.id==='artist');
  assert.ok(artist.title.trim().length > 0);
  assert.equal(new URL(artist.spotifyUrl).pathname,'/album/0lCbhj1cLVzXQ14lMkxKRB');
  assert.equal(model().detailURL(artist),'photography.html?collection=artist');
  assert.match(source,/class="text-link photo-album-link"[^>]+target="_blank" rel="noreferrer">Listen on Spotify/);
  assert.equal((source.match(/\$\{albumLink\}/g)||[]).length,2);
  assert.match(fs.readFileSync(path.join(root,'admin/admin.js'),'utf8'),/\[\.\.\.base,'spotifyUrl'\]/);
});

test('Commercial Details follows the fixed image stage and animates its triangle without resizing photos', () => {
  const css=fs.readFileSync(path.join(root,'assets/css/photography.css'),'utf8');
  assert.doesNotMatch(css,/:has\(details\[open\]\)/);
  assert.match(css,/\.photo-commercial-gallery \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css,/\.photo-commercial > \*, \.photo-commercial-gallery > \* \{ min-width: 0; \}/);
  assert.doesNotMatch(css,/--photo-details-space|\.photo-details-panel \{[^}]*position: absolute/);
  assert.match(source,/<\/section>\$\{detailsMarkup\}\$\{footer\}/);
  assert.match(css,/\.photo-details-chevron \{[^}]*transition: transform 400ms/);
  assert.match(css,/\.photo-details.is-expanded \.photo-details-chevron \{ transform: rotate\(90deg\)/);
  assert.match(source,/function setupCommercialDetails\(root\)/);
  assert.match(source,/root.classList.toggle\('photo-commercial', !isJourney\)/);
  assert.match(source,/panel.animate\(\[start, expanded/);
  assert.match(source,/height: `\$\{panel.scrollHeight\}px`/);
  assert.match(source,/if \(transition !== animation\) return/);
  assert.match(source,/if \(reduced\(\) \|\| !panel.animate\)/);
  assert.doesNotMatch(source,/Math.abs\(event.deltaX\) > Math.abs\(event.deltaY\) \|\| root.querySelector\('details\[open\]'\)/);
});

test('photography CMS can move a picture to the beginning without changing its independent cover', () => {
  const admin=fs.readFileSync(path.join(root,'admin/admin.js'),'utf8');
  assert.match(admin,/command\('gallery-top','置顶照片','arrow-up-to-line'/);
  assert.match(admin,/i===0\?'disabled':''/);
  assert.match(admin,/i<=0\|\|i>=p.gallery.length/);
  assert.match(admin,/p.gallery.unshift\(p.gallery.splice\(i,1\)\[0\]\)/);
  const action=admin.match(/else if\(a==='gallery-top'\)\{[\s\S]*?\n    \}/)[0];
  assert.doesNotMatch(action,/p.cover\s*=/);
});

test('Commercial images keep persistent previous/next buttons beside the photo', () => {
  const css=fs.readFileSync(path.join(root,'assets/css/photography.css'),'utf8');
  assert.match(source,/<div class="photo-detail-viewer">\$\{command\('previous'[\s\S]*?<div class="photo-detail-image"><\/div><div class="photo-next-slot">\$\{command\('next'/);
  assert.match(source,/const mount = root.querySelector\('\.photo-detail-image'\)/);
  assert.match(css,/grid-template-columns: 44px minmax\(0, 1fr\) 44px/);
  assert.match(source,/\.disabled = current === 0/);
  assert.match(source,/nextButton.disabled = isLast/);
});

test('last photograph offers the next published Commercial project in portfolio order', () => {
  const projects=[{id:'one',kind:'commercial'},{id:'hidden',kind:'commercial',published:false},{id:'journey',kind:'journey'},{id:'two',kind:'commercial'}];
  const m=model({photoCollections:projects});
  assert.equal(m.nextCommercialProject(projects[0]).id,'two');
  assert.equal(m.nextCommercialProject(projects[3]).id,'one');
  assert.equal(m.nextCommercialProject({id:'missing'}),null);
  assert.equal(model({photoCollections:[projects[0]]}).nextCommercialProject(projects[0]),null);
  assert.match(source,/nextButton.hidden = isLast && !!nextProject/);
  assert.match(source,/if \(projectLink\) projectLink.hidden = !isLast/);
  assert.match(source,/if \(focusedNext\) \(nextButton.hidden \? projectLink : nextButton\).focus/);
  const css=fs.readFileSync(path.join(root,'assets/css/photography.css'),'utf8');
  assert.match(css,/\.photo-next-slot > \[hidden\] \{ display: none; \}/);
});

test('album footer follows its own category, skips hidden albums and wraps at the end', () => {
  const albums=[{id:'china',kind:'journey'},{id:'hidden',kind:'journey',published:false},{id:'mountains',kind:'landscape'},{id:'japan',kind:'elsewhere'},{id:'norway',kind:'landscape'},{id:'buildings',kind:'architecture'}];
  const m=model({photoCollections:albums});
  assert.equal(m.nextAlbum(albums[0]).id,'japan');
  assert.equal(m.nextAlbum(albums[3]).id,'china');
  assert.equal(m.nextAlbum(albums[2]).id,'norway');
  assert.equal(m.nextAlbum(albums[4]).id,'mountains');
  assert.equal(m.nextAlbum(albums[5]),null);
  assert.equal(m.nextAlbum({id:'missing',kind:'journey'}),null);
  assert.match(source,/class="button photo-next-album" href="\$\{detailURL\(followingAlbum\)\}"/);
});

test('automatic rotation permits pointer hover but respects explicit pause, keyboard focus and hidden views', () => {
  const m=model(), base={view:'commercial',visible:true};
  assert.equal(m.rotationAllowed(base),true);
  for (const key of ['paused','reducedMotion','hidden','keyboardFocus','portalBusy']) assert.equal(m.rotationAllowed({...base,[key]:true}),false);
  assert.equal(m.rotationAllowed({...base,visible:false}),false);
  assert.equal(m.rotationAllowed({...base,view:'journey'}),false);
  assert.equal(m.rotationAllowed({...base,view:'landscape'}),false);
  assert.equal(m.rotationAllowed({...base,view:'architecture'}),false);
  assert.doesNotMatch(source,/hovering \|\|/);
});

test('Architecture photography has a directory, editable label and CMS collection controls', () => {
  assert.equal(model().category({kind:'architecture'}),'architecture');
  assert.match(source,/architecture: collections.filter\(item => category\(item\) === 'architecture'\)/);
  assert.match(source,/\['commercial', 'film', 'journey', 'landscape', 'architecture'\].includes\(view\)/);
  assert.equal((source.match(/architecture: settings.architectureLabel \|\| 'Architecture'/g)||[]).length,2);
  const admin=fs.readFileSync(path.join(root,'admin/admin.js'),'utf8');
  assert.match(admin,/data-action="add-collection" data-kind="architecture"/);
  assert.match(admin,/<option value="architecture">Architecture/);
  assert.match(admin,/\['architecture','Architecture/);
  assert.match(admin,/photoSettings','architectureLabel'/);
});

test('photography categories have shared album logic and their own wheel boundary before homepage snapping', () => {
  assert.equal(model().category({kind:'elsewhere'}),'journey');
  assert.equal(model().category({kind:'landscape'}),'landscape');
  const main=fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'assets/css/photography.css'),'utf8');
  assert.match(main,/window.photographyDirectory\?\.handleWheel\(event\)/);
  assert.match(source,/const nextView = order\[index \+ direction\]/);
  assert.match(source,/root.addEventListener\('touchmove'/);
  assert.match(source,/touchGesture.consumed = true/);
  assert.match(source,/isJourney = category\(item\) !== 'commercial'/);
  assert.match(source,/photo-dot-active/);
  assert.match(css,/photo-tab-marker/);
  assert.match(css,/transition: transform 650ms var\(--photo-ease\)/);
});
test('photography has a dedicated gallery, accessible controls and reduced-motion handling', () => {
  const html=fs.readFileSync(path.join(root,'photography.html'),'utf8');
  assert.match(html,/id="photo-gallery"/);
  assert.doesNotMatch(html,/http-equiv="refresh"/);
  assert.match(source,/dialog\.showModal\(\)/);
  assert.match(source,/dialog\.addEventListener\('cancel'/);
  assert.match(source,/reduced\(\)/);
  assert.match(source,/aria-label="Show/);
  assert.match(source,/event\.stopPropagation\(\)/);
});

test('category underline follows actual label bounds and late font-size changes', () => {
  assert.match(source,/\(label.left - bar.left\) \/ scale/);
  assert.match(source,/label.width \/ scale/);
  assert.match(source,/marker.style.width = `\$\{width\}px`/);
  assert.doesNotMatch(source,/scaleX\(\$\{scale\}\)/);
  assert.match(source,/if \(label.width > 0\)/);
  assert.match(source,/markerObserver.observe\(button\)/);
  assert.match(source,/addEventListener\('loadingdone'/);
  assert.doesNotMatch(source,/photo-tab-marker'\), tab.offsetLeft/);
  assert.match(source,/measure\(!entries.some/);
});

test('Film follows Commercial, shares existing video content and has a channel link', () => {
  assert.match(source,/commercial: settings.commercialLabel[^\n]+film: settings.filmLabel/);
  assert.match(source,/view === 'film'/);
  assert.match(source,/data.videos\?\.featured, \.\.\.\(data.videos\?\.items/);
  assert.match(source,/href="\$\{esc\(data.links.youtube\)\}"[^>]+>Other Work/);
  assert.match(source,/referrerpolicy="strict-origin-when-cross-origin" allowfullscreen/);
  const main=fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8');
  assert.match(main,/querySelector\('#other-work'\).hidden = isPhoto/);
  assert.match(main,/link.hidden = isPhoto/);
  assert.match(main,/data.photography\?\.\[0\]\?\.image/);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(html,/id="(?:photo-wall|video-feature|video-cards)"/);
  assert.match(html,/Photography &amp; Film Making/);
  const admin=fs.readFileSync(path.join(root,'admin/admin.js'),'utf8');
  assert.match(admin,/photoSettings','filmLabel'/);
});

test('desktop Film contains iframe wheel scrolling without moving the document', () => {
  const css=fs.readFileSync(path.join(root,'assets/css/photography.css'),'utf8');
  assert.match(css,/--film-row-space: calc\(100svh/);
  assert.match(source,/Math.ceil\(videos.length \/ 2\)/);
  assert.match(source,/surface.addEventListener\('scroll'/);
  assert.match(source,/centerFilmWheelSurface\(\)/);
  assert.match(source,/switchView\(offset > 0 \? 'journey' : 'commercial'\)/);
  assert.match(css,/overscroll-behavior: contain/);
  assert.match(css,/photo-film-content \{ position: sticky; top: 0/);
  assert.match(css,/photo-film-scroll-track \{ height: calc\(100% \+ 8px\)/);
  assert.doesNotMatch(source,/watchNativeFilmScroll|filmSnapArmed/);
  assert.match(source,/innerWidth <= 980 \|\| !root.getClientRects/);
});

test('Film players reveal in capped sequential order and respect reduced motion', () => {
  const css=fs.readFileSync(path.join(root,'assets/css/photography.css'),'utf8');
  assert.match(source,/video-frame photo-film-enter/);
  assert.match(source,/--film-order: \$\{Math.min\(index, 4\)\}/);
  assert.match(css,/photo-film-enter \{ animation: photo-enter 350ms cubic-bezier\(0.16, 1, 0.3, 1\) both/);
  assert.match(css,/animation-delay: calc\(var\(--film-order, 0\) \* 70ms\)/);
  assert.doesNotMatch(source,/filmEntrance|previousReady|setTimeout\(finish, 2000\)/);
  assert.doesNotMatch(css,/photo-film-enter[^}]*paused/);
  assert.match(source,/loading="eager" allow="accelerometer/);
  assert.match(source,/duration: filmTransition \? 100 : 220/);
  assert.match(source,/!reduced\(\) && view !== 'film'/);
  assert.match(css,/prefers-reduced-motion: reduce[\s\S]*\.photo-enter, \.photo-film-enter, \.photo-next-project \{ animation: none/);
});
