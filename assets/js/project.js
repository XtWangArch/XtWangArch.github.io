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
    return `
      <dl class="metadata detail-meta">
        <div><dt>Year</dt><dd>${project.year}</dd></div>
        <div><dt>Location</dt><dd>${project.location}</dd></div>
        <div><dt>Type</dt><dd>${project.type}</dd></div>
        <div><dt>Role</dt><dd>${project.role}</dd></div>
      </dl>
    `;
  }

  function renderProject(project) {
    const currentIndex = data.projects.findIndex((item) => item.id === project.id);
    const previous = data.projects[(currentIndex - 1 + data.projects.length) % data.projects.length];
    const next = data.projects[(currentIndex + 1) % data.projects.length];
    const [featureImage, ...remainingImages] = project.gallery;
    const galleryItem = (item, className = "", forceCaption = false) => {
      const shouldShowCaption = forceCaption || item.showCaption === true;
      return `
      <figure class="gallery-item ${className} ${item.layout === "full" ? "is-full" : ""}">
        <${item.image ? "button" : "div"} class="gallery-media ${item.image ? "has-image" : "has-placeholder"}" ${item.image ? `type="button" data-full-image="${escapeAttribute(item.image)}" data-full-label="${escapeAttribute(item.label)}" data-full-caption="${escapeAttribute(item.caption)}" aria-label="View ${escapeAttribute(item.label)} larger"` : ""}>
          ${mediaMarkup(item.image, item.label)}
          ${shouldShowCaption ? `
            <figcaption class="gallery-caption">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.caption)}</span>
            </figcaption>
          ` : ""}
        </${item.image ? "button" : "div"}>
      </figure>
      `;
    };

    document.title = `${project.title} | Xitao Wang`;
    mount.innerHTML = `
      <section class="detail-hero">
        <a class="text-link" href="index.html#selected-works">Back to Selected Works</a>
        <div class="section-kicker">${project.category}</div>
        <h1>${project.title}</h1>
        <p class="lead">${project.subtitle}</p>
        ${metadata(project)}
      </section>

      <section class="detail-brief">
        <article>
          <h2>Brief</h2>
          <p>${project.brief}</p>
        </article>
      </section>

      <section class="gallery-feature" aria-label="${project.title} featured image">
        ${featureImage ? galleryItem(featureImage, "is-feature", true) : ""}
      </section>

      <section class="detail-layout">
        <div class="detail-copy">
          <article>
            <h2>My Role / Contribution</h2>
            <p>${project.contribution}</p>
          </article>
          <article>
            <h2>Idea</h2>
            <p>${project.idea}</p>
          </article>
          <article>
            <h2>Execution</h2>
            <p>${project.execution}</p>
          </article>
        </div>
      </section>

      <section class="gallery-grid" aria-label="${project.title} images">
        ${remainingImages.map((item) => galleryItem(item)).join("")}
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

      <div class="image-lightbox" id="image-lightbox" aria-hidden="true">
        <button class="image-lightbox-close" type="button" aria-label="Close image preview">Close</button>
        <figure>
          <img alt="">
          <figcaption></figcaption>
        </figure>
      </div>
    `;

    setupLightbox();
  }

  function setupLightbox() {
    const lightbox = document.querySelector("#image-lightbox");
    if (!lightbox) return;

    const image = lightbox.querySelector("img");
    const caption = lightbox.querySelector("figcaption");
    const close = lightbox.querySelector(".image-lightbox-close");

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      image.removeAttribute("src");
      image.alt = "";
      caption.textContent = "";
    }

    function openLightbox(trigger) {
      image.src = trigger.dataset.fullImage;
      image.alt = trigger.dataset.fullLabel || "";
      caption.textContent = trigger.dataset.fullCaption || trigger.dataset.fullLabel || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    }

    document.querySelectorAll("[data-full-image]").forEach((trigger) => {
      trigger.addEventListener("click", () => openLightbox(trigger));
    });

    close.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
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
