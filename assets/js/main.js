(function () {
  const data = window.portfolioData;

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const text = (value, fallback = "") => value || fallback;

  function mediaMarkup(image, label) {
    if (image) {
      return `<img src="${image}" alt="${label}" loading="lazy">`;
    }

    return `<div class="visual-placeholder" aria-label="${label}"><span>${label}</span></div>`;
  }

  function pageTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function projectCard(project, index) {
    const href = `project.html?project=${encodeURIComponent(project.id)}`;
    const alignment = index % 2 === 0 ? "is-image-left" : "is-image-right";
    const snapAnchor = index === 0 ? ` data-snap-anchor="selected-works"` : "";

    return `
      <article id="work-${project.id}" class="project-card ${alignment}" data-project-id="${project.id}" data-snap-stop data-snap-kind="project"${snapAnchor}>
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
    let projectIndex = 0;

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
            ${projects.map((project) => projectCard(project, projectIndex++)).join("")}
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

    const anchorId = target.dataset.snapAnchor;
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    const computeReturnTop = () => {
      const headerOffset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const media = target.querySelector(".project-media");
      const content = target.querySelector(".project-content");
      const visualElements = [media, content].filter(Boolean);

      if (target.dataset.snapKind !== "project") {
        return anchor
          ? pageTop(anchor)
          : Math.max(0, pageTop(target) - headerOffset - 24);
      }

      if (!visualElements.length) {
        return Math.min(maxScroll, Math.max(0, pageTop(target) + target.offsetHeight / 2 - window.innerHeight / 2));
      }

      const visualTop = Math.min(...visualElements.map((element) => pageTop(element)));
      const visualBottom = Math.max(...visualElements.map((element) => pageTop(element) + element.offsetHeight));
      const viewportCenter = headerOffset + (window.innerHeight - headerOffset) / 2;

      return Math.min(maxScroll, Math.max(0, visualTop + (visualBottom - visualTop) / 2 - viewportCenter));
    };

    const alignToProject = () => {
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: computeReturnTop(), behavior: "instant" });
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
    const photographyUrl = data.links.photographyInstagram || data.links.instagram;

    if (instagram) instagram.href = photographyUrl;
    if (youtube) youtube.href = data.links.youtube;

    if (photoWall) {
      photoWall.classList.toggle("is-single", data.photography.length === 1);
      photoWall.innerHTML = data.photography
        .slice(0, 16)
        .map((photo) => `
          <a class="photo-tile" href="${photographyUrl}" target="_blank" rel="noreferrer">
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
            <div class="video-frame" aria-label="${video.title}">
              ${
                video.youtubeEmbed
                  ? `<iframe src="${video.youtubeEmbed}" title="${video.title}" allowfullscreen loading="lazy"></iframe>`
                  : `<a href="${video.url}" target="_blank" rel="noreferrer">${mediaMarkup(video.thumbnail, video.title)}</a>`
              }
            </div>
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
    const stops = Array.from(document.querySelectorAll("[data-snap-stop]"))
      .filter((stop) => stop.id !== "profile");
    const selectedWorks = document.querySelector("#selected-works");
    const cover = document.querySelector("#profile");
    if (stops.length < 2 || !selectedWorks) return;

    let wheelTotal = 0;
    let isSnapping = false;
    let lastDirection = 0;
    let suppressUpUntil = 0;

    function headerHeight() {
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
    }

    function visualCenterTop(stop) {
      const media = stop.querySelector(".project-media");
      const content = stop.querySelector(".project-content");
      const visualElements = [media, content].filter(Boolean);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (!visualElements.length) {
        return Math.min(maxScroll, Math.max(0, pageTop(stop) + stop.offsetHeight / 2 - window.innerHeight / 2));
      }

      const visualTop = Math.min(...visualElements.map((element) => pageTop(element)));
      const visualBottom = Math.max(...visualElements.map((element) => pageTop(element) + element.offsetHeight));
      const viewportCenter = headerHeight() + (window.innerHeight - headerHeight()) / 2;
      const centeredTop = visualTop + (visualBottom - visualTop) / 2 - viewportCenter;

      return Math.min(maxScroll, Math.max(0, centeredTop));
    }

    function stopTop(stop) {
      const anchorId = stop.dataset.snapAnchor;
      const anchor = anchorId ? document.getElementById(anchorId) : null;

      if (stop.dataset.snapKind === "project") {
        return visualCenterTop(stop);
      }

      if (anchor) return pageTop(anchor);
      return pageTop(stop);
    }

    function directionalStopIndex(direction) {
      const y = window.scrollY;
      const threshold = 32;
      const positions = stops.map(stopTop);
      const profileIntroIndex = stops.findIndex((stop) => stop.id === "profile-intro");

      if (direction > 0) {
        if (cover && y < stopTop(stops[profileIntroIndex]) - threshold) {
          return profileIntroIndex >= 0 ? profileIntroIndex : 0;
        }

        const nextIndex = positions.findIndex((top) => top > y + threshold);
        return nextIndex === -1 ? stops.length - 1 : nextIndex;
      }

      if (profileIntroIndex >= 0 && y >= pageTop(selectedWorks) - window.innerHeight * 0.35) {
        const firstProjectIndex = stops.findIndex((stop) => stop.dataset.snapAnchor === "selected-works");
        const secondProjectTop = firstProjectIndex >= 0 && stops[firstProjectIndex + 1]
          ? stopTop(stops[firstProjectIndex + 1])
          : Infinity;

        if (firstProjectIndex >= 0 && y < secondProjectTop - threshold) {
          return profileIntroIndex;
        }

        for (let index = stops.length - 1; index >= 0; index -= 1) {
          if (stops[index].dataset.snapKind !== "project") continue;
          if (positions[index] < y - threshold) return index;
        }

        return profileIntroIndex;
      }

      if (profileIntroIndex >= 0 && y > positions[profileIntroIndex] + threshold) {
        return profileIntroIndex;
      }

      for (let index = positions.length - 1; index >= 0; index -= 1) {
        if (positions[index] < y - threshold) {
          if (index === 0 && profileIntroIndex >= 0 && y >= positions[profileIntroIndex] - threshold) {
            return profileIntroIndex;
          }

          return index;
        }
      }

      if (profileIntroIndex >= 0 && y >= positions[profileIntroIndex] - threshold) {
        return profileIntroIndex;
      }

      return profileIntroIndex >= 0 ? profileIntroIndex : 0;
    }

    function snapTo(index) {
      const target = stops[Math.max(0, Math.min(index, stops.length - 1))];
      if (!target) return;

      isSnapping = true;
      wheelTotal = 0;
      window.scrollTo({ top: stopTop(target), behavior: "smooth" });
      window.setTimeout(() => {
        window.scrollTo({ top: stopTop(target), behavior: "instant" });
        isSnapping = false;
      }, 850);
    }

    window.addEventListener("wheel", (event) => {
      if (window.innerWidth <= 720) return;

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

      const selectedEnd = pageTop(selectedWorks) + selectedWorks.offsetHeight;
      const inSnapRange = window.scrollY < selectedEnd - window.innerHeight * 0.25;
      const returningToSnapRange = direction < 0 && window.scrollY < selectedEnd + 120;
      const targetIndex = directionalStopIndex(direction);
      const targetTop = stopTop(stops[targetIndex]);
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

      snapTo(targetIndex);
    }, { passive: false });
  }

  function setupHeroClickToProfile() {
    const hero = document.querySelector("#profile");
    const target = document.querySelector("#profile-intro");
    if (!hero || !target) return;

    hero.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      window.scrollTo({ top: target.offsetTop, behavior: "smooth" });
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
    setupProjectReturn();
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
