(function () {
  let busy = false;

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function paintedHeader() {
    const header = document.querySelector?.('.site-header');
    if (!header) return null;
    const copy = header.cloneNode(true);
    const targets = [copy, ...copy.querySelectorAll('*')];
    const properties = ['display', 'position', 'box-sizing', 'width', 'height', 'padding', 'gap',
      'align-items', 'justify-content', 'flex-wrap', 'flex-direction', 'grid-template-columns',
      'font', 'color', 'background', 'border-bottom', 'text-transform', 'text-decoration',
      'white-space', 'line-height', 'margin'];
    // Freeze the outgoing white navigation before the live destination turns black.
    [header, ...header.querySelectorAll('*')].forEach((element, index) => {
      const target = targets[index], style = getComputedStyle(element);
      properties.forEach(property => target.style.setProperty(property, style.getPropertyValue(property)));
      target.removeAttribute('id');
      target.style.transition = 'none';
    });
    const rect = header.getBoundingClientRect();
    copy.className = 'portfolio-portal-header';
    copy.inert = true;
    Object.assign(copy.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`, visibility: 'visible', opacity: '1', transform: 'none' });
    return copy;
  }

  window.portfolioPortal = {
    get busy() { return busy; },

    async reveal(link, prepare, complete) {
      if (busy) return;
      busy = true;
      const crossEntry = link.dataset.portfolioTransition === "cross";
      const headerSnapshot = crossEntry ? null : paintedHeader();
      const controls = crossEntry ? [...document.querySelectorAll('.floating-primary:not([hidden]), .section-rail')].map(control => {
        const copy = control.cloneNode(true), bounds = control.getBoundingClientRect();
        const fill = copy.querySelector('#rail-progress'), liveFill = control.querySelector('#rail-progress');
        if (fill && liveFill) {
          const paint = getComputedStyle(liveFill);
          ['position', 'left', 'top', 'width', 'height', 'background', 'border-radius'].forEach(property => fill.style.setProperty(property, paint.getPropertyValue(property)));
        }
        [copy, ...copy.querySelectorAll('[id]')].forEach(element => element.removeAttribute('id'));
        copy.inert = true;
        Object.assign(copy.style, { position: 'fixed', left: `${bounds.left}px`, top: `${bounds.top}px`,
          width: `${bounds.width}px`, height: `${bounds.height}px`, right: 'auto', bottom: 'auto', margin: '0', transform: 'none', pointerEvents: 'none' });
        return copy;
      }) : [];
      window.dispatchEvent(new Event('portfolio-navigation-prepare'));
      const chooser = link.closest(".portfolio-choice") || link.closest(".portfolio-entry");
      const rect = link.getBoundingClientRect();
      const reduced = window.portfolioUI.reducedMotion();
      const hovered = link.matches?.(":hover, :focus-visible");
      const previewCircle = link.querySelector?.(".portfolio-choice-preview");
      const previewRect = !reduced && (hovered || crossEntry) && previewCircle ? previewCircle.getBoundingClientRect() : null;
      const initialRadius = previewRect ? previewRect.width / 2 : 0;
      const x = previewRect ? previewRect.left + previewRect.width / 2 : rect.left + rect.width / 2;
      const y = previewRect ? previewRect.top + previewRect.height / 2 : rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4;
      const overlay = document.createElement("div");
      overlay.className = "portfolio-portal";
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.setProperty("--portal-x", `${x}px`);
      overlay.style.setProperty("--portal-y", `${y}px`);
      overlay.style.setProperty("--portal-radius", `${initialRadius}px`);
      const snapshot = chooser.cloneNode(true);
      overlay.style.setProperty("--choice-left", `${chooser.getBoundingClientRect().left}px`);
      overlay.style.setProperty("--choice-width", `${chooser.getBoundingClientRect().width}px`);
      snapshot.removeAttribute("id");
      snapshot.removeAttribute("data-snap-stop");
      if (crossEntry) snapshot.classList.add('portfolio-portal-source');
      snapshot.style.top = `${chooser.getBoundingClientRect().top}px`;
      snapshot.style.height = `${chooser.getBoundingClientRect().height}px`;
      snapshot.querySelectorAll("a").forEach((item) => {
        item.tabIndex = -1;
        if (item.dataset.portfolio === link.dataset.portfolio) item.classList.add("is-pressed");
      });
      const outgoing = document.createElement('div');
      outgoing.className = 'portfolio-portal-outgoing';
      if (crossEntry) outgoing.style.background = 'var(--paper)';
      outgoing.append(snapshot);
      if (headerSnapshot) outgoing.append(headerSnapshot);
      controls.forEach(control => outgoing.append(control));
      overlay.append(outgoing);
      let previewOpacity = 1;
      if (initialRadius > 0) {
        const preview = document.createElement('div');
        const appearance = getComputedStyle(previewCircle);
        preview.className = 'portfolio-portal-preview';
        preview.style.backgroundImage = appearance.backgroundImage;
        preview.style.backgroundColor = appearance.backgroundColor;
        preview.style.backgroundBlendMode = appearance.backgroundBlendMode;
        previewOpacity = Number(appearance.opacity);
        overlay.style.setProperty('--portal-preview-size', `${initialRadius * 2}px`);
        overlay.style.setProperty('--portal-preview-opacity', appearance.opacity);
        overlay.append(preview);
      }
      document.body.append(overlay);
      const oldScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      document.body.classList.add("is-opening-portfolio");
      chooser.inert = true;
      link.setAttribute("aria-busy", "true");

      // The outgoing page is the mask; the live destination stays underneath it.
      const blockScroll = (event) => event.preventDefault();
      const blockClick = (event) => { event.preventDefault(); event.stopImmediatePropagation(); };
      const blockKeys = (event) => {
        if (["Tab", " ", "PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp"].includes(event.key)) event.preventDefault();
      };
      window.addEventListener("wheel", blockScroll, { passive: false });
      window.addEventListener("touchmove", blockScroll, { passive: false });
      window.addEventListener("keydown", blockKeys);
      window.addEventListener("pointerdown", blockClick, true);
      window.addEventListener("click", blockClick, true);

      try {
        await Promise.all([
          prepare(),
          wait(reduced ? 0 : 100).then(() => overlay.classList.add("is-label-fading"))
        ]);
        await wait(reduced ? 0 : 150);
        window.dispatchEvent(new Event('portfolio-navigation-reveal'));
        if (reduced) {
          if (overlay.animate) await overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120 }).finished;
        } else {
          await new Promise((resolve) => {
            const start = performance.now();
            const draw = (now) => {
              const progress = Math.min(1, (now - start) / 1050);
              const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
              const currentRadius = initialRadius + (radius - initialRadius) * eased;
              overlay.style.setProperty("--portal-radius", `${currentRadius}px`);
              if (initialRadius > 0) {
                const fade = Math.min(1, (now - start) / 650);
                overlay.style.setProperty('--portal-preview-scale', String(currentRadius / initialRadius));
                overlay.style.setProperty('--portal-preview-opacity', String(previewOpacity * (1 - fade) ** 3));
              }
              if (progress < 1) requestAnimationFrame(draw);
              else resolve();
            };
            requestAnimationFrame(draw);
          });
        }
        complete();
      } catch (error) {
        // Native links remain a usable fallback, including file:// previews.
        window.location.assign(link.href);
      } finally {
        overlay.remove();
        document.documentElement.style.scrollBehavior = oldScrollBehavior;
        document.body.classList.remove("is-opening-portfolio");
        chooser.inert = false;
        link.removeAttribute("aria-busy");
        window.removeEventListener("wheel", blockScroll);
        window.removeEventListener("touchmove", blockScroll);
        window.removeEventListener("keydown", blockKeys);
        window.removeEventListener("pointerdown", blockClick, true);
        window.removeEventListener("click", blockClick, true);
        busy = false;
        window.dispatchEvent(new Event('portfolio-navigation-finish'));
      }
    }
  };
})();
