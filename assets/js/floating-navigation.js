(function () {
  function init() {
    const header = document.querySelector('.site-header');
    const source = header?.querySelector('.top-nav');
    const primary = document.querySelector('.floating-primary');
    const rail = document.querySelector('.section-rail');
    const branch = document.querySelector('#architecture-portfolio');
    if (!source || !primary || !rail || !branch) return;
    const primaryPanel = primary.querySelector('nav');
    let active = false, queued = false;
    let initialized = false, morph = null, entrySnapshot = null, portalWaiting = false;
    let skipInitialEntry = branch.contains(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    const menus = [
      { root: primary, panel: primaryPanel, button: primary.querySelector('button'), label: 'site navigation' }
    ];
    const progressDock = { root: rail, panel: rail, engaged: false };
    const backdrop = document.createElement('div');
    backdrop.className = 'navigation-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.append(backdrop);
    window.lucide?.createIcons();
    function paintedLabel(link) {
      const rect = link.getBoundingClientRect(), style = getComputedStyle(link);
      const label = document.createElement('div');
      label.className = 'nav-morph-label';
      label.append(...[...link.childNodes].map(node => node.cloneNode(true)));
      Object.assign(label.style, {
        left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
        font: style.font, color: 'var(--ink)', textTransform: style.textTransform,
        display: style.display, gap: style.gap, padding: style.padding,
        alignItems: style.alignItems, justifyContent: style.justifyContent, flexDirection: style.flexDirection,
        whiteSpace: style.whiteSpace, boxSizing: style.boxSizing,
        borderBottom: style.borderBottom, textAlign: style.textAlign
      });
      label.style.borderBottomColor = 'var(--ink)';
      [...label.querySelectorAll('*')].forEach((element, index) => {
        element.style.font = getComputedStyle(link.querySelectorAll('*')[index]).font;
      });
      return { label, rect };
    }
    function captureEntry() {
      return {
        header: header.getBoundingClientRect(),
        links: [...source.querySelectorAll('a')].filter(link => link.getClientRects().length).map(paintedLabel),
        brand: paintedLabel(header.querySelector('.brand'))
      };
    }
    function cancelMorph() {
      if (morph) {
        const previous = morph;
        morph = null;
        previous.animations.forEach(animation => animation.cancel());
        previous.scene.remove();
      }
      document.body.classList.remove('is-navigation-morphing');
      document.body.classList.remove('is-navigation-staged');
    }
    function morphEntry(snapshot) {
      cancelMorph();
      if (!active || window.portfolioUI.reducedMotion() || !primary.animate) return;
      const scene = document.createElement('div');
      scene.className = 'navigation-morph';
      scene.setAttribute('aria-hidden', 'true');
      scene.inert = true;
      const state = { scene, animations: [] };
      morph = state;
      document.body.classList.add('is-navigation-morphing');
      document.body.append(scene);
      const play = (element, frames, options) => {
        const animation = element.animate(frames, { fill: 'both', ...options, delay: 150 + (options.delay || 0) });
        state.animations.push(animation);
        return animation.finished.catch(() => {});
      };
      const center = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      const right = center(menus[0].button.getBoundingClientRect());
      const circleStyle = getComputedStyle(menus[0].button, '::before');
      const diameter = parseFloat(circleStyle.width), small = 28 / diameter;
      const circleOrigin = { x: document.documentElement.clientWidth - 26, y: Math.max(24, Math.min(60, snapshot.header.height / 2)) };
      const circle = document.createElement('div');
      circle.className = 'nav-morph-circle';
      Object.assign(circle.style, { left: `${circleOrigin.x - diameter / 2}px`, top: `${circleOrigin.y - diameter / 2}px`, width: `${diameter}px`, height: `${diameter}px` });
      scene.append(circle);
      const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
      const travelStart = 410 + Math.max(0, snapshot.links.length - 1) * 190 + 210;
      const total = travelStart + 620;
      scene.append(snapshot.brand.label);
      play(snapshot.brand.label, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: ease });
      const dotFrames = [
        { transform: 'translate(0, 0) scale(0)', opacity: 0, offset: 0 },
        { transform: `translate(0, 0) scale(${small})`, opacity: 1, offset: 120 / total }
      ];
      // Each arriving label has its own short compression/rebound before the final travel.
      [...snapshot.links].reverse().forEach(({ label, rect }, index) => {
        const arrival = 410 + index * 190;
        const from = center(rect);
        scene.append(label);
        play(label, [
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${circleOrigin.x - from.x}px, ${circleOrigin.y - from.y}px) scale(.08)`, opacity: 0 }
        ], { duration: 260, delay: 150 + index * 190, easing: 'cubic-bezier(0.4, 0, 1, 1)' });
        [[arrival, small], [arrival + 38, small * .78], [arrival + 98, small * 1.16], [arrival + 150, small]].forEach(([time, scale]) => {
          dotFrames.push({ transform: `translate(0, 0) scale(${scale})`, opacity: 1, offset: time / total, easing: ease });
        });
      });
      dotFrames.push(
        { transform: `translate(0, 0) scale(${small})`, opacity: 1, offset: travelStart / total, easing: ease },
        { transform: `translate(${right.x - circleOrigin.x}px, ${right.y - circleOrigin.y}px) scale(1)`, opacity: 1, offset: 1 }
      );
      const circleDone = play(circle, dotFrames, { duration: total, easing: 'linear' });
      circleDone.then(() => {
        if (morph === state) cancelMorph();
      });
    }
    function wrapDock(link) {
      if (link.firstElementChild?.classList.contains('nav-dock-content')) return link.firstElementChild;
      const content = document.createElement('div');
      content.className = 'nav-dock-content';
      content.append(...link.childNodes);
      link.append(content);
      return content;
    }
    function animateDock(menu) {
      if (menu.dockFrame) return;
      let previousTime;
      const draw = now => {
        menu.dockFrame = 0;
        const links = [...menu.panel.querySelectorAll('a')];
        const open = menu === progressDock ? active && menu.engaged : menu.root.classList.contains('is-open');
        const reduced = window.portfolioUI.reducedMotion();
        const pointer = open && !reduced ? menu.pointerY : null;
        const focused = open && !reduced ? menu.focusedLink : null;
        const gain = Number(getComputedStyle(menu.root).getPropertyValue('--dock-gain')) || .4;
        const blend = reduced ? 1 : 1 - Math.exp(-Math.min(48, previousTime ? now - previousTime : 16) / 65);
        previousTime = now;
        const focusCenter = focused?.getBoundingClientRect();
        const y = pointer ?? (focusCenter ? focusCenter.top + focusCenter.height / 2 : null);
        const progressEdge = menu === progressDock ? branch.getBoundingClientRect().left - 12 : null;
        const measurements = links.map(link => {
          const content = wrapDock(link), rect = content.getBoundingClientRect();
          const row = link.getBoundingClientRect(), current = Number(content.style.getPropertyValue('--dock-scale')) || 1;
          const distance = y === null ? Infinity : Math.abs(y - row.top - row.height / 2);
          const reach = row.height * 2.4;
          const weight = distance < reach ? (1 + Math.cos(Math.PI * distance / reach)) / 2 : 0;
          const width = rect.width / current;
          const available = menu.root === primary ? rect.right - 8 : progressEdge - rect.left;
          const target = Math.max(1, Math.min(1 + gain * weight, available / Math.max(1, width)));
          return { content, current, target };
        });
        let unsettled = false;
        measurements.forEach(({ content, current, target }) => {
          const next = Math.abs(target - current) < .001 ? target : current + (target - current) * blend;
          content.style.setProperty('--dock-scale', next.toFixed(4));
          if (Math.abs(next - target) >= .001) unsettled = true;
        });
        if (unsettled) menu.dockFrame = requestAnimationFrame(draw);
      };
      menu.dockFrame = requestAnimationFrame(draw);
    }
    function resetDock(menu) {
      menu.pointerY = null;
      menu.focusedLink = null;
      if (menu === progressDock) menu.engaged = false;
      animateDock(menu);
    }
    function announceLayout() { window.dispatchEvent(new Event('portfolio-navigation-change')); }
    function setOpen(menu, open, restoreFocus = false) {
      open = !!open && active && !morph && !portalWaiting;
      clearTimeout(menu.leaveTimer);
      if (open) menus.filter(item => item !== menu).forEach(item => setOpen(item, false));
      menu.root.classList.toggle('is-open', open);
      menu.button.setAttribute('aria-expanded', String(open));
      menu.button.setAttribute('aria-label', `${open ? 'Close' : 'Open'} ${menu.label}`);
      menu.button.title = `${open ? 'Close' : 'Open'} ${menu.label}`;
      menu.panel.inert = active && !open;
      if (active) menu.panel.setAttribute('aria-hidden', String(!open));
      else menu.panel.removeAttribute('aria-hidden');
      if (restoreFocus) menu.button.focus({ preventScroll: true });
      if (!open) resetDock(menu);
      document.body.classList.toggle('is-navigation-menu-open', menus.some(item => item.root.classList.contains('is-open')));
      announceLayout();
    }
    function syncCurrent() {
      const current = rail.querySelector('.is-active')?.getAttribute('href');
      primaryPanel.querySelectorAll('a').forEach(link => {
        if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function syncLinks() {
      primaryPanel.replaceChildren(...[...source.querySelectorAll('a')].filter(link => !link.hidden).map((link, index) => {
        const copy = link.cloneNode(true);
        copy.removeAttribute('id');
        copy.style.setProperty('--nav-order', index);
        wrapDock(copy);
        return copy;
      }));
      rail.querySelectorAll('a').forEach(wrapDock);
      syncCurrent();
    }
    function update() {
      queued = false;
      const enabled = !branch.hidden && branch.getBoundingClientRect().top <= window.portfolioUI.headerHeight() + 40;
      if (!enabled && !branch.contains(document.getElementById(decodeURIComponent(location.hash.slice(1))))) skipInitialEntry = false;
      if (enabled !== active) {
        const snapshot = enabled && initialized && !skipInitialEntry ? entrySnapshot || captureEntry() : null;
        if (enabled) skipInitialEntry = false;
        const focusWasFloating = menus.some(menu => menu.root.contains(document.activeElement)) || rail.contains(document.activeElement);
        active = enabled;
        document.body.classList.toggle('is-floating-navigation', active);
        header.inert = active;
        if (active) header.setAttribute('aria-hidden', 'true');
        else header.removeAttribute('aria-hidden');
        primary.hidden = !active;
        rail.inert = !active;
        rail.setAttribute('aria-hidden', String(!active));
        menus.forEach(menu => setOpen(menu, false));
        resetDock(progressDock);
        if (!active) {
          cancelMorph();
          entrySnapshot = null;
          portalWaiting = false;
        } else if (snapshot) {
          if (portalWaiting) document.body.classList.add('is-navigation-staged');
          else morphEntry(snapshot);
        }
        if (!active && focusWasFloating) {
          ([...source.querySelectorAll('a')].find(link => link.hash === location.hash) || source.querySelector('a')).focus({ preventScroll: true });
        }
      }
      initialized = true;
      syncCurrent();
    }
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    rail.addEventListener('pointermove', event => {
      if (!active || event.pointerType === 'touch') return;
      progressDock.engaged = true;
      progressDock.pointerY = event.clientY;
      progressDock.focusedLink = null;
      animateDock(progressDock);
    }, { passive: true });
    rail.addEventListener('pointerleave', () => {
      progressDock.pointerY = null;
      progressDock.focusedLink = rail.contains(document.activeElement) ? document.activeElement.closest('a') : null;
      progressDock.engaged = !!progressDock.focusedLink;
      animateDock(progressDock);
    });
    rail.addEventListener('focusin', event => {
      if (!active) return;
      progressDock.engaged = true;
      progressDock.pointerY = null;
      progressDock.focusedLink = event.target.closest('a');
      animateDock(progressDock);
    });
    rail.addEventListener('focusout', () => setTimeout(() => {
      if (!rail.contains(document.activeElement)) resetDock(progressDock);
    }, 0));
    menus.forEach(menu => {
      menu.panel.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' || !menu.root.classList.contains('is-open')) return;
        menu.pointerY = event.clientY;
        menu.focusedLink = null;
        animateDock(menu);
      }, { passive: true });
      menu.panel.addEventListener('pointerleave', () => resetDock(menu));
      menu.button.addEventListener('click', () => setOpen(menu, !menu.root.classList.contains('is-open')));
      menu.root.addEventListener('focusin', event => {
        if (active && menu.panel.contains(event.target)) {
          setOpen(menu, true);
          menu.pointerY = null;
          menu.focusedLink = event.target.closest('a');
          animateDock(menu);
        }
      });
      menu.root.addEventListener('focusout', () => setTimeout(() => {
        if (!menu.root.contains(document.activeElement)) setOpen(menu, false);
      }, 0));
      menu.panel.addEventListener('click', event => {
        if (event.target.closest('a') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) setOpen(menu, false, true);
      });
    });
    document.addEventListener('pointerdown', event => {
      menus.forEach(menu => { if (!menu.root.contains(event.target)) setOpen(menu, false); });
    });
    document.addEventListener('focusin', event => {
      menus.forEach(menu => { if (!menu.root.contains(event.target)) setOpen(menu, false); });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const open = menus.find(menu => menu.root.classList.contains('is-open'));
        if (open) { event.preventDefault(); setOpen(open, false, true); }
      }
    });
    new MutationObserver(syncLinks).observe(source, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
    new MutationObserver(syncCurrent).observe(rail, { attributes: true, subtree: true, attributeFilter: ['class'] });
    new MutationObserver(schedule).observe(branch, { attributes: true, attributeFilter: ['hidden'] });
    ['scroll', 'resize', 'hashchange', 'popstate', 'pageshow'].forEach(type => addEventListener(type, schedule, { passive: true }));
    document.fonts?.ready.then(schedule);
    addEventListener('portfolio-navigation-prepare', () => {
      if (active) return;
      skipInitialEntry = false;
      entrySnapshot = captureEntry();
      portalWaiting = true;
      document.body.classList.add('is-navigation-staged');
    });
    addEventListener('portfolio-navigation-finish', () => {
      if (portalWaiting) {
        const snapshot = active ? captureEntry() : entrySnapshot;
        portalWaiting = false;
        entrySnapshot = null;
        if (active && snapshot) morphEntry(snapshot);
        else cancelMorph();
      }
    });
    addEventListener('resize', () => {
      resetDock(progressDock);
      if (portalWaiting) { entrySnapshot = captureEntry(); return; }
      entrySnapshot = null;
      cancelMorph();
    });
    addEventListener('pagehide', cancelMorph);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (!portalWaiting) cancelMorph();
      menus.forEach(resetDock);
      resetDock(progressDock);
    });
    syncLinks(); update();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
