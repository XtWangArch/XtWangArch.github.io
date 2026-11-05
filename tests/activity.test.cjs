const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
function render(search = '?activity=laf-drawing-prize') {
  const mount = { innerHTML: '', classList: { toggle() {} } };
  const meta = {};
  const document = {
    querySelector: selector => selector === '#project-detail' ? mount : selector === 'meta[name="description"]' ? meta : null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const context = {
    URL, URLSearchParams, document,
    IntersectionObserver: class { observe() {} },
    window: {
      location: { search, href: `http://127.0.0.1:5173/project.html${search}`, origin: 'http://127.0.0.1:5173' },
      addEventListener() {}
    }
  };
  vm.createContext(context);
  for (const name of ['site-data', 'shared', 'detail-reveal', 'project']) {
    vm.runInContext(fs.readFileSync(path.join(root, `assets/js/${name}.js`), 'utf8'), context);
  }
  return { html: mount.innerHTML, context, meta };
}

test('award page renders two ordered, interactive, original drawings, without project placeholders', () => {
  const { html, context, meta } = render();
  const award = context.window.portfolioData.researchExperience.find(item => item.id === 'laf-drawing-prize');
  assert.equal(award.gallery.length, 2);
  for (const item of award.gallery) assert.ok(fs.existsSync(path.join(root, item.image)));
  assert.match(html, /Liverpool Architecture Festival Drawing Prize/);
  assert.match(html, /<dt>Award<\/dt>/);
  assert.match(html, /Runner-up/);
  assert.equal((html.match(/data-full-image=/g) || []).length, 2);
  assert.ok(html.indexOf('energy-to-plan.png') < html.indexOf('/energy.png'));
  assert.doesNotMatch(html, /class="gallery-feature"|class="detail-brief"|class="project-pagination"|undefined/);
  assert.match(html, /href="index.html#timeline">Back to Experience/);
  assert.match(meta.content, /Runner-up, Jun. 2023/);
});

test('CV award link returns to CV and local links stay in the same tab', () => {
  const { html, context } = render('?activity=laf-drawing-prize&return=cv');
  assert.match(html, /href="cv.html\?return=profile-intro">Back to CV/);
  const award = context.window.portfolioData.researchExperience.find(item => item.id === 'laf-drawing-prize');
  const link = context.window.portfolioText.recordLink(award, 'cv');
  assert.match(link, /activity=laf-drawing-prize&amp;return=cv/);
  assert.doesNotMatch(link, /target="_blank"/);
  const external = context.window.portfolioText.recordLink({ title: 'Film', url: 'https://youtu.be/znfRrTSLMCs' });
  assert.match(external, /target="_blank" rel="noreferrer"/);
});

test('existing architecture projects retain their feature, Brief and previous/next navigation', () => {
  const { html } = render('?project=academic-01');
  for (const name of ['gallery-feature', 'detail-brief', 'project-pagination']) assert.ok(html.includes(`class="${name}"`));
  assert.match(html, /Back to Selected Works/);
});

test('Chaoyin cladding drawings stay directly below the feature before shuffled images', () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { html } = render('?project=internship-01');
    const feature = html.indexOf('class="gallery-feature"');
    const pinned = html.indexOf('gallery-grid gallery-pinned');
    const first = html.indexOf('data-full-image="assets/images/projects/professional-01/project1_claddingdesign1.jpg"');
    const second = html.indexOf('data-full-image="assets/images/projects/professional-01/project1_claddingdesign2.jpg"');
    const remaining = html.indexOf('section class="gallery-grid"', pinned);
    assert.ok(feature < pinned && pinned < first && first < second && second < remaining);
    assert.doesNotMatch(html, /gallery-grid gallery-wide/);
    assert.equal((html.match(/data-full-image=/g) || []).length, 7);
  }
});
