const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/floating-navigation.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/floating-navigation.js'), 'utf8');
test('only the primary menu floats and the classic progress keeps one stable ID', () => {
  assert.match(html, /id="primary-navigation-toggle"[^>]*aria-controls="floating-primary-panel"/);
  assert.doesNotMatch(html, /progress-navigation-toggle|floating-progress/);
  assert.equal((html.match(/id="rail-progress"/g)||[]).length, 1);
  assert.equal((html.match(/data-section-link=/g)||[]).length, 6);
  assert.match(html, /floating-navigation\.js/);
});
test('chosen portfolio hides the header without removing its measurement box', () => {
  assert.match(css, /\.home-page\.is-floating-navigation \.site-header\s*\{[^}]*visibility: hidden/);
  assert.doesNotMatch(css, /\.home-page\.is-floating-navigation \.site-header\s*\{[^}]*display: none/);
  assert.match(js, /!branch.hidden/);
});
test('geometry uses the orange accent, staggered easing and reduced-motion fallback', () => {
  assert.match(css, /background: var\(--accent-decor\)/);
  assert.match(css, /floating-toggle-circle::before/);
  assert.doesNotMatch(css, /floating-toggle-triangle|rotate\(-30deg\)/);
  assert.match(css, /--nav-order/);
  assert.match(css, /prefers-reduced-motion/);
});
test('disclosures support tap, Escape, inert panels and focus restoration', () => {
  assert.match(js, /button.addEventListener\('click'/);
  assert.match(js, /event.key === 'Escape'/);
  assert.match(js, /panel.inert/);
  assert.match(js, /focus\(\{ preventScroll: true \}\)/);
});

test('expanded menus are transparent and primary entries align to the right', () => {
  assert.match(css, /background: transparent/);
  assert.match(css, /\.floating-primary-panel a \{ justify-content: flex-end; text-align: right;/);
  assert.doesNotMatch(css, /section-rail[^}]*font-size: 28px/);
  assert.match(css, /home-page:not\(\.is-floating-navigation\) \.section-rail\s*\{[^}]*visibility: hidden/);
  assert.match(js, /rail.inert = !active/);
});

test('dock magnification uses pointer distance and leaves the link hit areas stable', () => {
  assert.match(js, /Math\.cos\(Math\.PI \* distance \/ reach\)/);
  assert.match(js, /menu\.pointerY = event\.clientY/);
  assert.match(css, /\.nav-dock-content/);
  assert.match(css, /height: 64px/);
  assert.match(css, /scale\(var\(--dock-scale, 1\)\)/);
});

test('classic rail shares the circle centerline and uses non-disclosure Dock magnification', () => {
  assert.match(css, /\.home-page \.section-rail\s*\{[^}]*top: 50%;[^}]*transform: translateY\(-50%\)/);
  assert.match(css, /\.home-page\.is-floating-navigation \.section-rail\s*\{[^}]*transform: translateY\(-50%\)/);
  assert.match(css, /\.section-rail \.nav-dock-content\s*\{[^}]*transform-origin: left center/);
  assert.match(js, /rail.querySelectorAll\('a'\).forEach\(wrapDock\)/);
  assert.match(js, /rail.addEventListener\('pointermove'/);
  assert.match(js, /rail.addEventListener\('focusin'/);
  assert.match(js, /active && menu.engaged/);
  assert.match(js, /branch.getBoundingClientRect\(\).left - 12/);
  const main = fs.readFileSync(path.join(root, 'assets/js/main.js'), 'utf8');
  assert.match(main, /const numberHeight = link.querySelector\("span"\).offsetHeight/);
});

test('navigation morph gathers labels, pulses on arrival and moves controls to their final centers', () => {
  assert.match(js, /\[\.\.\.snapshot.links\]\.reverse\(\)/);
  assert.match(js, /arrival \+ 38, small \* \.78/);
  assert.match(js, /arrival \+ 98, small \* 1\.16/);
  assert.doesNotMatch(js, /snapshot.steps|snapshot.track|nav-morph-triangle/);
  assert.doesNotMatch(js, /clipPath: 'polygon/);
  assert.match(js, /portfolio-navigation-prepare/);
  assert.match(js, /portfolio-navigation-finish/);
  assert.match(css, /\.navigation-morph\s*\{[^}]*pointer-events: none/);
});

test('gathering waits until the radial mask is removed and uses normal ink labels', () => {
  assert.doesNotMatch(js, /addEventListener\('portfolio-navigation-reveal'/);
  assert.match(js, /addEventListener\('portfolio-navigation-finish'[\s\S]*if \(active && snapshot\) morphEntry\(snapshot\)/);
  assert.match(js, /color: 'var\(--ink\)'/);
  assert.match(js, /delay: 150 \+ \(options.delay \|\| 0\)/);
});

test('right circle retains an upright Lucide hamburger to close animation and click disclosure', () => {
  assert.match(html, /data-lucide="menu" class="floating-menu-icon"/);
  assert.match(html, /floating-toggle floating-toggle-circle/);
  assert.match(css, /floating-menu-icon path:nth-child\(2\).*opacity: 0/);
  assert.match(css, /translateY\(7px\) rotate\(45deg\)/);
  assert.doesNotMatch(js, /root.addEventListener\('pointerenter'/);
});

test('the primary menu dims the page without adding an opaque panel or removing the scrollbar', () => {
  assert.match(js, /classList.toggle\('is-navigation-menu-open', menus.some/);
  assert.match(css, /navigation-backdrop\s*\{[^}]*z-index: 31;[^}]*background: rgb\(0 0 0 \/ \.8\)/);
  assert.match(css, /is-navigation-menu-open \.floating-primary-panel a \{/);
  assert.doesNotMatch(css, /overflow: hidden;[^}]*is-navigation-menu-open/);
});

test('real header stays visible under the mask, then hands off to gathering labels', () => {
  assert.match(js, /portfolio-navigation-prepare'[\s\S]*classList.add\('is-navigation-staged'\)/);
  assert.match(css, /home-page.is-navigation-staged \.site-header\s*\{[^}]*visibility: visible;[^}]*opacity: 1/);
  assert.match(css, /home-page.is-navigation-staged \.top-nav a \{ color: var\(--ink\)/);
  assert.match(css, /is-navigation-staged \.floating-toggle \{ visibility: hidden/);
  const portal = fs.readFileSync(path.join(root, 'assets/js/portfolio-portal.js'), 'utf8');
  assert.ok(portal.indexOf('const headerSnapshot = paintedHeader()') < portal.indexOf("new Event('portfolio-navigation-prepare')"));
  assert.match(portal, /outgoing.append\(headerSnapshot\)/);
  assert.match(css, /\.portfolio-portal \{ pointer-events: none; \}/);
  assert.match(portal, /addEventListener\("click", blockClick, true\)/);
});

test('morph cleanup handles return navigation, viewport changes and reduced motion without removing header dimensions', () => {
  assert.match(js, /previous.animations.forEach\(animation => animation.cancel\(\)\)/);
  assert.match(js, /previous.scene.remove\(\)/);
  assert.match(js, /if \(!active\) \{\s+cancelMorph\(\)/);
  assert.match(js, /if \(!active \|\| window.portfolioUI.reducedMotion\(\)/);
  assert.match(js, /initialized = true/);
  assert.match(js, /enabled && initialized && !skipInitialEntry/);
  assert.match(js, /addEventListener\('resize'[\s\S]*if \(portalWaiting\) \{ entrySnapshot = captureEntry\(\); return; \}/);
});
