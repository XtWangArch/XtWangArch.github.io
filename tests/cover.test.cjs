const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/cover.js'), 'utf8');

function coverHarness({ reduced = false, mobile = false, saveData = false, hash = '', initiallyVisible = false, blocked = false } = {}) {
  const attributes = new Map();
  const callbacks = {};
  const events = {};
  const frames = new Map();
  const icons = {};
  const draws = { count: 0, positions: [] };
  const timers = new Map();
  const heroEvents = {};
  let viewVisible = initiallyVisible;
  let elapsed = 0;
  let nextFrame = 0;
  const motion = { matches: reduced, addEventListener(type, callback) { callbacks.motion = callback; } };
  const compact = { matches: mobile, addEventListener() {} };
  const video = {
    paused: true,
    allowed: !blocked,
    dataset: { desktopSrc: 'assets/video/cover-desktop.mp4', mobileSrc: 'assets/video/cover-mobile.mp4' },
    getAttribute: key => attributes.get(key),
    set src(value) { attributes.set('src', value); },
    pause() { this.paused = true; },
    play() {
      if (!this.allowed) return Promise.reject({ name: 'NotAllowedError' });
      this.paused = false;
      return Promise.resolve();
    },
    addEventListener(type, callback) { events[type] = callback; }
  };
  const canvas = { getContext: () => ({
    clearRect() { draws.count++; draws.positions = []; }, setTransform() {}, beginPath() {}, moveTo() {},
    arc(x, y) { draws.positions.push({ x, y }); }, fill() {}
  }) };
  const control = {
    hidden: true,
    setAttribute: (key, value) => attributes.set(key, value),
    querySelector: selector => ({ toggleAttribute(key, hidden) { icons[selector] = hidden; } }),
    addEventListener(type, callback) { callbacks.click = callback; }
  };
  const cover = {
    querySelector: selector => selector === 'video' ? video : canvas,
    getBoundingClientRect: () => ({ left: 0, top: viewVisible ? 0 : -900, bottom: viewVisible ? 900 : 0, width: mobile ? 393 : 1440, height: 900 }),
    classList: { add() {}, remove() {} }
  };
  const classes = new Set();
  const hero = {
    querySelector: selector => selector === '.hero-cover' ? cover : control,
    classList: {
      toggle(name, value) { value ? classes.add(name) : classes.delete(name); },
      remove: name => classes.delete(name)
    },
    addEventListener(type, callback) { heroEvents[type] = callback; }
  };
  const document = {
    hidden: false,
    querySelector: () => hero,
    addEventListener(type, callback) { callbacks[type] = callback; }
  };
  const window = {
    location: { hash },
    innerHeight: 900,
    devicePixelRatio: 2,
    matchMedia: query => query.includes('reduced-motion') ? motion : compact,
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout(callback) { timers.set(++nextFrame, callback); return nextFrame; },
    clearTimeout: id => timers.delete(id),
    addEventListener(type, callback) { callbacks[type] = callback; }
  };
  const context = {
    document, window, navigator: { connection: { saveData } },
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class {
      constructor(callback) { callbacks.intersection = callback; }
      observe() {}
    }
  };
  vm.runInNewContext(source, context);
  callbacks.DOMContentLoaded();
  return {
    video, canvas, control, frames, motion, callbacks, draws, icons, document, classes, heroEvents,
    show(visible) {
      viewVisible = visible;
      callbacks.intersection([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
    },
    finishInitialScroll() { for (const callback of [...timers.values()]) callback(); },
    tick() {
      elapsed += 34;
      const scheduled = [...frames.values()];
      frames.clear();
      for (const callback of scheduled) callback(elapsed);
    }
  };
}

test('cover media files exist and playback script is loaded', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /assets\/js\/cover\.js/);
  for (const name of ['cover-desktop.mp4', 'cover-mobile.mp4', 'cover-poster.jpg']) {
    assert.ok(fs.statSync(path.join(root, 'assets/video', name)).size > 0);
    assert.ok(html.includes(`assets/video/${name}`));
  }
  assert.ok(!html.includes('site cover video.mp4'));
});

