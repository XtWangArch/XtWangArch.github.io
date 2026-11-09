(function () {
  const root = document.documentElement;
  const navigation = performance.getEntriesByType('navigation')[0];
  const params = new URLSearchParams(location.search);
  if ((location.hash && location.hash !== '#profile') || params.has('admin-preview') || navigation?.type === 'back_forward') return;

  const duration = 3000;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let splash, started, frame, timer, timeout, finished = false;
  const locked = [];
  root.classList.add('has-splash');
  root.dataset.splashState = 'pending';

  const block = event => {
    if (event.type === 'keydown' && !['Tab', ' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const inputs = ['wheel', 'touchmove', 'pointerdown', 'click', 'keydown'];
  inputs.forEach(type => addEventListener(type, block, { capture: true, passive: false }));

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    clearTimeout(timeout);
    watcher.disconnect();
    inputs.forEach(type => removeEventListener(type, block, true));
    locked.forEach(([element, inert]) => { element.inert = inert; });
    root.classList.remove('has-splash', 'splash-revealing');
    delete root.dataset.splashState;
    splash?.remove();
  }

  function reveal() {
    if (finished || !splash || splash.classList.contains('is-revealing')) return;
    cancelAnimationFrame(frame);
    splash.style.setProperty('--splash-progress', '100%');
    splash.querySelector('.splash-percent').textContent = '100%';
    splash.setAttribute('aria-valuenow', '100');
    const svgNS = 'http://www.w3.org/2000/svg';
    const element = (name, attributes) => {
      const node = document.createElementNS(svgNS, name);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
      return node;
    };
    const width = splash.clientWidth, height = splash.clientHeight;
    const svg = element('svg', { class: 'splash-knockout', viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true', preserveAspectRatio: 'none' });
    const defs = element('defs', {});
    const mask = element('mask', { id: 'splash-type-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width, height });
    mask.style.maskType = 'luminance';
    mask.append(element('rect', { x: 0, y: 0, width, height, fill: '#fff' }));
    const letters = element('g', { fill: '#000' });
    const lines = [...splash.querySelectorAll('.splash-title-track .splash-line')];
    const style = getComputedStyle(splash.querySelector('.splash-title'));
    const positions = lines.map(line => ({ x: line.getBoundingClientRect().left, y: line.querySelector('.splash-baseline').getBoundingClientRect().top }));
    lines.forEach((line, index) => {
      const text = element('text', { x: positions[index].x, y: positions[index].y });
      text.style.font = style.font;
      text.style.letterSpacing = '0';
      text.textContent = line.firstChild.textContent;
      letters.append(text);
    });
    mask.append(letters); defs.append(mask); svg.append(defs);
    const orange = element('rect', { width, height, fill: '#e64f36', mask: 'url(#splash-type-mask)' });
    const whiteType = letters.cloneNode(true);
    whiteType.setAttribute('fill', '#fff');
    svg.append(orange, whiteType); splash.prepend(svg);
    root.classList.add('splash-revealing');
    root.dataset.splashState = 'revealing';
    splash.classList.add('is-revealing');
    splash.querySelector('.splash-title').style.visibility = 'hidden';
    splash.querySelector('.splash-percent').animate([{ opacity: 1 }, { opacity: 0 }], { duration: preference.matches ? 180 : 220, fill: 'forwards' });
    if (preference.matches) {
      splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished.then(finish).catch(finish);
      return;
    }
    const size = parseFloat(style.fontSize);
    const anchor = { x: positions[0].x + size * .32, y: positions[0].y - size * .36 };
    const zoom = Math.max(width, height) / size * 8;
    const transitionStart = performance.now();
    const transitionDuration = 1150;
    const tick = now => {
      const progress = Math.min(1, (now - transitionStart) / transitionDuration);
      const eased = progress * progress * (3 - 2 * progress);
      const scale = Math.exp(Math.log(zoom) * eased);
      const x = anchor.x + (width / 2 - anchor.x) * eased;
      const y = anchor.y + (height / 2 - anchor.y) * eased;
      const transform = `translate(${x} ${y}) scale(${scale}) translate(${-anchor.x} ${-anchor.y})`;
      letters.setAttribute('transform', transform);
      whiteType.setAttribute('transform', transform);
      whiteType.style.opacity = String(1 - Math.min(1, progress / .2));
      orange.style.opacity = String(1 - Math.max(0, (progress - .75) / .25));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (splash || finished) return;
    splash = document.querySelector('.site-splash');
    if (!splash?.querySelector('.splash-percent')) { splash = null; return; }
    watcher.disconnect();
    const percent = splash.querySelector('.splash-percent');
    const tick = now => {
      if (started === undefined) {
        started = now;
        root.dataset.splashState = 'loading';
        timer = setTimeout(reveal, duration);
      }
      const value = Math.min(100, Math.floor((now - started) / duration * 100));
      splash.style.setProperty('--splash-progress', `${value}%`);
      percent.textContent = `${value}%`;
      splash.setAttribute('aria-valuenow', String(value));
      if (value < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  const watcher = new MutationObserver(start);
  watcher.observe(root, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => {
    if (finished) return;
    start();
    document.querySelectorAll('main, .site-header').forEach(element => {
      locked.push([element, element.inert]);
      element.inert = true;
    });
  }, { once: true });
  addEventListener('pagehide', finish, { once: true });
  addEventListener('resize', () => { if (root.dataset.splashState === 'revealing') finish(); }, { passive: true });
  timeout = setTimeout(finish, 6500);
})();
