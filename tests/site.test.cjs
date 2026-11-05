const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { window: {}, document: { querySelector: () => null } };
vm.createContext(context);
for (const file of ['image-manifest.js', 'shared.js', 'site-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'), context);
}

test('responsive previews exist and retain source dimensions', () => {
  const manifest = context.window.portfolioImageManifest;
  assert.ok(Object.keys(manifest).length > 0);
  for (const [source, image] of Object.entries(manifest)) {
    assert.ok(fs.existsSync(path.join(root, source)), source);
    assert.ok(image.width > 0 && image.height > 0, source);
    assert.ok(image.sources.length > 0, source);
    let previous = 0;
    for (const variant of image.sources) {
      assert.ok(variant.width > previous && variant.width <= Math.min(1600, image.width), source);
      assert.ok(fs.statSync(path.join(root, variant.src)).size > 0, variant.src);
      previous = variant.width;
    }
  }
});

test('project images have previews without changing original lightbox paths', () => {
  for (const project of context.window.portfolioData.projects) {
    for (const source of [project.cover, project.logo, ...project.gallery.map(item => item.image)].filter(Boolean)) {
      assert.ok(context.window.portfolioImageManifest[source], source);
      assert.ok(!source.includes('/optimized/'), source);
    }
  }
});

test('image markup includes responsive candidates and stable dimensions', () => {
  const source = context.window.portfolioData.projects[0].cover;
  const markup = context.window.portfolioMedia.attributes(source, '(max-width: 980px) 100vw, 60vw');
  for (const attribute of ['src=', 'srcset=', 'sizes=', 'width=', 'height=', 'decoding="async"']) {
    assert.ok(markup.includes(attribute), attribute);
  }
  assert.match(markup, /optimized\//);
});

test('new images still work before rebuilding previews and escape attributes', () => {
  const markup = context.window.portfolioMedia.attributes('new/image"&.jpg');
  assert.equal(markup, 'src="new/image&quot;&amp;.jpg" decoding="async"');
});

test('shared rendering helpers load before homepage and project scripts', () => {
  for (const [page, script] of [['index.html', 'main.js'], ['project.html', 'project.js']]) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.ok(html.indexOf('image-manifest.js') < html.indexOf('shared.js'), page);
    assert.ok(html.indexOf('shared.js') < html.indexOf(`assets/js/${script}`), page);
  }
});

test('Experience is the final snap stop after Selected Works', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<section\s+id="timeline"[^>]*\bdata-snap-stop\b/);
  assert.ok(html.indexOf('id="timeline"') > html.indexOf('id="work-groups"'));
});

test('professional publications and Chaoyin pinned drawings stay explicitly configured', () => {
  const projects = context.window.portfolioData.projects;
  const chaoyin = projects.find(item => item.id === 'internship-01');
  const drawings = chaoyin.gallery.filter(item => /claddingdesign/.test(item.image));
  assert.equal(drawings.length, 2);
  assert.ok(drawings.every(item => item.layout === 'full' && item.pinned === true));
  assert.ok(chaoyin.gallery.filter(item => !drawings.includes(item)).every(item => item.layout !== 'wide'));
  assert.ok(projects.find(item => item.id === 'internship-02').website.includes('hanling-museum-of-art'));
  assert.equal(projects.find(item => item.id === 'internship-03').archdailyUrl,
    'https://www.archdaily.com/1015855/whitestone-gallery-beijing-798-kengo-kuma-and-associates');
});
