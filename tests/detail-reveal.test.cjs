const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/detail-reveal.js'), 'utf8');

function setup(reduced = false) {
  const targets = Array.from({ length: 3 }, () => ({
    attributes: {}, styles: {}, visible: false,
    setAttribute(key, value) { this.attributes[key] = value; },
    style: { setProperty(key, value) { this.owner.styles[key] = value; } },
    classList: { add() { this.owner.visible = true; } }
  }));
  targets.forEach(item => { item.style.owner = item; item.classList.owner = item; });
  let intersect, focused, changed;
  const preference = { matches: reduced, addEventListener(_, handler) { changed = handler; } };
  class Observer {
    constructor(callback) { intersect = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const window = { portfolioUI: {}, IntersectionObserver: Observer };
  vm.runInNewContext(source, { window, IntersectionObserver: Observer,
    performance: { now: () => 100 }, matchMedia: () => preference,
    document: { querySelectorAll: () => targets, addEventListener(_, handler) { focused = handler; } }
  });
  window.portfolioUI.revealDetails('test');
  return { targets, intersect: (...args) => intersect(...args), focused: (...args) => focused(...args), changed: (...args) => changed(...args) };
}

test('detail reveals follow visual top-to-bottom order, not observer delivery order', () => {
  const state = setup();
  state.intersect([2, 0, 1].map(index => ({ target: state.targets[index], isIntersecting: index !== 1,
    boundingClientRect: { top: index * 100, left: 0 } })));
  assert.equal(state.targets[0].styles['--detail-reveal-delay'], '0ms');
  assert.equal(state.targets[2].styles['--detail-reveal-delay'], '75ms');
  assert.equal(state.targets[1].visible, false);
});

test('keyboard focus reveals immediately and reduced motion never hides content', () => {
  const state = setup();
  state.focused({ target: { closest: () => state.targets[2] } });
  assert.equal(state.targets[2].styles['--detail-reveal-delay'], '0ms');
  assert.equal(state.targets[2].visible, true);
  state.changed({ matches: true });
  assert.ok(state.targets.every(target => target.visible));
  assert.ok(setup(true).targets.every(target => !('data-detail-reveal' in target.attributes)));
});
