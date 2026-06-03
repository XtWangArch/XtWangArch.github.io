(function () {
  const data = window.portfolioData;
  const mount = document.querySelector("#project-detail");
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project");
  const project = data.projects.find((item) => item.id === projectId);

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

  function mediaMarkup(image, label) {
    if (image) {
      return `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(label)}" loading="lazy">`;
    }

    return `<div class="visual-placeholder" aria-label="${escapeAttribute(label)}"><span>${escapeHtml(label)}</span></div>`;
  }

  function metadata(project) {
    const extendedItems = [
      ["Year", project.year],
      ["Location", project.location],
      [project.website || project.area ? "Use" : "Type", project.type],
      ["Role", project.role],
      ["Status", project.status],
      ["Architect", project.architect],
      ["Area", project.area],
      ["Website", project.website]
    ].filter(([, value]) => value);

    return `
      <dl class="metadata detail-meta">
        ${extendedItems
          .map(([label, value]) => `
            <div>
              <dt>${label}</dt>
              <dd>
                ${label === "Website"
                  ? `<a class="text-link" href="${escapeAttribute(value)}" target="_blank" rel="noreferrer">KKAA project page</a>`
                  : escapeHtml(value)}
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
        ${mediaMarkup(project.logo, `${project.title} logo`)}
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
    const currentIndex = data.projects.findIndex((item) => item.id === project.id);
    const previous = data.projects[(currentIndex - 1 + data.projects.length) % data.projects.length];
    const next = data.projects[(currentIndex + 1) % data.projects.length];
    const galleryItems = project.gallery || [];
    const useFeatureImage = project.featureFromGallery !== false;
    const featureImage = useFeatureImage ? galleryItems[0] : null;
    const remainingImages = useFeatureImage ? galleryItems.slice(1) : galleryItems;
    const galleryImages = project.shuffleGallery === false ? remainingImages : shuffledItems(remainingImages);
    let lightboxIndex = 0;
    const galleryItem = (item, className = "", forceCaption = false, disableInteraction = false) => {
      const shouldShowCaption = forceCaption || item.showCaption === true;
      const isClickable = item.image && !disableInteraction;
      const imageIndex = isClickable ? lightboxIndex++ : "";
      return `
      <figure class="gallery-item ${className} ${item.layout === "full" ? "is-full" : ""}">
        <${isClickable ? "button" : "div"} class="gallery-media ${item.image ? "has-image" : "has-placeholder"} ${disableInteraction ? "is-static" : ""}" ${isClickable ? `type="button" data-full-image="${escapeAttribute(item.image)}" data-full-label="${escapeAttribute(item.label)}" data-full-caption="${escapeAttribute(item.caption)}" data-lightbox-index="${imageIndex}" aria-label="View ${escapeAttribute(item.label)} larger"` : ""}>
          ${mediaMarkup(item.image, item.label)}
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

    document.title = `${project.title} | Xitao Wang`;
    mount.innerHTML = `
      <section class="detail-hero ${project.logo ? "has-detail-logo" : ""}">
        <a class="text-link" href="index.html#work-${project.id}">Back to Selected Works</a>
        <div class="detail-hero-grid">
          <div class="detail-hero-copy">
            <div class="section-kicker">${project.category}</div>
            <h1>${titleMarkup(project)}</h1>
            <p class="lead">${leadMarkup(project.subtitle)}</p>
            ${metadata(project)}
          </div>
          ${logoMarkup(project)}
        </div>
      </section>

      <section class="detail-brief">
        <article>
          <h2>Brief</h2>
          ${paragraphMarkup(project.brief)}
        </article>
      </section>

      ${featureImage ? `
        <section class="gallery-feature" aria-label="${project.title} featured image">
          ${galleryItem(featureImage, "is-feature", false, true)}
        </section>
      ` : ""}

      <section class="gallery-grid" aria-label="${project.title} images">
        ${galleryImages.map((item) => galleryItem(item)).join("")}
      </section>

      <nav class="project-pagination" aria-label="Project navigation">
        <a href="project.html?project=${previous.id}">
          <span>Previous</span>
          ${previous.title}
        </a>
        <a href="project.html?project=${next.id}">
          <span>Next</span>
          ${next.title}
        </a>
      </nav>

      <div class="project-bottom-back">
        <a class="text-link" href="index.html#work-${project.id}">Back to Selected Works</a>
      </div>

      <div class="image-lightbox" id="image-lightbox" aria-hidden="true">
        <button class="image-lightbox-close" type="button" aria-label="Close image preview">Close</button>
        <button class="image-lightbox-nav image-lightbox-prev" type="button" aria-label="Previous image">Previous</button>
        <button class="image-lightbox-nav image-lightbox-next" type="button" aria-label="Next image">Next</button>
        <figure>
          <img alt="">
          <figcaption></figcaption>
        </figure>
      </div>
    `;

    setupProjectReveals();
    setupProjectPageTransitions();
    setupLightbox();
  }

  function setupProjectReveals() {
    const targets = Array.from(document.querySelectorAll(".gallery-feature .gallery-item, .gallery-grid .gallery-item"));

    targets.forEach((target) => target.setAttribute("data-project-reveal", ""));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    targets.forEach((target) => observer.observe(target));
  }

  function setupProjectPageTransitions() {
    const main = document.querySelector(".detail-main");
    if (!main) return;

    document.querySelectorAll(".project-pagination a").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target && link.target !== "_self") return;

        event.preventDefault();
        main.classList.add("is-exiting");
        window.setTimeout(() => {
          window.location.href = link.href;
        }, 500);
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
    const triggers = Array.from(document.querySelectorAll("[data-full-image]"));
    let currentIndex = 0;
    let switchTimer;

    function applyImage(trigger) {
      image.src = trigger.dataset.fullImage;
      image.alt = trigger.dataset.fullLabel || "";
      caption.textContent = trigger.dataset.fullCaption || trigger.dataset.fullLabel || "";
    }

    function showImage(index) {
      if (!triggers.length) return;
      const nextIndex = (index + triggers.length) % triggers.length;
      const trigger = triggers[nextIndex];
      const shouldAnimate = lightbox.classList.contains("is-open");

      window.clearTimeout(switchTimer);

      if (!shouldAnimate) {
        currentIndex = nextIndex;
        applyImage(trigger);
        return;
      }

      lightbox.classList.add("is-switching");
      switchTimer = window.setTimeout(() => {
        currentIndex = nextIndex;
        applyImage(trigger);
        window.requestAnimationFrame(() => {
          lightbox.classList.remove("is-switching");
        });
      }, 180);
    }

    function closeLightbox() {
      window.clearTimeout(switchTimer);
      lightbox.classList.remove("is-open");
      lightbox.classList.remove("is-switching");
      lightbox.setAttribute("aria-hidden", "true");
      image.removeAttribute("src");
      image.alt = "";
      caption.textContent = "";
    }

    function openLightbox(trigger) {
      showImage(Number(trigger.dataset.lightboxIndex) || 0);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
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
      if (!lightbox.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        showImage(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
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
            .map((item) => `<a href="project.html?project=${item.id}">${item.title}</a>`)
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
