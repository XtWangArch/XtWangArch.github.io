(function () {
  const data = window.portfolioData;

  const text = (value, fallback = "") => value || fallback;

  function mediaMarkup(image, label) {
    if (image) {
      return `<img src="${image}" alt="${label}" loading="lazy">`;
    }

    return `<div class="visual-placeholder" aria-label="${label}"><span>${label}</span></div>`;
  }

  function projectCard(project, index) {
    const href = `project.html?project=${encodeURIComponent(project.id)}`;
    const alignment = index % 2 === 0 ? "is-image-left" : "is-image-right";

    return `
      <article class="project-card ${alignment}">
        <a class="project-media" href="${href}" aria-label="View ${project.title}">
          ${mediaMarkup(project.cover, project.title)}
          <span class="project-media-title">${project.title}</span>
        </a>
        <a class="project-content" href="${href}" aria-label="View ${project.title}">
          <h4>${project.title}</h4>
          <dl class="metadata">
            <div><dt>Year</dt><dd>${project.year}</dd></div>
            <div><dt>Location</dt><dd>${project.location}</dd></div>
            <div><dt>Type</dt><dd>${project.type}</dd></div>
            <div><dt>Role</dt><dd>${project.role}</dd></div>
          </dl>
        </a>
      </article>
    `;
  }

  function renderProjects() {
    const container = document.querySelector("#work-groups");
    if (!container) return;

    const groups = data.projects.reduce((result, project) => {
      if (!result[project.category]) result[project.category] = [];
      result[project.category].push(project);
      return result;
    }, {});

    container.innerHTML = Object.entries(groups)
      .map(([category, projects]) => `
        <section class="work-group" aria-label="${category}">
          <div class="work-group-header">
            <h3>${category}</h3>
          </div>
          <div class="project-grid">
            ${projects.map(projectCard).join("")}
          </div>
        </section>
      `)
      .join("");
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
                    <h4>${
                      item.url
                        ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>`
                        : item.title
                    }</h4>
                    <div class="cv-meta-line">
                      <time>${item.date || item.year || ""}</time>
                      ${item.subtitle ? `<span>${item.subtitle}</span>` : ""}
                    </div>
                    ${item.description ? `<p class="cv-description">${item.description}</p>` : ""}
                    ${
                      item.details
                        ? `<ul class="cv-detail-list">${item.details.map((detail) => `<li>${detail}</li>`).join("")}</ul>`
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
    const instagram = document.querySelector("#instagram-link");
    const youtube = document.querySelector("#youtube-link");
    const photoWall = document.querySelector("#photo-wall");
    const videoFeature = document.querySelector("#video-feature");
    const videoCards = document.querySelector("#video-cards");

    if (instagram) instagram.href = data.links.instagram;
    if (youtube) youtube.href = data.links.youtube;

    if (photoWall) {
      photoWall.innerHTML = data.photography
        .slice(0, 16)
        .map((photo) => `
          <a class="photo-tile" href="${data.links.instagram}" target="_blank" rel="noreferrer">
            ${mediaMarkup(photo.image, photo.title)}
          </a>
        `)
        .join("");
    }

    if (videoFeature) {
      const featured = data.videos.featured;
      videoFeature.innerHTML = `
        <div class="video-frame" aria-label="${featured.title}">
          ${
            featured.youtubeEmbed
              ? `<iframe src="${featured.youtubeEmbed}" title="${featured.title}" allowfullscreen loading="lazy"></iframe>`
              : `<div class="video-placeholder">${mediaMarkup("", featured.title)}</div>`
          }
        </div>
      `;
    }

    if (videoCards) {
      videoCards.innerHTML = data.videos.items
        .map((video) => `
          <article class="video-card">
            <a class="video-frame" href="${video.url}" target="_blank" rel="noreferrer">
              ${mediaMarkup(video.thumbnail, video.title)}
            </a>
            <h4>${video.title}</h4>
            <a class="text-link" href="${video.url}" target="_blank" rel="noreferrer">Watch on YouTube</a>
          </article>
        `)
        .join("");
    }
  }

  function setActiveSection() {
    const links = Array.from(document.querySelectorAll("[data-section-link]"));
    const sections = Array.from(document.querySelectorAll("[data-section]"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.dataset.sectionLink === entry.target.id
            );
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function setScrolledState() {
    document.body.classList.toggle("has-scrolled", window.scrollY > 24);
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
    const stops = Array.from(document.querySelectorAll("[data-snap-stop]"));
    const selectedWorks = document.querySelector("#selected-works");
    if (stops.length < 3 || !selectedWorks) return;

    let wheelTotal = 0;
    let isSnapping = false;
    let lastDirection = 0;

    function nearestStopIndex() {
      const y = window.scrollY;
      return stops.reduce((nearest, stop, index) => {
        const distance = Math.abs(stop.offsetTop - y);
        return distance < nearest.distance ? { index, distance } : nearest;
      }, { index: 0, distance: Infinity }).index;
    }

    function snapTo(index) {
      const target = stops[Math.max(0, Math.min(index, stops.length - 1))];
      if (!target) return;

      isSnapping = true;
      wheelTotal = 0;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        isSnapping = false;
      }, 850);
    }

    window.addEventListener("wheel", (event) => {
      if (window.innerWidth <= 720 || isSnapping) return;

      const direction = Math.sign(event.deltaY);
      if (!direction) return;

      const selectedTop = selectedWorks.offsetTop;
      const beforeSelectedWorks = window.scrollY < selectedTop - 8;
      const atSelectedTop = Math.abs(window.scrollY - selectedTop) < 36;

      if (!beforeSelectedWorks && !(direction < 0 && atSelectedTop)) {
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

      const current = nearestStopIndex();
      snapTo(current + direction);
    }, { passive: false });
  }

  function setupHeroClickToProfile() {
    const hero = document.querySelector("#profile");
    const target = document.querySelector("#profile-intro");
    if (!hero || !target) return;

    hero.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function updateRailProgress() {
    const progress = document.querySelector("#rail-progress");
    if (!progress) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progress.style.height = `${Math.min(100, Math.max(0, percent))}%`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderProjects();
    renderTimeline();
    renderOtherWork();
    setActiveSection();
    setupReveals();
    setupIntroSnap();
    setupHeroClickToProfile();
    setScrolledState();
    updateRailProgress();
  });

  window.addEventListener("scroll", () => {
    setScrolledState();
    updateRailProgress();
  }, { passive: true });
  window.addEventListener("resize", updateRailProgress);
})();
