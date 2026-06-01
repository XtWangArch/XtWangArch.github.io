(function () {
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
