const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function harness(reduced = false, hovered = false, withHeader = false) {
  const frames = [];
  const overlays = [];
  const listeners = new Map();
  const classes = new Set();
  const state = { navigated: null, animations: [], events: [] };
  const style = () => ({ overflow: '', scrollBehavior: '', setProperty(key, value) { this[key] = value; } });
  const header = {
    color: 'white',
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 74 }),
    cloneNode: () => ({ style: style(), querySelectorAll: () => [], removeAttribute() {} })
  };
  const chooser = {
    inert: false,
    getBoundingClientRect: () => ({ top: 0, left: 132, width: 1176, height: 900 }),
    cloneNode: () => ({ style: style(), removeAttribute() {}, querySelectorAll: () => [] })
  };
  const link = {
    href: 'https://example.test/photography.html',
    dataset: { portfolio: 'photography' },
    closest: () => chooser,
    matches: () => hovered,
    querySelector: () => ({ getBoundingClientRect: () => ({ left: 245, top: 340, width: 210, height: 210 }) }),
    getBoundingClientRect: () => ({ left: 250, top: 420, width: 200, height: 60 }),
    setAttribute() {}, removeAttribute() {}
  };
  const document = {
    querySelector: () => withHeader ? header : null,
    documentElement: { style: style() },
    body: { append(node) { overlays.push(node); }, classList: { add: key => classes.add(key), remove: key => classes.delete(key) } },
    createElement: () => ({
      style: style(), classList: { add() {} }, setAttribute() {}, children: [], append(node) { this.children.push(node); },
      remove() { this.removed = true; },
      animate(keyframes, options) { state.animations.push(options); return { finished: Promise.resolve() }; }
    })
  };
  const window = {
    portfolioUI: { reducedMotion: () => reduced },
    setTimeout: callback => queueMicrotask(callback),
    addEventListener: (name, callback) => listeners.set(name, callback),
    dispatchEvent: event => { state.events.push(event.type); if (event.type === 'portfolio-navigation-prepare') header.color = 'black'; },
    removeEventListener: name => listeners.delete(name),
    location: { assign: href => { state.navigated = href; } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/portfolio-portal.js'), 'utf8'), {
    window, document, innerWidth: 1440, innerHeight: 900, performance: { now: () => 0 },
    requestAnimationFrame: callback => frames.push(callback),
    getComputedStyle: element => ({ backgroundImage: 'url("cover.jpg")', backgroundColor: 'white', opacity: '.8', getPropertyValue: key => key === 'color' ? element.color : '' }),
    Event: class Event { constructor(type) { this.type = type; } }
  });
  return { portal: window.portfolioPortal, link, chooser, document, frames, overlays, listeners, classes, state };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('portal reveals from the chosen label and restores input after expansion', async () => {
  const h = harness();
  let prepared = false, completed = false;
  const done = h.portal.reveal(h.link, async () => { prepared = true; }, () => { completed = true; });
  assert.equal(h.portal.busy, true);
  assert.equal(h.chooser.inert, true);
  assert.equal(h.document.documentElement.style.overflow, '');
  let scrollBlocked = false;
  h.listeners.get('wheel')({ preventDefault() { scrollBlocked = true; } });
  assert.equal(scrollBlocked, true);
  let clickBlocked = false, clickStopped = false;
  h.listeners.get('click')({ preventDefault() { clickBlocked = true; }, stopImmediatePropagation() { clickStopped = true; } });
  assert.equal(clickBlocked && clickStopped, true);
  await flush();
  assert.equal(prepared, true);
  assert.equal(completed, false);
  const overlay = h.overlays[0];
  assert.equal(overlay.style['--portal-x'], '350px');
  assert.equal(overlay.style['--portal-y'], '450px');
  h.frames.shift()(525);
  const halfway = parseFloat(overlay.style['--portal-radius']);
  assert.ok(halfway > 0 && halfway < 1200);
  h.frames.shift()(1050);
  await done;
  assert.equal(completed, true);
  assert.equal(h.portal.busy, false);
  assert.equal(h.chooser.inert, false);
  assert.equal(h.document.documentElement.style.overflow, '');
  assert.equal(h.listeners.size, 0);
  assert.equal(overlay.removed, true);
  assert.deepEqual(h.state.events, ['portfolio-navigation-prepare', 'portfolio-navigation-reveal', 'portfolio-navigation-finish']);
});

