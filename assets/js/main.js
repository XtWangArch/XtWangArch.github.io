(function () {
  const data = window.portfolioData;
  const escapeText = window.portfolioText.escape;

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const text = (value, fallback = "") => value || fallback;

  function mediaMarkup(image, label, sizes = "100vw") {
    if (image) {
      return `<img ${window.portfolioMedia.attributes(image, sizes)} alt="${escapeText(label)}" loading="lazy">`;
    }

    return `<div class="visual-placeholder" aria-label="${escapeText(label)}"><span>${escapeText(label)}</span></div>`;
  }

  function pageTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function snapTop(stop) {
    if (stop.dataset.snapKind !== "project") return pageTop(stop);
    const header = window.portfolioUI.headerHeight();
    if (window.innerWidth <= 980) return Math.max(0, pageTop(stop) - header - 24);
    const elements = [stop.querySelector(".project-media"), stop.querySelector(".project-content")].filter(Boolean);
    // Reveal transforms must not shift the final project snap destination.
    const layoutTop = (element) => {
      let top = 0;
      for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
      return top;
    };
    const top = Math.min(...elements.map(layoutTop));
    const bottom = Math.max(...elements.map((element) => layoutTop(element) + element.offsetHeight));
    const center = header + (window.innerHeight - header) / 2;
    return Math.min(document.documentElement.scrollHeight - innerHeight, Math.max(0, (top + bottom) / 2 - center));
  }

  function setupPortfolioChoice() {
    const chooser = document.querySelector("#portfolios");
    const architecture = document.querySelector("#architecture-portfolio");
    const works = document.querySelector("#selected-works");
    const photography = document.querySelector("#photography-works");
    if (!chooser || !architecture) return;
    const hashTarget = () => document.getElementById(decodeURIComponent(location.hash.slice(1)));
    architecture.hidden = !architecture.contains(hashTarget());
    let rememberedBranch;
    try { rememberedBranch = sessionStorage.getItem("portfolio-branch"); } catch (_) {}
    const selectBranch = (isPhoto) => {
      works.hidden = isPhoto;
      photography.hidden = !isPhoto;
      document.querySelector('#other-work').hidden = isPhoto;
      const progressLinks = [...document.querySelector('.section-rail').querySelectorAll('[data-section-link]')];
      [...document.querySelectorAll('.site-header .top-nav a[href="#other-work"]'), ...progressLinks.filter(link => link.dataset.sectionLink === 'other-work')].forEach(link => { link.hidden = isPhoto; });
      document.body.dataset.activePortfolio = isPhoto ? "photography" : "architecture";
      progressLinks.filter(link => !link.hidden).forEach((link, index) => {
        link.querySelector('span').textContent = String(index + 1).padStart(2, '0');
      });
      renderOtherWork();
      try { sessionStorage.setItem("portfolio-branch", isPhoto ? "photography" : "architecture"); } catch (_) {}
    };
    const initialTarget = hashTarget();
    selectBranch(initialTarget === photography || initialTarget?.closest('#photography-works') || (
      initialTarget && architecture.contains(initialTarget) && !works.contains(initialTarget)
      && initialTarget.id !== "other-work"
      && rememberedBranch === "photography"
    ));

    function alignWorksEntry() {
      const first = works.querySelector('.project-card');
      if (!first || !works.getClientRects().length) return;
      const current = parseFloat(works.style.getPropertyValue('--works-entry-space')) || 0;
      // Tall screens need extra leading space so centering never exposes the chooser.
      const extra = innerWidth <= 980 ? 0 : Math.max(0, Math.ceil(current + pageTop(works) - snapTop(first)));
      if (extra !== current) works.style.setProperty('--works-entry-space', `${extra}px`);
    }
    alignWorksEntry();
    const entryObserver = new ResizeObserver(alignWorksEntry);
    [works, works.querySelector('.project-media'), works.querySelector('.project-content'), document.querySelector('.site-header')]
      .filter(Boolean).forEach(element => entryObserver.observe(element));
    document.fonts?.ready.then(alignWorksEntry);
    window.addEventListener('resize', alignWorksEntry);

    const navigationTop = (target) => {
      if (target === works || works.contains(target)) alignWorksEntry();
      if (!["selected-works", "photography-works"].includes(target.id)) {
        if (target.dataset.snapKind === "project") return snapTop(target);
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        return Math.max(0, pageTop(target) - margin);
      }
      if (innerWidth <= 980) return Math.ceil(pageTop(target));
      return target.querySelector('.project-card') ? snapTop(target.querySelector('.project-card')) : pageTop(target);
    };

    const enterArchitecture = (target) => {
      architecture.hidden = false;
      const stop = target.querySelector(".project-card") || target;
      window.scrollTo({ top: navigationTop(target), behavior: "instant" });
      return stop;
    };

    let cancelSectionNavigation = () => {};
    function navigateToSection(target) {
      cancelSectionNavigation();
      const token = {};
      const inputs = new AbortController();
      let frame = 0, settled = 0;
      const start = performance.now();
      window.portfolioUI.sectionNavigation = token;
      const clear = () => {
        cancelAnimationFrame(frame);
        inputs.abort();
        if (window.portfolioUI.sectionNavigation === token) delete window.portfolioUI.sectionNavigation;
      };
      cancelSectionNavigation = clear;
      ['wheel', 'touchstart', 'pointerdown', 'keydown', 'pagehide'].forEach(type => {
        window.addEventListener(type, clear, { capture: true, passive: true, signal: inputs.signal });
      });
      const top = () => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, navigationTop(target)));
      const check = now => {
        settled = Math.abs(scrollY - top()) < 2 ? settled + 1 : 0;
        if (settled >= 2 || now - start > 2200) {
          window.scrollTo({ top: top(), behavior: 'instant' });
          clear();
          return;
        }
        frame = requestAnimationFrame(check);
      };
      alignWorksEntry();
      window.scrollTo({ top: top(), behavior: window.portfolioUI.reducedMotion() ? 'instant' : 'smooth' });
      frame = requestAnimationFrame(check);
    }

    // Hidden branches must be opened before resolving navigation or return anchors.
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.hasAttribute("data-portfolio") || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (target === chooser) {
        event.preventDefault();
        history.pushState(null, "", "#portfolios");
        window.scrollTo({ top: pageTop(chooser), behavior: window.portfolioUI.reducedMotion() ? "instant" : "smooth" });
        return;
      }
      if (!target || !architecture.contains(target)) return;
      event.preventDefault();
      architecture.hidden = false;
      if (target.id === 'other-work') selectBranch(false);
      const destination = target === works && !photography.hidden ? photography : target;
      history.pushState(null, "", `#${destination.id}`);
      navigateToSection(destination);
    });

    window.addEventListener("hashchange", () => {
      const target = hashTarget();
      if (!target || window.portfolioPortal?.busy) return;
      if (architecture.contains(target)) {
        if (target === photography) selectBranch(true);
        else if (target === works || target.closest("#selected-works") || target.id === "other-work") selectBranch(false);
        enterArchitecture(target);
      }
      else if (target === chooser) window.scrollTo({ top: pageTop(chooser), behavior: "instant" });
    });

    document.querySelectorAll(".portfolio-choice-link[data-portfolio]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (!window.portfolioPortal) {
          selectBranch(link.dataset.portfolio === "photography");
          architecture.hidden = false;
          return;
        }
        event.preventDefault();
        if (window.portfolioPortal.busy) return;
        history.replaceState(null, "", link.dataset.portfolioTransition === "cross" ? "#other-work" : "#portfolios");
        if (link.dataset.portfolio === "architecture") {
          let first;
          window.portfolioPortal.reveal(link, async () => {
            selectBranch(false);
            first = enterArchitecture(document.querySelector("#selected-works"));
            first.closest(".work-group")?.classList.add("is-visible");
            const focusTarget = first.querySelector('.project-media') || first;
            focusTarget.focus({ preventScroll: true });
            const image = first.querySelector("img");
            if (image) {
              image.loading = "eager";
              await Promise.race([image.decode().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1800))]);
            }
          }, () => {
            window.scrollTo({ top: navigationTop(document.querySelector("#selected-works")), behavior: "instant" });
            history.pushState(null, "", "#selected-works");
            const focusTarget = first.querySelector('.project-media') || first;
            focusTarget.tabIndex = focusTarget.tabIndex < 0 ? -1 : focusTarget.tabIndex;
            focusTarget.focus({ preventScroll: true });
          });
        } else {
          window.portfolioPortal.reveal(link, async () => {
            selectBranch(true);
            const ready = window.photographyDirectory?.reset();
            enterArchitecture(photography);
            await ready;
          }, () => {
            history.pushState(null, "", "#photography-works");
            photography.focus({ preventScroll: true });
          });
        }
      });
    });
  }

  function projectCard(project, index, anchor = 'selected-works') {
    const href = `project.html?project=${encodeURIComponent(project.id)}`;
    const alignment = index % 2 === 0 ? "is-image-left" : "is-image-right";
    const snapAnchor = index === 0 ? ` data-snap-anchor="${anchor}"` : "";

    return `
      <article id="work-${project.id}" class="project-card ${alignment}" data-project-id="${project.id}" data-snap-stop data-snap-kind="project"${snapAnchor}>
        <a class="project-media" href="${href}" aria-label="View ${escapeText(project.title)}">
          ${mediaMarkup(project.cover, project.title, "(max-width: 980px) calc(100vw - 40px), 60vw")}
          <span class="project-media-title">${escapeText(project.title)}</span>
        </a>
        <a class="project-content" href="${href}" aria-label="View ${escapeText(project.title)}">
          <h4>${escapeText(project.title)}</h4>
          <dl class="metadata">
            <div><dt>Year</dt><dd>${escapeText(project.year)}</dd></div>
            <div><dt>Location</dt><dd>${escapeText(project.location)}</dd></div>
            <div><dt>Type</dt><dd>${escapeText(project.type)}</dd></div>
            <div><dt>Role</dt><dd>${escapeText(project.role)}</dd></div>
          </dl>
        </a>
      </article>
    `;
  }

  function renderProjects() {
    renderProjectBranch(data.projects.filter(p => p.portfolio !== 'photography'), '#work-groups', 'selected-works');
  }

  function renderProjectBranch(projects, selector, anchor) {
    const container = document.querySelector(selector);
    if (!container) return;
    let projectIndex = 0;

    const groups = projects.reduce((result, project) => {
      if (!result[project.category]) result[project.category] = [];
      result[project.category].push(project);
      return result;
    }, {});

    container.innerHTML = Object.entries(groups)
      .map(([category, projects]) => `
        <section class="work-group" aria-label="${escapeText(category)}">
          <div class="work-group-header">
            <h3>${escapeText(category)}</h3>
          </div>
          <div class="project-grid">
            ${projects.map((project) => projectCard(project, projectIndex++, anchor)).join("")}
          </div>
        </section>
      `)
      .join("");
  }

  function setupProjectReturn() {
    const match = window.location.hash.match(/^#work-(.+)$/);
    if (!match) return;

    const target = document.getElementById(`work-${match[1]}`);
    if (!target) return;

    let cancelled = false;
    const userInput = new AbortController();
    const cancelAlignment = () => {
      cancelled = true;
      userInput.abort();
    };
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) => {
      window.addEventListener(type, cancelAlignment, { passive: true, signal: userInput.signal });
    });

    const alignToProject = () => {
      if (cancelled) return;
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: snapTop(target), behavior: "instant" });
      window.requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
      });
    };

    target.querySelectorAll("img").forEach((image) => {
      if (image.complete) return;
      image.addEventListener("load", alignToProject, { once: true });
    });

    window.requestAnimationFrame(alignToProject);
    [80, 240, 520, 900, 1400].forEach((delay) => {
      window.setTimeout(alignToProject, delay);
    });
    window.addEventListener("load", alignToProject, { once: true });
    window.setTimeout(cancelAlignment, 1600);
  }

  function renderTimeline() {
    const container = document.querySelector("#timeline-list");
    if (!container) return;

    const groups = [
      ["Work Experience", data.experience || []],
      ["Education", data.education || []],
      ["Activity", data.researchExperience || []]
    ];

    container.innerHTML = groups
      .map(([label, items]) => {
        const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return `
        <section class="cv-section cv-section-${slug}" aria-label="${label}">
          <h3>${label}</h3>
          <div class="cv-list">
            ${items
              .map((item) => `
                <article class="cv-row">
                  <div>
                    <h4>${window.portfolioText.recordLink(item)}</h4>
                    <div class="cv-meta-line">
                      <time>${escapeText(item.date || item.year || "")}</time>
                      ${item.subtitle ? `<span>${escapeText(item.subtitle)}</span>` : ""}
                    </div>
                    ${item.description ? `<p class="cv-description">${window.portfolioText.rich(item.description)}</p>` : ""}
                    ${
                      item.details
                        ? `<ul class="cv-detail-list">${item.details.map((detail) => `<li>${window.portfolioText.rich(detail)}</li>`).join("")}</ul>`
                        : ""
                    }
                  </div>
                </article>
              `)
              .join("")}
          </div>
        </section>
      `;
      })
      .join("");
  }

  function renderOtherWork() {
    const preview = document.querySelector("#other-work .portfolio-choice-preview");
    if (!preview) return;
    const source = data.photography?.[0]?.image || "assets/images/photography/preview.png";
    const variants = window.portfolioImageManifest?.[source]?.sources;
    const image = variants?.find(item => item.width >= 960)?.src || source;
    preview.style.backgroundImage = `url(${JSON.stringify(image)})`;
  }

  function setScrolledState() {
    document.body.classList.toggle("has-scrolled", window.scrollY > 24);
    const chooser = document.querySelector("#portfolios");
    if (chooser) {
      const rect = chooser.getBoundingClientRect();
      document.body.classList.toggle("is-choosing-portfolio", rect.top <= innerHeight * 0.3 && rect.bottom >= innerHeight * 0.7);
    }
  }

  function setupProfileLayout() {
    const panel = document.querySelector(".profile-panel");
    const image = panel?.querySelector(".profile-panel-media");
    if (!image) return;

    const alignFrames = () => {
      panel.style.setProperty("--profile-frame-size", `${image.getBoundingClientRect().width}px`);
    };
    alignFrames();
    new ResizeObserver(alignFrames).observe(image);
  }

  function setupMoreAbout() {
    const disclosure = document.querySelector(".more-about");
    const summary = disclosure?.querySelector("summary");
    const content = disclosure?.querySelector("p");
    if (!summary || !content) return;

    summary.addEventListener("click", (event) => {
      if (disclosure.open || !disclosure.animate) return;
      event.preventDefault();
      const startHeight = disclosure.getBoundingClientRect().height;
      const focusWasOnSummary = document.activeElement === summary;
      disclosure.open = true;
      const endHeight = disclosure.getBoundingClientRect().height;
      if (focusWasOnSummary) {
        content.tabIndex = -1;
        content.focus({ preventScroll: true });
      }
      const finish = () => {
        disclosure.style.overflow = "";
      };
      if (window.portfolioUI.reducedMotion()) {
        finish();
        return;
      }

      // Animating the disclosure height keeps the following buttons in normal flow.
      disclosure.style.overflow = "hidden";
      const expansion = disclosure.animate([
        { height: `${startHeight}px` },
        { height: `${endHeight}px` }
      ], { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
      expansion.finished.then(finish, finish);
    });
  }

  function setupPortraitJourney() {
    const profile = document.querySelector("#profile-intro");
    const sourceFrame = profile?.querySelector(".profile-panel-media");
    const source = sourceFrame?.querySelector("img");
    const chooser = document.querySelector("#portfolios");
    const destination = chooser?.querySelector(".portfolio-portrait");
    if (!source || !destination) return;
    const flight = source.cloneNode(true);
    flight.className = "portfolio-portrait-flight";
    flight.alt = "";
    flight.setAttribute("aria-hidden", "true");
    flight.hidden = true;
    document.body.append(flight);
    let queued = false;

    const update = () => {
      queued = false;
      const end = pageTop(chooser);
      const start = pageTop(profile) + profile.offsetHeight - innerHeight;
      const progress = scrollY >= end - 1 ? 1 : scrollY <= start + 1 ? 0
        : Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, end - start)));
      const moving = progress > 0 && progress < 1 && !window.portfolioUI.reducedMotion() && !window.portfolioPortal?.busy;
      chooser.classList.toggle("is-portrait-settled", progress >= .995);
      flight.hidden = !moving;
      sourceFrame.style.visibility = moving ? "hidden" : "";
      destination.style.visibility = moving ? "hidden" : "";
      if (!moving) return;
      const from = source.getBoundingClientRect();
      const to = destination.getBoundingClientRect();
      const mix = (a, b) => a + (b - a) * progress;
      const fromY = from.top + scrollY - start;
      const toY = to.top + scrollY - end;
      flight.style.width = `${from.width}px`;
      flight.style.height = `${from.height}px`;
      flight.style.transform = `translate(${mix(from.left, to.left)}px, ${mix(fromY, toY)}px) scale(${mix(1, to.width / from.width)}, ${mix(1, to.height / from.height)})`;
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    new ResizeObserver(schedule).observe(profile);
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", schedule);
    schedule();
  }

  function setupMagneticChoices() {
    const chooser = document.querySelector('#portfolios');
    const buttons = [...chooser.querySelectorAll(':scope > .portfolio-choice-link')];
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const states = buttons.map(button => ({ button, x: 0, y: 0, tx: 0, ty: 0 }));
    let frame = 0, previous = 0;
    const restore = () => {
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      states.forEach(state => { state.x = state.y = state.tx = state.ty = 0; state.button.style.removeProperty('translate'); });
    };
    function tick(now) {
      if (!pointer.matches || motion.matches || window.portfolioPortal?.busy) { restore(); return; }
      const amount = 1 - Math.pow(.82, Math.min(32, previous ? now - previous : 16.67) / 16.67);
      previous = now;
      let moving = false;
      states.forEach(state => {
        state.x += (state.tx - state.x) * amount;
        state.y += (state.ty - state.y) * amount;
        if (Math.abs(state.tx - state.x) < .02) state.x = state.tx;
        if (Math.abs(state.ty - state.y) < .02) state.y = state.ty;
        state.button.style.translate = `${state.x}px ${state.y}px`;
        moving ||= state.x !== state.tx || state.y !== state.ty;
      });
      frame = moving ? requestAnimationFrame(tick) : 0;
      if (!moving) previous = 0;
    }
    const animate = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const release = () => { states.forEach(state => { state.tx = state.ty = 0; }); animate(); };
    chooser.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !pointer.matches || motion.matches || window.portfolioPortal?.busy) return;
      const distances = states.map(state => {
        const rect = state.button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2 - state.x);
        const dy = event.clientY - (rect.top + rect.height / 2 - state.y);
        return { state, dx, dy, distance: Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2)) };
      }).sort((a, b) => a.distance - b.distance || Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
      states.forEach(state => { state.tx = state.ty = 0; });
      const closest = distances[0];
      if (closest && closest.distance < 90) {
        const strength = 1 - closest.distance / 90;
        closest.state.tx = Math.max(-18, Math.min(18, closest.dx * .14)) * strength;
        closest.state.ty = Math.max(-12, Math.min(12, closest.dy * .18)) * strength;
      }
      animate();
    }, { passive: true });
    chooser.addEventListener('pointerleave', release);
    window.addEventListener('scroll', release, { passive: true });
    window.addEventListener('resize', restore, { passive: true });
    window.addEventListener('blur', restore);
    window.addEventListener('pagehide', restore);
    pointer.addEventListener('change', restore);
    motion.addEventListener('change', restore);
  }

  function setupReveals() {
    const targets = [
      ".hero-copy",
      ".profile-panel-media",
      ".profile-panel-copy",
      ".section-heading",
      ".work-group",
      ".subsection",
      ".contact-grid"
    ];

    document.querySelectorAll(targets.join(",")).forEach((element) => {
      element.setAttribute("data-reveal", "");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
  }

  function setupIntroSnap() {
    const allStops = Array.from(document.querySelectorAll("[data-snap-stop]"));
    const selectedWorks = document.querySelector("#selected-works");
    const chooser = document.querySelector("#portfolios");
    if (allStops.length < 2 || !selectedWorks) return;
    const architecture = document.querySelector('#architecture-portfolio');

    function architectureEntryTop() {
      if (window.portfolioPortal?.busy || window.portfolioUI.sectionNavigation || document.body.dataset.activePortfolio !== 'architecture' || !selectedWorks.getClientRects().length) return null;
      const target = document.getElementById(location.hash.slice(1));
      if (!target || !architecture?.contains(target)) return null;
      const first = selectedWorks.querySelector('.project-card');
      return innerWidth <= 980 || !first ? pageTop(selectedWorks) : snapTop(first);
    }

    // Also contain native touch momentum and keyboard scrolling at the first project.
    window.addEventListener('scroll', () => {
      const boundary = architectureEntryTop();
      if (boundary !== null && scrollY < boundary - 1) window.scrollTo({ top: boundary, behavior: 'instant' });
    }, { passive: true });

    let wheelTotal = 0;
    let isSnapping = false;
    let lastDirection = 0;
    let suppressUpUntil = 0;

    function directionalStopIndex(direction, stops) {
      const y = window.scrollY;
      const threshold = 32;
      const positions = stops.map(snapTop);

      if (direction > 0) {
        const nextIndex = positions.findIndex((top) => top > y + threshold);
        return nextIndex === -1 ? stops.length - 1 : nextIndex;
      }

      for (let index = positions.length - 1; index >= 0; index -= 1) {
        if (positions[index] < y - threshold) return index;
      }
      return 0;
    }

    function snapTo(target) {
      if (!target) return;

      isSnapping = true;
      wheelTotal = 0;
      const reducedMotion = window.portfolioUI.reducedMotion();
      window.scrollTo({ top: snapTop(target), behavior: reducedMotion ? "instant" : "smooth" });
      window.setTimeout(() => {
        window.scrollTo({ top: snapTop(target), behavior: "instant" });
        isSnapping = false;
      }, reducedMotion ? 0 : 850);
    }

    window.addEventListener("wheel", (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.defaultPrevented || window.photographyDirectory?.handleWheel(event)) return;
      if (window.portfolioPortal?.busy) return;
      const boundary = architectureEntryTop();
      if (boundary !== null && event.deltaY < 0 && scrollY <= boundary + 2) {
        event.preventDefault();
        wheelTotal = 0;
        return;
      }
      if (window.innerWidth <= 980) return;
      const stops = allStops.filter((stop) => stop.getClientRects().length && (boundary === null || architecture.contains(stop)) && !(stop.id === 'photography-works' && stop.querySelector('.project-card')));
      const choosing = chooser && Math.abs(window.scrollY - pageTop(chooser)) < 40;
      if (choosing && event.deltaY > 0) {
        event.preventDefault();
        wheelTotal = 0;
        return;
      }

      const profile = document.querySelector("#profile-intro");
      const profileTop = pageTop(profile);
      const profileReadingEnd = profileTop + profile.offsetHeight - window.innerHeight;
      const readingProfile = window.scrollY >= profileTop - 2 && window.scrollY <= profileReadingEnd + 2;
      if (readingProfile && ((event.deltaY > 0 && window.scrollY < profileReadingEnd - 2) || (event.deltaY < 0 && window.scrollY > profileTop + 2))) {
        wheelTotal = 0;
        return;
      }

      if (isSnapping) {
        event.preventDefault();
        return;
      }

      const direction = Math.sign(event.deltaY);
      if (!direction) return;

      if (direction < 0 && window.performance.now() < suppressUpUntil) {
        event.preventDefault();
        return;
      }

      const activeWorks = document.querySelector("#photography-works:not([hidden])") || selectedWorks;
      const selectedEnd = activeWorks.getClientRects().length
        ? pageTop(activeWorks) + activeWorks.offsetHeight
        : pageTop(chooser) + chooser.offsetHeight;
      const inSnapRange = window.scrollY < selectedEnd - window.innerHeight * 0.25;
      const returningToSnapRange = direction < 0 && window.scrollY < selectedEnd + 120;
      const targetIndex = directionalStopIndex(direction, stops);
      const targetTop = snapTop(stops[targetIndex]);
      const atLastStop = direction > 0 && targetIndex === stops.length - 1 && window.scrollY >= targetTop - 36;

      if ((direction > 0 && atLastStop) || (!inSnapRange && !returningToSnapRange)) {
        wheelTotal = 0;
        return;
      }

      event.preventDefault();

      if (direction !== lastDirection) {
        wheelTotal = 0;
        lastDirection = direction;
      }

      wheelTotal += Math.abs(event.deltaY);
      if (wheelTotal < 120) return;

      if (direction < 0 && stops[targetIndex]?.id === "profile-intro") {
        suppressUpUntil = window.performance.now() + 1200;
      }

      snapTo(stops[targetIndex]);
    }, { passive: false });
  }

  function setupHeroClickToProfile() {
    const hero = document.querySelector("#profile");
    const target = document.querySelector("#profile-intro");
    if (!hero || !target) return;

    hero.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      window.scrollTo({ top: target.offsetTop, behavior: window.portfolioUI.reducedMotion() ? "instant" : "smooth" });
    });
  }

  function updateRailProgress() {
    const progress = document.querySelector("#rail-progress");
    if (!progress) return;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const track = progress.parentElement.getBoundingClientRect();
    const stages = Array.from(document.querySelectorAll("[data-section-link]")).map((link) => {
      let section = document.getElementById(link.dataset.sectionLink);
      if (link.dataset.sectionLink === "selected-works") {
        section = document.querySelector("#photography-works:not([hidden])") || section;
      }
      if (!section?.getClientRects().length) {
        link.classList.remove("is-active");
        return null;
      }
      let top = pageTop(section);
      if (["selected-works", "photography-works"].includes(section.id) && innerWidth > 980 && section.querySelector('.project-card')) top = snapTop(section.querySelector(".project-card"));
      else top -= parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      const marker = link.getBoundingClientRect();
      const numberHeight = link.querySelector("span").offsetHeight;
      return { link, top: Math.min(maxScroll, Math.max(0, top)), point: marker.top + numberHeight / 2 - track.top };
    }).filter(Boolean);
    if (!stages.length) return;
    let current = 0;
    stages.forEach((stage, index) => { if (scrollY >= stage.top - 2) current = index; });
    stages.forEach((stage, index) => {
      stage.link.classList.toggle("is-active", index === current);
      if (index === current) stage.link.setAttribute('aria-current', 'location');
      else stage.link.removeAttribute('aria-current');
    });
    const stage = stages[current];
    const next = stages[current + 1];
    const fraction = next ? Math.max(0, Math.min(1, (scrollY - stage.top) / Math.max(1, next.top - stage.top))) : 0;
    const end = stage.point + (next ? (next.point - stage.point) * fraction : 0);
    progress.style.height = `${Math.max(0, Math.min(track.height, end))}px`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderProjects();
    setupPortfolioChoice();
    setupMagneticChoices();
    setupProjectReturn();
    renderTimeline();
    setupProfileLayout();
    setupMoreAbout();
    setupPortraitJourney();
    setupReveals();
    setupIntroSnap();
    setupHeroClickToProfile();
    setScrolledState();
    updateRailProgress();
    document.fonts?.ready.then(updateRailProgress);
    new ResizeObserver(updateRailProgress).observe(document.querySelector("main"));
  });

  window.addEventListener("scroll", () => {
    setScrolledState();
    updateRailProgress();
  }, { passive: true });
  window.addEventListener("resize", updateRailProgress);
  window.addEventListener("portfolio-navigation-change", updateRailProgress);
})();
