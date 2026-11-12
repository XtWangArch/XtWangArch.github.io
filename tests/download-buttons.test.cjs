const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('Profile and Contact download links use the View CV accent style without changing the PDF', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const buttons = html.match(/<a class="button accent cv-download"[^>]+>/g) || [];
  assert.equal(buttons.length, 2);
  for (const button of buttons) {
    assert.match(button, /href="assets\/pdfs\/Xitao_Wang_CV\+Portfolio\.pdf"/);
    assert.match(button, /data-download="cv" download/);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'cv.html'), 'utf8'), /cv-download/);
});

test('glass loading references are removed and the original splash and video cover are loaded', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /assets\/css\/splash\.css/);
  assert.match(html, /class="splash-title-fill"/);
  assert.match(html, /class="hero-cover-video"/);
  assert.doesNotMatch(html, /assets\/cover\/|liquid-glass|glass-loading/);
});

test('Contact puts the download first with View CV and MSA on the next row', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const contact = html.slice(html.indexOf('<section id="contact"'));
  assert.match(contact, /class="button-stack contact-actions">\s*<a class="button accent cv-download"/);
  assert.match(contact, /<div class="button-row">\s*<a class="button accent" href="cv.html\?return=contact">[\s\S]*?data-social="msa"/);
  const profile = html.slice(html.indexOf('<section id="profile-intro"'), html.indexOf('<section id="portfolios"'));
  assert.match(profile, /class="button-row hero-actions"/);
  assert.doesNotMatch(profile, /contact-actions/);
});
