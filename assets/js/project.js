(function () {
  const data = window.portfolioData;
  const mount = document.querySelector("#project-detail");
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project");
  const activityId = params.get("activity");
  const project = activityId
    ? (data.researchExperience || []).find((item) => item.id === activityId && item.gallery?.length)
    : data.projects.find((item) => item.id === projectId);

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function mediaMarkup(image, label, sizes = "(max-width: 720px) calc(100vw - 40px), 24vw") {
    if (image) {
      return `<img ${window.portfolioMedia.attributes(image, sizes)} alt="${escapeAttribute(label)}" loading="lazy">`;
    }

    return `<div class="visual-placeholder" aria-label="${escapeAttribute(label)}"><span>${escapeHtml(label)}</span></div>`;
  }

  function metadata(project) {
    const extendedItems = (activityId ? [
      ["Date", project.date],
      ["Award", project.award]
    ] : [
      ["Year", project.year],
      ["Location", project.location],
      [project.website || project.area ? "Use" : "Type", project.type],
      ["Role", project.role],
      ["Status", project.status],
      ["Architect", project.architect],
      ["Area", project.area]
    ]).filter(([, value]) => value);

    return `
      <dl class="metadata detail-meta">
        ${extendedItems
          .map(([label, value]) => `
            <div>
              <dt>${label}</dt>
              <dd>
                ${escapeHtml(value)}
              </dd>
            </div>
          `)
          .join("")}
      </dl>
    `;
  }

  function titleMarkup(project) {
    const titleLines = Array.isArray(project.titleLines) && project.titleLines.length
      ? project.titleLines
      : String(project.title || "").split(/\r?\n/);

    if (titleLines.length > 1) {
      return titleLines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<span class="title-line">${escapeHtml(line)}</span>`)
        .join("");
    }

    return escapeHtml(project.title || "");
  }

  function publicationLinks(project) {
    const links = [
      ["KKAA project page", project.website],
      ["View on ArchDaily", project.archdailyUrl]
    ].filter(([, url]) => url);
    if (!links.length) return "";
    return `<div class="project-publications">${links.map(([label, url], index) =>
      `<a class="button ${index === 0 ? "accent" : ""}" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    ).join("")}</div>`;
  }

  function paragraphMarkup(value) {
    return String(value || "")
      .trim()
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`)
      .join("");
  }

  function leadMarkup(value) {
    return escapeHtml(value || "").replace(/\r?\n/g, "<br>");
  }

  function logoMarkup(project) {
    if (!project.logo) return "";

    return `
      <aside class="detail-hero-logo" aria-label="${escapeAttribute(project.title)} logo">
        ${mediaMarkup(project.logo, `${project.title} logo`, "(max-width: 720px) 72vw, 28vw")}
      </aside>
    `;
  }

  function shuffledItems(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function renderProject(project) {
    const backHref = activityId
      ? (params.get("return") === "cv" ? "cv.html?return=profile-intro" : "index.html#timeline")
      : `index.html#work-${project.id}`;
    const backLabel = activityId ? (params.get("return") === "cv" ? "Back to CV" : "Back to Experience") : "Back to Selected Works";
    mount.classList.toggle("drawing-prize", Boolean(activityId));
    const collection = data.projects.filter(item => (item.portfolio || 'architecture') === (project.portfolio || 'architecture'));
    const currentIndex = collection.findIndex((item) => item.id === project.id);
    const previous = collection[(currentIndex - 1 + collection.length) % collection.length];
    const next = collection[(currentIndex + 1) % collection.length];
    const galleryItems = project.gallery || [];
    const useFeatureImage = !activityId && project.featureFromGallery !== false;
    const featureImage = useFeatureImage ? galleryItems[0] : null;
    const remainingImages = useFeatureImage ? galleryItems.slice(1) : galleryItems;
    const pinnedImages = remainingImages.filter(item => item.pinned === true);
    const unpinnedImages = remainingImages.filter(item => item.pinned !== true);
    const galleryImages = activityId || project.shuffleGallery === false ? unpinnedImages : shuffledItems(unpinnedImages);
    let lightboxIndex = 0;
    const galleryItem = (item, className = "", forceCaption = false, disableInteraction = false) => {
      const shouldShowCaption = forceCaption || item.showCaption === true;
      const isClickable = item.image && !disableInteraction;
      const imageIndex = isClickable ? lightboxIndex++ : "";
      return `
      <figure class="gallery-item ${className} ${item.layout === "full" ? "is-full" : item.layout === "wide" ? "is-wide" : ""}">
        <${isClickable ? "button" : "div"} class="gallery-media ${item.image ? "has-image" : "has-placeholder"} ${disableInteraction ? "is-static" : ""}" ${isClickable ? `type="button" data-full-image="${escapeAttribute(item.image)}" data-full-label="${escapeAttribute(item.label)}" data-full-caption="${escapeAttribute(item.caption)}" data-lightbox-index="${imageIndex}" aria-label="View ${escapeAttribute(item.label)} larger"` : ""}>
          ${mediaMarkup(item.image, item.label, item.layout === "wide" ? "100vw" : activityId ? "(max-width: 720px) calc(100vw - 40px), min(84vw, 1180px)" : disableInteraction || item.layout === "full" ? "(max-width: 980px) min(560px, calc(100vw - 40px)), min(72vw, 1180px)" : undefined)}
          ${shouldShowCaption ? `
            <figcaption class="gallery-caption">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.caption)}</span>
            </figcaption>
          ` : ""}
        </${isClickable ? "button" : "div"}>
      </figure>
      `;
    };

    // Wide drawings sit outside the narrow masonry columns to match the text edges.
    const gallerySections = [];
    if (pinnedImages.length) {
      gallerySections.push(`<section class="gallery-grid gallery-pinned" aria-label="Featured drawings">${pinnedImages.map(item => galleryItem(item)).join("")}</section>`);
    }
    let groupedImages = [];
    const flushGallery = () => {
      if (!groupedImages.length) return;
      gallerySections.push(`<section class="gallery-grid" aria-label="${escapeAttribute(project.title)} images">${groupedImages.map(item => galleryItem(item)).join("")}</section>`);
      groupedImages = [];
    };
    for (const item of galleryImages) {
      if (item.layout === "wide") {
        flushGallery();
        gallerySections.push(`<section class="gallery-grid gallery-wide" aria-label="${escapeAttribute(item.label)}">${galleryItem(item)}</section>`);
      } else groupedImages.push(item);
    }
    flushGallery();

    document.title = `${project.title} | Xitao Wang`;
    if (activityId) document.querySelector('meta[name="description"]').content = `${project.title}. ${project.award}, ${project.date}. Drawings by Xitao Wang.`;
    mount.innerHTML = `
      <section class="detail-hero ${project.logo ? "has-detail-logo" : ""}">
        <a class="text-link" href="${backHref}">${backLabel}</a>
        <div class="detail-hero-grid">
          <div class="detail-hero-copy">
            ${project.category ? `<div class="section-kicker">${escapeHtml(project.category)}</div>` : ""}
            <h1>${titleMarkup(project)}</h1>
            ${project.subtitle ? `<p class="lead">${leadMarkup(project.subtitle)}</p>` : ""}
            ${publicationLinks(project)}
            ${metadata(project)}
          </div>
          ${logoMarkup(project)}
        </div>
      </section>

      ${!activityId || project.brief ? `<section class="detail-brief">
        <article>
          <h2>Brief</h2>
          ${paragraphMarkup(project.brief)}
        </article>
      </section>` : ""}

      ${featureImage ? `
        <section class="gallery-feature" aria-label="${escapeAttribute(project.title)} featured image">
          ${galleryItem(featureImage, "is-feature", false, true)}
        </section>
      ` : ""}

      <div class="gallery-sections ${galleryImages.some(item => item.layout === "wide") ? "has-wide-drawings" : ""}">
        ${gallerySections.join("")}
      </div>

      ${!activityId ? `<nav class="project-pagination" aria-label="Project navigation">
        <a href="project.html?project=${previous.id}">
          <span>Previous</span>
          ${escapeHtml(previous.title)}
        </a>
        <a href="project.html?project=${next.id}">
          <span>Next</span>
          ${escapeHtml(next.title)}
        </a>
      </nav>` : ""}

      <div class="project-bottom-back">
        <a class="text-link" href="${backHref}">${backLabel}</a>
      </div>

      <dialog class="image-lightbox" id="image-lightbox" aria-label="Image preview" aria-describedby="image-lightbox-caption" aria-hidden="true">
        <button class="image-lightbox-close" type="button" aria-label="Close image preview" autofocus>Close</button>
        <button class="image-lightbox-nav image-lightbox-prev" type="button" aria-label="Previous image">Previous</button>
        <button class="image-lightbox-nav image-lightbox-next" type="button" aria-label="Next image">Next</button>
        <figure>
          <img alt="">
          <figcaption id="image-lightbox-caption" aria-live="polite"></figcaption>
        </figure>
        <span class="image-lightbox-status" role="status" hidden></span>
      </dialog>
    `;

    setupProjectReveals();
    setupProjectPageTransitions();
    setupLightbox();
  }

  function setupProjectReveals() {
    window.portfolioUI.revealDetails(
      '.detail-hero > a, .detail-hero-copy > .section-kicker, .detail-hero-copy > h1, .detail-hero-copy > .lead, .project-publications > a, .detail-meta > div, .detail-hero-logo, .detail-brief h2, .detail-brief p, .gallery-feature .gallery-item, .gallery-grid .gallery-item, .project-pagination > a, .project-bottom-back > a'
    );
  }

  function setupProjectPageTransitions() {
    const main = document.querySelector(".detail-main");
    if (!main) return;

    document.querySelectorAll(".project-pagination a").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target && link.target !== "_self") return;

        event.preventDefault();
        if (main.classList.contains("is-exiting")) return;
        const current = getComputedStyle(main);
        const startOpacity = current.opacity;
        const startTransform = current.transform;
        const reducedMotion = window.portfolioUI.reducedMotion();
        main.getAnimations().forEach((animation) => animation.cancel());
        main.classList.add("is-exiting");
        const duration = reducedMotion ? 120 : 500;
        let navigating = false;
        const navigate = () => {
          if (navigating) return;
          navigating = true;
          window.location.href = link.href;
        };
        const exit = main.animate([
          { opacity: startOpacity, transform: reducedMotion ? "none" : startTransform },
          { opacity: 0, transform: reducedMotion ? "none" : "translateY(18px)" }
        ], { duration, easing: "ease-out", fill: "forwards" });
        const fallback = window.setTimeout(navigate, duration);
        exit.finished.then(() => {
          window.clearTimeout(fallback);
          navigate();
        }).catch(() => {});
      });
    });
  }

  function setupLightbox() {
    const lightbox = document.querySelector("#image-lightbox");
    if (!lightbox) return;

    document.body.appendChild(lightbox);

    const image = lightbox.querySelector("img");
    const caption = lightbox.querySelector("figcaption");
    const close = lightbox.querySelector(".image-lightbox-close");
    const previous = lightbox.querySelector(".image-lightbox-prev");
    const next = lightbox.querySelector(".image-lightbox-next");
    const status = lightbox.querySelector(".image-lightbox-status");
    const triggers = Array.from(document.querySelectorAll("[data-full-image]"));
    let currentIndex = 0;
    let imageRequest = 0;
    let closeTimer;
    let closing = false;
    let opener;
    let scrollBeforeOpen = 0;

    function applyImage(trigger, source) {
      image.src = source;
      image.alt = trigger.dataset.fullLabel || "";
      caption.textContent = trigger.dataset.fullCaption || trigger.dataset.fullLabel || "";
    }

    function showImage(index) {
      if (!triggers.length) return;
      const nextIndex = (index + triggers.length) % triggers.length;
      const trigger = triggers[nextIndex];
      const shouldAnimate = lightbox.classList.contains("is-open");
      const request = ++imageRequest;
      currentIndex = nextIndex;
      const preview = trigger.querySelector("img")?.currentSrc || trigger.dataset.fullImage;
      if (!shouldAnimate) {
        applyImage(trigger, preview);
      } else {
        lightbox.classList.add("is-switching");
      }

      lightbox.setAttribute("aria-busy", "true");
      status.textContent = "Loading image...";
      status.hidden = false;
      const fullImage = new Image();
      fullImage.src = trigger.dataset.fullImage;
      const loaded = fullImage.decode().then(() => true, () => false);
      const delay = shouldAnimate ? (window.portfolioUI.reducedMotion() ? 0 : 180) : 0;
      Promise.all([loaded, new Promise((resolve) => window.setTimeout(resolve, delay))]).then(([success]) => {
        if (request !== imageRequest || !lightbox.open || closing) return;
        applyImage(trigger, success ? trigger.dataset.fullImage : preview);
        lightbox.setAttribute("aria-busy", "false");
        status.hidden = success;
        if (!success) status.textContent = "Unable to load the full-size image.";
        window.requestAnimationFrame(() => {
          lightbox.classList.remove("is-switching");
        });
      });
    }

    function closeLightbox() {
      if (!lightbox.open || closing) return;
      closing = true;
      imageRequest += 1;
      lightbox.classList.remove("is-open");
      lightbox.classList.remove("is-switching");
      closeTimer = window.setTimeout(() => {
        lightbox.close();
        restorePage();
      }, window.portfolioUI.reducedMotion() ? 120 : 500);
    }

    function restorePage() {
      if (!document.body.classList.contains("has-lightbox")) return;
      window.clearTimeout(closeTimer);
      closing = false;
      lightbox.classList.remove("is-open", "is-switching");
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.removeAttribute("aria-busy");
      document.body.classList.remove("has-lightbox");
      image.removeAttribute("src");
      image.alt = "";
      caption.textContent = "";
      status.hidden = true;
      opener?.focus({ preventScroll: true });
      window.scrollTo({ top: scrollBeforeOpen, behavior: "instant" });
    }

    lightbox.addEventListener("close", restorePage);

    lightbox.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeLightbox();
    });

    function openLightbox(trigger) {
      opener = trigger;
      scrollBeforeOpen = window.scrollY;
      closing = false;
      document.body.classList.add("has-lightbox");
      lightbox.showModal();
      lightbox.setAttribute("aria-hidden", "false");
      showImage(Number(trigger.dataset.lightboxIndex) || 0);
      lightbox.getBoundingClientRect();
      lightbox.classList.add("is-open");
      close.focus({ preventScroll: true });
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => openLightbox(trigger));
    });

    close.addEventListener("click", closeLightbox);
    previous.addEventListener("click", () => showImage(currentIndex - 1));
    next.addEventListener("click", () => showImage(currentIndex + 1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (!lightbox.open || closing) return;

      if (event.key === "Tab") {
        const controls = [close, previous, next];
        const index = controls.indexOf(document.activeElement);
        if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === controls.length - 1)) {
          event.preventDefault();
          controls[event.shiftKey ? controls.length - 1 : 0].focus({ preventScroll: true });
        }
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showImage(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showImage(currentIndex + 1);
      }
    });
  }

  function renderIndex() {
    document.title = "Projects | Xitao Wang";
    mount.innerHTML = `
      <section class="detail-hero">
        <a class="text-link" href="index.html#selected-works">Back to Selected Works</a>
        <div class="section-kicker">Project Index</div>
        <h1>Projects</h1>
        <p class="lead">Select a project to view its detail page.</p>
        <div class="project-index">
          ${data.projects
            .map((item) => `<a href="project.html?project=${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a>`)
            .join("")}
        </div>
      </section>
    `;
  }

  if (project) {
    renderProject(project);
  } else {
    renderIndex();
  }
})();
