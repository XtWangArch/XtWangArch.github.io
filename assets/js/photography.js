(function () {
  const data = window.portfolioData;
  if (!data) return;
  const esc = window.portfolioText.escape;
  const reduced = () => window.portfolioUI.reducedMotion();
  const icons = () => window.lucide?.createIcons();
  const settings = data.photoSettings || {};
  const collections = (data.photoCollections || []).filter(item => item.published !== false);
  const photos = collection => (collection.gallery || []).filter(item => item.image);
  const cover = collection => collection.cover || photos(collection)[0]?.image || '';
  const category = collection => collection.kind === 'elsewhere' ? 'journey' : collection.kind;
  const detailURL = collection => `photography.html?collection=${encodeURIComponent(collection.id)}`;
  const returnURL = collection => `index.html?photo=${encodeURIComponent(collection.id)}&photo-view=${category(collection)}#photography-works`;
  const nextAlbum = collection => {
    const albums = collections.filter(item => category(item) === category(collection));
    const index = albums.findIndex(item => item.id === collection.id);
    return index < 0 || albums.length < 2 ? null : albums[(index + 1) % albums.length];
  };
  const nextCommercialProject = collection => category(collection) === 'commercial' ? nextAlbum(collection) : null;
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const command = (action, label, name, extra = '') => `<button class="photo-icon" type="button" data-photo-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}>${icon(name)}</button>`;
  const media = (source, alt, sizes = '75vw', eager = false) => `<img ${window.portfolioMedia.attributes(source, sizes)} alt="${esc(alt || '')}" loading="${eager ? 'eager' : 'lazy'}">`;
  const count = (index, total) => `${String(total ? index + 1 : 0).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  const emptyCover = () => `<div class="photo-empty-cover">${icon('image')}<span>Images forthcoming</span></div>`;
  const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const clamp = (index, length) => Math.max(0, Math.min(length - 1, index));
  const rotationAllowed = state => state.view === 'commercial' && !state.paused && !state.reducedMotion && !state.hidden && !state.keyboardFocus && state.visible && !state.portalBusy;
  window.photographyModel = { photos, cover, category, detailURL, returnURL, rotationAllowed, nextCommercialProject, nextAlbum };

  function swipe(element, callback) {
    let start;
    element.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') start = { x: event.clientX, y: event.clientY };
    });
    element.addEventListener('pointerup', event => {
      if (!start) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        callback(dx < 0 ? 1 : -1);
        const suppressClick = event => { event.preventDefault(); event.stopImmediatePropagation(); };
        element.addEventListener('click', suppressClick, { capture: true, once: true });
        setTimeout(() => element.removeEventListener('click', suppressClick, true), 500);
      }
    });
    element.addEventListener('pointercancel', () => { start = null; });
  }

  function directory(root) {
    const commercial = collections.filter(item => category(item) === 'commercial');
    const groups = { journey: collections.filter(item => category(item) === 'journey'), landscape: collections.filter(item => category(item) === 'landscape'), architecture: collections.filter(item => category(item) === 'architecture') };
    const params = new URLSearchParams(location.search);
    let current = Math.max(0, commercial.findIndex(item => item.id === params.get('photo')));
    let view = params.get('photo-view') === 'elsewhere' ? 'journey' : params.get('photo-view');
    if (!['commercial', 'film', 'journey', 'landscape', 'architecture'].includes(view)) view = 'commercial';
    let placeReturn = (groups[view] || []).find(item => item.id === params.get('photo'))?.id;
    let placeContext = {};
    try { placeContext = JSON.parse(sessionStorage.getItem(`photo-${view}-context`) || sessionStorage.getItem('photo-elsewhere-context') || '{}'); } catch (_) {}
    let density = ['xs', 'sm', 'md'].includes(placeContext.density) ? placeContext.density : 'xs';
    let paused = settings.autoplay === false, wheelAt = -Infinity, wheelTotal = 0, wheelDirection = 0;
    let timer, stageVersion = 0, viewVersion = 0, switching = false, featureAnimations = [], viewAnimation;
    let filmWheelSurface = null, filmWheelRest = 0;
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
    const labels = { commercial: settings.commercialLabel || 'Commercial', film: settings.filmLabel || 'Film', journey: settings.journeyLabel || 'Journey', landscape: settings.landscapeLabel || 'Landscape', architecture: settings.architectureLabel || 'Architecture' };
    root.innerHTML = `<div class="photo-toolbar"><nav class="photo-tabs" aria-label="Photography and film collections">${Object.entries(labels).map(([key, label]) => `<button type="button" data-photo-view-tab="${key}" aria-pressed="false" aria-controls="photo-directory">${esc(label)}</button>`).join('')}<span class="photo-tab-marker" aria-hidden="true"></span></nav><a href="#portfolios" class="photo-portfolio-back">Portfolio</a></div><div id="photo-directory"></div><span class="sr-only" role="status" id="photo-directory-status"></span>`;
    const mount = root.querySelector('#photo-directory');
    function moveMarker(marker, x, y, width, animated = true) {
      if (!marker) return;
      if (!animated || reduced()) marker.style.transition = 'none';
      marker.style.width = `${width}px`;
      marker.style.transform = `translate(${x}px, ${y}px)`;
      if (!animated || reduced()) { marker.getBoundingClientRect(); marker.style.transition = ''; }
    }
    function positionMarkers(animated = true) {
      root.querySelectorAll('.photo-tabs').forEach(barElement => {
        const tab = barElement.querySelector('[data-photo-view-tab][aria-pressed="true"]');
        if (!tab) return;
        const label = tab.getBoundingClientRect();
        const bar = tab.parentElement.getBoundingClientRect();
        // Client rectangles include CSS zoom/transforms; marker styles use local layout pixels.
        const scale = bar.width / (parseFloat(getComputedStyle(tab.parentElement).width) || bar.width);
        if (label.width > 0) moveMarker(barElement.querySelector('.photo-tab-marker'), (label.left - bar.left) / scale, (label.bottom - bar.top) / scale - 2, label.width / scale, animated);
      });
      const dot = mount.querySelector('[data-photo-slide][aria-current="true"]');
      if (dot) moveMarker(mount.querySelector('.photo-dot-active'), dot.offsetLeft + (dot.offsetWidth - 8) / 2, dot.offsetTop + (dot.offsetHeight - 8) / 2, 8, animated);
    }
    function updatePause() {
      const button = mount.querySelector('[data-photo-action="pause"]');
      if (!button) return;
      const label = paused ? 'Resume automatic rotation' : 'Pause automatic rotation';
      button.setAttribute('aria-label', label); button.title = label;
      button.setAttribute('aria-pressed', String(paused));
      button.innerHTML = icon(paused ? 'play' : 'pause');
      button.disabled = commercial.length < 2 || reduced();
      icons();
    }
    async function stage(manual = false) {
      const version = ++stageVersion;
      const item = commercial[current];
      if (!item) {
        mount.innerHTML = `<div class="photo-empty"><h3>${esc(labels.commercial)}</h3><p>New work coming soon.</p></div>`;
        return;
      }
      const fresh = !mount.querySelector('.photo-commercial-stage');
      if (fresh) mount.innerHTML = `<div class="photo-commercial-stage"><div class="photo-feature-slot"></div><div class="photo-stage-controls" aria-label="Commercial project controls">${command('previous', 'Previous project', 'chevron-left', commercial.length < 2 ? 'disabled' : '')}<div class="photo-dots">${commercial.map((p, i) => `<button type="button" class="photo-dot" data-photo-slide="${i}" aria-label="Show ${esc(p.title)}" aria-current="false"></button>`).join('')}<span class="photo-dot-active" aria-hidden="true"></span></div>${command('next', 'Next project', 'chevron-right', commercial.length < 2 ? 'disabled' : '')}${command('pause', 'Pause automatic rotation', 'pause')}</div></div>`;
      const slot = mount.querySelector('.photo-feature-slot');
      const template = document.createElement('template');
      template.innerHTML = `<a class="photo-feature" href="${detailURL(item)}" aria-label="View ${esc(item.title)}"><div class="photo-cover">${cover(item) ? media(cover(item), item.title, '(max-width: 980px) 90vw, 65vw', true) : emptyCover()}</div><div class="photo-feature-caption"><h3>${esc(item.title)}</h3>${item.year ? `<time>${esc(item.year)}</time>` : ''}</div></a>`;
      const feature = template.content.firstElementChild;
      const image = feature.querySelector('img');
      if (image && !image.complete) await Promise.race([image.decode().catch(() => {}), delay(1800)]);
      if (version !== stageVersion || view !== 'commercial') return;
      slot.querySelectorAll('.is-outgoing').forEach(element => element.remove());
      const previous = slot.querySelector('.photo-feature');
      const focusedFeature = previous?.contains(document.activeElement);
      const previousOpacity = previous ? getComputedStyle(previous).opacity : '1';
      const previousTransform = previous ? getComputedStyle(previous).transform : 'none';
      featureAnimations.forEach(animation => animation.cancel());
      featureAnimations = [];
      slot.append(feature);
      if (previous) {
        previous.classList.add('is-outgoing'); previous.inert = true;
        if (!reduced()) {
          const outgoing = previous.animate([{ opacity: previousOpacity, transform: previousTransform }, { opacity: 0, transform: 'translateY(-5px)' }], { duration: 560, easing: ease, fill: 'forwards' });
          featureAnimations.push(outgoing);
          outgoing.finished.then(() => previous.remove(), () => previous.remove());
        } else previous.remove();
      }
      if (!reduced()) {
        const incoming = feature.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: ease });
        incoming.finished.catch(() => {}); featureAnimations.push(incoming);
      }
      mount.querySelectorAll('[data-photo-slide]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.photoSlide) === current)));
      positionMarkers(!fresh); updatePause(); icons();
      if (focusedFeature) feature.focus({ preventScroll: true });
      if (manual) root.querySelector('#photo-directory-status').textContent = `${item.title}, ${count(current, commercial.length)}`;
    }
    function remember() {
      // Preserve the selected collection without changing the main site's section hash.
      const url = new URL(location.href);
      url.searchParams.set('photo-view', view);
      if (view === 'commercial' && commercial[current]) url.searchParams.set('photo', commercial[current].id);
      else url.searchParams.delete('photo');
      history.replaceState(history.state, '', url);
    }
    function step(direction, manual = true) {
      if (commercial.length < 2) return;
      current = (current + direction + commercial.length) % commercial.length;
      stage(manual);
      if (manual) remember();
    }
    function startTimer() {
      clearInterval(timer);
      timer = setInterval(() => {
        const rect = root.getBoundingClientRect();
        if (!rotationAllowed({ view, paused, reducedMotion: reduced(), hidden: document.hidden, keyboardFocus: !!root.querySelector(':focus-visible'), visible: !!root.getClientRects().length && rect.top <= innerHeight / 2 && rect.bottom >= innerHeight / 2, portalBusy: switching || window.portfolioPortal?.busy })) return;
        step(1, false);
      }, Math.max(2500, Number(settings.interval) || 6000));
    }
    function centerFilmWheelSurface() {
      if (view !== 'film' || innerWidth <= 980 || !filmWheelSurface?.getClientRects().length) return;
      filmWheelSurface.scrollTop = (filmWheelSurface.scrollHeight - filmWheelSurface.clientHeight) / 2;
      filmWheelRest = filmWheelSurface.scrollTop;
    }
    function setupFilmWheelSurface() {
      const surface = mount.querySelector('.photo-film-surface');
      filmWheelSurface = surface;
      surface.addEventListener('scroll', () => {
        if (surface !== filmWheelSurface || view !== 'film' || innerWidth <= 980 || !root.getClientRects().length) return;
        const offset = surface.scrollTop - filmWheelRest;
        if (Math.abs(offset) < .5) return;
        centerFilmWheelSurface();
        if (switching || window.portfolioPortal?.busy || location.hash !== '#photography-works' || performance.now() - wheelAt < 900) return;
        // Iframe wheel events stay cross-origin; contained native scrolling supplies direction without moving the page.
        wheelAt = performance.now(); wheelTotal = 0;
        switchView(offset > 0 ? 'journey' : 'commercial');
      }, { passive: true });
      centerFilmWheelSurface();
    }
    function renderView(animated = false) {
      filmWheelSurface = null;
      let ready;
      root.dataset.photoView = view;
      root.querySelectorAll('[data-photo-view-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.photoViewTab === view)));
      if (view === 'commercial') ready = stage();
      else if (view === 'film') {
        const videos = [data.videos?.featured, ...(data.videos?.items || [])].filter(item => item?.youtubeEmbed || item?.url);
        mount.innerHTML = `<div class="photo-film-surface"><div class="photo-film-scroll-track"><div class="photo-film-content"><div class="photo-film-grid" style="--film-rows: ${Math.max(1, Math.ceil(videos.length / 2))}">${videos.map((video, index) => `<div class="video-frame photo-film-enter" style="--film-order: ${Math.min(index, 4)}">${video.youtubeEmbed ? `<iframe src="${esc(video.youtubeEmbed)}" title="${esc(video.title || 'Film')}" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : `<a href="${esc(video.url)}" target="_blank" rel="noreferrer">Watch on YouTube</a>`}</div>`).join('')}</div>${data.links?.youtube ? `<div class="photo-film-footer"><a class="text-link" href="${esc(data.links.youtube)}" target="_blank" rel="noreferrer">Other Work ${icon('arrow-up-right')}</a></div>` : ''}</div></div></div>`;
        setupFilmWheelSurface();
      }
      else {
        const places = groups[view];
        mount.innerHTML = places.length ? `<div class="photo-density" role="group" aria-label="Thumbnail size">${['xs', 'sm', 'md'].map(size => `<button type="button" data-photo-density="${size}" aria-pressed="${size === 'xs'}">${size.toUpperCase()}</button>`).join('')}</div><div class="photo-place-list" data-density="${density}">${places.map(place => `<section class="photo-place" data-photo-place-id="${esc(place.id)}"><a class="photo-place-heading" href="${detailURL(place)}"><h3>${esc(place.title)}</h3><span class="photo-place-count">${photos(place).length}</span></a><div class="photo-contact-sheet">${photos(place).length ? photos(place).map(photo => `<a href="${detailURL(place)}" aria-label="View ${esc(place.title)}">${media(photo.image, photo.alt || photo.label, '180px')}</a>`).join('') : '<span class="photo-place-pending">Images forthcoming</span>'}</div></section>`).join('')}</div>` : `<div class="photo-empty"><h3>${esc(labels[view])}</h3><p>New work coming soon.</p></div>`;
      }
      if (groups[view]) {
        mount.insertAdjacentHTML('beforeend', `<footer class="photo-directory-footer"><nav class="photo-tabs" aria-label="Photography and film collections, bottom">${Object.entries(labels).map(([key, label]) => `<button type="button" data-photo-view-tab="${key}" aria-pressed="${key === view}" aria-controls="photo-directory">${esc(label)}</button>`).join('')}<span class="photo-tab-marker" aria-hidden="true"></span></nav><a class="button accent" href="index.html#selected-works">Go to Architecture Portfolio</a></footer>`);
      }
      icons();
      if (groups[view]?.length) {
        root.querySelectorAll('[data-photo-density]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.photoDensity === density)));
      }
      positionMarkers(animated);
      startTimer();
      return ready;
    }
    function alignSection() {
      const section = root.closest('#photography-works');
      window.scrollTo({ top: Math.ceil(section.getBoundingClientRect().top + scrollY), behavior: 'instant' });
    }
    async function switchView(next, manual = true) {
      if (next === view) { alignSection(); return; }
      const filmTransition = view === 'film' || next === 'film';
      const version = ++viewVersion;
      stageVersion++; switching = true; clearInterval(timer);
      view = next; root.dataset.photoView = view;
      root.querySelectorAll('[data-photo-view-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.photoViewTab === view)));
      positionMarkers(); if (manual) remember();
      alignSection();
      const opacity = getComputedStyle(mount).opacity;
      viewAnimation?.cancel();
      if (!reduced()) {
        const frames = filmTransition ? [{ opacity }, { opacity: 0 }] : [{ opacity }, { opacity: 0, transform: 'translateY(-5px)' }];
        viewAnimation = mount.animate(frames, { duration: filmTransition ? 100 : 220, easing: ease, fill: 'forwards' });
        await viewAnimation.finished.catch(() => {});
      }
      if (version !== viewVersion) return;
      featureAnimations.forEach(animation => animation.cancel()); featureAnimations = [];
      mount.replaceChildren(); renderView(true); alignSection(); viewAnimation?.cancel();
      if (!reduced() && view !== 'film') {
        const frames = filmTransition ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }];
        viewAnimation = mount.animate(frames, { duration: filmTransition ? 300 : 520, easing: ease });
        await viewAnimation.finished.catch(() => {});
      }
      if (version === viewVersion) { switching = false; startTimer(); centerFilmWheelSurface(); }
    }
    root.addEventListener('click', event => {
      const tab = event.target.closest('[data-photo-view-tab]');
      if (tab) {
        switchView(tab.dataset.photoViewTab);
        if (tab.closest('.photo-directory-footer')) root.querySelector(`.photo-toolbar [data-photo-view-tab="${tab.dataset.photoViewTab}"]`).focus({ preventScroll: true });
        return;
      }
      const dot = event.target.closest('[data-photo-slide]');
      if (dot) { current = Number(dot.dataset.photoSlide); stage(true); remember(); startTimer(); return; }
      const density = event.target.closest('[data-photo-density]');
      if (density) {
        root.querySelector('.photo-place-list').dataset.density = density.dataset.photoDensity;
        root.querySelectorAll('[data-photo-density]').forEach(button => button.setAttribute('aria-pressed', String(button === density)));
        rememberDensity(density.dataset.photoDensity);
        return;
      }
      const place = event.target.closest('a')?.closest('.photo-place');
      if (place) {
        try { sessionStorage.setItem(`photo-${view}-context`, JSON.stringify({ id: place.dataset.photoPlaceId, density: root.querySelector('.photo-place-list').dataset.density, offset: place.getBoundingClientRect().top })); } catch (_) {}
      }
      const action = event.target.closest('[data-photo-action]')?.dataset.photoAction;
      if (action === 'next' || action === 'previous') { step(action === 'next' ? 1 : -1); startTimer(); }
      if (action === 'pause') { paused = !paused; updatePause(); startTimer(); }
    });
    function handleWheel(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !root.getClientRects().length || window.portfolioPortal?.busy) return false;
      const rect = root.getBoundingClientRect();
      if (rect.top > window.portfolioUI.headerHeight() + 60 || rect.bottom < innerHeight / 2) return false;
      const direction = Math.sign(event.deltaY);
      if (!direction) return false;
      const albumDirectory = Boolean(groups[view]);
      const sectionTop = root.closest('#photography-works').getBoundingClientRect().top;
      if (!switching && ((direction < 0 && sectionTop < -2) || (direction > 0 && rect.bottom > innerHeight + (albumDirectory ? 2 : 24)))) {
        const remaining = direction < 0 ? -sectionTop : rect.bottom - innerHeight;
        if (Math.abs(event.deltaY) >= remaining) {
          event.preventDefault(); event.stopPropagation();
          window.scrollBy({ top: direction * remaining, behavior: 'instant' });
          wheelAt = performance.now(); wheelTotal = 0;
        }
        return true;
      }
      const order = Object.keys(labels), index = order.indexOf(view);
      const slide = view === 'commercial' && ((direction > 0 && current < commercial.length - 1) || (direction < 0 && current > 0));
      const nextView = order[index + direction];
      if ((albumDirectory && direction > 0) || (direction < 0 && !slide && !nextView)) {
        event.preventDefault(); event.stopPropagation();
        return true;
      }
      if (!switching && !slide && !nextView) return false;
      event.preventDefault(); event.stopPropagation();
      if (switching || performance.now() - wheelAt < 900) return true;
      if (direction !== wheelDirection) { wheelTotal = 0; wheelDirection = direction; }
      wheelTotal += Math.abs(event.deltaY);
      if (wheelTotal < 100) return true;
      wheelTotal = 0; wheelAt = performance.now();
      if (slide) { step(direction); startTimer(); }
      else switchView(nextView);
      return true;
    }
    let touchGesture;
    root.addEventListener('touchstart', event => {
      const point = event.touches.length === 1 ? event.touches[0] : null;
      touchGesture = point ? { x: point.clientX, y: point.clientY, consumed: false } : null;
    }, { passive: true });
    root.addEventListener('touchmove', event => {
      if (!touchGesture || event.touches.length !== 1) return;
      if (touchGesture.consumed) { event.preventDefault(); return; }
      const point = event.touches[0];
      const dx = touchGesture.x - point.clientX, dy = touchGesture.y - point.clientY;
      if (Math.abs(dy) < 12 || Math.abs(dx) > Math.abs(dy)) return;
      touchGesture.x = point.clientX; touchGesture.y = point.clientY;
      const before = { view, current, y: scrollY };
      let blocked = false;
      handleWheel({ deltaX: dx, deltaY: dy, ctrlKey: false,
        preventDefault() { blocked = true; event.preventDefault(); },
        stopPropagation() { event.stopPropagation(); }
      });
      // A single swipe owns one category change, including its inertial tail.
      if (view !== before.view || current !== before.current || (blocked && scrollY !== before.y)) touchGesture.consumed = true;
    }, { passive: false });
    ['touchend', 'touchcancel'].forEach(type => root.addEventListener(type, () => { touchGesture = null; }, { passive: true }));
    root.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-photo-view-tab]');
      if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        const order = Object.keys(labels), index = order.indexOf(tab.dataset.photoViewTab);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? order.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length;
        event.preventDefault(); switchView(order[next]);
        root.querySelector(`[data-photo-view-tab="${order[next]}"]`).focus({ preventScroll: true });
        return;
      }
      if (view === 'commercial' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); startTimer();
      }
    });
    swipe(root, direction => { if (view === 'commercial') step(direction); });
    window.addEventListener('pageshow', startTimer);
    window.addEventListener('pagehide', () => clearInterval(timer));
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (reduced()) {
        featureAnimations.forEach(animation => animation.cancel()); featureAnimations = [];
        mount.querySelectorAll('.is-outgoing').forEach(element => element.remove());
        viewAnimation?.finish(); positionMarkers(false);
      }
      updatePause(); startTimer();
    });
    function rememberDensity(value) {
      density = value;
      try { sessionStorage.setItem(`photo-${view}-context`, JSON.stringify({ ...placeContext, density })); } catch (_) {}
    }
    window.photographyDirectory = { handleWheel, reset() {
      viewVersion++; stageVersion++; switching = false; viewAnimation?.cancel();
      featureAnimations.forEach(animation => animation.cancel()); featureAnimations = [];
      current = 0; view = 'commercial'; placeReturn = null; mount.replaceChildren();
      const ready = renderView(); remember();
      return Promise.resolve(ready).then(() => featureAnimations.forEach(animation => animation.finish()));
    } };
    renderView();
    // Native touch momentum can continue after touchend; keep it inside this portfolio.
    addEventListener('scroll', () => {
      if (switching || window.portfolioPortal?.busy || location.hash !== '#photography-works' || document.body.dataset.activePortfolio !== 'photography' || !root.getClientRects().length) return;
      const section = root.closest('#photography-works');
      const top = section.getBoundingClientRect().top + scrollY;
      const bottom = Math.max(top, root.getBoundingClientRect().bottom + scrollY - innerHeight);
      const bounded = Math.max(top, groups[view] ? Math.min(bottom, scrollY) : scrollY);
      if (Math.abs(bounded - scrollY) > 1) window.scrollTo({ top: bounded, behavior: 'instant' });
    }, { passive: true });
    const toolbar = root.querySelector('.photo-toolbar');
    const measure = (animated = false) => { root.style.setProperty('--photo-toolbar-height', `${toolbar.offsetHeight}px`); positionMarkers(animated); centerFilmWheelSurface(); };
    // A late font can resize the labels without changing the outer browser dimensions.
    const markerObserver = new ResizeObserver(entries => measure(!entries.some(entry => entry.target.matches('[data-photo-view-tab]'))));
    markerObserver.observe(root);
    root.querySelectorAll('[data-photo-view-tab]').forEach(button => markerObserver.observe(button));
    document.fonts?.ready.then(() => measure());
    document.fonts?.addEventListener('loadingdone', () => measure());
    window.addEventListener('resize', () => measure());
    if (location.hash === '#photography-works') {
      // Fonts and Profile's measured height can move the return anchor after navigation.
      const controller = new AbortController();
      const align = () => {
        if (controller.signal.aborted || !root.getClientRects().length || location.hash !== '#photography-works') return;
        const section = root.closest('#photography-works');
        const place = groups[view] && placeReturn ? [...root.querySelectorAll('.photo-place')].find(element => element.dataset.photoPlaceId === placeReturn) : null;
        const offset = placeContext.id === placeReturn && Number.isFinite(placeContext.offset) ? placeContext.offset : window.portfolioUI.headerHeight() + 100;
        window.scrollTo({ top: Math.max(0, (place || section).getBoundingClientRect().top + scrollY - (place ? offset : 0)), behavior: 'instant' });
      };
      const observer = new ResizeObserver(align);
      observer.observe(document.querySelector('main'));
      const stop = () => { controller.abort(); observer.disconnect(); };
      ['wheel', 'pointerdown', 'keydown', 'touchstart', 'click'].forEach(type => addEventListener(type, stop, { passive: true, signal: controller.signal }));
      const settled = () => Promise.resolve(document.fonts?.ready).then(() => { align(); setTimeout(stop, 1800); });
      if (document.readyState === 'complete') settled();
      else addEventListener('load', settled, { once: true, signal: controller.signal });
      document.fonts?.ready.then(align);
      align();
    }
  }

  function lightbox(items, onChange) {
    const dialog = document.createElement('dialog');
    dialog.className = 'photo-lightbox';
    dialog.setAttribute('aria-label', 'Photograph viewer');
    dialog.innerHTML = `${command('close', 'Close photograph', 'x')}${command('previous', 'Previous photograph', 'chevron-left')}${command('next', 'Next photograph', 'chevron-right')}<figure><img alt=""></figure><span class="photo-loading" role="status">Loading photograph...</span><span class="photo-counter" aria-live="polite"></span><span class="photo-lightbox-caption"></span>`;
    // Assign positioning classes separately so each button has one class attribute.
    dialog.querySelector('[data-photo-action="close"]').classList.add('photo-close');
    dialog.querySelector('[data-photo-action="previous"]').classList.add('photo-prev');
    dialog.querySelector('[data-photo-action="next"]').classList.add('photo-next');
    document.body.append(dialog); icons();
    let index = 0, request = 0, closing = false, trigger, scroll;
    async function show(next) {
      index = clamp(next, items.length);
      const item = items[index], version = ++request;
      dialog.classList.add('is-switching');
      dialog.setAttribute('aria-busy', 'true');
      const preload = new Image(); preload.src = item.image;
      await Promise.all([preload.decode().catch(() => {}), delay(reduced() ? 0 : 180)]);
      if (version !== request || !dialog.open || closing) return;
      const img = dialog.querySelector('img');
      img.src = item.image; img.alt = item.alt || item.label || '';
      dialog.querySelector('.photo-counter').textContent = count(index, items.length);
      dialog.querySelector('.photo-lightbox-caption').textContent = item.label || '';
      dialog.querySelector('[data-photo-action="previous"]').disabled = index === 0;
      dialog.querySelector('[data-photo-action="next"]').disabled = index === items.length - 1;
      dialog.classList.remove('is-switching'); dialog.setAttribute('aria-busy', 'false');
      onChange?.(index);
    }
    async function close() {
      if (closing || !dialog.open) return;
      closing = true; request++;
      dialog.classList.remove('is-open');
      await delay(reduced() ? 0 : 500);
      dialog.close();
    }
    dialog.addEventListener('close', () => {
      request++; closing = false;
      document.body.classList.remove('photo-dialog-open');
      window.scrollTo({ top: scroll, behavior: 'instant' });
      (trigger?.isConnected ? trigger : document.querySelector('.photo-display'))?.focus({ preventScroll: true });
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      const action = event.target.closest('[data-photo-action]')?.dataset.photoAction;
      if (action === 'close' || event.target === dialog) close();
      else if (action === 'next') show(index + 1);
      else if (action === 'previous') show(index - 1);
    });
    dialog.addEventListener('keydown', event => {
      if (['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); show(index + (event.key === 'ArrowRight' ? 1 : -1)); }
    });
    swipe(dialog, direction => show(index + direction));
    return function open(next, element) {
      if (dialog.open) return;
      trigger = element; scroll = scrollY; closing = false;
      document.body.classList.add('photo-dialog-open'); dialog.showModal();
      dialog.querySelector('[data-photo-action="close"]').focus();
      show(next);
      dialog.getBoundingClientRect(); dialog.classList.add('is-open');
    };
  }

  function setupCommercialDetails(root) {
    const details = root.querySelector('.photo-details');
    const panel = details?.querySelector('.photo-details-panel');
    if (!panel) return;
    const summary = details.querySelector('summary');
    let expanded = details.open, transition;
    summary.addEventListener('click', event => {
      event.preventDefault();
      expanded = !expanded;
      details.classList.toggle('is-expanded', expanded);
      const wasOpen = details.open;
      const current = getComputedStyle(panel);
      const start = { height: wasOpen ? `${panel.getBoundingClientRect().height}px` : '0px', opacity: wasOpen ? current.opacity : 0, transform: wasOpen ? current.transform : 'translateY(-6px)' };
      transition?.cancel();
      if (reduced() || !panel.animate) { details.open = expanded; transition = null; return; }
      details.open = true;
      const animation = panel.animate([start, expanded
        ? { height: `${panel.scrollHeight}px`, opacity: 1, transform: 'translateY(0)' }
        : { height: '0px', opacity: 0, transform: 'translateY(-6px)' }
      ], { duration: expanded ? 400 : 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
      transition = animation;
      animation.finished.then(() => {
        if (transition !== animation) return;
        details.open = expanded;
        animation.cancel(); transition = null;
      }).catch(() => {});
    });
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
      if (event.matches) transition?.finish();
    });
  }

  function gallery(root) {
    const id = new URLSearchParams(location.search).get('collection');
    const item = (window.portfolioAdminPreview ? data.photoCollections || [] : collections).find(collection => collection.id === id);
    if (!item) {
      if (!id) { root.innerHTML = '<div class="photo-empty"><h1>Photography &amp; Film Making</h1><a class="photo-return" href="index.html#photography-works">View Portfolio</a></div>'; return; }
      root.innerHTML = '<div class="photo-empty"><h1>Collection unavailable</h1><a class="photo-return" href="index.html#photography-works">Back to Portfolio</a></div>'; return;
    }
    document.title = `${item.title.replace(/\n/g, ' ')} - Photography & Film Making - Xitao Wang`;
    const back = returnURL(item);
    document.querySelector('.photo-page-header .photo-return').href = back;
    const items = photos(item), isJourney = category(item) !== 'commercial';
    const nextProject = !isJourney ? nextCommercialProject(item) : null;
    const nextProjectLink = nextProject ? `<a class="photo-icon photo-next-project" href="${detailURL(nextProject)}" aria-label="Next project: ${esc(nextProject.title)}" title="Next project: ${esc(nextProject.title)}" hidden>${icon('arrow-right')}<span>Next<br>project</span></a>` : '';
    root.classList.toggle('photo-commercial', !isJourney);
    const detailsMarkup = item.brief ? `<details class="photo-details"><summary><span class="photo-details-chevron" aria-hidden="true">${icon('play')}</span>Details</summary><div class="photo-details-panel"><p>${esc(item.brief)}</p></div></details>` : '';
    const sectionLabel = { commercial: settings.commercialLabel || 'Commercial', journey: settings.journeyLabel || 'Journey', landscape: settings.landscapeLabel || 'Landscape', architecture: settings.architectureLabel || 'Architecture' }[category(item)];
    document.querySelector('.photo-page-header .photo-return').textContent = `Back to ${sectionLabel}`;
    const albumLink = item.spotifyUrl ? `<a class="text-link photo-album-link" href="${esc(item.spotifyUrl)}" target="_blank" rel="noreferrer">Listen on Spotify</a>` : '';
    const followingAlbum = nextAlbum(item);
    const footer = `<footer class="photo-gallery-footer"><a href="${back}">Back to ${esc(sectionLabel)}</a><a href="index.html#portfolios">Portfolio</a>${followingAlbum ? `<a class="button photo-next-album" href="${detailURL(followingAlbum)}" aria-label="Next album: ${esc(followingAlbum.title)}" title="${esc(followingAlbum.title)}">Next album${icon('arrow-right')}</a>` : ''}</footer>`;
    if (!items.length) {
      root.innerHTML = `<div class="photo-gallery-heading"><h1>${esc(item.title)}</h1>${item.year ? `<p>${esc(item.year)}</p>` : ''}${albumLink}</div><div class="photo-empty"><p>Images forthcoming.</p></div>${!isJourney ? detailsMarkup : ''}${footer}`;
      if (item.brief && isJourney) root.querySelector('.photo-gallery-heading').insertAdjacentHTML('beforeend', `<details class="photo-details"><summary>Details</summary><p>${esc(item.brief)}</p></details>`);
      if (!isJourney) setupCommercialDetails(root);
      icons();
      return;
    }
    let current = clamp((Number(location.hash.replace('#photo-', '')) || 1) - 1, items.length);
    const open = lightbox(items, next => { if (!isJourney) setSlide(next); });
    function remember() { history.replaceState(history.state, '', `#photo-${current + 1}`); }
    function setSlide(next) {
      current = clamp(next, items.length);
      const photo = items[current];
      const mount = root.querySelector('.photo-detail-image');
      const focusedDisplay = !!document.activeElement?.closest('.photo-display');
      mount.innerHTML = `<button class="photo-display photo-enter" type="button" aria-label="Enlarge ${esc(photo.label || item.title)}">${media(photo.image, photo.alt || photo.label, '(max-width: 980px) calc(100vw - 88px), 80vw', true)}</button>`;
      mount.querySelector('button').onclick = event => open(current, event.currentTarget);
      if (focusedDisplay) mount.querySelector('button').focus({ preventScroll: true });
      root.querySelectorAll('[data-photo-thumb]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.photoThumb) === current)));
      const thumb = root.querySelector(`[data-photo-thumb="${current}"]`);
      if (thumb) {
        const strip = thumb.parentElement;
        strip.scrollTo({ left: thumb.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + thumb.offsetWidth / 2, behavior: reduced() ? 'instant' : 'smooth' });
      }
      root.querySelector('.photo-detail-controls .photo-counter').textContent = count(current, items.length);
      root.querySelector('[data-photo-action="previous"]').disabled = current === 0;
      const nextButton = root.querySelector('[data-photo-action="next"]');
      const projectLink = root.querySelector('.photo-next-project');
      const focusedNext = document.activeElement === nextButton || document.activeElement === projectLink;
      const isLast = current === items.length - 1;
      nextButton.disabled = isLast;
      nextButton.hidden = isLast && !!nextProject;
      if (projectLink) projectLink.hidden = !isLast;
      if (focusedNext) (nextButton.hidden ? projectLink : nextButton).focus({ preventScroll: true });
      remember();
    }
    if (isJourney) {
      root.innerHTML = `<header class="photo-journey-heading"><h1>${esc(item.title)}</h1>${item.year ? `<span>${esc(item.year)}</span>` : ''}</header><div class="photo-journey-stream">${items.map((photo, i) => `<button class="photo-stream-item" type="button" data-photo-open="${i}" aria-label="Enlarge ${esc(photo.label || item.title)}">${media(photo.image, photo.alt || photo.label, '(max-width: 980px) 96vw, 78vw', i === 0)}</button>`).join('')}</div><span class="photo-stream-counter" aria-label="Current photograph">${count(0, items.length)}</span>${footer}`;
      if (item.brief) root.querySelector('.photo-journey-heading').insertAdjacentHTML('afterend', `<details class="photo-details"><summary>Details</summary><p>${esc(item.brief)}</p></details>`);
      const streamItems = [...root.querySelectorAll('[data-photo-open]')];
      streamItems.forEach(button => button.onclick = () => open(Number(button.dataset.photoOpen), button));
      let queued = false;
      const progress = () => {
        if (queued) return; queued = true;
        requestAnimationFrame(() => {
          queued = false;
          let nearest = 0, distance = Infinity;
          streamItems.forEach((button, i) => { const r = button.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - innerHeight / 2); if (d < distance) { distance = d; nearest = i; } });
          root.querySelector('.photo-stream-counter').textContent = count(nearest, items.length);
        });
      };
      addEventListener('scroll', progress, { passive: true }); progress();
    } else {
      root.innerHTML = `<section class="photo-commercial-gallery" aria-label="${esc(item.title)} photographs"><header class="photo-gallery-heading"><h1>${esc(item.title)}</h1><div class="photo-gallery-sub">${item.year ? `<span>${esc(item.year)}</span>` : ''}${item.location ? `<span>${esc(item.location)}</span>` : ''}</div>${albumLink}</header><div class="photo-detail-viewer">${command('previous', 'Previous photograph', 'chevron-left')}<div class="photo-detail-image"></div><div class="photo-next-slot">${command('next', 'Next photograph', 'chevron-right')}${nextProjectLink}</div></div><div class="photo-detail-controls"><div class="photo-thumbnails" aria-label="Photographs">${items.map((photo, i) => `<button type="button" class="photo-thumbnail" data-photo-thumb="${i}" aria-label="Photograph ${i + 1}: ${esc(photo.label || item.title)}">${media(photo.image, '', '80px')}</button>`).join('')}</div><span class="photo-counter" aria-live="polite"></span></div></section>${detailsMarkup}${footer}`;
      setupCommercialDetails(root);
      root.addEventListener('click', event => {
        const thumb = event.target.closest('[data-photo-thumb]');
        if (thumb) setSlide(Number(thumb.dataset.photoThumb));
        const action = event.target.closest('[data-photo-action]')?.dataset.photoAction;
        if (action === 'previous' || action === 'next') setSlide(current + (action === 'next' ? 1 : -1));
      });
      document.addEventListener('keydown', event => {
        if (event.defaultPrevented || document.querySelector('.photo-lightbox[open]') || event.target.closest('input,textarea,summary')) return;
        if (['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); setSlide(current + (event.key === 'ArrowRight' ? 1 : -1)); }
      });
      let wheelAt = 0;
      root.querySelector('.photo-detail-viewer').addEventListener('wheel', event => {
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        event.preventDefault();
        if (performance.now() - wheelAt < 700 || Math.abs(event.deltaY) < 12) return;
        wheelAt = performance.now(); setSlide(current + Math.sign(event.deltaY));
      }, { passive: false });
      swipe(root.querySelector('.photo-detail-viewer'), direction => setSlide(current + direction));
      setSlide(current);
    }
    icons();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const browser = document.querySelector('[data-photo-browser]');
    if (browser) directory(browser);
    const detail = document.querySelector('#photo-gallery');
    if (detail) {
      gallery(detail);
      window.portfolioUI.revealDetails('.photo-page-header > a, .photo-gallery-heading > h1, .photo-gallery-heading > p, .photo-gallery-heading > .photo-gallery-sub, .photo-album-link, .photo-journey-heading > *, .photo-detail-viewer, .photo-detail-controls, #photo-gallery > .photo-details, .photo-stream-item, .photo-gallery-footer > a, #photo-gallery > .photo-empty');
    }
    document.addEventListener('error', event => {
      if (event.target.tagName !== 'IMG' || !event.target.closest('.photo-browser,.photo-detail-main,.photo-lightbox')) return;
      event.target.alt = 'Image unavailable';
      event.target.classList.add('photo-media-error');
    }, true);
  });
})();
