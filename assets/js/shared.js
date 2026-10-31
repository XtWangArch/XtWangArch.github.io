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

  function updateDownloadLinks() {
    document.querySelectorAll("[data-download]").forEach((link) => {
      const pdf = data.pdfs[link.dataset.download];
      if (pdf) link.href = pdf;
    });
  }

  function updateEmailLinks() {
    document.querySelectorAll('a[href="mailto:xitao.wang@example.com"]').forEach((link) => {
      link.href = `mailto:${data.links.email}`;
      link.textContent = data.links.email;
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
  });
})();