test('repeated clicks cannot start concurrent navigation', async () => {
  const h = harness(true);
  let preparations = 0;
  const first = h.portal.reveal(h.link, async () => { preparations++; }, () => {});
  await h.portal.reveal(h.link, async () => { preparations++; }, () => {});
  await first;
  assert.equal(preparations, 1);
  assert.equal(h.overlays.length, 1);
});

test('Other Work reuses the radial portal with a paper source rather than the red chooser', async () => {
  const h = harness(true, false, true);
  const added = [];
  h.link.dataset.portfolioTransition = 'cross';
  h.link.closest = selector => selector === '.portfolio-entry' ? h.chooser : null;
  h.chooser.cloneNode = () => ({ style: {}, classList: { add: name => added.push(name) }, removeAttribute() {}, querySelectorAll: () => [] });
  h.document.querySelectorAll = () => [];
  await h.portal.reveal(h.link, async () => {}, () => {});
  const outgoing = h.overlays[0].children[0];
  assert.equal(outgoing.style.background, 'var(--paper)');
  assert.deepEqual(added, ['portfolio-portal-source']);
  assert.equal(outgoing.children.length, 1);
  assert.equal(h.chooser.inert, false);
  assert.equal(h.portal.busy, false);
});

test('Architecture Other Work has one photography portfolio entry and no duplicate media sections', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const section = html.match(/<section id="other-work"[\s\S]*?<\/section>/)[0];
  assert.equal((section.match(/<a /g) || []).length, 1);
  assert.match(section, /data-portfolio-transition="cross"/);
  assert.match(section, /href="#photography-works"/);
  assert.doesNotMatch(section, /iframe|photo-wall|video-cards|videography-title|photography-title/);
  const main = fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8');
  assert.match(main, /querySelectorAll\("\.portfolio-choice-link\[data-portfolio\]"\)/);
  assert.match(main, /initialTarget.id !== "other-work"/);
  assert.match(main, /target.id === "other-work"\) selectBranch\(false\)/);
  assert.match(main, /const progressLinks = \[\.\.\.document.querySelector\('\.section-rail'\).querySelectorAll\('\[data-section-link\]'\)\]/);
  assert.match(main, /progressLinks.filter\(link => !link.hidden\).forEach/);
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/portfolio-entry.css'), 'utf8');
  assert.match(css, /\.portfolio-entry \.portfolio-choice-link \.portfolio-choice-preview\s*\{[^}]*opacity: 1;[^}]*transform: translate\(-50%, -50%\) scale\(\.96\)/);
  const portal = fs.readFileSync(path.join(__dirname, '../assets/js/portfolio-portal.js'), 'utf8');
  assert.match(portal, /\(hovered \|\| crossEntry\) && previewCircle/);
});

test('outgoing header freezes before preparation and shares the outgoing radial mask', async () => {
  const h = harness(true, false, true);
  const done = h.portal.reveal(h.link, async () => {}, () => {});
  const outgoing = h.overlays[0].children[0];
  assert.equal(outgoing.children.length, 2);
  const header = outgoing.children[1];
  assert.equal(header.className, 'portfolio-portal-header');
  assert.equal(header.style.color, 'white');
  assert.equal(header.style.visibility, 'visible');
  assert.equal(header.style.opacity, '1');
  assert.equal(header.inert, true);
  await done;
});

