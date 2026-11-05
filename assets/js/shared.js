(function () {
  const escapeAttribute = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  window.portfolioMedia = {
    attributes(source, sizes = "100vw") {
      const image = window.portfolioImageManifest?.[source];
      if (!image) return `src="${escapeAttribute(source)}" decoding="async"`;

      const preferred = image.sources.find((item) => item.width >= 960) || image.sources.at(-1);
      const srcset = image.sources.map((item) => `${escapeAttribute(item.src)} ${item.width}w`).join(", ");
      return `src="${escapeAttribute(preferred.src)}" srcset="${srcset}" sizes="${escapeAttribute(sizes)}" width="${image.width}" height="${image.height}" decoding="async"`;
    }
  };

  window.portfolioUI = {
    reducedMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    headerHeight: () => document.querySelector(".site-header")?.getBoundingClientRect().height || 0
  };

  const header = document.querySelector(".site-header");
  if (header) {
    const measureHeader = () => {
      document.documentElement.style.setProperty("--header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    };
    measureHeader();
    new ResizeObserver(measureHeader).observe(header);
  }

  const data = window.portfolioData;
  if (!data) return;

  const escapeText = (value) => escapeAttribute(value ?? '').replace(/'/g, '&#39;');
  const richText = (value) => escapeText(value).replace(/&lt;(\/?)(strong|em|br)\s*\/?&gt;/gi, '<$1$2>');
  function recordLink(item, returnTo) {
    if (!item.url) return escapeText(item.title);
    const url = new URL(item.url, window.location.href);
    const external = url.origin !== window.location.origin;
    if (!external && returnTo && url.searchParams.has('activity')) url.searchParams.set('return', returnTo);
    return `<a href="${escapeAttribute(url.href)}"${external ? ' target="_blank" rel="noreferrer"' : ''}>${escapeText(item.title)}</a>`;
  }
  window.portfolioText = { escape: escapeText, rich: richText, recordLink };

  function renderCV() {
    document.querySelectorAll('[data-cv-list]').forEach((section) => {
      section.querySelectorAll('article').forEach(item => item.remove());
      section.insertAdjacentHTML('beforeend', (data[section.dataset.cvList] || []).map(item => `
        <article>
          <time>${escapeText(item.date || item.year || '')}</time>
          <h3>${recordLink(item, 'cv')}</h3>
          ${item.subtitle ? `<p>${escapeText(item.subtitle)}</p>` : ''}
          ${item.description ? `<p${section.dataset.cvList === 'experience' ? ' class="cv-work-summary"' : ''}>${richText(item.description)}</p>` : ''}
          ${item.details?.length ? `<ul class="cv-detail-list">${item.details.map(text => `<li>${richText(text)}</li>`).join('')}</ul>` : ''}
        </article>`).join(''));
    });
  }

  window.applyPortfolioPageContent = function () {
    const page = location.pathname.endsWith('cv.html') ? 'cv' : location.pathname.endsWith('project.html') ? 'project' : location.pathname.endsWith('photography.html') ? 'photography' : 'index';
    for (const [selector, patch] of Object.entries(window.portfolioPageContent?.[page] || {})) {
      let elements;
      try { elements = document.querySelectorAll(selector); } catch (_) { continue; }
      elements.forEach(element => {
        if (typeof patch.text === 'string') { element.textContent = patch.text; element.style.whiteSpace = 'pre-line'; }
        if (typeof patch.label === 'string' && element.matches('[data-section-link]')) {
          const content = element.querySelector('.nav-dock-content') || element;
          [...content.childNodes].filter(node=>node.nodeType===3).forEach(node=>node.remove());
          content.append(document.createTextNode(patch.label));
        }
        for (const key of ['src','alt','href','poster','content']) if (typeof patch[key] === 'string') {
          element.setAttribute(key, patch[key]);
          if (key === 'src' && element.tagName === 'IMG') {
            element.removeAttribute('srcset');
            if (element.closest('.profile-panel-media')) document.querySelectorAll('.portfolio-portrait img,.portfolio-portrait-flight').forEach(img => { img.src=patch.src; img.removeAttribute('srcset'); });
          }
        }
        if (typeof patch.desktop === 'string') element.dataset.desktopSrc = patch.desktop;
        if (typeof patch.mobile === 'string') element.dataset.mobileSrc = patch.mobile;
        if (element.tagName === 'VIDEO' && (patch.desktop !== undefined || patch.mobile !== undefined)) {
          const source = matchMedia('(max-width: 980px)').matches ? element.dataset.mobileSrc : element.dataset.desktopSrc;
          if (source && element.getAttribute('src') && element.getAttribute('src') !== source) {
            const wasPlaying = !element.paused;
            element.src = source;
            if (wasPlaying) element.play().catch(() => {});
          }
        }
      });
    }
  };

  function updateDownloadLinks() {
    document.querySelectorAll("[data-download]").forEach((link) => {
      const pdf = data.pdfs[link.dataset.download];
      if (pdf) link.href = pdf;
    });
  }

  function updateEmailLinks() {
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      const oldEmail = link.getAttribute('href').slice(7);
      link.href = `mailto:${data.links.email}`;
      if (oldEmail && link.textContent.includes(oldEmail)) link.textContent = link.textContent.replace(oldEmail, data.links.email);
    });
  }

  function updateSocialLinks() {
    document.querySelectorAll("[data-social]").forEach((link) => {
      const url = data.links[link.dataset.social];
      if (url) link.href = url;
    });
  }

  function updateReturnLinks() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("return");
    const allowedTargets = {
      "profile-intro": "index.html#profile-intro",
      contact: "index.html#contact"
    };

    document.querySelectorAll("[data-return-link]").forEach((link) => {
      link.href = allowedTargets[target] || "index.html#profile-intro";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateDownloadLinks();
    updateEmailLinks();
    updateSocialLinks();
    updateReturnLinks();
    renderCV();
    window.setTimeout(window.applyPortfolioPageContent, 0);
  });
  window.addEventListener('load', window.applyPortfolioPageContent);
})();