test('video loads only when the cover is visible and stops when it leaves', () => {
  const h = coverHarness();
  assert.equal(h.video.getAttribute('src'), undefined);
  h.show(true);
  assert.equal(h.video.getAttribute('src'), 'assets/video/cover-desktop.mp4');
  assert.equal(h.video.paused, false);
  assert.equal(h.frames.size, 1);
  h.show(false);
  assert.equal(h.video.paused, true);
  assert.equal(h.frames.size, 0);
});

test('mobile uses its smaller video and bounded canvas resolution', () => {
  const h = coverHarness({ mobile: true });
  h.show(true);
  assert.equal(h.video.getAttribute('src'), 'assets/video/cover-mobile.mp4');
  assert.equal(h.canvas.width, Math.round(393 * 1.25));
});

test('fragment navigation never downloads video during its initial scroll', () => {
  const h = coverHarness({ hash: '#profile-intro' });
  h.show(true);
  assert.equal(h.video.getAttribute('src'), undefined);
  h.show(false);
  h.show(true);
  assert.equal(h.video.getAttribute('src'), 'assets/video/cover-desktop.mp4');
});

test('visible cover starts even if a stale Profile hash is retained', () => {
  const h = coverHarness({ hash: '#profile-intro', initiallyVisible: true });
  assert.equal(h.video.getAttribute('src'), undefined);
  h.finishInitialScroll();
  assert.equal(h.video.getAttribute('src'), 'assets/video/cover-desktop.mp4');
  assert.equal(h.video.paused, false);
});

test('fresh cover starts immediately without waiting for an intersection callback', () => {
  const h = coverHarness({ initiallyVisible: true });
  assert.equal(h.video.paused, false);
  assert.equal(h.video.defaultMuted, true);
  assert.equal(h.video.playsInline, true);
  assert.ok(h.classes.has('is-cover-animating'));
});

test('cover navigation is never intercepted to require click-to-play', async () => {
  const h = coverHarness({ initiallyVisible: true, blocked: true });
  await new Promise(setImmediate);
  assert.equal(h.control.hidden, false);
  assert.equal(h.heroEvents.click, undefined);
});

test('pointer repels nearby dots and springs recover after leaving', () => {
  const h = coverHarness({ initiallyVisible: true });
  const index = 10 * 49 + 10;
  for (let i = 0; i < 10; i++) h.tick();
  const initial = h.draws.positions[index];
  h.heroEvents.pointermove({ clientX: 300, clientY: 300, pointerType: 'mouse' });
  for (let i = 0; i < 16; i++) h.tick();
  const pushed = h.draws.positions[index];
  assert.ok(Math.hypot(pushed.x - initial.x, pushed.y - initial.y) > 15);
  h.heroEvents.pointerleave();
  for (let i = 0; i < 120; i++) h.tick();
  const settled = h.draws.positions[index];
  assert.ok(Math.hypot(settled.x - initial.x, settled.y - initial.y) < 10);
});

test('user pause stops both layers and remains paused after returning', () => {
  const h = coverHarness();
  h.show(true);
  h.callbacks.click();
  assert.equal(h.video.paused, true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.icons['.cover-pause-icon'], true);
  assert.equal(h.icons['.cover-play-icon'], false);
  h.show(false);
  h.show(true);
  assert.equal(h.video.paused, true);
});

test('reduced motion and data saver do not download an autoplay video', () => {
  for (const preferences of [{ reduced: true }, { saveData: true }]) {
    const h = coverHarness(preferences);
    h.show(true);
    assert.equal(h.video.getAttribute('src'), undefined);
    assert.equal(h.video.paused, true);
    assert.equal(h.frames.size, 0);
    assert.ok(h.draws.count > 0);
  }
});

test('hidden pages suspend all cover playback', () => {
  const h = coverHarness();
  h.show(true);
  h.document.hidden = true;
  h.callbacks.visibilitychange();
  assert.equal(h.video.paused, true);
  assert.equal(h.frames.size, 0);
});