test('incoming content is prepared beneath the mask rather than first appearing after it', () => {
  const main = fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8');
  const photo = fs.readFileSync(path.join(__dirname, '../assets/js/photography.js'), 'utf8');
  assert.match(main, /classList.add\("is-visible"\)[\s\S]*focusTarget.focus\(\{ preventScroll: true \}\)[\s\S]*image.decode\(\)/);
  assert.match(main, /const ready = window.photographyDirectory\?\.reset\(\);\s+enterArchitecture\(photography\);\s+await ready/);
  assert.match(photo, /return Promise.resolve\(ready\).then\(\(\) => featureAnimations.forEach\(animation => animation.finish\(\)\)\)/);
});

test('hover preview persists inside the expanding circle and crossfades to the destination', async () => {
  const h = harness(false, true);
  const done = h.portal.reveal(h.link, async () => {}, () => {});
  const overlay = h.overlays[0];
  assert.equal(overlay.children[0].className, 'portfolio-portal-outgoing');
  assert.equal(overlay.children[1].className, 'portfolio-portal-preview');
  assert.equal(overlay.children[1].style.backgroundImage, 'url("cover.jpg")');
  assert.equal(overlay.style['--portal-radius'], '105px');
  assert.equal(overlay.style['--portal-preview-opacity'], '.8');
  await flush();
  h.frames.shift()(325);
  assert.ok(Number(overlay.style['--portal-preview-opacity']) > 0);
  assert.ok(Number(overlay.style['--portal-preview-opacity']) < .8);
  assert.ok(Number(overlay.style['--portal-preview-scale']) > 1);
  h.frames.shift()(1050);
  await done;
  assert.equal(Number(overlay.style['--portal-preview-opacity']), 0);
});

test('first works entry reserves space on tall screens without changing project centering', () => {
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/styles.css'), 'utf8');
  assert.match(source, /current \+ pageTop\(works\) - snapTop\(first\)/);
  assert.match(source, /const navigationTop = \(target\) => \{\s+if .*alignWorksEntry\(\)/);
  assert.match(css, /#selected-works\s*\{\s*padding-top: calc\(var\(--header-height\) \+ 22px \+ var\(--works-entry-space, 0px\)\)/);
});

test('reduced motion replaces radial expansion with a short opacity fade', async () => {
  const h = harness(true);
  await h.portal.reveal(h.link, async () => {}, () => {});
  assert.equal(h.frames.length, 0);
  assert.equal(h.state.animations[0].duration, 120);
  assert.equal(h.portal.busy, false);
});

test('failed destination preparation preserves native navigation and clears locks', async () => {
  const h = harness();
  await h.portal.reveal(h.link, async () => { throw new Error('offline'); }, () => assert.fail('must not complete'));
  assert.equal(h.state.navigated, h.link.href);
  assert.equal(h.portal.busy, false);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.document.documentElement.style.overflow, '');
});

test('selector follows Profile and opens Photography inside the scrolling Works section', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const photo = fs.readFileSync(path.join(__dirname, '../photography.html'), 'utf8');
  assert.ok(html.indexOf('id="profile-intro"') < html.indexOf('id="portfolios"'));
  assert.ok(html.indexOf('id="portfolios"') < html.indexOf('id="architecture-portfolio"'));
  assert.match(html, /href="#photography-works" data-portfolio="photography"/);
  assert.match(html, /id="photography-works"[^>]*data-snap-stop/);
  assert.match(photo, /href="index.html#photography-works"/);
  assert.match(photo, /id="photo-gallery"/);
  assert.doesNotMatch(photo, /http-equiv="refresh"/);
});

test('Portfolio has its own numbered navigation step and portrait caption', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(html, /data-section-link="portfolios"><span>02<\/span>Portfolio/);
  assert.match(html, /data-section-link="selected-works"><span>03<\/span>Works/);
  assert.match(html, /class="portfolio-portrait"/);
  assert.match(html, /there are double sides of me/);
  assert.doesNotMatch(html, /Which portfolio would you like to see/);
});

test('portrait journey hides the source frame as well as its image during transit', () => {
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8');
  assert.match(source, /sourceFrame\.style\.visibility = moving \? "hidden" : ""/);
  assert.doesNotMatch(source, /source\.style\.visibility = moving/);
});
